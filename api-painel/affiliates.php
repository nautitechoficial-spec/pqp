<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
require_once __DIR__.'/db.php';

function out($ok, $data = [], $code = 200) {
  http_response_code($code);
  echo json_encode($ok ? array_merge(['success' => true], $data) : ['success' => false, 'error' => ($data['error'] ?? 'Erro')], JSON_UNESCAPED_UNICODE);
  exit;
}
function body(){ $j = json_decode(file_get_contents('php://input'), true); return is_array($j) ? $j : []; }
function storeId(){ if ($_SERVER['REQUEST_METHOD']==='GET') return (int)($_GET['store_id'] ?? 0); $b = body(); return (int)($b['store_id'] ?? 0); }
function ensureStore($id){ if ($id <= 0) out(false, ['error'=>'store_id obrigatório'], 400); }
function slugify($s){
  $s = iconv('UTF-8','ASCII//TRANSLIT//IGNORE', (string)$s);
  $s = strtolower($s);
  $s = preg_replace('/[^a-z0-9]+/', '-', $s);
  $s = trim($s, '-');
  return $s ?: ('afiliado-'.substr(md5((string)microtime(true)),0,6));
}
function cfgKey($storeId, $key){ return "store:{$storeId}:{$key}"; }
function getCfg(PDO $pdo, $storeId, $key, $default = null){
  $st = $pdo->prepare('SELECT config_value FROM platform_config WHERE config_key=? LIMIT 1');
  $st->execute([cfgKey($storeId, $key)]);
  $v = $st->fetchColumn();
  return $v === false ? $default : $v;
}
function setCfg(PDO $pdo, $storeId, $key, $val){
  $full = cfgKey($storeId, $key);
  $st = $pdo->prepare('SELECT id FROM platform_config WHERE config_key=? LIMIT 1');
  $st->execute([$full]);
  $id = $st->fetchColumn();
  if ($id) {
    $pdo->prepare('UPDATE platform_config SET config_value=? WHERE id=?')->execute([(string)$val, $id]);
  } else {
    $pdo->prepare('INSERT INTO platform_config (config_key, config_value) VALUES (?,?)')->execute([$full, (string)$val]);
  }
}

