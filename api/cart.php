<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/uuid.php';

$userId = requireAuth();
$db = getDb();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare('SELECT ci.*, p.name AS product_name, p.price, p.image_url FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?');
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['quantity'] = (int) $row['quantity'];
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
    $quantity = (int) ($input['quantity'] ?? 1);
    $size = $input['size'] ?? null;
    $color = $input['color'] ?? null;

    if (!$productId || !$size || !$color) {
        errorResponse('Product, size, and color are required');
    }

    $checkStmt = $db->prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ? LIMIT 1');
    $checkStmt->bind_param('ssss', $userId, $productId, $size, $color);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $existing = $result->fetch_assoc();
    $checkStmt->close();

    if ($existing) {
        $newQuantity = $existing['quantity'] + $quantity;
        $updateStmt = $db->prepare('UPDATE cart_items SET quantity = ? WHERE id = ?');
        $updateStmt->bind_param('is', $newQuantity, $existing['id']);
        $updateStmt->execute();
        $updateStmt->close();
        jsonResponse(['data' => true]);
    }

    $id = generateUuid();
    $stmt = $db->prepare('INSERT INTO cart_items (id, user_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('sssiss', $id, $userId, $productId, $quantity, $size, $color);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

if ($method === 'PUT') {
    $input = getJsonInput();
    $itemId = $input['id'] ?? null;
    $quantity = (int) ($input['quantity'] ?? 1);

    if (!$itemId) {
        errorResponse('Cart item id is required');
    }

    $stmt = $db->prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?');
    $stmt->bind_param('iss', $quantity, $itemId, $userId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

if ($method === 'DELETE') {
    $input = getJsonInput();
    $itemId = $input['id'] ?? null;
    $clearAll = !empty($input['clear_all']);

    if ($clearAll) {
        $stmt = $db->prepare('DELETE FROM cart_items WHERE user_id = ?');
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $stmt->close();

        jsonResponse(['data' => true]);
    }

    if (!$itemId) {
        errorResponse('Cart item id is required');
    }

    $stmt = $db->prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ss', $itemId, $userId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
