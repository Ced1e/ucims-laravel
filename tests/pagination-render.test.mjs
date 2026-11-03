import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const file = new URL('../resources/js/components/paginated-items.jsx', import.meta.url);
const source = fs.readFileSync(file, 'utf8')
    .replace("'react'", JSON.stringify(pathToFileURL(require.resolve('react')).href))
    .replace("'../lib/pagination.mjs'", JSON.stringify(new URL('../resources/js/lib/pagination.mjs', import.meta.url).href));
const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
    .replace('"react/jsx-runtime"', JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
const { default: PaginatedItems } = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));
test('table pagination renders at most20 rows and accessible navigation inside a spanning cell', () => {
 const markup=renderToStaticMarkup(React.createElement('table',null,React.createElement('tbody',null,
  React.createElement(PaginatedItems,{items:Array.from({length:21},(_,i)=>i+1),tableColumns:3,label:'Visits'},
   n=>React.createElement('tr',{key:n,'data-record':n},React.createElement('td',null,n))))));
 assert.equal((markup.match(/data-record=/g)||[]).length,20);
 assert.ok(!markup.includes('data-record="21"'));
 assert.ok(markup.includes('<td colSpan="3"><nav'));
 assert.ok(markup.includes('aria-label="Visits pagination"'));
 assert.ok(markup.includes('1–20 of 21'));
 assert.ok(markup.includes('Page 1 of 2'));
});
test('empty pagination has zero range and disables both navigation controls',()=>{
 const markup=renderToStaticMarkup(React.createElement(PaginatedItems,{items:[],label:'Visits'},()=>null));
 assert.ok(markup.includes('0–0 of 0'));assert.equal((markup.match(/disabled=""/g)||[]).length,2);
});
