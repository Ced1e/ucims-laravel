<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Normalizes free-text diagnoses into the clinic's standardized conditions.
 *
 * Resolution order:
 *   1. ICD-10 code exactly matches a catalogue entry (or its aliases' codes)
 *   2. ICD-10 code is a unique prefix of a catalogue code ("J06" -> J06.9)
 *   3. The diagnosis text exactly matches a catalogue alias after
 *      simplification ("URI" -> upper respiratory tract infection)
 *   4. The diagnosis text contains a catalogue alias (longest alias wins)
 *   5. The code alone is used as the group, labelled with its official ICD-10
 *      description, so two spellings of the same code never split
 *   6. The text alone is used as the group, flagged as not standardized
 */
class MedicalConditions
{
    /** @var array<int, array<string, mixed>>|null */
    private ?array $catalogue = null;

    /** Words that never change the clinical identity of a condition. */
    private const NOISE = [
        'acute', 'chronic', 'subacute', 'recurrent', 'unspecified', 'specified', 'suspected',
        'probable', 'possible', 'mild', 'moderate', 'severe', 'bilateral', 'unilateral',
        'left', 'right', 'nos', 'uncomplicated', 'complicated', 'initial', 'encounter',
        'without', 'with', 'complications', 'complication', 'due', 'to', 'rule', 'out',
        'history', 'of', 'the', 'a', 'an', 'and', 'or', 'secondary', 'primary', 'other',
        'disease', 'disorder', 'infection',
    ];

    /**
     * The standardized catalogue, keyed by slug, with normalized lookups.
     *
     * @return array<string, array{key:string,label:string,code:string,codes:array<int,string>,aliases:array<int,string>,chapter:string}>
     */
    public function catalogue(): array
    {
        if ($this->catalogue !== null) {
            return $this->catalogue;
        }

        $entries = [];

        foreach (config('conditions', []) as $slug => $definition) {
            $code = strtoupper((string) ($definition['code'] ?? ''));
            $codes = array_values(array_unique(array_map(
                fn ($value) => $this->normalizeCode((string) $value),
                array_merge([$code], $definition['codes'] ?? []),
            )));

            $aliases = array_values(array_unique(array_filter(array_map(
                fn ($value) => $this->simplify((string) $value),
                $definition['aliases'] ?? [],
            ))));

            $entries[$slug] = [
                'key' => 'std:'.$slug,
                'label' => (string) $definition['label'],
                'code' => $code,
                'codes' => array_values(array_filter($codes)),
                'aliases' => $aliases,
                'chapter' => $this->chapterFor($code),
            ];
        }

        return $this->catalogue = $entries;
    }

    /**
     * The standardized condition for a code, if one exists.
     *
     * @return array<string, mixed>|null
     */
    public function forCode(?string $code): ?array
    {
        $normalized = $this->normalizeCode((string) $code);

        if ($normalized === '') {
            return null;
        }

        foreach ($this->catalogue() as $entry) {
            if (in_array($normalized, $entry['codes'], true)) {
                return $entry;
            }
        }

        $prefixMatches = array_values(array_filter(
            $this->catalogue(),
            fn (array $entry) => $this->uniquePrefix($normalized, $entry['codes']),
        ));

        return count($prefixMatches) === 1 ? $prefixMatches[0] : null;
    }

    /**
     * Resolve a recorded diagnosis (text and/or ICD-10 code) to one
     * standardized condition.
     *
     * @return array{key:string,label:string,code:string,chapter:string,standard:bool,basis:string}|null
     */
    public function resolve(?string $diagnosis, ?string $code): ?array
    {
        $diagnosis = trim((string) $diagnosis);
        $code = trim((string) $code);
        $normalizedCode = $this->normalizeCode($code);
        $simplified = $this->simplify($diagnosis);

        if ($diagnosis === '' && $normalizedCode === '') {
            return null;
        }

        // 1 + 2 — the code is the strongest signal.
        if ($normalizedCode !== '') {
            $byCode = $this->forCode($code);

            if ($byCode !== null) {
                return [
                    'key' => $byCode['key'],
                    'label' => $byCode['label'],
                    'code' => $byCode['code'],
                    'chapter' => $byCode['chapter'],
                    'standard' => true,
                    'basis' => 'code',
                ];
            }
        }

        // 3 + 4 — match the recorded words against aliases.
        $byAlias = $simplified !== '' ? $this->matchAlias($simplified) : null;

        if ($byAlias !== null) {
            return [
                'key' => $byAlias['key'],
                'label' => $byAlias['label'],
                'code' => $byAlias['code'],
                'chapter' => $byAlias['chapter'],
                'standard' => true,
                'basis' => 'name',
            ];
        }

        // 5 — group unlisted codes by the code itself so spellings never split.
        if ($normalizedCode !== '') {
            $official = $this->officialName($code);
            $label = $official ?? ($diagnosis !== '' ? $diagnosis : 'Unspecified condition ('.$code.')');

            return [
                'key' => 'code:'.$normalizedCode,
                'label' => $label,
                'code' => strtoupper($code),
                'chapter' => $this->chapterFor($code),
                'standard' => false,
                'basis' => 'code',
            ];
        }

        // 6 — free text only: keep it visible but flag it for standardization.
        return [
            'key' => 'text:'.$simplified,
            'label' => Str::ucfirst($diagnosis),
            'code' => '',
            'chapter' => 'Not classified',
            'standard' => false,
            'basis' => 'text',
        ];
    }

    /**
     * Map an ICD-10 code letter+number to the body-system chapter used by the
     * admin illness explorer. Mirrors the client-side fallback.
     */
    public function chapterFor(?string $code): string
    {
        $normalized = strtoupper($this->normalizeCode((string) $code));

        if ($normalized === '') {
            return 'Not classified';
        }

        $letter = $normalized[0];
        $number = (int) substr($normalized, 1, 2);

        return match ($letter) {
            'A', 'B' => 'Infectious',
            'C' => 'Neoplasms',
            'D' => $number <= 48 ? 'Neoplasms' : 'Blood & immunity',
            'E' => 'Endocrine',
            'F' => 'Mental health',
            'G' => 'Nervous',
            'H' => 'Eye & ear',
            'I' => 'Circulatory',
            'J' => 'Respiratory',
            'K' => 'Digestive',
            'L' => 'Skin',
            'M' => 'Musculoskeletal',
            'N' => 'Genitourinary',
            'O' => 'Pregnancy',
            'P' => 'Perinatal',
            'Q' => 'Congenital',
            'R' => 'Symptoms & signs',
            'S', 'T' => 'Injury',
            'Z' => 'Health services',
            default => 'Other',
        };
    }

    /**
     * "J06.9", "j06 9" and "J069" all compare as "J069".
     */
    public function normalizeCode(string $value): string
    {
        return preg_replace('/[^A-Z0-9]/i', '', strtoupper(trim($value))) ?? '';
    }

    /**
     * Lowercase, drop punctuation, ICD-10 tokens and clinical qualifiers so
     * "Acute URI (J06.9)" and "upper respiratory infection" compare equal.
     */
    public function simplify(string $value): string
    {
        $text = mb_strtolower($value);

        // Remove bracketed/loose ICD-10 codes.
        $text = preg_replace('/\b[a-tv-z]\d{2,3}(?:[.\s]?\d{1,4})?\b/iu', ' ', $text) ?? $text;
        $text = preg_replace('/[^a-z0-9]+/u', ' ', $text) ?? $text;

        $words = array_values(array_filter(
            explode(' ', trim($text)),
            fn ($word) => $word !== '' && ! in_array($word, self::NOISE, true),
        ));

        return implode(' ', $words);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function matchAlias(string $needle): ?array
    {
        $best = null;
        $bestLength = 0;

        foreach ($this->catalogue() as $entry) {
            foreach ($entry['aliases'] as $alias) {
                if ($alias === '') {
                    continue;
                }

                if ($alias === $needle) {
                    return $entry;
                }

                if (strlen($alias) > $bestLength
                    && preg_match('/(?<![a-z0-9])'.preg_quote($alias, '/').'(?![a-z0-9])/', $needle)) {
                    $best = $entry;
                    $bestLength = strlen($alias);
                }
            }
        }

        return $best;
    }

    /**
     * Does the given code normalize to a unique prefix of any of the entry's
     * codes? Used for partial codes such as "J06".
     *
     * @param  array<int, string>  $codes
     */
    private function uniquePrefix(string $normalized, array $codes): bool
    {
        foreach ($codes as $candidate) {
            if ($candidate === $normalized) {
                continue;
            }

            if ($normalized !== '' && (str_starts_with($candidate, $normalized) || str_starts_with($normalized, $candidate))) {
                return true;
            }
        }

        return false;
    }

    private function officialName(string $code): ?string
    {
        $catalogue = config('icd10', []);
        $upper = strtoupper(trim($code));

        if (isset($catalogue[$upper])) {
            return $catalogue[$upper];
        }

        foreach ($catalogue as $key => $name) {
            if ($this->normalizeCode((string) $key) === $this->normalizeCode($code)) {
                return $name;
            }
        }

        return null;
    }
}
