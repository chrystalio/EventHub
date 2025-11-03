<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateSetting extends Model
{
    protected $fillable = ['key', 'value', 'description'];

    public static function get($key, $default = null)
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function set($key, $value)
    {
        return static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    // Helper method for certificate numbering
    public static function getGlobalStartNumber(): int
    {
        return (int) static::get('global_certificate_start_number', 1);
    }

    public static function setGlobalStartNumber($number): void
    {
        static::set('global_certificate_start_number', $number);
    }
}
