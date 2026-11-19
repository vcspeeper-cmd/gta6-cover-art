// Wires the page: photos in, caption and grade chosen, the poster drawn live, the PNG exported. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layout, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const fileInput = document.getElementById('photos');
const countLabel = document.getElementById('count');
const captionInput = document.getElementById('caption');
const gradesBox = document.getElementById('grades');
const sizesBox = document.getElementById('sizes');
const activeName = document.getElementById('activeName');
const statusLine = document.getElementById('status');

const state = { photos: [], caption: captionInput.value, grade: 'sunset', size: 'tall', active: 0 };

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function redraw() {
  drawCover(canvas, state);
  window.__coverState = state;
}

function chips(box, items, current, onPick) {
  box.replaceChildren(...items.map((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = item.label;
    b.setAttribute('aria-pressed', String(item.id === current));
    b.addEventListener('click', () => {
      onPick(item.id);
      for (const other of box.children) other.setAttribute('aria-pressed', String(other === b));
    });
    return b;
  }));
}

function syncCount() {
  const n = state.photos.length;
  countLabel.textContent = n === 0 ? 'No photos yet — pick one or several.' : `${n} photo${n === 1 ? '' : 's'} loaded.`;
  activeName.textContent = String(Math.max(0, Math.min(state.active, layout(canvas.width, canvas.height).length - 1)) + 1);
}

/** The panel under a pointer event, in canvas pixels, or -1. */
function panelAt(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  return layout(canvas.width, canvas.height).findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const index = panelAt(event);
  if (index >= 0) state.active = index;
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  syncCount();
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (drag === null) return;
  const photo = state.photos[state.active % Math.max(1, state.photos.length)];
  if (!photo) return;
  photo.ox = (photo.ox || 0) + (event.clientX - drag.x) / canvas.getBoundingClientRect().width;
  photo.oy = (photo.oy || 0) + (event.clientY - drag.y) / canvas.getBoundingClientRect().height;
  drag = { x: event.clientX, y: event.clientY };
  redraw();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (event) => {
  const photo = state.photos[state.active % Math.max(1, state.photos.length)];
  if (!photo) return;
  event.preventDefault();
  photo.zoom = Math.min(4, Math.max(1, (photo.zoom || 1) * (event.deltaY < 0 ? 1.08 : 0.926)));
  redraw();
}, { passive: false });

fileInput.addEventListener('change', async () => {
  const files = [...fileInput.files];
  for (const file of files) {
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, zoom: 1, ox: 0, oy: 0 });
  }
  syncCount();
  redraw();
  statusLine.textContent = files.length > 0 ? `Added ${files.length} photo${files.length === 1 ? '' : 's'}.` : '';
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
document.getElementById('reset').addEventListener('click', () => {
  for (const photo of state.photos) { photo.zoom = 1; photo.ox = 0; photo.oy = 0; }
  redraw();
  statusLine.textContent = 'Crop reset.';
});
document.getElementById('clear').addEventListener('click', () => {
  state.photos = [];
  fileInput.value = '';
  syncCount();
  redraw();
  statusLine.textContent = 'Photos cleared.';
});
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    statusLine.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

chips(gradesBox, GRADES, state.grade, (id) => { state.grade = id; redraw(); });
chips(sizesBox, SIZES, state.size, (id) => { state.size = id; syncCount(); redraw(); });

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, {
    load: loadImage,
    redraw: () => { captionInput.value = state.caption; syncCount(); redraw(); },
  });
} else {
  syncCount();
  redraw();
}
