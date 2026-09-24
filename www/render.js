'use strict';
/* علّوش الرافدين v1.0.2 — render.js : الرسم (كل الرسومات برمجية بدون صور خارجية) */
const cv = document.getElementById('c');
let cx = cv.getContext('2d', {alpha: false});
const mainCx = cx, mainCanvas = cv;
let VW = 640, VH = 360, dprMax = 2, lowFx = false, tG = 0;
const cam = {x: 0, y: 0, shake: 0};
const parts = [];
const trail = [];
const STEP_PX = Engine.STEP;

function resize() {
  const w = innerWidth || 640, h = innerHeight || 360;
  const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
  cv.width = Math.max(2, Math.round(w * dpr));
  cv.height = Math.max(2, Math.round(h * dpr));
}
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function rr(x, y, w, h, r) {
  cx.beginPath(); cx.moveTo(x + r, y); cx.lineTo(x + w - r, y); cx.quadraticCurveTo(x + w, y, x + w, y + r);
  cx.lineTo(x + w, y + h - r); cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); cx.lineTo(x + r, y + h);
  cx.quadraticCurveTo(x, y + h, x, y + h - r); cx.lineTo(x, y + r); cx.quadraticCurveTo(x, y, x + r, y); cx.closePath();
}
function txt(s, x, y, size, color, align, shadow) {
  cx.font = '800 ' + size + 'px "Noto Kufi Arabic","Droid Arabic Kufi","Segoe UI",Tahoma,sans-serif';
  cx.textAlign = align || 'left'; cx.textBaseline = 'middle';
  if (shadow !== false) { cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillText(s, x + 1.5, y + 1.5); }
  cx.fillStyle = color || '#fff'; cx.fillText(s, x, y);
}

