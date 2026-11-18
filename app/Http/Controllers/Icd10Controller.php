<?php

namespace App\Http\Controllers;

use App\Support\MedicalConditions;
use Illuminate\Http\Request;

class Icd10Controller extends Controller
{
    public function __construct(private readonly MedicalConditions $conditions)
    {
    }

    /**
     * Search the clinic's condition catalogue by disease name or by code.
     *
     * Standardized conditions are returned first and carry their canonical
     * label, so picking a result records a consistent diagnosis. The full
     * ICD-10 reference is still searchable underneath.
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
        $catalogue = config('icd10', []);
        $results = [];

        // Code index of the standardized catalogue, used to promote the
        // canonical label and to surface alias hits ("sore throat").
        $standardByCode = [];
        foreach ($this->conditions->catalogue() as $entry) {
            foreach ($entry['codes'] as $standardCode) {
                $standardByCode[$this->normalizeCode($standardCode)] = $entry;
            }
        }

        foreach ($catalogue as $code => $name) {
            $standard = $standardByCode[$this->normalizeCode((string) $code)] ?? null;

            // Code searches keep the official description so the code and its
            // name match; name searches show the standardized label.
            $label = ($standard !== null && $mode !== 'code') ? $standard['label'] : $name;

            if ($mode !== 'code' && $this->labelMatches($label, $name, $needle)) {
                $results[$code] = $this->row($code, $label, $name, $standard, $this->wordScore($label, $name, $needle));
            }

            if ($needleCode !== '' && str_contains($this->normalizeCode((string) $code), $needleCode)) {
                $score = $this->normalizeCode((string) $code) === $needleCode ? 0 : 1;
                $results[$code] = $this->row($code, $label, $name, $standard, $score);
            }
        }

        // Alias hits: "sore throat", "high blood pressure", "uti" and friends
        // resolve to a standardized condition even when the official ICD-10
        // description uses different words.
        if ($mode !== 'code') {
            foreach ($this->conditions->catalogue() as $entry) {
                if (! isset($catalogue[$entry['code']])) {
                    continue;
                }

                if (! $this->aliasMatches($entry['aliases'], $needle)) {
                    continue;
                }

                $simplifiedNeedle = $this->conditions->simplify($needle);
                $score = in_array($simplifiedNeedle, $entry['aliases'], true) ? 0 : 2;

                $code = $entry['code'];
                $existing = $results[$code] ?? null;

                if ($existing !== null && $existing['score'] <= 1) {
                    continue;
                }

                $results[$code] = $this->row($code, $entry['label'], $catalogue[$code], $entry, $score);
            }
        }

        // Names searches return one row per standardized condition even when
        // several equivalent codes match (J00 + J06.9 are both "URI").
        if ($mode !== 'code') {
            $deduped = [];

            foreach ($results as $row) {
                $current = $deduped[$row['condition_key']] ?? null;

                if ($current === null || (! $current['canonical'] && $row['canonical'])) {
                    $deduped[$row['condition_key']] = $row;
                }
            }

            $results = $deduped;
        }

        $rows = array_values($results);

        usort($rows, fn ($a, $b) => [
            $a['score'],
            $a['standard'] ? 0 : 1,
            $a['canonical'] ? 0 : 1,
            $a['name'],
            $a['code'],
        ] <=> [
            $b['score'],
            $b['standard'] ? 0 : 1,
            $b['canonical'] ? 0 : 1,
            $b['name'],
            $b['code'],
        ]);

        return response()->json(
            array_map(
                fn ($row) => [
                    'code' => $row['code'],
                    'name' => $row['name'],
                    'official' => $row['official'],
                    'standard' => $row['standard'],
                    'chapter' => $row['chapter'],
                ],
                array_slice($rows, 0, 40),
            )
        );
    }

    /**
     * @param  array<string, mixed>|null  $standard
     * @return array{code:string,name:string,official:string,standard:bool,chapter:string|null,condition_key:string,canonical:bool,score:int}
     */
    private function row(string $code, string $label, string $official, ?array $standard, int $score): array
    {
        return [
            'code' => $code,
            'name' => $label,
            'official' => $official,
            'standard' => $standard !== null,
            'chapter' => $standard['chapter'] ?? null,
            'condition_key' => $standard['key'] ?? 'code:'.$this->normalizeCode($code),
            'canonical' => $standard !== null
                && $this->normalizeCode((string) $standard['code']) === $this->normalizeCode($code),
            'score' => $score,
        ];
    }

    private function labelMatches(string $label, string $official, string $needle): bool
    {
        return $this->startsWithWord($label, $needle) || $this->startsWithWord($official, $needle);
    }

    /**
     * Lower is better: the label itself, then a label that starts with the
     * query, then a match somewhere inside it.
     */
    private function wordScore(string $label, string $official, string $needle): int
    {
        $label = mb_strtolower($label);

        if ($label === $needle) {
            return 0;
        }

        if (str_starts_with($label, $needle) || str_starts_with(mb_strtolower($official), $needle)) {
            return 1;
        }

        return 2;
    }

    /**
     * Substring match that must land on a word boundary, so "uri" does not
     * match inside "neuralgia / neuritis".
     */
    private function startsWithWord(string $haystack, string $needle): bool
    {
        if ($needle === '') {
            return false;
        }

        return preg_match('/(?<![a-z0-9])'.preg_quote($needle, '/').'/u', mb_strtolower($haystack)) === 1;
    }

    /**
     * @param  array<int, string>  $aliases  already simplified aliases
     */
    private function aliasMatches(array $aliases, string $needle): bool
    {
        $simplified = $this->conditions->simplify($needle);

        if ($simplified === '') {
            return false;
        }

        foreach ($aliases as $alias) {
            if ($alias === $simplified) {
                return true;
            }

            if ($this->startsWithWord($alias, $simplified) || $this->startsWithWord($simplified, $alias)) {
                return true;
            }
        }

        return false;
    }

    private function normalizeCode(string $value): string
    {
        return preg_replace('/[^a-z0-9]/', '', mb_strtolower($value)) ?? '';
    }
}
