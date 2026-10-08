<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'icon', 'sort_order'];

    public function websites()
    {
        return $this->hasMany(Website::class);
    }
}