try {
  $pdo = getConnection();
  $storeId = storeId();
  ensureStore($storeId);

  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'summary';

    if ($action === 'customers_search') {
      $q = trim((string)($_GET['q'] ?? ''));
      $sql = 'SELECT id, name, email, created_at FROM customers WHERE store_id=?';
      $args = [$storeId];
      if ($q !== '') {
        $sql .= ' AND (name LIKE ? OR email LIKE ?)';
        $like = "%{$q}%";
        $args[] = $like; $args[] = $like;
      }
      $sql .= ' ORDER BY id DESC LIMIT 20';
      $st = $pdo->prepare($sql);
      $st->execute($args);
      out(true, ['customers' => $st->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($action === 'summary') {
      $q = trim((string)($_GET['q'] ?? ''));
      $where = ' WHERE ap.store_id=? ';
      $args = [$storeId];
      if ($q !== '') {
        $where .= ' AND (c.name LIKE ? OR c.email LIKE ? OR ap.slug LIKE ?)';
        $like = "%{$q}%";
        array_push($args, $like, $like, $like);
      }

      $sql = "SELECT
          ap.id,
          ap.store_id,
          ap.customer_id,
          ap.slug,
          ap.commission_type,
          ap.commission_value,
          ap.min_payout_amount,
          ap.status,
          ap.notes,
          ap.approved_at,
          ap.created_at,
          ap.updated_at,
          c.name AS customer_name,
          c.email AS customer_email,
          COALESCE(clk.clicks, 0) AS clicks,
          COALESCE(conv.conversions, 0) AS conversions,
          COALESCE(conv.total_sales, 0) AS total_sales,
          COALESCE(conv.total_commission, 0) AS total_commission,
          COALESCE(conv.pending_commission, 0) AS pending_commission,
          COALESCE(pay.paid_commission, 0) AS paid_commission
        FROM affiliate_profiles ap
        INNER JOIN customers c ON c.id = ap.customer_id AND c.store_id = ap.store_id
        LEFT JOIN (
          SELECT store_id, affiliate_profile_id, COUNT(*) AS clicks
          FROM affiliate_clicks
          WHERE store_id=?
          GROUP BY store_id, affiliate_profile_id
        ) clk ON clk.store_id = ap.store_id AND clk.affiliate_profile_id = ap.id
        LEFT JOIN (
          SELECT store_id, affiliate_profile_id,
                 COUNT(*) AS conversions,
                 SUM(COALESCE(base_amount,0)) AS total_sales,
                 SUM(CASE WHEN conversion_status IN ('pending','approved') THEN COALESCE(commission_amount,0) ELSE 0 END) AS total_commission,
                 SUM(CASE WHEN conversion_status='pending' THEN COALESCE(commission_amount,0) ELSE 0 END) AS pending_commission
          FROM affiliate_conversions
          WHERE store_id=?
          GROUP BY store_id, affiliate_profile_id
        ) conv ON conv.store_id = ap.store_id AND conv.affiliate_profile_id = ap.id
        LEFT JOIN (
          SELECT store_id, affiliate_profile_id,
                 SUM(CASE WHEN status='paid' THEN COALESCE(amount,0) ELSE 0 END) AS paid_commission
          FROM affiliate_payouts
          WHERE store_id=?
          GROUP BY store_id, affiliate_profile_id
        ) pay ON pay.store_id = ap.store_id AND pay.affiliate_profile_id = ap.id
        {$where}
        ORDER BY ap.id DESC";
      // first 3 placeholders are for derived tables, then rest where args
      $execArgs = [$storeId, $storeId, $storeId];
      $execArgs = array_merge($execArgs, $args);
      $st = $pdo->prepare($sql);
      $st->execute($execArgs);
      $items = $st->fetchAll(PDO::FETCH_ASSOC);

      $stats = [
        'total_affiliates' => count($items),
        'active_affiliates' => 0,
        'total_sales' => 0.0,
        'total_commission' => 0.0,
        'pending_commission' => 0.0,
        'avg_conversion_rate' => 0.0,
      ];
      $sumRate = 0.0; $rateCount = 0;
      foreach ($items as &$it) {
        if (($it['commission_type'] ?? '') === 'percent') $it['commission_type'] = 'percentage';
        $clicks = (float)($it['clicks'] ?? 0); $convs = (float)($it['conversions'] ?? 0);
        $it['conversion_rate'] = $clicks > 0 ? round(($convs / $clicks) * 100, 2) : 0;
        if (($it['status'] ?? '') === 'active') $stats['active_affiliates']++;
        $stats['total_sales'] += (float)($it['total_sales'] ?? 0);
        $stats['total_commission'] += (float)($it['total_commission'] ?? 0);
        $stats['pending_commission'] += (float)($it['pending_commission'] ?? 0);
        if ($clicks > 0) { $sumRate += (float)$it['conversion_rate']; $rateCount++; }
      }
      unset($it);
      $stats['avg_conversion_rate'] = $rateCount ? round($sumRate / $rateCount, 2) : 0.0;

      $settings = [
        'default_commission_type' => ((string)getCfg($pdo, $storeId, 'affiliate.default_commission_type', 'percentage') === 'fixed' ? 'fixed' : 'percentage'),
        'default_commission_value' => (float)getCfg($pdo, $storeId, 'affiliate.default_commission_value', '10'),
        'min_payout_amount' => (float)getCfg($pdo, $storeId, 'affiliate.min_payout_amount', '0'),
      ];

      $ranking = $items;
      usort($ranking, function($a,$b){
        $cmp = ((float)$b['total_sales']) <=> ((float)$a['total_sales']);
        if ($cmp !== 0) return $cmp;
        return ((float)$b['total_commission']) <=> ((float)$a['total_commission']);
      });
      $ranking = array_slice($ranking, 0, 10);

      out(true, ['affiliates'=>$items, 'settings'=>$settings, 'stats'=>$stats, 'ranking'=>$ranking]);
    }

    out(false, ['error'=>'Ação GET inválida'], 400);
  }

  $b = body();
  $action = $b['action'] ?? '';
  $payload = is_array($b['payload'] ?? null) ? $b['payload'] : [];

  if ($action === 'save_settings') {
    $type = (($payload['default_commission_type'] ?? 'percentage') === 'fixed') ? 'fixed' : 'percentage';
    setCfg($pdo, $storeId, 'affiliate.default_commission_type', $type);
    setCfg($pdo, $storeId, 'affiliate.default_commission_value', (string)(float)($payload['default_commission_value'] ?? 10));
    if (isset($payload['min_payout_amount'])) setCfg($pdo, $storeId, 'affiliate.min_payout_amount', (string)(float)$payload['min_payout_amount']);
    out(true, ['message' => 'Configurações salvas']);
  }

  if ($action === 'create') {
    $customerId = (int)($payload['customer_id'] ?? 0);
    if ($customerId <= 0) out(false, ['error'=>'customer_id obrigatório'], 400);
    $st = $pdo->prepare('SELECT id,name,email FROM customers WHERE id=? AND store_id=? LIMIT 1');
    $st->execute([$customerId, $storeId]);
    $customer = $st->fetch(PDO::FETCH_ASSOC);
    if (!$customer) out(false, ['error'=>'Cliente não encontrado'], 404);

    $slug = slugify(trim((string)($payload['slug'] ?? '')) ?: (string)$customer['name']);
    // garantir slug único por loja
    $base = $slug; $n = 2;
    while (true) {
      $ck = $pdo->prepare('SELECT id FROM affiliate_profiles WHERE store_id=? AND slug=? LIMIT 1');
      $ck->execute([$storeId, $slug]);
      if (!$ck->fetchColumn()) break;
      $slug = $base . '-' . $n; $n++;
    }

    $ctype = (($payload['commission_type'] ?? 'percentage') === 'fixed') ? 'fixed' : 'percent';
    $cvalue = (float)($payload['commission_value'] ?? 10);
    $statusRaw = (string)($payload['status'] ?? 'active');
    $status = in_array($statusRaw, ['pending','active','inactive','blocked'], true) ? $statusRaw : 'active';
    $approvedAt = $status === 'active' ? date('Y-m-d H:i:s') : null;

    $pdo->prepare('INSERT INTO affiliate_profiles (store_id, customer_id, slug, commission_type, commission_value, status, notes, approved_at) VALUES (?,?,?,?,?,?,?,?)')
      ->execute([$storeId, $customerId, $slug, $ctype, $cvalue, $status, ($payload['notes'] ?? null), $approvedAt]);
    out(true, ['message'=>'Afiliado criado', 'id'=>(int)$pdo->lastInsertId()]);
  }

  if ($action === 'update') {
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) out(false, ['error'=>'id obrigatório'], 400);

    $sets=[]; $vals=[];
    if (array_key_exists('slug', $payload)) { $sets[]='slug=?'; $vals[]=slugify((string)$payload['slug']); }
    if (array_key_exists('commission_type', $payload)) { $sets[]='commission_type=?'; $vals[]=(($payload['commission_type']==='fixed')?'fixed':'percent'); }
    if (array_key_exists('commission_value', $payload)) { $sets[]='commission_value=?'; $vals[]=(float)$payload['commission_value']; }
    if (array_key_exists('status', $payload)) {
      $status = (string)$payload['status'];
      if (!in_array($status, ['pending','active','inactive','blocked'], true)) $status = 'inactive';
      $sets[]='status=?'; $vals[]=$status;
      if ($status === 'active') $sets[]='approved_at=COALESCE(approved_at, NOW())';
    }
    if (array_key_exists('notes', $payload)) { $sets[]='notes=?'; $vals[]=$payload['notes']; }
    if (!$sets) out(false, ['error'=>'Nada para atualizar'], 400);

    $vals[] = $id; $vals[] = $storeId;
    $sql = 'UPDATE affiliate_profiles SET '.implode(', ', $sets).', updated_at=CURRENT_TIMESTAMP WHERE id=? AND store_id=?';
    $pdo->prepare($sql)->execute($vals);
    out(true, ['message'=>'Afiliado atualizado']);
  }

  if ($action === 'delete') {
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) out(false, ['error'=>'id obrigatório'], 400);
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM affiliate_clicks WHERE store_id=? AND affiliate_profile_id=?')->execute([$storeId, $id]);
    $pdo->prepare('DELETE FROM affiliate_conversions WHERE store_id=? AND affiliate_profile_id=?')->execute([$storeId, $id]);
    $pdo->prepare('DELETE FROM affiliate_payouts WHERE store_id=? AND affiliate_profile_id=?')->execute([$storeId, $id]);
    $pdo->prepare('UPDATE orders SET affiliate_profile_id=NULL, affiliate_slug=NULL, affiliate_commission_amount=NULL WHERE store_id=? AND affiliate_profile_id=?')->execute([$storeId, $id]);
    $pdo->prepare('DELETE FROM affiliate_profiles WHERE store_id=? AND id=?')->execute([$storeId, $id]);
    $pdo->commit();
    out(true, ['message'=>'Afiliado removido']);
  }

  out(false, ['error'=>'Ação POST inválida'], 400);
} catch (Throwable $e) {
  if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
  out(false, ['error'=>$e->getMessage()], 500);
}
