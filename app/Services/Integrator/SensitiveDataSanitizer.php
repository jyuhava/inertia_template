<?php

namespace App\Services\Integrator;

use DateTimeInterface;

/** Redacts secrets before any request/response or audit data is persisted. */
class SensitiveDataSanitizer
{
    private const SECRET_KEYS = [
        'token', 'password', 'authorization', 'secret', 'client_secret',
        'api_key', 'apikey', 'access_token', 'refresh_token',
    ];

    /** @param list<?string> $knownSecrets */
    public static function sanitizeText(string $text, array $knownSecrets = []): string
    {
        foreach ($knownSecrets as $secret) {
            if (is_string($secret) && $secret !== '') {
                $text = str_replace($secret, '[REDACTED]', $text);
            }
        }

        return preg_replace(
            '/(token|password|authorization|secret|api[_-]?key)\\s*[:=]\\s*[^\\s,;]+/i',
            '$1=[REDACTED]',
            $text,
        ) ?? '[REDACTED]';
    }

    public static function sanitize(mixed $value): mixed
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format(DATE_ATOM);
        }
        if (is_object($value)) {
            $value = (array) $value;
        }
        if (! is_array($value)) {
            return is_string($value) ? self::sanitizeText($value) : $value;
        }

        $clean = [];
        foreach ($value as $key => $child) {
            $normalizedKey = strtolower(str_replace(['-', ' '], '_', (string) $key));
            $isSecret = in_array($normalizedKey, self::SECRET_KEYS, true)
                || str_ends_with($normalizedKey, '_token')
                || str_ends_with($normalizedKey, '_password')
                || str_ends_with($normalizedKey, '_secret');

            $clean[$key] = $isSecret ? '[REDACTED]' : self::sanitize($child);
        }

        return $clean;
    }
}
