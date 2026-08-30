const DB_NAME = 'cpt_social_pilot_db';
const DB_VERSION = 1;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const sessions = db.createObjectStore('sessions', { keyPath: 'session_id' });
      sessions.createIndex('participant_id', 'participant_id');
      const trials = db.createObjectStore('trials', { keyPath: 'row_id' });
      trials.createIndex('session_id', 'session_id');
      const assessments = db.createObjectStore('assessments', { keyPath: 'row_id' });
      assessments.createIndex('session_id', 'session_id');
      const events = db.createObjectStore('events', { keyPath: 'row_id' });
      events.createIndex('session_id', 'session_id');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function store(name, mode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

export async function putRecord(name, record) {
  return requestResult((await store(name, 'readwrite')).put(record));
}

export async function getAll(name) {
  return requestResult((await store(name)).getAll());
}

export async function clearAll() {
  const db = await openDb();
  const transaction = db.transaction(['sessions', 'trials', 'assessments', 'events'], 'readwrite');
  ['sessions', 'trials', 'assessments', 'events'].forEach((name) => transaction.objectStore(name).clear());
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}