/* ---------- السماء والخلفيات ---------- */
function drawSky(th, camX, camY) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, th.sky[0]); g.addColorStop(.55, th.sky[1]); g.addColorStop(1, th.sky[2]);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  if (th.night) {
    cx.fillStyle = '#fff';
    for (let i = 0; i < (lowFx ? 20 : 46); i++) {
      let x = (hash(i) * VW * 1.4 - camX * .02 * (1 + hash(i + 9))) % VW; if (x < 0) x += VW;
      cx.globalAlpha = .35 + .65 * Math.abs(Math.sin(tG * 1.3 + i));
      cx.fillRect(x, hash(i + 50) * VH * .5, 1.7, 1.7);
    }
    cx.globalAlpha = 1;
  }
  const sx = VW * .74 - camX * .015, sy = 72 - camY * .06, r = th.night ? 24 : 36;
  if (!lowFx) {
    const rg = cx.createRadialGradient(sx, sy, r * .3, sx, sy, r * 3);
    rg.addColorStop(0, th.night ? 'rgba(255,245,220,.45)' : 'rgba(255,236,170,.75)'); rg.addColorStop(1, 'rgba(255,236,170,0)');
    cx.fillStyle = rg; cx.fillRect(sx - r * 3, sy - r * 3, r * 6, r * 6);
  }
  cx.fillStyle = th.night ? '#f4efe0' : '#fff4cf'; cx.beginPath(); cx.arc(sx, sy, r, 0, 7); cx.fill();
}
function farLayer(type, col, par, base, camX, camY, night) {
  const off = camX * par, yb = base - camY * par * .4;
  cx.fillStyle = col;
  if (type === 'city') {
    const bw = 36, i0 = Math.floor(off / bw);
    for (let i = i0; i <= i0 + Math.ceil(VW / bw) + 1; i++) {
      const h = 26 + hash(i) * 64, x = i * bw - off;
      cx.fillRect(x, yb - h, bw + 1, h + 400);
      if (hash(i + 99) > .72) { cx.beginPath(); cx.arc(x + bw / 2, yb - h, bw * .42, Math.PI, 0); cx.fill(); cx.fillRect(x + bw / 2 - 1, yb - h - bw * .42 - 10, 2, 10); }
    }
    if (night && !lowFx) {
      cx.fillStyle = 'rgba(255,205,110,.6)';
      for (let i = i0; i <= i0 + Math.ceil(VW / bw) + 1; i++) {
        const h = 26 + hash(i) * 64, x = i * bw - off;
        for (let k = 0; k < 3; k++) if (hash(i * 7 + k) > .45) cx.fillRect(x + 6 + (k % 2) * 14, yb - h + 10 + k * 14, 5, 6);
      }
    }
    return;
  }
  cx.beginPath(); cx.moveTo(-10, VH + 10);
  for (let x = -10; x <= VW + 20; x += 12) {
    const wx = x + off; let h;
    if (type === 'dunes') h = 46 + 22 * Math.sin(wx * .006) + 12 * Math.sin(wx * .013 + 1);
    else if (type === 'mountain') h = 84 + 52 * Math.abs(Math.sin(wx * .0045)) + 22 * Math.sin(wx * .012 + 2);
    else h = 26 + 9 * Math.sin(wx * .02) + hash(Math.floor(wx / 12)) * 10;
    cx.lineTo(x, yb - h);
  }
  cx.lineTo(VW + 20, VH + 10); cx.closePath(); cx.fill();
}
function shape(t, x, b, s, c, c2) {
  cx.fillStyle = c;
  switch (t) {
    case 'ziggurat': {
      const h = 30 * s;
      for (let i = 0; i < 4; i++) { const w = (230 - i * 52) * s; cx.fillRect(x - w / 2, b - (i + 1) * h, w, h + 1); }
      cx.fillStyle = c2; cx.fillRect(x - 12 * s, b - 4 * h - 24 * s, 24 * s, 24 * s);
      for (let i = 0; i < 3; i++) cx.fillRect(x - 4 * s, b - (i + 1) * h, 8 * s, h);
      break;
    }
    case 'dome': {
      cx.fillRect(x - 64 * s, b - 70 * s, 128 * s, 70 * s);
      cx.beginPath(); cx.arc(x, b - 70 * s, 46 * s, Math.PI, 0); cx.fill();
      cx.fillRect(x - 2 * s, b - 132 * s, 4 * s, 18 * s);
      cx.fillRect(x + 88 * s, b - 170 * s, 14 * s, 170 * s);
      cx.beginPath(); cx.moveTo(x + 84 * s, b - 170 * s); cx.lineTo(x + 95 * s, b - 198 * s); cx.lineTo(x + 106 * s, b - 170 * s); cx.fill();
      cx.fillRect(x + 82 * s, b - 130 * s, 26 * s, 6 * s);
      cx.fillStyle = c2;
      for (let i = -1; i <= 1; i++) { cx.beginPath(); cx.arc(x + i * 34 * s, b - 32 * s, 9 * s, Math.PI, 0); cx.fill(); cx.fillRect(x + i * 34 * s - 9 * s, b - 32 * s, 18 * s, 32 * s); }
      break;
    }
    case 'spiral': {
      const h = 34 * s;
      for (let i = 0; i < 5; i++) { const w = (96 - i * 16) * s; cx.fillRect(x - w / 2, b - 16 * s - (i + 1) * h, w, h + 1); }
      cx.fillStyle = c2; cx.fillRect(x - 120 * s, b - 16 * s, 240 * s, 16 * s);
      for (let i = 0; i < 5; i++) { const w = (96 - i * 16) * s; cx.fillRect(x - w / 2 - 4 * s, b - 16 * s - (i + 1) * h, w + 8 * s, 4 * s); }
      cx.beginPath(); cx.arc(x, b - 16 * s - 5 * h, 8 * s, Math.PI, 0); cx.fill();
      break;
    }
    case 'palm': {
      cx.strokeStyle = c; cx.lineWidth = 7 * s; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(x, b); cx.quadraticCurveTo(x + 14 * s, b - 70 * s, x + 6 * s, b - 130 * s); cx.stroke();
      cx.strokeStyle = c2 || c; cx.lineWidth = 5 * s;
      for (let k = -3; k <= 3; k++) {
        cx.beginPath(); cx.moveTo(x + 6 * s, b - 130 * s);
        cx.quadraticCurveTo(x + 6 * s + k * 12 * s, b - 162 * s, x + 6 * s + k * 26 * s, b - 118 * s + Math.abs(k) * 14 * s); cx.stroke();
      }
      break;
    }
    case 'hut': {
      cx.beginPath(); cx.ellipse(x, b, 90 * s, 64 * s, 0, Math.PI, 0); cx.fill();
      cx.strokeStyle = c2; cx.lineWidth = 3 * s;
      for (let i = -2; i <= 2; i++) { const px = x + i * 30 * s, hh = 64 * s * Math.sqrt(1 - Math.pow(i * 30 / 90, 2)); cx.beginPath(); cx.moveTo(px, b); cx.lineTo(px, b - hh); cx.stroke(); }
      cx.fillStyle = c2; cx.beginPath(); cx.ellipse(x, b, 26 * s, 40 * s, 0, Math.PI, 0); cx.fill();
      cx.strokeStyle = c; cx.lineWidth = 2 * s;
      for (let j = 0; j < 8; j++) { const px = x - 130 * s + j * 18 * s; cx.beginPath(); cx.moveTo(px, b); cx.lineTo(px + 4 * s, b - (26 + hash(j) * 22) * s); cx.stroke(); }
      break;
    }
    case 'citadel': {
      cx.beginPath(); cx.moveTo(x - 170 * s, b); cx.lineTo(x - 110 * s, b - 70 * s); cx.lineTo(x + 110 * s, b - 70 * s); cx.lineTo(x + 170 * s, b); cx.closePath(); cx.fill();
      cx.fillRect(x - 100 * s, b - 116 * s, 200 * s, 48 * s);
      for (let i = 0; i < 9; i++) cx.fillRect(x - 100 * s + i * 25 * s, b - 128 * s, 14 * s, 14 * s);
      cx.fillStyle = c2; cx.beginPath(); cx.arc(x, b - 70 * s, 18 * s, Math.PI, 0); cx.fill(); cx.fillRect(x - 18 * s, b - 70 * s, 36 * s, 4 * s);
      break;
    }
    case 'arches': {
      cx.fillRect(x - 120 * s, b - 96 * s, 240 * s, 96 * s); cx.fillRect(x - 128 * s, b - 106 * s, 256 * s, 10 * s);
      cx.fillStyle = c2;
      for (let i = -1; i <= 1; i++) { cx.beginPath(); cx.arc(x + i * 70 * s, b - 52 * s, 22 * s, Math.PI, 0); cx.fill(); cx.fillRect(x + i * 70 * s - 22 * s, b - 52 * s, 44 * s, 52 * s); }
      break;
    }
    case 'mountain': {
      cx.beginPath(); cx.moveTo(x - 180 * s, b); cx.lineTo(x - 40 * s, b - 150 * s); cx.lineTo(x + 20 * s, b - 100 * s); cx.lineTo(x + 100 * s, b - 190 * s); cx.lineTo(x + 240 * s, b); cx.closePath(); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.88)';
      cx.beginPath(); cx.moveTo(x - 40 * s, b - 150 * s); cx.lineTo(x - 66 * s, b - 116 * s); cx.lineTo(x - 48 * s, b - 122 * s); cx.lineTo(x - 36 * s, b - 108 * s); cx.lineTo(x - 18 * s, b - 122 * s); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(x + 100 * s, b - 190 * s); cx.lineTo(x + 70 * s, b - 146 * s); cx.lineTo(x + 90 * s, b - 152 * s); cx.lineTo(x + 104 * s, b - 136 * s); cx.lineTo(x + 122 * s, b - 152 * s); cx.closePath(); cx.fill();
      break;
    }
    case 'lean': {
      cx.save(); cx.translate(x, b); cx.rotate(-.06);
      cx.fillRect(-17 * s, -200 * s, 34 * s, 200 * s);
      cx.fillStyle = c2; for (let i = 0; i < 8; i++) cx.fillRect(-17 * s, -i * 24 * s - 6 * s, 34 * s, 4 * s);
      cx.fillRect(-24 * s, -150 * s, 48 * s, 8 * s);
      cx.fillStyle = c; cx.beginPath(); cx.arc(0, -200 * s, 17 * s, Math.PI, 0); cx.fill(); cx.fillRect(-1.5 * s, -232 * s, 3 * s, 16 * s);
      cx.restore();
      cx.fillRect(x - 130 * s, b - 50 * s, 80 * s, 50 * s); cx.beginPath(); cx.arc(x - 90 * s, b - 50 * s, 30 * s, Math.PI, 0); cx.fill();
      break;
    }
  }
}
function landLayer(th, camX, camY) {
  const par = .32, spacing = 560, off = camX * par, i0 = Math.floor((off - 300) / spacing), base = 272 - camY * .12;
  for (let i = i0; i <= i0 + Math.ceil((VW + 600) / spacing) + 1; i++) {
    if (hash(i + 31) < .18) continue;
    shape(th.land, i * spacing - off + hash(i) * 120, base, .8 + hash(i + 7) * .5, th.mid, th.far);
  }
}

