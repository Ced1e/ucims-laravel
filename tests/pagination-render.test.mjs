import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const lucideUrl = new URL('../node_modules/lucide-react/dist/esm/lucide-react.js', import.meta.url).href;
const file = new URL('../resources/js/components/paginated-items.jsx', import.meta.url);
const source = fs.readFileSync(file, 'utf8')
    .replace("'react'", JSON.stringify(pathToFileURL(require.resolve('react')).href))
    .replace("'../lib/pagination.mjs'", JSON.stringify(new URL('../resources/js/lib/pagination.mjs', import.meta.url).href))
    .replace("'lucide-react'", JSON.stringify(lucideUrl));
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
 // The redesigned paginator renders numbered page buttons instead of a range label;
 // page 1 is current and page 3 does not exist for 21 items.
 assert.ok(markup.includes('class="pg-btn pg-page" aria-current="page">1<'));
 assert.ok(markup.includes('>2</button>'));
 assert.ok(!markup.includes('>3</button>'));
});
test('empty pagination renders the nav with both navigation controls disabled',()=>{
 const markup=renderToStaticMarkup(React.createElement(PaginatedItems,{items:[],label:'Visits'},()=>null));
 assert.ok(markup.includes('aria-label="Visits pagination"'));
 assert.ok(!markup.includes('data-record'));
 assert.equal((markup.match(/disabled=""/g)||[]).length,2);
});
