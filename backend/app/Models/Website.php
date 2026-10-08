<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Website extends Model
{
    protected $fillable = ['category_id', 'name', 'icon', 'url', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function accounts()
    {
        return $this->hasMany(WebsiteAccount::class);
    }
}
