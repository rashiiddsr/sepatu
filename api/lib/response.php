<?php

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function errorResponse(string $message, int $status = 400): void
{
    jsonResponse(['error' => $message], $status);
}
