<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/melhor_envio_client.php';
require_once __DIR__ . '/shipping_geo.php';

function out($ok,$data=[],$code=200){ http_response_code($code); echo json_encode($ok?array_merge(['success'=>true],$data):['success'=>false,'error'=>$data['error']??'Erro'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function body(){ $r=file_get_contents('php://input'); $j=json_decode($r,true); return is_array($j)?$j:[]; }
function colExists(PDO $pdo,$table,$col){ try{ $st=$pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?"); $st->execute([$col]); return (bool)$st->fetch(); }catch(Throwable $e){ return false; } }
function tableExists(PDO $pdo,$table){ try{ $st=$pdo->prepare("SHOW TABLES LIKE ?"); $st->execute([$table]); return (bool)$st->fetchColumn(); }catch(Throwable $e){ return false; } }
function pickVal(array $row, array $keys, $default=null){ foreach($keys as $k){ if(array_key_exists($k,$row) && $row[$k]!==null) return $row[$k]; } return $default; }
function firstExistingCol(PDO $pdo, $table, array $cands){ foreach($cands as $c){ if(colExists($pdo,$table,$c)) return $c; } return null; }
function normalizeMode($mode){ $m=strtolower((string)$mode); return match($m){ 'fixo','fixed' => 'fixed', 'km','local_km','local' => 'local_km', default => 'melhor_envio' }; }
function getRequestAction(){ if ($_SERVER['REQUEST_METHOD']==='GET') return (string)($_GET['action'] ?? ''); $b=body(); return (string)($b['action'] ?? ''); }
function getStoreId(){ if ($_SERVER['REQUEST_METHOD']==='GET') return (int)($_GET['store_id']??0); $b=body(); return (int)($b['store_id']??0); }
function ensureStore($id){ if($id<=0) out(false,['error'=>'store_id obrigatório'],400); }
function normalizeCep($value){ return mbg_format_cep($value); }
function digits($value){ return mbg_digits_only($value); }

function fetchStoreBase(PDO $pdo, int $storeId): array {
  $base = ['name' => 'Minha Loja', 'owner_name' => '', 'owner_email' => '', 'owner_phone' => ''];
  if (!tableExists($pdo, 'stores')) return $base;
  $st = $pdo->prepare('SELECT name, owner_name, owner_email, owner_phone FROM stores WHERE id=? LIMIT 1');
  $st->execute([$storeId]);
  return $st->fetch(PDO::FETCH_ASSOC) ?: $base;
}

function getOrigin(PDO $pdo, int $storeId): array {
  $store = fetchStoreBase($pdo, $storeId);
  $origin = [
    'cep' => '', 'street' => '', 'number' => '', 'complement' => '', 'neighborhood' => '', 'city' => '', 'state' => '',
    'contact_name' => (string)($store['owner_name'] ?: $store['name'] ?: 'Minha Loja'),
    'email' => (string)($store['owner_email'] ?? ''), 'phone' => (string)($store['owner_phone'] ?? ''), 'document' => '', 'company_name' => (string)($store['name'] ?: 'Minha Loja')
  ];
  if (tableExists($pdo, 'shipping_store_addresses')) {
    $st = $pdo->prepare('SELECT * FROM shipping_store_addresses WHERE store_id=? ORDER BY is_default DESC, id DESC LIMIT 1');
    $st->execute([$storeId]);
    if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
      return [
        'cep' => (string)($row['cep'] ?? ''), 'street' => (string)($row['street'] ?? ''), 'number' => (string)($row['number'] ?? ''), 'complement' => (string)($row['complement'] ?? ''),
        'neighborhood' => (string)($row['neighborhood'] ?? ''), 'city' => (string)($row['city'] ?? ''), 'state' => strtoupper((string)($row['state'] ?? '')),
        'contact_name' => (string)($row['contact_name'] ?? $origin['contact_name']), 'email' => (string)($row['email'] ?? $origin['email']), 'phone' => (string)($row['phone'] ?? $origin['phone']),
        'document' => (string)($row['document'] ?? ''), 'company_name' => (string)($row['company_name'] ?? $origin['company_name'])
      ];
    }
  }
  if (tableExists($pdo, 'shipping_local_delivery_config')) {
    $st = $pdo->prepare('SELECT * FROM shipping_local_delivery_config WHERE store_id=? LIMIT 1');
    $st->execute([$storeId]);
    if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
      $origin['cep'] = (string)($row['origin_zipcode'] ?? $row['origin_cep'] ?? '');
    }
  }
  return $origin;
}

function saveOrigin(PDO $pdo, int $storeId, array $payload): void {
  if (!tableExists($pdo, 'shipping_store_addresses')) return;
  $cep = normalizeCep($payload['origin_cep'] ?? $payload['cep'] ?? '');
  $street = trim((string)($payload['origin_street'] ?? $payload['street'] ?? ''));
  $number = trim((string)($payload['origin_number'] ?? $payload['number'] ?? ''));
  $complement = trim((string)($payload['origin_complement'] ?? $payload['complement'] ?? ''));
  $neighborhood = trim((string)($payload['origin_neighborhood'] ?? $payload['neighborhood'] ?? ''));
  $city = trim((string)($payload['origin_city'] ?? $payload['city'] ?? ''));
  $state = strtoupper(trim((string)($payload['origin_state'] ?? $payload['state'] ?? '')));
  $contactName = trim((string)($payload['origin_contact_name'] ?? $payload['contact_name'] ?? ''));
  $email = trim((string)($payload['origin_email'] ?? $payload['email'] ?? ''));
  $phone = trim((string)($payload['origin_phone'] ?? $payload['phone'] ?? ''));
  $document = trim((string)($payload['origin_document'] ?? $payload['document'] ?? ''));
  $companyName = trim((string)($payload['origin_company_name'] ?? $payload['company_name'] ?? ''));
  $store = fetchStoreBase($pdo, $storeId);
  $contactName = $contactName ?: (string)($store['owner_name'] ?: $store['name'] ?: 'Minha Loja');
  $companyName = $companyName ?: (string)($store['name'] ?: 'Minha Loja');
  $email = $email ?: (string)($store['owner_email'] ?? '');
  $phone = $phone ?: (string)($store['owner_phone'] ?? '');

  $st = $pdo->prepare("INSERT INTO shipping_store_addresses (store_id, company_name, contact_name, document, email, phone, cep, street, number, complement, neighborhood, city, state, is_default, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),NOW()) ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), contact_name=VALUES(contact_name), document=VALUES(document), email=VALUES(email), phone=VALUES(phone), cep=VALUES(cep), street=VALUES(street), number=VALUES(number), complement=VALUES(complement), neighborhood=VALUES(neighborhood), city=VALUES(city), state=VALUES(state), is_default=1, updated_at=NOW()");
  $st->execute([$storeId,$companyName,$contactName,$document,$email,$phone,$cep,$street,$number,$complement,$neighborhood,$city,$state]);
}

function ensureValidOriginForMe(array $origin): void {
  $required = [
    'origin_cep' => $origin['cep'] ?? '',
    'origin_street' => $origin['street'] ?? '',
    'origin_number' => $origin['number'] ?? '',
    'origin_neighborhood' => $origin['neighborhood'] ?? '',
    'origin_city' => $origin['city'] ?? '',
    'origin_state' => $origin['state'] ?? '',
    'origin_contact_name' => $origin['contact_name'] ?? '',
    'origin_phone' => $origin['phone'] ?? '',
  ];
  $missing = [];
  foreach ($required as $k => $v) if (trim((string)$v) === '') $missing[] = $k;
  if ($missing) out(false,['error'=>'Preencha a origem da loja antes de usar o Melhor Envio. Faltando: '.implode(', ', $missing)],422);
}

function calculateKmQuote(PDO $pdo, int $storeId, string $destCep): array {
  if (!tableExists($pdo,'shipping_local_delivery_config')) return ['ok'=>false,'error'=>'Configuração de entrega por KM não encontrada.'];
  $st=$pdo->prepare('SELECT * FROM shipping_local_delivery_config WHERE store_id=? LIMIT 1'); $st->execute([$storeId]); $r=$st->fetch(PDO::FETCH_ASSOC)?:[];
  $origin = getOrigin($pdo, $storeId);
  $originCep = digits($origin['cep'] ?: ($r['origin_zipcode'] ?? $r['origin_cep'] ?? ''));
  if (strlen($originCep) !== 8) return ['ok'=>false,'error'=>'CEP de origem não configurado corretamente.'];
  $destCepDigits = digits($destCep);
  if (strlen($destCepDigits) !== 8) return ['ok'=>false,'error'=>'CEP de destino inválido.'];

  $originLookup = mbg_lookup_cep($originCep);
  if (!$originLookup['ok']) return ['ok'=>false,'error'=>'CEP de origem inválido.'];
  $destLookup = mbg_lookup_cep($destCepDigits);
  if (!$destLookup['ok']) return ['ok'=>false,'error'=>'CEP de destino não encontrado.'];

  $originGeo = mbg_geocode_cep($originCep, $originLookup['data']['city'] ?? null, $originLookup['data']['state'] ?? null);
  if (!$originGeo['ok']) return ['ok'=>false,'error'=>$originGeo['error']];
  $destGeo = mbg_geocode_cep($destCepDigits, $destLookup['data']['city'] ?? null, $destLookup['data']['state'] ?? null);
  if (!$destGeo['ok']) return ['ok'=>false,'error'=>$destGeo['error']];

  $distance = round(mbg_haversine_km($originGeo['data']['lat'],$originGeo['data']['lng'],$destGeo['data']['lat'],$destGeo['data']['lng']), 2);
  $pricePerKm = (float)pickVal($r,['price_per_km'],0);
  $maxRadius = (float)pickVal($r,['max_distance_km','max_radius_km'],0);
  $minFee = (float)pickVal($r,['min_delivery_fee'],0);
  $maxFee = (float)pickVal($r,['max_delivery_fee'],0);
  $baseDays = (int)pickVal($r,['base_delivery_days','base_days'],1);
  $extraEvery10 = (float)pickVal($r,['extra_days_per_10km'],0);
  if ($maxRadius > 0 && $distance > $maxRadius) {
    return ['ok'=>false,'error'=>'CEP fora do raio máximo configurado para entrega local.','distance_km'=>$distance,'radius_km'=>$maxRadius];
  }
  $price = $distance * $pricePerKm;
  if ($minFee > 0 && $price < $minFee) $price = $minFee;
  if ($maxFee > 0 && $price > $maxFee) $price = $maxFee;
  $days = max(1, $baseDays + (int)floor(($distance / 10) * $extraEvery10));
  return ['ok'=>true,'distance_km'=>$distance,'price'=>round($price,2),'days'=>$days,'origin'=>$originLookup['data'],'destination'=>$destLookup['data']];
}

function getMeConfig(PDO $pdo, int $storeId): array {
  $cfg=['token'=>'','environment'=>'sandbox'];
  if (!tableExists($pdo,'shipping_melhor_envio_config')) return $cfg;
  $st=$pdo->prepare('SELECT * FROM shipping_melhor_envio_config WHERE store_id=? LIMIT 1'); $st->execute([$storeId]);
  if($r=$st->fetch(PDO::FETCH_ASSOC)){
    $cfg['token']=(string)($r['api_token'] ?? '');
    $cfg['environment']=($r['environment'] ?? 'sandbox') === 'production' ? 'production' : 'sandbox';
  }
  return $cfg;
}

try{
  $pdo = getConnection();
  $method=$_SERVER['REQUEST_METHOD'];
  $storeId=getStoreId(); ensureStore($storeId);
  $action = getRequestAction();

  if($method==='GET' && $action==='simulate_km'){
    $dest = (string)($_GET['dest_cep'] ?? '');
    $result = calculateKmQuote($pdo, $storeId, $dest);
    if (!$result['ok']) out(false,['error'=>$result['error']],422);
    out(true,$result);
  }

  if($method==='GET' && $action==='validate_cep'){
    $cep = (string)($_GET['cep'] ?? '');
    $lookup = mbg_lookup_cep($cep);
    if (!$lookup['ok']) out(false,['error'=>$lookup['error']],422);
    out(true,['data'=>$lookup['data']]);
  }

  if($method==='GET'){
    $settings = [
      'shipping_mode'=>'melhor_envio',
      'dim_enabled'=>false,'dim_height_cm'=>'','dim_width_cm'=>'','dim_length_cm'=>'','dim_weight_kg'=>'',
      'fixed_price'=>'','fixed_days'=>'','fixed_free_over_enabled'=>false,'fixed_free_over_amount'=>'',
      'km_origin_cep'=>'','km_price_per_km'=>'','km_max_radius_km'=>'','km_base_days'=>'','km_min_fee'=>'','km_max_fee'=>'','km_extra_days_per_10km'=>'',
      'melhor_envio_token'=>'','melhor_envio_env'=>'sandbox','melhor_envio_default'=>false,
      'origin_cep'=>'','origin_street'=>'','origin_number'=>'','origin_complement'=>'','origin_neighborhood'=>'','origin_city'=>'','origin_state'=>'','origin_contact_name'=>'','origin_email'=>'','origin_phone'=>'','origin_document'=>'','origin_company_name'=>'',
      'services'=>['PAC'=>false,'SEDEX'=>false,'Jadlog'=>false,'Azul Cargo'=>false], 'rules'=>[]
    ];
    if(tableExists($pdo,'shipping_settings')){
      $st=$pdo->prepare('SELECT * FROM shipping_settings WHERE store_id=? LIMIT 1'); $st->execute([$storeId]);
      if($r=$st->fetch(PDO::FETCH_ASSOC)){
        $settings['shipping_mode']= normalizeMode((string)pickVal($r,['active_mode','shipping_mode'],$settings['shipping_mode']));
        $settings['dim_enabled']= (bool)($r['use_default_dimensions'] ?? 0);
        $settings['dim_height_cm']= (string)($r['default_height_cm'] ?? '');
        $settings['dim_width_cm']= (string)($r['default_width_cm'] ?? '');
        $settings['dim_length_cm']= (string)($r['default_length_cm'] ?? '');
        $settings['dim_weight_kg']= (string)($r['default_weight_kg'] ?? '');
      }
    }
    if(tableExists($pdo,'shipping_fixed_config')){
      $st=$pdo->prepare('SELECT * FROM shipping_fixed_config WHERE store_id=? LIMIT 1'); $st->execute([$storeId]);
      if($r=$st->fetch(PDO::FETCH_ASSOC)){
        $settings['fixed_price']=(string)pickVal($r,['price','fixed_price'],'');
        $settings['fixed_days']=(string)pickVal($r,['estimated_days'],'');
        $settings['fixed_free_over_enabled']=(bool)pickVal($r,['free_shipping_enabled','enable_free_shipping_over'],0);
        $settings['fixed_free_over_amount']=(string)($r['free_shipping_min_amount'] ?? '');
      }
    }
    if(tableExists($pdo,'shipping_local_delivery_config')){
      $st=$pdo->prepare('SELECT * FROM shipping_local_delivery_config WHERE store_id=? LIMIT 1'); $st->execute([$storeId]);
      if($r=$st->fetch(PDO::FETCH_ASSOC)){
        $settings['km_origin_cep']=(string)pickVal($r,['origin_cep','origin_zipcode'],'');
        $settings['km_price_per_km']=(string)pickVal($r,['price_per_km'],'');
        $settings['km_max_radius_km']=(string)pickVal($r,['max_distance_km','max_radius_km'],'');
        $settings['km_base_days']=(string)pickVal($r,['base_delivery_days','base_days'],'');
        $settings['km_min_fee']=(string)pickVal($r,['min_delivery_fee'],'');
        $settings['km_max_fee']=(string)pickVal($r,['max_delivery_fee'],'');
        $settings['km_extra_days_per_10km']=(string)pickVal($r,['extra_days_per_10km'],'');
      }
    }
    if(tableExists($pdo,'shipping_melhor_envio_config')){
      $st=$pdo->prepare('SELECT * FROM shipping_melhor_envio_config WHERE store_id=? LIMIT 1'); $st->execute([$storeId]);
      if($r=$st->fetch(PDO::FETCH_ASSOC)){
        $settings['melhor_envio_token']=$r['api_token'] ?? '';
        $settings['melhor_envio_env']=($r['environment'] ?? 'sandbox') === 'production' ? 'production' : 'sandbox';
        $settings['melhor_envio_default']=(bool)($r['set_as_default'] ?? 0);
      }
    }
    $origin = getOrigin($pdo, $storeId);
    foreach ($origin as $k=>$v) $settings['origin_'.$k]=$v;
    if(tableExists($pdo,'shipping_melhor_envio_services')){
      $st=$pdo->prepare('SELECT * FROM shipping_melhor_envio_services WHERE store_id=?'); $st->execute([$storeId]);
      foreach($st->fetchAll(PDO::FETCH_ASSOC) as $r){
        $code = strtolower((string)pickVal($r,['service_code'],''));
        $label = (string)pickVal($r,['service_label','service_name'],$code);
        $map = ['pac'=>'PAC','sedex'=>'SEDEX','jadlog'=>'Jadlog','azul_cargo'=>'Azul Cargo','azul cargo'=>'Azul Cargo'];
        $name = $map[$code] ?? $label;
        if($name==='') continue;
        $settings['services'][$name]=(bool)pickVal($r,['is_enabled','enabled'],0);
      }
    }
    if(tableExists($pdo,'shipping_rules')){
      $st=$pdo->prepare('SELECT * FROM shipping_rules WHERE store_id=? ORDER BY id DESC'); $st->execute([$storeId]);
      $settings['rules']=$st->fetchAll(PDO::FETCH_ASSOC);
    }
    out(true,['data'=>$settings]);
  }

  $b=body(); $action=$b['action'] ?? 'save_all'; $payload=$b['payload'] ?? [];

  if($action==='save_mode'){
    $mode=normalizeMode($payload['shipping_mode'] ?? 'melhor_envio');
    if(tableExists($pdo,'shipping_settings')){
      $hasUpdatedAt = colExists($pdo,'shipping_settings','updated_at');
      $sql = "INSERT INTO shipping_settings (store_id, active_mode) VALUES (?,?) ON DUPLICATE KEY UPDATE active_mode=VALUES(active_mode)" . ($hasUpdatedAt ? ", updated_at=CURRENT_TIMESTAMP" : "");
      $pdo->prepare($sql)->execute([$storeId,$mode]);
    }
    out(true,['message'=>'Modo salvo']);
  }

  if($action==='save_dimensions'){
    if(tableExists($pdo,'shipping_settings')){
      $pdo->prepare("INSERT INTO shipping_settings (store_id,use_default_dimensions,default_height_cm,default_width_cm,default_length_cm,default_weight_kg) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE use_default_dimensions=VALUES(use_default_dimensions),default_height_cm=VALUES(default_height_cm),default_width_cm=VALUES(default_width_cm),default_length_cm=VALUES(default_length_cm),default_weight_kg=VALUES(default_weight_kg),updated_at=CURRENT_TIMESTAMP")
      ->execute([$storeId,(int)!empty($payload['dim_enabled']), $payload['dim_height_cm']?:null,$payload['dim_width_cm']?:null,$payload['dim_length_cm']?:null,$payload['dim_weight_kg']?:null]);
    }
    out(true,['message'=>'Dimensões salvas']);
  }

  if ($action === 'validate_cep') {
    $lookup = mbg_lookup_cep((string)($payload['cep'] ?? ''));
    if (!$lookup['ok']) out(false,['error'=>$lookup['error']],422);
    out(true,['data'=>$lookup['data']]);
  }

  if($action==='save_melhor_envio' || $action==='save_all'){
    if(tableExists($pdo,'shipping_melhor_envio_config')){
      $pdo->prepare("INSERT INTO shipping_melhor_envio_config (store_id,api_token,environment,set_as_default,integration_status) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE api_token=VALUES(api_token), environment=VALUES(environment), set_as_default=VALUES(set_as_default), integration_status=VALUES(integration_status), updated_at=CURRENT_TIMESTAMP")
      ->execute([$storeId, trim((string)($payload['melhor_envio_token'] ?? $payload['me_token'] ?? '')), ((($payload['melhor_envio_env'] ?? $payload['me_environment'] ?? 'sandbox')==='production')?'production':'sandbox'), (int)!empty($payload['melhor_envio_default'] ?? $payload['me_is_default'] ?? false), 'configured']);
    }
    saveOrigin($pdo, $storeId, $payload);
    if(tableExists($pdo,'shipping_melhor_envio_services')){
      $pdo->prepare('DELETE FROM shipping_melhor_envio_services WHERE store_id=?')->execute([$storeId]);
      foreach(($payload['services'] ?? $payload['me_services'] ?? []) as $svc=>$enabled){
        $item = is_array($enabled) ? $enabled : ['service_name'=>$svc, 'is_enabled'=>$enabled];
        $raw=(string)($item['service_name'] ?? $item['label'] ?? $svc); $norm=strtolower(trim($raw));
        $codeMap=['PAC'=>'pac','SEDEX'=>'sedex','Jadlog'=>'jadlog','Azul Cargo'=>'azul_cargo','azul cargo'=>'azul_cargo','pac'=>'pac','sedex'=>'sedex','jadlog'=>'jadlog','azul_cargo'=>'azul_cargo'];
        $labelMap=['pac'=>'PAC','sedex'=>'SEDEX','jadlog'=>'Jadlog','azul_cargo'=>'Azul Cargo'];
        $code=$item['service_code'] ?? ($codeMap[$raw] ?? $codeMap[$norm] ?? preg_replace('/[^a-z0-9_]+/','_',$norm));
        $label=$labelMap[$code] ?? $raw;
        $isEnabled = (int)!empty($item['is_enabled'] ?? $enabled);
        if(colExists($pdo,'shipping_melhor_envio_services','service_label')) $pdo->prepare('INSERT INTO shipping_melhor_envio_services (store_id,service_code,service_label,is_enabled) VALUES (?,?,?,?)')->execute([$storeId,$code,$label,$isEnabled]);
        else $pdo->prepare('INSERT INTO shipping_melhor_envio_services (store_id,service_code,is_enabled) VALUES (?,?,?)')->execute([$storeId,$code,$isEnabled]);
      }
    }
    if($action==='save_melhor_envio') out(true,['message'=>'Configurações do Melhor Envio salvas']);
  }

  if($action==='save_fixed' || $action==='save_all'){
    if(tableExists($pdo,'shipping_fixed_config')){
      $priceCol = firstExistingCol($pdo,'shipping_fixed_config',['price','fixed_price']) ?: 'fixed_price';
      $freeCol = firstExistingCol($pdo,'shipping_fixed_config',['free_shipping_enabled','enable_free_shipping_over']) ?: 'enable_free_shipping_over';
      $hasUpdatedAt = colExists($pdo,'shipping_fixed_config','updated_at');
      $sql = "INSERT INTO shipping_fixed_config (store_id,{$priceCol},estimated_days,{$freeCol},free_shipping_min_amount) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE {$priceCol}=VALUES({$priceCol}), estimated_days=VALUES(estimated_days), {$freeCol}=VALUES({$freeCol}), free_shipping_min_amount=VALUES(free_shipping_min_amount)" . ($hasUpdatedAt ? ", updated_at=CURRENT_TIMESTAMP" : "");
      $pdo->prepare($sql)->execute([$storeId, (($payload['fixed_price'] ?? '')!==''?$payload['fixed_price']:null), (($payload['fixed_days'] ?? $payload['fixed_deadline_days'] ?? '')!==''?($payload['fixed_days'] ?? $payload['fixed_deadline_days']):null), (int)!empty($payload['fixed_free_over_enabled'] ?? $payload['fixed_free_shipping_enabled'] ?? false), (($payload['fixed_free_over_amount'] ?? $payload['fixed_free_shipping_min'] ?? '')!==''?($payload['fixed_free_over_amount'] ?? $payload['fixed_free_shipping_min']):null)]);
    }
    if($action==='save_fixed') out(true,['message'=>'Frete fixo salvo']);
  }

  if($action==='save_km' || $action==='save_all'){
    saveOrigin($pdo, $storeId, $payload);
    if(tableExists($pdo,'shipping_local_delivery_config')){
      $originCol = firstExistingCol($pdo,'shipping_local_delivery_config',['origin_cep','origin_zipcode']) ?: 'origin_zipcode';
      $radiusCol = firstExistingCol($pdo,'shipping_local_delivery_config',['max_distance_km','max_radius_km']) ?: 'max_radius_km';
      $daysCol = firstExistingCol($pdo,'shipping_local_delivery_config',['base_delivery_days','base_days']) ?: 'base_days';
      $hasUpdatedAt = colExists($pdo,'shipping_local_delivery_config','updated_at');
      $extraCol = firstExistingCol($pdo,'shipping_local_delivery_config',['extra_days_per_10km']) ?: 'extra_days_per_10km';
      $sql = "INSERT INTO shipping_local_delivery_config (store_id,{$originCol},price_per_km,{$radiusCol},{$daysCol},min_delivery_fee,max_delivery_fee,{$extraCol}) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE {$originCol}=VALUES({$originCol}), price_per_km=VALUES(price_per_km), {$radiusCol}=VALUES({$radiusCol}), {$daysCol}=VALUES({$daysCol}), min_delivery_fee=VALUES(min_delivery_fee), max_delivery_fee=VALUES(max_delivery_fee), {$extraCol}=VALUES({$extraCol})" . ($hasUpdatedAt ? ", updated_at=CURRENT_TIMESTAMP" : "");
      $pdo->prepare($sql)->execute([$storeId, normalizeCep($payload['km_origin_cep'] ?? $payload['origin_cep'] ?? null), ((($payload['km_price_per_km'] ?? '')!=='')?$payload['km_price_per_km']:null), ((($payload['km_max_radius_km'] ?? '')!=='')?$payload['km_max_radius_km']:null), ((($payload['km_base_days'] ?? '')!=='')?$payload['km_base_days']:null), ((($payload['km_min_fee'] ?? '')!=='')?$payload['km_min_fee']:null), ((($payload['km_max_fee'] ?? '')!=='')?$payload['km_max_fee']:null), ((($payload['km_extra_days_per_10km'] ?? '')!=='')?$payload['km_extra_days_per_10km']:null)]);
    }
    if($action==='save_km') out(true,['message'=>'Entrega por KM salva']);
  }

  if($action==='simulate_km'){
    $dest = (string)($payload['dest_cep'] ?? $_GET['dest_cep'] ?? '');
    $result = calculateKmQuote($pdo, $storeId, $dest);
    if (!$result['ok']) out(false,['error'=>$result['error']],422);
    out(true,$result);
  }

  if($action==='test_melhor_envio'){
    $cfg = getMeConfig($pdo,$storeId);
    $token = trim((string)($payload['me_token'] ?? $payload['melhor_envio_token'] ?? $cfg['token']));
    $env = (string)($payload['me_environment'] ?? $payload['melhor_envio_env'] ?? $cfg['environment'] ?? 'sandbox');
    $originPreview = [
      'cep' => (string)($payload['origin_cep'] ?? ''), 'street' => (string)($payload['origin_street'] ?? ''), 'number' => (string)($payload['origin_number'] ?? ''),
      'neighborhood' => (string)($payload['origin_neighborhood'] ?? ''), 'city' => (string)($payload['origin_city'] ?? ''), 'state' => (string)($payload['origin_state'] ?? ''),
      'contact_name' => (string)($payload['origin_contact_name'] ?? ''), 'phone' => (string)($payload['origin_phone'] ?? '')
    ];
    if (trim($originPreview['cep']) === '') $originPreview = getOrigin($pdo, $storeId);
    ensureValidOriginForMe($originPreview);
    if ($token === '') out(false,['error'=>'Cole o Access Token do Melhor Envio. Client ID e Secret sozinhos não funcionam nesse campo.'],422);
    $res = mbg_me_request($env, $token, 'GET', '/api/v2/me');
    if (tableExists($pdo,'shipping_melhor_envio_config')) {
      $status = $res['ok'] ? 'tested_ok' : 'error';
      $msg = $res['ok'] ? null : substr((string)$res['error'], 0, 500);
      $pdo->prepare("INSERT INTO shipping_melhor_envio_config (store_id,api_token,environment,integration_status,last_tested_at,last_error_message) VALUES (?,?,?,?,NOW(),?) ON DUPLICATE KEY UPDATE api_token=VALUES(api_token), environment=VALUES(environment), integration_status=VALUES(integration_status), last_tested_at=NOW(), last_error_message=VALUES(last_error_message), updated_at=CURRENT_TIMESTAMP")
        ->execute([$storeId,$token,$env==='production'?'production':'sandbox',$status,$msg]);
    }
    if(!$res['ok']) out(false,['error'=>$res['error'] ?: 'Falha ao testar conexão com o Melhor Envio.'],422);
    out(true,['message'=>'Conexão testada com sucesso.','data'=>$res['data']]);
  }

  out(true,['message'=>'Salvo']);
}catch(Throwable $e){ out(false,['error'=>$e->getMessage()],500); }
