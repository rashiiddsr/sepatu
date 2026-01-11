<?php

return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'user' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASSWORD') ?: '',
    'database' => getenv('DB_NAME') ?: 'solemates',
    'port' => getenv('DB_PORT') ?: 3306,
    'allowed_origin' => getenv('APP_ORIGIN') ?: 'http://localhost:5173',
];
