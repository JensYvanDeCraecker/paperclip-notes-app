/** Browser-only note persistence. No cached success state; writes may throw. */
export class NotesStorageError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'NotesStorageError';
    this.code = code;
  }
}
const fail = (code, message, cause) => { throw new NotesStorageError(code, message, cause); };
const validNote = n => n && typeof n.id === 'string' && n.id.length > 0 &&
  ['title', 'body', 'createdAt', 'updatedAt'].every(k => typeof n[k] === 'string') &&
  Number.isFinite(Date.parse(n.createdAt)) && Number.isFinite(Date.parse(n.updatedAt));

export function createNotesStore(options = {}) {
  const key = options.key ?? 'personal-notes:v1';
  function storage() {
    try {
      const value = options.storage ?? globalThis.localStorage;
      if (!value) throw new Error('Storage missing');
      return value;
    } catch (cause) { fail('unavailable', 'Browser storage is unavailable. Your changes are not saved.', cause); }
  }
  function read() {
    let raw;
    try { raw = storage().getItem(key); }
    catch (cause) {
      if (cause instanceof NotesStorageError) throw cause;
      fail('unavailable', 'Cannot read your notes from browser storage.', cause);
    }
    if (raw === null) return { raw, notes: [] };
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.notes) || !data.notes.every(validNote) ||
          new Set(data.notes.map(n => n.id)).size !== data.notes.length) throw new Error('Invalid note data');
      return { raw, notes: data.notes };
    } catch (cause) { fail('corrupt', 'Stored notes could not be read. Existing data has been preserved.', cause); }
  }
  function input(value) {
    if (!value || typeof value.title !== 'string' || typeof value.body !== 'string')
      fail('invalid', 'A note must have a text title and body.');
    return { title: value.title, body: value.body };
  }
  function mutate(operation) {
    const { raw, notes } = read();
    const result = operation(notes);
    try {
      const target = storage();
      if (target.getItem(key) !== raw) fail('conflict', 'Notes changed elsewhere. Retry saving your draft.');
      target.setItem(key, JSON.stringify({ version: 1, notes }));
    } catch (cause) {
      if (cause instanceof NotesStorageError) throw cause;
      fail('write_failed', 'Your changes could not be saved. Keep your draft and try again.', cause);
    }
    return result;
  }
  return {
    list(query = '') {
      if (typeof query !== 'string') fail('invalid', 'Search must be text.');
      const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      return read().notes.filter(n => words.every(w => `${n.title}\n${n.body}`.toLocaleLowerCase().includes(w)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    },
    get(id) { return read().notes.find(n => n.id === id) ?? null; },
    create(value) {
      const fields = input(value);
      return mutate(notes => {
        const now = new Date().toISOString();
        const note = { id: globalThis.crypto.randomUUID(), ...fields, createdAt: now, updatedAt: now };
        notes.push(note);
        return { ...note };
      });
    },
    update(id, value) {
      const fields = input(value);
      return mutate(notes => {
        const index = notes.findIndex(n => n.id === id);
        if (index < 0) fail('not_found', 'This note no longer exists. Keep your draft.');
        notes[index] = { ...notes[index], ...fields, updatedAt: new Date().toISOString() };
        return { ...notes[index] };
      });
    },
    remove(id) {
      return mutate(notes => {
        const index = notes.findIndex(n => n.id === id);
        if (index < 0) fail('not_found', 'This note no longer exists.');
        notes.splice(index, 1);
        return true;
      });
    },
  };
}
