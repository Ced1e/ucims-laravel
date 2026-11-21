import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Regression guard for the "Confirm Release & Print" button.
//
// Browsers only allow window.open() while a click's user gesture is still
// active. The release handler used to await the certificate PUT first and open
// the print tab afterwards, so popup blockers silently discarded the window and
// the button appeared to do nothing. The handler must open the tab before its
// first await.

const source = fs.readFileSync(new URL('../resources/js/pages/Doctor/Consultation.jsx', import.meta.url), 'utf8');

function functionBody(name) {
    const start = source.indexOf(name);
    assert.ok(start > -1, `${name} exists in Consultation.jsx`);
    const open = source.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
        if (source[i] === '{') depth += 1;
        else if (source[i] === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, i + 1);
        }
    }
    throw new Error(`Unbalanced braces after ${name}`);
}

test('Confirm Release opens the print tab before awaiting the API', () => {
    const body = functionBody('async function handleRelease()');
    const tab = body.indexOf('openPrintTab()');
    const firstAwait = body.indexOf('await ');

    assert.ok(tab > -1, 'handleRelease opens a print tab');
    assert.ok(firstAwait > -1, 'handleRelease still saves the certificate');
    assert.ok(
        tab < firstAwait,
        'handleRelease must call openPrintTab() before its first await, otherwise the browser blocks the popup',
    );
    assert.ok(
        body.indexOf('writeCertificate(printTab') > firstAwait,
        'the certificate is written into the pre-opened tab after the release succeeds',
    );
});

test('a failed release closes the placeholder print tab', () => {
    const body = functionBody('async function handleRelease()');
    const catchBlock = body.slice(body.indexOf('catch (e)'));
    assert.ok(catchBlock.includes('printTab.close()'), 'the catch block closes the leftover print tab');
});

test('printCertificate opens its own tab so Preview keeps working', () => {
    const body = functionBody('function printCertificate(cert, patient, form)');
    assert.ok(body.includes('openPrintTab()'), 'printCertificate opens a tab synchronously');
    assert.ok(body.includes('writeCertificate('), 'printCertificate writes the certificate into that tab');
});
