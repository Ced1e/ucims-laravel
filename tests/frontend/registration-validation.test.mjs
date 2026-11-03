import test from 'node:test';
import assert from 'node:assert/strict';
import { validName, isCalendarDate, normalizePhone, registrationLimits, prepareRegistration, lengthErrors } from '../../resources/js/lib/registration-validation.mjs';

test('names accept legitimate punctuation and Unicode but reject numbers and markup', () => {
    for (const value of ["O'Neil", 'Dela Cruz', 'María-José', 'de la Peña', 'D’Arcy', '李明']) assert.equal(validName(value), true, value);
    for (const value of ['', '  ', 'Juan123', '<script>']) assert.equal(validName(value), false, value);
});
test('calendar dates do not roll impossible dates into another month', () => {
    assert.equal(isCalendarDate('2024-02-29'), true);
    for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', 'tomorrow', '2026-2-1']) assert.equal(isCalendarDate(value), false);
});
test('phone formatting is normalized but letters are never silently removed', () => {
    assert.equal(normalizePhone('0917 123-4567'), '09171234567');
    assert.equal(normalizePhone('0917abc1234567'), '0917abc1234567');
});
test('database length limits report exact field errors including emergency relationship', () => {
    assert.equal(registrationLimits.em_rel, 50);
    assert.deepEqual(lengthErrors({ em_rel:'A'.repeat(50) },['em_rel']), {});
    assert.ok(lengthErrors({ em_rel:'A'.repeat(51) },['em_rel']).em_rel);
});
test('registration drops inapplicable history and preserves password whitespace', () => {
    const result=prepareRegistration({sex:'Male',female_menarche:99,female_symptoms:'stale',password:'  exact password  ',hosp_admitted:'No',hosp_illness:'stale',surgery:'No',surg_type:'stale',usep_email:' TEST@USEP.EDU.PH ',contact_no:'0917 123 4567'});
    assert.equal('female_menarche' in result,false); assert.equal('female_symptoms' in result,false);
    assert.equal(result.password,'  exact password  '); assert.equal(result.hosp_illness,'');assert.equal(result.surg_type,'');
    assert.equal(result.usep_email,'test@usep.edu.ph');assert.equal(result.contact_no,'09171234567');
});
