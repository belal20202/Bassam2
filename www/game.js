'use strict';
/* بسام v1.0.2 — game.js: تجميع كل شيء (اللغة، القصة، الشاشات، المتجر، التحكم، الحفظ، الحلقة الرئيسية) */
(() => {
const $ = s => document.querySelector(s);
const LKEY = 'bassam_save_v1', SKEY = 'bassam_settings_v1';
const LEGACY_LKEY = 'alloush_save_v1', LEGACY_SKEY = 'alloush_settings_v1';
const TOTAL = 100;
const COIN_ICON = '🪙';

/* ---------- الحفظ ---------- */
function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
let save = loadJSON(LKEY, null);
if (!save) save = loadJSON(LEGACY_LKEY, {levels: {}});   // ترحيل تلقائي من إصدار سابق إن وُجد
let settings = loadJSON(SKEY, null);
if (!settings) settings = loadJSON(LEGACY_SKEY, {sfx: true, music: true, haptic: true, cs: 1, lang: null});
// تطبيع بنية الحفظ (يضمن وجود كل الحقول حتى مع حفظ قديم)
save.levels = save.levels || {};
save.wallet = save.wallet || 0;
save.skins = (save.skins && save.skins.length) ? save.skins : ['default'];
save.equipped = save.equipped || 'default';
save.seenStory = !!save.seenStory;
settings.sfx = settings.sfx !== false; settings.music = settings.music !== false; settings.haptic = settings.haptic !== false;
settings.cs = settings.cs || 1; settings.lang = settings.lang || null;

function persistSave() { try { localStorage.setItem(LKEY, JSON.stringify(save)); } catch (e) {} }
function persistSettings() { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} }
function totalStars() { let s = 0; for (const k in save.levels) s += save.levels[k].stars || 0; return s; }
function unlockedUpTo() { let u = 1; for (let n = 1; n < TOTAL; n++) { if (save.levels[n] && save.levels[n].stars > 0) u = n + 1; else break; } return u; }
function haptic(ms) { if (settings.haptic && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }

/* ---------- الحالة العامة ---------- */
let state = 'menu';        // menu | play | pause | result | over
let S = null, curLevel = 1;
let menuTS = 0, menuThemeIdx = 0, lastTs = 0, acc = 0;
const STEP_MS = 1000 / 60;

/* ---------- التحكم ---------- */
const input = {dir: 0, jump: false, roll: false};
const keys = {left: false, right: false};
function updateKeyDir() { input.dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); }
addEventListener('keydown', e => {
  if (state !== 'play') return;
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.left = true; updateKeyDir(); }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.right = true; updateKeyDir(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { input.jump = true; e.preventDefault(); }
  if (['Shift', 'x', 'X', 's', 'S', 'ArrowDown'].includes(e.key)) input.roll = true;
  if (e.key === 'Escape') togglePause();
});
addEventListener('keyup', e => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.left = false; updateKeyDir(); }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.right = false; updateKeyDir(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) input.jump = false;
  if (['Shift', 'x', 'X', 's', 'S', 'ArrowDown'].includes(e.key)) input.roll = false;
});

const pad = $('#pad'), knob = $('#knob'), bJump = $('#bJump'), bRoll = $('#bRoll');
let padTouch = null;
function padVec(t) {
  const r = pad.getBoundingClientRect(), cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;
  let dx = t.clientX - cxp, dy = t.clientY - cyp;
  const max = r.width / 2 - 8, len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  knob.style.transform = `translate(${dx}px,${dy * .5}px)`;
  input.dir = Math.abs(dx) < 10 ? 0 : (dx > 0 ? 1 : -1);
}
pad.addEventListener('touchstart', e => { e.preventDefault(); Audio2.unlock(); padTouch = e.changedTouches[0].identifier; padVec(e.changedTouches[0]); }, {passive: false});
pad.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === padTouch) padVec(t); }, {passive: false});
function padEnd(e) { for (const t of e.changedTouches) if (t.identifier === padTouch) { padTouch = null; input.dir = 0; knob.style.transform = 'translate(0,0)'; } }
pad.addEventListener('touchend', padEnd); pad.addEventListener('touchcancel', padEnd);
pad.addEventListener('mousedown', e => {
  padTouch = 'm'; padVec(e);
  const mv = e2 => padVec(e2);
  const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); input.dir = 0; knob.style.transform = 'translate(0,0)'; };
  addEventListener('mousemove', mv); addEventListener('mouseup', up);
});

