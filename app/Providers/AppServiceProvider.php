<?php

namespace App\Providers;

use App\Mail\Transport\BrevoApiTransport;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Mail;
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
        // This is an API-only backend with no `password.reset` web route,
        // so the reset email must link to the React SPA's reset page
        // instead of Laravel's default named-route URL.
        ResetPassword::createUrlUsing(function (User $user, string $token) {
            return rtrim(config('app.frontend_url'), '/')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($user->email);
        });

        // Delivers mail through Brevo's Transactional Email API instead of
        // SMTP (see config/mail.php's "brevo" mailer). Purely a transport
        // swap — the password reset broker, notification, and everything
        // else that sends mail is unaware of which transport is active.
        Mail::extend('brevo', function () {
            return new BrevoApiTransport(
                config('services.brevo.api_key'),
                config('services.brevo.from_email'),
                config('services.brevo.from_name'),
            );
        });
    }
}
