<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public "Live Queue" board (the TV screen in the clinic waiting area).
 *
 * Ported from the legacy SPA (#page-tv-queue + initTVQueue() in shared.js).
 * The page and its JSON feed are intentionally public so the TV does not need
 * a login, therefore the feed only exposes what a waiting-room screen needs:
 * queue number, active service state and completed checkout time. No names, visit labels, patient id,
 * email, vitals, diagnosis or any other record data is ever returned.
 */
class TvQueueController extends Controller
{
    /** How many recently completed visits the footer strip shows. */
    private const DONE_LIMIT = 5;

    public function show(): Response
    {
        return Inertia::render('TvQueue');
    }

    public function data(): JsonResponse
    {
        $today = now()->toDateString();

        $rows = ClinicQueue::query()
            ->where('date', $today)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('queue_number')
            ->get();

        $active = $rows->filter(fn ($q) => in_array($q->status, ['waiting', 'triaged', 'examined'], true)
            && Cache::has('tv-serving:'.$q->queue_id))->pluck('queue_id');
        $card = fn (ClinicQueue $q): array => [
            'queueNumber' => $q->queue_number,
            'serving' => $active->contains($q->queue_id),
        ];

        // Waiting area: checked in, not yet seen by the nurse.
        $waiting = $rows->filter(fn ($q) => $q->status === 'waiting' && ! $q->triaged && ! $active->contains($q->queue_id));

        // Nurse station: triaged (the triage form only sets the flag, the status
        // stays "waiting" until endorsement) or already examined by the doctor.
        $nurse = $rows->filter(fn ($q) => in_array($q->status, ['triaged', 'examined'], true)
            || ($q->status === 'waiting' && $q->triaged) || $active->contains($q->queue_id));

        // Doctor's clinic: endorsed and currently with the doctor.
        $doctor = $rows->filter(fn ($q) => $q->status === 'with-doctor');

        // Recently completed: newest first.
        $done = $rows->filter(fn ($q) => $q->status === 'done')
            ->sortByDesc(fn ($q) => [$q->time_out ? (strtotime($today.' '.$q->time_out) ?: 0) : 0, $q->queue_id])
            ->take(self::DONE_LIMIT);

        return response()->json([
            'date' => $today,
            'waiting' => $waiting->map($card)->values(),
            'nurse' => $nurse->map($card)->values(),
            'doctor' => $doctor->map($card)->values(),
            'done' => $done->map(fn ($q) => [...$card($q), 'completedTime' => $q->time_out ?: null])->values(),
        ])->header('Cache-Control', 'no-store');
    }

    /** Short-lived assessment presence; no clinical record or workflow changes. */
    public function serving(Request $request, ClinicQueue $clinicQueue)
    {
        abort_unless($request->user()->is_active && in_array($request->user()->role, ['nurse', 'admin'], true), 403);
        $data = $request->validate(['active' => ['required', 'boolean'], 'token' => ['required', 'uuid']]);
        $key = 'tv-serving:'.$clinicQueue->queue_id;
        $owner = $request->user()->user_id.':'.$data['token'];
        if ($data['active']) {
            abort_unless($clinicQueue->date === now()->toDateString()
                && in_array($clinicQueue->status, ['waiting', 'triaged', 'examined'], true), 409);
            Cache::put($key, $owner, now()->addSeconds(75));
        } elseif (Cache::get($key) === $owner) {
            Cache::forget($key);
        }
        return response()->noContent();
    }
}
