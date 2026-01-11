<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/uuid.php';

$userId = requireAuth();
$db = getDb();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT w.*, p.name AS product_name, p.price, p.image_url FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ?');
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['products'] = [
            'id' => $row['product_id'],
            'name' => $row['product_name'],
            'price' => (float) $row['price'],
            'image_url' => $row['image_url'],
        ];
        $items[] = $row;
    }
    $stmt->close();

    jsonResponse(['data' => $items]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $productId = $input['product_id'] ?? null;
    if (!$productId) {
        errorResponse('Product id is required');
    }

    $checkStmt = $db->prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ? LIMIT 1');
    $checkStmt->bind_param('ss', $userId, $productId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    if ($result->fetch_assoc()) {
        errorResponse('Item already in wishlist', 409);
    }
    $checkStmt->close();

    $id = generateUuid();
    $stmt = $db->prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $id, $userId, $productId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $itemId = $input['id'] ?? null;
    if (!$itemId) {
        errorResponse('Wishlist item id is required');
    }

    $stmt = $db->prepare('DELETE FROM wishlist WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ss', $itemId, $userId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
