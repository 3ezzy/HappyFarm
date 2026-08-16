<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlertDismissal;
use App\Services\AlertGenerator;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Currently-due alerts for the farm, soonest/most-overdue first, minus
     * anything dismissed.
     */
    public function index(Request $request, AlertGenerator $generator)
    {
        $farm = $request->user()->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $alerts = $generator->generate($farm);

        $dismissed = $farm->alertDismissals()->pluck('alert_key')->all();
        $alerts = array_values(array_filter($alerts, fn ($a) => !in_array($a['key'], $dismissed, true)));

        usort($alerts, fn ($a, $b) => $a['due_on'] <=> $b['due_on']);

        return response()->json($alerts);
    }

    /**
     * Dismiss a specific alert occurrence by its key. Permanent until the
     * underlying record changes (e.g. logging the actual vaccination
     * creates a new health record, which changes what "next due" even
     * means) — there's no snooze/expiry.
     */
    public function dismiss(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
        ]);

        $farm = $request->user()->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        AlertDismissal::updateOrCreate(
            ['farm_id' => $farm->id, 'alert_key' => $validated['key']],
            ['dismissed_at' => Carbon::now()]
        );

        return response()->json(['message' => 'Alert dismissed']);
    }
}
