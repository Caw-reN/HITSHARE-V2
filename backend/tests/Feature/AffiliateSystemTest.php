<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AffiliateSystemTest extends TestCase
{
    /**
     * Test full affiliate lifecycle
     */
    public function test_full_affiliate_lifecycle(): void
    {
        $createdUserIds = [];
        $createdOrderIds = [];
        $createdAdminIds = [];

        try {
            // 1. Ensure settings exist
            Setting::set('affiliate_enabled', '1');
            Setting::set('affiliate_commission_default', '25000');
            Setting::set('affiliate_min_payout', '50000');

            // 2. Create Admin and Affiliate User
            $admin = Admin::firstOrCreate(
                ['username' => 'admin_aff_test_' . rand(100, 999)],
                ['password' => Hash::make('password123'), 'role' => 'superadmin']
            );
            $createdAdminIds[] = $admin->id;

            $affiliateUser = User::create([
                'name'      => 'Budi Afiliator',
                'email'     => 'budi_aff_' . time() . '_' . rand(100, 999) . '@test.com',
                'phone'     => '0812' . rand(10000000, 99999999),
                'password'  => Hash::make('password123'),
                'is_active' => true,
                'status'    => 'active',
            ]);
            $createdUserIds[] = $affiliateUser->id;

            $adminToken = $admin->createToken('admin-test')->plainTextToken;
            $affCode = 'BUDI' . rand(1000, 9999);

            // 3. Admin appoints Budi as Affiliate
            $appointRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
                ->postJson('/api/admin/affiliates', [
                    'user_id'              => $affiliateUser->id,
                    'affiliate_code'       => $affCode,
                    'affiliate_commission' => 25000,
                ]);

            $appointRes->assertStatus(200);
            $this->assertDatabaseHas('users', [
                'id'             => $affiliateUser->id,
                'is_affiliate'   => true,
                'affiliate_code' => $affCode,
            ]);

            // 4. Public referral validation endpoint
            $validateRes = $this->getJson("/api/affiliate/validate/{$affCode}");
            $validateRes->assertStatus(200);
            $validateRes->assertJson([
                'valid' => true,
                'code'  => $affCode,
            ]);

            // 5. User Affiliate Dashboard
            auth()->forgetGuards();
            $affiliateUser = $affiliateUser->fresh();
            $affToken = $affiliateUser->createToken('aff-test')->plainTextToken;
            $this->flushHeaders();
            $affDashRes = $this->withHeader('Authorization', "Bearer {$affToken}")
                ->getJson('/api/user/affiliate');

            $affDashRes->assertStatus(200);
            $affDashRes->assertJson([
                'is_affiliate'      => true,
                'affiliate_code'    => $affCode,
                'affiliate_balance' => 0,
                'commission_rate'   => 25000,
            ]);

            // 6. Set up bank account for affiliate
            $bankRes = $this->withHeader('Authorization', "Bearer {$affToken}")
                ->putJson('/api/user/affiliate/bank-account', [
                    'bank_name'           => 'BCA',
                    'bank_account_number' => '1234567890',
                    'bank_account_holder' => 'Budi Santoso',
                ]);

            $bankRes->assertStatus(200);
            $this->assertDatabaseHas('users', [
                'id'                  => $affiliateUser->id,
                'bank_name'           => 'BCA',
                'bank_account_number' => '1234567890',
            ]);

            // 7. New Buyer registers and checks out using referral code
            $buyerEmail = 'buyer_' . time() . '_' . rand(100, 999) . '@test.com';
            $buyerUser = User::create([
                'name'           => 'Calon Pelanggan',
                'email'          => $buyerEmail,
                'phone'          => '0812' . rand(10000000, 99999999),
                'password'       => Hash::make('password123'),
                'is_active'      => false,
                'status'         => 'pending',
                'referred_by_id' => $affiliateUser->id,
            ]);
            $createdUserIds[] = $buyerUser->id;

            $orderId = 'HSR-TEST-' . time() . '-' . rand(100, 999);
            $order = Order::create([
                'user_id'           => $buyerUser->id,
                'email'             => $buyerEmail,
                'order_id'          => $orderId,
                'plan'              => 'monthly',
                'amount'            => 25000,
                'duration_days'     => 30,
                'status'            => 'pending',
                'referred_by_id'    => $affiliateUser->id,
                'affiliate_code'    => $affCode,
                'commission_amount' => 25000,
            ]);
            $createdOrderIds[] = $order->id;

            // 8. Simulate successful QRIS payment
            $order->update(['status' => 'paid', 'paid_at' => now()]);

            // Emulate commission settlement
            AffiliateEarning::create([
                'affiliate_id'      => $affiliateUser->id,
                'referred_user_id'  => $buyerUser->id,
                'order_id'          => $order->order_id,
                'order_amount'      => (int) $order->amount,
                'commission_amount' => (int) $order->commission_amount,
                'status'            => 'available',
            ]);
            $affiliateUser->increment('affiliate_balance', 25000);

            // Add second commission to cross minimum payout threshold (Rp 50.000)
            $buyer2 = User::create([
                'name'           => 'Buyer 2',
                'email'          => 'buyer2_' . time() . '_' . rand(100, 999) . '@test.com',
                'phone'          => '0812' . rand(10000000, 99999999),
                'password'       => Hash::make('password123'),
                'is_active'      => true,
                'status'         => 'active',
                'referred_by_id' => $affiliateUser->id,
            ]);
            $createdUserIds[] = $buyer2->id;

            $order2Id = 'HSR-TEST-2-' . rand(100, 999);
            $order2 = Order::create([
                'user_id'           => $buyer2->id,
                'email'             => $buyer2->email,
                'order_id'          => $order2Id,
                'plan'              => 'monthly',
                'amount'            => 25000,
                'duration_days'     => 30,
                'status'            => 'paid',
                'paid_at'           => now(),
                'referred_by_id'    => $affiliateUser->id,
                'affiliate_code'    => $affCode,
                'commission_amount' => 25000,
            ]);
            $createdOrderIds[] = $order2->id;

            AffiliateEarning::create([
                'affiliate_id'      => $affiliateUser->id,
                'referred_user_id'  => $buyer2->id,
                'order_id'          => $order2Id,
                'order_amount'      => 25000,
                'commission_amount' => 25000,
                'status'            => 'available',
            ]);
            $affiliateUser->increment('affiliate_balance', 25000);

            $freshAffiliate = $affiliateUser->fresh();
            $this->assertEquals(50000, $freshAffiliate->affiliate_balance);

            // 9. Affiliate submits Payout Request for Rp 50.000
            $payoutRes = $this->withHeader('Authorization', "Bearer {$affToken}")
                ->postJson('/api/user/affiliate/payout', [
                    'amount' => 50000,
                    'notes'  => 'Mohon transfer ke BCA saya',
                ]);

            $payoutRes->assertStatus(200);
            $this->assertEquals(0, $affiliateUser->fresh()->affiliate_balance);

            $payout = AffiliatePayout::where('affiliate_id', $affiliateUser->id)->first();
            $this->assertNotNull($payout);
            $this->assertEquals('pending', $payout->status);
            $this->assertEquals(50000, $payout->amount);

            // 10. Admin approves Payout
            auth()->forgetGuards();
            $this->flushHeaders();
            $approveRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
                ->postJson("/api/admin/affiliate/payouts/{$payout->id}/approve", [
                    'admin_notes' => 'Transfer berhasil via BCA Mobile ref #TRX9988',
                ]);

            $approveRes->assertStatus(200);
            $this->assertEquals('approved', $payout->fresh()->status);
            $this->assertEquals('Transfer berhasil via BCA Mobile ref #TRX9988', $payout->fresh()->admin_notes);
        } finally {
            // Clean up test data
            if (!empty($createdUserIds)) {
                AffiliatePayout::whereIn('affiliate_id', $createdUserIds)->delete();
                AffiliateEarning::whereIn('affiliate_id', $createdUserIds)->orWhereIn('referred_user_id', $createdUserIds)->delete();
                Order::whereIn('user_id', $createdUserIds)->delete();
                User::whereIn('id', $createdUserIds)->delete();
            }
            if (!empty($createdOrderIds)) {
                Order::whereIn('id', $createdOrderIds)->delete();
            }
            if (!empty($createdAdminIds)) {
                Admin::whereIn('id', $createdAdminIds)->delete();
            }
        }
    }
}
