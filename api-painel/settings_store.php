<?php
header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With'); header('Content-Type: application/json; charset=UTF-8'); if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200);exit;} require_once 'config/database.php';
function sj($d,$s=200){http_response_code($s); echo json_encode($d, JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE); exit;}
function col($pdo,$t,$c){ try{$st=$pdo->prepare("SHOW COLUMNS FROM `$t` LIKE ?");$st->execute([$c]); return (bool)$st->fetch(PDO::FETCH_ASSOC);}catch(Throwable $e){return false;} }
try {
  $store_id=(int)($_GET['store_id'] ?? 0); if($_SERVER['REQUEST_METHOD']==='POST'){ $b=json_decode(file_get_contents('php://input'),true)?:[]; if(!$store_id)$store_id=(int)($b['store_id']??0); }
  if($store_id<=0) throw new Exception('store_id obrigatório');
  $hasDesc=col($pdo,'stores','description'); $hasOwnerPhone=col($pdo,'stores','owner_phone'); $hasSupport=col($pdo,'admin_panel_settings','support_email'); $hasWhatsapp=col($pdo,'admin_panel_settings','whatsapp');
  if($_SERVER['REQUEST_METHOD']==='GET'){
    $storeCols=['id','name','subdomain','active','plan_id']; if($hasDesc)$storeCols[]='description'; if($hasOwnerPhone)$storeCols[]='owner_phone';
    $s=$pdo->prepare('SELECT '.implode(',',$storeCols).' FROM stores WHERE id=? LIMIT 1'); $s->execute([$store_id]); $store=$s->fetch(PDO::FETCH_ASSOC); if(!$store) throw new Exception('Loja não encontrada');
    $c=$pdo->prepare("SELECT id,name,email,whatsapp FROM customers WHERE store_id=? ORDER BY isAdmin DESC, id ASC LIMIT 1"); $c->execute([$store_id]); $customer=$c->fetch(PDO::FETCH_ASSOC) ?: [];
    $aps=[]; if(col($pdo,'admin_panel_settings','store_id')){ try{$a=$pdo->prepare('SELECT * FROM admin_panel_settings WHERE store_id=? LIMIT 1'); $a->execute([$store_id]); $aps=$a->fetch(PDO::FETCH_ASSOC)?:[];}catch(Throwable $e){} }
    $plan=null; $features=[]; if(!empty($store['plan_id'])){ try{$p=$pdo->prepare('SELECT * FROM plans WHERE id=? LIMIT 1');$p->execute([(int)$store['plan_id']]);$plan=$p->fetch(PDO::FETCH_ASSOC);}catch(Throwable $e){} if($plan){ try{$pf=$pdo->prepare('SELECT feature_text,is_highlight,sort_order FROM plan_features WHERE plan_id=? ORDER BY sort_order ASC,id ASC');$pf->execute([(int)$store['plan_id']]);$features=$pf->fetchAll(PDO::FETCH_ASSOC);}catch(Throwable $e){} } }
    sj(['success'=>true,'store'=>$store,'account'=>$customer,'contact'=>['whatsapp'=>$aps['whatsapp'] ?? ($customer['whatsapp'] ?? ($store['owner_phone'] ?? '')),'support_email'=>$aps['support_email'] ?? ($customer['email'] ?? '')],'plan'=>$plan,'plan_features'=>$features]);
  }
  $data=json_decode(file_get_contents('php://input'),true)?:[]; $action=$data['action']??'';
  if($action==='save_store'){
    $sets=['name=?']; $vals=[trim((string)($data['name']??'')) ?: null]; if($hasDesc && array_key_exists('description',$data)){ $sets[]='description=?'; $vals[]=(string)$data['description']; } if(array_key_exists('subdomain',$data) && col($pdo,'stores','subdomain')){ $sets[]='subdomain=?'; $vals[]=(string)$data['subdomain']; } if(col($pdo,'stores','updated_at')) $sets[]='updated_at=NOW()'; $vals[]=$store_id; $pdo->prepare('UPDATE stores SET '.implode(',', $sets).' WHERE id=?')->execute($vals); sj(['success'=>true,'message'=>'Informações da loja salvas com sucesso.']);
  }
  if($action==='save_contact'){
    $whatsapp=(string)($data['whatsapp']??''); $support=(string)($data['support_email']??'');
    if(col($pdo,'admin_panel_settings','store_id')){
      $pdo->exec("CREATE TABLE IF NOT EXISTS admin_panel_settings (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, store_id INT UNSIGNED NOT NULL, whatsapp VARCHAR(40) NULL, support_email VARCHAR(150) NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_admin_panel_settings_store (store_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
      $pdo->prepare("INSERT INTO admin_panel_settings (store_id, whatsapp, support_email) VALUES (?,?,?) ON DUPLICATE KEY UPDATE whatsapp=VALUES(whatsapp), support_email=VALUES(support_email)")->execute([$store_id,$whatsapp?:null,$support?:null]);
    }
    if(col($pdo,'customers','whatsapp')){ try{$pdo->prepare("UPDATE customers SET whatsapp=? WHERE store_id=? AND isAdmin=1")->execute([$whatsapp?:null,$store_id]);}catch(Throwable $e){} }
    sj(['success'=>true,'message'=>'Contato atualizado com sucesso.']);
  }
  if($action==='update_password'){
    $current=(string)($data['current_password']??''); $new=(string)($data['new_password']??''); $confirm=(string)($data['confirm_password']??''); if(strlen($new)<6) throw new Exception('Nova senha muito curta'); if($new!==$confirm) throw new Exception('Confirmação de senha não confere');
    $c=$pdo->prepare("SELECT id,password FROM customers WHERE store_id=? ORDER BY isAdmin DESC, id ASC LIMIT 1"); $c->execute([$store_id]); $u=$c->fetch(PDO::FETCH_ASSOC); if(!$u) throw new Exception('Conta não encontrada');
    $old=(string)($u['password']??''); $ok = ($current===$old) || password_verify($current, $old); if(!$ok) throw new Exception('Senha atual inválida');
    $hash=password_hash($new,PASSWORD_DEFAULT); $pdo->prepare('UPDATE customers SET password=? WHERE id=?')->execute([$hash,(int)$u['id']]); sj(['success'=>true,'message'=>'Senha atualizada com sucesso.']);
  }
  sj(['success'=>false,'error'=>'Ação inválida'],400);
} catch(Throwable $e){ sj(['success'=>false,'error'=>$e->getMessage()],500);} 
