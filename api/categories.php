<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';

$db = getDb();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

$result = $db->query('SELECT * FROM categories ORDER BY name');
$categories = [];
while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
}

jsonResponse(['data' => $categories]);
