<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

requireAdmin();
$db = getDb();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = $db->query('SELECT * FROM profiles ORDER BY created_at DESC');
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    jsonResponse(['data' => $users]);
}

if ($method === 'PUT') {
    $input = getJsonInput();
    $userId = $input['id'] ?? null;
    $role = $input['role'] ?? null;

    if (!$userId || !$role) {
        errorResponse('User id and role are required');
    }

    $stmt = $db->prepare('UPDATE profiles SET role = ? WHERE id = ?');
    $stmt->bind_param('ss', $role, $userId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
