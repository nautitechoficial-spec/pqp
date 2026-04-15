<?php
/**
 * Configuração de conexão com o banco de dados MySQL (PDO)
 * Produção (hospedagem compartilhada): usar EMULATE_PREPARES = true para evitar bugs do driver.
 */

$host = 'localhost';
$db   = 'minhabag_db';
$user = 'minhabag_root';
$pass = '91416210@';   // <- mantenha a sua
$charset = 'utf8mb4';

$dsn = "mysql:host={$host};dbname={$db};charset={$charset}";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

    // ✅ ESSENCIAL na sua hospedagem:
    PDO::ATTR_EMULATE_PREPARES => true,

    // ✅ Força charset correto na conexão:
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Opcional: garante modo SQL mais previsível
    // $pdo->exec("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode([
        'success' => false,
        'error' => 'Falha na conexão com o banco de dados.',
        // em produção você pode remover "details" pra não expor info
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

    exit;
}