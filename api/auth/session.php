<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';

if (empty($_SESSION['user_id'])) {
    jsonResponse(['data' => null]);
}

$userId = $_SESSION['user_id'];
$db = getDb();
$stmt = $db->prepare('SELECT profiles.*, users.email FROM profiles JOIN users ON users.id = profiles.id WHERE profiles.id = ? LIMIT 1');
$stmt->bind_param('s', $userId);
$stmt->execute();
$result = $stmt->get_result();
$profile = $result->fetch_assoc();
$stmt->close();

if (!$profile) {
    jsonResponse(['data' => null]);
}

jsonResponse([
    'data' => [
        'user' => [
            'id' => $profile['id'],
            'email' => $profile['email'],
        ],
        'profile' => [
            'id' => $profile['id'],
            'full_name' => $profile['full_name'],
            'phone' => $profile['phone'],
            'address' => $profile['address'],
            'city' => $profile['city'],
            'postal_code' => $profile['postal_code'],
            'role' => $profile['role'],
            'created_at' => $profile['created_at'],
            'updated_at' => $profile['updated_at'],
        ],
    ],
]);
