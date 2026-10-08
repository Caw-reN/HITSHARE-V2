<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'device_id',
        'is_active', 'status', 'expires_at',
        'device_reset_count', 'last_device_reset_at',
        'affiliate_code', 'referred_by_id', 'is_affiliate',
        'affiliate_commission', 'affiliate_balance',
        'bank_name', 'bank_account_number', 'bank_account_holder',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'password'             => 'hashed',
        'is_active'            => 'boolean',
        'expires_at'           => 'datetime',
        'last_device_reset_at' => 'datetime',
        'device_reset_count'   => 'integer',
        'is_affiliate'         => 'boolean',
        'affiliate_commission' => 'integer',
        'affiliate_balance'    => 'integer',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function voucherUsages()
    {
        return $this->hasMany(VoucherUsage::class);
    }

    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by_id');
    }

    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by_id');
    }

    public function affiliateEarnings()
    {
        return $this->hasMany(AffiliateEarning::class, 'affiliate_id');
    }

    public function affiliatePayouts()
    {
        return $this->hasMany(AffiliatePayout::class, 'affiliate_id');
    }

    /**
     * Resolve effective status (runtime, not stored override).
     */
    public function effectiveStatus(): string
    {
        if ($this->status === 'active' && $this->expires_at && $this->expires_at->isPast()) {
            return 'expired';
        }
        return $this->status ?? 'pending';
    }

    public function daysLeft(): ?int
    {
        if (!$this->expires_at) return null;
        if ($this->expires_at->isPast()) return 0;
        $diffSeconds = now()->diffInSeconds($this->expires_at, false);
        if ($diffSeconds <= 0) return 0;
        return (int) ceil($diffSeconds / 86400);
    }
}
