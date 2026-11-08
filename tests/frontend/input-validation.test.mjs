import test from 'node:test';
import assert from 'node:assert/strict';
import {
    formatBloodPressure,
    formatClinicId,
    formatPhilippineMobile,
    numericInput,
    usepEmailError,
} from '../../resources/js/lib/input-validation.mjs';

test('formats a Philippine mobile number without accepting letters', () => {
    assert.equal(formatPhilippineMobile('0912-345-6789'), '09123456789');
    assert.equal(formatPhilippineMobile('0912abc345'), '0912345');
});

test('formats patient and staff clinic IDs according to their assigned patterns', () => {
    assert.equal(formatClinicId('202400001', 'patient'), '2024-00001');
    assert.equal(formatClinicId('n001', 'staff'), 'N-001');
    assert.equal(formatClinicId('bad!', 'staff'), 'B-');
});

test('formats blood pressure as systolic and diastolic values', () => {
    assert.equal(formatBloodPressure('12080'), '120/80');
    assert.equal(formatBloodPressure('12a0/8b0'), '120/80');
});

test('keeps a numeric measurement within its configured format and range', () => {
    assert.equal(numericInput('36.75', { min: 30, max: 45, decimals: 1 }), '36.7');
    assert.equal(numericInput('abc37', { min: 30, max: 45, decimals: 1 }), '37');
    assert.equal(numericInput('46', { min: 30, max: 45, decimals: 1 }), '45');
});

test('requires a USeP email address', () => {
    assert.equal(usepEmailError('staff@usep.edu.ph'), null);
    assert.equal(usepEmailError('staff@example.com'), 'Use a USeP email address (name@usep.edu.ph).');
});
