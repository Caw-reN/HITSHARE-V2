<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'email', 'order_id', 'plan', 'amount',
        'original_amount', 'discount_amount', 'commission_amount', 'admin_fee', 'duration_days',
        'status', 'payment_txn_id', 'qr_url', 'qr_string',
        'voucher_code', 'referred_by_id', 'affiliate_code',
        'paid_at', 'expires_at',
    ];

    protected $casts = [
        'paid_at'           => 'datetime',
        'expires_at'        => 'datetime',
        'commission_amount' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by_id');
    }

    public function affiliateEarning()
    {
        return $this->hasOne(AffiliateEarning::class, 'order_id', 'order_id');
    }
}
