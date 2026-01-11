<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

requireAdmin();
$db = getDb();

$ordersResult = $db->query('SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders');
$ordersSummary = $ordersResult->fetch_assoc();

$productsResult = $db->query('SELECT COUNT(*) AS total_products FROM products');
$productsSummary = $productsResult->fetch_assoc();

$usersResult = $db->query('SELECT COUNT(*) AS total_users FROM profiles');
$usersSummary = $usersResult->fetch_assoc();

$topProductsResult = $db->query('SELECT p.name, SUM(oi.quantity) AS sales, SUM(oi.price * oi.quantity) AS revenue FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id GROUP BY oi.product_id, p.name ORDER BY revenue DESC LIMIT 5');
$topProducts = [];
while ($row = $topProductsResult->fetch_assoc()) {
    $topProducts[] = [
        'name' => $row['name'] ?? 'Unknown',
        'sales' => (int) $row['sales'],
        'revenue' => (float) $row['revenue'],
    ];
}

$recentOrdersResult = $db->query('SELECT order_number, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
$recentOrders = [];
while ($row = $recentOrdersResult->fetch_assoc()) {
    $row['total_amount'] = (float) $row['total_amount'];
    $recentOrders[] = $row;
}

jsonResponse([
    'data' => [
        'totalRevenue' => (float) $ordersSummary['total_revenue'],
        'totalOrders' => (int) $ordersSummary['total_orders'],
        'totalProducts' => (int) $productsSummary['total_products'],
        'totalUsers' => (int) $usersSummary['total_users'],
        'revenueByMonth' => [],
        'topProducts' => $topProducts,
        'recentOrders' => $recentOrders,
    ],
]);
