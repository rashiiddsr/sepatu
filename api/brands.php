<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';

$db = getDb();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

$result = $db->query('SELECT * FROM brands ORDER BY name');
$brands = [];
while ($row = $result->fetch_assoc()) {
    $brands[] = $row;
}

jsonResponse(['data' => $brands]);