function holdBtn(el, on, off) {
  const s = e => { e.preventDefault(); Audio2.unlock(); el.classList.add('on'); on(); };
  const en = e => { e.preventDefault(); el.classList.remove('on'); off(); };
  el.addEventListener('touchstart', s, {passive: false});
  el.addEventListener('touchend', en); el.addEventListener('touchcancel', en);
  el.addEventListener('mousedown', s); el.addEventListener('mouseup', en); el.addEventListener('mouseleave', en);
}
holdBtn(bJump, () => input.jump = true, () => input.jump = false);
holdBtn(bRoll, () => input.roll = true, () => input.roll = false);

/* ---------- الشاشات ---------- */
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('show')); }
function showScreen(id) { hideAllScreens(); const el = document.getElementById(id); if (el) el.classList.add('show'); }
function goto(id) { Audio2.sfx.click(); showScreen(id); if (id === 'levels') renderLevels(); if (id === 'shop') renderShop(); if (id === 'menu') enterMenu(); if (id === 'privacy') $('#pFrame').src = 'privacy.html'; }
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => goto('menu')));
$('#mPlay').onclick = () => startLevel(unlockedUpTo());
$('#mLevels').onclick = () => goto('levels');
$('#mShop').onclick = () => goto('shop');
$('#mSettings').onclick = () => goto('settings');
$('#mPrivacy').onclick = () => goto('privacy');
$('#mAbout').onclick = () => goto('story');
$('#mExit').onclick = () => goto('exitConfirm');
$('#exitCancel').onclick = () => goto('menu');
$('#exitYes').onclick = () => doExit();

function doExit() {
  try {
    if (window.Capacitor && window.Capacitor.registerPlugin) {
      const AppPlugin = window.Capacitor.registerPlugin('App');
      if (AppPlugin && AppPlugin.exitApp) { AppPlugin.exitApp(); return; }
    }
  } catch (e) {}
  window.close();
  setTimeout(() => { alert(I18N.t('exitFallback')); goto('menu'); }, 300);
}

/* ---------- اللغة والقصة (أول تشغيل) ---------- */
function chooseLang(l) {
  settings.lang = l; persistSettings();
  I18N.set(l); applyI18N();
  Audio2.unlock(); Audio2.sfx.click();
  if (!save.seenStory) showScreen('story'); else { showScreen('menu'); enterMenu(); }
}
$('#langAr').onclick = () => chooseLang('ar');
$('#langEn').onclick = () => chooseLang('en');
$('#storyStart').onclick = () => { save.seenStory = true; persistSave(); Audio2.sfx.click(); startLevel(unlockedUpTo()); };
$('#storySkip').onclick = () => { save.seenStory = true; persistSave(); Audio2.sfx.click(); showScreen('menu'); enterMenu(); };

function applyI18N() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = I18N.t(el.dataset.i18n); });
  $('#storyText').textContent = I18N.t('storyBody');
  $('#storyGuide').innerHTML = I18N.t('aboutBody');
  document.querySelectorAll('#segLang button').forEach(b => b.classList.toggle('on', b.dataset.lang === I18N.get()));
  if ($('#result').classList.contains('show')) $('#rTitle').textContent = (curLevel % 10 === 0) ? I18N.t('resultBoss') : I18N.t('resultDone');
  renderLevels(); renderShop();
}

/* ---------- قائمة المراحل ---------- */
function renderLevels() {
  const wrap = $('#lvList'); wrap.innerHTML = '';
  const unlocked = unlockedUpTo(), lang = I18N.get();
  $('#lvStars').textContent = totalStars() + ' / ' + TOTAL * 3;
  for (let w = 0; w < 10; w++) {
    const div = document.createElement('div'); div.className = 'world';
    const h = document.createElement('h3'); h.textContent = Engine.themeName(Engine.THEMES[w], lang);
    div.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'grid';
    for (let i = 1; i <= 10; i++) {
      const n = w * 10 + i, rec = save.levels[n], boss = i === 10;
      const c = document.createElement('button');
      c.className = 'cell' + (boss ? ' boss' : '') + (n > unlocked ? ' locked' : '') + (n === unlocked ? ' next' : '');
      const starRow = rec ? `<span class="st">${'★'.repeat(rec.stars)}${'☆'.repeat(3 - rec.stars)}</span>` : (n <= unlocked ? '<span class="st">—</span>' : '');
      c.innerHTML = (n > unlocked ? '🔒' : (boss ? '👑' : n)) + starRow;
      if (n <= unlocked) c.onclick = () => startLevel(n);
      grid.appendChild(c);
    }
    div.appendChild(grid); wrap.appendChild(div);
  }
  updateMenuBadge();
}
function updateWalletUI() {
  const txt = (save.wallet || 0) + ' ' + COIN_ICON;
  $('#mWallet').textContent = txt; $('#shWallet').textContent = txt;
}
function updateMenuBadge() {
  const st = totalStars(), titles = I18N.t('titles'), THRESH = [0, 30, 90, 180, 270];
  let title = titles[0]; for (let i = 0; i < THRESH.length; i++) if (st >= THRESH[i]) title = titles[i];
  $('#mTitle').textContent = title; $('#mStars').textContent = st + ' / ' + TOTAL * 3;
  updateWalletUI();
}

