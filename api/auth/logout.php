<?php

require_once __DIR__ . '/../lib/bootstrap.php';

session_destroy();

jsonResponse(['data' => ['message' => 'Logged out']]);
