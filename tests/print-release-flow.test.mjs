import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Regression guards for the Medical Certificate Requests workflow:
//
// 1. The modal footer is Cancel / Preview / Print. Neither print action
//    releases, completes, or removes the request from the pending list.
// 2. Confirm & Release beside Review & Process in the list row is the ONLY
//    finalizer, regardless of where a control sits in the interface.
// 3. The print tab must be opened inside the click gesture, before any await,
//    otherwise the browser's popup blocker silently drops it.

const source = fs.readFileSync(new URL('../resources/js/pages/Doctor/Consultation.jsx', import.meta.url), 'utf8');

function functionBody(name) {
    const start = source.indexOf(name);
    assert.ok(start > -1, `${name} exists in Consultation.jsx`);
    // The body's opening brace is the last '{' on the signature line (handles
    // both `fn() {` and `fn({ a, b }) {`).
    const lineEnd = source.indexOf('\n', start);
    const open = start + source.slice(start, lineEnd).lastIndexOf('{');
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

function codeOnly(body) {
    return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const modal = () => source.slice(
    source.indexOf('function ReviewMedCertModal'),
    source.indexOf('export default function DoctorDashboard'),
);

test('the modal footer is Cancel / Preview / Print with no release action', () => {
    const footer = functionBody('function ReviewMedCertModal').slice(-1600);

    assert.ok(footer.includes('onClick={handlePreview}'), 'Preview button is present');
    assert.ok(footer.includes('onClick={handlePrint}'), 'Print button is present');
    assert.ok(footer.includes('> Print'), 'the button is labelled Print');
    assert.ok(!footer.includes('onClick={handleRelease}'), 'no release button in the modal');
    assert.ok(!footer.includes('Confirm Release &amp; Print'), 'the old combined label is gone');
});

test('Preview only prints — no save, no release, no list refresh', () => {
    const body = codeOnly(functionBody('function handlePreview()'));

    assert.ok(body.includes('printCertificate('), 'Preview opens the printable certificate');
    for (const forbidden of ['axios', 'onReleased', 'onCancelled', 'is_released', 'setSaving', 'fetchCerts', 'finalizeCertificateRelease']) {
        assert.ok(!body.includes(forbidden), `handlePreview must not call or touch ${forbidden}`);
    }
});

test('Print saves a draft but never releases the request', () => {
    const body = codeOnly(functionBody('async function handlePrint()'));

    assert.ok(body.includes('axios.put('), 'Print persists the entered fields');
    assert.ok(body.includes('is_released: false'), 'the save is explicitly a draft, not a release');
    assert.ok(body.includes('writeCertificate('), 'Print writes the printed document');
    assert.ok(!body.includes('is_released: true'), 'Print cannot mark the certificate released');
    assert.ok(!body.includes('finalizeCertificateRelease('), 'Print does not call the finalizer');
    assert.ok(!body.includes('fetchCerts()'), 'Print does not refresh/clear the pending list');
});

test('Confirm & Release sits beside Review & Process in the request row', () => {
    const list = source.slice(source.indexOf('function MedCertListDoctor'), source.indexOf('function Blank'));

    assert.ok(list.includes('medcert-row-actions'), 'the actions cell wraps both row buttons');
    assert.ok(list.includes('onReview(c)'), 'Review & Process is in the row');
    assert.ok(list.includes('onRelease(c)'), 'Confirm & Release is also in the row');
});

test('only the row Confirm & Release finalizes the request', () => {
    const helper = codeOnly(functionBody('async function finalizeCertificateRelease'));
    assert.ok(helper.includes('is_released: true'), 'shared finalizer marks the certificate released');
    assert.ok(helper.includes("status: 'done'"), 'shared finalizer completes the visit');

    const row = codeOnly(functionBody('async function handleConfirmRelease(cert)'));
    assert.ok(row.includes('finalizeCertificateRelease('), 'the row button delegates to the finalizer');
    assert.ok(row.includes('fetchCerts()'), 'the row button refreshes the pending list');

    assert.ok(!modal().includes('finalizeCertificateRelease'), 'the modal cannot finalize a request');
});

test('both print and release open the print tab before awaiting the API', () => {
    for (const name of ['async function handlePrint()', 'async function handleConfirmRelease(cert)']) {
        const body = functionBody(name);
        const tab = body.indexOf('openPrintTab()');
        const firstAwait = body.indexOf('await ');

        assert.ok(tab > -1, `${name} opens a print tab`);
        assert.ok(firstAwait > -1, `${name} makes a request`);
        assert.ok(tab < firstAwait, `${name} must open the tab before its first await`);
    }
});

test('a failed save or release closes the placeholder print tab', () => {
    for (const name of ['async function handlePrint()', 'async function handleConfirmRelease(cert)']) {
        const body = functionBody(name);
        const catchBlock = body.slice(body.indexOf('catch (e)'));
        assert.ok(catchBlock.includes('printTab.close()'), `${name} closes the leftover print tab on failure`);
    }
});

test('the obsolete print-dialog tip is gone', () => {
    assert.ok(!modal().includes('Headers and&nbsp;footers'), 'no headers/footers tip in the alert');
    assert.ok(!modal().includes('about:blank'), 'no about:blank tip in the alert');
    assert.ok(modal().includes('Pending physician release'), 'the alert still explains the workflow');
});
