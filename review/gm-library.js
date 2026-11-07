import { catalog } from './gm-library-catalog.js?v=4';

const kinds = {
  sheet: 'Character sheets',
  reference: 'Published references',
  planning: 'Planning material'
};
const entriesById = new Map(catalog.map(entry => [entry.id, entry]));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const categoryOptions = Object.entries(kinds).map(([id, label]) =>
  `<option value="${id}">${label}</option>`).join('');

export function renderGmLibrary() {
  return `
    <div class="chapter-top"><a href="#/">← Team Biscuit home</a></div>
    <header class="section gm-library-heading">
      <p class="eyebrow">Team Biscuit · Behind the screen</p>
      <h1>GM’s Library</h1>
      <p>Read archived character sheets, campaign diagrams, and adventure books.</p>
    </header>
    <section class="section gm-library" aria-label="Campaign PDFs">
      <p class="gm-library-guide">Published references describe the adventures as written. AnyFlip links open third-party copies, and publisher previews are excerpts. Planning diagrams show intentions, and character sheets preserve a snapshot of each export.</p>
      <div class="gm-library-filters">
        <div><label for="gm-library-query">Find a document</label><input id="gm-library-query" type="search" placeholder="Try Bastion or Brindinford"></div>
        <div><label for="gm-library-kind">Category</label><select id="gm-library-kind"><option value="all">All categories</option>${categoryOptions}</select></div>
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
      <div class="gm-library-reader-controls">
        <button type="button" data-gm-prev disabled>← Previous page</button>
        <span data-gm-page role="status"></span>
        <button type="button" data-gm-next disabled>Next page →</button>
      </div>
      <div class="gm-library-reader-page" data-gm-preview></div>
    </dialog>`;
}

export function bindGmLibrary(main) {
  const query = main.querySelector('#gm-library-query');
  const kind = main.querySelector('#gm-library-kind');
  const list = main.querySelector('[data-gm-list]');
  const count = main.querySelector('[data-gm-count]');
  const reader = main.querySelector('.gm-library-reader');
  const preview = reader.querySelector('[data-gm-preview]');
  const pageStatus = reader.querySelector('[data-gm-page]');
  const previous = reader.querySelector('[data-gm-prev]');
  const next = reader.querySelector('[data-gm-next]');
  let readerButton;
  let pdfRequest;
  let pdfLoad;
  let pdfDocument;
  let pageNumber = 0;

  function render() {
    const term = query.value.trim().toLocaleLowerCase();
    const visible = catalog.filter(entry =>
      (kind.value === 'all' || kind.value === entry.kind) &&
      `${entry.title} ${entry.description ?? ''} ${kinds[entry.kind]}`.toLocaleLowerCase().includes(term)
    );
    count.textContent = `${visible.length} of ${catalog.length} entries`;
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
          ${entry.pdfPath ? `<button type="button" data-gm-read="${entry.id}">Read PDF</button>` : ''}
          ${entry.href ? `<a href="${entry.href}">Related campaign page ↗</a>` : ''}
        </div>
      </article>`).join('') : '<p class="gm-library-empty">No documents match this view.</p>';
  }

  function releaseReader() {
    pdfRequest = undefined;
    if (pdfLoad) pdfLoad.destroy().catch(() => {});
    pdfLoad = undefined;
    pdfDocument = undefined;
    preview.replaceChildren();
  }

  async function showPage(number) {
    const document = pdfDocument;
    previous.disabled = next.disabled = true;
    pageStatus.textContent = `Loading page ${number}…`;
    try {
      const page = await document.getPage(number);
      if (document !== pdfDocument) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1600 / base.width, 2300 / base.height) });
      const canvas = preview.ownerDocument.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Page ${number} of the PDF`);
      await page.render({ canvas, viewport }).promise;
      if (document !== pdfDocument) return;
      preview.replaceChildren(canvas);
      preview.scrollTop = 0;
      pageNumber = number;
      pageStatus.textContent = `Page ${number} of ${document.numPages}`;
    } catch {
      if (document === pdfDocument) pageStatus.textContent = 'Page unavailable. Open or save the PDF above.';
    } finally {
      if (document === pdfDocument) {
        previous.disabled = pageNumber <= 1;
        next.disabled = pageNumber >= document.numPages;
      }
    }
  }

  async function loadPdf(url) {
    const request = Symbol();
    pdfRequest = request;
    pageNumber = 1;
    previous.disabled = next.disabled = true;
    pageStatus.textContent = 'Opening PDF…';
    try {
      const { getDocument, GlobalWorkerOptions } = await import('./vendor/pdfjs-6.5.438/pdf.min.mjs');
      if (pdfRequest !== request) return;
      const vendorPath = './vendor/pdfjs-6.5.438/';
      const vendor = new URL(vendorPath, import.meta.url);
      GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', vendor).href;
      GlobalWorkerOptions.rendererSrc = new URL('pdf.renderer.min.mjs', vendor).href;
      pdfLoad = getDocument({
        url,
        cMapUrl: new URL('cmaps/', vendor).href,
        iccUrl: new URL('iccs/', vendor).href,
        standardFontDataUrl: new URL('standard_fonts/', vendor).href,
        wasmUrl: new URL('wasm/', vendor).href
      });
      const document = await pdfLoad.promise;
      if (pdfRequest !== request) return;
      pdfDocument = document;
      await showPage(1);
    } catch {
      if (pdfRequest === request) pageStatus.textContent = 'Preview unavailable. Open or save the PDF above.';
    }
  }

  previous.addEventListener('click', () => showPage(pageNumber - 1));
  next.addEventListener('click', () => showPage(pageNumber + 1));

  query.addEventListener('input', render);
  kind.addEventListener('change', render);

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-gm-read]');
    if (!button) return;
    const entry = entriesById.get(button.dataset.gmRead);
    if (!entry?.pdfPath) return;
    readerButton = button;
    const url = new URL(entry.pdfPath, document.baseURI).href;
    reader.querySelector('#gm-reader-title').textContent = entry.title;
    const download = reader.querySelector('[data-gm-download]');
    download.href = url;
    download.download = entry.pdfPath.split('/').at(-1);
    reader.querySelector('[data-gm-open]').href = url;
    reader.showModal();
    loadPdf(url);
  });
  reader.addEventListener('close', () => {
    releaseReader();
    readerButton?.focus();
  });

  render();
  return () => {
    if (reader.open) reader.close();
    releaseReader();
  };
}
