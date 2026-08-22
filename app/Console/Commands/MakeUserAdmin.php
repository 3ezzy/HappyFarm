<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Bootstraps the first administrator. Only ever touches `role` — `status`
 * is left exactly as-is, per Phase 4 scope. That means a user promoted
 * while still 'pending' stays 'pending'; AuthController::login()'s admin
 * bypass is what actually lets them log in afterward, not this command.
 */
class MakeUserAdmin extends Command
{
    protected $signature = 'user:make-admin {email}';

    protected $description = 'Promote a user to the admin role by email';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("No user found with email: {$email}");

            return self::FAILURE;
        }

        if ($user->role === 'admin') {
            $this->info("{$email} is already an admin.");

            return self::SUCCESS;
        }

        $user->update(['role' => 'admin']);

        $this->info("{$email} has been promoted to admin.");

        return self::SUCCESS;
    }
}
