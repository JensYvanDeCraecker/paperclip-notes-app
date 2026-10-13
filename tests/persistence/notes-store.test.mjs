import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNotesStore, NotesStorageError } from '../../src/persistence/notes-store.mjs';
function memory() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v) };
}
const code = expected => e => e instanceof NotesStorageError && e.code === expected;
test('multiple notes reopen, isolated edit survives store recreation, title/body search and durable deletion', () => {
  const storage = memory(); let store = createNotesStore({storage});
  assert.deepEqual(store.list(), []);
  const a = store.create({title:'Garden plans',body:'Plant lavender'});
  const b = store.create({title:'Shopping',body:'Buy bread'});
  store = createNotesStore({storage});
  assert.equal(store.get(a.id).body, 'Plant lavender');
  assert.equal(store.get(b.id).title, 'Shopping');
  store.update(a.id,{title:'Garden plans',body:'Plant rosemary'});
  store = createNotesStore({storage});
  assert.equal(store.get(a.id).body,'Plant rosemary');
  assert.equal(store.get(b.id).body,'Buy bread');
  assert.deepEqual(store.list('GARDEN rosemary').map(n=>n.id),[a.id]);
  assert.deepEqual(store.list('bread').map(n=>n.id),[b.id]);
  assert.deepEqual(store.list('missing'),[]);
  store.remove(a.id);
  store = createNotesStore({storage});
  assert.equal(store.get(a.id),null);
  assert.deepEqual(store.list('garden'),[]);
  assert.equal(store.list().length,1);
});
test('failed create/update/delete never changes durable notes; retry succeeds', () => {
  const storage = memory(); const store = createNotesStore({storage});
  const a = store.create({title:'Original',body:'Safe'});
  const original = storage.getItem('personal-notes:v1'); const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  for (const action of [()=>store.create({title:'New',body:''}),()=>store.update(a.id,{title:'Changed',body:''}),()=>store.remove(a.id)]) {
    assert.throws(action,code('write_failed'));
    assert.equal(storage.getItem('personal-notes:v1'),original);
  }
  storage.setItem = write;
  store.update(a.id,{title:'Retry',body:'Saved'});
  assert.equal(createNotesStore({storage}).get(a.id).title,'Retry');
});
test('unavailable storage is an explicit error, never an empty successful collection', () => {
  const store = createNotesStore({storage:{getItem(){throw new Error('Denied');}}});
  assert.throws(()=>store.list(),code('unavailable'));
  assert.throws(()=>store.create({title:'x',body:''}),code('unavailable'));
});
test('corrupt or unsupported data is preserved and cannot be overwritten', () => {
  for (const raw of ['{', '{"version":2,"notes":[]}', '{"version":1,"notes":[{}]}']) {
    const storage=memory(); storage.setItem('personal-notes:v1',raw);
    const store=createNotesStore({storage});
    assert.throws(()=>store.list(),code('corrupt'));
    assert.throws(()=>store.create({title:'x',body:''}),code('corrupt'));
    assert.equal(storage.getItem('personal-notes:v1'),raw);
  }
});
test('fresh reads preserve sequential edits by separate store instances', () => {
  const storage=memory(), a=createNotesStore({storage}), b=createNotesStore({storage});
  const first=a.create({title:'A',body:''}); b.create({title:'B',body:''});
  a.update(first.id,{title:'A edited',body:''}); assert.equal(b.list().length,2);
  assert.throws(()=>b.update('missing',{title:'x',body:''}),code('not_found'));
  assert.throws(()=>b.create({title:1,body:''}),code('invalid'));
});
test('detects a change between read and write', () => {
  const storage=memory(); let calls=0; const read=storage.getItem;
  storage.getItem=k => ++calls===2 ? '{"version":1,"notes":[]}' : read(k);
  assert.throws(()=>createNotesStore({storage}).create({title:'x',body:''}),code('conflict'));
});
