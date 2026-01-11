<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/uuid.php';

$userId = requireAuth();
$db = getDb();
$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'] ?? 'customer';

if ($method === 'GET') {
    $orders = [];

    if (in_array($role, ['admin', 'super_admin'], true)) {
        $result = $db->query('SELECT * FROM orders ORDER BY created_at DESC');
        while ($row = $result->fetch_assoc()) {
            $row['total_amount'] = (float) $row['total_amount'];
            $row['shipping_cost'] = (float) $row['shipping_cost'];
            $orders[$row['id']] = $row;
            $orders[$row['id']]['order_items'] = [];
        }
    } else {
        $stmt = $db->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $row['total_amount'] = (float) $row['total_amount'];
            $row['shipping_cost'] = (float) $row['shipping_cost'];
            $orders[$row['id']] = $row;
            $orders[$row['id']]['order_items'] = [];
        }
        $stmt->close();
    }

    if (!empty($orders)) {
        $orderIds = array_keys($orders);
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $types = str_repeat('s', count($orderIds));
        $stmt = $db->prepare("SELECT oi.*, p.name AS product_name, p.image_url FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id IN ($placeholders)");
        $stmt->bind_param($types, ...$orderIds);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $row['quantity'] = (int) $row['quantity'];
            $row['price'] = (float) $row['price'];
            $row['products'] = [
                'id' => $row['product_id'],
                'name' => $row['product_name'],
                'image_url' => $row['image_url'],
            ];
            $orders[$row['order_id']]['order_items'][] = $row;
        }
        $stmt->close();
    }

    jsonResponse(['data' => array_values($orders)]);
}

if ($method === 'POST') {
    $input = getJsonInput();
    $orderNumber = $input['order_number'] ?? null;
    $totalAmount = (float) ($input['total_amount'] ?? 0);
    $shippingAddress = $input['shipping_address'] ?? '';
    $shippingCity = $input['shipping_city'] ?? '';
    $shippingPostalCode = $input['shipping_postal_code'] ?? '';
    $shippingMethod = $input['shipping_method'] ?? 'regular';
    $shippingCost = (float) ($input['shipping_cost'] ?? 0);
    $notes = $input['notes'] ?? null;
    $status = $input['status'] ?? 'pending';
    $items = $input['items'] ?? [];

    if (!$orderNumber || empty($items)) {
        errorResponse('Order number and items are required');
    }

    $orderId = generateUuid();
    $db->begin_transaction();

    try {
        $stmt = $db->prepare('INSERT INTO orders (id, user_id, order_number, status, total_amount, shipping_address, shipping_city, shipping_postal_code, shipping_method, shipping_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssssdssssds', $orderId, $userId, $orderNumber, $status, $totalAmount, $shippingAddress, $shippingCity, $shippingPostalCode, $shippingMethod, $shippingCost, $notes);
        $stmt->execute();
        $stmt->close();

        $itemStmt = $db->prepare('INSERT INTO order_items (id, order_id, product_id, quantity, size, color, price) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($items as $item) {
            $itemId = generateUuid();
            $productId = $item['product_id'] ?? null;
            $quantity = (int) ($item['quantity'] ?? 1);
            $size = $item['size'] ?? '';
            $color = $item['color'] ?? '';
            $price = (float) ($item['price'] ?? 0);
            if (!$productId) {
                throw new RuntimeException('Invalid item');
            }
            $itemStmt->bind_param('sssissd', $itemId, $orderId, $productId, $quantity, $size, $color, $price);
            $itemStmt->execute();
        }
        $itemStmt->close();

        $db->commit();
    } catch (Throwable $e) {
        $db->rollback();
        errorResponse('Failed to create order', 500);
    }

    jsonResponse(['data' => ['id' => $orderId]]);
}

if ($method === 'PUT') {
    requireAdmin();
    $input = getJsonInput();
    $orderId = $input['id'] ?? null;
    if (!$orderId) {
        errorResponse('Order id is required');
    }

    $status = $input['status'] ?? null;
    $trackingNumber = $input['tracking_number'] ?? null;

    $stmt = $db->prepare('UPDATE orders SET status = COALESCE(?, status), tracking_number = COALESCE(?, tracking_number) WHERE id = ?');
    $stmt->bind_param('sss', $status, $trackingNumber, $orderId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
