<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config/database.php';
require_once 'config/billing_helpers.php';

/**
 * Token do webhook (ASAAS)
 * - Cole aqui o token gerado no painel Asaas (Webhook > Token de autenticação)
 * - Se deixar vazio, a validação fica desativada (apenas para teste)
 */
$expectedWebhookToken = 'COLE_SEU_TOKEN_AQUI';

if (!function_exists('mbg_webhook_log')) {
    function mbg_webhook_log(string $message, array $context = []): void
    {
        $dir = __DIR__ . '/logs';
        if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
        $line = '[' . date('Y-m-d H:i:s') . '] ' . $message;
        if (!empty($context)) {
            $json = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json !== false) $line .= ' ' . $json;
        }
        $line .= PHP_EOL;
        @file_put_contents($dir . '/webhook_asaas.log', $line, FILE_APPEND);
    }
}

if (!function_exists('mbg_webhook_get_header_token')) {
    function mbg_webhook_get_header_token(): string
    {
        $headers = [];
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $headers[strtolower(str_replace('_','-',substr($key,5)))] = $value;
                }
            }
        }
        foreach ($headers as $k => $v) {
            if (strtolower((string)$k) === 'asaas-access-token') return (string)$v;
        }
        return '';
    }
}

if (!function_exists('mbg_order_status_from_asaas_event')) {
    function mbg_order_status_from_asaas_event(string $eventType): string
    {
        switch ($eventType) {
            case 'PAYMENT_OVERDUE': return 'overdue';
            case 'PAYMENT_DELETED': return 'cancelled';
            case 'PAYMENT_REFUNDED': return 'refunded';
            default: return 'pending';
        }
    }
}