/* ---------- الأرض ---------- */
function topPath(L, i, j, camX, camY) {
  cx.beginPath(); cx.moveTo(i * STEP_PX - camX, L.hy[i] - camY);
  for (let k = i + 1; k < j; k++) cx.lineTo(k * STEP_PX - camX, L.hy[k] - camY);
}
function drawGround(th, L, camX, camY) {
  const i0 = Math.max(0, Math.floor(camX / STEP_PX) - 1), i1 = Math.min(L.hy.length - 1, Math.ceil((camX + VW) / STEP_PX) + 1);
  const gr = cx.createLinearGradient(0, 100, 0, VH + 40);
  gr.addColorStop(0, th.body); gr.addColorStop(1, th.dark);
  let i = i0;
  while (i <= i1) {
    if (L.hy[i] === Infinity) {
      let j = i; while (j <= i1 && L.hy[j] === Infinity) j++;
      const yl = i > 0 ? L.hy[i - 1] : 0, yr = j < L.hy.length ? L.hy[j] : 0;
      const ty = Math.max(yl < Infinity ? yl : 0, yr < Infinity ? yr : 0);
      if (ty > 0) {
        const a = (i - 1) * STEP_PX - camX, b = j * STEP_PX - camX, top = ty - camY;
        const ag = cx.createLinearGradient(0, top, 0, VH + 60); ag.addColorStop(0, '#1a0c06'); ag.addColorStop(1, '#050201');
        cx.fillStyle = ag; cx.fillRect(a, top, b - a, VH + 80 - top);
      }
      i = j; continue;
    }
    let j = i; while (j <= i1 && L.hy[j] < Infinity) j++;
    if (j - i >= 2) {
      topPath(L, i, j, camX, camY);
      cx.lineTo((j - 1) * STEP_PX - camX, VH + 60); cx.lineTo(i * STEP_PX - camX, VH + 60); cx.closePath();
      cx.fillStyle = gr; cx.fill();
      if (!lowFx) {
        cx.fillStyle = 'rgba(0,0,0,.15)';
        for (let k = i; k < j; k += 5) cx.fillRect(k * STEP_PX - camX, L.hy[k] + 18 + hash(k) * 70 - camY, 18 + hash(k + 3) * 16, 5);
      }
      topPath(L, i, j, camX, camY);
      cx.lineJoin = 'round'; cx.lineCap = 'butt';
      cx.lineWidth = 10; cx.strokeStyle = th.top; cx.stroke();
      cx.lineWidth = 3; cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.translate(0, -2); cx.stroke(); cx.translate(0, 2);
    }
    i = j;
  }
}

/* ---------- زينة الأرض ---------- */
function drawDecor(d, sx, sy, th) {
  const s = d.s;
  switch (d.t) {
    case 'palm': shape('palm', sx, sy, s * .5, '#6b4423', '#2f7d3f'); break;
    case 'pot':
      cx.fillStyle = '#b5652e'; cx.beginPath(); cx.ellipse(sx, sy - 12 * s, 11 * s, 13 * s, 0, 0, 7); cx.fill();
      cx.fillRect(sx - 5 * s, sy - 30 * s, 10 * s, 8 * s); cx.fillStyle = 'rgba(255,255,255,.2)'; cx.fillRect(sx - 7 * s, sy - 18 * s, 3 * s, 10 * s); break;
    case 'banner':
      cx.fillStyle = '#4a3020'; cx.fillRect(sx - 1.5, sy - 62 * s, 3, 62 * s);
      cx.fillStyle = '#ce1126'; cx.fillRect(sx + 1.5, sy - 62 * s, 26 * s, 6 * s);
      cx.fillStyle = '#fff'; cx.fillRect(sx + 1.5, sy - 56 * s, 26 * s, 6 * s);
      cx.fillStyle = '#111'; cx.fillRect(sx + 1.5, sy - 50 * s, 26 * s, 6 * s); break;
    case 'rock':
      cx.fillStyle = th.dark; cx.beginPath(); cx.ellipse(sx, sy - 6 * s, 15 * s, 9 * s, 0, Math.PI, 0); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.14)'; cx.fillRect(sx - 8 * s, sy - 12 * s, 8 * s, 3); break;
    case 'reed':
      cx.strokeStyle = '#4c8a3a'; cx.lineWidth = 2.4; cx.lineCap = 'round';
      for (let k = -3; k <= 3; k++) { cx.beginPath(); cx.moveTo(sx + k * 3, sy); cx.quadraticCurveTo(sx + k * 4, sy - 30 * s, sx + k * 8 + Math.sin(tG + k) * 3, sy - (44 + hash(k + d.x) * 20) * s); cx.stroke(); } break;
    case 'lantern':
      cx.fillStyle = '#3a2618'; cx.fillRect(sx - 1.5, sy - 56 * s, 3, 56 * s);
      cx.fillStyle = 'rgba(255,200,90,.28)'; cx.beginPath(); cx.arc(sx, sy - 60 * s, 18 * s, 0, 7); cx.fill();
      cx.fillStyle = '#ffd66b'; cx.beginPath(); cx.arc(sx, sy - 60 * s, 6 * s, 0, 7); cx.fill(); break;
    case 'column':
      cx.fillStyle = '#d8c39a'; cx.fillRect(sx - 7 * s, sy - 46 * s, 14 * s, 46 * s); cx.fillRect(sx - 11 * s, sy - 52 * s, 22 * s, 7 * s);
      cx.fillStyle = 'rgba(0,0,0,.15)'; cx.fillRect(sx + 2 * s, sy - 46 * s, 5 * s, 46 * s); break;
    case 'pine':
      cx.fillStyle = '#4a3020'; cx.fillRect(sx - 2, sy - 12, 4, 12);
      for (let k = 0; k < 3; k++) { cx.fillStyle = '#1f5a3a'; cx.beginPath(); cx.moveTo(sx - (22 - k * 5) * s, sy - 10 * s - k * 18 * s); cx.lineTo(sx, sy - 40 * s - k * 18 * s); cx.lineTo(sx + (22 - k * 5) * s, sy - 10 * s - k * 18 * s); cx.fill(); }
      break;
  }
}

