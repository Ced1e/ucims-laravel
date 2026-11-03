import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../resources/js/lib/pagination.mjs';
const rows = n => Array.from({length:n}, (_,i) => ({id:i+1}));
test('empty list has one navigable page and zero displayed range', () => {
 const result=paginate([], 9); assert.deepEqual(result.items, []); assert.equal(result.page,1); assert.equal(result.start,0); assert.equal(result.end,0);
});
test('20 records fit exactly on one page', () => {const p=paginate(rows(20),1); assert.equal(p.items.length,20);assert.equal(p.pageCount,1);});
test('21st record remains accessible on page two', () => {const p=paginate(rows(21),2);assert.deepEqual(p.items,[{id:21}]);assert.equal(p.start,21);assert.equal(p.end,21);});
test('41 records are reachable exactly once across three pages', () => {const data=rows(41);assert.deepEqual([1,2,3].flatMap(p=>paginate(data,p).items),data);});
test('deletion and invalid pages clamp to valid bounds', () => {assert.equal(paginate(rows(21),9).page,2);assert.equal(paginate(rows(20),2).page,1);assert.equal(paginate(rows(41),-2).page,1);assert.equal(paginate(rows(41),NaN).page,1);});
test('filter before pagination preserves all matching records and totals', () => {const filtered=rows(100).filter(r=>r.id%2===0);const p=paginate(filtered,2);assert.equal(p.total,50);assert.equal(p.items[0].id,42);assert.equal(p.items.at(-1).id,80);assert.equal(filtered.length,50);});
test('TV pages stay below the cap and retain every ticket', () => {const data=rows(21);assert.deepEqual(Array.from({length:6},(_,i)=>paginate(data,i+1,4).items).flat(),data);assert.equal(paginate(data,1,100).items.length,20);});
test('polling status edits retain list identity while membership/order changes reset it', async () => {
 const { listIdentity } = await import('../resources/js/lib/pagination.mjs');
 const data=[{queue_id:1,status:'waiting'},{queue_id:2,status:'waiting'}];
 assert.equal(listIdentity(data),listIdentity(data.map(row=>({...row,status:'serving'}))));
 assert.notEqual(listIdentity(data),listIdentity(data.slice(1)));
 assert.notEqual(listIdentity(data),listIdentity([...data].reverse()));
 assert.notEqual(listIdentity([{key:'a',count:1}]),listIdentity([{key:'b',count:1}]));
 assert.equal(listIdentity([{key:'a',count:1}]),listIdentity([{key:'a',count:2}]));
});