try {
    if ($expectedWebhookToken !== '' && $expectedWebhookToken !== 'COLE_SEU_TOKEN_AQUI') {
        $receivedToken = mbg_webhook_get_header_token();
        if ($receivedToken === '' || !hash_equals($expectedWebhookToken, $receivedToken)) {
            mbg_webhook_log('Token inválido', ['received' => $receivedToken !== '' ? '[PRESENTE]' : '[AUSENTE]']);
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Token do webhook inválido']);
            exit;
        }
    }

    $raw = file_get_contents('php://input');
    $event = json_decode((string)$raw, true);
    if (!is_array($event) || empty($event['event'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payload inválido']);
        exit;
    }

    $eventType = (string)$event['event'];
    $payment = is_array($event['payment'] ?? null) ? $event['payment'] : [];
    $orderId = isset($payment['externalReference']) ? (int)$payment['externalReference'] : 0;
    $asaasPaymentId = (string)($payment['id'] ?? '');
    $paymentStatus = strtoupper((string)($payment['status'] ?? ''));

    mbg_webhook_log('Webhook recebido', [
        'event' => $eventType,
        'order_id' => $orderId,
        'asaas_payment_id' => $asaasPaymentId,
        'asaas_status' => $paymentStatus
    ]);

    if ($orderId <= 0) {
        echo json_encode(['success' => true, 'message' => 'Sem externalReference']);
        exit;
    }

    $payEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_UPDATED'];
    $suspendEvents = ['PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED'];
    $restoreEvents = ['PAYMENT_RESTORED'];

    $pdo->beginTransaction();

    $st = $pdo->prepare("SELECT * FROM orders WHERE id = ? FOR UPDATE");
    $st->execute([$orderId]);
    $order = $st->fetch(PDO::FETCH_ASSOC);
    if (!$order) throw new Exception('Pedido não encontrado.');

    $storeId = (int)($order['store_id'] ?? 0);
    if ($storeId <= 0) throw new Exception('Pedido sem store_id.');

    $sub = mbg_get_active_subscription($pdo, $storeId);
    $subId = $sub ? (int)$sub['id'] : null;

    $chgStmt = $pdo->prepare("SELECT * FROM subscription_changes WHERE order_id=? AND status='scheduled' ORDER BY id DESC LIMIT 1");
    $chgStmt->execute([$orderId]);
    $change = $chgStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    if (in_array($eventType, $payEvents, true)) {
        $paidLike = in_array($paymentStatus, ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'], true)
            || in_array($eventType, ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'], true);

        if ($paidLike) {
            if (strtolower((string)($order['status'] ?? '')) !== 'paid') {
                $pdo->prepare("UPDATE orders SET status='paid', asaas_payment_id=COALESCE(NULLIF(asaas_payment_id,''), ?), payment_external_id=COALESCE(NULLIF(payment_external_id,''), ?), updated_at=NOW() WHERE id=?")
                    ->execute([$asaasPaymentId, $asaasPaymentId, $orderId]);
            }

            $targetPlanId = $change ? (int)($change['to_plan_id'] ?? 0) : 0;
            if ($targetPlanId > 0) {
                $storePlanId = $targetPlanId;
                $pdo->prepare("UPDATE stores SET plan_id=?, active=1, suspended=0, suspension_reason=NULL, updated_at=NOW() WHERE id=?")
                    ->execute([$storePlanId, $storeId]);
            } else {
                $stStore = $pdo->prepare("SELECT plan_id FROM stores WHERE id=?");
                $stStore->execute([$storeId]);
                $storePlanId = (int)($stStore->fetchColumn() ?: 1);
                $pdo->prepare("UPDATE stores SET active=1, suspended=0, suspension_reason=NULL, updated_at=NOW() WHERE id=?")
                    ->execute([$storeId]);
            }

            $plan = mbg_get_plan_by_id($pdo, $storePlanId);
            $planPrice = 0.0;
            if (is_array($plan)) {
                if (isset($plan['price'])) $planPrice = (float)$plan['price'];
                elseif (isset($plan['price_monthly'])) $planPrice = (float)$plan['price_monthly'];
            }
            $orderTotal = isset($order['total_amount']) ? (float)$order['total_amount'] : 0.0;
            $amount = $planPrice > 0 ? $planPrice : $orderTotal;

            $cycle = (string)($sub['billing_cycle'] ?? 'monthly');
            if ($cycle === '') $cycle = 'monthly';

            $startedAtObj = new DateTimeImmutable('now');
            $startedAt = $startedAtObj->format('Y-m-d H:i:s');
            $endsAt = $startedAtObj->modify(mbg_subscription_cycle_interval($cycle))->format('Y-m-d H:i:s');

            if ($sub) {
                $pdo->prepare("UPDATE store_subscriptions SET plan_id=?, status='active', payment_status='paid', amount=?, payment_external_id=?, started_at=?, ends_at=?, payment_method='pix', updated_at=NOW() WHERE id=?")
                    ->execute([$storePlanId, $amount, $asaasPaymentId ?: ((string)($order['payment_external_id'] ?? '')), $startedAt, $endsAt, (int)$sub['id']]);
                $subId = (int)$sub['id'];
            } else {
                try {
                    $subId = mbg_upsert_subscription($pdo, $storeId, $storePlanId, 'active', 'paid', $amount, $cycle, $asaasPaymentId, (string)($order['pix_qr_code'] ?? ''), (string)($order['pix_copy_paste'] ?? ''));
                } catch (Throwable $helperEx) {
                    $subId = null;
                    mbg_webhook_log('mbg_upsert_subscription falhou, usando fallback', ['error' => $helperEx->getMessage()]);
                }

                if (empty($subId)) {
                    $insSub = $pdo->prepare("INSERT INTO store_subscriptions (store_id, plan_id, started_at, ends_at, status, payment_status, amount, created_at, billing_cycle, payment_external_id, pix_qrcode, pix_copy_paste, payment_method, updated_at) VALUES (?, ?, ?, ?, 'active', 'paid', ?, NOW(), ?, ?, ?, ?, 'pix', NOW())");
                    $insSub->execute([$storeId, $storePlanId, $startedAt, $endsAt, $amount, $cycle, $asaasPaymentId ?: ((string)($order['payment_external_id'] ?? '')), (string)($order['pix_qr_code'] ?? ''), (string)($order['pix_copy_paste'] ?? '')]);
                    $subId = (int)$pdo->lastInsertId();
                } else {
                    $pdo->prepare("UPDATE store_subscriptions SET started_at=?, ends_at=?, payment_method='pix', updated_at=NOW() WHERE id=?")
                        ->execute([$startedAt, $endsAt, $subId]);
                }
            }

            if ($change) {
                $pdo->prepare("UPDATE subscription_changes SET status='applied', updated_at=NOW() WHERE id=?")->execute([(int)$change['id']]);
                $evtType = strtolower((string)($change['change_type'] ?? '')) === 'downgrade' ? 'downgrade_applied' : 'upgrade_applied';
                mbg_log_subscription_event($pdo, $storeId, $subId, $evtType, $orderId, 'Alteração de plano aplicada após pagamento', ['change_id' => (int)$change['id']]);
            }

            mbg_log_subscription_event($pdo, $storeId, $subId, 'invoice_paid', $orderId, 'Fatura de assinatura paga', ['asaas_event' => $eventType, 'asaas_payment_status' => $paymentStatus]);
            if (mbg_platform_has_table($pdo, 'platform_affiliate_sales') && mbg_platform_has_column($pdo, 'orders', 'platform_affiliate_id')) {
                $saleStmt = $pdo->prepare("SELECT * FROM platform_affiliate_sales WHERE order_id=? ORDER BY id DESC LIMIT 1");
                $saleStmt->execute([$orderId]);
                $sale = $saleStmt->fetch(PDO::FETCH_ASSOC) ?: null;
                if ($sale) {
                    $pdo->prepare("UPDATE platform_affiliate_sales SET affiliate_status='PAID', payment_received_at=NOW(), updated_at=NOW(), subscription_id=COALESCE(subscription_id, ?) WHERE id=?")
                        ->execute([(int)$subId, (int)$sale['id']]);
                    $targets = mbg_platform_collect_sale_targets($pdo, $sale);
                    $teamName = !empty($sale['team_id']) ? ('Equipe #' . (int)$sale['team_id']) : 'Equipe';
                    $saleAmount = (float)($sale['sale_amount'] ?? $amount);
                    $title = 'Venda confirmada';
                    $message = $teamName . ' confirmou uma venda do plano ' . ($plan['display_name'] ?? $plan['slug'] ?? 'Plano') . ' no valor de R$ ' . number_format($saleAmount, 2, ',', '.');
                    mbg_platform_create_dispatch($pdo, $title, $message, '/equipe/', 'AFFILIATE_SALE_APPROVED', 'platform_affiliate_sales', (int)$sale['id'], $targets, ['store_id'=>$storeId,'order_id'=>$orderId,'sale_amount'=>$saleAmount]);
                }
            }
            mbg_log_subscription_event($pdo, $storeId, $subId, 'activated', $orderId, 'Loja ativa e assinatura regularizada', ['ends_at' => $endsAt]);
        }
    }

    if (in_array($eventType, $suspendEvents, true)) {
        $newOrderStatus = mbg_order_status_from_asaas_event($eventType);
        $pdo->prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=? AND LOWER(COALESCE(status,'')) <> 'paid'")->execute([$newOrderStatus, $orderId]);
        $pdo->prepare("UPDATE stores SET active=0, suspended=1, suspension_reason='Assinatura em aberto', updated_at=NOW() WHERE id=?")->execute([$storeId]);

        if ($subId) {
            $newSubStatus = ($eventType === 'PAYMENT_REFUNDED') ? 'cancelled' : 'expired';
            $newPayStatus = ($eventType === 'PAYMENT_REFUNDED') ? 'refunded' : 'failed';
            $pdo->prepare("UPDATE store_subscriptions SET status=?, payment_status=?, updated_at=NOW() WHERE id=?")->execute([$newSubStatus, $newPayStatus, $subId]);
            mbg_log_subscription_event($pdo, $storeId, $subId, 'suspended', $orderId, 'Loja suspensa por atraso/cancelamento/estorno de cobrança', ['asaas_event' => $eventType]);
        }
    }

    if (in_array($eventType, $restoreEvents, true)) {
        $pdo->prepare("UPDATE orders SET status='pending', updated_at=NOW() WHERE id=? AND LOWER(COALESCE(status,'')) <> 'paid'")->execute([$orderId]);
        if ($subId) {
            mbg_log_subscription_event($pdo, $storeId, $subId, 'invoice_restored', $orderId, 'Cobrança restaurada no gateway', ['asaas_event' => $eventType]);
        }
    }

    $pdo->commit();
    http_response_code(200);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    if (function_exists('mbg_webhook_log')) mbg_webhook_log('Erro no webhook', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
