import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = '../';
const reactUrl = pathToFileURL(require.resolve('react')).href;
const reactDomUrl = pathToFileURL(require.resolve('react-dom')).href;
const jsxRuntime = pathToFileURL(require.resolve('react/jsx-runtime')).href;
const axiosUrl = pathToFileURL(require.resolve('axios')).href;
const lucideUrl = new URL('../node_modules/lucide-react/dist/esm/lucide-react.js', import.meta.url).href;
const dataUrl = (text) => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const resolve = (p) => new URL(p, import.meta.url).href;

// Mocks for the modules that expect a browser or real auth state.
const inertia = dataUrl(`import React from ${JSON.stringify(reactUrl)};
export const Head = ({ children }) => React.createElement(React.Fragment, null, children);
export const usePage = () => ({ props: { auth: { user: { user_id: 1, firstname: 'Admin', lastname: 'Maria', usep_email: 'admin@usep.edu.ph', role: 'admin', name: 'Admin Maria', clinic_id: 'A-001', is_active: true } } } });
const noopRouter = { get() {}, post() {}, put() {}, patch() {}, delete() {}, reload() {} };
export const router = noopRouter;
export const Link = ({ children, href }) => React.createElement('a', { href }, children);
`);
const sce = dataUrl(`import React from ${JSON.stringify(reactUrl)};
export const Button = ({ children, variant, size, ...props }) => React.createElement('button', props, children);
`);
const skeleton = dataUrl(`import React from ${JSON.stringify(reactUrl)};
export const Skeleton = ({ className, ...props }) => React.createElement('div', { className, ...props });
`);
const layout = dataUrl(`import React from ${JSON.stringify(reactUrl)};
export default function AppLayout({ children }) { return React.createElement('div', null, children); }
`);
const skeletons = new URL('../resources/js/components/data-skeletons.jsx', import.meta.url).href;

function compile(source) {
    return ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
}

// Transpile a list of local sources to data: URLs while leaving package imports alone.
// Simplest reliable approach: read each file and transpile to data URL, rewriting bare
// specifiers we control to the resolved data URLs.
const regval = resolve('../resources/js/lib/registration-validation.mjs');
const inval = resolve('../resources/js/lib/input-validation.mjs');
const optorder = resolve('../resources/js/lib/option-order.mjs');
const pagination = resolve('../resources/js/lib/pagination.mjs');
const ucimsSelect = resolve('../resources/js/components/UCIMSSelect.jsx');
const paginated = resolve('../resources/js/components/paginated-items.jsx');
const datePicker = resolve('../resources/js/components/date-picker.jsx');

const filesToCompile = [
    ['../resources/js/lib/registration-validation.mjs', [
        ["'./input-validation.mjs'", (m) => inval],
    ]],
    ['../resources/js/lib/input-validation.mjs', []],
    ['../resources/js/lib/option-order.mjs', []],
    ['../resources/js/components/UCIMSSelect.jsx', []],
    ['../resources/js/components/paginated-items.jsx', []],
    ['../resources/js/components/date-picker.jsx', []],
    ['../resources/js/components/data-skeletons.tsx', []],
];

const compiled = new Map();
for (const [rel] of filesToCompile) {
    const src = fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
    let out = compile(src)
        .replaceAll('"react/jsx-runtime"', JSON.stringify(jsxRuntime))
        .replaceAll("'react/jsx-runtime'", JSON.stringify(jsxRuntime))
        .replaceAll("'react'", JSON.stringify(reactUrl))
        .replaceAll("'lucide-react'", JSON.stringify(lucideUrl));
    // Apply the same alias map as the entry file so intra-file imports resolve too.
    out = applyAliases(out);
    compiled.set(rel, dataUrl(out));
}

// The alias map every module sees (the entry and compiled locals).
function applyAliases(s) {
    s = s.replaceAll("'@/components/UCIMSSelect'", JSON.stringify(compiled.get('../resources/js/components/UCIMSSelect.jsx')));
    s = s.replaceAll("'@/components/data-skeletons'", JSON.stringify(compiled.get('../resources/js/components/data-skeletons.tsx')));
    s = s.replaceAll("'@/lib/registration-validation.mjs'", JSON.stringify(regval));
    s = s.replaceAll("'@/lib/input-validation.mjs'", JSON.stringify(inval));
    s = s.replaceAll("'../../components/paginated-items.jsx'", JSON.stringify(compiled.get('../resources/js/components/paginated-items.jsx')));
    s = s.replaceAll("'../../components/date-picker.jsx'", JSON.stringify(compiled.get('../resources/js/components/date-picker.jsx')));
    s = s.replaceAll("'../lib/pagination.mjs'", JSON.stringify(pagination));
    s = s.replaceAll("'../../lib/option-order.mjs'", JSON.stringify(optorder));
    s = s.replaceAll("'lucide-react'", JSON.stringify(lucideUrl));
    s = s.replaceAll("'axios'", JSON.stringify(axiosUrl));
    s = s.replaceAll("'@inertiajs/react'", JSON.stringify(inertia));
    s = s.replaceAll("'@/components/ui/button'", JSON.stringify(sce));
    s = s.replaceAll("'@/components/ui/skeleton'", JSON.stringify(skeleton));
    s = s.replaceAll("'react-dom'", JSON.stringify(reactDomUrl));
    s = s.replaceAll("'./layouts/app-layout'", JSON.stringify(layout));
    s = s.replaceAll("'@/layouts/app-layout'", JSON.stringify(layout));
    s = s.replaceAll("'./layouts/auth-layout'", JSON.stringify(layout));
    s = s.replaceAll("'./layouts/settings/layout'", JSON.stringify(layout));
    return s;
}

function applyTo(src) {
    return applyAliases(src);
}

const source = fs.readFileSync(new URL('../resources/js/pages/Admin/Analytics.jsx', import.meta.url), 'utf8');
// Smoke-render the account-management tab specifically (the default is the reports tab).
const finalSource = applyTo(source).replaceAll("const [section, setSection] = useState('analytics');", "const [section, setSection] = useState('accounts');");

test('Admin/Analytics page renders the account creation section', async () => {
    const js = compile(finalSource).replaceAll('"react/jsx-runtime"', JSON.stringify(jsxRuntime)).replaceAll("'react'", JSON.stringify(reactUrl));
    const mod = await import(dataUrl(js));
    const Page = mod.default;
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.ok(html.includes('Account Creation'), 'page contains the Account Creation & Management heading');
    assert.ok(html.includes('Create Staff Account'), 'page contains the Create Staff Account card');
    assert.ok(html.includes('Account Creation Guide'), 'page contains the guide card in the previously-empty right column');
    assert.ok(html.includes('Clinic ID Number'), 'page contains the clinic ID credential field');
    console.log('RENDER OK — Account Creation page renders fully. Length:', html.length);
});
