<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') exit;

require_once 'config/database.php';
require_once 'config/platform_affiliate_helpers.php';

try {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $slug = strtolower(trim((string)($data['slug'] ?? '')));
    if ($slug === '') throw new Exception('Slug não informado.');

    $affiliate = mbg_platform_find_affiliate_by_slug($pdo, $slug);
    if (!$affiliate) throw new Exception('Afiliado não encontrado.');

    $sessionId = trim((string)($data['session_id'] ?? '')) ?: ('sess_' . bin2hex(random_bytes(8)));
    $landingPath = substr((string)($data['landing_path'] ?? '/'), 0, 255);
    $referrer = substr((string)($data['referrer_url'] ?? ''), 0, 255);
    $ua = substr((string)($data['user_agent'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 255);
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    $ipHash = $ip !== '' ? hash('sha256', $ip) : null;

    if (mbg_platform_has_table($pdo, 'platform_affiliate_clicks')) {
        $stmt = $pdo->prepare("INSERT INTO platform_affiliate_clicks (affiliate_id, manager_id, team_id, slug, session_id, landing_path, referrer_url, ip_hash, user_agent, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())");
        $stmt->execute([
            (int)$affiliate['id'],
            (int)($affiliate['manager_id'] ?? 0),
            (int)($affiliate['team_id'] ?? 0),
            (string)$affiliate['slug'],
            $sessionId,
            $landingPath,
            $referrer,
            $ipHash,
            $ua,
        ]);
        $clickId = (int)$pdo->lastInsertId();
    } else {
        $clickId = 0;
    }

    if (mbg_platform_has_column($pdo, 'platform_affiliates', 'landing_views')) {
        $pdo->prepare('UPDATE platform_affiliates SET landing_views = landing_views + 1, landing_clicks = landing_clicks + 1, updated_at=NOW() WHERE id=?')->execute([(int)$affiliate['id']]);
    }

    $shouldNotify = false;
    if (mbg_platform_has_table($pdo, 'platform_affiliate_clicks')) {
        $st = $pdo->prepare("SELECT id FROM platform_affiliate_clicks WHERE affiliate_id=? AND ip_hash <=> ? AND user_agent=? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 HOUR) ORDER BY id DESC LIMIT 2");
        $st->execute([(int)$affiliate['id'], $ipHash, $ua]);
        $rows = $st->fetchAll(PDO::FETCH_COLUMN);
        $shouldNotify = count($rows) <= 1;
    }

    if ($shouldNotify) {
        $device = mbg_platform_device_name($ua, (string)($data['device_platform'] ?? ''));
        $title = 'Novo dispositivo visitando seu link';
        $message = $device . ' está acessando o link /' . $affiliate['slug'] . ' neste momento.';
        $targets = mbg_platform_collect_sale_targets($pdo, [
            'affiliate_id' => (int)$affiliate['id'],
            'manager_id' => (int)($affiliate['manager_id'] ?? 0),
            'team_id' => (int)($affiliate['team_id'] ?? 0),
        ]);
        mbg_platform_create_dispatch($pdo, $title, $message, '/equipe/', 'AFFILIATE_LINK_VISIT', 'platform_affiliate_clicks', $clickId, $targets, [
            'slug' => (string)$affiliate['slug'],
            'device' => $device,
            'landing_path' => $landingPath,
        ]);
    }

    echo json_encode([
        'success' => true,
        'click_id' => $clickId,
        'affiliate' => [
            'id' => (int)$affiliate['id'],
            'slug' => (string)$affiliate['slug'],
            'name' => (string)$affiliate['name'],
            'manager_id' => (int)($affiliate['manager_id'] ?? 0),
            'team_id' => (int)($affiliate['team_id'] ?? 0),
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
