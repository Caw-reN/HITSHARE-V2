<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Payout proof images fallback route
Route::get('/storage/payout_proofs/{filename}', function ($filename) {
    $uploadPath = public_path('uploads/payout_proofs/' . $filename);
    if (file_exists($uploadPath)) {
        return response()->file($uploadPath);
    }
    $storagePath = storage_path('app/public/payout_proofs/' . $filename);
    if (file_exists($storagePath)) {
        return response()->file($storagePath);
    }
    abort(404);
});
