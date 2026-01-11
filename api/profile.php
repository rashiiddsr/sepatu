<?php

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';

$userId = requireAuth();
$db = getDb();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1');
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    $stmt->close();

    jsonResponse(['data' => $profile]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getJsonInput();
    $fullName = trim($input['full_name'] ?? '');
    $phone = $input['phone'] ?? null;
    $address = $input['address'] ?? null;
    $city = $input['city'] ?? null;
    $postalCode = $input['postal_code'] ?? null;

    if ($fullName === '') {
        errorResponse('Full name is required');
    }

    $stmt = $db->prepare('UPDATE profiles SET full_name = ?, phone = ?, address = ?, city = ?, postal_code = ? WHERE id = ?');
    $stmt->bind_param('ssssss', $fullName, $phone, $address, $city, $postalCode, $userId);
    $stmt->execute();
    $stmt->close();

    jsonResponse(['data' => true]);
}

errorResponse('Method not allowed', 405);
