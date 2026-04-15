<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/db.php';
function out($a,$c=200){ http_response_code($c); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }
function loge($m,$ctx=[]){ try{ $d=__DIR__.'/logs'; if(!is_dir($d)) @mkdir($d,0775,true); @file_put_contents($d.'/categories_manager.log', '['.date('Y-m-d H:i:s').'] '.$m.' '.json_encode($ctx,JSON_UNESCAPED_UNICODE).PHP_EOL, FILE_APPEND);}catch(Throwable $e){} }
function j(){ $d=json_decode(file_get_contents('php://input'),true); return is_array($d)?$d:[]; }
function cols(PDO $pdo,$t){ static $m=[]; if(isset($m[$t])) return $m[$t]; $m[$t]=[]; try{ foreach($pdo->query("SHOW COLUMNS FROM `$t`")->fetchAll(PDO::FETCH_ASSOC) as $c){ $m[$t][$c['Field']]=1; } }catch(Throwable $e){} return $m[$t]; }
function has($pdo,$t,$c){ $cs=cols($pdo,$t); return isset($cs[$c]); }
function table_exists(PDO $pdo,$t){ try{$s=$pdo->prepare("SHOW TABLES LIKE ?");$s->execute([$t]); return (bool)$s->fetchColumn();}catch(Throwable $e){return false;} }
function normalize_image_path($path){
  if($path === null) return null;
  $path = trim((string)$path);
  if($path === '') return null;
  if(stripos($path, 'data:') === 0) return null;
  if(preg_match('#^https?://#i', $path)) return $path;
  $clean = ltrim(preg_replace('#^\./#', '', $path), '/');
  if(stripos($clean, 'api-painel/uploads/') === 0) return '/'.substr($clean, strlen('api-painel/'));
  if(stripos($clean, 'api-painel/') === 0) return '/'.$clean;
  if(stripos($clean, 'uploads/') === 0) return '/'.$clean;
  return '/'.$clean;
}
function saveUpload($f){
  if(!$f || !isset($f['tmp_name']) || !is_uploaded_file($f['tmp_name'])) return null;
  $rootUploadDir = dirname(__DIR__).'/uploads';
  if(!is_dir($rootUploadDir)) @mkdir($rootUploadDir,0775,true);
  $name='img_'.uniqid().'.png';
  $dest=$rootUploadDir.'/'.$name;

  $raw = @file_get_contents($f['tmp_name']);
  if($raw === false) return null;

  if(function_exists('imagecreatefromstring') && function_exists('imagepng')){
    $img = @imagecreatefromstring($raw);
    if($img){
      imagealphablending($img, false);
      imagesavealpha($img, true);
      if(@imagepng($img, $dest, 6)){
        imagedestroy($img);
        return '/uploads/'.$name;
      }
      imagedestroy($img);
    }
  }

  if(@move_uploaded_file($f['tmp_name'], $dest)) return '/uploads/'.$name;
  return null;
}
$method=$_SERVER['REQUEST_METHOD'];
$body=$method==='POST' && stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==false ? j() : $_POST;
$storeId=(int)($_GET['store_id'] ?? $body['store_id'] ?? 0);
if($storeId<=0) out(['success'=>false,'error'=>'store_id obrigatório'],400);
if(!table_exists($pdo,'categories')) out(['success'=>false,'error'=>'Tabela categories não encontrada'],500);
try{
  if($method==='GET'){
    $select=['id','store_id','name'];
    foreach(['icon','image_path','use_image','created_at'] as $c) if(has($pdo,'categories',$c)) $select[]=$c;
    foreach(['parent_id','sort_order','status','is_active','description'] as $c) if(has($pdo,'categories',$c)) $select[]=$c;
    $order = has($pdo,'categories','sort_order') ? 'sort_order ASC, id ASC' : 'id ASC';
    $st=$pdo->prepare("SELECT ".implode(',',$select)." FROM categories WHERE store_id=? ORDER BY $order");
    $st->execute([$storeId]); $rows=$st->fetchAll(PDO::FETCH_ASSOC);
    $cats=[];
    foreach($rows as $r){
      $parent = $r['parent_id'] ?? null;
      $isActive = isset($r['status']) ? !in_array(strtolower((string)$r['status']),['0','inactive'],true) : (isset($r['is_active'])?(bool)$r['is_active']:true);
      $cats[]=[
        'id'=>(int)$r['id'], 'name'=>$r['name'], 'icon'=>$r['icon'] ?? 'package', 'image_path'=>normalize_image_path($r['image_path'] ?? null),
        'use_image'=>isset($r['use_image'])?(int)$r['use_image']:0, 'parent_id'=>$parent, 'type'=>$parent?'subcategory':'category',
        'status'=>$isActive?'active':'inactive', 'sort_order'=>$r['sort_order'] ?? null, 'description'=>$r['description'] ?? null,
      ];
    }
    out(['success'=>true,'categories'=>$cats]);
  }
  $action=$body['action'] ?? 'save_order';
  if($action==='save_order'){
    $items=$body['items'] ?? [];
    foreach($items as $i){
      $id=(int)($i['id'] ?? 0); if($id<=0) continue;
      $sets=[];$vals=[];
      if(has($pdo,'categories','sort_order') && isset($i['sort_order'])){ $sets[]='sort_order=?'; $vals[]=(int)$i['sort_order']; }
      if(has($pdo,'categories','parent_id')){ $sets[]='parent_id=?'; $vals[] = isset($i['parent_id']) && $i['parent_id']!=='' ? (int)$i['parent_id'] : null; }
      if(!$sets) continue; $vals[]=$id; $vals[]=$storeId;
      $pdo->prepare("UPDATE categories SET ".implode(',',$sets)." WHERE id=? AND store_id=?")->execute($vals);
    }
    out(['success'=>true,'message'=>'Ordem salva com sucesso']);
  }
  if($action==='preview_delete'){
    $id=(int)($body['id'] ?? 0); if($id<=0) out(['success'=>false,'error'=>'id inválido'],400);
    $st=$pdo->prepare("SELECT id,name FROM categories WHERE id=? AND store_id=? LIMIT 1");
    $st->execute([$id,$storeId]); $cat=$st->fetch(PDO::FETCH_ASSOC);
    if(!$cat) out(['success'=>false,'error'=>'Categoria não encontrada'],404);
    $linked=[];
    if(table_exists($pdo,'products')){
      $st=$pdo->prepare("SELECT id,name,category FROM products WHERE store_id=? AND TRIM(COALESCE(category,'')) = TRIM(?) ORDER BY name ASC");
      $st->execute([$storeId,$cat['name']]);
      $linked=$st->fetchAll(PDO::FETCH_ASSOC);
    }
    $other=[];
    $st=$pdo->prepare("SELECT id,name FROM categories WHERE store_id=? AND id<>? ORDER BY sort_order ASC, id ASC");
    $st->execute([$storeId,$id]); $other=$st->fetchAll(PDO::FETCH_ASSOC);
    out(['success'=>true,'category'=>$cat,'linked_products'=>$linked,'other_categories'=>$other,'can_delete'=>count($linked)===0]);
  }
  if($action==='reassign_and_delete'){
    $payloadRaw = $body['payload'] ?? null;
    $payload = is_string($payloadRaw) ? (json_decode($payloadRaw,true) ?: []) : (is_array($payloadRaw) ? $payloadRaw : []);
    $id=(int)($payload['id'] ?? 0); $targetId=(int)($payload['target_category_id'] ?? 0);
    if($id<=0 || $targetId<=0) out(['success'=>false,'error'=>'Dados inválidos para mover os produtos'],400);
    $st=$pdo->prepare("SELECT id,name FROM categories WHERE id=? AND store_id=? LIMIT 1");
    $st->execute([$id,$storeId]); $cat=$st->fetch(PDO::FETCH_ASSOC);
    $st->execute([$targetId,$storeId]); $target=$st->fetch(PDO::FETCH_ASSOC);
    if(!$cat || !$target) out(['success'=>false,'error'=>'Categoria de origem ou destino não encontrada'],404);
    $pdo->beginTransaction();
    try{
      if(table_exists($pdo,'products')){
        $pdo->prepare("UPDATE products SET category=? WHERE store_id=? AND TRIM(COALESCE(category,'')) = TRIM(?)")->execute([$target['name'],$storeId,$cat['name']]);
      }
      $pdo->prepare("DELETE FROM categories WHERE id=? AND store_id=?")->execute([$id,$storeId]);
      $pdo->commit();
      out(['success'=>true,'message'=>'Produtos movidos e categoria excluída com sucesso.']);
    }catch(Throwable $inner){ if($pdo->inTransaction()) $pdo->rollBack(); throw $inner; }
  }
  if($action==='delete'){
    $id=(int)($body['id'] ?? 0); if($id<=0) out(['success'=>false,'error'=>'id inválido'],400);
    $st=$pdo->prepare("SELECT id,name FROM categories WHERE id=? AND store_id=? LIMIT 1");
    $st->execute([$id,$storeId]); $cat=$st->fetch(PDO::FETCH_ASSOC);
    if(!$cat) out(['success'=>false,'error'=>'Categoria não encontrada'],404);
    if(table_exists($pdo,'products')){
      $st=$pdo->prepare("SELECT id,name,category FROM products WHERE store_id=? AND TRIM(COALESCE(category,'')) = TRIM(?) ORDER BY name ASC");
      $st->execute([$storeId,$cat['name']]); $linked=$st->fetchAll(PDO::FETCH_ASSOC);
      if(count($linked)>0){
        $st2=$pdo->prepare("SELECT id,name FROM categories WHERE store_id=? AND id<>? ORDER BY sort_order ASC, id ASC");
        $st2->execute([$storeId,$id]);
        out(['success'=>false,'error'=>'Existem produtos vinculados a esta categoria.','code'=>'CATEGORY_HAS_PRODUCTS','linked_products'=>$linked,'other_categories'=>$st2->fetchAll(PDO::FETCH_ASSOC),'category'=>$cat],409);
      }
    }
    $pdo->prepare("DELETE FROM categories WHERE id=? AND store_id=?")->execute([$id,$storeId]);
    out(['success'=>true,'message'=>'Categoria removida']);
  }
  if($action==='create' || $action==='update' || $action==='save'){
    $payloadRaw = $body['payload'] ?? null;
    if (is_string($payloadRaw)) {
      $decoded = json_decode($payloadRaw, true);
      $payload = is_array($decoded) ? $decoded : $body;
    } else {
      $payload = is_array($payloadRaw) ? $payloadRaw : $body;
    }
    $img = $_FILES['image'] ?? null; $imagePath = saveUpload($img);
    $data=['name'=>$payload['name'] ?? '']; if(trim($data['name'])==='') out(['success'=>false,'error'=>'Nome obrigatório'],400);
    foreach(['icon','image_path','use_image','parent_id','sort_order','slug','description','color_hex','is_active'] as $c) if(has($pdo,'categories',$c)) $data[$c]=null;
    if(array_key_exists('icon',$data)) $data['icon']=$payload['icon'] ?? 'package';
    if(array_key_exists('image_path',$data)) {
      $incomingImagePath = normalize_image_path($payload['image_path'] ?? null);
      if(!empty($_FILES['image']) && !$imagePath) out(['success'=>false,'error'=>'Falha ao enviar a imagem da categoria'],500);
      $data['image_path']=$imagePath ?: $incomingImagePath;
    }
    if(array_key_exists('use_image',$data)) $data['use_image']=($imagePath || !empty($payload['use_image'])) ? 1 : 0;
    if(array_key_exists('parent_id',$data)) $data['parent_id']=!empty($payload['parent_id'])?(int)$payload['parent_id']:null;
    if(array_key_exists('sort_order',$data)) $data['sort_order']=isset($payload['sort_order'])?(int)$payload['sort_order']:0;
    if(array_key_exists('description',$data)) $data['description']=isset($payload['description']) ? trim((string)$payload['description']) : null;
    if(array_key_exists('color_hex',$data)) $data['color_hex']=isset($payload['color_hex']) ? trim((string)$payload['color_hex']) : null;
    if(array_key_exists('is_active',$data)) $data['is_active']=(!isset($payload['status']) || $payload['status']!=='inactive') ? 1 : 0;
    if(array_key_exists('slug',$data)){
      $slug = trim((string)($payload['slug'] ?? ''));
      if($slug===''){ $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i','-', (string)$data['name']), '-')); }
      if($slug==='') $slug = 'categoria-'.uniqid();
      $data['slug'] = $slug;
    }
    if($action==='create' || ($action==='save' && empty($payload['id']))){
      $data['store_id']=$storeId;
      $keys=array_keys($data); $vals=array_values($data);
      $pdo->prepare("INSERT INTO categories (`".implode('`,`',$keys)."`) VALUES (".implode(',',array_fill(0,count($keys),'?')).")")->execute($vals);
      out(['success'=>true,'id'=>$pdo->lastInsertId(),'image_path'=>$data['image_path'] ?? null]);
    } else {
      $id=(int)($payload['id'] ?? 0); if($id<=0) out(['success'=>false,'error'=>'id inválido'],400);
      $sets=[];$vals=[]; foreach($data as $k=>$v){ $sets[]="`$k`=?"; $vals[]=$v; }
      $vals[]=$id; $vals[]=$storeId;
      $pdo->prepare("UPDATE categories SET ".implode(',',$sets)." WHERE id=? AND store_id=?")->execute($vals);
      out(['success'=>true,'id'=>$id,'image_path'=>$data['image_path'] ?? null]);
    }
  }
  out(['success'=>false,'error'=>'Ação inválida'],400);
}catch(Throwable $e){ loge('erro', ['msg'=>$e->getMessage(),'file'=>$e->getFile(),'line'=>$e->getLine(),'method'=>$method,'body'=>$body]); out(['success'=>false,'error'=>$e->getMessage().' @'.$e->getFile().':'.$e->getLine()],500); }
