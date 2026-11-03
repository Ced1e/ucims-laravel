<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public "Live Queue" board (the TV screen in the clinic waiting area).
 *
 * Ported from the legacy SPA (#page-tv-queue + initTVQueue() in shared.js).
 * The page and its JSON feed are intentionally public so the TV does not need
 * a login, therefore the feed only exposes what a waiting-room screen needs:
 * queue number, a masked name ("Maria S.") and the visit label. No patient id,
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

        $rows = ClinicQueue::with('patient:user_id,firstname,lastname')
            ->where('date', $today)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('queue_number')
            ->get();

        $card = fn (ClinicQueue $q): array => [
            'queueNumber' => $q->queue_number,
            'name' => $this->maskedName($q),
            'visit' => $q->visit_label ?: 'Visit',
        ];

        // Waiting area: checked in, not yet seen by the nurse.
        $waiting = $rows->filter(fn ($q) => $q->status === 'waiting' && ! $q->triaged);

        // Nurse station: triaged (the triage form only sets the flag, the status
        // stays "waiting" until endorsement) or already examined by the doctor.
        $nurse = $rows->filter(fn ($q) => in_array($q->status, ['triaged', 'examined'], true)
            || ($q->status === 'waiting' && $q->triaged));

        // Doctor's clinic: endorsed and currently with the doctor.
        $doctor = $rows->filter(fn ($q) => $q->status === 'with-doctor');

        // Recently completed: newest first.
        $done = $rows->filter(fn ($q) => $q->status === 'done')
            ->sortByDesc('queue_id')
            ->take(self::DONE_LIMIT);

        return response()->json([
            'date' => $today,
            'waiting' => $waiting->map($card)->values(),
            'nurse' => $nurse->map($card)->values(),
            'doctor' => $doctor->map($card)->values(),
            'done' => $done->map($card)->values(),
        ])->header('Cache-Control', 'no-store');
    }

    /**
     * "Maria Clara Santos" is shown as "Maria S." on the public screen.
     */
    private function maskedName(ClinicQueue $q): string
    {
        $first = trim((string) $q->patient?->firstname);
        $last = trim((string) $q->patient?->lastname);

        if ($first === '' && $last === '') {
            return 'Patient';
        }

        $first = Str::of($first)->before(' ')->toString() ?: $first;
        $initial = $last !== '' ? ' '.mb_strtoupper(mb_substr($last, 0, 1)).'.' : '';

        return trim($first.$initial);
    }
}
