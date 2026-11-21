import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Regression guards for the Medical Certificate Requests workflow:
//
// 1. The modal footer is Cancel / Preview / Print. Printing is repeatable and
//    never finalizes, removes, or archives the request.
// 2. Confirm & Release beside Review & Process is the only path that saves to
//    History, and it never prints.
// 3. Cancel beside Confirm & Release removes the request from Pending without
//    saving to History and without releasing or printing.
// 4. The print tab must be opened inside the click gesture, before any await.

const source = fs.readFileSync(new URL('../resources/js/pages/Doctor/Consultation.jsx', import.meta.url), 'utf8');

function functionBody(name) {
    const start = source.indexOf(name);
    assert.ok(start > -1, `${name} exists in Consultation.jsx`);
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
const list = () => source.slice(source.indexOf('function MedCertListDoctor'), source.indexOf('function Blank'));

test('the modal footer is Cancel / Preview / Print with no release action', () => {
    const footer = functionBody('function ReviewMedCertModal').slice(-1600);

    assert.ok(footer.includes('onClick={handlePreview}'), 'Preview button is present');
    assert.ok(footer.includes('onClick={handlePrint}'), 'Print button is present');
    assert.ok(footer.includes('> Print'), 'the button is labelled Print');
    assert.ok(!footer.includes('onClick={handleRelease}'), 'no release button in the modal');
    assert.ok(!footer.includes('Confirm Release &amp; Print'), 'the old combined label is gone');
});

test('Preview and Print are repeatable and never finalize the request', () => {
    const preview = codeOnly(functionBody('function handlePreview()'));
    assert.ok(preview.includes('printCertificate('), 'Preview opens the printable certificate');
    for (const forbidden of ['axios', 'onReleased', 'onCancelled', 'is_released', 'setSaving', 'fetchCerts', 'releaseCertificate']) {
        assert.ok(!preview.includes(forbidden), `handlePreview must not call or touch ${forbidden}`);
    }

    const print = codeOnly(functionBody('async function handlePrint()'));
    assert.ok(print.includes('axios.put('), 'Print persists the entered fields');
    assert.ok(print.includes('is_released: false'), 'the save is explicitly a draft, not a release');
    assert.ok(print.includes('writeCertificate('), 'Print writes the printed document');
    assert.ok(!print.includes('is_released: true'), 'Print cannot mark the certificate released');
    assert.ok(!print.includes('releaseCertificate('), 'Print does not call the release finalizer');
    assert.ok(!print.includes('fetchCerts()'), 'Print never clears the pending list');
});

test('the request row has Review & Process, Confirm & Release, then Cancel', () => {
    const row = list();
    assert.ok(row.includes('medcert-row-actions'), 'the actions cell wraps the row buttons');
    assert.ok(row.includes('onReview(c)'), 'Review & Process is in the row');
    assert.ok(row.includes('onRelease(c)'), 'Confirm & Release is in the row');
    assert.ok(row.includes('onCancel(c)'), 'Cancel is in the row');
    assert.ok(row.includes('medcert-cancel-btn'), 'Cancel is themed for the doctor layout');
    assert.ok(row.indexOf('onRelease(c)') < row.indexOf('onCancel(c)'), 'Cancel sits to the right of Confirm & Release');
});

test('Confirm & Release finalizes to History without printing again', () => {
    const helper = codeOnly(functionBody('async function releaseCertificate'));
    assert.ok(helper.includes('is_released: true'), 'release helper marks the certificate released');
    assert.ok(helper.includes("status: 'done'"), 'release helper completes the visit');
    assert.ok(!helper.includes('writeCertificate'), 'release helper must not print');

    const row = codeOnly(functionBody('async function handleConfirmRelease(cert)'));
    assert.ok(row.includes('releaseCertificate('), 'the row button delegates to the release helper');
    assert.ok(row.includes('fetchHistory()'), 'the released request is saved to History');
    assert.ok(row.includes('fetchCerts()'), 'the row button refreshes the pending list');
    for (const forbidden of ['openPrintTab', 'printTab', 'writeCertificate', 'printCertificate']) {
        assert.ok(!row.includes(forbidden), `Confirm & Release must not open a print dialog (${forbidden})`);
    }
});

test('Cancel removes the request from Pending without releasing, printing or History', () => {
    const row = codeOnly(functionBody('async function handleCancelRequest(cert)'));

    assert.ok(row.includes('/cancel'), 'Cancel calls the cancel endpoint');
    assert.ok(row.includes('fetchCerts()'), 'Cancel refreshes the pending list');
    assert.ok(!row.includes('fetchHistory()'), 'Cancel never touches History');
    assert.ok(!row.includes('is_released'), 'Cancel cannot release');
    for (const forbidden of ['openPrintTab', 'printTab', 'writeCertificate', 'printCertificate']) {
        assert.ok(!row.includes(forbidden), `Cancel must not print (${forbidden})`);
    }
    assert.ok(!modal().includes('handleCancelRequest'), 'the modal cannot finalize/cancel a row request');
});

test('Print opens the print tab before awaiting the API', () => {
    const body = functionBody('async function handlePrint()');
    const tab = body.indexOf('openPrintTab()');
    const firstAwait = body.indexOf('await ');

    assert.ok(tab > -1, 'handlePrint opens a print tab');
    assert.ok(firstAwait > -1, 'handlePrint makes a request');
    assert.ok(tab < firstAwait, 'handlePrint must open the tab before its first await');
});

test('failed actions report an error', () => {
    for (const name of ['async function handlePrint()', 'async function handleConfirmRelease(cert)', 'async function handleCancelRequest(cert)']) {
        const body = functionBody(name);
        const catchBlock = body.slice(body.indexOf('catch (e)'));
        assert.ok(catchBlock.includes("'error'"), `${name} reports failures as an error toast`);
    }
});

test('the obsolete print-dialog tip is gone', () => {
    assert.ok(!modal().includes('Headers and&nbsp;footers'), 'no headers/footers tip in the alert');
    assert.ok(!modal().includes('about:blank'), 'no about:blank tip in the alert');
    assert.ok(modal().includes('Pending physician release'), 'the alert still explains the workflow');
});
