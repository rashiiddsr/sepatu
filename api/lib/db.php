<?php

require_once __DIR__ . '/response.php';

function getDb(): mysqli
{
    $config = require __DIR__ . '/../config.php';
    $db = new mysqli(
        $config['host'],
        $config['user'],
        $config['password'],
        $config['database'],
        (int) $config['port']
    );

    if ($db->connect_error) {
        errorResponse('Database connection failed: ' . $db->connect_error, 500);
    }

    $db->set_charset('utf8mb4');

    return $db;
}