/* ---------- المتجر ---------- */
function renderShop() {
  const wrap = $('#shopList'); wrap.innerHTML = '';
  const grid = document.createElement('div'); grid.className = 'shopGrid';
  const lang = I18N.get(), cards = [];
  Shop.SKINS.forEach(sk => {
    const owned = save.skins.includes(sk.id), equipped = save.equipped === sk.id;
    const card = document.createElement('div'); card.className = 'skinCard';
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160;
    card.appendChild(canvas);
    const name = document.createElement('div'); name.className = 'sName'; name.textContent = Shop.name(sk, lang);
    card.appendChild(name);
    const price = document.createElement('div'); price.className = 'sPrice';
    price.textContent = owned ? I18N.t('owned') : (sk.price + ' ' + COIN_ICON);
    card.appendChild(price);
    const btn = document.createElement('button'); btn.className = 'btn small' + (equipped ? ' owned' : '');
    btn.textContent = equipped ? I18N.t('equipped') : (owned ? I18N.t('equip') : I18N.t('buy'));
    btn.disabled = equipped;
    btn.onclick = () => {
      if (equipped) return;
      if (owned) { save.equipped = sk.id; persistSave(); setHeroSkin(sk.id); Audio2.sfx.click(); renderShop(); return; }
      if ((save.wallet || 0) >= sk.price) {
        save.wallet -= sk.price; save.skins.push(sk.id); save.equipped = sk.id; persistSave();
        setHeroSkin(sk.id); Audio2.sfx.star(); haptic([20, 20, 30]); renderShop();
      } else { Audio2.sfx.click(); alert(I18N.t('notEnough')); }
    };
    card.appendChild(btn);
    grid.appendChild(card); cards.push({canvas, sk});
  });
  wrap.appendChild(grid);
  updateWalletUI();
  requestAnimationFrame(() => cards.forEach(c => renderSkinPreview(c.canvas, c.sk)));
}

/* ---------- الإعدادات ---------- */
function applySettingsUI() {
  document.querySelectorAll('.tg').forEach(t => t.setAttribute('aria-pressed', String(!!settings[t.dataset.set])));
  document.querySelectorAll('#segCtrl button').forEach(b => b.classList.toggle('on', +b.dataset.cs === settings.cs));
  document.querySelectorAll('#segLang button').forEach(b => b.classList.toggle('on', b.dataset.lang === I18N.get()));
  document.documentElement.style.setProperty('--cs', settings.cs);
}
document.querySelectorAll('.tg').forEach(t => t.onclick = () => {
  const k = t.dataset.set; settings[k] = !settings[k];
  if (k === 'sfx' || k === 'music') Audio2.setOn(k, settings[k]);
  persistSettings(); applySettingsUI(); Audio2.sfx.click();
});
$('#segCtrl').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; settings.cs = +b.dataset.cs; persistSettings(); applySettingsUI(); Audio2.sfx.click(); });
$('#segLang').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; settings.lang = b.dataset.lang; persistSettings(); I18N.set(settings.lang); applyI18N(); applySettingsUI(); Audio2.sfx.click(); });
$('#sReset').onclick = () => {
  if (confirm(I18N.t('resetConfirm'))) {
    save = {levels: {}, wallet: 0, skins: ['default'], equipped: 'default', seenStory: false};
    persistSave(); setHeroSkin('default'); updateMenuBadge(); renderShop(); Audio2.sfx.click();
  }
};

