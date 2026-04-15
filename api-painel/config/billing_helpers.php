<?php
if (!function_exists("mbg_send_json")) {
  function mbg_send_json($data, int $status=200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
  }
}
if (!function_exists("mbg_has_column")) {
  function mbg_has_column(PDO $pdo, string $table, string $column): bool {
    try { $st=$pdo->prepare("SHOW COLUMNS FROM `{$table}` LIKE ?"); $st->execute([$column]); return (bool)$st->fetch(PDO::FETCH_ASSOC); } catch (Throwable $e) { return false; }
  }
}
if (!function_exists("mbg_get_plan_by_id")) {
  function mbg_get_plan_by_id(PDO $pdo, int $planId): ?array {
    $newSchema = mbg_has_column($pdo, 'plans', 'slug');
    if ($newSchema) {
      $st=$pdo->prepare("SELECT id, slug, display_name, COALESCE(price_monthly,0) AS price, price_monthly FROM plans WHERE id=? AND COALESCE(is_active,1)=1");
      $st->execute([$planId]);
      $p=$st->fetch(PDO::FETCH_ASSOC);
      if(!$p) return null;
      $p['name']=$p['slug'] ?? null;
      $p['price']=(float)($p['price'] ?? 0);
      return $p;
    }
    $st=$pdo->prepare("SELECT id, name, display_name, COALESCE(price,0) AS price FROM plans WHERE id=? AND COALESCE(active,1)=1");
    $st->execute([$planId]);
    $p=$st->fetch(PDO::FETCH_ASSOC);
    if(!$p) return null;
    $p['price']=(float)($p['price'] ?? 0);
    return $p;
  }
}
if (!function_exists("mbg_get_store_admin")) {
  function mbg_get_store_admin(PDO $pdo, int $storeId): ?array {
    $st=$pdo->prepare("SELECT * FROM customers WHERE store_id=? AND COALESCE(isAdmin,0)=1 ORDER BY id ASC LIMIT 1");
    $st->execute([$storeId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
  }
}
if (!function_exists("mbg_get_active_subscription")) {
  function mbg_get_active_subscription(PDO $pdo, int $storeId): ?array {
    $st=$pdo->prepare("SELECT * FROM store_subscriptions WHERE store_id=? ORDER BY (status='active') DESC, id DESC LIMIT 1");
    $st->execute([$storeId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
  }
}
if (!function_exists("mbg_log_subscription_event")) {
  function mbg_log_subscription_event(PDO $pdo, int $storeId, ?int $subscriptionId, string $eventType, ?int $orderId=null, ?string $message=null, $payload=null): void {
    try {
      $payloadJson = $payload===null ? null : json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
      $st=$pdo->prepare("INSERT INTO subscription_events (store_id, subscription_id, event_type, order_id, message, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
      $st->execute([$storeId, $subscriptionId, $eventType, $orderId, $message, $payloadJson]);
    } catch (Throwable $e) {}
  }
}
if (!function_exists("mbg_subscription_cycle_interval")) {
  function mbg_subscription_cycle_interval(string $cycle): string {
    $c = strtolower(trim($cycle));
    if ($c === 'yearly' || $c === 'annual') return '+1 year';
    if ($c === 'quarterly') return '+3 months';
    return '+1 month';
  }
}
if (!function_exists("mbg_upsert_subscription")) {
  function mbg_upsert_subscription(PDO $pdo, int $storeId, int $planId, string $status='trial', string $paymentStatus='pending', ?float $amount=null, string $billingCycle='monthly', ?string $paymentExternalId=null, ?string $pixQr=null, ?string $pixCopy=null): int {
    $existing = mbg_get_active_subscription($pdo, $storeId);
    if ($existing) {
      $sql="UPDATE store_subscriptions SET plan_id=?, status=?, payment_status=?, amount=?, billing_cycle=?, payment_external_id=?, pix_qrcode=?, pix_copy_paste=?, updated_at=NOW() WHERE id=?";
      $pdo->prepare($sql)->execute([$planId,$status,$paymentStatus,$amount,$billingCycle,$paymentExternalId,$pixQr,$pixCopy,$existing['id']]);
      return (int)$existing['id'];
    }
    $sql="INSERT INTO store_subscriptions (store_id, plan_id, status, payment_status, amount, billing_cycle, payment_external_id, pix_qrcode, pix_copy_paste, started_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW(),NOW())";
    $pdo->prepare($sql)->execute([$storeId,$planId,$status,$paymentStatus,$amount,$billingCycle,$paymentExternalId,$pixQr,$pixCopy]);
    return (int)$pdo->lastInsertId();
  }
}
if (!function_exists("mbg_get_pending_sub_order")) {
  function mbg_get_pending_sub_order(PDO $pdo, int $storeId): ?array {
    $st=$pdo->prepare("SELECT * FROM orders WHERE store_id=? AND LOWER(COALESCE(tipo,''))='sub' AND LOWER(COALESCE(status,''))='pending' ORDER BY id DESC LIMIT 1");
    $st->execute([$storeId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
  }
}
if (!function_exists("mbg_get_pending_subscription_renewal_order")) {
  function mbg_get_pending_subscription_renewal_order(PDO $pdo, int $storeId): ?array {
    $sql = "SELECT o.* FROM orders o
            WHERE o.store_id=?
              AND LOWER(COALESCE(o.tipo,''))='sub'
              AND LOWER(COALESCE(o.status,''))='pending'
              AND NOT EXISTS (
                SELECT 1 FROM subscription_changes sc
                WHERE sc.order_id=o.id AND sc.store_id=o.store_id
                  AND sc.status IN ('scheduled','applied')
              )
            ORDER BY o.id DESC LIMIT 1";
    $st=$pdo->prepare($sql);
    $st->execute([$storeId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
  }
}
if (!function_exists("mbg_get_pending_upgrade_order")) {
  function mbg_get_pending_upgrade_order(PDO $pdo, int $storeId): ?array {
    $sql = "SELECT o.* FROM orders o
            INNER JOIN subscription_changes sc ON sc.order_id=o.id AND sc.store_id=o.store_id
            WHERE o.store_id=?
              AND LOWER(COALESCE(o.tipo,''))='sub'
              AND LOWER(COALESCE(o.status,''))='pending'
              AND sc.change_type='upgrade'
              AND sc.status='scheduled'
            ORDER BY sc.id DESC LIMIT 1";
    $st=$pdo->prepare($sql);
    $st->execute([$storeId]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
  }
}

if (!function_exists("mbg_asaas_api_key")) {
  function mbg_asaas_api_key(): string {
    // prioridade: variável de ambiente/constante (se existir)
    $env = getenv('ASAAS_API_KEY');
    if (is_string($env) && trim($env) !== '') return trim($env);
    if (defined('ASAAS_API_KEY') && is_string(ASAAS_API_KEY) && trim(ASAAS_API_KEY) !== '') return trim(ASAAS_API_KEY);
    // fallback (compatível com o projeto atual)
    return '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmYTkyOTdjLTY4YjctNGM2Yi1iYjBjLTIzM2FiYzMyYWM1Njo6JGFhY2hfNDM2M2M3MzYtN2UwNC00MjljLWFlZGUtZGJiNTMyYTk4ZDky';
  }
}
if (!function_exists("mbg_asaas_request")) {
  function mbg_asaas_request(string $method, string $endpoint, ?array $body=null): array {
    $base = 'https://api.asaas.com/v3';
    $apiKey = mbg_asaas_api_key();
    if ($apiKey === '') throw new Exception('ASAAS_API_KEY não configurada.');
    $url = rtrim($base,'/') . '/' . ltrim($endpoint,'/');
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'access_token: ' . $apiKey];
    $opts = [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CUSTOMREQUEST => strtoupper($method),
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_TIMEOUT => 30,
    ];
    if ($body !== null) $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    curl_setopt_array($ch, $opts);
    $resp = curl_exec($ch);
    $err = curl_error($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp === false) throw new Exception('Erro cURL Asaas: ' . $err);
    $data = json_decode((string)$resp, true);
    if (!is_array($data)) throw new Exception("Resposta inválida Asaas (HTTP {$http})");
    return ['status'=>$http,'data'=>$data];
  }
}
if (!function_exists("mbg_asaas_find_or_create_customer")) {
  function mbg_asaas_find_or_create_customer(PDO $pdo, int $storeId, array $admin): string {
    $email = trim((string)($admin['email'] ?? ''));
    if ($email === '') throw new Exception("Admin da loja {$storeId} sem e-mail para criar cobrança Asaas.");
    $cpf = preg_replace('/\D/', '', (string)($admin['cpf'] ?? ''));
    $phone = preg_replace('/\D/', '', (string)($admin['phone'] ?? $admin['whatsapp'] ?? ''));
    $name = trim((string)($admin['name'] ?? 'Cliente MinhaBagg'));
    $custRes = mbg_asaas_request('POST', '/customers', [
      'name' => $name,
      'email' => $email,
      'cpfCnpj' => $cpf,
      'mobilePhone' => $phone,
      'notificationDisabled' => true
    ]);
    $custId = (string)($custRes['data']['id'] ?? '');
    if ($custId !== '') return $custId;
    $search = mbg_asaas_request('GET', '/customers?email=' . urlencode($email));
    $custId = (string)($search['data']['data'][0]['id'] ?? '');
    if ($custId === '') throw new Exception('Erro ao sincronizar cliente no Asaas.');
    return $custId;
  }
}

if (!function_exists("mbg_sync_existing_subscription_order_pix")) {
  function mbg_sync_existing_subscription_order_pix(PDO $pdo, int $storeId, array $order, ?string $description=null, ?string $dueDateTime=null): array {
    $orderId = (int)($order['id'] ?? 0);
    if ($orderId <= 0) throw new Exception('Pedido inválido para sincronizar PIX');
    $asaasPayId = trim((string)($order['asaas_payment_id'] ?? ''));
    $payload = trim((string)($order['pix_copy_paste'] ?? ''));
    $img = trim((string)($order['pix_qr_code'] ?? ($order['pix_image'] ?? '')));

    if ($asaasPayId === '') {
      $admin = mbg_get_store_admin($pdo, $storeId);
      if (!$admin) throw new Exception("Admin não encontrado para store_id={$storeId}");
      $asaasCustId = mbg_asaas_find_or_create_customer($pdo, $storeId, $admin);
      $amount = (float)($order['total_amount'] ?? 0);
      $due = $dueDateTime ?: date('Y-m-d H:i:s');
      $desc = trim((string)($description ?: 'Renovação de assinatura'));
      $payRes = mbg_asaas_request('POST', '/payments', [
        'customer' => $asaasCustId,
        'billingType' => 'PIX',
        'value' => (float)$amount,
        'dueDate' => (new DateTimeImmutable($due))->format('Y-m-d'),
        'description' => $desc . " - Pedido #{$orderId}",
        'externalReference' => (string)$orderId
      ]);
      if (!in_array((int)$payRes['status'], [200, 201], true)) {
        $msg = $payRes['data']['errors'][0]['description'] ?? 'Erro desconhecido no Asaas';
        throw new Exception('Erro Asaas: ' . $msg);
      }
      $asaasPayId = (string)($payRes['data']['id'] ?? '');
      if ($asaasPayId === '') throw new Exception('Asaas não retornou id da cobrança ao sincronizar pedido pendente.');
    }

    if ($payload === '' || $img === '') {
      $qrRes = mbg_asaas_request('GET', "/payments/{$asaasPayId}/pixQrCode");
      $img = (string)($qrRes['data']['encodedImage'] ?? $img);
      $payload = (string)($qrRes['data']['payload'] ?? $payload);
    }

    $sets=[]; $vals=[];
    if (mbg_has_column($pdo, 'orders', 'asaas_payment_id')) { $sets[]='asaas_payment_id=?'; $vals[]=$asaasPayId; }
    if (mbg_has_column($pdo, 'orders', 'payment_external_id')) { $sets[]='payment_external_id=?'; $vals[]=$asaasPayId; }
    if (mbg_has_column($pdo, 'orders', 'pix_payload')) { $sets[]='pix_payload=?'; $vals[]=$payload; }
    if (mbg_has_column($pdo, 'orders', 'pix_qr_code')) { $sets[]='pix_qr_code=?'; $vals[]=$img; }
    if (mbg_has_column($pdo, 'orders', 'pix_image')) { $sets[]='pix_image=?'; $vals[]=$img; }
    if (mbg_has_column($pdo, 'orders', 'pix_copy_paste')) { $sets[]='pix_copy_paste=?'; $vals[]=$payload; }
    if (mbg_has_column($pdo, 'orders', 'updated_at')) { $sets[]='updated_at=NOW()'; }
    if ($sets) {
      $vals[] = $orderId;
      $pdo->prepare('UPDATE orders SET '.implode(', ', $sets).' WHERE id=?')->execute($vals);
    }

    return ['order_id'=>$orderId,'asaas_payment_id'=>$asaasPayId,'pix_qr_code'=>$img,'pix_copy_paste'=>$payload];
  }
}

if (!function_exists("mbg_create_subscription_invoice_order_with_pix")) {
  function mbg_create_subscription_invoice_order_with_pix(PDO $pdo, int $storeId, int $customerId, float $amount, string $dueDateTime, string $description='Renovação de assinatura'): array {
    // INSERT compatível com schemas diferentes de `orders` (alguns não têm `description`/`due_date`)
    $cols = ['store_id', 'customer_id', 'total_amount', 'status', 'payment_method', 'payment_provider', 'tipo'];
    $vals = [$storeId, $customerId, $amount, 'pending', 'PIX', 'ASAAS', 'sub'];

    if (mbg_has_column($pdo, 'orders', 'description')) {
      $cols[] = 'description';
      $vals[] = $description;
    }
    if (mbg_has_column($pdo, 'orders', 'due_date')) {
      $cols[] = 'due_date';
      $vals[] = $dueDateTime;
    }
    if (mbg_has_column($pdo, 'orders', 'sales_channel')) {
      $cols[] = 'sales_channel';
      $vals[] = 'loja';
    }

    if (mbg_has_column($pdo, 'orders', 'created_at')) $cols[] = 'created_at';
    if (mbg_has_column($pdo, 'orders', 'updated_at')) $cols[] = 'updated_at';

    $placeholders = [];
    $execVals = [];
    foreach ($cols as $i => $c) {
      if (in_array($c, ['created_at','updated_at'], true)) {
        $placeholders[] = 'NOW()';
      } else {
        $placeholders[] = '?';
        $execVals[] = $vals[array_search($c, $cols, true)];
      }
    }

    $sql = "INSERT INTO orders (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $startedTxn = false;
    if (!$pdo->inTransaction()) { $pdo->beginTransaction(); $startedTxn = true; }
    try {
      $ins = $pdo->prepare($sql);
      $ins->execute($execVals);
      $orderId = (int)$pdo->lastInsertId();

      $admin = mbg_get_store_admin($pdo, $storeId);
    if (!$admin) throw new Exception("Admin não encontrado para store_id={$storeId}");
    $asaasCustId = mbg_asaas_find_or_create_customer($pdo, $storeId, $admin);

    $payRes = mbg_asaas_request('POST', '/payments', [
      'customer' => $asaasCustId,
      'billingType' => 'PIX',
      'value' => (float)$amount,
      'dueDate' => (new DateTimeImmutable($dueDateTime))->format('Y-m-d'),
      'description' => $description . " - Pedido #{$orderId}",
      'externalReference' => (string)$orderId
    ]);
    if (!in_array((int)$payRes['status'], [200, 201], true)) {
      $msg = $payRes['data']['errors'][0]['description'] ?? 'Erro desconhecido no Asaas';
      throw new Exception('Erro Asaas: ' . $msg);
    }
    $asaasPayId = (string)($payRes['data']['id'] ?? '');
    if ($asaasPayId === '') throw new Exception('Asaas não retornou id da cobrança.');

    $qrRes = mbg_asaas_request('GET', "/payments/{$asaasPayId}/pixQrCode");
    $img = (string)($qrRes['data']['encodedImage'] ?? '');
    $payload = (string)($qrRes['data']['payload'] ?? '');

    // atualização compatível com variações de schema
    $sets = ["asaas_payment_id = ?", "updated_at = NOW()"];
    $vals = [$asaasPayId];
    if (mbg_has_column($pdo, 'orders', 'payment_external_id')) { $sets[] = "payment_external_id = ?"; $vals[] = $asaasPayId; }
    if (mbg_has_column($pdo, 'orders', 'pix_payload')) { $sets[] = "pix_payload = ?"; $vals[] = $payload; }
    if (mbg_has_column($pdo, 'orders', 'pix_qr_code')) { $sets[] = "pix_qr_code = ?"; $vals[] = $img; }
    if (mbg_has_column($pdo, 'orders', 'pix_image')) { $sets[] = "pix_image = ?"; $vals[] = $img; }
    if (mbg_has_column($pdo, 'orders', 'pix_copy_paste')) { $sets[] = "pix_copy_paste = ?"; $vals[] = $payload; }
    if (mbg_has_column($pdo, 'orders', 'payment_provider')) { $sets[] = "payment_provider = 'ASAAS'"; }
    $vals[] = $orderId;
    $sql = "UPDATE orders SET " . implode(', ', $sets) . " WHERE id=?";
    $pdo->prepare($sql)->execute($vals);

    if ($startedTxn && $pdo->inTransaction()) $pdo->commit();
    return [
      'order_id' => $orderId,
      'asaas_payment_id' => $asaasPayId,
      'pix_qr_code' => $img,
      'pix_copy_paste' => $payload,
      'asaas_customer_id' => $asaasCustId,
    ];
    } catch (Throwable $e) {
      if (isset($startedTxn) && $startedTxn && $pdo->inTransaction()) $pdo->rollBack();
      throw $e;
    }
  }
}

if (!function_exists("mbg_apply_subscription_maintenance")) {
  function mbg_apply_subscription_maintenance(PDO $pdo, int $storeId): array {
    $result=['changed'=>false,'suspended'=>false,'generated_invoice'=>false];
    $sub = mbg_get_active_subscription($pdo, $storeId);
    if (!$sub) return $result;

    $now = new DateTimeImmutable('now');
    $leadDays = 3; // gerar fatura 3 dias antes do vencimento
    $pendingRenewal = mbg_get_pending_subscription_renewal_order($pdo, $storeId);
    if ($pendingRenewal) {
      $hasPix = trim((string)($pendingRenewal['pix_copy_paste'] ?? '')) !== '' && trim((string)($pendingRenewal['pix_qr_code'] ?? ($pendingRenewal['pix_image'] ?? ''))) !== '';
      if (!$hasPix) {
        try {
          $synced = mbg_sync_existing_subscription_order_pix($pdo, $storeId, $pendingRenewal, 'Renovação de assinatura', !empty($sub['ends_at']) ? (string)$sub['ends_at'] : date('Y-m-d H:i:s'));
          $pendingRenewal = mbg_get_pending_subscription_renewal_order($pdo, $storeId) ?: $pendingRenewal;
          if ($sub && !empty($synced['asaas_payment_id'])) {
            try {
              $pdo->prepare("UPDATE store_subscriptions SET payment_status='pending', payment_external_id=?, pix_qrcode=?, pix_copy_paste=?, updated_at=NOW() WHERE id=?")
                ->execute([(string)$synced['asaas_payment_id'], (string)($synced['pix_qr_code'] ?? ''), (string)($synced['pix_copy_paste'] ?? ''), (int)$sub['id']]);
            } catch (Throwable $e) {}
          }
          $result['changed'] = true;
        } catch (Throwable $healErr) {
          // mantém fluxo; erro aparecerá em quem chamou a manutenção se necessário
        }
      }
    }

    if (!empty($sub['ends_at'])) {
      try { $ends = new DateTimeImmutable((string)$sub['ends_at']); } catch (Throwable $e) { $ends = null; }
      if ($ends) {
        $leadAt = $ends->modify("-{$leadDays} days");
        if ($now >= $leadAt && !$pendingRenewal) {
          $admin = mbg_get_store_admin($pdo, $storeId);
          if ($admin) {
            $amount = (float)($sub['amount'] ?? 0);
            if ($amount <= 0 && !empty($sub['plan_id'])) {
              $plan = mbg_get_plan_by_id($pdo, (int)$sub['plan_id']);
              $amount = (float)($plan['price'] ?? 0);
            }
            $desc = 'Renovação de assinatura';
            $dueDate = $ends->format('Y-m-d H:i:s');
            $invoice = mbg_create_subscription_invoice_order_with_pix($pdo, $storeId, (int)$admin['id'], (float)$amount, $dueDate, $desc);
            $orderId = (int)$invoice['order_id'];

            // espelha dados da fatura pendente na assinatura (facilita tela de pagamento/faturas)
            try {
              $pdo->prepare("UPDATE store_subscriptions SET payment_status='pending', payment_external_id=?, pix_qrcode=?, pix_copy_paste=?, updated_at=NOW() WHERE id=?")
                  ->execute([(string)($invoice['asaas_payment_id'] ?? ''), (string)($invoice['pix_qr_code'] ?? ''), (string)($invoice['pix_copy_paste'] ?? ''), (int)$sub['id']]);
            } catch (Throwable $e) {}

            mbg_log_subscription_event($pdo, $storeId, (int)$sub['id'], 'invoice_created', $orderId, 'Fatura de renovação criada automaticamente (3 dias antes do vencimento)', [
              'source'=>'maintenance',
              'lead_days'=>$leadDays,
              'subscription_ends_at'=>$ends->format('Y-m-d H:i:s'),
              'asaas_payment_id'=>(string)($invoice['asaas_payment_id'] ?? '')
            ]);
            $result['changed']=true;
            $result['generated_invoice']=true;
            $pendingRenewal = mbg_get_pending_subscription_renewal_order($pdo, $storeId);
          }
        }

        if ($ends <= $now && $pendingRenewal) {
          $pdo->prepare("UPDATE stores SET suspended=1, active=0, suspension_reason='Assinatura vencida / fatura em aberto', updated_at=NOW() WHERE id=?")->execute([$storeId]);
          $subStatus = strtolower((string)($sub['status'] ?? ''));
          $subPay = strtolower((string)($sub['payment_status'] ?? ''));
          if ($subStatus !== 'expired' || $subPay !== 'pending') {
            $pdo->prepare("UPDATE store_subscriptions SET status='expired', payment_status='pending', updated_at=NOW() WHERE id=?")->execute([$sub['id']]);
            mbg_log_subscription_event($pdo, $storeId, (int)$sub['id'], 'suspended', (int)($pendingRenewal['id'] ?? 0), 'Loja suspensa por assinatura vencida e fatura em aberto', ['subscription_ends_at'=>$ends->format('Y-m-d H:i:s')]);
          }
          $result['changed']=true;
          $result['suspended']=true;
        }

        // Reativação automática (inclui ajustes manuais no banco): se o vencimento está no futuro,
        // mantém a loja ativa independentemente de fatura pendente antiga de upgrade.
        if ($ends > $now) {
          $stStore = $pdo->prepare("SELECT active, COALESCE(suspended,0) AS suspended, plan_id FROM stores WHERE id=? LIMIT 1");
          $stStore->execute([$storeId]);
          $storeRow = $stStore->fetch(PDO::FETCH_ASSOC) ?: ['active'=>0,'suspended'=>0,'plan_id'=>null];
          $shouldUnsuspend = ((int)($storeRow['active'] ?? 0) !== 1) || ((int)($storeRow['suspended'] ?? 0) !== 0) || ((int)($storeRow['plan_id'] ?? 0) !== (int)($sub['plan_id'] ?? 0));
          if ($shouldUnsuspend) {
            $pdo->prepare("UPDATE stores SET active=1, suspended=0, suspension_reason=NULL, plan_id=?, updated_at=NOW() WHERE id=?")
                ->execute([(int)($sub['plan_id'] ?? 1), $storeId]);
            $result['changed']=true;
          }
          $subStatus = strtolower((string)($sub['status'] ?? ''));
          if ($subStatus !== 'active') {
            $newPayStatus = $pendingRenewal ? 'pending' : 'paid';
            $pdo->prepare("UPDATE store_subscriptions SET status='active', payment_status=?, updated_at=NOW() WHERE id=?")
                ->execute([$newPayStatus, (int)$sub['id']]);
            $result['changed']=true;
          }
        }
      }
    }

    try {
      $st=$pdo->prepare("SELECT * FROM subscription_changes WHERE store_id=? AND status='scheduled' AND effective_at <= NOW() ORDER BY id ASC");
      $st->execute([$storeId]);
      $changes=$st->fetchAll(PDO::FETCH_ASSOC) ?: [];
      foreach($changes as $chg){
        $changeType = strtolower((string)($chg['change_type'] ?? ''));
        $changeOrderId = (int)($chg['order_id'] ?? 0);
        if ($changeType === 'upgrade' && $changeOrderId > 0) {
          $stOrd = $pdo->prepare("SELECT status FROM orders WHERE id=? AND store_id=? LIMIT 1");
          $stOrd->execute([$changeOrderId, $storeId]);
          $ordStatus = strtolower((string)($stOrd->fetchColumn() ?: ''));
          if ($ordStatus !== 'paid') {
            // upgrade não aplica sem pagamento; se algum bug antigo já mudou o plano, volta para o from_plan_id
            $fromPlanId = (int)($chg['from_plan_id'] ?? 0);
            $toPlanId = (int)($chg['to_plan_id'] ?? 0);
            if ($fromPlanId > 0) {
              try {
                $pdo->prepare("UPDATE stores SET plan_id=?, updated_at=NOW() WHERE id=? AND plan_id=?")
                    ->execute([$fromPlanId, $storeId, $toPlanId]);
                if ($sub) {
                  $pdo->prepare("UPDATE store_subscriptions SET plan_id=?, updated_at=NOW() WHERE id=? AND plan_id=?")
                      ->execute([$fromPlanId, (int)$sub['id'], $toPlanId]);
                }
              } catch (Throwable $e) {}
            }
            continue;
          }
        }
        $plan = mbg_get_plan_by_id($pdo, (int)$chg['to_plan_id']);
        if (!$plan) continue;
        $pdo->prepare("UPDATE stores SET plan_id=?, updated_at=NOW() WHERE id=?")->execute([(int)$chg['to_plan_id'], $storeId]);
        if ($sub) {
          $pdo->prepare("UPDATE store_subscriptions SET plan_id=?, amount=?, updated_at=NOW() WHERE id=?")->execute([(int)$chg['to_plan_id'], (float)($plan['price']??0), (int)$sub['id']]);
        }
        $pdo->prepare("UPDATE subscription_changes SET status='applied', updated_at=NOW() WHERE id=?")->execute([(int)$chg['id']]);
        $evt = $changeType === 'downgrade' ? 'downgrade_applied' : 'upgrade_applied';
        mbg_log_subscription_event($pdo, $storeId, $sub ? (int)$sub['id'] : null, $evt, $changeOrderId ?: null, 'Alteração de plano aplicada', ['change_id'=>(int)$chg['id']]);
        $result['changed']=true;
      }
    } catch (Throwable $e) {}

    return $result;
  }
}

