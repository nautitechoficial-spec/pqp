<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(200); exit; }

require_once 'config/database.php';
require_once 'config/billing_helpers.php';

$asaas_api_key = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmYTkyOTdjLTY4YjctNGM2Yi1iYjBjLTIzM2FiYzMyYWM1Njo6JGFhY2hfNDM2M2M3MzYtN2UwNC00MjljLWFlZGUtZGJiNTMyYTk4ZDky';
$asaas_url = 'https://api.asaas.com/v3';

function asaasRequest($method, $endpoint, $apiKey, $body = null) {
    global $asaas_url;
    $ch = curl_init($asaas_url . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "access_token: $apiKey",
            "User-Agent: MinhaBagg/1.0"
        ],
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $httpCode, 'data' => json_decode($response)];
}

try {
    $data = json_decode(file_get_contents("php://input"), true) ?: [];
    $store_id = (int)($data['store_id'] ?? 0);
    $target_plan_id = (int)($data['plan_id'] ?? 0);
    $billing_cycle = strtolower(trim((string)($data['billing_cycle'] ?? 'monthly')));
    if (!in_array($billing_cycle, ['monthly','quarterly','yearly','annual'], true)) $billing_cycle = 'monthly';
    if (!$store_id || !$target_plan_id) {
        mbg_send_json(['success' => false, 'error' => 'store_id e plan_id são obrigatórios'], 400);
    }

    $pdo->beginTransaction();
    mbg_apply_subscription_maintenance($pdo, $store_id);

    $st = $pdo->prepare("SELECT id, name, plan_id, active, COALESCE(suspended,0) AS suspended FROM stores WHERE id=? FOR UPDATE");
    $st->execute([$store_id]);
    $store = $st->fetch(PDO::FETCH_ASSOC);
    if (!$store) throw new Exception('Loja não encontrada.');

    $current_plan_id = (int)($store['plan_id'] ?? 0);
    if ($current_plan_id === $target_plan_id) {
        $pdo->commit();
        mbg_send_json(['success'=>true,'message'=>'A loja já está neste plano.']);
    }

    $currentPlan = mbg_get_plan_by_id($pdo, $current_plan_id);
    $targetPlan = mbg_get_plan_by_id($pdo, $target_plan_id);
    if (!$targetPlan) throw new Exception('Plano de destino inválido.');

    $currentPrice = (float)($currentPlan['price'] ?? 0);
    $targetPrice = (float)($targetPlan['price'] ?? 0);
    $isUpgrade = $targetPrice > $currentPrice;
    $changeType = $isUpgrade ? 'upgrade' : 'downgrade';

    // cancela/aglutina mudanças agendadas anteriores
    try {
        $pdo->prepare("UPDATE subscription_changes SET status='canceled', updated_at=NOW() WHERE store_id=? AND status='scheduled'")->execute([$store_id]);
    } catch (Throwable $e) {}

    $sub = mbg_get_active_subscription($pdo, $store_id);
    $subscriptionId = $sub ? (int)$sub['id'] : mbg_upsert_subscription($pdo, $store_id, $current_plan_id ?: $target_plan_id, 'trial', 'pending', $currentPrice, $billing_cycle);
    $admin = mbg_get_store_admin($pdo, $store_id);
    if (!$admin) throw new Exception('Administrador da loja não encontrado.');

    if (!$isUpgrade) {
        // Downgrade profissional: agenda para o fim do ciclo vigente (ou imediato se sem assinatura ativa)
        $effectiveAt = !empty($sub['ends_at']) ? $sub['ends_at'] : date('Y-m-d H:i:s');
        $ins = $pdo->prepare("INSERT INTO subscription_changes (store_id, from_plan_id, to_plan_id, change_type, effective_at, status, reason, created_at, updated_at) VALUES (?, ?, ?, 'downgrade', ?, 'scheduled', ?, NOW(), NOW())");
        $ins->execute([$store_id, $current_plan_id, $target_plan_id, $effectiveAt, 'Downgrade agendado pelo painel']);
        $changeId = (int)$pdo->lastInsertId();
        mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'downgrade_scheduled', null, 'Downgrade agendado para o fim do ciclo', [
            'change_id' => $changeId,
            'from_plan_id' => $current_plan_id,
            'to_plan_id' => $target_plan_id,
            'effective_at' => $effectiveAt,
        ]);
        $pdo->commit();
        mbg_send_json([
            'success' => true,
            'scheduled' => true,
            'change_type' => 'downgrade',
            'effective_at' => $effectiveAt,
            'message' => 'Downgrade agendado para o próximo ciclo. Até lá seu plano atual continua ativo.'
        ]);
    }

    // Upgrade: cobra via PIX e aplica ao confirmar pagamento
    $existingPending = mbg_get_pending_upgrade_order($pdo, $store_id);
    if ($existingPending) {
        // vincular/atualizar mudança para este pedido
        $pdo->prepare("INSERT INTO subscription_changes (store_id, from_plan_id, to_plan_id, change_type, effective_at, status, order_id, reason, created_at, updated_at) VALUES (?, ?, ?, 'upgrade', NOW(), 'scheduled', ?, ?, NOW(), NOW())")
            ->execute([$store_id, $current_plan_id, $target_plan_id, (int)$existingPending['id'], 'Upgrade aguardando pagamento (reuso de fatura pendente)']);
        mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'upgrade_scheduled', (int)$existingPending['id'], 'Upgrade vinculado à fatura pendente existente', [
            'to_plan_id' => $target_plan_id
        ]);
        $pdo->commit();
        mbg_send_json(['success'=>true,'order_id'=>(int)$existingPending['id'],'message'=>'Fatura pendente reaproveitada para upgrade.']);
    }

    $amountToCharge = max(0, $targetPrice); // sem pró-rata por enquanto, mas consistente
    $orderIns = $pdo->prepare("INSERT INTO orders (store_id, customer_id, total_amount, status, payment_method, payment_provider, tipo, created_at, updated_at) VALUES (?, ?, ?, 'pending', 'PIX', 'ASAAS', 'sub', NOW(), NOW())");
    $orderIns->execute([$store_id, (int)$admin['id'], $amountToCharge]);
    $orderId = (int)$pdo->lastInsertId();

    $cpf = preg_replace('/\D/', '', (string)($admin['cpf'] ?? ''));
    $phone = preg_replace('/\D/', '', (string)($admin['phone'] ?? $admin['whatsapp'] ?? ''));

    $custRes = asaasRequest('POST', '/customers', $asaas_api_key, [
        'name' => (string)($admin['name'] ?? 'Cliente MinhaBagg'),
        'email' => (string)($admin['email'] ?? ''),
        'cpfCnpj' => $cpf,
        'mobilePhone' => $phone,
        'notificationDisabled' => true
    ]);
    $asaasCustId = $custRes['data']->id ?? null;
    if (!$asaasCustId && !empty($admin['email'])) {
        $search = asaasRequest('GET', '/customers?email=' . urlencode((string)$admin['email']), $asaas_api_key);
        $asaasCustId = $search['data']->data[0]->id ?? null;
    }
    if (!$asaasCustId) throw new Exception('Erro ao sincronizar cliente no Asaas.');

    $payRes = asaasRequest('POST', '/payments', $asaas_api_key, [
        'customer' => $asaasCustId,
        'billingType' => 'PIX',
        'value' => $amountToCharge,
        'dueDate' => date('Y-m-d'),
        'description' => 'Upgrade de plano MinhaBagg - ' . ($targetPlan['display_name'] ?? ('Plano #' . $target_plan_id)),
        'externalReference' => (string)$orderId,
    ]);
    if (!in_array((int)$payRes['status'], [200, 201], true)) {
        $msg = $payRes['data']->errors[0]->description ?? 'Erro desconhecido no Asaas';
        throw new Exception('Erro Asaas: ' . $msg);
    }
    $asaasPayId = (string)($payRes['data']->id ?? '');
    $qrRes = asaasRequest('GET', "/payments/{$asaasPayId}/pixQrCode", $asaas_api_key);
    $img = (string)($qrRes['data']->encodedImage ?? '');
    $payload = (string)($qrRes['data']->payload ?? '');

    $pdo->prepare("UPDATE orders SET asaas_payment_id=?, payment_external_id=?, pix_payload=?, pix_qr_code=?, pix_copy_paste=?, updated_at=NOW() WHERE id=?")
        ->execute([$asaasPayId, $asaasPayId, $payload, $img, $payload, $orderId]);

    $pdo->prepare("INSERT INTO subscription_changes (store_id, from_plan_id, to_plan_id, change_type, effective_at, status, order_id, reason, created_at, updated_at) VALUES (?, ?, ?, 'upgrade', NOW(), 'scheduled', ?, ?, NOW(), NOW())")
        ->execute([$store_id, $current_plan_id, $target_plan_id, $orderId, 'Upgrade aguardando pagamento PIX']);

    $pdo->prepare("UPDATE store_subscriptions SET payment_status='pending', updated_at=NOW() WHERE id=?")->execute([$subscriptionId]);
    mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'invoice_created', $orderId, 'Fatura de upgrade criada', [
        'from_plan_id' => $current_plan_id,
        'to_plan_id' => $target_plan_id,
        'amount' => $amountToCharge,
        'asaas_payment_id' => $asaasPayId
    ]);
    mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'upgrade_scheduled', $orderId, 'Upgrade agendado aguardando pagamento', [
        'to_plan_id' => $target_plan_id,
        'order_id' => $orderId
    ]);

    $pdo->commit();
    mbg_send_json([
        'success' => true,
        'order_id' => $orderId,
        'change_type' => 'upgrade',
        'message' => 'Upgrade iniciado. Pague o PIX para ativar o novo plano.',
        'pending_order' => [
            'id' => $orderId,
            'pix_qr_code' => $img,
            'pix_copy_paste' => $payload,
            'total' => $amountToCharge,
            'plan_name' => $targetPlan['display_name'] ?? null
        ]
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    mbg_send_json(['success' => false, 'error' => $e->getMessage()], 400);
}
