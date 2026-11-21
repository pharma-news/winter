/* до нового года · зимняя ночь — интерактив
   снег слоями, северное сияние, салюты, гирлянда, тени в окнах,
   отсчёт до нового 2027 года. лес и заборы строятся процедурно,
   картинок нет: всё нарисовано и спето на месте.
   палитра и настроение — с кадра «Жил-был пёс» (1982). */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------------- случайность с постоянным зерном ---------------- */

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20270101);
  function rr(a, b) { return a + (b - a) * rnd(); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

  function svgFrag(markup) {
    var doc = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg">' + markup + '</svg>', 'image/svg+xml');
    var frag = document.createDocumentFragment();
    var kids = doc.documentElement.childNodes;
    for (var i = 0; i < kids.length; i++) frag.appendChild(document.importNode(kids[i], true));
    return frag;
  }

  /* ---------------- ёлка: ярусы с провисающими концами и снегом ---------------- */

  function fir(x, gy, h, w, tiers, dark, snowCol, snowOp) {
    var s = '';
    s += '<rect x="' + (x - w * 0.05).toFixed(1) + '" y="' + (gy - h * 0.13).toFixed(1) +
      '" width="' + (w * 0.1).toFixed(1) + '" height="' + (h * 0.15).toFixed(1) + '" fill="' + dark + '"/>';
    for (var i = 0; i < tiers; i++) {
      var f1 = (i + 1) / tiers;
      var topY = gy - h + h * 0.86 * (i / tiers);
      var th = (h * 0.86 / tiers) * 1.34;
      var hw = w * (0.14 + 0.86 * f1) * rr(0.94, 1.06);
      var yb = topY + th;
      var droop = hw * 0.1;
      var sc = h > 70 ? 4 : 3;

      var d = 'M' + x.toFixed(1) + ',' + topY.toFixed(1);
      d += ' Q' + (x + hw * 0.34).toFixed(1) + ',' + (topY + th * 0.4).toFixed(1) +
        ' ' + (x + hw).toFixed(1) + ',' + (yb + droop).toFixed(1);
      for (var j = 1; j <= sc; j++) {
        var xj = x + hw - j * (2 * hw / sc);
        var xm = xj + hw / sc;
        var yEnd = yb + (j === sc ? droop : 0);
        d += ' Q' + xm.toFixed(1) + ',' + (yb + hw * 0.15).toFixed(1) + ' ' + xj.toFixed(1) + ',' + yEnd.toFixed(1);
      }
      d += ' Q' + (x - hw * 0.34).toFixed(1) + ',' + (topY + th * 0.4).toFixed(1) +
        ' ' + x.toFixed(1) + ',' + topY.toFixed(1) + ' Z';
      s += '<path d="' + d + '" fill="' + dark + '"/>';

      var hw2 = hw * (h > 70 ? 0.5 : 0.56);
      var yb2 = topY + th * 0.42;
      var d2 = 'M' + x.toFixed(1) + ',' + (topY + 0.5).toFixed(1);
      d2 += ' Q' + (x + hw2 * 0.55).toFixed(1) + ',' + (topY + th * 0.2).toFixed(1) + ' ' + (x + hw2).toFixed(1) + ',' + yb2.toFixed(1);
      for (var k = 1; k <= sc; k++) {
        var xj2 = x + hw2 - k * (2 * hw2 / sc);
        var xm2 = xj2 + hw2 / sc;
        d2 += ' Q' + xm2.toFixed(1) + ',' + (yb2 + hw2 * 0.14).toFixed(1) + ' ' + xj2.toFixed(1) + ',' + yb2.toFixed(1);
      }
      d2 += ' Q' + (x - hw2 * 0.55).toFixed(1) + ',' + (topY + th * 0.2).toFixed(1) + ' ' + x.toFixed(1) + ',' + (topY + 0.5).toFixed(1) + ' Z';
      s += '<path d="' + d2 + '" fill="' + snowCol + '" opacity="' + snowOp + '"/>';
    }
    return s;
  }

  function buildForestFar() {
    var s = '';
    // тёмный гребень: лес — это край леса, а не отдельные конусы в небе
    s += '<path d="M-580 300 Q-380 294 -180 302 Q0 309 200 300 Q420 292 620 302 Q820 310 1010 300 Q1240 292 1430 302 Q1530 306 1620 300 L1620 336 L-580 336 Z" fill="#01020c" opacity=".92"/>';
    for (var x = -580; x < 1620; x += rr(13, 34)) {
      var near = (x > 600 && x < 1240) ? 0.96 : (x > 100 && x < 480 ? 0.9 : 0.42);
      if (rnd() > near) continue;
      var gy = rr(300, 314);
      var h = rr(20, 54) * (gy > 306 ? 1.12 : 0.9);
      s += fir(x, gy, h, h * rr(0.24, 0.3), h > 40 ? 5 : 4, '#01020c', '#3f5c88', 0.3);
    }
    return s;
  }

  function buildForestMid() {
    var list = [
      { x: -250, gy: 424, h: 122 }, { x: -170, gy: 423, h: 92 },
      { x: 296, gy: 420, h: 104 }, { x: 352, gy: 422, h: 58 },
      { x: 452, gy: 425, h: 118 }, { x: 1062, gy: 415, h: 96 },
      { x: 1136, gy: 413, h: 126 }, { x: 1320, gy: 419, h: 70 },
      { x: 1424, gy: 421, h: 112 }, { x: 1516, gy: 420, h: 84 }
    ];
    var s = '';
    list.forEach(function (t) {
      s += fir(t.x, t.gy, t.h, t.h * rr(0.22, 0.28), t.h > 100 ? 6 : 5,
        '#010209', '#8bb0d6', 0.44);
    });
    return s;
  }

  /* ---------------- забор: горбыли, две жерди, снежные шапки, без крестов ---------------- */

  function fence(x0, x1, step, gy, h, w, dark, snowCol, snowOp, cap) {
    cap = cap || 0.62;
    var s = '';
    var rails = [gy - h * 0.34, gy - h * 0.66];
    rails.forEach(function (ry) {
      s += '<path d="M' + x0 + ',' + (ry + 2).toFixed(1) + ' Q' + ((x0 + x1) / 2).toFixed(1) + ',' +
        (ry + 5).toFixed(1) + ' ' + x1 + ',' + (ry + 1.5).toFixed(1) + '" stroke="' + dark +
        '" stroke-width="' + (w * 0.34).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
    });
    var planks = [];
    var railSnow = [];
    rails.forEach(function (ry, idx) { railSnow.push({ ry: ry, idx: idx }); });

    for (var x = x0; x <= x1;) {
      var hh = h * rr(0.85, 1.15);
      var top = gy - hh;
      var lean = rr(-1.9, 1.9);
      var d = 'M' + x.toFixed(1) + ',' + gy.toFixed(1) +
        ' L' + x.toFixed(1) + ',' + (top + w * 0.55).toFixed(1) +
        ' L' + (x + w / 2).toFixed(1) + ',' + top.toFixed(1) +
        ' L' + (x + w).toFixed(1) + ',' + (top + w * 0.55).toFixed(1) +
        ' L' + (x + w).toFixed(1) + ',' + gy.toFixed(1) + ' Z';
      s += '<g transform="rotate(' + lean.toFixed(2) + ' ' + (x + w / 2).toFixed(1) + ' ' + gy.toFixed(1) + ')">';
      s += '<path d="' + d + '" fill="' + dark + '"/>';
      s += '<path d="M' + (x + w * 0.32).toFixed(1) + ',' + (top + w * 1.1).toFixed(1) + ' L' +
        (x + w * 0.32).toFixed(1) + ',' + (gy - 2).toFixed(1) + '" stroke="#101a38" stroke-opacity=".45" stroke-width="1.1" fill="none"/>';
      s += '<path d="M' + (x - 1).toFixed(1) + ',' + (top + w * 0.52).toFixed(1) + ' Q' + (x + w * 0.42).toFixed(1) + ',' +
        (top - w * cap).toFixed(1) + ' ' + (x + w + 1).toFixed(1) + ',' + (top + w * 0.52).toFixed(1) + ' Q' +
        (x + w / 2).toFixed(1) + ',' + (top + w * 0.9).toFixed(1) + ' ' + (x - 1).toFixed(1) + ',' +
        (top + w * 0.52).toFixed(1) + ' Z" fill="' + snowCol + '" opacity="' + snowOp + '"/>';
      s += '</g>';
      planks.push({ cx: x + w / 2, top: top, w: w, gy: gy });
      x += step * rr(0.8, 1.25);
    }
    // снег на жердях — рваными хлопьями, а не ровной лентой
    railSnow.forEach(function (rl) {
      var px = x0 + 6;
      while (px < x1 - 10) {
        var wlen = rr(6, 16);
        var yTop = rl.ry + (rl.idx ? 1 : 0) - 1.2;
        s += '<path d="M' + px.toFixed(1) + ',' + yTop.toFixed(1) + ' q' + (wlen / 2).toFixed(1) + ',-' +
          rr(2.4, 4).toFixed(1) + ' ' + wlen.toFixed(1) + ',-0.4 q-' + (wlen / 2).toFixed(1) + ',' +
          rr(2, 3.4).toFixed(1) + ' -' + wlen.toFixed(1) + ',0.6 z" fill="' + snowCol + '" opacity="' + (snowOp * 0.8).toFixed(2) + '"/>';
        px += wlen + rr(8, 26);
      }
    });
    return { svg: s, planks: planks };
  }

  function groundDetail(frontPlanks) {
    var s = '';
    // тени горбылей на светлом снегу — свет слева (луна), тень уходит вправо
    frontPlanks.forEach(function (p) {
      s += '<ellipse cx="' + (p.cx + p.w * 1.15).toFixed(1) + '" cy="' + (p.gy + 7).toFixed(1) +
        '" rx="' + (p.w * 2.9).toFixed(1) + '" ry="2.9" fill="#2b4d8c" fill-opacity=".38"/>';
      s += '<path d="M' + (p.cx - p.w * 0.4).toFixed(1) + ',' + (p.gy + 4).toFixed(1) + ' L' +
        (p.cx + p.w * 4.4).toFixed(1) + ',' + (p.gy + 10).toFixed(1) + ' L' + (p.cx + p.w * 4.2).toFixed(1) + ',' +
        (p.gy + 13).toFixed(1) + ' L' + (p.cx - p.w * 0.5).toFixed(1) + ',' + (p.gy + 7).toFixed(1) +
        ' Z" fill="#2b4d8c" fill-opacity=".26"/>';
    });
    // тени изб
    s += '<ellipse cx="200" cy="404" rx="104" ry="9" fill="#101f47" fill-opacity=".4"/>';
    s += '<ellipse cx="628" cy="386" rx="72" ry="7" fill="#101f47" fill-opacity=".36"/>';
    // травинки: тонкие, низкие, только у оснований
    var spots = [
      { x: 74, y: 456, s: 1 }, { x: 262, y: 434, s: .8 }, { x: 486, y: 470, s: 1 },
      { x: -330, y: 512, s: .9 }, { x: 1268, y: 500, s: 1 }, { x: 604, y: 470, s: .8 },
      { x: 1420, y: 540, s: .9 }
    ];
    spots.forEach(function (sp) {
      var n = 2 + Math.floor(rnd() * 3);
      for (var i = 0; i < n; i++) {
        var hgt = rr(2.2, 4.6) * sp.s;
        var lean = rr(-1.8, 1.8);
        s += '<path d="M' + (sp.x + i * 1.5).toFixed(1) + ',' + sp.y.toFixed(1) + ' q' +
          (lean * 0.4).toFixed(1) + ',' + (-hgt * 0.6).toFixed(1) + ' ' + lean.toFixed(1) + ',' + (-hgt).toFixed(1) +
          '" stroke="#04061a" stroke-opacity=".62" stroke-width=".8" fill="none" stroke-linecap="round"/>';
      }
      s += '<ellipse cx="' + (sp.x + 1.6).toFixed(1) + '" cy="' + (sp.y + 0.8).toFixed(1) + '" rx="' + rr(2.2, 4.2).toFixed(1) +
        '" ry="1.1" fill="#dcebf8" fill-opacity=".3"/>';
    });
    // редкие снежные хлопья, уже лёгшие на снег
    for (var q = 0; q < 26; q++) {
      var bx = rr(-560, 1560), by = rr(430, 700);
      s += '<ellipse cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" rx="' + rr(2, 5).toFixed(1) +
        '" ry="' + rr(0.8, 1.6).toFixed(1) + '" fill="#f2f8ff" fill-opacity="' + rr(0.12, 0.3).toFixed(2) + '"/>';
    }
    return s;
  }

  /* ---------------- собрать сцену ---------------- */

  document.getElementById('forest-far').appendChild(svgFrag(buildForestFar()));
  document.getElementById('forest-mid').appendChild(svgFrag(buildForestMid()));

  var fenceMid = fence(-120, 470, 25, 476, 74, 6, '#01020c', '#c3d8ee', 0.75, 0.5);
  document.getElementById('fence-mid').appendChild(svgFrag(fenceMid.svg));

  var fenceFront = fence(700, 1340, 30, 578, 150, 11, '#01020a', '#e6f0fb', 0.88, 0.4);
  document.getElementById('fence-front').appendChild(svgFrag(fenceFront.svg));

  document.getElementById('ground-detail').appendChild(svgFrag(groundDetail(fenceFront.planks)));

  /* ---------------- отсчёт до нового 2027 года (по Москве) ---------------- */

  var TARGET = Date.UTC(2027, 0, 1) - 3 * 3600 * 1000;
  var out = {
    d: document.getElementById('cd-d'), h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'), s: document.getElementById('cd-s')
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
      out.d.textContent = '0'; out.h.textContent = '00';
      out.m.textContent = '00'; out.s.textContent = '00';
      if (!celebrated) {
        celebrated = true;
        document.getElementById('countdown').classList.add('hit');
        blizzardNow();
        show(4, 0);
      }
      return;
    }
    put(out.d, Math.floor(diff / 86400000));
    put(out.h, Math.floor(diff % 86400000 / 3600000));
    put(out.m, Math.floor(diff % 3600000 / 60000));
    put(out.s, Math.floor(diff % 60000 / 1000));
  }

  /* ---------------- звук ---------------- */

  var Audio_ = {
    ctx: null, master: null, on: false, timer: null, noiseBuf: null,

    boot: function () {
      if (this.ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);

      var len = Math.floor(ctx.sampleRate * 4);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      var last = 0;
      for (var i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.4;
      }
      this.noiseBuf = buf;

      var src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 0.7;
      var wind = ctx.createGain();
      wind.gain.value = 0.55;
      src.connect(lp); lp.connect(wind); wind.connect(this.master);
      src.start();

      var drone = ctx.createOscillator();
      drone.type = 'sine'; drone.frequency.value = 51;
      var dg = ctx.createGain(); dg.gain.value = 0.13;
      drone.connect(dg); dg.connect(this.master);
      drone.start();

      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      var lfoGain = ctx.createGain(); lfoGain.gain.value = 0.3;
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
      var ctx = this.ctx, t = ctx.currentTime;
      var f = freq || [329.63, 392, 440, 523.25, 587.33, 659.25][Math.floor(Math.random() * 6)];
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(level, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      g.connect(this.master);
      [[1, 1], [2.005, 0.28], [2.98, 0.12]].forEach(function (pair) {
        var o = ctx.createOscillator();
        o.type = 'sine'; o.frequency.value = f * pair[0];
        var og = ctx.createGain(); og.gain.value = pair[1];
        o.connect(og); og.connect(g);
        o.start(t); o.stop(t + 3.8);
      });
    },

    boom: function (power) {
      if (!this.ctx || !this.on) return;
      var ctx = this.ctx, t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(84, t);
      o.frequency.exponentialRampToValueAtTime(34, t + 0.55);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.3 * power, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 1);

      var n = ctx.createBufferSource();
      n.buffer = this.noiseBuf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.8;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.linearRampToValueAtTime(0.16 * power, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      n.connect(bp); bp.connect(ng); ng.connect(this.master);
      n.start(t); n.stop(t + 1.6);
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

  /* ---------------- небо и земля: размер и «видоискатель» ---------------- */

  var canvas = document.getElementById('snow-canvas');
  var hero = document.getElementById('hero');
  var sceneEl = document.getElementById('scene');
  var branch = document.getElementById('branch');
  var ctx2d = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var branchAnchor = document.getElementById('branch-anchor');
  var view = { vx: 153, vy: 0, vw: 794, vh: 560 };

  function fitScene() {
    var ar = W / H;
    var vw, vh;
    if (ar * 560 >= 420) { vh = 560; vw = 560 * ar; }
    else { vw = 420; vh = 420 / ar; }
    var vx = Math.max(-400, Math.min(580, 500 - vw / 2));
    var vy = 560 - vh;
    view = { vx: vx, vy: vy, vw: vw, vh: vh };
    sceneEl.setAttribute('viewBox', [vx.toFixed(1), vy.toFixed(1), vw.toFixed(1), vh.toFixed(1)].join(' '));

    // ветка всегда привязана к правому верхнему углу видимого кадра:
    // ни зеркал, ни обрезанных половин, ни «облаков» по углам
    if (branchAnchor) {
      var dx = vx + vw - 1000;
      var dy = Math.max(vy + 6, -26);
      branchAnchor.setAttribute('transform', 'translate(' + dx.toFixed(1) + ',' + dy.toFixed(1) + ')');
    }
  }

  /* ---------------- снег ---------------- */

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
    return { x: Math.random() * W, y: seed ? Math.random() * H : -8 - Math.random() * H * 0.3,
      z: z, r: 0.4 + z * 1.9, vy: 0.1 + z * 0.7, ph: Math.random() * 6.28, op: 0.12 + z * 0.5 };
  }
  function makeFlake(seed) {
    var z = 0.25 + Math.pow(Math.random(), 0.8) * 0.75;
    return { x: Math.random() * W, y: seed ? Math.random() * H : -14 - Math.random() * H * 0.5,
      z: z, r: 0.9 + z * 3.2, vy: 0.3 + z * 1.9, sway: 6 + Math.random() * 26,
      ph: Math.random() * 6.28, op: 0.3 + z * 0.62, stretch: 0.5 + z * 1.1,
      tw: Math.random() < 0.3, twph: Math.random() * 6.28 };
  }
  function makeBokeh(seed) {
    var r = 5 + Math.random() * 11;
    return { x: Math.random() * W, y: seed ? Math.random() * H : -r * 2 - Math.random() * H * 0.3,
      r: r, vy: 1.5 + Math.random() * 2.4, sway: 10 + Math.random() * 34,
      ph: Math.random() * 6.28, op: 0.08 + Math.random() * 0.12 };
  }
  function makeFog() {
    return { x: Math.random() * W, y: H * (0.45 + Math.random() * 0.5),
      rx: 140 + Math.random() * 260, ry: 26 + Math.random() * 60,
      vx: 0.25 + Math.random() * 0.55, op: 0.02 + Math.random() * 0.05, ph: Math.random() * 6.28 };
  }
  function fill(arr, want, make) {
    while (arr.length < want) arr.push(make(true));
    if (arr.length > want) arr.length = want;
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

  function addSparkle(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283;
      var s = (0.4 + Math.random()) * (power || 1);
      sparkles.push({ x: x, y: y, vx: Math.cos(a) * s * 2.4, vy: Math.sin(a) * s * 2.4 - 0.6,
        life: 1, r: 0.8 + Math.random() * 2.4, warm: Math.random() < 0.3 });
    }
    if (sparkles.length > 900) sparkles.splice(0, sparkles.length - 900);
  }

  function blizzardNow() {
    blizzard = 1;
    gust = (Math.random() < 0.5 ? -1 : 1) * 1.8;
    Audio_.bell(0.035, 261.63);
  }

  /* ---------------- северное сияние ---------------- */

  var aurora = { t0: -1, dur: 0, next: 12000, hue: 150 };

  function auroraStart() {
    aurora.t0 = performance.now();
    aurora.dur = 26000 + Math.random() * 34000;
    aurora.hue = pick([148, 156, 168, 138]);
    aurora.next = performance.now() + 70000 + Math.random() * 120000;
    Audio_.bell(0.03, 261.63);
  }

  function drawAurora(now) {
    if (aurora.t0 < 0) return;
    var p = (now - aurora.t0) / aurora.dur;
    if (p >= 1) { aurora.t0 = -1; return; }
    var env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, p))), 1.1);
    if (env < 0.01) return;

    ctx2d.save();
    ctx2d.globalCompositeOperation = 'lighter';
    var rays = 15;
    for (var i = 0; i < rays; i++) {
      var u = i / (rays - 1);
      var sway = Math.sin(now * 0.00012 + i * 1.9) + 0.4 * Math.sin(now * 0.00031 + i * 0.7);
      var bx = W * (0.06 + u * 0.88) + sway * W * 0.028;
      var skew = Math.sin(now * 0.00006 + i * 1.1) * W * 0.05;
      var top = H * (0.0 + 0.03 * Math.sin(now * 0.00009 + i));
      var bot = H * (0.40 + 0.1 * Math.sin(now * 0.00011 + i * 0.8));
      var wd = W * (0.018 + 0.05 * Math.abs(Math.sin(now * 0.00007 + i * 2.3)));
      var a = env * (0.2 - 0.06 * Math.abs(u - 0.45)) * (0.6 + 0.4 * Math.sin(now * 0.0002 + i * 3.1));
      if (a <= 0.001) continue;
      var g = ctx2d.createLinearGradient(bx, top, bx, bot);
      g.addColorStop(0, 'hsla(' + (aurora.hue + 18) + ',80%,62%,0)');
      g.addColorStop(0.22, 'hsla(' + aurora.hue + ',78%,58%,' + (a * 0.75).toFixed(3) + ')');
      g.addColorStop(0.55, 'hsla(' + (aurora.hue - 12) + ',74%,52%,' + a.toFixed(3) + ')');
      g.addColorStop(1, 'hsla(' + (aurora.hue - 26) + ',70%,44%,0)');
      ctx2d.fillStyle = g;
      ctx2d.beginPath();
      ctx2d.moveTo(bx - wd, top);
      ctx2d.lineTo(bx + wd, top);
      ctx2d.lineTo(bx + wd + skew, bot);
      ctx2d.lineTo(bx - wd + skew, bot);
      ctx2d.closePath();
      ctx2d.fill();

      // фиолетовая кайма по краю занавеса
      if (i % 3 === 0) {
        var g2 = ctx2d.createLinearGradient(bx, top, bx, bot * 0.7);
        g2.addColorStop(0, 'hsla(268,70%,66%,' + (a * 0.5).toFixed(3) + ')');
        g2.addColorStop(1, 'hsla(268,70%,60%,0)');
        ctx2d.fillStyle = g2;
        ctx2d.beginPath();
        ctx2d.moveTo(bx - wd * 1.9, top);
        ctx2d.lineTo(bx - wd * 0.7, top);
        ctx2d.lineTo(bx - wd * 0.7 + skew, bot * 0.7);
        ctx2d.lineTo(bx - wd * 1.9 + skew, bot * 0.7);
        ctx2d.closePath();
        ctx2d.fill();
      }
    }
    ctx2d.restore();
  }

  /* ---------------- салюты: редко, долго, красиво ---------------- */

  var shells = [], parts = [], flashes = [], pending = [];
  var fwNext = 18000;
  var HUES = [42, 18, 205, 152, 8, 320, 190];

  function launch(who, apexLo, apexHi) {
    var x = W * (0.12 + Math.random() * 0.76);
    var apex = H * (apexLo + Math.random() * (apexHi - apexLo));
    shells.push({
      x: x, y: H * 0.98, vy: -(3.6 + Math.random() * 1.4), apex: apex,
      hue: pick(HUES), big: who === 'big'
    });
  }

  function burst(x, y, hue, big) {
    var n = big ? 150 + Math.floor(Math.random() * 70) : 60 + Math.floor(Math.random() * 40);
    var speed = big ? 3.4 : 2.2;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283;
      var sp = speed * (0.28 + Math.pow(Math.random(), 0.5) * 0.72);
      parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        age: 0, life: 1.5 + Math.random() * 1.5, grav: 0.055, drag: 0.985,
        r: 0.9 + Math.random() * 1.5, hue: hue + (Math.random() * 26 - 13),
        sat: 82, lit: 62 + Math.random() * 14, glitter: false, fl: Math.random() * 6.28
      });
    }
    // долго падающие блёстки — «продолжительно»
    var gn = big ? 60 : 26;
    for (var k = 0; k < gn; k++) {
      var a2 = Math.random() * 6.283;
      var sp2 = speed * (0.16 + Math.random() * 0.4);
      parts.push({
        x: x, y: y, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2,
        age: 0, life: 2.2 + Math.random() * 1.6, grav: 0.018, drag: 0.995,
        r: 0.7 + Math.random() * 1.1, hue: hue + (Math.random() * 40 - 20),
        sat: 60, lit: 78, glitter: true, fl: Math.random() * 6.28
      });
    }
    flashes.push({ x: x, y: y, life: 1, r: big ? 130 : 78, hue: hue });
    // добивающие щелчки рядом
    var extra = big ? 3 : 1;
    for (var m = 0; m < extra; m++) {
      pending.push({
        at: performance.now() + 350 + Math.random() * 900,
        x: x + (Math.random() - 0.5) * (W * 0.09),
        y: y + (Math.random() - 0.5) * (H * 0.07),
        hue: pick(HUES), big: false
      });
    }
    Audio_.boom(big ? 1 : 0.5);
  }

  function show(n, gapMs) {
    for (var i = 0; i < n; i++) {
      (function (idx) {
        setTimeout(function () { launch(idx === 0 ? 'big' : 'small', 0.09, 0.26); }, idx * (gapMs + Math.random() * 500));
      })(i);
    }
    fwNext = performance.now() + 90000 + Math.random() * 130000;
  }

  function drawFireworks(now, dt, wind) {
    for (var i = shells.length - 1; i >= 0; i--) {
      var s = shells[i];
      s.vy += 0.02 * dt;
      s.y += s.vy * dt;
      s.x += wind * 0.25 * dt;
      if (s.y <= s.apex || s.vy > -0.5) {
        burst(s.x, s.y, s.hue, s.big);
        shells.splice(i, 1);
        continue;
      }
      ctx2d.globalCompositeOperation = 'lighter';
      ctx2d.globalAlpha = 0.5;
      ctx2d.strokeStyle = 'hsla(40,90%,74%,.7)';
      ctx2d.lineWidth = 1.4;
      ctx2d.beginPath();
      ctx2d.moveTo(s.x, s.y);
      ctx2d.lineTo(s.x - wind * 0.4, s.y - s.vy * 5.5);
      ctx2d.stroke();
      ctx2d.globalAlpha = 1;
      ctx2d.fillStyle = 'hsla(45,95%,82%,.95)';
      ctx2d.beginPath();
      ctx2d.arc(s.x, s.y, 1.6, 0, 6.283);
      ctx2d.fill();
    }

    for (var p = parts.length - 1; p >= 0; p--) {
      var q = parts[p];
      q.age += dt * 0.0167;
      if (q.age >= q.life) { parts.splice(p, 1); continue; }
      q.vy += q.grav * dt;
      q.vx *= Math.pow(q.drag, dt);
      q.vy *= Math.pow(q.drag, dt);
      q.x += (q.vx + wind * 0.4) * dt;
      q.y += q.vy * dt;

      var t = 1 - q.age / q.life;
      var a = t * (q.glitter ? Math.pow(Math.max(0, Math.sin(q.age * 13 + q.fl)), 2) : (0.72 + 0.28 * Math.sin(q.age * 30 + q.fl)));
      if (a <= 0.004) continue;
      ctx2d.globalCompositeOperation = 'lighter';
      var col = 'hsla(' + q.hue.toFixed(0) + ',' + q.sat + '%,' + q.lit.toFixed(0) + '%,' + a.toFixed(3) + ')';
      if (!q.glitter) {
        ctx2d.strokeStyle = col;
        ctx2d.lineWidth = q.r * 0.85;
        ctx2d.beginPath();
        ctx2d.moveTo(q.x - q.vx * 1.7, q.y - q.vy * 1.7);
        ctx2d.lineTo(q.x, q.y);
        ctx2d.stroke();
      }
      ctx2d.fillStyle = col;
      ctx2d.beginPath();
      ctx2d.arc(q.x, q.y, q.r * (q.glitter ? 1 : t * 0.7 + 0.3), 0, 6.283);
      ctx2d.fill();
    }

    for (var f = flashes.length - 1; f >= 0; f--) {
      var fl = flashes[f];
      fl.life -= 0.055 * dt;
      if (fl.life <= 0) { flashes.splice(f, 1); continue; }
      var ra = fl.r * (1.25 - fl.life * 0.4);
      var g = ctx2d.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, ra);
      g.addColorStop(0, 'hsla(' + fl.hue.toFixed(0) + ',88%,74%,' + (fl.life * 0.4).toFixed(3) + ')');
      g.addColorStop(1, 'hsla(' + fl.hue.toFixed(0) + ',88%,60%,0)');
      ctx2d.globalCompositeOperation = 'lighter';
      ctx2d.fillStyle = g;
      ctx2d.beginPath();
      ctx2d.arc(fl.x, fl.y, ra, 0, 6.283);
      ctx2d.fill();
    }
    ctx2d.globalCompositeOperation = 'source-over';
  }

  /* ---------------- главный цикл ---------------- */

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(50, now - last) / 16.6667;
    last = now;
    ctx2d.clearRect(0, 0, W, H);

    gust *= Math.pow(0.985, dt);
    blizzard = Math.max(0, blizzard - 0.0032 * dt);

    var windBase = Math.sin(now * 0.00012) * 0.4 + Math.sin(now * 0.00037) * 0.2;
    var wind = windBase + gust + blizzard * 2.6;

    drawAurora(now);

    if (!document.hidden) {
      if (aurora.t0 < 0 && now > aurora.next) auroraStart();
      if (now > fwNext) show(1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0), 700);
    }
    while (pending.length) {
      var pd = pending[0];
      if (pd.at <= now) { pending.shift(); burst(pd.x, pd.y, pd.hue, pd.big); }
      else break;
    }
    drawFireworks(now, dt, wind);

    ctx2d.lineCap = 'round';

    for (var g2 = 0; g2 < fogs.length; g2++) {
      var fo = fogs[g2];
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

    for (var i = 0; i < specks.length; i++) {
      var p2 = specks[i];
      p2.ph += 0.01 * dt;
      p2.x += (wind * (0.2 + p2.z) + Math.sin(p2.ph) * 0.12) * dt;
      p2.y += p2.vy * (1 + blizzard * 1.4) * dt;
      if (p2.y > H + 8) { p2.y = -8; p2.x = Math.random() * W; }
      if (p2.x > W + 12) p2.x = -10; else if (p2.x < -12) p2.x = W + 10;
      ctx2d.globalAlpha = p2.op * (0.75 + blizzard * 0.35);
      ctx2d.fillStyle = '#c3d6ee';
      ctx2d.beginPath();
      ctx2d.arc(p2.x, p2.y, p2.r, 0, 6.283);
      ctx2d.fill();
    }

    for (var k = 0; k < flakes.length; k++) {
      var f2 = flakes[k];
      f2.ph += 0.012 * dt;
      f2.twph += 0.05 * dt;
      var vx = wind * (0.3 + f2.z) + Math.sin(f2.ph) * f2.sway * 0.02;
      var vy = f2.vy * (1 + blizzard * 1.7);

      var dx = f2.x - pointer.x, dy = f2.y - pointer.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 11000 && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var push = (105 - d) / 105 * 1.6 * f2.z;
        vx += (dx / d) * push;
        vy += (dy / d) * push * 0.55;
      }

      f2.x += vx * dt;
      f2.y += vy * dt;

      if (f2.y > H + 16) { f2.y = -16; f2.x = Math.random() * W; }
      if (f2.x > W + 24) f2.x = -20; else if (f2.x < -24) f2.x = W + 20;

      var ang = Math.atan2(vy, vx);
      var alpha = f2.op * (0.8 + blizzard * 0.3);
      if (f2.tw) alpha *= 0.65 + 0.35 * Math.sin(f2.twph);

      ctx2d.globalAlpha = alpha;
      ctx2d.fillStyle = f2.z > 0.72 ? '#f4f9ff' : '#d8e6f6';
      ctx2d.save();
      ctx2d.translate(f2.x, f2.y);
      ctx2d.rotate(ang);
      ctx2d.beginPath();
      ctx2d.ellipse(0, 0, f2.r * (1 + Math.min(0.18, f2.stretch * 0.08)), f2.r * 0.95, 0, 0, 6.283);
      ctx2d.fill();
      ctx2d.restore();
    }

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

    for (var sp = sparkles.length - 1; sp >= 0; sp--) {
      var s3 = sparkles[sp];
      s3.life -= 0.013 * dt;
      if (s3.life <= 0) { sparkles.splice(sp, 1); continue; }
      s3.vy += 0.016 * dt;
      s3.vx *= 0.99; s3.vy *= 0.99;
      s3.x += (s3.vx + wind * 0.5) * dt;
      s3.y += s3.vy * dt;
      ctx2d.globalCompositeOperation = 'lighter';
      ctx2d.globalAlpha = Math.max(0, s3.life) * 0.9;
      ctx2d.fillStyle = s3.warm ? '#ffd8a6' : '#f4f9ff';
      ctx2d.beginPath();
      ctx2d.arc(s3.x, s3.y, s3.r * s3.life, 0, 6.283);
      ctx2d.fill();
      ctx2d.globalCompositeOperation = 'source-over';
    }

    if (parts.length > 1600) parts.splice(0, parts.length - 1600);

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
    var k = e.key.toLowerCase();
    if (k === 's' || k === 'ы') blizzardNow();
    if (k === 'f' || k === 'а') { show(1 + Math.floor(Math.random() * 2), 600); }
    if (k === 'a' || k === 'ф') { if (aurora.t0 < 0) auroraStart(); }
    if (e.key === ' ') { e.preventDefault(); addSparkle(W / 2, H * 0.32, 46, 1.8); }
  });

  /* ---------------- звёздное небо: их почти нет, это снег ---------------- */

  var starLayer = document.getElementById('starmap');

  for (var i = 0; i < 40; i++) {
    var sx = Math.random() * 1400 - 200;
    var sy = Math.pow(Math.random(), 1.1) * 260 - 40;
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

  /* ---------------- параллакс ---------------- */

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
    addSparkle(x, y, 26, 1.1);
    gust = (Math.random() - 0.5) * 1.8;
    Audio_.bell(0.045, 587.33);
  });

  /* ---------------- окна и гирлянда: можно подбросить света ---------------- */

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
        bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2
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
