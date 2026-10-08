<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateEarning extends Model
{
    protected $fillable = [
        'affiliate_id',
        'referred_user_id',
        'order_id',
        'order_amount',
        'commission_amount',
        'status',
    ];

    protected $casts = [
        'order_amount'      => 'integer',
        'commission_amount' => 'integer',
    ];

    public function affiliate()
    {
        return $this->belongsTo(User::class, 'affiliate_id');
    }

    public function referredUser()
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }
}
