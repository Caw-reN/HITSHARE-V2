<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteAccount extends Model
{
    protected $fillable = [
        'website_id',
        'label',
        'cookie_data',
        'cookie_updated_at',
        'is_active',
        'cookie_status',
        'cookie_expires_at',
        'last_checked_at',
        'last_notified_at',
        'health_message',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'cookie_updated_at' => 'datetime',
        'cookie_expires_at' => 'datetime',
        'last_checked_at'   => 'datetime',
        'last_notified_at'  => 'datetime',
        'cookie_data'       => 'encrypted',
    ];

    public function website()
    {
        return $this->belongsTo(Website::class);
    }
}
