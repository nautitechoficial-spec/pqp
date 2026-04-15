<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
require_once 'config/billing_helpers.php';

/** Proteção p/ cron (opcional). Defina token e chame ?token=... */
$cronToken = '';
if ($cronToken !== '') {
  $provided = (string)($_GET['token'] ?? $_POST['token'] ?? '');
  if (!hash_equals($cronToken, $provided)) {
    mbg_send_json(['success'=>false,'error'=>'Acesso negado'], 403);
  }
}

try {
  $singleStoreId = (int)($_GET['store_id'] ?? ($_POST['store_id'] ?? 0));
  $storeIds = [];
  if ($singleStoreId > 0) {
    $storeIds[] = $singleStoreId;
  } else {
    $st = $pdo->query("SELECT DISTINCT store_id FROM store_subscriptions WHERE store_id IS NOT NULL ORDER BY store_id ASC");
    $storeIds = array_map(static fn($r)=>(int)$r['store_id'], $st->fetchAll(PDO::FETCH_ASSOC) ?: []);
  }

  $summary = [
    'processed' => 0,
    'changed' => 0,
    'generated_invoices' => 0,
    'suspended_stores' => 0,
    'errors' => [],
    'stores' => [],
    'rules' => ['invoice_lead_days' => 3, 'suspend_when_due_unpaid' => true]
  ];

  foreach ($storeIds as $storeId) {
    try {
      $pdo->beginTransaction();
      $result = mbg_apply_subscription_maintenance($pdo, $storeId);
      $pdo->commit();

      $summary['processed']++;
      if (!empty($result['changed'])) $summary['changed']++;
      if (!empty($result['generated_invoice'])) $summary['generated_invoices']++;
      if (!empty($result['suspended'])) $summary['suspended_stores']++;
      $summary['stores'][] = [
        'store_id' => $storeId,
        'changed' => (bool)($result['changed'] ?? false),
        'generated_invoice' => (bool)($result['generated_invoice'] ?? false),
        'suspended' => (bool)($result['suspended'] ?? false),
      ];
    } catch (Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      $summary['errors'][] = ['store_id' => $storeId, 'error' => $e->getMessage()];
    }
  }

  mbg_send_json(['success'=>true] + $summary);
} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
  mbg_send_json(['success'=>false,'error'=>$e->getMessage()],400);
}
