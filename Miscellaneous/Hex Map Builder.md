# Hex Map Builder

Create, preview, and export clickable hex maps directly from your campaign wiki. The builder lets you configure the grid, customize each hex tile, and generate a drop-in HTML snippet that works on GitHub Pages without additional tooling.

## How to use this page

1. Pick the number of rows/columns (you can regenerate safely—existing tiles that still fit stay intact).
2. Click a hex in the preview to edit its name, description, colors, and the list of wiki links.
3. Use the **Links** section to add one or more destinations (absolute URLs or wiki-relative paths both work).
4. Hit **Copy HTML Snippet** once you like the layout, then paste it into any Markdown/HTML page you publish.

> 💡 Tip: the exported snippet includes the necessary CSS and JavaScript so it can live anywhere on your site, even outside this builder.

<div id="hex-builder" class="hex-builder" data-enhanced="false">
  <div class="hex-builder__panel hex-builder__panel--settings">
    <h2>Map Settings</h2>
    <div class="hex-builder__grid">
      <label>
        <span>Rows</span>
        <input type="number" min="1" max="12" value="5" data-input="rows">
      </label>
      <label>
        <span>Columns</span>
        <input type="number" min="1" max="12" value="5" data-input="cols">
      </label>
      <label>
        <span>Hex Size (px)</span>
        <input type="number" min="70" max="180" value="110" data-input="size">
      </label>
    </div>
    <p class="hex-builder__note">Updating the grid keeps any tiles that still fit inside the new dimensions.</p>
    <button type="button" class="hex-builder__action" data-action="generate">Update Grid</button>
  </div>

  <div class="hex-builder__layout">
    <section class="hex-map-panel">
      <header class="hex-map-panel__head">
        <div>
          <h2>Hex Map Preview</h2>
          <p>Click any hex to edit it. The preview lists the active links for the selected tile.</p>
        </div>
        <div class="hex-map-panel__legend">
          <span class="hex-map-panel__legend-swatch" aria-hidden="true"></span>
          <span>Linked tile</span>
        </div>
      </header>
      <div class="hex-map-grid" id="hexMap" role="listbox" aria-label="Hex map preview"></div>
      <div class="hex-preview" id="hexPreview">Select a hex to see its details here.</div>
    </section>

    <section class="hex-editor" id="hexEditor" aria-live="polite">
      <h2>Hex Details</h2>
      <p class="hex-builder__note">Changes save automatically. Colors use standard CSS color values (hex or keywords).</p>
      <label>
        <span>Display Name</span>
        <input type="text" data-field="title" placeholder="e.g., Copper Vale">
      </label>
      <label>
        <span>Description</span>
        <textarea rows="3" data-field="description" placeholder="Optional flavor text shown in the preview panel."></textarea>
      </label>
      <div class="hex-editor__swatches">
        <label>
          <span>Fill Color</span>
          <input type="color" data-field="color" value="#30404d">
        </label>
        <label>
          <span>Text Color</span>
          <input type="color" data-field="textColor" value="#ffffff">
        </label>
      </div>
      <div class="hex-editor__links">
        <div class="hex-editor__links-head">
          <h3>Links</h3>
          <button type="button" class="hex-builder__action" data-action="add-link">Add Link</button>
        </div>
        <div id="hexLinks" class="hex-editor__links-list">
          <p class="hex-builder__note">No links yet. Add URLs or relative wiki paths (e.g., <code>/Characters/PCs/Twigbeard/</code>).</p>
        </div>
      </div>
    </section>
  </div>

  <section class="hex-builder__panel hex-builder__panel--export">
    <h2>Export HTML</h2>
    <p>Press the button to copy a ready-to-paste snippet that renders this map anywhere on your site.</p>
    <button type="button" class="hex-builder__action" data-action="export">Copy HTML Snippet</button>
    <textarea rows="8" readonly data-output="html" placeholder="Snippet will appear here."></textarea>
  </section>
</div>

