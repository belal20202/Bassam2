'use strict';
/* علّوش الرافدين — audio.js: كل الأصوات مولّدة برمجياً عبر WebAudio (بدون ملفات خارجية) */
const Audio2 = (() => {
  let actx = null, master, sfxG, musG, on = {sfx: true, music: true};
  let musTimer = null, musStep = 0, unlocked = false;

  function ensure() {
    if (actx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain(); master.gain.value = .9; master.connect(actx.destination);
    sfxG = actx.createGain(); sfxG.gain.value = .8; sfxG.connect(master);
    musG = actx.createGain(); musG.gain.value = .32; musG.connect(master);
  }
  function unlock() {
    ensure();
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    unlocked = true;
  }

  function osc(type, freq, t0, dur, g0, dest, sweep) {
    if (!actx) return;
    const o = actx.createOscillator(), gg = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(20, sweep), t0 + dur);
    gg.gain.setValueAtTime(0.0001, t0);
    gg.gain.exponentialRampToValueAtTime(g0, t0 + Math.min(.012, dur * .25));
    gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gg); gg.connect(dest || sfxG);
    o.start(t0); o.stop(t0 + dur + .02);
  }
  function noise(t0, dur, g0, dest, hp) {
    if (!actx) return;
    const n = actx.sampleRate * dur, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = actx.createBufferSource(); src.buffer = buf;
    const gg = actx.createGain(); gg.gain.setValueAtTime(g0, t0); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = src;
    if (hp) { const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; src.connect(f); node = f; }
    node.connect(gg); gg.connect(dest || sfxG);
    src.start(t0); src.stop(t0 + dur + .02);
  }

  const sfx = {
    jump() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('square', 320, t, .16, .16, sfxG, 760); },
    land() { if (!on.sfx || !actx) return; noise(actx.currentTime, .05, .12, sfxG, 300); },
    coin() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('square', 880, t, .07, .12, sfxG); osc('square', 1318, t + .05, .12, .12, sfxG); },
    roll() { if (!on.sfx || !actx) return; noise(actx.currentTime, .12, .08, sfxG, 800); },
    dash() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sawtooth', 140, t, .22, .18, sfxG, 900); },
    boost() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sawtooth', 200, t, .3, .2, sfxG, 1100); },
    stomp() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('square', 500, t, .09, .18, sfxG, 120); },
    hurt() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sawtooth', 220, t, .22, .2, sfxG, 60); },
    die() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sawtooth', 300, t, .5, .22, sfxG, 40); },
    spring() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sine', 260, t, .22, .2, sfxG, 900); },
    flag() { if (!on.sfx || !actx) return; const t = actx.currentTime; [523, 659, 784, 1047].forEach((f, i) => osc('square', f, t + i * .07, .12, .13, sfxG)); },
    click() { if (!on.sfx || !actx) return; osc('square', 500, actx.currentTime, .05, .1, sfxG); },
    lose() { if (!on.sfx || !actx) return; const t = actx.currentTime; for (let i = 0; i < 6; i++) osc('square', 700 - i * 60, t + i * .03, .06, .09, sfxG); },
    bossHit() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('square', 180, t, .14, .22, sfxG, 60); noise(t, .1, .12, sfxG, 500); },
    bossDie() { if (!on.sfx || !actx) return; const t = actx.currentTime; for (let i = 0; i < 8; i++) osc('sawtooth', 260 - i * 12, t + i * .09, .18, .18, sfxG, 40); },
    slam() { if (!on.sfx || !actx) return; noise(actx.currentTime, .2, .22, sfxG, 60); },
    win() { if (!on.sfx || !actx) return; const t = actx.currentTime; [523, 659, 784, 1047, 1318].forEach((f, i) => osc('triangle', f, t + i * .1, .22, .16, sfxG)); },
    over() { if (!on.sfx || !actx) return; const t = actx.currentTime; [400, 340, 260, 180].forEach((f, i) => osc('sawtooth', f, t + i * .16, .3, .16, sfxG, f * .6)); },
    star() { if (!on.sfx || !actx) return; const t = actx.currentTime; osc('sine', 900, t, .18, .13, sfxG, 1500); }
  };

  const SCALE = [0, 2, 3, 5, 7, 8, 10];
  function playMus(themeIdx) {
    stopMus();
    if (!on.music || !actx) return;
    const root = 220 * Math.pow(2, ((themeIdx * 3) % 12) / 12), bpm = 122, step = 60 / bpm / 2;
    musStep = 0;
    const tick = () => {
      if (!on.music) return;
      const t = actx.currentTime + .02;
      const deg = SCALE[Math.floor(musStep / 2) % SCALE.length], oct = Math.floor(musStep / 14) % 2;
      if (musStep % 4 === 0) osc('triangle', root * Math.pow(2, oct - 1), t, step * 3.6, .1, musG, root * Math.pow(2, oct - 1) * .7);
      if (musStep % 2 === 0) osc('square', root * Math.pow(2, deg / 12), t, step * .9, .045, musG);
      if (musStep % 8 === 6) noise(t, .05, .05, musG, 2000);
      musStep++;
    };
    tick();
    musTimer = setInterval(tick, step * 1000);
  }
  function stopMus() { if (musTimer) { clearInterval(musTimer); musTimer = null; } }
  function setOn(k, v) { on[k] = v; if (k === 'music' && !v) stopMus(); }

  return {unlock, sfx, playMus, stopMus, setOn, isOn: k => on[k]};
})();
