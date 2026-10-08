<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => array_values(array_filter([
        env('ALLOWED_EXTENSION_ID')
            ? '#^chrome-extension://' . preg_quote(env('ALLOWED_EXTENSION_ID'), '#') . '$#'
            : '#^chrome-extension://.*#',
        env('ALLOWED_MOZ_EXTENSION_ID')
            ? '#^moz-extension://' . preg_quote(env('ALLOWED_MOZ_EXTENSION_ID'), '#') . '$#'
            : '#^moz-extension://.*#',
    ])),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
