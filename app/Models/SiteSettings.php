<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSettings extends Model
{
    public const string CONTACT_EMAIL = 'contact_email';

    /** @var list<string> */
    protected $fillable = ['name', 'value'];

    public static function get(string $key, string $default = ''): string
    {
        return Cache::remember("site_settings.{$key}", now()->addHour(), function () use ($key, $default) {
            return static::where('name', $key)->value('value') ?? $default;
        });
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['name' => $key], ['value' => $value]);
        Cache::forget("site_settings.{$key}");
    }

    public static function flushAll(): void
    {
        static::query()->pluck('name')->each(
            fn (string $name) => Cache::forget("site_settings.{$name}")
        );
    }
}
