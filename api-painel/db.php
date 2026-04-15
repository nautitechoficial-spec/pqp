<?php
// Compat shim para endpoints novos
$paths = [__DIR__.'/config/database.php', dirname(__DIR__).'/api-painel/config/database.php'];
$loaded = false;
foreach ($paths as $f) {
  if (file_exists($f)) { require_once $f; $loaded = true; break; }
}
if (!$loaded) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['success'=>false,'error'=>'database.php não encontrado']);
  exit;
}
if (!isset($pdo)) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['success'=>false,'error'=>'PDO não inicializado']);
  exit;
}


if (!function_exists('getConnection')) {
  function getConnection(): PDO {
    global $pdo;
    if (!isset($pdo) || !($pdo instanceof PDO)) {
      throw new Exception('PDO não inicializado');
    }
    return $pdo;
  }
}
