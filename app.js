/* до нового года · зимняя ночь — интерактив
   снег слоями: дальняя пыль, нормальные снежинки с продолговатым шлейфом,
   крупный расфокус у «камеры», плывущая снежная мгла, искры и отсчёт
   до нового 2027 года. картинок нет: всё нарисовано и спето на месте.
   палитра и настроение — с кадра «Жил-был пёс» (1982). */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- отсчёт до нового 2027 года (по Москве) ---------------- */

  var TARGET = Date.UTC(2027, 0, 1) - 3 * 3600 * 1000; // 01.01.2027 00:00 МСК
  var out = {
    d: document.getElementById('cd-d'),
    h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'),
    s: document.getElementById('cd-s')
  };
  var celebrated = false;

  function put(el, value) {
    var text = value < 10 ? '0' + value : String(value);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('blink');
    void el.offsetWidth;
    el.classList.add('blink');
  }

  function tick() {
    var diff = TARGET - Date.now();
    if (diff <= 0) {
      out.d.textContent = '0';
      out.h.textContent = '00';
      out.m.textContent = '00';
      out.s.textContent = '00';
      if (!celebrated) {
        celebrated = true;
        document.getElementById('countdown').classList.add('hit');
        blizzardNow();
        for (var i = 0; i < 14; i++) {
          addSparkle(W * (0.08 + Math.random() * 0.84), H * (0.08 + Math.random() * 0.5), 42, 2.3);
        }
      }
      return;
    }
    put(out.d, Math.floor(diff / 86400000));
    put(out.h, Math.floor(diff % 86400000 / 3600000));
    put(out.m, Math.floor(diff % 3600000 / 60000));
    put(out.s, Math.floor(diff % 60000 / 1000));
  }

  /* ---------------- звук: низкий гул метели и редкие колокольчики ---------------- */

  var Audio_ = {
    ctx: null, master: null, on: false, timer: null,

    boot: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);

      // шум ветра
      var len = Math.floor(ctx.sampleRate * 4);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.4;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 0.7;
      var wind = ctx.createGain();
      wind.gain.value = 0.55;
      src.connect(lp); lp.connect(wind); wind.connect(this.master);
      src.start();

      // низкий гул глубины
      var drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 51;
      var dg = ctx.createGain();
      dg.gain.value = 0.14;
      drone.connect(dg); dg.connect(this.master);
      drone.start();

      // дыхание ветра
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain); lfoGain.connect(wind.gain);
      lfo.start();

      var self = this;
      var chime = function () {
        if (self.on) self.bell(0.04);
        self.timer = setTimeout(chime, 8000 + Math.random() * 14000);
      };
      this.timer = setTimeout(chime, 6000);
    },

    bell: function (level, freq) {
      if (!this.ctx || !this.on) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var f = freq || [329.63, 392, 440, 523.25, 587.33, 659.25][Math.floor(Math.random() * 6)];
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(level, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      g.connect(this.master);
      [[1, 1], [2.005, 0.28], [2.98, 0.12]].forEach(function (pair) {
        var o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * pair[0];
        var og = ctx.createGain();
        og.gain.value = pair[1];
        o.connect(og); og.connect(g);
        o.start(t); o.stop(t + 3.8);
      });
    },

    toggle: function () {
      this.boot();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.on = !this.on;
      var t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this.on ? 0.42 : 0, t + (this.on ? 3 : 1.2));
      return this.on;
    }
  };

  /* ---------------- снег ---------------- */

  var canvas = document.getElementById('snow-canvas');
  var hero = document.getElementById('hero');
  var ctx2d = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var specks = [], flakes = [], bokeh = [], fogs = [], sparkles = [];
  var gust = 0, blizzard = 0;
  var pointer = { x: -999, y: -999 };

  function counts() {
    var a = W * H;
    if (a < 320000) return [200, 110, 7, 4];
    if (a < 800000) return [340, 190, 9, 5];
    if (a < 1600000) return [480, 280, 12, 6];
    return [620, 380, 14, 7];
  }

  function makeSpeck(seed) {
    var z = 0.05 + Math.random() * 0.28;
    return {
      x: Math.random() * W,
      y: seed ? Math.random() * H : -8 - Math.random() * H * 0.3,
      z: z, r: 0.4 + z * 1.9, vy: 0.1 + z * 0.7,
      ph: Math.random() * 6.28, op: 0.12 + z * 0.5
    };
  }

  function makeFlake(seed) {
    var z = 0.25 + Math.pow(Math.random(), 0.8) * 0.75;
    return {
      x: Math.random() * W,
      y: seed ? Math.random() * H : -14 - Math.random() * H * 0.5,
      z: z, r: 0.9 + z * 3.2, vy: 0.3 + z * 1.9,
      sway: 6 + Math.random() * 26, ph: Math.random() * 6.28,
      op: 0.3 + z * 0.62, stretch: 0.5 + z * 1.1,
      tw: Math.random() < 0.3, twph: Math.random() * 6.28
    };
  }

  function makeBokeh(seed) {
    var r = 5 + Math.random() * 11;
    return {
      x: Math.random() * W,
      y: seed ? Math.random() * H : -r * 2 - Math.random() * H * 0.3,
      r: r, vy: 1.5 + Math.random() * 2.4,
      sway: 10 + Math.random() * 34, ph: Math.random() * 6.28,
      op: 0.08 + Math.random() * 0.12
    };
  }

  function makeFog() {
    return {
      x: Math.random() * W, y: H * (0.45 + Math.random() * 0.5),
      rx: 140 + Math.random() * 260, ry: 26 + Math.random() * 60,
      vx: 0.25 + Math.random() * 0.55, op: 0.02 + Math.random() * 0.05,
      ph: Math.random() * 6.28
    };
  }

  var sceneEl = document.getElementById('scene');
  var branch = document.getElementById('branch');
  var branchGhost = null;

  // «видоискатель»: под любой экран собираем кадр целиком,
  // чтобы и справа был забор с веткой, и слева — дома с окнами
  function fitScene() {
    var ar = W / H;
    var vw, vh;
    if (ar * 560 >= 420) {
      vh = 560;
      vw = 560 * ar;
    } else {
      vw = 420;
      vh = 420 / ar;
    }
    var vx = Math.max(150, Math.min(580, 500 - vw / 2));
    var vy = 560 - vh;
    sceneEl.setAttribute('viewBox', [vx.toFixed(1), vy.toFixed(1), vw.toFixed(1), vh.toFixed(1)].join(' '));

    // ветка всегда в кадре: если кадр уехал влево — ветка растёт с левого края
    if (branch) {
      if (vx + vw < 980) {
        if (!branchGhost) {
          branchGhost = branch.cloneNode(true);
          branchGhost.removeAttribute('id');
          branchGhost.removeAttribute('role');
          branchGhost.removeAttribute('tabindex');
          branchGhost.setAttribute('aria-hidden', 'true');
          branchGhost.style.pointerEvents = 'none';
          branchGhost.style.transformOrigin = '1000px 0px';
          sceneEl.appendChild(branchGhost);
        }
        var tx = vx + vw;
        branchGhost.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + vy.toFixed(1) + 'px) scale(-1,1)';
      } else if (branchGhost) {
        branchGhost.remove();
        branchGhost = null;
      }
    }
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    fitScene();
    var c = counts();
    fill(specks, c[0], makeSpeck);
    fill(flakes, c[1], makeFlake);
    fill(bokeh, c[2], makeBokeh);
    fill(fogs, c[3], makeFog);
  }

  function fill(arr, want, make) {
    while (arr.length < want) arr.push(make(true));
    if (arr.length > want) arr.length = want;
  }

  function addSparkle(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283;
      var s = (0.4 + Math.random()) * (power || 1);
      sparkles.push({
        x: x, y: y,
        vx: Math.cos(a) * s * 2.4, vy: Math.sin(a) * s * 2.4 - 0.6,
        life: 1, r: 0.8 + Math.random() * 2.4,
        warm: Math.random() < 0.3
      });
    }
    if (sparkles.length > 900) sparkles.splice(0, sparkles.length - 900);
  }

  function blizzardNow() {
    blizzard = 1;
    gust = (Math.random() < 0.5 ? -1 : 1) * 1.8;
    Audio_.bell(0.035, 261.63);
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(50, now - last) / 16.6667;
    last = now;
    ctx2d.clearRect(0, 0, W, H);

    gust *= Math.pow(0.985, dt);
    blizzard = Math.max(0, blizzard - 0.0032 * dt);

    var windBase = Math.sin(now * 0.00012) * 0.4 + Math.sin(now * 0.00037) * 0.2;
    var wind = windBase + gust + blizzard * 2.6;

    ctx2d.lineCap = 'round';

    /* снежная мгла: то, что делает воздух объёмным */
    for (var g = 0; g < fogs.length; g++) {
      var fo = fogs[g];
      fo.ph += 0.004 * dt;
      fo.x += (fo.vx + wind * 0.25) * dt;
      fo.y += Math.sin(fo.ph) * 0.12 * dt;
      if (fo.x - fo.rx > W) { fo.x = -fo.rx; fo.y = H * (0.45 + Math.random() * 0.5); }
      var fg = ctx2d.createRadialGradient(fo.x, fo.y, 0, fo.x, fo.y, fo.rx);
      fg.addColorStop(0, 'rgba(198,220,244,' + (fo.op * (1 + blizzard)).toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(198,220,244,0)');
      ctx2d.save();
      ctx2d.translate(fo.x, fo.y);
      ctx2d.scale(1, fo.ry / fo.rx);
      ctx2d.translate(-fo.x, -fo.y);
      ctx2d.fillStyle = fg;
      ctx2d.beginPath();
      ctx2d.arc(fo.x, fo.y, fo.rx, 0, 6.283);
      ctx2d.fill();
      ctx2d.restore();
    }

    /* дальняя пыль: почти невидимая, но без неё нет глубины */
    for (var i = 0; i < specks.length; i++) {
      var p = specks[i];
      p.ph += 0.01 * dt;
      p.x += (wind * (0.2 + p.z) + Math.sin(p.ph) * 0.12) * dt;
      p.y += p.vy * (1 + blizzard * 1.4) * dt;
      if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
      if (p.x > W + 12) p.x = -10; else if (p.x < -12) p.x = W + 10;
      ctx2d.globalAlpha = p.op * (0.75 + blizzard * 0.35);
      ctx2d.fillStyle = '#c3d6ee';
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.r, 0, 6.283);
      ctx2d.fill();
    }

    /* основные снежинки: продолговатые, со шлейфом по ветру */
    for (var k = 0; k < flakes.length; k++) {
      var f = flakes[k];
      f.ph += 0.012 * dt;
      f.twph += 0.05 * dt;
      var vx = wind * (0.3 + f.z) + Math.sin(f.ph) * f.sway * 0.02;
      var vy = f.vy * (1 + blizzard * 1.7);

      // снег обходит курсор — как тёплое дыхание
      var dx = f.x - pointer.x, dy = f.y - pointer.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 11000 && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var push = (105 - d) / 105 * 1.6 * f.z;
        vx += (dx / d) * push;
        vy += (dy / d) * push * 0.55;
      }

      f.x += vx * dt;
      f.y += vy * dt;

      if (f.y > H + 16) { f.y = -16; f.x = Math.random() * W; }
      if (f.x > W + 24) f.x = -20; else if (f.x < -24) f.x = W + 20;

      var ang = Math.atan2(vy, vx);
      var alpha = f.op * (0.8 + blizzard * 0.3);
      if (f.tw) alpha *= 0.65 + 0.35 * Math.sin(f.twph);

      // сама снежинка: почти круглая, лишь чуть вытянутая по движению
      ctx2d.globalAlpha = alpha;
      ctx2d.fillStyle = f.z > 0.72 ? '#f4f9ff' : '#d8e6f6';
      ctx2d.save();
      ctx2d.translate(f.x, f.y);
      ctx2d.rotate(ang);
      ctx2d.beginPath();
      ctx2d.ellipse(0, 0, f.r * (1 + Math.min(0.18, f.stretch * 0.08)), f.r * 0.95, 0, 0, 6.283);
      ctx2d.fill();
      ctx2d.restore();
    }

    /* расфокус у камеры */
    for (var b = 0; b < bokeh.length; b++) {
      var bo = bokeh[b];
      bo.ph += 0.008 * dt;
      bo.x += (wind * 1.5 + Math.sin(bo.ph) * 0.5) * dt;
      bo.y += bo.vy * (1 + blizzard * 1.2) * dt;
      if (bo.y - bo.r > H) { bo.y = -bo.r * 2; bo.x = Math.random() * W; }
      if (bo.x - bo.r > W) bo.x = -bo.r; else if (bo.x + bo.r < 0) bo.x = W + bo.r;
      var bg = ctx2d.createRadialGradient(bo.x, bo.y, 0, bo.x, bo.y, bo.r);
      bg.addColorStop(0, 'rgba(244,250,255,' + (bo.op * 0.9).toFixed(3) + ')');
      bg.addColorStop(0.55, 'rgba(220,234,250,' + (bo.op * 0.4).toFixed(3) + ')');
      bg.addColorStop(1, 'rgba(220,234,250,0)');
      ctx2d.globalAlpha = 1;
      ctx2d.fillStyle = bg;
      ctx2d.beginPath();
      ctx2d.arc(bo.x, bo.y, bo.r, 0, 6.283);
      ctx2d.fill();
    }

    /* искры от кликов */
    for (var s = sparkles.length - 1; s >= 0; s--) {
      var sp = sparkles[s];
      sp.life -= 0.013 * dt;
      if (sp.life <= 0) { sparkles.splice(s, 1); continue; }
      sp.vy += 0.016 * dt;
      sp.vx *= 0.99; sp.vy *= 0.99;
      sp.x += (sp.vx + wind * 0.5) * dt;
      sp.y += sp.vy * dt;
      ctx2d.globalAlpha = Math.max(0, sp.life) * 0.9;
      ctx2d.fillStyle = sp.warm ? '#ffd8a6' : '#f4f9ff';
      ctx2d.beginPath();
      ctx2d.arc(sp.x, sp.y, sp.r * sp.life, 0, 6.283);
      ctx2d.fill();
    }

    /* редкие редкие звёздочки-искры на небе */
    if (!reduceMotion && Math.random() < 0.02) {
      addSparkle(Math.random() * W, H * (0.05 + Math.random() * 0.3), 2, 0.5);
    }

    ctx2d.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
  tick();
  setInterval(tick, 1000);

  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', function () { pointer.x = pointer.y = -999; });

  canvas.addEventListener('click', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > W || y > H) return;
    gust = Math.max(gust, (Math.random() - 0.4) * 2.4);
    addSparkle(x, y, reduceMotion ? 12 : 30, 1.4);
    Audio_.bell(0.04);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') blizzardNow();
    if (e.key === ' ') { e.preventDefault(); addSparkle(W / 2, H * 0.32, 46, 1.8); }
  });

  /* ---------------- звёздное небо: их почти нет, это снег ---------------- */

  var NS = 'http://www.w3.org/2000/svg';
  var starLayer = document.getElementById('starmap');

  for (var i = 0; i < 34; i++) {
    var sx = Math.random() * 1000;
    var sy = Math.pow(Math.random(), 1.1) * 250;
    var st = document.createElementNS(NS, 'circle');
    st.setAttribute('cx', sx.toFixed(1));
    st.setAttribute('cy', sy.toFixed(1));
    st.setAttribute('r', (0.4 + Math.random() * 1.1).toFixed(2));
    st.setAttribute('fill', '#cfe0f5');
    st.setAttribute('opacity', (0.08 + Math.random() * 0.25).toFixed(2));
    st.setAttribute('class', 'twinkle');
    st.style.setProperty('--d', (4 + Math.random() * 8).toFixed(2) + 's');
    st.style.animationDelay = (-Math.random() * 10).toFixed(2) + 's';
    starLayer.appendChild(st);
  }

  function addStar(x, y, r) {
    var st = document.createElementNS(NS, 'circle');
    st.setAttribute('cx', x.toFixed(1));
    st.setAttribute('cy', y.toFixed(1));
    st.setAttribute('r', String(r));
    st.setAttribute('fill', '#eaf2ff');
    st.setAttribute('class', 'twinkle');
    st.style.setProperty('--d', '4s');
    starLayer.appendChild(st);
    return st;
  }

  document.getElementById('sky-hit').addEventListener('click', function (e) {
    var m = sceneEl.getScreenCTM();
    var px = 500, py = 140;
    if (m) {
      var p = sceneEl.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      var local = p.matrixTransform(m.inverse());
      px = local.x; py = local.y;
    }
    addStar(px, py, 2);
    var r = canvas.getBoundingClientRect();
    addSparkle(e.clientX - r.left, e.clientY - r.top, 22, 1.2);
    Audio_.bell(0.045, 698.46);
  });

  /* ---------------- параллакс: даль ходит за курсором ---------------- */

  var pxLayers = [];
  Array.prototype.forEach.call(document.querySelectorAll('.px'), function (el) {
    pxLayers.push({ el: el, depth: parseFloat(el.getAttribute('data-depth')) || 2 });
  });

  hero.addEventListener('pointermove', function (e) {
    if (reduceMotion) return;
    var r = hero.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width - 0.5;
    var ny = (e.clientY - r.top) / r.height - 0.5;
    starLayer.style.transform = 'translate(' + (-nx * 12).toFixed(1) + 'px,' + (-ny * 6).toFixed(1) + 'px)';
    for (var i = 0; i < pxLayers.length; i++) {
      var l = pxLayers[i];
      l.el.style.transform = 'translate(' + (nx * l.depth).toFixed(1) + 'px,' + (ny * l.depth * 0.35).toFixed(1) + 'px)';
    }
  });

  /* ---------------- ветка: стряхнуть снег ---------------- */

  branch.addEventListener('click', function (e) {
    branch.classList.remove('shaking');
    void branch.getBoundingClientRect();
    branch.classList.add('shaking');
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    for (var i = 0; i < 46; i++) {
      var f = makeFlake(false);
      f.x = x + (Math.random() - 0.5) * 240;
      f.y = y + Math.random() * 46;
      f.z = 0.5 + Math.random() * 0.5;
      f.vy = 1.2 + Math.random() * 2.6;
      flakes.push(f);
    }
    for (var j = 0; j < 3; j++) {
      var fo = makeFog();
      fo.x = x + (Math.random() - 0.5) * 160;
      fo.y = y + 40 + Math.random() * 60;
      fo.op = 0.09;
      fogs.push(fo);
    }
    addSparkle(x, y, 26, 1.1);
    gust = (Math.random() - 0.5) * 1.8;
    Audio_.bell(0.045, 587.33);
  });

  /* ---------------- окна домов: можно подбросить света ---------------- */

  Array.prototype.forEach.call(document.querySelectorAll('.lit'), function (win) {
    win.style.cursor = 'pointer';
    win.addEventListener('click', function (e) {
      e.stopPropagation();
      win.classList.add('warm-burst');
      setTimeout(function () { win.classList.remove('warm-burst'); }, 1400);
      var r = canvas.getBoundingClientRect();
      addSparkle(e.clientX - r.left, e.clientY - r.top, 18, 0.9);
      Audio_.bell(0.04, 349.23);
    });
  });

  /* ---------------- клавиатура тоже кликает ---------------- */

  Array.prototype.forEach.call(document.querySelectorAll('[role="button"]'), function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      var r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2
      }));
    });
  });

  /* ---------------- кнопки ---------------- */

  var soundBtn = document.getElementById('sound');
  soundBtn.addEventListener('click', function () {
    var on = Audio_.toggle();
    soundBtn.classList.toggle('on', on);
    soundBtn.setAttribute('aria-label', on ? 'выключить зимний гул' : 'включить зимний гул');
    soundBtn.setAttribute('title', on ? 'выключить зимний гул' : 'включить зимний гул');
  });

  document.getElementById('gust').addEventListener('click', function () {
    blizzardNow();
    addSparkle(W * 0.5, H * 0.28, 40, 1.7);
  });

  /* ---------------- занавес ---------------- */

  var preloader = document.getElementById('preloader');
  window.addEventListener('load', function () {
    setTimeout(function () { preloader.classList.add('gone'); }, 1600);
  });

})();
