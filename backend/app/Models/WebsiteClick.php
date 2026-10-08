<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteClick extends Model
{
    public $timestamps = false;
    protected $fillable = ['website_name', 'website_url', 'user_email', 'clicked_at'];
    protected $casts = ['clicked_at' => 'datetime'];
}
