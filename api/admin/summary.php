<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

requireAdmin();
$db = getDb();

$productsResult = $db->query('SELECT COUNT(*) AS total FROM products');
$products = $productsResult->fetch_assoc();
$ordersResult = $db->query('SELECT COUNT(*) AS total, COALESCE(SUM(total_amount), 0) AS revenue FROM orders');
$orders = $ordersResult->fetch_assoc();
$usersResult = $db->query('SELECT COUNT(*) AS total FROM profiles');
$users = $usersResult->fetch_assoc();

jsonResponse([
    'data' => [
        'totalProducts' => (int) $products['total'],
        'totalOrders' => (int) $orders['total'],
        'totalUsers' => (int) $users['total'],
        'totalRevenue' => (float) $orders['revenue'],
    ],
]);
