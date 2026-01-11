<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/uuid.php';

$db = getDb();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $productId = $_GET['id'] ?? null;

    $query = 'SELECT p.*, b.id AS brand_id, b.name AS brand_name, b.description AS brand_description, b.logo_url AS brand_logo_url, c.id AS category_id, c.name AS category_name, c.description AS category_description FROM products p LEFT JOIN brands b ON b.id = p.brand_id LEFT JOIN categories c ON c.id = p.category_id';
    $params = [];

    if ($productId) {
        $query .= ' WHERE p.id = ? LIMIT 1';
        $stmt = $db->prepare($query);
        $stmt->bind_param('s', $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        if (!$row) {
            jsonResponse(['data' => null]);
        }
        $row['price'] = (float) $row['price'];
        $row['stock'] = (int) $row['stock'];
        $row['sizes'] = $row['sizes'] ? json_decode($row['sizes'], true) : [];
        $row['colors'] = $row['colors'] ? json_decode($row['colors'], true) : [];
        $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
        $row['is_featured'] = (bool) $row['is_featured'];
        $row['brands'] = $row['brand_id'] ? [
            'id' => $row['brand_id'],
            'name' => $row['brand_name'],
            'description' => $row['brand_description'],
            'logo_url' => $row['brand_logo_url'],
        ] : null;
        $row['categories'] = $row['category_id'] ? [
            'id' => $row['category_id'],
            'name' => $row['category_name'],
            'description' => $row['category_description'],
        ] : null;
        jsonResponse(['data' => $row]);
    }

    $query .= ' ORDER BY p.created_at DESC';
    $result = $db->query($query);
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $row['price'] = (float) $row['price'];
        $row['stock'] = (int) $row['stock'];
        $row['sizes'] = $row['sizes'] ? json_decode($row['sizes'], true) : [];
        $row['colors'] = $row['colors'] ? json_decode($row['colors'], true) : [];
        $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
        $row['is_featured'] = (bool) $row['is_featured'];
        $row['brands'] = $row['brand_id'] ? [
            'id' => $row['brand_id'],
            'name' => $row['brand_name'],
            'description' => $row['brand_description'],
            'logo_url' => $row['brand_logo_url'],
        ] : null;
        $row['categories'] = $row['category_id'] ? [
            'id' => $row['category_id'],
            'name' => $row['category_name'],
            'description' => $row['category_description'],
        ] : null;
        $products[] = $row;
    }

    jsonResponse(['data' => $products]);
}

if ($method === 'POST') {
    requireAdmin();
    $input = getJsonInput();
    $id = generateUuid();
    $name = trim($input['name'] ?? '');
    $description = $input['description'] ?? null;
    $brandId = $input['brand_id'] ?? null;
    $categoryId = $input['category_id'] ?? null;
    $price = (float) ($input['price'] ?? 0);
    $stock = (int) ($input['stock'] ?? 0);
    $sizes = json_encode($input['sizes'] ?? []);
    $colors = json_encode($input['colors'] ?? []);
    $imageUrl = $input['image_url'] ?? null;
    $images = json_encode($input['images'] ?? []);
    $isFeatured = !empty($input['is_featured']) ? 1 : 0;

    if ($name === '') {
        errorResponse('Product name is required');
    }

    $stmt = $db->prepare('INSERT INTO products (id, name, description, brand_id, category_id, price, stock, sizes, colors, image_url, images, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('sssssdissssi', $id, $name, $description, $brandId, $categoryId, $price, $stock, $sizes, $colors, $imageUrl, $images, $isFeatured);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => ['id' => $id]]);
}

if ($method === 'PUT') {
    requireAdmin();
    $input = getJsonInput();
    $id = $input['id'] ?? null;
    if (!$id) {
        errorResponse('Product id is required');
    }

    $name = trim($input['name'] ?? '');
    $description = $input['description'] ?? null;
    $brandId = $input['brand_id'] ?? null;
    $categoryId = $input['category_id'] ?? null;
    $price = (float) ($input['price'] ?? 0);
    $stock = (int) ($input['stock'] ?? 0);
    $sizes = json_encode($input['sizes'] ?? []);
    $colors = json_encode($input['colors'] ?? []);
    $imageUrl = $input['image_url'] ?? null;
    $images = json_encode($input['images'] ?? []);
    $isFeatured = !empty($input['is_featured']) ? 1 : 0;

    $stmt = $db->prepare('UPDATE products SET name = ?, description = ?, brand_id = ?, category_id = ?, price = ?, stock = ?, sizes = ?, colors = ?, image_url = ?, images = ?, is_featured = ? WHERE id = ?');
    $stmt->bind_param('ssssdissssis', $name, $description, $brandId, $categoryId, $price, $stock, $sizes, $colors, $imageUrl, $images, $isFeatured, $id);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

if ($method === 'DELETE') {
    requireAdmin();
    $input = getJsonInput();
    $id = $input['id'] ?? null;
    if (!$id) {
        errorResponse('Product id is required');
    }

    $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
