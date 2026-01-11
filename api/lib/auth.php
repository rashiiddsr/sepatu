<?php

require_once __DIR__ . '/response.php';

function requireAuth(): string
{
    if (empty($_SESSION['user_id'])) {
        errorResponse('Unauthorized', 401);
    }

    return $_SESSION['user_id'];
}

function requireAdmin(): void
{
    $role = $_SESSION['role'] ?? 'customer';
    if (!in_array($role, ['admin', 'super_admin'], true)) {
        errorResponse('Forbidden', 403);
    }
}
