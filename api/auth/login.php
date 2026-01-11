<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    errorResponse('Email and password are required');
}

$db = getDb();
$stmt = $db->prepare('SELECT users.id, users.email, users.password_hash, profiles.* FROM users JOIN profiles ON profiles.id = users.id WHERE users.email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password_hash'])) {
    errorResponse('Invalid credentials', 401);
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

jsonResponse([
    'data' => [
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
        ],
        'profile' => [
            'id' => $user['id'],
            'full_name' => $user['full_name'],
            'phone' => $user['phone'],
            'address' => $user['address'],
            'city' => $user['city'],
            'postal_code' => $user['postal_code'],
            'role' => $user['role'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at'],
        ],
    ],
]);
