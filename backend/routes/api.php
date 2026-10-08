<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\PaymentController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminWebsiteController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminVoucherController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminAnalyticsController;
use App\Http\Controllers\Admin\AdminUploadController;
use App\Http\Controllers\Admin\AdminPlanController;
use App\Http\Controllers\User\AffiliateController;
use App\Http\Controllers\Admin\AdminAffiliateController;

// ══════════════════════════════════════════════════════════
//  PUBLIC — Extension & Landing
// ══════════════════════════════════════════════════════════
Route::middleware('throttle:login')->post('/login',           [AuthController::class, 'login']);
Route::middleware('throttle:register')->post('/register',     [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->post('/sync',              [AuthController::class, 'sync']);
Route::middleware('throttle:track-click')->post('/track-click',[AuthController::class, 'trackClick']);
Route::get('/settings/public',                                [AuthController::class, 'publicSettings']);
Route::get('/payment/plans',                                  [PaymentController::class, 'plans']);
Route::get('/affiliate/validate/{code}',                      [PaymentController::class, 'validateReferral']);

// Registration with immediate payment
Route::middleware('throttle:register')->post('/register/checkout', [PaymentController::class, 'registerCheckout']);
Route::get('/register/status/{orderId}',                           [PaymentController::class, 'registerStatus']);
Route::post('/register/validate-voucher',                          [PaymentController::class, 'registerValidateVoucher']);

// Webhook Paymenku (no auth, both standard and /paymenku alias supported)
Route::post('/payment/webhook',          [PaymentController::class, 'webhook']);
Route::post('/payment/webhook/paymenku', [PaymentController::class, 'webhook']);

// Unified login (admin + user)
Route::middleware('throttle:login')->post('/unified-login', [AuthController::class, 'unifiedLogin']);

// ══════════════════════════════════════════════════════════
//  USER — Web Dashboard (Sanctum protected)
// ══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile',                 [UserController::class, 'profile']);
    Route::put('/profile',                 [UserController::class, 'updateProfile']);
    Route::put('/change-password',         [UserController::class, 'changePassword']);
    Route::post('/reset-device',           [UserController::class, 'resetDevice']);
    Route::get('/payment-history',         [UserController::class, 'paymentHistory']);
    Route::get('/renewal-info',            [UserController::class, 'renewalInfo']);

    // Affiliate (User)
    Route::get('/affiliate',               [AffiliateController::class, 'dashboard']);
    Route::put('/affiliate/bank-account',  [AffiliateController::class, 'updateBankAccount']);
    Route::post('/affiliate/payout',       [AffiliateController::class, 'requestPayout']);
    Route::get('/affiliate/referrals',     [AffiliateController::class, 'referrals']);
    Route::get('/affiliate/earnings',      [AffiliateController::class, 'earnings']);
    Route::get('/affiliate/payouts',       [AffiliateController::class, 'payouts']);
});

// User login (web dashboard)
Route::middleware('throttle:login')->post('/user/login', [UserController::class, 'login']);

// ══════════════════════════════════════════════════════════
//  PAYMENT — User protected
// ══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->prefix('payment')->group(function () {
    Route::post('/validate-voucher', [PaymentController::class, 'validateVoucher']);
    Route::post('/create',           [PaymentController::class, 'create']);
    Route::post('/cancel/{orderId}', [PaymentController::class, 'cancel']);
    Route::get('/status/{orderId}',  [PaymentController::class, 'status']);
    Route::get('/history',           [PaymentController::class, 'history']);
});

