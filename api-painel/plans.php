<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
function send_json($data, int $status = 200): void {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
  exit;
}
function table_exists(PDO $pdo, string $table): bool {
  try { $pdo->query("SELECT 1 FROM `{$table}` LIMIT 1"); return true; } catch (Throwable $e) { return false; }
}
try {
  $isNewSchema = false;
  try {
    $check = $pdo->query("SHOW COLUMNS FROM plans LIKE 'slug'");
    $isNewSchema = (bool)$check && (bool)$check->fetch(PDO::FETCH_ASSOC);
  } catch (Throwable $e) {
    $isNewSchema = false;
  }

  if ($isNewSchema) {
    $sql = "SELECT id, slug, display_name, badge, headline, summary, footer_note, is_active, currency,
                   price_monthly, price_annual_monthly_equivalent, annual_billing_price_total
            FROM plans WHERE COALESCE(is_active,1)=1 ORDER BY id ASC";
    $plans = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    $hasFeatures = table_exists($pdo, 'plan_features');
    $hasLimits = table_exists($pdo, 'plan_limits');

    foreach ($plans as &$p) {
      $p['id'] = (int)($p['id'] ?? 0);
      $p['name'] = (string)($p['slug'] ?? '');
      $p['display_name'] = (string)($p['display_name'] ?? $p['slug'] ?? '');
      $p['description'] = (string)($p['summary'] ?? '');
      $p['headline'] = (string)($p['headline'] ?? '');
      $p['summary'] = (string)($p['summary'] ?? '');
      $p['badge'] = isset($p['badge']) ? (string)$p['badge'] : null;
      $p['footer_note'] = isset($p['footer_note']) ? (string)$p['footer_note'] : null;
      $p['active'] = (int)($p['is_active'] ?? 1);
      $p['price'] = (float)($p['price_monthly'] ?? 0);
      $p['price_monthly'] = isset($p['price_monthly']) ? (float)$p['price_monthly'] : null;
      $p['price_annual_monthly_equivalent'] = isset($p['price_annual_monthly_equivalent']) ? (float)$p['price_annual_monthly_equivalent'] : null;
      $p['annual_billing_price_total'] = isset($p['annual_billing_price_total']) ? (float)$p['annual_billing_price_total'] : null;

      if ($hasFeatures) {
        try {
          $stf = $pdo->prepare("SELECT feature_text, sort_order, is_highlight FROM plan_features WHERE plan_id=? ORDER BY sort_order ASC, id ASC");
          $stf->execute([$p['id']]);
          $rows = $stf->fetchAll(PDO::FETCH_ASSOC);
          $p['features'] = array_map(function($r){
            return [
              'text' => (string)($r['feature_text'] ?? ''),
              'sort_order' => (int)($r['sort_order'] ?? 0),
              'is_highlight' => (int)($r['is_highlight'] ?? 0),
            ];
          }, $rows ?: []);
        } catch (Throwable $e) { $p['features'] = []; }
      } else { $p['features'] = []; }

      if ($hasLimits) {
        try {
          $stl = $pdo->prepare("SELECT limit_key, limit_value, is_unlimited FROM plan_limits WHERE plan_id=?");
          $stl->execute([$p['id']]);
          $rows = $stl->fetchAll(PDO::FETCH_ASSOC);
          $limits = [];
          foreach (($rows ?: []) as $r) {
            $limits[(string)$r['limit_key']] = [
              'value' => isset($r['limit_value']) ? (int)$r['limit_value'] : null,
              'is_unlimited' => (int)($r['is_unlimited'] ?? 0),
            ];
          }
          $p['limits'] = $limits;
        } catch (Throwable $e) { $p['limits'] = new stdClass(); }
      } else { $p['limits'] = new stdClass(); }
    }
    unset($p);
    send_json($plans);
  }

  // schema antigo (compatibilidade)
  $sql = "SELECT CAST(id AS UNSIGNED) AS id, CAST(name AS CHAR) AS name, CAST(display_name AS CHAR) AS display_name,
                 CAST(description AS CHAR) AS description, CAST(price AS DECIMAL(10,2)) AS price, CAST(active AS UNSIGNED) AS active
          FROM plans WHERE active = 1 ORDER BY price ASC";
  $stmt = $pdo->query($sql);
  $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
  foreach ($plans as &$p) {
    $p['id'] = (int)($p['id'] ?? 0);
    $p['price'] = (float)($p['price'] ?? 0);
    $p['active'] = (int)($p['active'] ?? 1);
    $p['name'] = (string)($p['name'] ?? '');
    $p['display_name'] = (string)($p['display_name'] ?? '');
    $p['description'] = (string)($p['description'] ?? '');
    $p['features'] = [];
    $p['limits'] = new stdClass();
  }
  unset($p);
  send_json($plans);
} catch (Throwable $e) {
  send_json(['success'=>false,'error'=>$e->getMessage()], 500);
}
