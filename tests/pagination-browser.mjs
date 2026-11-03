// Uses existing local browser tooling; does not install dependencies or access application APIs.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { pathToFileURL } from 'node:url';
const playwrightPath=process.env.PLAYWRIGHT_ENTRY || 'C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium }=await import(pathToFileURL(playwrightPath));
const server=await createServer({configFile:false,plugins:[react()],server:{host:'127.0.0.1',port:5187,strictPort:true},logLevel:'error'});
let browser;
try {
 await server.listen(); console.log('Fixture server listening');
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 console.log('Chromium launched'); const page=await browser.newPage(); page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5187/tests/browser/pagination.html', {waitUntil:'domcontentloaded',timeout:20000}); console.log('Fixture loaded');
 const first=page.getByTestId('first'),second=page.getByTestId('second');
 async function range(list, text, count, firstId) {
  await list.getByRole('status').filter({hasText:text}).waitFor();
  assert.equal(await list.locator('[data-record]').count(),count);
  if(count)assert.equal(await list.locator('[data-record]').first().getAttribute('data-record'),String(firstId));
 }
 await range(first,'1–20 of 45',20,1);await range(second,'1–20 of 45',20,1);
 assert.equal(await first.getByRole('button',{name:'Previous page of First'}).isDisabled(),true);
 await first.getByRole('button',{name:'Next page of First'}).click();await range(first,'21–40 of 45',20,21);
 await first.getByRole('button',{name:'Next page of First'}).click();await range(first,'41–45 of 45',5,41);
 assert.equal(await first.getByRole('button',{name:'Next page of First'}).isDisabled(),true);
 await first.getByRole('button',{name:'Previous page of First'}).click();await range(first,'21–40 of 45',20,21);
 await second.getByRole('button',{name:'Next page of Second'}).click();await range(second,'21–40 of 45',20,21);
 await page.getByRole('button',{name:'Poll status update'}).click();await range(first,'21–40 of 45',20,21);
 assert.ok((await first.locator('[data-record]').first().textContent()).includes('updated'));
 await page.getByRole('button',{name:'Toggle filter'}).click();await range(first,'1–6 of 6',6,40);await range(second,'21–40 of 45',20,21);
 await page.getByRole('button',{name:'Toggle filter'}).click();await range(first,'1–20 of 45',20,1);
 await first.getByRole('button',{name:'Next page of First'}).click();await first.getByRole('button',{name:'Next page of First'}).click();await range(first,'41–45 of 45',5,41);
 await page.getByRole('button',{name:'Delete last five'}).click();await range(first,'1–20 of 40',20,1);
 assert.deepEqual(errors,[]);
 console.log('PASS: real Chromium renders20 maximum; next/back/last-page boundaries, filtering reset, deletion reset, independent lists and polling preservation verified with45 synthetic records.');
} finally {await browser?.close();await server.close();}

