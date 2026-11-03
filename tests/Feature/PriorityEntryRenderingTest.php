<?php

test('built public entry pages render without requiring individual page manifest entries', function () {
    expect(config('database.default'))->toBe('sqlite');
    if (!is_file(public_path('build/manifest.json'))) $this->markTestSkipped('Run npm run build before this production-asset rendering test.');
    $this->get('/')->assertOk();
    $this->get('/login')->assertOk();
    $this->get('/register')->assertOk();
});
