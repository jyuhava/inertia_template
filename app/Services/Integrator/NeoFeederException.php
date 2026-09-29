<?php

namespace App\Services\Integrator;

use RuntimeException;

class NeoFeederException extends RuntimeException
{
    /** @param array<string,mixed>|null $response */
    public function __construct(
        string $message,
        public readonly string $category = 'UNKNOWN_ERROR',
        public readonly ?int $httpStatus = null,
        public readonly int|string|null $feederCode = null,
        public readonly ?array $response = null,
    ) {
        parent::__construct($message);
    }
}
