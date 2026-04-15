<?php
/**
 * Endpoint para Registro de Nova Loja e Administrador com Integração ASAAS
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit;
}

require_once 'config/database.php';
require_once 'config/billing_helpers.php';
require_once 'config/platform_affiliate_helpers.php';

$asaas_api_key = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmYTkyOTdjLTY4YjctNGM2Yi1iYjBjLTIzM2FiYzMyYWM1Njo6JGFhY2hfNDM2M2M3MzYtN2UwNC00MjljLWFlZGUtZGJiNTMyYTk4ZDky';
$asaas_url = 'https://api.asaas.com/v3';


function mbg_has_table(PDO $pdo, string $table): bool {
    try {
        $st = $pdo->prepare("SHOW TABLES LIKE ?");
        $st->execute([$table]);
        return (bool)$st->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
}

function mbg_has_procedure(PDO $pdo, string $procedure): bool {
    try {
        $st = $pdo->prepare("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME = ? LIMIT 1");
        $st->execute([$procedure]);
        return (bool)$st->fetchColumn();
    } catch (Throwable $e) {
        return false;
    }
}

function mbg_apply_store_template_preset(PDO $pdo, int $storeId): array {
    $result = [
        'attempted' => false,
        'applied' => false,
        'procedure' => null,
        'warning' => null,
    ];

    try {
        $procedure = null;
        foreach (['sp_mbg_apply_store_preset_to_store', 'ensure_store_template_clone'] as $candidate) {
            if (mbg_has_procedure($pdo, $candidate)) {
                $procedure = $candidate;
                break;
            }
        }

        if (!$procedure) {
            $result['warning'] = 'Nenhuma procedure de preset encontrada no banco.';
            return $result;
        }

        $result['attempted'] = true;
        $result['procedure'] = $procedure;
        $pdo->prepare("CALL {$procedure}(?)")->execute([$storeId]);
        $result['applied'] = true;
        return $result;
    } catch (Throwable $e) {
        $result['warning'] = $e->getMessage();
        return $result;
    }
}

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
    if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $httpCode, 'data' => json_decode((string)$response)];
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !is_array($data)) {
        throw new Exception("Dados não fornecidos.");
    }

    $requiredFields = ['storeName', 'subdomain', 'segment', 'salesScope', 'hasOnlineStore', 'email', 'phone', 'cpf', 'password', 'adminName', 'cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            throw new Exception("O campo {$field} é obrigatório.");
        }
    }

    $data['subdomain'] = strtolower(trim(preg_replace('/[^a-z0-9-]/', '-', preg_replace('/\s+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string)($data['subdomain'] ?? ''))))));
    $data['subdomain'] = preg_replace('/-+/', '-', trim((string)$data['subdomain'], '-'));
    if ($data['subdomain'] === '' || strlen($data['subdomain']) < 3) {
        throw new Exception('Subdomínio inválido.');
    }

    $affiliateSlug = strtolower(trim((string)($data['platform_affiliate_slug'] ?? '')));
    $affiliateId = (int)($data['platform_affiliate_id'] ?? 0);
    $affiliateManagerId = (int)($data['platform_affiliate_manager_id'] ?? 0);
    $affiliateTeamId = (int)($data['platform_affiliate_team_id'] ?? 0);
    $affiliateClickId = (int)($data['platform_affiliate_click_id'] ?? 0);
    $affiliate = null;
    if ($affiliateSlug !== '') {
        $affiliate = mbg_platform_find_affiliate_by_slug($pdo, $affiliateSlug);
        if ($affiliate) {
            $affiliateId = (int)($affiliate['id'] ?? $affiliateId);
            $affiliateManagerId = (int)($affiliate['manager_id'] ?? $affiliateManagerId);
            $affiliateTeamId = (int)($affiliate['team_id'] ?? $affiliateTeamId);
            $affiliateSlug = (string)($affiliate['slug'] ?? $affiliateSlug);
        }
    }

    $plan_id = (int)($data['plan_id'] ?? 1);
    $plan = mbg_get_plan_by_id($pdo, $plan_id);
    if (!$plan) throw new Exception("Plano inválido.");
    $totalAmount = (float)($plan['price'] ?? 0);
    $planName = $plan['display_name'] ?? ($plan['name'] ?? 'Plano');

    $themeInput = strtolower(trim((string)($data['theme'] ?? 'orange')));
    $allowedThemes = ['orange', 'black', 'blue', 'pink'];
    if (!in_array($themeInput, $allowedThemes, true)) {
        $themeInput = 'orange';
    }
    $templateMap = [
        'orange' => 'orange_default',
        'black' => 'black_default',
        'blue' => 'blue_default',
        'pink' => 'pink_default',
    ];
    $defaultTemplateCode = $templateMap[$themeInput] ?? 'orange_default';

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT id FROM stores WHERE LOWER(subdomain) = LOWER(?) LIMIT 1");
    $stmt->execute([$data['subdomain']]);
    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("Este subdomínio já está em uso.");
    }

    $stmt = $pdo->prepare("SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("Este e-mail já está cadastrado.");
    }

    $storeColumns = [
        'name', 'subdomain', 'segment', 'perfil_objetivo', 'perfil_expansao',
        'owner_name', 'owner_email', 'owner_phone', 'plan_id', 'active'
    ];
    $storeValues = [
        $data['storeName'],
        $data['subdomain'],
        $data['segment'] ?? '',
        $data['salesScope'] ?? '',
        $data['hasOnlineStore'] ?? '',
        $data['adminName'],
        $data['email'],
        $data['phone'] ?? '',
        $plan_id,
        $totalAmount <= 0 ? 1 : 0,
    ];

    if (mbg_has_column($pdo, 'stores', 'default_template_code')) {
        $storeColumns[] = 'default_template_code';
        $storeValues[] = $defaultTemplateCode;
    }
    if (mbg_has_column($pdo, 'stores', 'theme_key')) {
        $storeColumns[] = 'theme_key';
        $storeValues[] = $themeInput;
    }
    if (mbg_has_column($pdo, 'stores', 'personalization_initialized')) {
        $storeColumns[] = 'personalization_initialized';
        $storeValues[] = 0;
    }
    if (mbg_has_column($pdo, 'stores', 'preset_applied_at')) {
        $storeColumns[] = 'preset_applied_at';
        $storeValues[] = null;
    }
    if (mbg_has_column($pdo, 'stores', 'created_at')) $storeColumns[] = 'created_at';
    if (mbg_has_column($pdo, 'stores', 'updated_at')) $storeColumns[] = 'updated_at';

    $placeholders = [];
    $execValues = [];
    foreach ($storeColumns as $index => $column) {
        if (in_array($column, ['created_at', 'updated_at'], true)) {
            $placeholders[] = 'NOW()';
        } else {
            $placeholders[] = '?';
            $execValues[] = $storeValues[count($execValues)];
        }
    }

    $stmt = $pdo->prepare("INSERT INTO stores (" . implode(', ', $storeColumns) . ") VALUES (" . implode(', ', $placeholders) . ")");
    $stmt->execute($execValues);
    $store_id = (int)$pdo->lastInsertId();

    if ($affiliateId > 0) {
        $sets = [];
        $vals = [];
        foreach ([
            'platform_affiliate_id' => $affiliateId,
            'platform_affiliate_slug' => $affiliateSlug,
            'platform_affiliate_manager_id' => $affiliateManagerId,
            'platform_affiliate_team_id' => $affiliateTeamId,
            'platform_affiliate_click_id' => ($affiliateClickId > 0 ? $affiliateClickId : null),
            'platform_affiliate_bound_at' => date('Y-m-d H:i:s'),
        ] as $col => $val) {
            if (mbg_platform_has_column($pdo, 'stores', $col)) {
                $sets[] = "{$col}=?";
                $vals[] = $val;
            }
        }
        if ($sets) {
            $vals[] = $store_id;
            $pdo->prepare('UPDATE stores SET ' . implode(', ', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
        }
    }

    // Defaults for the first storefront experience, only when the schema supports it.
    foreach ([
        'logo_display_mode' => 'text',
        'brand_display_mode' => 'text',
        'header_logo_mode' => 'text',
        'navbar_style' => 'square',
        'header_style' => 'square',
        'nav_style' => 'square',
        'theme_style' => 'square',
    ] as $column => $value) {
        if (mbg_has_column($pdo, 'stores', $column)) {
            $pdo->prepare("UPDATE stores SET {$column} = ? WHERE id = ?")->execute([$value, $store_id]);
        }
    }

    $password_hash = password_hash((string)$data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO customers (store_id, name, email, phone, whatsapp, cpf, password, isAdmin, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active', NOW(), NOW())");
    $stmt->execute([
        $store_id,
        $data['adminName'],
        $data['email'],
        $data['phone'] ?? '',
        $data['phone'] ?? '',
        $data['cpf'] ?? '',
        $password_hash
    ]);
    $customer_id = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare("INSERT INTO customer_addresses (customer_id, street, number, complement, neighborhood, city, state, cep, description, is_main, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PADRAO', 1, NOW(), NOW())");
    $stmt->execute([
        $customer_id,
        $data['street'],
        $data['number'],
        $data['complement'] ?? '',
        $data['neighborhood'],
        $data['city'],
        strtoupper((string)$data['state']),
        preg_replace('/\D/', '', (string)$data['cep'])
    ]);

    $orderStatus = $totalAmount > 0 ? 'pending' : 'paid';
    $stmt = $pdo->prepare("INSERT INTO orders (store_id, customer_id, total_amount, status, payment_method, payment_provider, tipo, created_at, updated_at) VALUES (?, ?, ?, ?, 'PIX', 'ASAAS', 'sub', NOW(), NOW())");
    $stmt->execute([$store_id, $customer_id, $totalAmount, $orderStatus]);
    $order_id = (int)$pdo->lastInsertId();
    if ($affiliateId > 0) {
        $sets = [];
        $vals = [];
        foreach ([
            'platform_affiliate_id' => $affiliateId,
            'platform_affiliate_slug' => $affiliateSlug,
            'platform_affiliate_manager_id' => $affiliateManagerId,
            'platform_affiliate_team_id' => $affiliateTeamId,
            'platform_affiliate_click_id' => ($affiliateClickId > 0 ? $affiliateClickId : null),
            'affiliate_slug' => $affiliateSlug,
        ] as $col => $val) {
            if (mbg_platform_has_column($pdo, 'orders', $col)) {
                $sets[] = "{$col}=?";
                $vals[] = $val;
            }
        }
        if ($sets) {
            $vals[] = $order_id;
            $pdo->prepare('UPDATE orders SET ' . implode(', ', $sets) . ', updated_at=NOW() WHERE id=?')->execute($vals);
        }
    }

    $img = '';
    $payload = '';
    $asaasPayId = '';

    if ($totalAmount > 0) {
        $cpf = preg_replace('/\D/', '', (string)$data['cpf']);
        $phone = preg_replace('/\D/', '', (string)$data['phone']);
        $cep = preg_replace('/\D/', '', (string)$data['cep']);

        $custRes = asaasRequest('POST', '/customers', $asaas_api_key, [
            'name' => $data['adminName'],
            'email' => $data['email'],
            'cpfCnpj' => $cpf,
            'mobilePhone' => $phone,
            'postalCode' => $cep,
            'notificationDisabled' => true
        ]);
        $asaasCustId = $custRes['data']->id ?? null;
        if (!$asaasCustId) {
            $search = asaasRequest('GET', '/customers?email=' . urlencode((string)$data['email']), $asaas_api_key);
            $asaasCustId = $search['data']->data[0]->id ?? null;
        }
        if (!$asaasCustId) throw new Exception('Erro ao sincronizar com Gateway de Pagamento.');

        $payRes = asaasRequest('POST', '/payments', $asaas_api_key, [
            'customer' => $asaasCustId,
            'billingType' => 'PIX',
            'value' => $totalAmount,
            'dueDate' => date('Y-m-d'),
            'description' => "Assinatura MinhaBagg - Pedido #{$order_id}",
            'externalReference' => (string)$order_id
        ]);
        if (!in_array((int)$payRes['status'], [200, 201], true)) {
            $msg = $payRes['data']->errors[0]->description ?? 'Erro desconhecido no Asaas';
            throw new Exception('Erro Asaas: ' . $msg);
        }

        $asaasPayId = (string)($payRes['data']->id ?? '');
        $qrRes = asaasRequest('GET', "/payments/{$asaasPayId}/pixQrCode", $asaas_api_key);
        $img = (string)($qrRes['data']->encodedImage ?? '');
        $payload = (string)($qrRes['data']->payload ?? '');

        $stmt = $pdo->prepare("UPDATE orders SET asaas_payment_id = ?, pix_payload = ?, pix_qr_code = ?, pix_copy_paste = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$asaasPayId, $payload, $img, $payload, $order_id]);

        $subscriptionId = mbg_upsert_subscription($pdo, $store_id, $plan_id, 'trial', 'pending', $totalAmount, 'monthly', $asaasPayId, $img, $payload);
        if ($affiliateId > 0) {
            $subSets = [];
            $subVals = [];
            foreach (['platform_affiliate_id' => $affiliateId, 'platform_affiliate_slug' => $affiliateSlug] as $col => $val) {
                if (mbg_platform_has_column($pdo, 'store_subscriptions', $col)) {
                    $subSets[] = "{$col}=?";
                    $subVals[] = $val;
                }
            }
            if ($subSets) {
                $subVals[] = $subscriptionId;
                $pdo->prepare('UPDATE store_subscriptions SET ' . implode(', ', $subSets) . ', updated_at=NOW() WHERE id=?')->execute($subVals);
            }
            if (mbg_platform_has_table($pdo, 'platform_affiliate_sales')) {
                $code = 'SALE-' . date('YmdHis') . '-' . $order_id;
                $releaseDate = date('Y-m-d', strtotime('+30 days'));
                $stmtSale = $pdo->prepare("INSERT INTO platform_affiliate_sales (code, affiliate_id, affiliate_slug, manager_id, team_id, store_id, plan_id, subscription_id, sale_amount, sale_date, release_date, cycle, affiliate_rate, manager_rate, affiliate_commission_amount, manager_commission_amount, affiliate_status, manager_status, order_id, origin_click_id, payment_generated_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,1,70.00,10.00,ROUND(? * 0.70, 2),ROUND(? * 0.10, 2),'REGISTERED','AVAILABLE',?,?,NOW(),NOW(),NOW())");
                $stmtSale->execute([$code, $affiliateId, $affiliateSlug, $affiliateManagerId, $affiliateTeamId, $store_id, $plan_id, $subscriptionId, $totalAmount, $releaseDate, $totalAmount, $totalAmount, $order_id, ($affiliateClickId > 0 ? $affiliateClickId : null)]);
                $saleId = (int)$pdo->lastInsertId();
                if ($affiliateClickId > 0 && mbg_platform_has_table($pdo, 'platform_affiliate_clicks') && mbg_platform_has_column($pdo, 'platform_affiliate_clicks', 'converted_sale_id')) {
                    $pdo->prepare('UPDATE platform_affiliate_clicks SET converted_sale_id=?, updated_at=NOW() WHERE id=?')->execute([$saleId, $affiliateClickId]);
                }
                $targets = mbg_platform_collect_sale_targets($pdo, ['affiliate_id' => $affiliateId, 'manager_id' => $affiliateManagerId, 'team_id' => $affiliateTeamId]);
                mbg_platform_create_dispatch($pdo, 'Pagamento gerado', (($affiliate['name'] ?? $affiliateSlug) . ' trouxe um novo possível cliente. Plano ' . $planName . ' - R$ ' . number_format($totalAmount, 2, ',', '.')), '/equipe/', 'AFFILIATE_SALE_CREATED', 'platform_affiliate_sales', $saleId, $targets, ['store_id' => $store_id, 'order_id' => $order_id, 'plan_name' => $planName, 'sale_amount' => $totalAmount, 'affiliate_slug' => $affiliateSlug]);
            }
        }
        mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'invoice_created', $order_id, 'Assinatura criada aguardando pagamento', [
            'plan_id' => $plan_id,
            'plan_name' => $planName,
            'amount' => $totalAmount,
            'source' => 'register'
        ]);
    } else {
        $pdo->prepare("UPDATE stores SET active=1, suspended=0, suspension_reason=NULL, updated_at=NOW() WHERE id=?")->execute([$store_id]);
        $subscriptionId = mbg_upsert_subscription($pdo, $store_id, $plan_id, 'active', 'paid', 0.0, 'monthly', null, null, null);
        mbg_log_subscription_event($pdo, $store_id, $subscriptionId, 'activated', $order_id, 'Loja ativada sem cobrança inicial', [
            'plan_id' => $plan_id,
            'plan_name' => $planName,
            'amount' => 0,
            'source' => 'register'
        ]);
    }

    $presetApply = ['attempted' => false, 'applied' => false, 'warning' => null];

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $customer_id,
            'name' => $data['adminName'],
            'email' => $data['email'],
            'store_id' => $store_id,
            'store_name' => $data['storeName'],
            'subdomain' => $data['subdomain'],
            'plan_id' => $plan_id,
            'plan_name' => $planName,
            'isFirstLogin' => true,
            'store_active' => $totalAmount <= 0 ? 1 : 0,
            'platform_affiliate_slug' => $affiliateSlug ?: null,
            'platform_affiliate_id' => $affiliateId ?: null,
            'pending_order' => $totalAmount > 0 ? [
                'id' => $order_id,
                'pix_qr_code' => $img,
                'pix_copy_paste' => $payload,
                'total' => $totalAmount,
                'plan_name' => $planName
            ] : null
        ]
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    @error_log('[register.php] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
