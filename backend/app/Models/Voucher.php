<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'code', 'description', 'discount_type', 'discount_value',
        'max_uses', 'used_count', 'min_amount', 'applies_to',
        'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'max_uses'       => 'integer',
        'used_count'     => 'integer',
        'discount_value' => 'integer',
        'min_amount'     => 'integer',
        'valid_from'     => 'datetime',
        'valid_until'    => 'datetime',
    ];

    public function usages()
    {
        return $this->hasMany(VoucherUsage::class);
    }

    public function setDescriptionAttribute($value): void
    {
        $this->attributes['description'] = (string) ($value ?? '');
    }
}
