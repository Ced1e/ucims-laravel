<?php

use App\Support\MedicalConditions;

uses(Tests\TestCase::class);

beforeEach(function () {
    $this->conditions = new MedicalConditions();
});

it('collapses every spelling of an upper respiratory infection into one condition', function () {
    $spellings = [
        ['URI', ''],
        ['Upper Respiratory Tract Infection', ''],
        ['acute upper respiratory infection', ''],
        ['Common cold', ''],
        ['coryza', ''],
        ['', 'J00'],
        ['', 'J06.9'],
        ['', 'j069'],
    ];

    $keys = array_map(
        fn (array $pair) => $this->conditions->resolve($pair[0], $pair[1])['key'],
        $spellings,
    );

    expect(array_unique($keys))->toBe(['std:upper-respiratory-infection']);
});

it('resolves partial and unlisted ICD-10 codes predictably', function () {
    $partial = $this->conditions->resolve('', 'J06');
    expect($partial['standard'])->toBeTrue()
        ->and($partial['code'])->toBe('J06.9');

    $unlisted = $this->conditions->resolve('Peptic ulcer', 'K27.9');
    expect($unlisted['standard'])->toBeFalse()
        ->and($unlisted['key'])->toBe('code:K279')
        ->and($unlisted['chapter'])->toBe('Digestive');

    $textOnly = $this->conditions->resolve('Peptic ulcer', '');
    expect($textOnly['standard'])->toBeFalse()
        ->and($textOnly['chapter'])->toBe('Not classified')
        ->and($textOnly['key'])->toBe('text:peptic ulcer');
});

it('prefers the longest alias when two conditions could match', function () {
    expect($this->conditions->resolve('skin allergy', '')['key'])->toBe('std:dermatitis')
        ->and($this->conditions->resolve('allergy', '')['key'])->toBe('std:allergy');
});

it('maps common lay terms onto standardized conditions', function () {
    expect($this->conditions->resolve('sore throat', '')['label'])->toBe('Pharyngitis (sore throat)')
        ->and($this->conditions->resolve('high blood pressure', '')['label'])->toBe('Hypertension')
        ->and($this->conditions->resolve('loose stools', '')['label'])->toBe('Gastroenteritis / diarrhoea')
        ->and($this->conditions->resolve('athletes foot', '')['code'])->toBe('B35.3');
});

it('ignores clinical qualifiers and embedded codes when matching', function () {
    $result = $this->conditions->resolve('Acute, recurrent URI (J06.9)', '');

    expect($result['key'])->toBe('std:upper-respiratory-infection');
});

it('returns null when there is nothing recorded', function () {
    expect($this->conditions->resolve('', ''))->toBeNull()
        ->and($this->conditions->resolve(null, null))->toBeNull();
});

it('derives the same body-system chapters as the reports panel', function () {
    expect($this->conditions->chapterFor('J06.9'))->toBe('Respiratory')
        ->and($this->conditions->chapterFor('A90'))->toBe('Infectious')
        ->and($this->conditions->chapterFor('M54.5'))->toBe('Musculoskeletal')
        ->and($this->conditions->chapterFor(''))->toBe('Not classified');
});