/* ---------- المرحلة ---------- */
function startLevel(n) {
  curLevel = Math.max(1, Math.min(TOTAL, n));
  S = Engine.createState(curLevel);
  state = 'play';
  hideAllScreens();
  $('#touch').classList.remove('hidden');
  cam.x = S.p.x - VW * .4; cam.y = 0; cam.shake = 0;
  parts.length = 0; trail.length = 0; phaseAcc = 0;
  Audio2.playMus(S.L.theme);
  lastTs = performance.now(); acc = 0;
}
function togglePause() {
  if (state !== 'play' && state !== 'pause') return;
  if (state === 'pause') { $('#pause').classList.remove('show'); state = 'play'; lastTs = performance.now(); Audio2.playMus(S.L.theme); }
  else { $('#pause').classList.add('show'); state = 'pause'; Audio2.stopMus(); Audio2.sfx.click(); }
}
$('#bPause').onclick = togglePause;
$('#pResume').onclick = togglePause;
$('#pRetry').onclick = () => { $('#pause').classList.remove('show'); startLevel(curLevel); };
$('#pMenu').onclick = () => { $('#pause').classList.remove('show'); $('#touch').classList.add('hidden'); Audio2.stopMus(); goto('menu'); };

function saveResult(res) {
  const rec = save.levels[curLevel] || {stars: 0, best: Infinity};
  let improved = false;
  if (res.stars > rec.stars) { rec.stars = res.stars; improved = true; }
  if (res.time < rec.best) rec.best = res.time;
  rec.rank = res.rank;
  save.levels[curLevel] = rec;
  save.wallet = (save.wallet || 0) + res.coins;
  persistSave();
  return improved;
}
function showResult(res) {
  $('#rTime').textContent = res.time.toFixed(1) + 's';
  $('#rCoins').textContent = res.coins + '/' + res.totalCoins;
  $('#rKills').textContent = res.kills;
  $('#rScore').textContent = res.score;
  $('#rRank').textContent = res.rank; $('#rRank').className = 'rank' + (res.rank === 'S' ? ' S' : '');
  const stEl = $('#rStars'); stEl.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < res.stars));
  const improved = saveResult(res);
  $('#rTitle').textContent = curLevel % 10 === 0 ? I18N.t('resultBoss') : I18N.t('resultDone');
  $('#rBest').textContent = improved ? I18N.t('newRecord') : '';
  $('#rNext').style.visibility = curLevel < TOTAL ? 'visible' : 'hidden';
  showScreen('result');
  Audio2.stopMus();
  Audio2.sfx.win(); haptic([40, 30, 60]);
  if (res.stars >= 2) setTimeout(() => Audio2.sfx.star(), 260);
  updateMenuBadge();
}
$('#rNext').onclick = () => { hideAllScreens(); startLevel(Math.min(TOTAL, curLevel + 1)); };
$('#rRetry').onclick = () => { hideAllScreens(); startLevel(curLevel); };
$('#rMenu').onclick = () => { $('#touch').classList.add('hidden'); goto('levels'); };
$('#rShare').onclick = () => {
  const stars = $('#rStars').querySelectorAll('.on').length;
  const txt = I18N.t('shareText')(curLevel) + ` — ${$('#rRank').textContent} ⭐${stars}/3`;
  if (navigator.share) navigator.share({text: txt}).catch(() => {});
  else { try { navigator.clipboard.writeText(txt); } catch (e) {} alert(I18N.t('copied')); }
};
$('#oRetry').onclick = () => { hideAllScreens(); startLevel(curLevel); };
$('#oMenu').onclick = () => { $('#touch').classList.add('hidden'); goto('levels'); };

