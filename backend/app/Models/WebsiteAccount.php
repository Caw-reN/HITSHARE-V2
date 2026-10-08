<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteAccount extends Model
{
    protected $fillable = ['website_id', 'label', 'cookie_data', 'cookie_updated_at', 'is_active'];

    protected $casts = [
        'is_active'         => 'boolean',
        'cookie_updated_at' => 'datetime',
        'cookie_data'       => 'encrypted',
    ];

    public function website()
    {
        return $this->belongsTo(Website::class);
    }
}
