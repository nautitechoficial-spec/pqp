<?php
/**
 * Endpoint para CRUD de Produtos
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

function send_json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}


function table_has_column(PDO $pdo, string $table, string $column): bool {
    static $cache = [];
    $key = $table . '.' . $column;
    if (isset($cache[$key])) return $cache[$key];
    $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
    $stmt->execute([$column]);
    $cache[$key] = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    return $cache[$key];
}

require_once 'config/database.php';

// Caminho para a pasta de uploads (ajustado conforme instrução: uploads está no mesmo nível da api-painel)
$upload_dir = dirname(__DIR__) . '/uploads/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;

        if ($store_id <= 0) {
            throw new Exception("ID da loja não fornecido.");
        }

        if ($id) {
            // Detalhes de um produto específico
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    (SELECT SUM(stock) FROM product_variations WHERE product_id = p.id) as total_stock,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count
                FROM products p 
                WHERE p.id = ? AND p.store_id = ?
            ");
            $stmt->execute([$id, $store_id]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new Exception("Produto não encontrado");
            }

            // Imagens
            $stmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY image_order ASC");
            $stmt->execute([$id]);
            $product['images'] = $stmt->fetchAll();

            // Variações
            $stmt = $pdo->prepare("SELECT * FROM product_variations WHERE product_id = ?");
            $stmt->execute([$id]);
            $product['variations'] = $stmt->fetchAll();

            if (table_has_column($pdo, 'products', 'variation_attributes_json')) {
                $product['variationAttributes'] = !empty($product['variation_attributes_json'])
                    ? json_decode((string)$product['variation_attributes_json'], true)
                    : [];
            }

            // Views
            $stmt = $pdo->prepare("SELECT views FROM product_views WHERE product_id = ?");
            $stmt->execute([$id]);
            $viewData = $stmt->fetch();
            $product['views'] = $viewData ? (int)$viewData['views'] : 0;

            send_json($product);
        }

        // 1. Estatísticas
        $stats = [];
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE store_id = ?");
        $stmt->execute([$store_id]);
        $stats['total'] = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE active = 1 AND store_id = ?");
        $stmt->execute([$store_id]);
        $stats['active'] = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE active = 0 AND store_id = ?");
        $stmt->execute([$store_id]);
        $stats['inactive'] = (int)$stmt->fetchColumn();
        
        // Estoque baixo: soma do estoque das variações <= min_stock_alert
        $lowStockQuery = "
            SELECT COUNT(*) FROM (
                SELECT p.id
                FROM products p
                JOIN product_variations pv ON p.id = pv.product_id
                WHERE p.store_id = ?
                GROUP BY p.id
                HAVING SUM(pv.stock) <= MAX(pv.min_stock_alert)
            ) as low_stock_products
        ";
        $stmt = $pdo->prepare($lowStockQuery);
        $stmt->execute([$store_id]);
        $stats['low_stock'] = (int)$stmt->fetchColumn();

        // 2. Listagem de produtos com paginação
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        $query = "
            SELECT 
                p.*,
                (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY image_order ASC LIMIT 1) as main_image,
                (SELECT SUM(stock) FROM product_variations WHERE product_id = p.id) as total_stock,
                (SELECT views FROM product_views WHERE product_id = p.id) as views,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) as sales_count
            FROM products p
            WHERE p.store_id = :store_id
        ";

        $params = [':store_id' => $store_id];

        if (!empty($search)) {
            $query .= " AND (p.name LIKE :search OR p.category LIKE :search)";
            $params[':search'] = "%$search%";
        }

        $category = isset($_GET['category']) ? $_GET['category'] : '';
        if (!empty($category)) {
            $query .= " AND p.category = :category";
            $params[':category'] = $category;
        }

        $active = isset($_GET['active']) ? $_GET['active'] : '';
        if ($active !== '') {
            $query .= " AND p.active = :active";
            $params[':active'] = (int)$active;
        }

        $query .= " ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $products = $stmt->fetchAll();

        // Total filtrado para paginação
        $countQuery = "SELECT COUNT(*) FROM products p WHERE p.store_id = :store_id";
        if (!empty($search)) {
            $countQuery .= " AND (p.name LIKE :search OR p.category LIKE :search)";
        }
        if (!empty($category)) {
            $countQuery .= " AND p.category = :category";
        }
        if ($active !== '') {
            $countQuery .= " AND p.active = :active";
        }
        $countStmt = $pdo->prepare($countQuery);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $totalFiltered = (int)$countStmt->fetchColumn();

        send_json(['stats'=>$stats,'products'=>$products,'total'=>$totalFiltered,'limit'=>$limit,'offset'=>$offset]);
    } 
    elseif ($method === 'POST') {
        // Create or Update
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!$data) {
            $data = $_POST;
        }

        $id = isset($data['id']) ? $data['id'] : null;
        $hasVariationAttributesJson = table_has_column($pdo, 'products', 'variation_attributes_json');
        $variationAttributesJson = json_encode($data['variationAttributes'] ?? [], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);

        if (($data['action'] ?? '') === 'toggle_status') {
            $id = isset($data['id']) ? (int)$data['id'] : 0;
            $store_id = isset($data['store_id']) ? (int)$data['store_id'] : 0;
            $active = isset($data['active']) ? (int)$data['active'] : 0;
            if ($id <= 0 || $store_id <= 0) throw new Exception('Dados inválidos para atualizar status.');
            $stmt = $pdo->prepare("UPDATE products SET active = ?, updated_at = NOW() WHERE id = ? AND store_id = ?");
            $stmt->execute([$active, $id, $store_id]);
            send_json(['success' => true, 'message' => 'Status do produto atualizado com sucesso.']);
        }

        $weightKg = isset($data['weight_kg']) ? $data['weight_kg'] : ($data['weight'] ?? null);
        $heightCm = isset($data['height_cm']) ? $data['height_cm'] : ($data['height'] ?? null);
        $widthCm = isset($data['width_cm']) ? $data['width_cm'] : ($data['width'] ?? null);
        $lengthCm = isset($data['length_cm']) ? $data['length_cm'] : ($data['length'] ?? null);

        if ($id) {
            // Update
            if ($hasVariationAttributesJson) {
                $stmt = $pdo->prepare("
                    UPDATE products SET 
                        name = ?, sku = ?, shortDescription = ?, description = ?, variation_attributes_json = ?,
                        basePrice = ?, category = ?, active = ?, 
                        shippingType = ?, shippingPrice = ?,
                        weight_kg = ?, height_cm = ?, width_cm = ?, length_cm = ?
                    WHERE id = ? AND store_id = ?
                ");
                $stmt->execute([
                    $data['name'], ($data['sku'] ?? ''), $data['shortDescription'], $data['description'], $variationAttributesJson,
                    $data['basePrice'], $data['category'], $data['active'],
                    $data['shippingType'], $data['shippingPrice'],
                    $weightKg !== '' ? $weightKg : null,
                    $heightCm !== '' ? $heightCm : null,
                    $widthCm !== '' ? $widthCm : null,
                    $lengthCm !== '' ? $lengthCm : null,
                    $id, $data['store_id']
                ]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE products SET 
                        name = ?, sku = ?, shortDescription = ?, description = ?, 
                        basePrice = ?, category = ?, active = ?, 
                        shippingType = ?, shippingPrice = ?,
                        weight_kg = ?, height_cm = ?, width_cm = ?, length_cm = ?
                    WHERE id = ? AND store_id = ?
                ");
                $stmt->execute([
                    $data['name'], ($data['sku'] ?? ''), $data['shortDescription'], $data['description'],
                    $data['basePrice'], $data['category'], $data['active'],
                    $data['shippingType'], $data['shippingPrice'],
                    $weightKg !== '' ? $weightKg : null,
                    $heightCm !== '' ? $heightCm : null,
                    $widthCm !== '' ? $widthCm : null,
                    $lengthCm !== '' ? $lengthCm : null,
                    $id, $data['store_id']
                ]);
            }
        } else {
            // Create
            if ($hasVariationAttributesJson) {
                $stmt = $pdo->prepare("
                    INSERT INTO products (
                        name, sku, shortDescription, description, variation_attributes_json,
                        basePrice, category, active, 
                        shippingType, shippingPrice, weight_kg, height_cm, width_cm, length_cm, store_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['name'], ($data['sku'] ?? ''), $data['shortDescription'], $data['description'], $variationAttributesJson,
                    $data['basePrice'], $data['category'], $data['active'],
                    $data['shippingType'], $data['shippingPrice'],
                    $weightKg !== '' ? $weightKg : null,
                    $heightCm !== '' ? $heightCm : null,
                    $widthCm !== '' ? $widthCm : null,
                    $lengthCm !== '' ? $lengthCm : null,
                    $data['store_id']
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO products (
                        name, sku, shortDescription, description, 
                        basePrice, category, active, 
                        shippingType, shippingPrice, weight_kg, height_cm, width_cm, length_cm, store_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['name'], ($data['sku'] ?? ''), $data['shortDescription'], $data['description'],
                    $data['basePrice'], $data['category'], $data['active'],
                    $data['shippingType'], $data['shippingPrice'],
                    $weightKg !== '' ? $weightKg : null,
                    $heightCm !== '' ? $heightCm : null,
                    $widthCm !== '' ? $widthCm : null,
                    $lengthCm !== '' ? $lengthCm : null,
                    $data['store_id']
                ]);
            }
            $id = $pdo->lastInsertId();
            
            // Initialize views
            $pdo->prepare("INSERT INTO product_views (product_id, views) VALUES (?, 0)")->execute([$id]);
        }

        // Variações
        if (isset($data['variations'])) {
            $pdo->prepare("DELETE FROM product_variations WHERE product_id = ?")->execute([$id]);
            $pvHasSku = table_has_column($pdo, 'product_variations', 'sku');
            $pvHasAttributesJson = table_has_column($pdo, 'product_variations', 'attributes_json');
            $pvHasImageUrl = table_has_column($pdo, 'product_variations', 'image_url');
            $pvHasColorLabel = table_has_column($pdo, 'product_variations', 'color_label');
            $pvHasSizeLabel = table_has_column($pdo, 'product_variations', 'size_label');
            $pvHasSortOrder = table_has_column($pdo, 'product_variations', 'sort_order');
            $pvHasVariationKey = table_has_column($pdo, 'product_variations', 'variation_key');

            foreach ($data['variations'] as $index => $v) {
                $attributesRaw = $v['attributes_json'] ?? [];
                if (is_string($attributesRaw)) {
                    $decoded = json_decode($attributesRaw, true);
                    $attributes = is_array($decoded) ? $decoded : [];
                } else {
                    $attributes = is_array($attributesRaw) ? $attributesRaw : [];
                }

                $colorLabel = null;
                $sizeLabel = null;
                foreach ($attributes as $attrName => $attrValue) {
                    $label = is_array($attrValue) ? ($attrValue['label'] ?? '') : $attrValue;
                    $normalizedAttr = mb_strtolower((string)$attrName, 'UTF-8');
                    if ($normalizedAttr === 'cor' && !$colorLabel) $colorLabel = $label;
                    if ($normalizedAttr === 'tamanho' && !$sizeLabel) $sizeLabel = $label;
                }

                $columns = ['product_id', 'name', 'priceExtra', 'stock', 'min_stock_alert', 'active'];
                $placeholders = ['?', '?', '?', '?', '?', '?'];
                $params = [
                    $id,
                    $v['name'] ?? ('Variação ' . ($index + 1)),
                    isset($v['priceExtra']) ? (float)$v['priceExtra'] : 0,
                    isset($v['stock']) ? (int)$v['stock'] : 0,
                    isset($v['min_stock_alert']) ? (int)$v['min_stock_alert'] : 5,
                    isset($v['active']) ? (int)$v['active'] : 1,
                ];

                if ($pvHasSku) { $columns[] = 'sku'; $placeholders[] = '?'; $params[] = $v['sku'] ?? null; }
                if ($pvHasColorLabel) { $columns[] = 'color_label'; $placeholders[] = '?'; $params[] = $colorLabel ?: null; }
                if ($pvHasSizeLabel) { $columns[] = 'size_label'; $placeholders[] = '?'; $params[] = $sizeLabel ?: null; }
                if ($pvHasAttributesJson) { $columns[] = 'attributes_json'; $placeholders[] = '?'; $params[] = json_encode($attributes, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); }
                if ($pvHasImageUrl) { $columns[] = 'image_url'; $placeholders[] = '?'; $params[] = $v['image_url'] ?? null; }
                if ($pvHasSortOrder) { $columns[] = 'sort_order'; $placeholders[] = '?'; $params[] = $index; }
                if ($pvHasVariationKey) { $columns[] = 'variation_key'; $placeholders[] = '?'; $params[] = $v['variation_key'] ?? null; }

                $sql = "INSERT INTO product_variations (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
        }

        // Imagens (Sync)
        if (isset($data['images'])) {
            $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
            foreach ($data['images'] as $img) {
                $image_url = $img['image_url'];
                
                // Se for base64, salva como arquivo
                if (strpos($image_url, 'data:image') === 0) {
                    $parts = explode(',', $image_url);
                    $data_img = base64_decode($parts[1]);
                    
                    // Detecta extensão
                    $finfo = finfo_open();
                    $mime_type = finfo_buffer($finfo, $data_img, FILEINFO_MIME_TYPE);
                    finfo_close($finfo);
                    
                    $ext = 'png';
                    if ($mime_type === 'image/jpeg') $ext = 'jpg';
                    elseif ($mime_type === 'image/webp') $ext = 'webp';
                    
                    $filename = 'prod_' . $id . '_' . uniqid() . '.' . $ext;
                    file_put_contents($upload_dir . $filename, $data_img);
                    
                    $image_url = './uploads/' . $filename;
                }

                $stmt = $pdo->prepare("INSERT INTO product_images (product_id, image_url, image_order) VALUES (?, ?, ?)");
                $stmt->execute([$id, $image_url, $img['image_order']]);
            }
        }

        send_json(['success' => true, 'id' => $id]);
    }
    elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        $store_id = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
        if ($id <= 0) throw new Exception("ID não fornecido");
        if ($store_id <= 0) throw new Exception("Loja não informada");

        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ? AND store_id = ? LIMIT 1");
        $stmt->execute([$id, $store_id]);
        if (!$stmt->fetchColumn()) throw new Exception("Produto não encontrado para esta loja");

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM order_items WHERE product_id = ?");
        $stmt->execute([$id]);
        if ((int)$stmt->fetchColumn() > 0) {
            send_json(['success' => false, 'error' => 'Este produto já possui histórico de vendas e não pode ser excluído. Desative-o no painel.'], 409);
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("SELECT image_url FROM product_images WHERE product_id = ?");
            $stmt->execute([$id]);
            $images = $stmt->fetchAll();

            foreach ($images as $img) {
                $url = $img['image_url'];
                $filename = basename((string)$url);
                $filepath = $upload_dir . $filename;
                if ($filename && file_exists($filepath)) {
                    @unlink($filepath);
                }
            }

            $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM product_variations WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM product_views WHERE product_id = ?")->execute([$id]);
            $stmtDelete = $pdo->prepare("DELETE FROM products WHERE id = ? AND store_id = ?");
            $stmtDelete->execute([$id, $store_id]);

            if ($stmtDelete->rowCount() === 0) {
                throw new Exception("Não foi possível excluir o produto");
            }

            $pdo->commit();
            send_json(['success' => true, 'message' => 'Produto excluído com sucesso.']);
        } catch (Throwable $deleteError) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $deleteError;
        }
    }

} catch (Throwable $e) {
    send_json(['success' => false, 'error' => $e->getMessage()], 500);
}
?>