// ══════════════════════════════════════════════════════════
//  ADMIN — Sanctum + role check
// ══════════════════════════════════════════════════════════
Route::middleware('throttle:login')->post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'admin.auth'])->prefix('admin')->group(function () {

    // Admin profile / password
    Route::put('/change-password', [AdminAuthController::class, 'changePassword']);

    // Dashboard stats
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // Users CRUD
    Route::get('/users/export',                 [AdminUserController::class, 'export']);
    Route::get('/users',                        [AdminUserController::class, 'index']);
    Route::post('/users',                       [AdminUserController::class, 'store']);
    Route::get('/users/{id}',                   [AdminUserController::class, 'show']);
    Route::put('/users/{id}',                   [AdminUserController::class, 'update']);
    Route::delete('/users/{id}',                [AdminUserController::class, 'destroy']);
    Route::post('/users/{id}/reset-device',     [AdminUserController::class, 'resetDevice']);

    // Websites CRUD
    Route::get('/websites',            [AdminWebsiteController::class, 'index']);
    Route::post('/websites',           [AdminWebsiteController::class, 'store']);
    Route::put('/websites/{id}',       [AdminWebsiteController::class, 'update']);
    Route::delete('/websites/{id}',    [AdminWebsiteController::class, 'destroy']);
    // Website accounts (cookies)
    Route::get('/websites/{id}/accounts',        [AdminWebsiteController::class, 'accounts']);
    Route::post('/websites/{id}/accounts',       [AdminWebsiteController::class, 'addAccount']);
    Route::put('/websites/{id}/accounts/{accId}',[AdminWebsiteController::class, 'updateAccount']);
    Route::delete('/websites/{id}/accounts/{accId}', [AdminWebsiteController::class, 'destroyAccount']);

    // Categories CRUD
    Route::get('/categories',          [AdminCategoryController::class, 'index']);
    Route::post('/categories',         [AdminCategoryController::class, 'store']);
    Route::put('/categories/{id}',     [AdminCategoryController::class, 'update']);
    Route::delete('/categories/{id}',  [AdminCategoryController::class, 'destroy']);

    // Orders
    Route::get('/orders',              [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}',         [AdminOrderController::class, 'show']);
    Route::post('/orders/{id}/activate',[AdminOrderController::class, 'manualActivate']);

    // Vouchers CRUD
    Route::get('/vouchers',            [AdminVoucherController::class, 'index']);
    Route::post('/vouchers',           [AdminVoucherController::class, 'store']);
    Route::put('/vouchers/{id}',       [AdminVoucherController::class, 'update']);
    Route::delete('/vouchers/{id}',    [AdminVoucherController::class, 'destroy']);

    // Plans CRUD
    Route::get('/plans',               [AdminPlanController::class, 'index']);
    Route::post('/plans',              [AdminPlanController::class, 'store']);
    Route::put('/plans/{id}',          [AdminPlanController::class, 'update']);
    Route::delete('/plans/{id}',       [AdminPlanController::class, 'destroy']);
    Route::post('/plans/{id}/toggle',  [AdminPlanController::class, 'toggle']);

    // Affiliate Management (Admin)
    Route::get('/affiliates',                      [AdminAffiliateController::class, 'index']);
    Route::get('/affiliate/search-users',          [AdminAffiliateController::class, 'searchUsers']);
    Route::post('/affiliates',                     [AdminAffiliateController::class, 'store']);
    Route::put('/affiliates/{id}',                 [AdminAffiliateController::class, 'update']);
    Route::delete('/affiliates/{id}',              [AdminAffiliateController::class, 'destroy']);
    Route::get('/affiliate/payouts',               [AdminAffiliateController::class, 'payouts']);
    Route::post('/affiliate/payouts/{id}/approve', [AdminAffiliateController::class, 'approvePayout']);
    Route::post('/affiliate/payouts/{id}/reject',  [AdminAffiliateController::class, 'rejectPayout']);
    Route::get('/affiliate/earnings',              [AdminAffiliateController::class, 'earnings']);
    Route::get('/affiliate/settings',              [AdminAffiliateController::class, 'getSettings']);
    Route::put('/affiliate/settings',              [AdminAffiliateController::class, 'updateSettings']);

    // Analytics
    Route::get('/analytics/users',       [AdminAnalyticsController::class, 'users']);
    Route::get('/analytics/clicks',      [AdminAnalyticsController::class, 'clicks']);
    Route::get('/analytics/clicks-daily',[AdminAnalyticsController::class, 'clicksDaily']);

    // Activity logs
    Route::get('/logs', [AdminController::class, 'logs']);

    // Settings
    Route::get('/settings',   [AdminSettingsController::class, 'index']);
    Route::put('/settings',   [AdminSettingsController::class, 'update']);

    // Uploads
    Route::post('/upload/brand/{type}', [AdminUploadController::class, 'uploadBrand']);
    Route::delete('/upload/brand/{type}', [AdminUploadController::class, 'deleteBrand']);
    Route::post('/upload/extension',    [AdminUploadController::class, 'uploadExtension']);
    Route::delete('/upload/extension',  [AdminUploadController::class, 'deleteExtension']);
    Route::post('/upload/website-icon', [AdminUploadController::class, 'uploadWebsiteIcon']);

    // Admin management (superadmin only)
    Route::middleware('superadmin')->group(function () {
        Route::get('/admins',           [AdminAuthController::class, 'list']);
        Route::post('/admins',          [AdminAuthController::class, 'create']);
        Route::delete('/admins/{id}',   [AdminAuthController::class, 'destroy']);
    });
});

// 404 fallback
Route::fallback(function () {
    return response()->json(['error' => 'Route tidak ditemukan'], 404);
});
