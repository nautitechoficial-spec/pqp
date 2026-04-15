<?php
if (!function_exists('mbg_platform_has_table')) {
  function mbg_platform_has_table(PDO $pdo, string $table): bool {
    try { $st = $pdo->prepare('SHOW TABLES LIKE ?'); $st->execute([$table]); return (bool)$st->fetchColumn(); } catch (Throwable $e) { return false; }
  }
}
if (!function_exists('mbg_platform_has_column')) {
  function mbg_platform_has_column(PDO $pdo, string $table, string $column): bool {
    try { $st = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?"); $st->execute([$column]); return (bool)$st->fetchColumn(); } catch (Throwable $e) { return false; }
  }
}
if (!function_exists('mbg_platform_find_affiliate_by_slug')) {
  function mbg_platform_find_affiliate_by_slug(PDO $pdo, string $slug): ?array {
    if ($slug === '' || !mbg_platform_has_table($pdo, 'platform_affiliates')) return null;
    $st = $pdo->prepare("SELECT * FROM platform_affiliates WHERE LOWER(slug)=LOWER(?) AND active=1 LIMIT 1");
    $st->execute([$slug]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
  }
}
if (!function_exists('mbg_platform_device_name')) {
  function mbg_platform_device_name(string $ua, string $platform=''): string {
    $uaL = strtolower($ua);
    if (strpos($uaL, 'iphone') !== false) return 'iPhone';
    if (strpos($uaL, 'ipad') !== false) return 'iPad';
    if (strpos($uaL, 'android') !== false) return 'Android';
    if (strpos($uaL, 'windows') !== false) return 'Windows';
    if (strpos($uaL, 'mac os') !== false || strpos($uaL, 'macintosh') !== false) return 'Mac';
    return $platform !== '' ? $platform : 'Novo dispositivo';
  }
}
if (!function_exists('mbg_platform_create_dispatch')) {
  function mbg_platform_create_dispatch(PDO $pdo, string $title, string $message, ?string $linkUrl, string $eventCode, string $sourceType, int $sourceId, array $targets, array $meta=[]): void {
    if (!mbg_platform_has_table($pdo, 'platform_notification_dispatches') || !mbg_platform_has_table($pdo, 'platform_notification_inbox')) return;
    $total = count($targets);
    if ($total < 1) return;
    $payloadJson = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $pdo->prepare("INSERT INTO platform_notification_dispatches (origin_type, audience, scope_sector, title, message, link_url, status, total_targets, delivered_count, failed_count, created_by_account_type, created_by_account_id, origin_event_code, source_reference_type, source_reference_id, template_payload_json, sent_at, meta_json, created_at, updated_at) VALUES ('RULE','ALL','ALL',?,?,?,?,?,0,0,'system',NULL,?,?,?, ?,NOW(),?,NOW(),NOW())")
      ->execute([$title, $message, $linkUrl, 'SENT', $total, $eventCode, $sourceType, $sourceId, $payloadJson, $payloadJson]);
    $dispatchId = (int)$pdo->lastInsertId();
    $in = $pdo->prepare("INSERT INTO platform_notification_inbox (dispatch_id, account_type, account_id, rule_code, scope_sector, title, message, link_url, status, payload_json, is_push_sent, delivered_at, created_at, updated_at) VALUES (?,?,?,?, 'ALL', ?,?,?, 'DELIVERED', ?, 1, NOW(), NOW(), NOW())");
    foreach ($targets as $target) {
      $in->execute([$dispatchId, $target['account_type'], (int)$target['account_id'], $eventCode, $title, $message, $linkUrl, $payloadJson]);
    }
    $pdo->prepare("UPDATE platform_notification_dispatches SET delivered_count=?, updated_at=NOW() WHERE id=?")->execute([$total, $dispatchId]);
  }
}
if (!function_exists('mbg_platform_collect_sale_targets')) {
  function mbg_platform_collect_sale_targets(PDO $pdo, array $sale): array {
    $targets = [];
    if (!empty($sale['affiliate_id'])) $targets[] = ['account_type' => 'affiliate', 'account_id' => (int)$sale['affiliate_id']];
    if (!empty($sale['manager_id'])) $targets[] = ['account_type' => 'manager', 'account_id' => (int)$sale['manager_id']];
    if (mbg_platform_has_table($pdo, 'platform_affiliates') && !empty($sale['team_id'])) {
      $st = $pdo->prepare("SELECT id FROM platform_affiliates WHERE team_id=? AND active=1");
      $st->execute([(int)$sale['team_id']]);
      while ($id = $st->fetchColumn()) $targets[] = ['account_type' => 'affiliate', 'account_id' => (int)$id];
    }
    if (mbg_platform_has_table($pdo, 'admins')) {
      $st = $pdo->query("SELECT id FROM admins WHERE active=1");
      if ($st) while ($id = $st->fetchColumn()) $targets[] = ['account_type' => 'admin', 'account_id' => (int)$id];
    }
    $unique = [];
    foreach ($targets as $t) $unique[$t['account_type'].':'.$t['account_id']] = $t;
    return array_values($unique);
  }
}
