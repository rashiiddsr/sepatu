<?php

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/uuid.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$fullName = trim($input['full_name'] ?? '');

if ($email === '' || $password === '' || $fullName === '') {
    errorResponse('Email, password, and full name are required');
}

$db = getDb();

$checkStmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$checkStmt->store_result();
if ($checkStmt->num_rows > 0) {
    errorResponse('Email already registered', 409);
}
$checkStmt->close();

$userId = generateUuid();
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$db->begin_transaction();

try {
    $userStmt = $db->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)');
    $userStmt->bind_param('sss', $userId, $email, $passwordHash);
    $userStmt->execute();
    $userStmt->close();

    $profileStmt = $db->prepare('INSERT INTO profiles (id, full_name, role) VALUES (?, ?, ?)');
    $role = 'customer';
    $profileStmt->bind_param('sss', $userId, $fullName, $role);
    $profileStmt->execute();
    $profileStmt->close();

    $db->commit();
} catch (Throwable $e) {
    $db->rollback();
    errorResponse('Failed to register user', 500);
}

$_SESSION['user_id'] = $userId;
$_SESSION['email'] = $email;
$_SESSION['role'] = 'customer';

$profileStmt = $db->prepare('SELECT * FROM profiles WHERE id = ? LIMIT 1');
$profileStmt->bind_param('s', $userId);
$profileStmt->execute();
$result = $profileStmt->get_result();
$profile = $result->fetch_assoc();
$profileStmt->close();

jsonResponse([
    'data' => [
        'user' => [
            'id' => $userId,
            'email' => $email,
        ],
        'profile' => $profile,
    ],
]);
