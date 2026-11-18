<?php

namespace App\Http\Controllers;

use App\Support\MedicalConditions;

class ConditionController extends Controller
{
    public function __construct(private readonly MedicalConditions $conditions)
    {
    }

    /**
     * The standardized condition catalogue, used to pre-populate the admin
     * illness tree before any completed visit references a condition.
     */
    public function index()
    {
        $catalogue = collect($this->conditions->catalogue())
            ->map(fn (array $entry) => [
                'key' => $entry['key'],
                'label' => $entry['label'],
                'code' => $entry['code'],
                'chapter' => $entry['chapter'],
                'aliases' => $entry['aliases'],
            ])
            ->sort(fn (array $a, array $b) => $a['chapter'] <=> $b['chapter'] ?: $a['label'] <=> $b['label'])
            ->values();

        return response()->json($catalogue);
    }
}
