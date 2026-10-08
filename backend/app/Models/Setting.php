<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    public $timestamps = false;
    public $incrementing = false;
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    /**
     * Keys that must be encrypted at rest in the database.
     */
    public const ENCRYPTED_KEYS = [
        'paymenku_api_key',
        'paymenku_webhook_secret',
        'paymenku_sandbox_api_key',
        'paymenku_sandbox_webhook_secret',
        'paymenku_prod_api_key',
        'paymenku_prod_webhook_secret',
    ];

    /**
     * Automatically encrypt sensitive keys before saving to database.
     */
    protected static function booted(): void
    {
        static::saving(function (Setting $setting) {
            if (self::isEncryptedKey($setting->key) && !empty($setting->value)) {
                $setting->value = self::encryptValue($setting->key, $setting->value);
            }
        });
    }

    /**
     * Check if a key is sensitive and requires encryption.
     */
    public static function isEncryptedKey(string $key): bool
    {
        return in_array($key, self::ENCRYPTED_KEYS, true);
    }

    /**
     * Safely decrypt a value, returning plaintext if unencrypted or on failure.
     */
    public static function decryptValue(string $key, ?string $value): ?string
    {
        if ($value === null || $value === '' || !self::isEncryptedKey($key)) {
            return $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException) {
            // Value is legacy plaintext or already plain; return as is
            return $value;
        }
    }

    /**
     * Safely encrypt a value for storage if key is in ENCRYPTED_KEYS.
     */
    public static function encryptValue(string $key, ?string $value): ?string
    {
        if ($value === null || $value === '' || !self::isEncryptedKey($key)) {
            return $value;
        }

        // Avoid double-encryption if already encrypted
        try {
            Crypt::decryptString($value);
            return $value; // Already encrypted
        } catch (DecryptException) {
            return Crypt::encryptString($value);
        }
    }

    /**
     * Get a setting value by key with optional default (auto-decrypted).
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::find($key);
        if (!$row) {
            return $default;
        }
        return self::decryptValue($key, $row->value);
    }

    /**
     * Set or update a setting value (auto-encrypted if sensitive).
     */
    public static function set(string $key, mixed $value): void
    {
        $valToStore = is_null($value) ? '' : (string) $value;
        static::updateOrCreate(['key' => $key], ['value' => $valToStore]);
    }

    /**
     * Helper to get all settings as an associative key-value array with auto-decryption.
     */
    public static function getAll(): array
    {
        $settings = static::pluck('value', 'key')->toArray();
        foreach (self::ENCRYPTED_KEYS as $key) {
            if (isset($settings[$key])) {
                $settings[$key] = self::decryptValue($key, $settings[$key]);
            }
        }
        return $settings;
    }

    /**
     * Helper to get specific settings with auto-decryption.
     */
    public static function getMany(array $keys): array
    {
        $settings = static::whereIn('key', $keys)->pluck('value', 'key')->toArray();
        foreach ($keys as $key) {
            if (isset($settings[$key]) && self::isEncryptedKey($key)) {
                $settings[$key] = self::decryptValue($key, $settings[$key]);
            }
        }
        return $settings;
    }
}
