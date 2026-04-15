<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
require_once __DIR__.'/db.php';

function out($ok,$data=[],$code=200){ http_response_code($code); echo json_encode($ok?array_merge(['success'=>true],$data):['success'=>false,'error'=>($data['error']??'Erro')], JSON_UNESCAPED_UNICODE); exit; }
function body(){ $j=json_decode(file_get_contents('php://input'), true); return is_array($j)?$j:[]; }
function storeId(){ if($_SERVER['REQUEST_METHOD']==='GET') return (int)($_GET['store_id']??0); $b=body(); return (int)($b['store_id']??0); }
function ensureStore($id){ if($id<=0) out(false,['error'=>'store_id obrigatório'],400); }
function cfgKey($storeId,$key){ return "store:{$storeId}:{$key}"; }
function getCfg(PDO $pdo,$storeId,$key,$default=null){ $st=$pdo->prepare('SELECT config_value FROM platform_config WHERE config_key=? LIMIT 1'); $st->execute([cfgKey($storeId,$key)]); $v=$st->fetchColumn(); return $v===false?$default:$v; }
function setCfg(PDO $pdo,$storeId,$key,$val){ $full=cfgKey($storeId,$key); $st=$pdo->prepare('SELECT id FROM platform_config WHERE config_key=? LIMIT 1'); $st->execute([$full]); $id=$st->fetchColumn(); if($id){ $pdo->prepare('UPDATE platform_config SET config_value=? WHERE id=?')->execute([(string)$val,$id]); } else { $pdo->prepare('INSERT INTO platform_config (config_key, config_value) VALUES (?,?)')->execute([$full,(string)$val]); } }
function providerAliases(){
  return [
    'mercado_livre'=>['mercado_livre','mercadolivre','ml','mercado-livre'],
    'shopee'=>['shopee'],
    'amazon'=>['amazon'],
    'magalu'=>['magalu','magazine_luiza','magazine-luiza'],
    'shein'=>['shein'],
    'aliexpress'=>['aliexpress','ali_express','ali-express'],
    'tiktok_shop'=>['tiktok_shop','tiktok','tik_tok_shop','tik-tok-shop'],
  ];
}
function normalizeProvider($p){ $p=strtolower(trim((string)$p)); foreach(providerAliases() as $canon=>$alts){ if(in_array($p,$alts,true)) return $canon; } return $p; }
function logEventType($action){
  return match($action){
    'install' => 'install',
    'save_connection' => 'auth',
    'save_sync' => 'manual',
    'save_status' => 'manual',
    'remove' => 'disconnect',
    default => 'manual'
  };
}