/* ---------- عناصر اللعب ---------- */
function drawCoin(x, y, t, i) {
  const w = Math.abs(Math.cos(t * .08 + i * .7)) * 6.5 + 1.6;
  cx.fillStyle = '#a56d0a'; cx.beginPath(); cx.ellipse(x, y, w + 1.3, 9.6, 0, 0, 7); cx.fill();
  cx.fillStyle = '#ffd23f'; cx.beginPath(); cx.ellipse(x, y, w, 8.4, 0, 0, 7); cx.fill();
  cx.fillStyle = '#fff3b0'; cx.fillRect(x - w * .4, y - 4.5, Math.max(1, w * .3), 9);
}
function drawFlag(sx, sy, on, t) {
  cx.fillStyle = '#3a2618'; cx.fillRect(sx - 2, sy - 64, 4, 64);
  cx.fillStyle = '#e0b040'; cx.beginPath(); cx.arc(sx, sy - 65, 4, 0, 7); cx.fill();
  const yy = on ? sy - 62 : sy - 22, w = on ? Math.sin(t * .15) * 2 : 0;
  cx.globalAlpha = on ? 1 : .55;
  cx.fillStyle = '#ce1126'; cx.fillRect(sx + 2, yy, 30 + w, 7);
  cx.fillStyle = '#fff'; cx.fillRect(sx + 2, yy + 7, 30 + w, 7);
  cx.fillStyle = '#111'; cx.fillRect(sx + 2, yy + 14, 30 + w, 7);
  cx.fillStyle = '#0a8a48'; cx.fillRect(sx + 12, yy + 9, 10, 3);
  cx.globalAlpha = 1;
}
function drawGate(sx, sy, open, t) {
  const blue = '#1d57b8', gold = '#f3b93a';
  cx.fillStyle = blue; cx.fillRect(sx - 64, sy - 150, 34, 150); cx.fillRect(sx + 30, sy - 150, 34, 150);
  cx.beginPath(); cx.arc(sx, sy - 118, 64, Math.PI, 0); cx.fill(); cx.fillRect(sx - 64, sy - 122, 128, 22);
  cx.fillStyle = '#0d0604'; cx.beginPath(); cx.arc(sx, sy - 84, 30, Math.PI, 0); cx.fill(); cx.fillRect(sx - 30, sy - 84, 60, 84);
  cx.fillStyle = gold;
  for (let k = 0; k < 6; k++) { cx.fillRect(sx - 64, sy - 24 - k * 24, 34, 4); cx.fillRect(sx + 30, sy - 24 - k * 24, 34, 4); }
  for (let k = 0; k < 9; k++) { const a = Math.PI + (k + .5) * Math.PI / 9; cx.fillRect(sx + Math.cos(a) * 48 - 3, sy - 118 + Math.sin(a) * 48 - 3, 6, 6); }
  cx.fillStyle = open ? 'rgba(255,223,138,.35)' : 'rgba(200,16,46,.55)';
  cx.fillRect(sx - 30, sy - 84, 60, 84);
  cx.fillStyle = gold; cx.fillRect(sx - 64, sy - 154, 34, 5); cx.fillRect(sx + 30, sy - 154, 34, 5);
}
function drawSpike(s, camX, camY) {
  const n = Math.round(s.w / 11), x0 = s.x - camX, y = s.y - camY;
  for (let i = 0; i < n; i++) {
    cx.fillStyle = '#9aa0a8'; cx.beginPath(); cx.moveTo(x0 + i * 11, y); cx.lineTo(x0 + i * 11 + 5.5, y - 17); cx.lineTo(x0 + i * 11 + 11, y); cx.fill();
    cx.fillStyle = '#d6dae0'; cx.beginPath(); cx.moveTo(x0 + i * 11 + 5.5, y - 17); cx.lineTo(x0 + i * 11 + 11, y); cx.lineTo(x0 + i * 11 + 5.5, y); cx.fill();
  }
}
function drawSpring(s, camX, camY) {
  const x = s.x - camX, y = s.y - camY, h = 14 - (s.anim > 0 ? 0 : 0) + (s.anim > 0 ? 8 : 0);
  cx.fillStyle = '#555'; cx.fillRect(x - 15, y - 5, 30, 5);
  cx.strokeStyle = '#d8d8d8'; cx.lineWidth = 3;
  for (let k = 0; k < 3; k++) { cx.beginPath(); cx.moveTo(x - 10, y - 5 - k * h / 3); cx.lineTo(x + 10, y - 5 - (k + .5) * h / 3); cx.stroke(); }
  cx.fillStyle = '#c8102e'; cx.fillRect(x - 15, y - 5 - h - 3, 30, 5);
}
function drawPad(pd, camX, camY, t) {
  const x = pd.x - camX, y = pd.y - camY;
  cx.fillStyle = '#20242c'; cx.fillRect(x - 22, y - 4, 44, 4);
  cx.fillStyle = '#ffd23f';
  for (let k = 0; k < 3; k++) { const o = ((t * .12 + k * 8) % 24) - 12; cx.beginPath(); cx.moveTo(x + o - 4, y - 10); cx.lineTo(x + o + 3, y - 4.5); cx.lineTo(x + o - 4, y - 0); cx.closePath(); cx.fill(); }
}
function drawPlat(pl, camX, camY, th) {
  const x = pl.x - camX, y = pl.y - camY;
  cx.fillStyle = th.dark; cx.fillRect(x, y + 4, pl.w, pl.h - 2);
  cx.fillStyle = th.body; cx.fillRect(x, y + 3, pl.w, pl.h - 6);
  cx.fillStyle = th.top; cx.fillRect(x - 2, y, pl.w + 4, 6);
  cx.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 1; k < 4; k++) cx.fillRect(x + k * pl.w / 4, y + 6, 2, pl.h - 8);
  if (pl.mx || pl.my) { cx.fillStyle = '#ffd23f'; cx.fillRect(x + pl.w / 2 - 6, y + 8, 12, 3); }
}
function drawScorpion(x, y, dir, t, spiky, s, pal) {
  cx.save(); cx.translate(x, y); cx.scale(dir * s, s);
  const c1 = pal ? pal[0] : spiky ? '#5a2a86' : '#8f2a12', c2 = pal ? pal[1] : spiky ? '#8b4fc4' : '#c4501f';
  cx.strokeStyle = '#2b0d05'; cx.lineWidth = 2; cx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const ph = Math.sin(t * .25 + i * 2); cx.beginPath(); cx.moveTo(-6 + i * 6, -8); cx.lineTo(-9 + i * 6 + ph * 3, -1); cx.stroke(); }
  cx.fillStyle = c1; cx.beginPath(); cx.ellipse(0, -10, 13, 8, 0, 0, 7); cx.fill();
  cx.fillStyle = c2; cx.beginPath(); cx.ellipse(2, -12, 8, 4, 0, 0, 7); cx.fill();
  cx.strokeStyle = c1; cx.lineWidth = 5;
  cx.beginPath(); cx.moveTo(-10, -10); cx.quadraticCurveTo(-24, -14, -18, -28); cx.quadraticCurveTo(-14, -34, -6, -32); cx.stroke();
  cx.fillStyle = '#ffdf7a'; cx.beginPath(); cx.moveTo(-6, -32); cx.lineTo(-1, -29); cx.lineTo(-6, -37); cx.fill();
  cx.strokeStyle = c1; cx.lineWidth = 3.5; cx.beginPath(); cx.moveTo(10, -10); cx.lineTo(18, -14); cx.stroke();
  cx.fillStyle = c1; cx.beginPath(); cx.arc(20, -15, 4.4, 0, 7); cx.fill();
  cx.fillStyle = '#fff'; cx.fillRect(9, -15, 3.2, 3.2); cx.fillStyle = '#000'; cx.fillRect(10.5, -14, 1.6, 1.6);
  if (spiky) { cx.fillStyle = '#efe8ff'; for (let i = 0; i < 4; i++) { cx.beginPath(); cx.moveTo(-8 + i * 6, -16); cx.lineTo(-5 + i * 6, -25); cx.lineTo(-2 + i * 6, -16); cx.fill(); } }
  cx.restore();
}
function drawCrow(x, y, dir, t) {
  cx.save(); cx.translate(x, y); cx.scale(dir, 1);
  const f = Math.sin(t * .3) * 10;
  cx.fillStyle = '#1a1a24';
  cx.beginPath(); cx.moveTo(-2, -2); cx.lineTo(-17, -13 - f); cx.lineTo(-6, 3); cx.fill();
  cx.beginPath(); cx.ellipse(0, 0, 11, 7, 0, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(9, -4, 5.2, 0, 7); cx.fill();
  cx.fillStyle = '#f0a020'; cx.beginPath(); cx.moveTo(13, -5); cx.lineTo(20, -3); cx.lineTo(13, -1); cx.fill();
  cx.fillStyle = '#fff'; cx.fillRect(9.5, -6, 2.4, 2.4);
  cx.fillStyle = '#2a2a38'; cx.beginPath(); cx.moveTo(2, -2); cx.lineTo(17, -13 + f); cx.lineTo(7, 3); cx.fill();
  cx.restore();
}

/* ---------- البطل: علّوش ---------- */
function shmaghPath() {
  cx.beginPath(); cx.moveTo(-10, -30); cx.quadraticCurveTo(-13, -40, -6, -46); cx.quadraticCurveTo(2, -51, 10, -45);
  cx.quadraticCurveTo(12.5, -42, 10.5, -39.5); cx.lineTo(3, -40.5); cx.quadraticCurveTo(-2, -38, -3, -31); cx.closePath();
}
function checks(x0, y0, x1, y1, st, color) {
  cx.strokeStyle = color || '#c8102e'; cx.lineWidth = 1.3;
  cx.beginPath();
  for (let x = x0; x < x1; x += st) { cx.moveTo(x, y0); cx.lineTo(x, y1); }
  for (let y = y0; y < y1; y += st) { cx.moveTo(x0, y); cx.lineTo(x1, y); }
  cx.stroke();
}
let currentSkinId = 'default';
function setHeroSkin(id) { currentSkinId = id; }
/* رسم معاينة صغيرة لزي معيّن داخل بطاقة المتجر (canvas منفصل بحجم صغير) */
function renderSkinPreview(canvasEl, skin) {
  const pcx = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  pcx.clearRect(0, 0, w, h);
  const g = pcx.createRadialGradient(w / 2, h * .38, 4, w / 2, h * .5, w * .62);
  g.addColorStop(0, '#2b5aa0'); g.addColorStop(1, '#0f2c62');
  pcx.fillStyle = g; pcx.beginPath(); pcx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, 7); pcx.fill();
  const prevW = VW, prevH = VH;
  cx = pcx; VW = w; VH = h;
  drawHero(w / 2, h * .82, {dir: 1, mode: 'idle', phase: 0, t: 0, s: h / 92, speed: 0, skin});
  cx = mainCx; VW = prevW; VH = prevH;
}
function drawBall(o) {
  const r = 13, rot = (o.t || 0) * (o.mode === 'charge' ? .9 : .45);
  cx.translate(0, -r);
  if (o.mode === 'charge') cx.translate((Math.random() - .5) * 2, 0);
  cx.rotate(rot);
  cx.fillStyle = '#f7efdc'; cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
  cx.save(); cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.clip(); checks(-r, -r, r, r, 4.2); cx.restore();
  cx.strokeStyle = '#111'; cx.lineWidth = 3; cx.beginPath(); cx.arc(0, 0, r - 4, .2, 2.1); cx.stroke();
  cx.fillStyle = '#d9a066'; cx.beginPath(); cx.arc(r - 5, -2, 4, 0, 7); cx.fill();
  cx.fillStyle = '#111'; cx.fillRect(r - 6, -6, 5, 1.6);
  cx.strokeStyle = '#5a1a10'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.stroke();
}
function drawHero(x, y, o) {
  cx.save(); cx.translate(x, y); cx.scale(o.dir * (o.s || 1), o.s || 1);
  if (o.alpha != null) cx.globalAlpha = o.alpha;
  const t = o.t || 0;
  const sk = (o.skin || (typeof Shop !== 'undefined' ? Shop.byId(currentSkinId) : null) || {colors: {}}).colors || {};
  const cShemagh = sk.shemagh || '#f6efdc', cStripe = sk.stripe || '#c8102e', cBody = sk.body || '#f6efdc',
        cTrim = sk.trim || '#c9bda0', cSash = sk.sash || '#1f5a3a', cBand = sk.band || '#c8102e', cAgal = sk.agal || '#111111';
  if (o.mode === 'ball' || o.mode === 'charge') { drawBall(o); cx.restore(); return; }
  const run = o.mode === 'run', air = o.mode === 'air';
  const ph = o.phase || 0, sw = run ? Math.sin(ph) : 0, cs = run ? Math.cos(ph) : 0;
  const bob = run ? -Math.abs(Math.sin(ph)) * 2.2 : (o.mode === 'idle' ? Math.sin(t * .06) * .8 : 0);
  cx.lineCap = 'round'; cx.lineJoin = 'round';
  cx.translate(0, bob);
  const l1x = air ? 9 : sw * 11, l1y = air ? -5 : -1 - (run ? Math.max(0, -cs) * 5 : 0);
  const l2x = air ? -8 : -sw * 11, l2y = air ? -10 : -1 - (run ? Math.max(0, cs) * 5 : 0);
  cx.strokeStyle = '#3f2c20'; cx.lineWidth = 6.5;
  cx.beginPath(); cx.moveTo(-3, -15); cx.lineTo(3 + l2x, l2y); cx.stroke();
  cx.fillStyle = '#7a4a24'; cx.beginPath(); cx.ellipse(5 + l2x, l2y + .5, 5, 2.4, 0, 0, 7); cx.fill();
  const armB = air ? [-7, -38] : [sw * 9 - 1, -20];
  cx.strokeStyle = '#efe6cf'; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(0, -30); cx.lineTo(armB[0], armB[1]); cx.stroke();
  cx.fillStyle = '#d9a066'; cx.beginPath(); cx.arc(armB[0], armB[1], 2.8, 0, 7); cx.fill();
  cx.beginPath(); cx.moveTo(-9, -31); cx.lineTo(9, -31); cx.lineTo(12 - (run ? 2 : 0), -12); cx.quadraticCurveTo(0, -9 + (run ? sw * 1.5 : 0), -12 - (run ? 3 : 0), -12); cx.closePath();
  cx.fillStyle = cBody; cx.fill(); cx.strokeStyle = cTrim; cx.lineWidth = 1; cx.stroke();
  cx.fillStyle = cSash;
  cx.beginPath(); cx.moveTo(-9, -31); cx.lineTo(-3, -31); cx.lineTo(-4, -20); cx.lineTo(-10.5, -20); cx.closePath(); cx.fill();
  cx.beginPath(); cx.moveTo(9, -31); cx.lineTo(3, -31); cx.lineTo(4, -20); cx.lineTo(10.5, -20); cx.closePath(); cx.fill();
  cx.fillStyle = cBand; cx.fillRect(-10.5, -22, 21, 4); cx.fillStyle = '#f3b93a'; cx.fillRect(-10.5, -19, 21, 1.2);
  cx.strokeStyle = '#3f2c20'; cx.lineWidth = 6.5; cx.beginPath(); cx.moveTo(-3, -15); cx.lineTo(3 + l1x, l1y); cx.stroke();
  cx.fillStyle = '#7a4a24'; cx.beginPath(); cx.ellipse(5 + l1x, l1y + .5, 5, 2.4, 0, 0, 7); cx.fill();
  const armF = air ? [9, -40] : [-sw * 9 + 3, -20];
  cx.strokeStyle = '#efe6cf'; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(0, -30); cx.lineTo(armF[0], armF[1]); cx.stroke();
  cx.fillStyle = '#d9a066'; cx.beginPath(); cx.arc(armF[0], armF[1], 2.8, 0, 7); cx.fill();
  const sp = Math.min(1, Math.abs(o.speed || 0) / 9), w = Math.sin(t * .35) * 3;
  cx.beginPath(); cx.moveTo(-9, -42); cx.quadraticCurveTo(-16 - sp * 8, -40 + w, -20 - sp * 14, -35 + w * 1.5);
  cx.lineTo(-19 - sp * 13, -30 + w * 1.5); cx.quadraticCurveTo(-14 - sp * 5, -32 + w, -9, -33); cx.closePath();
  cx.fillStyle = cShemagh; cx.fill(); cx.strokeStyle = cStripe; cx.lineWidth = 1.2; cx.stroke();
  cx.fillStyle = '#d9a066'; cx.beginPath(); cx.arc(1, -38, 8.5, 0, 7); cx.fill();
  shmaghPath(); cx.fillStyle = cShemagh; cx.fill();
  cx.save(); shmaghPath(); cx.clip(); checks(-16, -54, 14, -26, 3.4, cStripe); cx.restore();
  shmaghPath(); cx.strokeStyle = 'rgba(120,20,20,.6)'; cx.lineWidth = .8; cx.stroke();
  cx.strokeStyle = cAgal; cx.lineWidth = 2.6;
  cx.beginPath(); cx.ellipse(.5, -44.5, 9.8, 3.2, -.06, 0, 7); cx.stroke();
  cx.lineWidth = 1.6; cx.beginPath(); cx.ellipse(.5, -41.8, 9.6, 2.8, -.06, .2, Math.PI - .2); cx.stroke();
  cx.fillStyle = '#fff'; cx.beginPath(); cx.ellipse(6, -38, 2.4, 2.2, 0, 0, 7); cx.fill();
  cx.fillStyle = '#111'; cx.beginPath(); cx.arc(6.9, -38, 1.3, 0, 7); cx.fill();
  cx.strokeStyle = '#111'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(3.6, -41.4); cx.lineTo(8.8, -40.6); cx.stroke();
  cx.strokeStyle = '#b57a45'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(10.1, -38); cx.quadraticCurveTo(12, -36, 10.3, -35.5); cx.stroke();
  cx.fillStyle = '#141414'; cx.beginPath(); cx.moveTo(5.6, -34.6); cx.quadraticCurveTo(8.6, -32.6, 11.2, -34.8); cx.quadraticCurveTo(8.6, -35.8, 5.6, -34.6); cx.fill();
  cx.strokeStyle = '#7a3b26'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(6.8, -32.6); cx.quadraticCurveTo(8.6, -31.6, 10.2, -32.8); cx.stroke();
  cx.restore();
}

