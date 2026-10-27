/* Image Compressor: re-encodes images on a canvas with the chosen quality, size and format. */
(function () {
  const { dropZone, formatBytes, download, baseName, vetFiles, say } = window.Tool;
  const $ = s => document.querySelector(s);

  const quality = $('#quality'), qualityOut = $('#qualityOut');
  const maxW = $('#maxW'), format = $('#format');
  const list = $('#list'), results = $('#results'), summary = $('#summary');

  const EXT = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
  let items = []; // { file, blob, name, row }

  quality.addEventListener('input', () => { qualityOut.textContent = quality.value; });
  // Re-run everything when settings change, so the preview sizes stay honest.
  [quality, maxW, format].forEach(el => el.addEventListener('change', () => recompressAll()));

  const msg = $('#msg');
  dropZone($('#drop'), async files => {
    const { ok, problems } = await vetFiles(files, { kinds: ['jpeg', 'png', 'webp'], maxMB: 40, maxCount: 100 - items.length });
    say(msg, problems.join(' '));
    ok.forEach(addFile);
  });

  $('#clearBtn').addEventListener('click', () => {
    list.querySelectorAll('img').forEach(i => URL.revokeObjectURL(i.src)); // free memory right away
    items = []; list.textContent = ''; results.hidden = true; say(msg, '');
  });
  $('#zipBtn').addEventListener('click', () => {
    const ready = items.filter(i => i.blob);
    if (!ready.length) return;
    if (ready.length === 1) return download(ready[0].blob, ready[0].name);
    Promise.all(ready.map(i => i.blob.arrayBuffer())).then(bufs => {
      const files = {};
      ready.forEach((it, n) => { files[uniqueName(files, it.name)] = [new Uint8Array(bufs[n]), { level: 0 }]; });
      const zipped = fflate.zipSync(files);
      download(new Blob([zipped], { type: 'application/zip' }), 'compressed-images.zip');
    });
  });

  function uniqueName(taken, name) {
    if (!taken[name]) return name;
    let i = 2; const b = baseName(name), ext = name.slice(b.length);
    while (taken[`${b}-${i}${ext}`]) i++;
    return `${b}-${i}${ext}`;
  }

  function addFile(file) {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `<img class="thumb" alt=""><div class="info"><div class="name"></div><div class="meta">Working…</div></div><button class="btn small" type="button" disabled>Download</button>`;
    li.querySelector('.name').textContent = file.name;
    li.querySelector('.thumb').src = URL.createObjectURL(file);
    list.appendChild(li);
    results.hidden = false;
    const item = { file, blob: null, name: '', row: li };
    li.querySelector('button').addEventListener('click', () => item.blob && download(item.blob, item.name));
    items.push(item);
    compress(item);
  }

  function recompressAll() { items.forEach(compress); }

  async function compress(item) {
    const meta = item.row.querySelector('.meta'), btn = item.row.querySelector('button');
    btn.disabled = true; meta.textContent = 'Working…';
    try {
      const bmp = await loadImage(item.file);
      let w = bmp.width, h = bmp.height;
      const limit = parseInt(maxW.value, 10);
      if (limit > 0 && w > limit) { h = Math.round(h * limit / w); w = limit; }

      const type = format.value === 'auto' ? item.file.type : format.value;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); } // JPG has no transparency
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp, 0, 0, w, h);

      let blob = await new Promise(r => canvas.toBlob(r, type, quality.value / 100));
      // Browsers without WebP encoding fall back to PNG; respect what we actually got.
      const outType = blob.type || type;
      let note = '';
      // If re-encoding made it bigger at the same size and format, keep the original.
      if (blob.size >= item.file.size && outType === item.file.type && w === bmp.width) {
        blob = item.file; note = ' · already optimised, kept original';
      }
      item.blob = blob;
      item.name = `${baseName(item.file.name)}-compressed.${EXT[blob.type] || EXT[outType] || 'img'}`;

      const saved = 1 - blob.size / item.file.size;
      const pct = document.createElement('span');
      pct.className = saved > 0 ? 'good' : 'warn';
      pct.textContent = saved > 0 ? `−${Math.round(saved * 100)}%` : `+${Math.round(-saved * 100)}%`;
      meta.textContent = `${formatBytes(item.file.size)} → ${formatBytes(blob.size)} `;
      meta.append(pct, ` · ${w}×${h}${note}`);
      btn.disabled = false;
    } catch (e) {
      meta.textContent = 'Could not read this image.'; meta.className = 'meta err';
    }
    updateSummary();
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function updateSummary() {
    const done = items.filter(i => i.blob);
    const before = done.reduce((s, i) => s + i.file.size, 0);
    const after = done.reduce((s, i) => s + i.blob.size, 0);
    summary.textContent = done.length
      ? `${done.length} image${done.length > 1 ? 's' : ''} · ${formatBytes(before)} → ${formatBytes(after)} (saved ${formatBytes(Math.max(0, before - after))})`
      : '';
  }
})();