try {
  $pdo = getConnection();
  $storeId = storeId(); ensureStore($storeId);

  if ($_SERVER['REQUEST_METHOD']==='GET') {
    $action = $_GET['action'] ?? 'summary';

    if ($action === 'summary') {
      $catalogSql = 'SELECT id, code, name, description, logo_key, status, oauth_supported, sort_order, is_active FROM marketplace_catalog WHERE is_active=1 ORDER BY sort_order ASC, id ASC';
      $catalog = $pdo->query($catalogSql)->fetchAll(PDO::FETCH_ASSOC);

      $sql = "SELECT mi.*, mc.code, mc.name, mc.description, mc.status AS catalog_status_db, mc.logo_key
              FROM marketplace_integrations mi
              INNER JOIN marketplace_catalog mc ON mc.id = mi.marketplace_catalog_id
              WHERE mi.store_id=?";
      $st = $pdo->prepare($sql); $st->execute([$storeId]);
      $rows = $st->fetchAll(PDO::FETCH_ASSOC);
      $by = [];
      foreach($rows as $r){ $by[normalizeProvider($r['code'])] = $r; }

      $integrations = [];
      foreach($catalog as $c){
        $provider = normalizeProvider($c['code']);
        $r = $by[$provider] ?? null;
        $catalogStatus = (($c['status'] ?? 'available') === 'soon') ? 'soon' : (($c['status'] ?? 'available') === 'disabled' ? 'disabled' : 'available');
        $connStatus = $r['connection_status'] ?? null;
        $status = 'not_installed';
        if ($r) {
          if (in_array($connStatus, ['connected','authorized'], true)) $status = 'connected';
          elseif (in_array($connStatus, ['pending','error','disconnected'], true)) $status = 'installed';
          else $status = 'installed';
        }
        $integrations[] = [
          'provider' => $provider,
          'catalog_code' => $c['code'],
          'name' => $c['name'],
          'description' => $c['description'],
          'catalog_status' => $catalogStatus,
          'integration_id' => $r['id'] ?? null,
          'status' => $status,
          'connection_status' => $connStatus,
          'linked_store_name' => $r['linked_store_name'] ?? null,
          'last_sync_at' => $r['last_sync_at'] ?? null,
          'last_sync_status' => $r['last_sync_status'] ?? null,
          'last_sync_message' => $r['last_sync_message'] ?? null,
          'sync_catalog' => (int)($r['sync_catalog'] ?? 1),
          'sync_orders' => (int)($r['sync_orders'] ?? 1),
          'sync_stock' => (int)($r['sync_stock'] ?? 1),
          'sync_prices' => (int)($r['sync_prices'] ?? 0),
          'app_id' => $r['app_id'] ?? null,
          'environment' => $r['environment'] ?? 'production',
          'price_markup_percent' => (float)($r['price_markup_percent'] ?? 0),
          'stock_reserve_qty' => (int)($r['stock_reserve_qty'] ?? 0),
        ];
      }

      $settings = [
        'mobile_notifications' => (int)getCfg($pdo, $storeId, 'marketplace.mobile_notifications', '1'),
        'default_catalog_sync_interval_min' => (int)getCfg($pdo, $storeId, 'marketplace.catalog_sync_interval_min', '30'),
        'default_order_sync_interval_min' => (int)getCfg($pdo, $storeId, 'marketplace.order_sync_interval_min', '5'),
        'auto_sync_enabled' => (int)getCfg($pdo, $storeId, 'marketplace.auto_sync_enabled', '1'),
        'error_alerts_enabled' => (int)getCfg($pdo, $storeId, 'marketplace.error_alerts_enabled', '1'),
      ];

      $logsSql = "SELECT msl.id, msl.level, msl.message, msl.event_type, msl.created_at, mc.code, mc.name
                  FROM marketplace_sync_logs msl
                  INNER JOIN marketplace_integrations mi ON mi.id = msl.marketplace_integration_id
                  INNER JOIN marketplace_catalog mc ON mc.id = mi.marketplace_catalog_id
                  WHERE msl.store_id=?
                  ORDER BY msl.id DESC
                  LIMIT 20";
      $st = $pdo->prepare($logsSql); $st->execute([$storeId]);
      $logs = [];
      while($r = $st->fetch(PDO::FETCH_ASSOC)){
        $logs[] = [
          'provider' => normalizeProvider($r['code']),
          'provider_name' => $r['name'],
          'event_type' => $r['event_type'],
          'level' => $r['level'],
          'message' => $r['message'],
          'created_at' => $r['created_at'],
        ];
      }

      out(true, ['integrations'=>$integrations, 'settings'=>$settings, 'activities'=>$logs]);
    }

    if ($action === 'detail') {
      $provider = normalizeProvider($_GET['provider'] ?? '');
      if ($provider === '') out(false, ['error'=>'provider obrigatório'], 400);
      $sql = "SELECT mi.*, mc.code, mc.name, mc.description
              FROM marketplace_integrations mi
              INNER JOIN marketplace_catalog mc ON mc.id = mi.marketplace_catalog_id
              WHERE mi.store_id=?";
      $st = $pdo->prepare($sql); $st->execute([$storeId]);
      $integration = null;
      while($r = $st->fetch(PDO::FETCH_ASSOC)){
        if (normalizeProvider($r['code']) === $provider){ $integration = $r; break; }
      }

      $logs = [];
      if ($integration) {
        $st = $pdo->prepare('SELECT event_type, level, message, details_json, created_at FROM marketplace_sync_logs WHERE store_id=? AND marketplace_integration_id=? ORDER BY id DESC LIMIT 50');
        $st->execute([$storeId, $integration['id']]);
        $logs = $st->fetchAll(PDO::FETCH_ASSOC);
      }
      out(true, ['integration'=>$integration, 'logs'=>$logs]);
    }

    out(false, ['error'=>'Ação GET inválida'], 400);
  }

  $b = body();
  $action = $b['action'] ?? '';
  $payload = is_array($b['payload'] ?? null) ? $b['payload'] : [];

  if ($action === 'save_global_settings') {
    foreach ([
      'marketplace.mobile_notifications' => (int)!empty($payload['mobile_notifications']),
      'marketplace.catalog_sync_interval_min' => (int)($payload['default_catalog_sync_interval_min'] ?? 30),
      'marketplace.order_sync_interval_min' => (int)($payload['default_order_sync_interval_min'] ?? 5),
      'marketplace.auto_sync_enabled' => (int)!empty($payload['auto_sync_enabled']),
      'marketplace.error_alerts_enabled' => (int)!empty($payload['error_alerts_enabled']),
    ] as $k => $v) setCfg($pdo, $storeId, $k, (string)$v);
    out(true, ['message'=>'Configurações globais salvas']);
  }

  if (!in_array($action, ['install','save_connection','save_sync','save_status','remove'], true)) {
    out(false, ['error'=>'Ação POST inválida'], 400);
  }

  $provider = normalizeProvider($payload['provider'] ?? '');
  if ($provider === '') out(false, ['error'=>'provider obrigatório'], 400);

  $st = $pdo->query('SELECT id, code, name FROM marketplace_catalog WHERE is_active=1');
  $catalog = null;
  while($r = $st->fetch(PDO::FETCH_ASSOC)){
    if (normalizeProvider($r['code']) === $provider){ $catalog = $r; break; }
  }
  if (!$catalog) out(false, ['error'=>'Marketplace não encontrado no catálogo'], 404);

  $st = $pdo->prepare('SELECT * FROM marketplace_integrations WHERE store_id=? AND marketplace_catalog_id=? LIMIT 1');
  $st->execute([$storeId, $catalog['id']]);
  $existing = $st->fetch(PDO::FETCH_ASSOC);

  if ($action === 'remove') {
    if ($existing) {
      $pdo->prepare('UPDATE marketplace_integrations SET connection_status=?, is_active=0, updated_at=CURRENT_TIMESTAMP WHERE id=? AND store_id=?')
          ->execute(['disconnected', $existing['id'], $storeId]);
      $pdo->prepare('INSERT INTO marketplace_sync_logs (store_id, marketplace_integration_id, event_type, level, message, details_json) VALUES (?,?,?,?,?,?)')
          ->execute([$storeId, $existing['id'], 'disconnect', 'info', ($payload['log_message'] ?? 'Integração desconectada'), json_encode($payload, JSON_UNESCAPED_UNICODE)]);
    }
    out(true, ['message'=>'Integração removida']);
  }

  if (!$existing) {
    $pdo->prepare('INSERT INTO marketplace_integrations (store_id, marketplace_catalog_id, connection_status, is_active) VALUES (?,?,?,1)')
        ->execute([$storeId, $catalog['id'], 'pending']);
    $existingId = (int)$pdo->lastInsertId();
    $st = $pdo->prepare('SELECT * FROM marketplace_integrations WHERE id=? LIMIT 1'); $st->execute([$existingId]);
    $existing = $st->fetch(PDO::FETCH_ASSOC);
  }

  $sets=[]; $vals=[];
  foreach (['app_id','app_secret','access_token','refresh_token','external_seller_id','external_shop_id','linked_store_name','last_sync_message'] as $c) {
    if (array_key_exists($c, $payload)) { $sets[] = "$c=?"; $vals[] = $payload[$c]; }
  }
  if (array_key_exists('environment', $payload)) {
    $env = in_array($payload['environment'], ['sandbox','production'], true) ? $payload['environment'] : 'production';
    $sets[]='environment=?'; $vals[]=$env;
  }
  foreach (['sync_catalog','sync_orders','sync_stock','sync_prices'] as $c) {
    if (array_key_exists($c, $payload)) { $sets[]="$c=?"; $vals[]=(int)!empty($payload[$c]); }
  }
  if (array_key_exists('price_markup_percent', $payload)) { $sets[]='price_markup_percent=?'; $vals[]=(float)$payload['price_markup_percent']; }
  if (array_key_exists('stock_reserve_qty', $payload)) { $sets[]='stock_reserve_qty=?'; $vals[]=(int)$payload['stock_reserve_qty']; }
  if (array_key_exists('mark_synced', $payload) && !empty($payload['mark_synced'])) { $sets[]='last_sync_at=NOW()'; }
  if (array_key_exists('last_sync_status', $payload)) {
    $lss = in_array($payload['last_sync_status'], ['success','warning','error'], true) ? $payload['last_sync_status'] : null;
    $sets[]='last_sync_status=?'; $vals[]=$lss;
  }
  if (array_key_exists('status', $payload)) {
    $map = ['connected'=>'connected','authorized'=>'authorized','installed'=>'pending','pending_auth'=>'pending','pending'=>'pending','error'=>'error','disconnected'=>'disconnected'];
    $cs = $map[$payload['status']] ?? 'pending';
    $sets[]='connection_status=?'; $vals[]=$cs;
  }
  if (array_key_exists('meta_json', $payload) || array_key_exists('metadata_json', $payload)) {
    $meta = $payload['metadata_json'] ?? $payload['meta_json'];
    $sets[]='metadata_json=?'; $vals[] = is_string($meta) ? $meta : json_encode($meta, JSON_UNESCAPED_UNICODE);
  }
  if ($sets) {
    $vals[] = (int)$existing['id'];
    $vals[] = $storeId;
    $pdo->prepare('UPDATE marketplace_integrations SET '.implode(', ', $sets).', is_active=1, updated_at=CURRENT_TIMESTAMP WHERE id=? AND store_id=?')->execute($vals);
  }

  $level = in_array(($payload['log_level'] ?? 'info'), ['info','success','warning','error'], true) ? $payload['log_level'] : 'info';
  $message = (string)($payload['log_message'] ?? ('Ação '.$action.' executada em '.$catalog['name']));
  $eventType = logEventType($action);
  $details = json_encode($payload, JSON_UNESCAPED_UNICODE);
  $pdo->prepare('INSERT INTO marketplace_sync_logs (store_id, marketplace_integration_id, event_type, level, message, details_json) VALUES (?,?,?,?,?,?)')
      ->execute([$storeId, (int)$existing['id'], $eventType, $level, $message, $details]);

  out(true, ['message'=>'Integração salva']);

} catch (Throwable $e) {
  out(false, ['error'=>$e->getMessage()], 500);
}