/* ---------- الجسيمات ---------- */
function emit(x, y, n, o) {
  if (lowFx) n = Math.ceil(n / 2);
  for (let i = 0; i < n && parts.length < 260; i++) {
    parts.push({x, y, vx: (Math.random() - .5) * (o.sp || 3), vy: (Math.random() - .5) * (o.sp || 3) + (o.up || 0), life: o.life || 28, max: o.life || 28, c: o.c || '#fff', r: o.r || 2, g: o.g || 0});
  }
}
function updateParts() {
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.x += q.vx; q.y += q.vy; q.vy += q.g; q.life--;
    if (q.life <= 0) parts.splice(i, 1);
  }
}
function drawParts(camX, camY) {
  for (const q of parts) { cx.globalAlpha = Math.max(0, q.life / q.max); cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x - camX, q.y - camY, q.r, 0, 7); cx.fill(); }
  cx.globalAlpha = 1;
}

/* ---------- الواجهة الملصقة (HUD) ---------- */
function fmtTime(t) { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }
function drawHUD(S, heroPhase) {
  const L = S.L, th = Engine.THEMES[L.theme];
  const px = 10 + 0, py = 8;
  rr(px, py, 118, 62, 10); cx.fillStyle = 'rgba(15,8,4,.55)'; cx.fill(); cx.strokeStyle = 'rgba(243,185,58,.7)'; cx.lineWidth = 1.5; cx.stroke();
  drawCoin(px + 16, py + 17, 0, 0); txt(String(S.coins), px + 32, py + 17, 18, '#ffe89a');
  txt(fmtTime(S.t), px + 32, py + 40, 15, '#f7ecd2');
  for (let i = 0; i < 3; i++) {
    cx.globalAlpha = i < S.lives ? 1 : .25;
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(px + 90 + i * 0, py + 0, 0, 0, 7);
    const hx = px + 78 + i * 13, hy = py + 46;
    cx.fillStyle = '#d9a066'; cx.beginPath(); cx.arc(hx, hy, 5, 0, 7); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(hx, hy - 1, 5.2, Math.PI, 0); cx.fill();
    cx.fillStyle = '#c8102e'; cx.fillRect(hx - 5, hy - 3, 10, 1.6);
  }
  cx.globalAlpha = 1;
  txt(String(S.score), 138, py + 17, 15, '#ffe89a', 'left');
  txt(Engine.themeName(th, I18N.get()) + ' ' + ((L.n - 1) % 10 + 1), VW / 2, 16, 15, '#fff', 'center');
  const b = S.boss;
  if (b && b.active && !b.dead) {
    const w = 160, x = VW / 2 - w / 2;
    rr(x, 28, w, 10, 5); cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fill();
    rr(x + 1, 29, Math.max(0, (w - 2) * b.hp / b.maxhp), 8, 4); cx.fillStyle = '#c8102e'; cx.fill();
  }
  if (S.frame < 120) {
    const a = S.frame < 90 ? 1 : 1 - (S.frame - 90) / 30;
    cx.globalAlpha = a;
    const lang = I18N.get(), lvlLabel = lang === 'en' ? (Engine.themeName(th, lang) + ' — Level ' + L.n) : (Engine.themeName(th, lang) + ' — المرحلة ' + L.n);
    const parLabel = lang === 'en' ? ('Target time ' + fmtTime(L.par) + (L.boss ? '  •  Boss ahead' : '')) : ('الزمن المحدد ' + fmtTime(L.par) + (L.boss ? '  •  زعيم في النهاية' : ''));
    txt(lvlLabel, VW / 2, VH * .32, 30, '#ffd257', 'center');
    txt(parLabel, VW / 2, VH * .32 + 30, 15, '#fff', 'center');
    cx.globalAlpha = 1;
  }
}

