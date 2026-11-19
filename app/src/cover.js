// The poster renderer: a GTA-style multi-panel cover, drawn from the loaded photos, the caption, the colour grade and
// the export size. Everything here is original vector work (gradients, silhouettes, lettering) drawn with Canvas 2D;
// no game artwork, logo or font file is used anywhere.

/** The export sizes the app offers, in the order the picker lists them. */
export const SIZES = [
  { id: 'tall', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

/** The colour grades the app offers. */
export const GRADES = [
  { id: 'sunset', label: 'Vice sunset' },
  { id: 'neon', label: 'Neon split' },
  { id: 'noir', label: 'Night noir' },
];

/** A small deterministic PRNG so the grain and stars are identical on every redraw. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/**
 * The panel grid for a canvas of `w` x `h`: a hero panel, then either a strip of three under it (portrait and square)
 * or two stacked panels beside it and a strip of three under both (wide). Each panel is `{ x, y, w, h }` in pixels.
 */
export function layout(w, h) {
  const m = Math.round(w * 0.035);
  const gap = Math.round(w * 0.016);
  const inner = w - m * 2;
  const bandH = Math.round(h * 0.145);
  const room = h - m - bandH - gap * 2;
  const cw = Math.round((inner - gap * 2) / 3);
  if (h >= w * 0.9) {
    const heroH = Math.round(room * 0.46);
    const rowH = Math.round((room - heroH) / 2);
    const row1 = m + heroH + gap;
    const row2 = row1 + rowH + gap;
    return [
      { x: m, y: m, w: inner, h: heroH },
      { x: m, y: row1, w: cw, h: rowH },
      { x: m + cw + gap, y: row1, w: cw, h: rowH },
      { x: m + (cw + gap) * 2, y: row1, w: cw, h: rowH },
      { x: m, y: row2, w: cw, h: rowH },
      { x: m + cw + gap, y: row2, w: cw, h: rowH },
      { x: m + (cw + gap) * 2, y: row2, w: cw, h: rowH },
    ];
  }
  const heroW = Math.round(inner * 0.46);
  const heroH = Math.round(room * 0.62);
  const sideX = m + heroW + gap;
  const sideW = inner - heroW - gap;
  const sideH = Math.round((heroH - gap) / 2);
  const stripY = m + heroH + gap;
  const stripH = room - heroH;
  return [
    { x: m, y: m, w: heroW, h: heroH },
    { x: sideX, y: m, w: sideW, h: sideH },
    { x: sideX, y: m + sideH + gap, w: sideW, h: sideH },
    { x: m, y: stripY, w: cw, h: stripH },
    { x: m + cw + gap, y: stripY, w: cw, h: stripH },
    { x: m + (cw + gap) * 2, y: stripY, w: cw, h: stripH },
  ];
}

/** The sunset sky, sun, skyline, palms and water, filling the whole canvas. */
function drawBackdrop(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (grade === 'noir') {
    sky.addColorStop(0, '#0a0d1c');
    sky.addColorStop(0.55, '#232a44');
    sky.addColorStop(1, '#3a1c40');
  } else if (grade === 'neon') {
    sky.addColorStop(0, '#0a0620');
    sky.addColorStop(0.45, '#3b1070');
    sky.addColorStop(0.75, '#c22a7a');
    sky.addColorStop(1, '#2a0a3a');
  } else {
    sky.addColorStop(0, '#160a2b');
    sky.addColorStop(0.42, '#5b1a63');
    sky.addColorStop(0.68, '#c93f5c');
    sky.addColorStop(0.86, '#f08a4b');
    sky.addColorStop(1, '#3a1030');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const horizon = Math.round(h * 0.62);
  const sunX = w * 0.5;
  const sunY = horizon - h * 0.05;
  const sunR = Math.min(w, h) * 0.17;

  // The sun, with the horizontal slices a synthwave sunset is drawn with.
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  if (grade === 'noir') {
    sunGrad.addColorStop(0, 'rgba(200,210,235,0.85)');
    sunGrad.addColorStop(1, 'rgba(120,140,190,0.25)');
  } else if (grade === 'neon') {
    sunGrad.addColorStop(0, 'rgba(120,240,255,0.95)');
    sunGrad.addColorStop(0.55, 'rgba(255,90,200,0.9)');
    sunGrad.addColorStop(1, 'rgba(255,190,90,0.75)');
  } else {
    sunGrad.addColorStop(0, 'rgba(255,236,150,0.98)');
    sunGrad.addColorStop(0.5, 'rgba(255,150,90,0.95)');
    sunGrad.addColorStop(1, 'rgba(255,70,130,0.85)');
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i += 1) {
    const y = sunY + sunR * (0.05 + i * 0.14);
    ctx.fillRect(sunX - sunR, y, sunR * 2, sunR * (0.02 + i * 0.012));
  }
  ctx.restore();

  // A skyline of plain rectangles, tallest toward the middle.
  const rand = rng(0x51ce);
  ctx.fillStyle = grade === 'noir' ? 'rgba(6,8,16,0.95)' : 'rgba(14,6,26,0.92)';
  let x = 0;
  while (x < w) {
    const bw = w * (0.018 + rand() * 0.035);
    const bh = h * (0.03 + rand() * 0.11) * (1 - Math.abs(x / w - 0.5) * 0.9);
    ctx.fillRect(x, horizon - bh, bw * 0.94, bh + 2);
    x += bw;
  }
  ctx.fillRect(0, horizon, w, h - horizon);

  // Palms: a curved trunk and fronds, mirrored at both edges.
  const palm = (baseX, scale, flip) => {
    ctx.save();
    ctx.translate(baseX, horizon + h * 0.01);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.strokeStyle = 'rgba(8,4,16,0.96)';
    ctx.lineCap = 'round';
    ctx.lineWidth = h * 0.011;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w * 0.012, -h * 0.09, w * 0.03, -h * 0.17);
    ctx.stroke();
    for (let i = 0; i < 7; i += 1) {
      const a = -Math.PI * 0.92 + (i / 6) * Math.PI * 0.84;
      ctx.lineWidth = h * 0.007;
      ctx.beginPath();
      ctx.moveTo(w * 0.03, -h * 0.17);
      ctx.quadraticCurveTo(
        w * 0.03 + Math.cos(a) * w * 0.05,
        -h * 0.17 + Math.sin(a) * h * 0.05,
        w * 0.03 + Math.cos(a) * w * 0.085,
        -h * 0.17 + Math.sin(a) * h * 0.075 + h * 0.02,
      );
      ctx.stroke();
    }
    ctx.restore();
  };
  palm(w * 0.02, Math.min(w, h) / 1080, false);
  palm(w * 0.98, Math.min(w, h) / 1080, true);

  // Water: horizontal bands, brighter near the horizon.
  for (let i = 0; i < 26; i += 1) {
    const y = horizon + (h - horizon) * (i / 26) ** 1.4;
    const alpha = 0.22 * (1 - i / 26);
    ctx.fillStyle = grade === 'noir' ? `rgba(120,150,210,${alpha * 0.6})` : `rgba(255,170,120,${alpha})`;
    ctx.fillRect(0, y, w, Math.max(1, h * 0.003));
  }

  // Stars in the upper sky.
  const stars = rng(0x9a17);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 90; i += 1) {
    const sx = stars() * w;
    const sy = stars() * h * 0.4;
    const sr = Math.max(0.6, stars() * 1.8 * (Math.min(w, h) / 1080));
    ctx.fillRect(sx, sy, sr, sr);
  }
}

/** The colour grade over one panel's photo. */
function gradePanel(ctx, r, grade) {
  ctx.save();
  if (grade === 'neon') {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, 'rgba(0,220,255,0.42)');
    g.addColorStop(1, 'rgba(255,0,160,0.42)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(60,0,90,0.35)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(128,128,128,1)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(40,60,140,0.22)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, 'rgba(60,80,150,0.35)');
    g.addColorStop(1, 'rgba(24,24,60,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else {
    ctx.globalCompositeOperation = 'overlay';
    const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    g.addColorStop(0, 'rgba(120,60,255,0.30)');
    g.addColorStop(0.5, 'rgba(255,90,150,0.22)');
    g.addColorStop(1, 'rgba(255,170,60,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(
    r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.2,
    r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

/** One panel: the photo cropped and panned inside it, the grade, and the white frame. */
function drawPanel(ctx, r, photo, grade, active) {
  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, r.w * 0.014);
  ctx.clip();
  ctx.fillStyle = '#0a0518';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (photo && photo.img) {
    const img = photo.img;
    const cover = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * (photo.zoom || 1);
    const dw = img.naturalWidth * cover;
    const dh = img.naturalHeight * cover;
    const dx = r.x + (r.w - dw) / 2 + (photo.ox || 0) * r.w;
    const dy = r.y + (r.h - dh) / 2 + (photo.oy || 0) * r.h;
    ctx.drawImage(img, dx, dy, dw, dh);
    gradePanel(ctx, r, grade);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = `700 ${Math.round(r.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', r.x + r.w / 2, r.y + r.h / 2);
  }
  ctx.restore();
  ctx.save();
  roundRect(ctx, r.x, r.y, r.w, r.h, r.w * 0.014);
  ctx.strokeStyle = active ? 'rgba(120,240,255,0.95)' : 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, r.w * 0.005);
  ctx.stroke();
  ctx.restore();
}

/** The title band: a rule, a small tagline, the caption fitted to the width, and an original badge. */
function drawTitle(ctx, w, h, caption, grade) {
  const bandH = Math.round(h * 0.145);
  const bandY = h - bandH;
  const g = ctx.createLinearGradient(0, bandY, 0, h);
  g.addColorStop(0, 'rgba(6,3,14,0.0)');
  g.addColorStop(0.22, 'rgba(6,3,14,0.78)');
  g.addColorStop(1, 'rgba(6,3,14,0.96)');
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY, w, bandH);

  const accent = grade === 'neon' ? '#5ef0ff' : grade === 'noir' ? '#9fb6ff' : '#ffb24a';
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.035, bandY + bandH * 0.12, w * 0.93, Math.max(2, h * 0.0032));

  const text = (caption || '').trim().toUpperCase();
  const badge = Math.round(bandH * 0.42);
  const maxW = w * 0.72;
  let size = Math.round(bandH * 0.4);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const font = (px) => `900 ${px}px system-ui, "Segoe UI", Roboto, sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxW && size > 12) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.66)';
  ctx.font = `700 ${Math.round(bandH * 0.11)}px system-ui, sans-serif`;
  ctx.fillText('A VICE CITY STORY', w * 0.035, bandY + bandH * 0.33);

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.32;
  ctx.fillStyle = '#ffffff';
  ctx.font = font(size);
  ctx.fillText(text, w * 0.035, bandY + bandH * 0.83);
  ctx.restore();

  const bx = w - w * 0.035 - badge;
  const by = bandY + bandH * 0.5 - badge / 2;
  roundRect(ctx, bx, by, badge, badge, badge * 0.22);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = '#0b0518';
  ctx.font = `900 ${Math.round(badge * 0.54)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VI', bx + badge / 2, by + badge / 2 + badge * 0.03);
}

/**
 * Draws the whole cover. `state` is `{ photos, caption, grade, size, active }`: `photos` is the list of
 * `{ img, zoom, ox, oy }` the user loaded, `active` the panel being edited.
 */
export function drawCover(canvas, state) {
  const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = state.grade || 'sunset';
  drawBackdrop(ctx, w, h, grade);
  const panels = layout(w, h);
  const photos = state.photos || [];
  panels.forEach((r, i) => {
    const photo = photos.length === 0 ? null : photos[i % photos.length];
    drawPanel(ctx, r, photo, grade, state.active >= 0 && i === state.active);
  });
  drawTitle(ctx, w, h, state.caption, grade);
  // A light film grain over everything, so the flat vector fills read as print.
  const rand = rng(0x2f1b);
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < Math.round((w * h) / 2600); i += 1) {
    const gx = rand() * w;
    const gy = rand() * h;
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(gx, gy, 1.2, 1.2);
  }
  ctx.restore();
}
