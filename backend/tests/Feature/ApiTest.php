<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiTest extends TestCase
{
    public function test_public_settings_endpoint(): void
    {
        $response = $this->getJson('/api/settings/public');
        $response->assertStatus(200);
        $response->assertJsonStructure(['site_name', 'whatsapp_number']);
    }

    public function test_payment_plans_endpoint(): void
    {
        $response = $this->getJson('/api/payment/plans');
        $response->assertStatus(200);
        $response->assertJsonFragment(['key' => 'monthly']);
    }

    public function test_sync_without_auth_returns_error(): void
    {
        $response = $this->postJson('/api/sync', []);
        $response->assertStatus(401);
    }

    public function test_admin_login_success(): void
    {
        $response = $this->postJson('/api/unified-login', [
            'email'    => 'admin',
            'password' => 'admin123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'role'     => 'admin',
            'username' => 'admin',
            'redirect' => '/admin',
        ]);
        $response->assertJsonStructure(['token']);
    }

    public function test_user_registration_and_login(): void
    {
        $testEmail = 'tester_' . time() . '@hitshare.test';
        $testPassword = 'password123';

        // 1. Register
        $regResponse = $this->postJson('/api/register', [
            'name'     => 'Tester HitShare',
            'email'    => $testEmail,
            'phone'    => '081234567899',
            'password' => $testPassword,
        ]);

        $regResponse->assertStatus(200);
        $regResponse->assertJson(['status' => true]);

        // 2. Unified Login
        $loginResponse = $this->postJson('/api/unified-login', [
            'email'    => $testEmail,
            'password' => $testPassword,
        ]);

        $loginResponse->assertStatus(200);
        $loginResponse->assertJson([
            'role'     => 'user',
            'redirect' => '/akun',
        ]);
        $loginResponse->assertJsonStructure(['token', 'user']);

        // Clean up
        User::where('email', $testEmail)->delete();
    }
}