/* ---------- المشهد الكامل ---------- */
let heroPhase = 0;
function heroMode(p) {
  if (p.dead || p.hurt > 0) return 'air';
  if (p.charging) return 'charge';
  if (p.ball || p.roll) return 'ball';
  if (!p.ground) return 'air';
  return Math.abs(p.vx) > .5 ? 'run' : 'idle';
}
function drawWorld(S) {
  const L = S.L, th = Engine.THEMES[L.theme], p = S.p;
  let ox = 0, oy = 0;
  if (cam.shake > 0) { ox = (Math.random() - .5) * cam.shake; oy = (Math.random() - .5) * cam.shake; cam.shake *= .85; if (cam.shake < .3) cam.shake = 0; }
  const camX = cam.x + ox, camY = cam.y + oy, vis = x => x > camX - 100 && x < camX + VW + 100;
  drawSky(th, camX, camY);
  farLayer(th.farType, th.far, .18, 250, camX, camY, th.night);
  landLayer(th, camX, camY);
  drawGround(th, L, camX, camY);
  for (const d of L.decor) { if (!vis(d.x)) continue; const g = Engine.groundAt(L, d.x); if (g < Infinity) drawDecor(d, d.x - camX, g - camY, th); }
  for (const f of L.flags) if (vis(f.x)) drawFlag(f.x - camX, f.y - camY, f.on, S.frame);
  const gy = Engine.groundAt(L, L.goalX);
  if (vis(L.goalX) && gy < Infinity) drawGate(L.goalX - camX, gy - camY, !L.boss || S.boss.dead, S.frame);
  for (const h of L.hints) { if (Math.abs(p.x - h.x) < 320) { const g = Engine.groundAt(L, h.x); if (g < Infinity) { const hText = I18N.t(h.key); cx.font = '800 14px sans-serif'; const w = cx.measureText(hText).width + 22; rr(h.x - camX - w / 2, g - camY - 108, w, 26, 8); cx.fillStyle = 'rgba(15,8,4,.7)'; cx.fill(); txt(hText, h.x - camX, g - camY - 95, 14, '#ffe89a', 'center', false); } } }
  for (const s of L.spikes) if (vis(s.x)) drawSpike(s, camX, camY);
  for (const s of L.springs) if (vis(s.x)) drawSpring(s, camX, camY);
  for (const pd of L.pads) if (vis(pd.x)) drawPad(pd, camX, camY, S.frame);
  for (const pl of L.plats) if (vis(pl.x)) drawPlat(pl, camX, camY, th);
  for (let i = 0; i < L.coins.length; i++) { const c = L.coins[i]; if (!c.got && vis(c.x)) drawCoin(c.x - camX, c.y - camY, S.frame, i); }
  for (const e of L.enemies) {
    if (!e.alive || !vis(e.x)) continue;
    if (e.t === 'walk') drawScorpion(e.x - camX, e.y - camY, e.dir, S.frame, e.spiky, 1);
    else drawCrow(e.x - camX, e.y - camY, Math.cos(e.ph) >= 0 ? 1 : -1, S.frame);
  }
  const b = S.boss;
  if (b && b.active && !b.dead) {
    if (!(b.inv > 0 && (S.frame >> 2) & 1)) drawScorpion(b.x - camX, b.y - camY, b.dir, S.frame, false, 2.6, [th.night ? '#7a1a3a' : '#5a1a0a', '#e0a030']);
    if (b.state === 'wind') { cx.fillStyle = 'rgba(255,60,60,.8)'; cx.font = '900 26px sans-serif'; cx.textAlign = 'center'; cx.fillText('!', b.x - camX, b.y - camY - 84); }
  }
  const mode = heroMode(p);
  if (!(p.inv > 0 && !p.dead && (S.frame >> 2) & 1)) {
    if (trail.length) for (let i = 0; i < trail.length; i++) { const q = trail[i]; drawHero(q.x - camX, q.y - camY, {dir: q.dir, mode: q.mode, phase: q.phase, t: q.t, s: .82, alpha: .1 + i * .04, speed: 0}); }
    if (p.dead) { cx.save(); cx.translate(p.x - camX, p.y - camY); cx.rotate(S.frame * .2); cx.translate(-(p.x - camX), -(p.y - camY)); }
    drawHero(p.x - camX, p.y - camY, {dir: p.dir, mode, phase: heroPhase, t: S.frame, s: .82, speed: p.vx});
    if (p.dead) cx.restore();
  }
  drawParts(camX, camY);
  if (Math.abs(p.vx) > 10) {
    cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const y = hash(i + (S.frame >> 1)) * VH, x = hash(i * 3 + (S.frame >> 1)) * VW, l = 40 + hash(i) * 50; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - Math.sign(p.vx) * l, y); cx.stroke(); }
  }
  drawHUD(S, heroPhase);
}
function drawMenuScene(ts, ti) {
  const th = Engine.THEMES[ti], camX = ts * .06, base = VH * .8;
  drawSky(th, camX, 0);
  farLayer(th.farType, th.far, .18, 250, camX, 0, th.night);
  landLayer(th, camX, 0);
  cx.fillStyle = th.body; cx.fillRect(0, base, VW, VH - base);
  cx.fillStyle = th.top; cx.fillRect(0, base - 4, VW, 10);
  cx.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 0; k < 30; k++) cx.fillRect(((k * 61 - camX * 1.2) % (VW + 60) + VW + 60) % (VW + 60) - 30, base + 14 + hash(k) * 40, 22, 5);
  const off = camX * 1.2;
  for (let i = Math.floor(off / 260); i < Math.floor(off / 260) + Math.ceil(VW / 260) + 2; i++) drawDecor({t: th.decor[i % th.decor.length], s: 1.1, x: i}, i * 260 - off, base, th);
  heroPhase += .32;
  const hx = VW * .27;
  cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(hx, base + 2, 44, 8, 0, 0, 7); cx.fill();
  drawHero(hx, base, {dir: 1, mode: 'run', phase: heroPhase, t: ts / 16, s: 2.5, speed: 8});
  cx.strokeStyle = 'rgba(255,255,255,.3)'; cx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const y = base - 20 - hash(i) * 110, x = hx - 90 - hash(i + 4) * 90 - ((ts * .3 + i * 40) % 60); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 50, y); cx.stroke(); }
}
