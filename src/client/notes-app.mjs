import { createNotesStore } from '../persistence/notes-store.mjs';

const store = createNotesStore();
const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['new-note','search','clear-search','count','note-list','idle','note-form','back','context','save-status','delete','title','body','save','save-help','save-error','confirmation','dialog-title','dialog-description','dialog-error','dialog-actions','announcement'].map(id => [id, $(id)]));
let notes = [], selected = null, original = null, active = false, failed = false, busy = false, readable = false;
let origin = ui['new-note'], modal = null;
const displayTitle = note => note.title.trim() || 'Untitled note';
const draft = () => ({ title: ui.title.value, body: ui.body.value });
const nonempty = () => Boolean(ui.title.value.trim() || ui.body.value.trim());
const dirty = () => active && (failed || (!original ? Boolean(ui.title.value || ui.body.value) : ui.title.value !== original.title || ui.body.value !== original.body));
function button(label, action, className = '') {
  const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.className = className; node.addEventListener('click', action); return node;
}
function message(heading, text, label, action) {
  const h = document.createElement('h2'); h.textContent = heading;
  const p = document.createElement('p'); p.textContent = text;
  ui['note-list'].replaceChildren(h, p, button(label, action));
}
function renderEditor() {
  ui.idle.hidden = active; ui['note-form'].hidden = !active;
  ui['new-note'].disabled = !readable || busy;
  ui.search.disabled = !readable || notes.length === 0;
  ui['back'].disabled = busy; ui['delete'].disabled = busy;
  ui.title.disabled = busy; ui.body.disabled = busy;
  ui['delete'].hidden = !selected;
  ui.context.textContent = original ? displayTitle(original) : 'New note';
  ui['save-status'].textContent = busy ? 'Saving…' : failed ? 'Not saved' : original && !dirty() ? 'Saved in this browser' : 'Unsaved changes';
  ui.save.textContent = busy ? 'Saving…' : failed ? 'Try saving again' : 'Save note';
  ui.save.disabled = busy || !nonempty() || (!dirty() && Boolean(original));
  ui['save-help'].hidden = nonempty();
  document.querySelector('#idle button').disabled = !readable || busy;
}
function renderList() {
  ui['clear-search'].hidden = !ui.search.value;
  ui['note-list'].setAttribute('aria-busy', 'false');
  if (!readable) return;
  let matches;
  try { matches = store.list(ui.search.value); } catch { readFailure(); return; }
  ui.count.textContent = `${matches.length} ${ui.search.value.trim() ? 'matches' : 'notes'}`;
  if (!notes.length) {
    message('Your notes start here', 'Create your first note. It stays in this browser.', 'New note', () => navigate(newNote));
  } else if (!matches.length) {
    message('No matching notes', 'Try different words or clear your search.', 'Clear search', clearSearch);
  } else {
    ui['note-list'].replaceChildren(...matches.map(note => {
      const excerpt = note.body.split('\n').find(line => line.trim()) || 'No additional text';
      const row = button('', () => navigate(() => openNote(note.id, row)), 'note-row');
      row.dataset.noteId = note.id;
      row.disabled = busy;
      row.setAttribute('aria-pressed', String(note.id === selected));
      row.setAttribute('aria-label', `${displayTitle(note)}. ${excerpt}`);
      const title = document.createElement('strong'); title.textContent = displayTitle(note);
      const body = document.createElement('span'); body.className = 'excerpt'; body.textContent = excerpt;
      const time = document.createElement('time'); time.dateTime = note.updatedAt;
      time.textContent = `Edited ${new Date(note.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
      row.append(title, body, time); return row;
    }));
  }
}
function refresh() { notes = store.list(); readable = true; renderList(); renderEditor(); }
function readFailure() {
  readable = false; ui.count.textContent = ''; ui['note-list'].setAttribute('aria-busy', 'false');
  message('', 'We couldn’t open your saved notes. Try again. Your saved notes have not been replaced.', 'Try again', load);
  renderEditor();
}
async function load() {
  readable = false; renderEditor(); ui['note-list'].setAttribute('aria-busy', 'true');
  ui['note-list'].textContent = 'Loading your notes…';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try { refresh(); } catch { readFailure(); }
}
function showEditor() {
  active = true; failed = false; ui['save-error'].hidden = true;
  document.querySelector('.workspace').classList.add('editing'); renderEditor(); renderList(); ui.title.focus();
}
function newNote() { selected = null; original = null; origin = ui['new-note']; ui.title.value = ''; ui.body.value = ''; showEditor(); }
function openNote(id, trigger) {
  try {
    const note = store.get(id); if (!note) { refresh(); return; }
    selected = id; original = note; origin = trigger; ui.title.value = note.title; ui.body.value = note.body; showEditor();
  } catch { readFailure(); }
}
function back() {
  active = false; failed = false; document.querySelector('.workspace').classList.remove('editing'); renderEditor();
  (document.querySelector(`[data-note-id="${selected}"]`) || origin?.isConnected && origin || ui['new-note']).focus();
}
function clearSearch() { ui.search.value = ''; renderList(); ui.search.focus(); }
function setBusy(value) { busy = value; renderEditor(); for (const node of ui['note-list'].querySelectorAll('button')) node.disabled = value; }
async function save() {
  if (!nonempty() || busy) return false;
  setBusy(true);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  let committed;
  try { committed = selected ? store.update(selected, draft()) : store.create(draft()); }
  catch (error) {
    failed = true;
    ui['save-error'].textContent = error.code === 'unavailable' || error.cause?.name === 'SecurityError'
      ? 'This browser isn’t allowing notes to be saved. Your changes are still here, but they will be lost if you close this page.'
      : 'We couldn’t save your note in this browser. Your changes are still here. Try again before leaving.';
    ui['save-error'].hidden = false; setBusy(false); return false;
  }
  if (!selected) ui.search.value = '';
  selected = committed.id; original = committed; failed = false; ui['save-error'].hidden = true;
  setBusy(false);
  try { refresh(); } catch { readFailure(); }
  return true;
}
function closeModal(restore = true) {
  const trigger = modal?.trigger; modal = null; ui.confirmation.close(); if (restore && trigger?.isConnected) trigger.focus();
}
function showModal(title, description, actions) {
  modal = { trigger: document.activeElement };
  ui['dialog-title'].textContent = title; ui['dialog-description'].textContent = description;
  ui['dialog-error'].hidden = true; ui['dialog-actions'].replaceChildren(...actions);
  ui.confirmation.showModal(); actions[0].focus();
}
function navigate(action) {
  if (busy) return;
  if (!dirty()) { action(); return; }
  const keep = button('Keep editing', () => closeModal());
  const discard = button('Discard changes', () => { closeModal(false); action(); });
  const proceed = button('Save and continue', async () => {
    for (const node of [keep, discard, proceed]) node.disabled = true;
    proceed.textContent = 'Saving…';
    const success = await save();
    if (success) { closeModal(false); action(); }
    else {
      ui['dialog-error'].textContent = 'We couldn’t save. Your changes are still here.'; ui['dialog-error'].hidden = false;
      for (const node of [keep, discard, proceed]) node.disabled = false;
      proceed.textContent = 'Save and continue'; proceed.focus();
    }
  }, 'primary');
  proceed.disabled = !nonempty();
  showModal('Unsaved changes', 'Save your changes before leaving this note?', [keep, discard, proceed]);
}
function deleteNote() {
  const visible = [...ui['note-list'].querySelectorAll('[data-note-id]')].map(node => node.dataset.noteId);
  const index = visible.indexOf(selected); const destination = visible[index + 1] || visible[index - 1];
  const cancel = button('Cancel', () => closeModal());
  const confirm = button('Delete note', async () => {
    cancel.disabled = true; confirm.disabled = true; confirm.textContent = 'Deleting…'; setBusy(true);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try { store.remove(selected); }
    catch (error) {
      setBusy(false); cancel.disabled = false; confirm.disabled = false; confirm.textContent = 'Try deleting again';
      ui['dialog-error'].textContent = error.code === 'unavailable' || error.cause?.name === 'SecurityError'
        ? 'This browser isn’t allowing changes to saved notes. This note has not been deleted.'
        : 'We couldn’t delete this note. It is still in your notes. Try again.';
      ui['dialog-error'].hidden = false; confirm.focus(); return;
    }
    closeModal(false); selected = null; original = null; active = false; failed = false;
    ui.title.value = ''; ui.body.value = ''; ui['save-error'].hidden = true;
    document.querySelector('.workspace').classList.remove('editing');
    setBusy(false);
    try { notes = store.list(); if (!notes.length) ui.search.value = ''; refresh(); } catch { readFailure(); }
    ui.announcement.textContent = 'Note deleted';
    (document.querySelector(`[data-note-id="${destination}"]`) || ui['new-note']).focus();
  }, 'destructive');
  showModal('Delete this note?', `“${displayTitle(original)}” will be permanently removed from this browser.${dirty() ? ' Your unsaved changes will also be discarded.' : ''}`, [cancel, confirm]);
}
ui['new-note'].addEventListener('click', () => navigate(newNote));
document.querySelector('#idle button').addEventListener('click', () => navigate(newNote));
ui.search.addEventListener('input', renderList);
ui['clear-search'].addEventListener('click', clearSearch);
ui['back'].addEventListener('click', () => navigate(back));
ui['delete'].addEventListener('click', deleteNote);
ui['note-form'].addEventListener('submit', async event => { event.preventDefault(); await save(); });
for (const field of [ui.title, ui.body]) field.addEventListener('input', renderEditor);
ui.confirmation.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const actions = [...ui['dialog-actions'].querySelectorAll('button:not(:disabled)')];
  if (!actions.length) { event.preventDefault(); return; }
  const first = actions[0], last = actions.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
ui.confirmation.addEventListener('cancel', event => { event.preventDefault(); if (!busy) closeModal(); });
window.addEventListener('beforeunload', event => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } });
load();
