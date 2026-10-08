<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('integrator-access', static function ($user): bool {
            return in_array($user->role ?? null, config('integrator.roles', ['admin']), true);
        });

        Vite::prefetch(concurrency: 3);
    }
}