/* ---------- ربط أحداث المحرك بالصوت والاهتزاز والجسيمات ---------- */
function handleEvents(S) {
  for (const ev of S.ev) {
    switch (ev.t) {
      case 'jump': Audio2.sfx.jump(); break;
      case 'land': Audio2.sfx.land(); break;
      case 'coin': Audio2.sfx.coin(); emit(ev.x, ev.y, 6, {c: '#ffd23f', sp: 3, up: -2, g: .15, life: 20, r: 2}); break;
      case 'roll': Audio2.sfx.roll(); break;
      case 'dash': Audio2.sfx.dash(); cam.shake = 3; emit(ev.x, ev.y, 10, {c: '#fff', sp: 5, life: 16}); break;
      case 'boost': Audio2.sfx.boost(); emit(ev.x, ev.y, 8, {c: '#ffd23f', sp: 4, life: 14}); break;
      case 'stomp': Audio2.sfx.stomp(); haptic(15); emit(ev.x, ev.y, 12, {c: '#ffb27a', sp: 4, up: -1, g: .2, life: 22}); break;
      case 'hurt': Audio2.sfx.hurt(); haptic(35); cam.shake = 6; break;
      case 'die': Audio2.sfx.die(); haptic([60, 40, 60]); cam.shake = 10; emit(ev.x, ev.y, 18, {c: '#ff5a5a', sp: 5, life: 30}); break;
      case 'respawn': cam.x = S.p.x - VW * .4; cam.shake = 0; break;
      case 'spring': Audio2.sfx.spring(); haptic(10); break;
      case 'flag': Audio2.sfx.flag(); emit(ev.x, ev.y - 40, 14, {c: '#ffe89a', sp: 4, life: 26}); break;
      case 'bossStart': cam.shake = 4; break;
      case 'bossHit': Audio2.sfx.bossHit(); haptic(20); cam.shake = 5; emit(ev.x, ev.y, 10, {c: '#fff', sp: 5, life: 18}); break;
      case 'bossDie': Audio2.sfx.bossDie(); haptic([50, 40, 50, 40, 80]); cam.shake = 14; emit(ev.x, ev.y, 40, {c: '#ffd23f', sp: 7, life: 40}); break;
      case 'slam': Audio2.sfx.slam(); cam.shake = 8; break;
      case 'over': Audio2.sfx.over(); haptic([80, 60, 80]); break;
    }
  }
  S.ev.length = 0;
}

/* ---------- الحلقة الرئيسية ---------- */
let phaseAcc = 0;
function tick() {
  const p = S.p;
  const moving = p.ground && !p.charging && Math.abs(p.vx) > .5 && !p.dead;
  if (moving) phaseAcc += Math.min(1, Math.abs(p.vx) / 6) * .9;
  Engine.step(S, input);
  handleEvents(S);
  updateParts();
  trail.unshift({x: p.x, y: p.y, dir: p.dir, mode: heroMode(p), phase: phaseAcc, t: S.frame});
  if (trail.length > 5) trail.length = 5;
  if (S.done && state === 'play') { state = 'result'; $('#touch').classList.add('hidden'); showResult(S.res); }
  else if (S.over && state === 'play') { state = 'over'; $('#touch').classList.add('hidden'); showScreen('over'); }
}
function render(ts) {
  requestAnimationFrame(render);
  const w = innerWidth, h = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, dprMax);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) resize();
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  VW = w; VH = h;
  tG = ts * .002;

  if (state === 'menu') {
    menuTS += Math.min(40, ts - (lastTs || ts)); lastTs = ts;
    menuThemeIdx = Math.floor(menuTS / 9000) % Engine.THEMES.length;
    drawMenuScene(menuTS, menuThemeIdx);
    return;
  }
  if (state === 'play' || state === 'pause' || state === 'result' || state === 'over') {
    if (state === 'play') {
      let dt = ts - lastTs; lastTs = ts; if (dt > 120) dt = 120;
      acc += dt;
      let steps = 0;
      while (acc >= STEP_MS && steps < 5) { tick(); acc -= STEP_MS; steps++; }
    }
    const p = S.p;
    const targetX = Math.max(0, p.x - VW * .42), targetY = Math.max(0, Math.min(60, p.y - 210));
    cam.x += (targetX - cam.x) * .12;
    cam.y += (targetY - cam.y) * .08;
    drawWorld(S);
    if (state !== 'play') { cx.fillStyle = 'rgba(0,0,0,.15)'; cx.fillRect(0, 0, VW, VH); }
  }
}
function enterMenu() { state = 'menu'; $('#touch').classList.add('hidden'); Audio2.stopMus(); updateMenuBadge(); }

/* ---------- بدء التشغيل ---------- */
setHeroSkin(save.equipped);
applySettingsUI();
Audio2.setOn('sfx', settings.sfx); Audio2.setOn('music', settings.music);
resize(); addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
addEventListener('touchstart', () => Audio2.unlock(), {once: true, passive: true});
addEventListener('mousedown', () => Audio2.unlock(), {once: true});
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

if (settings.lang) {
  I18N.set(settings.lang); applyI18N();
  if (!save.seenStory) showScreen('story'); else { showScreen('menu'); enterMenu(); }
} else {
  I18N.set('ar'); applyI18N();
  showScreen('lang');
}
requestAnimationFrame(render);
})();
