// Fixed scenes for the screenshots: `?shot=editor` shows the page with sample photos loaded, `?shot=cover` shows the
// poster alone. `photos=` picks the samples (samples/<name>.jpg), `caption=`, `grade=` and `size=` the rest.
// window.__shotReady is set once the poster is painted, so the capture script can wait for it.
export async function runShot(shot, query, state, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.caption = query.get('caption') ?? 'Sunset Heist';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? 'tall';
  state.active = -1;
  const names = (query.get('photos') ?? 'pier').split(',').filter(Boolean);
  for (const name of names) {
    const img = await api.load(`samples/${name}.jpg`);
    state.photos.push({ img, zoom: 1, ox: 0, oy: 0 });
  }
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
