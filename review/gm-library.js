import { catalog } from './gm-library-catalog.js?v=1';

const kinds = {
  sheet: 'Character sheets',
  reference: 'Published references',
  planning: 'Planning material',
  draft: 'Working drafts',
  other: 'Other PDFs'
};
const known = new Map(catalog.map(entry => [entry.id, entry]));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const categoryOptions = selected => Object.entries(kinds).map(([id, label]) =>
  `<option value="${id}"${id === selected ? ' selected' : ''}>${label}</option>`).join('');

function openLibrary() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('team-biscuit-gm-library', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pdfs', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function useStore(db, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pdfs', mode);
    const request = action(transaction.objectStore('pdfs'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error ?? new Error('Storage operation aborted'));
  });
}

async function identify(file) {
  const header = await file.slice(0, 1024).text();
  if (!header.includes('%PDF-')) throw new Error('The file has no PDF header');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function renderGmLibrary() {
  return `
    <div class="chapter-top"><a href="#/">← Team Biscuit home</a></div>
    <header class="section gm-library-heading">
      <p class="eyebrow">Team Biscuit · Behind the screen</p>
      <h1>GM’s Library</h1>
      <p>Read the published adventure previews and browse character sheets and working papers from the campaign.</p>
    </header>
    <section class="section gm-library" aria-label="Campaign PDFs">
      <div class="gm-library-import">
        <div>
          <h2>Add your PDFs</h2>
          <p>Choose individual files or the collection folder. The library recognizes the reviewed PDFs and matches them to their entries, including diagrams with the same filename.</p>
          <p>Copies are stored in this browser. To read them on another device or after clearing site data, add the originals there.</p>
        </div>
        <div class="gm-library-import-tools">
          <label for="gm-import-kind">Category for other PDFs</label>
          <select id="gm-import-kind">${categoryOptions('other')}</select>
          <div class="gm-library-actions">
            <button type="button" data-gm-pick="files" disabled>Choose PDFs</button>
            <button type="button" data-gm-pick="folder" disabled>Choose a folder</button>
          </div>
          <input data-gm-files type="file" accept=".pdf,application/pdf" multiple hidden>
          <input data-gm-folder type="file" webkitdirectory multiple hidden>
          <p data-gm-status role="status" aria-live="polite"></p>
        </div>
      </div>
      <p class="gm-library-guide">Published references describe the adventures as written. Each preview is an excerpt. Planning diagrams show intentions, and character sheets preserve a snapshot of each export.</p>
      <div class="gm-library-filters">
        <div><label for="gm-library-query">Find a document</label><input id="gm-library-query" type="search" placeholder="Try Bastion or Brindinford"></div>
        <div><label for="gm-library-kind">Category</label><select id="gm-library-kind"><option value="all">All categories</option>${categoryOptions()}</select></div>
        <label class="gm-library-saved"><input type="checkbox" data-gm-saved> In this browser</label>
      </div>
      <p data-gm-count role="status"></p>
      <div class="gm-library-grid" data-gm-list></div>
    </section>
    <dialog class="gm-library-reader" aria-labelledby="gm-reader-title">
      <div class="gm-library-reader-heading">
        <div><p class="eyebrow">GM’s Library</p><h2 id="gm-reader-title"></h2></div>
        <form method="dialog"><button type="submit">Close</button></form>
      </div>
      <div class="gm-library-reader-links">
        <a data-gm-open target="_blank" rel="noopener">Open PDF in a new tab ↗</a>
        <a data-gm-download>Save a copy ↓</a>
      </div>
      <iframe title="PDF preview"></iframe>
    </dialog>`;
}

export function bindGmLibrary(main) {
  const query = main.querySelector('#gm-library-query');
  const kind = main.querySelector('#gm-library-kind');
  const saved = main.querySelector('[data-gm-saved]');
  const list = main.querySelector('[data-gm-list]');
  const status = main.querySelector('[data-gm-status]');
  const count = main.querySelector('[data-gm-count]');
  const files = main.querySelector('[data-gm-files]');
  const folder = main.querySelector('[data-gm-folder]');
  const importKind = main.querySelector('#gm-import-kind');
  const pickers = [...main.querySelectorAll('[data-gm-pick]')];
  const reader = main.querySelector('.gm-library-reader');
  const frame = reader.querySelector('iframe');
  const documents = new Map();
  let db;
  let active = true;
  let busy = false;
  let readerUrl;
  let readerButton;

  function render() {
    const entries = [...catalog, ...[...documents.values()].filter(entry => !known.has(entry.id))];
    const term = query.value.trim().toLocaleLowerCase();
    const visible = entries.filter(entry =>
      (kind.value === 'all' || kind.value === entry.kind) &&
      (!saved.checked || documents.has(entry.id)) &&
      `${entry.title} ${entry.description ?? ''} ${kinds[entry.kind]}`.toLocaleLowerCase().includes(term)
    );
    count.textContent = `${visible.length} of ${entries.length} entries · ${documents.size} saved in this browser`;
    list.innerHTML = visible.length ? visible.map(entry => `
      <article class="gm-library-card">
        <p class="eyebrow">${escape(kinds[entry.kind])}${entry.pages ? ` · ${entry.pages} ${entry.pages === 1 ? 'page' : 'pages'}` : ''}</p>
        <h2>${escape(entry.title)}</h2>
        ${entry.badge ? `<p class="gm-library-badge">${escape(entry.badge)}</p>` : ''}
        ${entry.description ? `<p>${escape(entry.description)}</p>` : ''}
        <div class="gm-library-card-actions">
          ${(entry.online ?? []).map(({ label, url }) => `
            <a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)} ↗</a>
          `).join('')}
          ${documents.has(entry.id) ? `
            <button type="button" data-gm-read="${entry.id}">Read PDF</button>
            <button class="gm-library-remove" type="button" data-gm-remove="${entry.id}" ${busy ? 'disabled' : ''}>Remove local copy</button>
          ` : entry.online ? '' : '<span>Add a copy to read</span>'}
          ${entry.href ? `<a href="${entry.href}">Related campaign page ↗</a>` : ''}
        </div>
      </article>`).join('') : '<p class="gm-library-empty">No documents match this view.</p>';
  }

  function setBusy(value) {
    busy = value;
    pickers.forEach(button => { button.disabled = value || !db; });
    render();
  }

  async function importFiles(input) {
    if (!active || busy || !db) return;
    const selection = [...input.files].filter(file => /\.pdf$/i.test(file.name) || file.type === 'application/pdf');
    input.value = '';
    if (!selection.length) {
      status.textContent = 'No PDFs found in the selection.';
      return;
    }
    const category = importKind.value;
    const failures = [];
    let added = 0;
    let duplicates = 0;
    setBusy(true);
    for (const [index, file] of selection.entries()) {
      if (!active) break;
      status.textContent = `Reading ${index + 1} of ${selection.length} PDFs…`;
      try {
        const id = await identify(file);
        if (!active) break;
        if (documents.has(id)) {
          duplicates++;
          continue;
        }
        const record = {
          id,
          title: file.name.replace(/\.pdf$/i, ''),
          kind: category,
          filename: file.name,
          pdf: new Blob([file], { type: 'application/pdf' })
        };
        await useStore(db, 'readwrite', store => store.put(record));
        documents.set(id, record);
        added++;
      } catch {
        failures.push(file.name);
      }
    }
    if (!active) return;
    setBusy(false);
    status.textContent = [
      `${added} added.`,
      duplicates ? `${duplicates} already saved or identical.` : '',
      failures.length ? `Could not add ${failures.join(', ')}. Check the PDFs and available browser storage.` : ''
    ].filter(Boolean).join(' ');
  }

  function releaseReader() {
    frame.removeAttribute('src');
    if (readerUrl) URL.revokeObjectURL(readerUrl);
    readerUrl = undefined;
  }

  pickers.forEach(button => button.addEventListener('click', () => {
    (button.dataset.gmPick === 'files' ? files : folder).click();
  }));
  files.addEventListener('change', () => importFiles(files));
  folder.addEventListener('change', () => importFiles(folder));
  query.addEventListener('input', render);
  kind.addEventListener('change', render);
  saved.addEventListener('change', render);

  list.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.dataset.gmRead ?? button.dataset.gmRemove;
    const record = documents.get(id);
    if (!record) return;
    const entry = known.get(id) ?? record;
    if (button.dataset.gmRead) {
      readerButton = button;
      readerUrl = URL.createObjectURL(record.pdf);
      reader.querySelector('#gm-reader-title').textContent = entry.title;
      frame.title = `PDF preview of ${entry.title}`;
      const download = reader.querySelector('[data-gm-download]');
      download.href = readerUrl;
      download.download = record.filename;
      reader.querySelector('[data-gm-open]').href = readerUrl;
      frame.src = readerUrl;
      reader.showModal();
    } else if (!busy) {
      setBusy(true);
      try {
        await useStore(db, 'readwrite', store => store.delete(id));
        documents.delete(id);
        status.textContent = `Removed the browser copy of ${entry.title}.`;
      } catch {
        status.textContent = `Could not remove the browser copy of ${entry.title}.`;
      }
      if (active) setBusy(false);
    }
  });
  reader.addEventListener('close', () => {
    releaseReader();
    readerButton?.focus();
  });

  render();
  (async () => {
    try {
      db = await openLibrary();
      if (!active) {
        db.close();
        return;
      }
      const records = await useStore(db, 'readonly', store => store.getAll());
      if (!active) return;
      records.forEach(record => documents.set(record.id, record));
      setBusy(false);
    } catch {
      if (active) status.textContent = 'Browser storage is unavailable. The catalog is still available below.';
    }
  })();

  return () => {
    active = false;
    if (reader.open) reader.close();
    releaseReader();
    db?.close();
  };
}
