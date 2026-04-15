<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
require_once 'config/database.php';
require_once __DIR__ . '/melhor_envio_client.php';
function send_json($data, int $status = 200): void { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function has_col(PDO $pdo, string $table, string $col): bool { try { $st = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?"); $st->execute([$col]); return (bool)$st->fetch(PDO::FETCH_ASSOC); } catch (Throwable $e) { return false; } }
function table_exists(PDO $pdo, string $table): bool { try { $st = $pdo->prepare("SHOW TABLES LIKE ?"); $st->execute([$table]); return (bool)$st->fetchColumn(); } catch (Throwable $e) { return false; } }
function normalize_status(string $status): string {
    $s = strtolower(trim($status));
    if (in_array($s, ['paid','pending','canceled','refunded'], true)) return $s;
    if ($s === 'cancelled') return 'canceled';
    return 'pending';
}
function build_fake_email(string $name, string $phone, int $store_id): string {
    $base = preg_replace('/[^a-z0-9]+/i', '.', strtolower(trim($name)));
    $base = trim($base ?: 'cliente', '.');
    $suffix = preg_replace('/\D+/', '', $phone);
    if ($suffix === '') $suffix = (string) time();
    return $base . '.' . $suffix . '.s' . $store_id . '@manual.local';
}
function build_fake_cpf(string $phone, int $store_id): string {
    $digits = preg_replace('/\D+/', '', $phone) . str_pad((string)$store_id, 3, '0', STR_PAD_LEFT) . '00000000000';
    return substr($digits, 0, 11);
}

function me_get_config(PDO $pdo, int $storeId): array {
    $cfg = ['token' => '', 'environment' => 'sandbox'];
    try {
        $st = $pdo->prepare('SELECT * FROM shipping_melhor_envio_config WHERE store_id=? LIMIT 1');
        $st->execute([$storeId]);
        if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $cfg['token'] = (string)($row['api_token'] ?? '');
            $cfg['environment'] = ($row['environment'] ?? 'sandbox') === 'production' ? 'production' : 'sandbox';
        }
    } catch (Throwable $e) {}
    return $cfg;
}
function order_col(PDO $pdo, string $col): bool { return has_col($pdo, 'orders', $col); }
function fetch_order_full(PDO $pdo, int $orderId, int $storeId): ?array {
    $st = $pdo->prepare("SELECT o.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.cpf AS customer_cpf, oa.street, oa.number, oa.complement, oa.neighborhood, oa.city, oa.state, oa.cep FROM orders o LEFT JOIN customers c ON c.id=o.customer_id LEFT JOIN order_addresses oa ON oa.order_id=o.id WHERE o.id=? AND o.store_id=? LIMIT 1");
    $st->execute([$orderId, $storeId]);
    $order = $st->fetch(PDO::FETCH_ASSOC);
    if (!$order) return null;
    $it = $pdo->prepare("SELECT oi.*, p.weight_kg, p.height_cm, p.width_cm, p.length_cm FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?");
    $it->execute([$orderId]);
    $order['items'] = $it->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return $order;
}
function fetch_order_origin(PDO $pdo, int $storeId): array {
    $origin = [
        'name' => 'Minha Loja', 'phone' => '', 'email' => '', 'company_document' => '', 'state_register' => 'ISENTO',
        'address' => '', 'complement' => '', 'number' => '1', 'district' => '', 'city' => '', 'postal_code' => '', 'state_abbr' => ''
    ];
    if (table_exists($pdo, 'shipping_store_addresses')) {
        $st = $pdo->prepare('SELECT * FROM shipping_store_addresses WHERE store_id=? ORDER BY is_default DESC, id DESC LIMIT 1');
        $st->execute([$storeId]);
        if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            return [
                'name' => (string)($row['contact_name'] ?? $origin['name']),
                'phone' => preg_replace('/\D+/', '', (string)($row['phone'] ?? '')),
                'email' => (string)($row['email'] ?? ''),
                'company_document' => preg_replace('/\D+/', '', (string)($row['document'] ?? '')),
                'state_register' => (string)($row['state_register'] ?? 'ISENTO'),
                'address' => (string)($row['street'] ?? ''),
                'complement' => (string)($row['complement'] ?? ''),
                'number' => (string)($row['number'] ?? '1'),
                'district' => (string)($row['neighborhood'] ?? ''),
                'city' => (string)($row['city'] ?? ''),
                'postal_code' => preg_replace('/\D+/', '', (string)($row['cep'] ?? '')),
                'state_abbr' => strtoupper((string)($row['state'] ?? '')),
            ];
        }
    }
    $st = $pdo->prepare('SELECT name, owner_name, owner_email, owner_phone FROM stores WHERE id=? LIMIT 1');
    $st->execute([$storeId]);
    if ($store = $st->fetch(PDO::FETCH_ASSOC)) {
        $origin['name'] = (string)($store['owner_name'] ?: $store['name'] ?: 'Minha Loja');
        $origin['phone'] = preg_replace('/\D+/', '', (string)($store['owner_phone'] ?? ''));
        $origin['email'] = (string)($store['owner_email'] ?? '');
    }
    try {
        $st = $pdo->prepare('SELECT origin_zipcode, origin_address_label FROM shipping_local_delivery_config WHERE store_id=? LIMIT 1');
        $st->execute([$storeId]);
        if ($row = $st->fetch(PDO::FETCH_ASSOC)) $origin['postal_code'] = preg_replace('/\D+/', '', (string)($row['origin_zipcode'] ?? ''));
    } catch (Throwable $e) {}
    return $origin;
}
function persist_label_data(PDO $pdo, int $orderId, array $payload): void {
    $set=[]; $vals=[];
    $map = [
      'me_shipment_id' => $payload['shipment_id'] ?? null,
      'me_cart_id' => $payload['cart_id'] ?? null,
      'me_protocol' => $payload['protocol'] ?? null,
      'me_tracking_url' => $payload['tracking_url'] ?? null,
      'me_label_url' => $payload['label_url'] ?? null,
      'tracking_code' => $payload['tracking_code'] ?? null,
      'shipping_quote_id' => $payload['quote_id'] ?? null,
    ];
    foreach ($map as $col => $val) {
      if (order_col($pdo, $col)) { $set[] = "$col = ?"; $vals[] = $val; }
    }
    if (order_col($pdo, 'logistics_status')) $set[] = "logistics_status = 'label_generated'";
    if (order_col($pdo, 'updated_at')) $set[] = 'updated_at = NOW()';
    if ($set) {
      $vals[] = $orderId;
      $pdo->prepare('UPDATE orders SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($vals);
    }
}
function build_cart_payload_from_order(PDO $pdo, array $order, int $storeId): array {
    $origin = fetch_order_origin($pdo, $storeId);
    $settings = ['default_weight_kg' => 0.3, 'default_height_cm' => 4, 'default_width_cm' => 12, 'default_length_cm' => 16];
    try {
        $st = $pdo->prepare('SELECT default_weight_kg, default_height_cm, default_width_cm, default_length_cm FROM shipping_settings WHERE store_id=? LIMIT 1');
        $st->execute([$storeId]);
        if ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $settings['default_weight_kg'] = max(0.001, (float)($row['default_weight_kg'] ?? 0.3));
            $settings['default_height_cm'] = max(1, (float)($row['default_height_cm'] ?? 4));
            $settings['default_width_cm'] = max(1, (float)($row['default_width_cm'] ?? 12));
            $settings['default_length_cm'] = max(1, (float)($row['default_length_cm'] ?? 16));
        }
    } catch (Throwable $e) {}
    $selected = [];
    if (!empty($order['shipping_selected_payload'])) {
        $decoded = json_decode((string)$order['shipping_selected_payload'], true);
        if (is_array($decoded)) $selected = $decoded;
    }
    $to = [
      'name' => (string)($order['customer_name'] ?? 'Cliente'),
      'phone' => preg_replace('/\D+/', '', (string)($order['customer_phone'] ?? '')),
      'email' => (string)($order['customer_email'] ?? ''),
      'document' => preg_replace('/\D+/', '', (string)($order['customer_cpf'] ?? '')),
      'address' => (string)($order['street'] ?? ''),
      'complement' => (string)($order['complement'] ?? ''),
      'number' => (string)($order['number'] ?? 'S/N'),
      'district' => (string)($order['neighborhood'] ?? ''),
      'city' => (string)($order['city'] ?? ''),
      'postal_code' => preg_replace('/\D+/', '', (string)($order['cep'] ?? '')),
      'state_abbr' => strtoupper((string)($order['state'] ?? '')),
    ];
    $products=[]; $weight=0.0; $height=(float)$settings['default_height_cm']; $width=(float)$settings['default_width_cm']; $length=(float)$settings['default_length_cm'];
    foreach (($order['items'] ?? []) as $idx => $item) {
      $qty = max(1, (int)($item['quantity'] ?? 1));
      $unit = (float)($item['price'] ?? 0);
      $products[] = ['name' => (string)($item['product_name'] ?? 'Produto'), 'quantity' => $qty, 'unitary_value' => $unit];
      $itemWeight = (float)($item['weight_kg'] ?? 0);
      $itemHeight = (float)($item['height_cm'] ?? 0);
      $itemWidth = (float)($item['width_cm'] ?? 0);
      $itemLength = (float)($item['length_cm'] ?? 0);
      $weight += max(0.001, $itemWeight > 0 ? $itemWeight : (float)$settings['default_weight_kg']) * $qty;
      $height = max($height, $itemHeight > 0 ? $itemHeight : (float)$settings['default_height_cm']);
      $width = max($width, $itemWidth > 0 ? $itemWidth : (float)$settings['default_width_cm']);
      $length = max($length, $itemLength > 0 ? $itemLength : (float)$settings['default_length_cm']);
    }
    return [
      'service' => (int)($order['shipping_quote_id'] ?? $selected['quote_id'] ?? 0),
      'from' => $origin,
      'to' => $to,
      'products' => $products,
      'volumes' => [['height' => $height, 'width' => $width, 'length' => $length, 'weight' => max(0.001, $weight)]],
      'options' => ['receipt' => false, 'own_hand' => false, 'reverse' => false, 'non_commercial' => true, 'insurance_value' => (float)($order['total_amount'] ?? 0)],
    ];
}
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $action = $data['action'] ?? 'create';
        $store_id = (int)($data['store_id'] ?? 0);
        if ($store_id <= 0) throw new Exception('ID da loja não fornecido.');


        if ($action === 'generate_label') {
            $orderId = (int)($data['order_id'] ?? 0);
            if ($orderId <= 0) throw new Exception('Pedido inválido para gerar etiqueta.');
            $order = fetch_order_full($pdo, $orderId, $store_id);
            if (!$order) throw new Exception('Pedido não encontrado.');
            $cfg = me_get_config($pdo, $store_id);
            if ($cfg['token'] === '') throw new Exception('Melhor Envio não configurado para esta loja.');
            $cartPayload = build_cart_payload_from_order($pdo, $order, $store_id);
            if (empty($cartPayload['service'])) throw new Exception('Este pedido não possui serviço real do Melhor Envio selecionado no checkout.');
            $cartRes = mbg_me_request($cfg['environment'], $cfg['token'], 'POST', '/api/v2/me/cart', $cartPayload);
            if (!$cartRes['ok']) throw new Exception($cartRes['error'] ?: 'Falha ao inserir envio no carrinho do Melhor Envio.');
            $cartData = $cartRes['data'];
            $cartId = (int)($cartData['id'] ?? $cartData['order']['id'] ?? 0);
            if ($cartId <= 0) throw new Exception('Melhor Envio não retornou o ID do carrinho.');
            $checkoutRes = mbg_me_request($cfg['environment'], $cfg['token'], 'POST', '/api/v2/me/shipment/checkout', ['orders' => [$cartId]]);
            if (!$checkoutRes['ok']) throw new Exception($checkoutRes['error'] ?: 'Falha ao comprar o frete no Melhor Envio.');
            $generateRes = mbg_me_request($cfg['environment'], $cfg['token'], 'POST', '/api/v2/me/shipment/generate', ['orders' => [$cartId]]);
            if (!$generateRes['ok']) throw new Exception($generateRes['error'] ?: 'Falha ao gerar a etiqueta no Melhor Envio.');
            $printRes = mbg_me_request($cfg['environment'], $cfg['token'], 'POST', '/api/v2/me/shipment/print', ['mode' => 'public', 'orders' => [$cartId]]);
            $labelUrl = $printRes['data']['url'] ?? $printRes['data']['link'] ?? null;
            $detailsRes = mbg_me_request($cfg['environment'], $cfg['token'], 'GET', '/api/v2/me/orders/' . $cartId);
            $details = is_array($detailsRes['data']) ? $detailsRes['data'] : [];
            persist_label_data($pdo, $orderId, [
                'shipment_id' => $cartId,
                'cart_id' => $cartId,
                'protocol' => mbg_me_extract_protocol($details),
                'tracking_code' => mbg_me_extract_protocol($details),
                'tracking_url' => $details['tracking_url'] ?? null,
                'label_url' => $labelUrl,
                'quote_id' => $order['shipping_quote_id'] ?? null,
            ]);
            send_json(['success'=>true,'message'=>'Etiqueta gerada com sucesso.','label_url'=>$labelUrl,'shipment_id'=>$cartId]);
        }

        if ($action === 'print_label') {
            $orderId = (int)($data['order_id'] ?? 0);
            if ($orderId <= 0) throw new Exception('Pedido inválido.');
            $order = fetch_order_full($pdo, $orderId, $store_id);
            if (!$order) throw new Exception('Pedido não encontrado.');
            $shipmentId = (int)($order['me_shipment_id'] ?? 0);
            if ($shipmentId <= 0) throw new Exception('Este pedido ainda não possui etiqueta gerada.');
            $cfg = me_get_config($pdo, $store_id);
            $printRes = mbg_me_request($cfg['environment'], $cfg['token'], 'POST', '/api/v2/me/shipment/print', ['mode' => 'public', 'orders' => [$shipmentId]]);
            if (!$printRes['ok']) throw new Exception($printRes['error'] ?: 'Falha ao preparar impressão da etiqueta.');
            $labelUrl = $printRes['data']['url'] ?? $printRes['data']['link'] ?? ($order['me_label_url'] ?? null);
            persist_label_data($pdo, $orderId, ['shipment_id'=>$shipmentId,'label_url'=>$labelUrl]);
            send_json(['success'=>true,'label_url'=>$labelUrl]);
        }

        if ($action === 'sync_label') {
            $orderId = (int)($data['order_id'] ?? 0);
            if ($orderId <= 0) throw new Exception('Pedido inválido.');
            $order = fetch_order_full($pdo, $orderId, $store_id);
            if (!$order) throw new Exception('Pedido não encontrado.');
            $shipmentId = (int)($order['me_shipment_id'] ?? 0);
            if ($shipmentId <= 0) throw new Exception('Este pedido ainda não possui envio criado no Melhor Envio.');
            $cfg = me_get_config($pdo, $store_id);
            $detailsRes = mbg_me_request($cfg['environment'], $cfg['token'], 'GET', '/api/v2/me/orders/' . $shipmentId);
            if (!$detailsRes['ok']) throw new Exception($detailsRes['error'] ?: 'Falha ao consultar etiqueta.');
            $details = is_array($detailsRes['data']) ? $detailsRes['data'] : [];
            persist_label_data($pdo, $orderId, [
                'shipment_id' => $shipmentId,
                'protocol' => mbg_me_extract_protocol($details),
                'tracking_code' => mbg_me_extract_protocol($details),
                'tracking_url' => $details['tracking_url'] ?? null,
                'label_url' => $details['label_url'] ?? ($order['me_label_url'] ?? null),
            ]);
            send_json(['success'=>true,'message'=>'Logística sincronizada.','details'=>$details]);
        }

        if ($action === 'create') {
            $pdo->beginTransaction();
            $customerName = trim((string)($data['customer_name'] ?? 'Cliente Balcão'));
            $customerEmail = trim((string)($data['customer_email'] ?? ''));
            $customerPhone = trim((string)($data['customer_phone'] ?? ''));
            $customerId = (int)($data['customer_id'] ?? 0);

            if ($customerId <= 0) {
                if ($customerEmail !== '') {
                    $st = $pdo->prepare("SELECT id FROM customers WHERE store_id=? AND email=? LIMIT 1");
                    $st->execute([$store_id, $customerEmail]);
                    $customerId = (int)($st->fetchColumn() ?: 0);
                }
                if ($customerId <= 0 && $customerPhone !== '' && has_col($pdo,'customers','phone')) {
                    $st = $pdo->prepare("SELECT id FROM customers WHERE store_id=? AND phone=? LIMIT 1");
                    $st->execute([$store_id, $customerPhone]);
                    $customerId = (int)($st->fetchColumn() ?: 0);
                }
                if ($customerId <= 0) {
                    $email = $customerEmail !== '' ? $customerEmail : build_fake_email($customerName, $customerPhone, $store_id);
                    $password = password_hash(bin2hex(random_bytes(8)), PASSWORD_BCRYPT);
                    $cpf = build_fake_cpf($customerPhone, $store_id);
                    $st = $pdo->prepare("INSERT INTO customers (store_id,name,email,password,phone,whatsapp,cpf,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())");
                    $st->execute([$store_id, $customerName, $email, $password, $customerPhone ?: null, $customerPhone ?: null, $cpf, 'active']);
                    $customerId = (int)$pdo->lastInsertId();
                }
            }

            $items = is_array($data['items'] ?? null) ? $data['items'] : [];
            if (!$items) throw new Exception('Adicione ao menos um item ao pedido.');

            $normalizedItems = [];
            $subtotal = 0.0;
            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $price = (float)($item['price'] ?? 0);
                $productName = trim((string)($item['product_name'] ?? ''));
                $sku = trim((string)($item['sku'] ?? ''));
                $imageUrl = trim((string)($item['image_url'] ?? ''));

                if ($productId > 0) {
                    $stProduct = $pdo->prepare("SELECT p.id, p.name, p.sku, p.basePrice, p.promotional_price, (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY image_order ASC LIMIT 1) AS main_image FROM products p WHERE p.id=? AND p.store_id=? LIMIT 1");
                    $stProduct->execute([$productId, $store_id]);
                    $product = $stProduct->fetch(PDO::FETCH_ASSOC);
                    if (!$product) throw new Exception('Um dos produtos selecionados não foi encontrado no banco de dados.');
                    $productName = $productName !== '' ? $productName : (string)$product['name'];
                    $sku = $sku !== '' ? $sku : (string)($product['sku'] ?? '');
                    $imageUrl = $imageUrl !== '' ? $imageUrl : (string)($product['main_image'] ?? '');
                    if ($price <= 0) $price = (float)($product['promotional_price'] ?: $product['basePrice'] ?: 0);
                }

                if ($productName === '') throw new Exception('Selecione um produto válido para cada item do pedido.');
                $lineTotal = $qty * $price;
                $subtotal += $lineTotal;
                $normalizedItems[] = [
                    'product_id' => $productId,
                    'product_name' => $productName,
                    'sku' => $sku,
                    'image_url' => $imageUrl,
                    'quantity' => $qty,
                    'price' => $price,
                    'line_total' => $lineTotal,
                ];
            }

            $shipping = (float)($data['shipping_cost'] ?? 0);
            $discount = (float)($data['discount_amount'] ?? 0);
            $total = max(0, (float)($data['total_amount'] ?? ($subtotal + $shipping - $discount)));
            $status = normalize_status((string)($data['status'] ?? 'pending'));
            $paymentMethod = strtoupper(trim((string)($data['payment_method'] ?? 'PIX')));
            $channelRaw = strtolower(trim((string)($data['channel'] ?? $data['sales_channel'] ?? 'physical')));
            $salesChannel = in_array($channelRaw, ['online','virtual','loja_virtual'], true) ? 'loja_virtual' : 'loja_fisica';
            $logisticsStatus = trim((string)($data['logistics_status'] ?? 'awaiting_separation')) ?: 'awaiting_separation';

            $sql = "INSERT INTO orders (order_number,store_id,customer_id,total_amount,subtotal_amount,discount_total_amount,status,logistics_status,payment_method,sales_channel,shipping_cost,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())";
            $orderNumber = 'ORD-'.strtoupper(substr(uniqid(), -8));
            $pdo->prepare($sql)->execute([$orderNumber,$store_id,$customerId,$total,$subtotal,$discount,$status,$logisticsStatus,$paymentMethod,$salesChannel,$shipping]);
            $orderId = (int)$pdo->lastInsertId();

            $itemSql = "INSERT INTO order_items (order_id,product_id,variation_id,variation_label,product_name,sku,image_url,quantity,price,discount_amount,line_total) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
            $itemStmt = $pdo->prepare($itemSql);
            foreach ($normalizedItems as $item) {
                $itemStmt->execute([$orderId, $item['product_id'] > 0 ? $item['product_id'] : 0, null, null, $item['product_name'], $item['sku'], $item['image_url'], $item['quantity'], $item['price'], 0, $item['line_total']]);
            }

            $cep = trim((string)($data['cep'] ?? ''));
            $street = trim((string)($data['street'] ?? ''));
            $number = trim((string)($data['number'] ?? ''));
            $neighborhood = trim((string)($data['neighborhood'] ?? ''));
            $city = trim((string)($data['city'] ?? ''));
            $state = trim((string)($data['state'] ?? ''));
            if (($cep !== '' || $street !== '' || $number !== '' || $neighborhood !== '' || $city !== '' || $state !== '') && table_exists($pdo, 'order_addresses')) {
                $pdo->prepare("INSERT INTO order_addresses (order_id, street, number, complement, neighborhood, city, state, cep) VALUES (?,?,?,?,?,?,?,?)")
                    ->execute([$orderId, $street ?: null, $number ?: null, trim((string)($data['complement'] ?? '')) ?: null, $neighborhood ?: null, $city ?: null, $state ?: null, $cep ?: null]);
            }

            if (!empty($data['notes']) && has_col($pdo, 'orders', 'logistics_notes')) {
                $pdo->prepare("UPDATE orders SET logistics_notes=? WHERE id=?")->execute([trim((string)$data['notes']), $orderId]);
            }

            $pdo->commit();
            send_json(['success'=>true,'message'=>'Pedido criado com sucesso.','id'=>$orderId]);
        }

        if ($action === 'export') {
            send_json(['success'=>true]);
        }
        send_json(['success'=>false,'error'=>'Ação inválida'], 400);
    }

    if (isset($_GET['id'])) {
        $order_id = $_GET['id'];
        $stmt = $pdo->prepare("SELECT id, status, total_amount, pix_qr_code, pix_copy_paste FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$order) throw new Exception("Pedido não encontrado.");
        send_json(['success' => true, 'order' => $order]);
    }

    $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
    if ($store_id <= 0) throw new Exception("ID da loja não fornecido.");
    $addressJoin = 'LEFT JOIN customer_addresses oa ON o.customer_id = oa.customer_id AND oa.is_main = 1';
    try { if ($pdo->query("SHOW TABLES LIKE 'order_addresses'")->fetchColumn()) $addressJoin = 'LEFT JOIN order_addresses oa ON o.id = oa.order_id'; } catch (Throwable $ignore) {}
    $queryOrders = "SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, oa.street, oa.number, oa.complement, oa.neighborhood, oa.city, oa.state, oa.cep FROM orders o LEFT JOIN customers c ON o.customer_id = c.id {$addressJoin} WHERE o.store_id = ? AND (o.tipo IS NULL OR LOWER(o.tipo) != 'sub') ORDER BY o.created_at DESC";
    $stmt = $pdo->prepare($queryOrders);
    $stmt->execute([$store_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($orders as &$order) {
        $stmtItems = $pdo->prepare("SELECT oi.*, COALESCE(oi.product_name,p.name) as product_name, oi.image_url as image FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
        $stmtItems->execute([$order['id']]);
        $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }
    $insights = ['total' => count($orders), 'paid' => 0, 'pending' => 0];
    foreach ($orders as $o) { $status = strtolower(trim((string)$o['status'])); if ($status === 'paid') $insights['paid']++; if ($status === 'pending') $insights['pending']++; }
    send_json(['success' => true, 'orders' => $orders, 'insights' => $insights]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    send_json(['success' => false, 'error' => $e->getMessage()], 500);
}
