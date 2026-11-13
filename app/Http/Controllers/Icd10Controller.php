<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class Icd10Controller extends Controller
{
    /**
     * Search the clinic's ICD-10 catalogue by disease name or by code.
     *
     * Query params:
     *   q  - the search text
     *   by - "word" (condition name), "code" (ICD-10 code) or "any" (default)
     */
    public function index(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        $mode = $request->query('by', 'any');

        if ($query === '') {
            return response()->json([]);
        }

        $needle = mb_strtolower($query);
        $needleCode = $this->normalizeCode($query);
        $matches = [];

        foreach (config('icd10', []) as $code => $name) {
            if (! $this->matches($code, $name, $needle, $needleCode, $mode)) {
                continue;
            }

            $matches[] = [
                'code' => $code,
                'name' => $name,
                'score' => $this->score($code, $name, $needle, $needleCode, $mode),
            ];
        }

        usort($matches, fn ($a, $b) => [$a['score'], $a['name']] <=> [$b['score'], $b['name']]);

        return response()->json(
            array_map(
                fn ($row) => ['code' => $row['code'], 'name' => $row['name']],
                array_slice($matches, 0, 40),
            )
        );
    }

    private function matches(string $code, string $name, string $needle, string $needleCode, string $mode): bool
    {
        $nameMatches = str_contains(mb_strtolower($name), $needle);
        $codeMatches = $needleCode !== '' && str_contains($this->normalizeCode($code), $needleCode);

        return match ($mode) {
            'code' => $codeMatches,
            'word' => $nameMatches,
            default => $nameMatches || $codeMatches,
        };
    }

    /**
     * Lower is better: exact code, then code prefix, then name prefix,
     * then anything else.
     */
    private function score(string $code, string $name, string $needle, string $needleCode, string $mode): int
    {
        $codeKey = $this->normalizeCode($code);

        if ($mode !== 'word' && $needleCode !== '' && $codeKey === $needleCode) {
            return 0;
        }

        if ($mode !== 'word' && $needleCode !== '' && str_starts_with($codeKey, $needleCode)) {
            return 1;
        }

        if ($mode !== 'code' && str_starts_with(mb_strtolower($name), $needle)) {
            return 2;
        }

        return 3;
    }

    /**
     * "J06.9", "j06 9" and "J069" all compare as "j069".
     */
    private function normalizeCode(string $value): string
    {
        return preg_replace('/[^a-z0-9]/', '', mb_strtolower($value));
    }
}
