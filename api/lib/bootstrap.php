<?php

require_once __DIR__ . '/response.php';

$config = require __DIR__ . '/../config.php';
$allowedOrigin = $config['allowed_origin'];

if (!headers_sent()) {
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=utf-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

session_start();

function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
