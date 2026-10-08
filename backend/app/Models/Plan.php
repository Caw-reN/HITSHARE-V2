<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'plan',
        'label',
        'amount',
        'duration_days',
        'original_price',
        'badge',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'amount'         => 'integer',
        'duration_days'  => 'integer',
        'original_price' => 'integer',
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
    ];
}
