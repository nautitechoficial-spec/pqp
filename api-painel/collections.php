<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
function out($ok,$data=[],$code=200){ http_response_code($code); echo json_encode($ok?array_merge(['success'=>true],$data):['success'=>false,'error'=>$data['error']??'Erro'], JSON_UNESCAPED_UNICODE); exit; }
function body(){ $r=file_get_contents('php://input'); $j=json_decode($r,true); return is_array($j)?$j:[]; }
function postData(){
  if($_SERVER['REQUEST_METHOD']!=='POST') return [];
  $ct = $_SERVER['CONTENT_TYPE'] ?? '';
  if (stripos($ct,'multipart/form-data')!==false || stripos($ct,'application/x-www-form-urlencoded')!==false) {
    $d = $_POST;
    if (isset($d['payload']) && is_string($d['payload'])) { $pj=json_decode($d['payload'], true); if (is_array($pj)) $d['payload']=$pj; }
    return is_array($d) ? $d : [];
  }
  return body();
}
function colExists(PDO $pdo,$table,$col){ try{$st=$pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");$st->execute([$col]); return (bool)$st->fetch();}catch(Throwable $e){return false;} }
function firstExistingCol(PDO $pdo,$table,array $cands,$fallback=null){ foreach($cands as $c){ if(colExists($pdo,$table,$c)) return $c; } return $fallback; }
function tableCols(PDO $pdo,string $table): array { static $cache=[]; if(isset($cache[$table])) return $cache[$table]; $cache[$table]=[]; try{ foreach($pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_ASSOC) as $c){ $cache[$table][$c['Field']]=$c; } }catch(Throwable $e){} return $cache[$table]; }
function hasCol(PDO $pdo,string $table,string $col): bool { $cs=tableCols($pdo,$table); return isset($cs[$col]); }

function getStoreId(){ if($_SERVER['REQUEST_METHOD']==='GET') return (int)($_GET['store_id']??0); $b=postData(); return (int)($b['store_id']??0); }
$pdo=getConnection();
try{
 $storeId=getStoreId(); if($storeId<=0) out(false,['error'=>'store_id obrigatório'],400);
 $post = postData();
 $action=$_GET['action'] ?? ($post['action'] ?? '');
 if($_SERVER['REQUEST_METHOD']==='GET' && $action==='products'){
   $search=trim($_GET['search']??''); $category=(int)($_GET['category']??0);
   $priceCol = firstExistingCol($pdo,'products',['price','basePrice'],'basePrice');
   $catCol = firstExistingCol($pdo,'products',['category_id','category'], 'category');
   $hasProductImages = false; try { $pdo->query('SELECT 1 FROM product_images LIMIT 1'); $hasProductImages = true; } catch(Throwable $e) {}
   $imgExpr = "''";
   if($hasProductImages){
     if(colExists($pdo,'product_images','image_path')){
       $imgExpr = "COALESCE(pi.image_path, '')";
     } elseif(colExists($pdo,'product_images','image_url')) {
       $imgExpr = "COALESCE(pi.image_url, '')";
     }
   } elseif(colExists($pdo,'products','image')) {
     $imgExpr = "COALESCE(p.image, '')";
   }
   $sql="SELECT p.id,p.name,p.`{$priceCol}` AS price, {$imgExpr} AS image_path FROM products p";
   if($hasProductImages){
      $ordCol = colExists($pdo,'product_images','sort_order') ? 'sort_order' : (colExists($pdo,'product_images','image_order') ? 'image_order' : null);
      $primaryCol = colExists($pdo,'product_images','is_primary') ? 'is_primary' : null;
      $joinCond = [];
      if($primaryCol) $joinCond[] = "pi.`$primaryCol`=1";
      if($ordCol) $joinCond[] = "pi.`$ordCol`=0";
      $sql .= " LEFT JOIN product_images pi ON pi.product_id=p.id" . (!empty($joinCond) ? " AND (".implode(' OR ',$joinCond).")" : '');
   }
   $sql .= " WHERE p.store_id=?";
   $params=[$storeId];
   if($search!==''){ $sql.=" AND p.name LIKE ?"; $params[]="%$search%"; }
   if($category>0 && $catCol==='category_id'){ $sql.=" AND p.category_id=?"; $params[]=$category; }
   $sql.=" GROUP BY p.id ORDER BY p.id DESC LIMIT 50";
   $st=$pdo->prepare($sql); $st->execute($params); out(true,['products'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
 }
 if($_SERVER['REQUEST_METHOD']==='GET' && $action==='categories'){
   $st=$pdo->prepare("SELECT id,name FROM categories WHERE store_id=? ORDER BY name ASC"); $st->execute([$storeId]); out(true,['categories'=>$st->fetchAll(PDO::FETCH_ASSOC)]);
 }
 if($_SERVER['REQUEST_METHOD']==='GET'){
   $hasSmallLabel=colExists($pdo,'collections','small_label');
   $hasLabelSmall=colExists($pdo,'collections','label_small');
   $hasBanner=colExists($pdo,'collections','banner_image_path');
   $hasFeaturedPid=colExists($pdo,'collections','featured_product_id');
   $hasFeaturedSlogan=colExists($pdo,'collections','featured_slogan');
   $hasFeaturedDesc=colExists($pdo,'collections','featured_description');
   $hasBenefit1=colExists($pdo,'collections','benefit_1');
   $hasBenefit2=colExists($pdo,'collections','benefit_2');
   $hasStatus=colExists($pdo,'collections','status');
   $sql="SELECT c.id, c.store_id,
      ".($hasSmallLabel?"c.small_label":"NULL")." AS small_label,
      ".($hasLabelSmall?"c.label_small":"NULL")." AS label_small,
      c.title, c.subtitle,
      ".($hasBanner?"c.banner_image_path":"NULL")." AS banner_image_path,
      ".($hasFeaturedPid?"c.featured_product_id":"NULL")." AS featured_product_id,
      ".($hasFeaturedSlogan?"c.featured_slogan":"NULL")." AS featured_slogan,
      ".($hasFeaturedDesc?"c.featured_description":"NULL")." AS featured_description,
      ".($hasBenefit1?"c.benefit_1":"NULL")." AS benefit_1,
      ".($hasBenefit2?"c.benefit_2":"NULL")." AS benefit_2,
      ".($hasStatus?"c.status":"'active'")." AS status,
      COUNT(cp.id) AS products_count
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id=c.id
      WHERE c.store_id=? GROUP BY c.id ORDER BY c.id DESC";
   $st=$pdo->prepare($sql); $st->execute([$storeId]);
   $rows=$st->fetchAll(PDO::FETCH_ASSOC);
   $priceColRow = firstExistingCol($pdo,'products',['price','basePrice'],'basePrice');
   $hasPi = false; try { $pdo->query('SELECT 1 FROM product_images LIMIT 1'); $hasPi = true; } catch(Throwable $e) {}
   $piImgCol = $hasPi ? (colExists($pdo,'product_images','image_path') ? 'image_path' : (colExists($pdo,'product_images','image_url') ? 'image_url' : null)) : null;
   $piOrdCol = $hasPi ? (colExists($pdo,'product_images','sort_order') ? 'sort_order' : (colExists($pdo,'product_images','image_order') ? 'image_order' : null)) : null;
   $piPrimaryCol = $hasPi && colExists($pdo,'product_images','is_primary') ? 'is_primary' : null;
   foreach($rows as &$r){
      $r['label_small'] = $r['small_label'] ?: (is_null($r['label_small']) ? '' : (string)$r['label_small']);
      if (!empty($r['banner_image_path']) && str_starts_with($r['banner_image_path'],'/uploads/')) $r['banner_image_path']='.'.$r['banner_image_path'];
            $psSql = "SELECT cp.product_id as id,p.name,p.`{$priceColRow}` AS price," . ($piImgCol ? "COALESCE(pi.`{$piImgCol}`, '')" : "''") . " AS image_path FROM collection_products cp JOIN products p ON p.id=cp.product_id";
      if($hasPi){
        $conds=[]; if($piPrimaryCol) $conds[] = "pi.`{$piPrimaryCol}`=1"; if($piOrdCol) $conds[] = "pi.`{$piOrdCol}`=0";
        $psSql .= " LEFT JOIN product_images pi ON pi.product_id=p.id" . (!empty($conds) ? " AND (".implode(' OR ',$conds).")" : '');
      }
      $psSql .= " WHERE cp.collection_id=? GROUP BY cp.product_id";
      $ps=$pdo->prepare($psSql);
      $ps->execute([$r['id']]); $r['products']=$ps->fetchAll(PDO::FETCH_ASSOC);
   }
   out(true,['collections'=>$rows]);
 }

 // POST actions
 $b=postData(); $action=$b['action'] ?? ''; 
 if($action==='upload_banner'){
   if(empty($_FILES['banner'])) out(false,['error'=>'Arquivo não enviado'],400);
   $dir=dirname(__DIR__).'/uploads'; if(!is_dir($dir)) @mkdir($dir,0777,true);
   $ext=pathinfo($_FILES['banner']['name'], PATHINFO_EXTENSION) ?: 'jpg';
   $name='img_'.uniqid().'.'.$ext; $dest=$dir.'/'.$name;
   if(!move_uploaded_file($_FILES['banner']['tmp_name'],$dest)) out(false,['error'=>'Falha no upload'],500);
   out(true,['path'=>'./uploads/'.$name]);
 }
 if($action==='save'){
   $p=$b['payload'] ?? [];
   $id=(int)($p['id']??0);
   $label=(string)($p['label_small'] ?? $p['small_label'] ?? $p['label'] ?? '');
   $title=(string)($p['title'] ?? $p['name'] ?? '');
   $subtitle=(string)($p['subtitle'] ?? '');
   $banner=(string)($p['banner_image_path'] ?? $p['bannerImagePath'] ?? $p['banner'] ?? '');
   if (!empty($_FILES['bannerFile']) && is_uploaded_file($_FILES['bannerFile']['tmp_name'])) {
     $dir=dirname(__DIR__).'/uploads'; if(!is_dir($dir)) @mkdir($dir,0777,true);
     $ext=pathinfo($_FILES['bannerFile']['name'] ?? 'jpg', PATHINFO_EXTENSION) ?: 'jpg';
     $name='img_'.uniqid().'.'.$ext; $dest=$dir.'/'.$name;
     if(move_uploaded_file($_FILES['bannerFile']['tmp_name'],$dest)) $banner='./uploads/'.$name;
   }
   $featuredPid = ($p['featured_product_id'] ?? $p['featuredProductId'] ?? null);
   $featuredPid = ($featuredPid === '' ? null : $featuredPid);
   $featuredSlogan=(string)($p['featured_slogan'] ?? $p['featuredSlogan'] ?? '');
   $featuredDesc=(string)($p['featured_description'] ?? $p['featuredDescription'] ?? '');
   $benefit1=(string)($p['benefit_1'] ?? $p['benefit1'] ?? '');
   $benefit2=(string)($p['benefit_2'] ?? $p['benefit2'] ?? '');
   $status=(string)($p['status'] ?? 'active');

   $cols=['store_id','title','subtitle']; $vals=[$storeId,$title,$subtitle];
   $sets=['title=?','subtitle=?']; $upd=[$title,$subtitle];
   $optional = [
     'small_label'=>$label ?: null,
     'banner_image_path'=>$banner ?: null,
     'featured_product_id'=>$featuredPid,
     'featured_slogan'=>$featuredSlogan ?: null,
     'featured_description'=>$featuredDesc ?: null,
     'benefit_1'=>$benefit1 ?: null,
     'benefit_2'=>$benefit2 ?: null,
     'benefit1'=>$benefit1 ?: null,
     'benefit2'=>$benefit2 ?: null,
     'status'=>$status
   ];
   foreach($optional as $col=>$val){ if(colExists($pdo,'collections',$col)){ $cols[]=$col; $vals[]=$val; $sets[]="$col=?"; $upd[]=$val; }}
   // Compatibilidade com schema legado onde label_small é INT NOT NULL (não texto)
   if(colExists($pdo,'collections','label_small')){
     $labelSmallValue = isset($p['label_small']) && is_numeric($p['label_small']) ? (int)$p['label_small'] : 0;
     $cols[]='label_small'; $vals[]=$labelSmallValue; $sets[]='label_small=?'; $upd[]=$labelSmallValue;
   }
   if(colExists($pdo,'collections','sort_order') && !in_array('sort_order',$cols,true)){
     $sortVal = isset($p['sort_order']) ? (int)$p['sort_order'] : 0;
     $cols[]='sort_order'; $vals[]=$sortVal; $sets[]='sort_order=?'; $upd[]=$sortVal;
   }
   if(colExists($pdo,'collections','is_active') && !in_array('is_active',$cols,true)){
     $isActive = ($status==='inactive') ? 0 : 1;
     $cols[]='is_active'; $vals[]=$isActive; $sets[]='is_active=?'; $upd[]=$isActive;
   }

   if($id>0){
     $sql='UPDATE collections SET '.implode(',',$sets).' WHERE id=? AND store_id=?';
     $upd[]=$id; $upd[]=$storeId; $pdo->prepare($sql)->execute($upd);
   } else {
     $sql='INSERT INTO collections ('.implode(',',$cols).') VALUES ('.implode(',',array_fill(0,count($cols),'?')).')';
     $pdo->prepare($sql)->execute($vals); $id=(int)$pdo->lastInsertId();
   }

   $productIds = $p['product_ids'] ?? $p['productIds'] ?? null;
   if(isset($productIds) && is_array($productIds)){
     $pdo->prepare('DELETE FROM collection_products WHERE collection_id=?')->execute([$id]);
     $ins=$pdo->prepare('INSERT INTO collection_products (collection_id,product_id,sort_order) VALUES (?,?,?)');
     $i=1; foreach($productIds as $pid){ $ins->execute([$id,(int)$pid,$i++]); }
   }
   out(true,['message'=>'Coleção salva com sucesso','id'=>$id]);
 }
 if($action==='delete'){
   $id=(int)($b['id']??0); if($id<=0) out(false,['error'=>'ID inválido'],400);
   $pdo->prepare('DELETE FROM collection_products WHERE collection_id=?')->execute([$id]);
   $pdo->prepare('DELETE FROM collections WHERE id=? AND store_id=?')->execute([$id,$storeId]);
   out(true,['message'=>'Coleção removida']);
 }
 out(false,['error'=>'Ação inválida'],400);
}catch(Throwable $e){ out(false,['error'=>$e->getMessage().' @'.$e->getFile().':'.$e->getLine()],500); }