<script>
(function () {
  const builder = document.getElementById('hex-builder');
  if (!builder) return;

  const MAP_CSS = `
.hex-map-shell {
  --hex-size: 110px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hex-map-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
  width: 100%;
}
.hex-map-grid .hex-row {
  display: flex;
  gap: 0.35rem;
}
.hex-map-grid .hex-row--offset {
  margin-left: calc(var(--hex-size) * 0.5);
}
.hex-map-grid .hex-cell {
  width: var(--hex-size);
  height: calc(var(--hex-size) * 0.866);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  background: var(--hex-bg, #374151);
  color: var(--hex-text, #fff);
  font-weight: 600;
  text-align: center;
  text-transform: none;
  cursor: pointer;
  position: relative;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  transition: transform 120ms ease, box-shadow 120ms ease;
  background-clip: padding-box;
}
.hex-map-grid .hex-cell:focus-visible {
  outline: 3px solid var(--md-primary-fg-color, #8fbcbb);
  outline-offset: 4px;
}
.hex-map-grid .hex-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}
.hex-map-grid .hex-cell.is-selected {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
}
.hex-map-grid .hex-cell[data-has-links="true"]::after {
  content: "";
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
}
.hex-map-details {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.5);
  color: inherit;
}
.hex-map-details h4 {
  margin: 0 0 0.4rem;
}
.hex-map-details ul {
  margin: 0.25rem 0 0;
  padding-left: 1.2rem;
}
.hex-map-details a {
  color: inherit;
  text-decoration: underline;
}
`;

  const BUILDER_CSS = `
.hex-builder {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.hex-builder__panel {
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.4);
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.35);
}
.hex-builder__panel h2 {
  margin-top: 0;
}
.hex-builder__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.hex-builder label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 500;
}
.hex-builder input,
.hex-builder textarea {
  border-radius: 0.65rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.6);
  color: inherit;
  padding: 0.5rem 0.75rem;
}
.hex-builder textarea {
  resize: vertical;
}
.hex-builder__action {
  border: none;
  border-radius: 999px;
  background: var(--md-primary-fg-color, #4c1d95);
  color: #fff;
  font-weight: 600;
  padding: 0.45rem 1.25rem;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.hex-builder__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(76, 29, 149, 0.35);
}
.hex-builder__note {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0.25rem 0 0.5rem;
}
.hex-builder__layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1.25rem;
}
.hex-map-panel,
.hex-editor {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.4);
  padding: 1.25rem;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.35);
}
.hex-map-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}
.hex-map-panel__legend {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.9;
}
.hex-map-panel__legend-swatch {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.6);
  display: inline-flex;
}
.hex-preview {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  min-height: 120px;
}
.hex-preview h3 {
  margin-top: 0;
}
.hex-editor__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin: 0.75rem 0;
}
.hex-editor__links {
  margin-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
  padding-top: 1rem;
}
.hex-editor__links-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.hex-editor__links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.hex-link-card {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.35);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
}
.hex-link-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.hex-link-card__remove {
  border: none;
  background: transparent;
  color: #f87171;
  font-weight: 600;
  cursor: pointer;
}
.hex-builder__panel--export textarea {
  width: 100%;
  margin-top: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
@media (max-width: 1024px) {
  .hex-builder__layout {
    grid-template-columns: 1fr;
  }
}
` + MAP_CSS;

  function injectCSS(id, cssText) {
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  injectCSS('hex-builder-styles', BUILDER_CSS);

  const state = {
    rows: 5,
    cols: 5,
    hexSize: 110,
    data: [],
    selectedId: null
  };

  const rowsInput = builder.querySelector('[data-input="rows"]');
  const colsInput = builder.querySelector('[data-input="cols"]');
  const sizeInput = builder.querySelector('[data-input="size"]');
  const generateButton = builder.querySelector('[data-action="generate"]');
  const addLinkButton = builder.querySelector('[data-action="add-link"]');
  const exportButton = builder.querySelector('[data-action="export"]');
  const mapContainer = builder.querySelector('#hexMap');
  const previewContainer = builder.querySelector('#hexPreview');
  const editor = builder.querySelector('#hexEditor');
  const linksContainer = builder.querySelector('#hexLinks');
  const outputArea = builder.querySelector('[data-output="html"]');

  const titleInput = editor.querySelector('[data-field="title"]');
  const descriptionInput = editor.querySelector('[data-field="description"]');
  const colorInput = editor.querySelector('[data-field="color"]');
  const textColorInput = editor.querySelector('[data-field="textColor"]');

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;
    return Math.min(Math.max(number, min), max);
  }

  function createHex(row, col) {
    return {
      id: `hex-${row}-${col}`,
      row,
      col,
      title: '',
      description: '',
      color: '#374151',
      textColor: '#ffffff',
      links: []
    };
  }

  function rebuildGrid() {
    const next = [];
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.cols; c += 1) {
        const existing = state.data.find((hex) => hex.row === r && hex.col === c);
        next.push(existing ? { ...existing } : createHex(r, c));
      }
    }
    state.data = next;
    if (!state.data.find((hex) => hex.id === state.selectedId)) {
      state.selectedId = state.data[0]?.id || null;
    }
  }

  function renderHexGrid() {
    mapContainer.innerHTML = '';
    mapContainer.style.setProperty('--hex-size', `${state.hexSize}px`);

    for (let r = 0; r < state.rows; r += 1) {
      const rowEl = document.createElement('div');
      rowEl.className = 'hex-row';
      if (r % 2 === 1) {
        rowEl.classList.add('hex-row--offset');
      }
      const rowHexes = state.data.filter((hex) => hex.row === r).sort((a, b) => a.col - b.col);
      rowHexes.forEach((hex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hex-cell';
        if (hex.id === state.selectedId) {
          button.classList.add('is-selected');
        }
        if (hex.links.length > 0) {
          button.dataset.hasLinks = 'true';
        }
        button.dataset.hexId = hex.id;
        button.style.setProperty('--hex-bg', hex.color || '#374151');
        button.style.setProperty('--hex-text', hex.textColor || '#ffffff');
        button.title = hex.description || 'Click to edit this hex';
        button.textContent = hex.title || `${hex.row + 1},${hex.col + 1}`;
        rowEl.appendChild(button);
      });
      mapContainer.appendChild(rowEl);
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    })[char]);
  }

  function renderPreview(hex) {
    if (!hex) {
      previewContainer.innerHTML = 'Select a hex to see its details here.';
      return;
    }
    const title = hex.title || `Hex ${hex.row + 1}-${hex.col + 1}`;
    const safeDesc = hex.description ? escapeHtml(hex.description).replace(/\n/g, '<br>') : '';
    const desc = hex.description ? `<p>${safeDesc}</p>` : '<p>No description yet.</p>';
    const links = hex.links.length
      ? `<ul>${hex.links
          .map((link) => `<li><a href="${escapeHtml(link.url || '#')}" target="_blank" rel="noopener">${escapeHtml(link.label || link.url || 'Link')}</a></li>`)
          .join('')}</ul>`
      : '<p>No links added.</p>';

    previewContainer.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      ${desc}
      <strong>Links</strong>
      ${links}
    `;
  }

  function renderLinkInputs(hex) {
    linksContainer.innerHTML = '';
    if (!hex || hex.links.length === 0) {
      linksContainer.innerHTML = '<p class="hex-builder__note">No links yet. Add URLs or relative wiki paths (e.g., <code>/Characters/PCs/Twigbeard/</code>).</p>';
      return;
    }

    hex.links.forEach((link, index) => {
      const card = document.createElement('div');
      card.className = 'hex-link-card';
      card.innerHTML = `
        <label>
          <span>Label</span>
          <input type="text" data-link-field="label" data-link-index="${index}" value="${escapeHtml(link.label || '')}">
        </label>
        <label>
          <span>URL</span>
          <input type="text" data-link-field="url" data-link-index="${index}" value="${escapeHtml(link.url || '')}">
        </label>
        <div class="hex-link-card__actions">
          <button type="button" class="hex-link-card__remove" data-action="remove-link" data-link-index="${index}">Remove</button>
        </div>
      `;
      linksContainer.appendChild(card);
    });
  }

  function getSelectedHex() {
    return state.data.find((hex) => hex.id === state.selectedId) || null;
  }

  function populateEditor(hex) {
    if (!hex) {
      editor.setAttribute('aria-busy', 'true');
      titleInput.value = '';
      descriptionInput.value = '';
      colorInput.value = '#374151';
      textColorInput.value = '#ffffff';
      editor.setAttribute('aria-busy', 'false');
      addLinkButton.disabled = true;
      linksContainer.innerHTML = '<p class="hex-builder__note">Select a hex to edit its links.</p>';
      return;
    }
    editor.setAttribute('aria-busy', 'true');
    titleInput.value = hex.title || '';
    descriptionInput.value = hex.description || '';
    colorInput.value = hex.color || '#374151';
    textColorInput.value = hex.textColor || '#ffffff';
    addLinkButton.disabled = false;
    renderLinkInputs(hex);
    editor.setAttribute('aria-busy', 'false');
  }

  function selectHex(hexId) {
    state.selectedId = hexId;
    renderHexGrid();
    const hex = getSelectedHex();
    populateEditor(hex);
    renderPreview(hex);
  }

  function updateHexField(field, value) {
    const hex = getSelectedHex();
    if (!hex) return;
    hex[field] = value;
    renderHexGrid();
    renderPreview(hex);
  }

  function addLink() {
    const hex = getSelectedHex();
    if (!hex) return;
    hex.links.push({
      label: `Link ${hex.links.length + 1}`,
      url: ''
    });
    renderLinkInputs(hex);
    renderPreview(hex);
  }

  function handleLinkInput(event) {
    const target = event.target;
    if (!target.dataset.linkField) return;
    const hex = getSelectedHex();
    if (!hex) return;
    const index = Number(target.dataset.linkIndex);
    if (Number.isNaN(index)) return;
    hex.links[index][target.dataset.linkField] = target.value;
    renderPreview(hex);
  }

  function handleLinkRemoval(event) {
    const removeButton = event.target.closest('[data-action="remove-link"]');
    if (!removeButton) return;
    const hex = getSelectedHex();
    if (!hex) return;
    const index = Number(removeButton.dataset.linkIndex);
    if (Number.isNaN(index)) return;
    hex.links.splice(index, 1);
    renderLinkInputs(hex);
    renderPreview(hex);
  }

  function buildExportSnippet() {
    const mapId = `hex-map-${Date.now()}`;
    const payload = {
      rows: state.rows,
      cols: state.cols,
      hexSize: state.hexSize,
      hexes: state.data
    };
    const payloadString = JSON.stringify(payload).replace(/</g, '\\u003c');
    const styleString = MAP_CSS.replace(/<\/script/gi, '<\\/script');
    return `<div class="hex-map-shell" id="${mapId}"></div>
<script>
(function () {
  const target = document.getElementById('${mapId}');
  if (!target) return;
  const settings = ${payloadString};
  const css = \`${styleString}\`;
  if (!document.getElementById('hex-map-style')) {
    const style = document.createElement('style');
    style.id = 'hex-map-style';
    style.textContent = css;
    document.head.appendChild(style);
  }
  target.classList.add('hex-map-shell');
  target.style.setProperty('--hex-size', settings.hexSize + 'px');
  target.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'hex-map-grid';
  const details = document.createElement('div');
  details.className = 'hex-map-details';
  details.textContent = 'Select a hex to view its links.';
  target.appendChild(grid);
  target.appendChild(details);

  function renderDetails(hex) {
    if (!hex) {
      details.textContent = 'Select a hex to view its links.';
      return;
    }
    details.innerHTML = '';
    const nameHeading = document.createElement('h4');
    nameHeading.textContent = hex.title || 'Unnamed Hex';
    details.appendChild(nameHeading);
    if (hex.description) {
      const descParagraph = document.createElement('p');
      descParagraph.textContent = hex.description;
      details.appendChild(descParagraph);
    }
    const linksHeading = document.createElement('strong');
    linksHeading.textContent = 'Links';
    details.appendChild(linksHeading);
    if (hex.links && hex.links.length) {
      const list = document.createElement('ul');
      hex.links.forEach(function (link) {
        const item = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.textContent = link.label || link.url || 'Link';
        anchor.href = link.url || '#';
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        item.appendChild(anchor);
        list.appendChild(item);
      });
      details.appendChild(list);
    } else {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No links yet.';
      details.appendChild(emptyState);
    }
  }

  function selectHex(hexId) {
    const hex = settings.hexes.find(function (entry) { return entry.id === hexId; });
    const buttons = grid.querySelectorAll('.hex-cell');
    buttons.forEach(function (button) {
      button.classList.toggle('is-selected', button.dataset.hexId === hexId);
    });
    renderDetails(hex);
  }

  for (let row = 0; row < settings.rows; row += 1) {
    const rowEl = document.createElement('div');
    rowEl.className = 'hex-row';
    if (row % 2 === 1) {
      rowEl.classList.add('hex-row--offset');
    }
    const rowHexes = settings.hexes.filter(function (hex) { return hex.row === row; }).sort(function (a, b) { return a.col - b.col; });
    rowHexes.forEach(function (hex) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hex-cell';
      button.dataset.hexId = hex.id;
      button.style.setProperty('--hex-bg', hex.color || '#374151');
      button.style.setProperty('--hex-text', hex.textColor || '#ffffff');
      button.textContent = hex.title || (hex.row + 1) + ',' + (hex.col + 1);
      if (hex.links && hex.links.length) {
        button.dataset.hasLinks = 'true';
      }
      button.addEventListener('click', function () {
        selectHex(hex.id);
      });
      rowEl.appendChild(button);
    });
    grid.appendChild(rowEl);
  }
  const firstHex = settings.hexes.find(function (hex) { return hex.title || (hex.links && hex.links.length); });
  if (firstHex) {
    selectHex(firstHex.id);
  }
})();
<\/script>`;
  }

  function exportHtml() {
    const snippet = buildExportSnippet();
    outputArea.value = snippet;
    outputArea.focus();
    outputArea.select();
    navigator.clipboard?.writeText(snippet).catch(() => {});
  }

  function init() {
    rowsInput.value = state.rows;
    colsInput.value = state.cols;
    sizeInput.value = state.hexSize;
    rebuildGrid();
    renderHexGrid();
    selectHex(state.selectedId);
    builder.dataset.enhanced = 'true';
  }

  generateButton.addEventListener('click', () => {
    state.rows = clamp(rowsInput.value, 1, 12, state.rows);
    state.cols = clamp(colsInput.value, 1, 12, state.cols);
    state.hexSize = clamp(sizeInput.value, 70, 180, state.hexSize);
    rowsInput.value = state.rows;
    colsInput.value = state.cols;
    sizeInput.value = state.hexSize;
    rebuildGrid();
    renderHexGrid();
    selectHex(state.selectedId);
  });

  sizeInput.addEventListener('input', (event) => {
    state.hexSize = clamp(event.target.value, 70, 180, state.hexSize);
    event.target.value = state.hexSize;
    mapContainer.style.setProperty('--hex-size', `${state.hexSize}px`);
  });

  mapContainer.addEventListener('click', (event) => {
    const target = event.target.closest('.hex-cell');
    if (!target) return;
    selectHex(target.dataset.hexId);
  });

  titleInput.addEventListener('input', (event) => updateHexField('title', event.target.value));
  descriptionInput.addEventListener('input', (event) => updateHexField('description', event.target.value));
  colorInput.addEventListener('input', (event) => updateHexField('color', event.target.value));
  textColorInput.addEventListener('input', (event) => updateHexField('textColor', event.target.value));

  addLinkButton.addEventListener('click', addLink);
  linksContainer.addEventListener('input', handleLinkInput);
  linksContainer.addEventListener('click', handleLinkRemoval);
  exportButton.addEventListener('click', exportHtml);

  init();
})();
</script>

#wiki
