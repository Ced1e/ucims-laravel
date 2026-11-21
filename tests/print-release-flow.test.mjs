import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Regression guards for the Medical Certificate Requests workflow:
//
// 1. Preview/Print only generates the document. The request stays pending, the
//    visit is not completed, and the modal stays open.
// 2. Confirm & Release is the only finalizer. It is available both in the modal
//    footer and beside Review & Process in the list row, and both go through the
//    same helper so behavior is identical regardless of button position.
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

// Comments state the intent ("no axios", etc.), so strip them before checking
// what the code actually does.
function codeOnly(body) {
    return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('Preview/print only generates the document and never releases the request', () => {
    const body = codeOnly(functionBody('function handlePreview()'));

    assert.ok(body.includes('printCertificate('), 'Preview opens the printable certificate');
    for (const forbidden of ['axios', 'onReleased', 'onCancelled', 'is_released', 'setSaving', 'fetchCerts', 'finalizeCertificateRelease']) {
        assert.ok(!body.includes(forbidden), `handlePreview must not call or touch ${forbidden}`);
    }
});

test('Confirm & Release sits beside Review & Process in the request row', () => {
    const list = source.slice(source.indexOf('function MedCertListDoctor'), source.indexOf('function Blank'));

    assert.ok(list.includes('medcert-row-actions'), 'the actions cell wraps both row buttons');
    assert.ok(list.includes('onReview(c)'), 'Review & Process is in the row');
    assert.ok(list.includes('onRelease(c)'), 'Confirm & Release is also in the row');

    const modal = source.slice(source.indexOf('function ReviewMedCertModal'), source.indexOf('export default function DoctorDashboard'));
    assert.ok(modal.includes('onClick={handlePreview}'), 'the modal keeps its Preview button');
    assert.ok(modal.includes('onClick={handleRelease}'), 'the modal keeps its Confirm Release button');
});

test('both release buttons share the same finalizer', () => {
    const helper = codeOnly(functionBody('async function finalizeCertificateRelease'));
    assert.ok(helper.includes('is_released: true'), 'shared finalizer marks the certificate released');
    assert.ok(helper.includes("status: 'done'"), 'shared finalizer completes the visit');
    assert.ok(helper.includes('writeCertificate('), 'shared finalizer prints the certificate');

    for (const name of ['async function handleRelease()', 'async function handleConfirmRelease(cert)']) {
        const body = codeOnly(functionBody(name));
        assert.ok(body.includes('finalizeCertificateRelease('), `${name} delegates to the shared finalizer`);
    }
});

test('both release paths open the print tab before awaiting the API', () => {
    for (const name of ['async function handleRelease()', 'async function handleConfirmRelease(cert)']) {
        const body = functionBody(name);
        const tab = body.indexOf('openPrintTab()');
        const firstAwait = body.indexOf('await ');

        assert.ok(tab > -1, `${name} opens a print tab`);
        assert.ok(firstAwait > -1, `${name} still saves the certificate`);
        assert.ok(tab < firstAwait, `${name} must open the tab before its first await`);
    }
});

test('a failed release closes the placeholder print tab', () => {
    for (const name of ['async function handleRelease()', 'async function handleConfirmRelease(cert)']) {
        const body = functionBody(name);
        const catchBlock = body.slice(body.indexOf('catch (e)'));
        assert.ok(catchBlock.includes('printTab.close()'), `${name} closes the leftover print tab on failure`);
    }
});

test('printCertificate opens its own tab so Preview keeps working', () => {
    const body = functionBody('function printCertificate(cert, patient, form)');
    assert.ok(body.includes('openPrintTab()'), 'printCertificate opens a tab synchronously');
    assert.ok(body.includes('writeCertificate('), 'printCertificate writes the certificate into that tab');
});

test('the obsolete print-dialog tip is gone', () => {
    const modal = source.slice(source.indexOf('function ReviewMedCertModal'), source.indexOf('export default function DoctorDashboard'));
    assert.ok(!modal.includes('Headers and&nbsp;footers'), 'no headers/footers tip in the alert');
    assert.ok(!modal.includes('about:blank'), 'no about:blank tip in the alert');
    assert.ok(
        modal.includes('Pending physician release'),
        'the alert still explains Pending / Preview / Confirm Release / Cancel',
    );
});
