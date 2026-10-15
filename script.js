/* ==========================================================================
   RÓTULOS ALANIZ · script.js (vanilla, sin dependencias)
   Un solo bucle de animación (requestAnimationFrame) lee el scroll una vez
   por cuadro y reparte el trabajo a cada módulo. Nada usa listeners de scroll.
   Módulos: loader · header · scroll suave · titulares · reveal · palabras ·
            parallax · cinta · partículas · hero · contadores · servicios ·
            galería fijada + visor · galería con filtros · configurador · proceso ·
            FAQ · formulario · mapa · magnético · salpicadura · WhatsApp flotante.
   Todo respeta prefers-reduced-motion y pausa lo que no está en pantalla.
   ========================================================================== */
(() => {
  'use strict';
  window.__ok = true;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const WA = '525566150766';
  const waUrl = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const visibleSet = (els, margin = '10% 0px') => {          // elementos actualmente en pantalla
    const set = new Set();
    const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? set.add(e.target) : set.delete(e.target))), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
    return set;
  };

  /* ---------- Bucle central -------------------------------------------- */
  const frames = [];
  const onFrame = (fn) => frames.push(fn);
  const S = { y: 0, vel: 0, vh: innerHeight, vw: innerWidth, t: 0 };
  let lastY = scrollY;
  function loop(t) {
    const y = scrollY;
    S.vel = lerp(S.vel, y - lastY, 0.18);
    lastY = y; S.y = y; S.vh = innerHeight; S.vw = innerWidth; S.t = t;
    for (let i = 0; i < frames.length; i++) frames[i](S);
    requestAnimationFrame(loop);
  }

  /* ---------- 1 · Loader: el nombre se rotula en vivo -------------------- */
  function loader() {
    const el = $('#loader');
    return new Promise((resolve) => {
      if (!el || reduce) { el && el.remove(); root.classList.remove('is-loading'); return resolve(); }
      const pct = $('#loaderPct'), stroke = $('#loaderStroke');
      const dur = 2400, t0 = performance.now();
      let ready = document.readyState === 'complete', p = 0;
      if (!ready) addEventListener('load', () => (ready = true), { once: true });
      setTimeout(() => (ready = true), 4200);                  // nunca esperes más de 4.2 s por imágenes lentas
      if (stroke) stroke.style.strokeDasharray = '1';
      const done = () => {
        el.classList.add('is-done');
        root.classList.remove('is-loading');
        setTimeout(resolve, 600);                              // el hero entra mientras se abren las cortinas
        setTimeout(() => el.remove(), 2000);
      };
      const tick = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        let v = 1 - Math.pow(1 - t, 3);
        if (!ready) v = Math.min(v, 0.94);                     // espera la carga real antes de llegar a 100
        p = Math.max(p, v);
        el.style.setProperty('--p', p.toFixed(3));
        if (stroke) stroke.style.strokeDashoffset = (1 - p).toFixed(3);
        if (pct) pct.textContent = Math.round(p * 100);
        if (p >= 1) return done();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 2 · Header, menú móvil y progreso -------------------------- */
  function header() {
    const h = $('.site-header'), burger = $('.burger'), nav = $('#menu');
    let scrolled = false, lastSp = -1;
    onFrame(({ y }) => {
      const s = y > 24;
      if (s !== scrolled) { scrolled = s; h.classList.toggle('is-scrolled', s); }
      const max = document.documentElement.scrollHeight - innerHeight;
      const sp = max > 0 ? clamp(y / max, 0, 1) : 0;
      if (Math.abs(sp - lastSp) > 0.0005) { lastSp = sp; h.style.setProperty('--sp', sp.toFixed(4)); }
    });
    if (!burger || !nav) return;
    const set = (open) => {
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => e.target.closest('a') && set(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); burger.focus(); } });
    matchMedia('(min-width: 1180px)').addEventListener('change', (e) => e.matches && set(false));
    // enlace activo según la sección visible
    const links = $$('a[href^="#"]', nav);
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = map.get(en.target.id); a && a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------- 3 · Scroll suave "slow motion" y anclas -------------------- */
  let scrollToY = (y) => scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  function smoothScroll() {
    if (reduce || !fine) return;
    let target = scrollY, current = scrollY, running = false;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const step = () => {
      current = lerp(current, target, 0.085);                  // inercia suave y lenta
      if (Math.abs(target - current) < 0.4) { current = target; running = false; }
      scrollTo({ top: current, behavior: 'instant' });
      if (running) requestAnimationFrame(step);
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(step); } };
    const insideScrollable = (el) => {
      for (; el && el !== document.body; el = el.parentElement) {
        const o = getComputedStyle(el).overflowY;
        if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
      }
      return false;
    };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || insideScrollable(e.target) || $('dialog[open]')) return;
      e.preventDefault();
      if (!running) target = current = scrollY;
      target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 34 : 1) * 0.9, 0, max());
      kick();
    }, { passive: false });
    const release = () => { running = false; target = current = scrollY; };   // teclado, barra o gestos: soltamos el control
    ['keydown', 'mousedown', 'touchstart'].forEach((ev) => addEventListener(ev, release, { passive: true }));
    scrollToY = (y) => { target = clamp(y, 0, max()); current = scrollY; kick(); };
    onFrame(() => { if (!running) target = current = scrollY; });
  }
  function anchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const dest = document.getElementById(a.getAttribute('href').slice(1));
      if (!dest) return;
      e.preventDefault();
      const hh = $('.site-header').offsetHeight;
      scrollToY(dest.getBoundingClientRect().top + scrollY - (dest.id === 'top' ? 0 : hh) + 1);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* ---------- 4 · Titulares partidos por palabra ------------------------- */
  function split() {
    $$('[data-split]').forEach((h) => {
      let i = 0;
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
      const walk = (node) => Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(' '));
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const wi = document.createElement('span'); wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = tok;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(h);
    });
  }

  /* ---------- 5 · Revelado al entrar en pantalla ------------------------- */
  function reveal() {
    const els = $$('[data-reveal], .edge');
    $$('[data-stagger]').forEach((p) => $$(':scope > [data-reveal]', p).forEach((c, i) => c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's')));
    if (reduce) return els.forEach((e) => e.classList.add('is-in'));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in'); io.unobserve(en.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => {
      // un elemento oculto por media query nunca entra en pantalla: se marca listo para cuando aparezca
      if (!e.getClientRects().length) e.classList.add('is-in'); else io.observe(e);
    });
  }

  /* ---------- 6 · Texto que se ilumina palabra por palabra --------------- */
  function words() {
    $$('[data-words]').forEach((p) => {
      const spans = [];
      const walk = (node) => Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) return f.appendChild(document.createTextNode(' '));
            const s = document.createElement('span'); s.className = 'wd'; s.textContent = tok; spans.push(s); f.appendChild(s);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      });
      walk(p);
      if (reduce) return spans.forEach((s) => s.classList.add('on'));
      const vis = visibleSet([p], '20% 0px');
      let last = -1;
      onFrame(({ vh }) => {
        if (!vis.has(p)) return;
        const r = p.getBoundingClientRect();
        const pr = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.32), 0, 1);
        const n = Math.floor(pr * (spans.length + 1));
        if (n !== last) { last = n; spans.forEach((s, i) => s.classList.toggle('on', i < n)); }
      });
    });
  }

  /* ---------- 7 · Parallax de imágenes de fondo -------------------------- */
  function parallax() {
    const imgs = $$('[data-parallax]');
    if (!imgs.length || reduce) return;
    const vis = visibleSet(imgs, '20% 0px');
    onFrame(({ vh }) => vis.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      const k = parseFloat(img.dataset.parallax) || 0.12;
      const off = clamp((r.top + r.height / 2 - vh / 2) * -k, -r.height * 0.14, r.height * 0.14);
      img.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
    }));
  }

  /* ---------- 8 · Cinta que reacciona a la velocidad del scroll ---------- */
  function bands() {
    const bs = $$('.band');
    if (!bs.length || reduce) return;
    const items = bs.map((b) => {
      const track = $('.band__track', b), grp = $('.band__grp', track);
      const it = { b, track, grp, dir: parseFloat(b.dataset.dir) || -1, gw: 0, x: 0 };
      it.build = () => {
        $$('.band__grp', track).slice(1).forEach((n) => n.remove());
        it.gw = grp.offsetWidth;
        if (!it.gw) return;
        const need = Math.ceil((b.offsetWidth * 1.3) / it.gw) + 1;
        for (let i = 0; i < need; i++) { const c = grp.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }
      };
      it.build();
      return it;
    });
    const rebuild = () => items.forEach((it) => it.build());
    addEventListener('resize', rebuild);
    document.fonts && document.fonts.ready.then(rebuild);
    const vis = visibleSet(bs, '10% 0px');
    onFrame(({ vel }) => items.forEach((it) => {
      if (!vis.has(it.b) || !it.gw) return;
      const sp = 0.7 + Math.min(Math.abs(vel), 70) * 0.3;
      it.x += it.dir * sp;
      it.x %= it.gw; if (it.x > 0) it.x -= it.gw;
      it.track.style.transform = `translate3d(${it.x.toFixed(1)}px,0,0)`;
    }));
  }

  /* ---------- 9 · Partículas de pintura ---------------------------------- */
  function particles(canvas, opt) {
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;
    const o = Object.assign({ count: 70, link: 110, speed: 0.2, colors: ['232,191,90', '246,240,226', '246,220,147', '224,72,159'] }, opt);
    if (innerWidth < 700) o.count = Math.round(o.count * 0.55);
    let w = 0, h = 0, P = [], mx = -9999, my = -9999;
    const init = () => {
      P = Array.from({ length: o.count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * o.speed * 2, vy: -(0.06 + Math.random() * o.speed),
        r: 0.8 + Math.random() * 2.2, c: o.colors[(Math.random() * o.colors.length) | 0], a: 0.3 + Math.random() * 0.5, ph: Math.random() * 6.28,
      }));
    };
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };
    new ResizeObserver(size).observe(canvas); size();
    if (fine && !reduce) {
      addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    }
    const draw = (t, move) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        if (move) {
          p.x += p.vx + Math.sin(t / 1800 + p.ph) * 0.12; p.y += p.vy;
          const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < 14000) { const d = Math.sqrt(d2) || 1, f = (1 - d / 118) * 1.6; p.x += (dx / d) * f; p.y += (dy / d) * f; }
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        }
        ctx.fillStyle = `rgba(${p.c},${(p.a * 0.12).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${p.c},${p.a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        if (o.link) for (let j = i + 1; j < P.length; j++) {
          const q = P[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < o.link * o.link) { ctx.strokeStyle = `rgba(232,191,90,${((1 - Math.sqrt(d) / o.link) * 0.16).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
    };
    if (reduce) return draw(0, false);
    const vis = visibleSet([canvas], '5% 0px');
    onFrame(({ t }) => { if (vis.has(canvas) && !document.hidden) draw(t, true); });
  }

  /* ---------- 10 · Hero: fotos que cambian, parallax y salida ------------ */
  function hero() {
    const sec = $('.hero'); if (!sec) return;
    const stage = $('.hero__stage'), inner = $('.hero__inner'), slides = $$('.slide', sec);
    if (slides.length > 1 && !reduce) {
      let i = 0;
      setInterval(() => {
        if (document.hidden) return;
        const prev = slides[i]; i = (i + 1) % slides.length;
        slides.forEach((s) => s.classList.remove('is-prev'));
        prev.classList.remove('is-active'); prev.classList.add('is-prev');
        slides[i].classList.add('is-active');
        setTimeout(() => prev.classList.remove('is-prev'), 2200);
      }, 6200);
    }
    const items = $$('.stage__item', stage).map((el) => ({ el, dx: parseFloat(el.style.getPropertyValue('--dx')) || 12, dy: parseFloat(el.style.getPropertyValue('--dy')) || 12 }));
    let tx = 0, ty = 0, cx = 0, cy = 0;
    if (fine && !reduce) {
      sec.addEventListener('pointermove', (e) => { const r = sec.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; });
      sec.addEventListener('pointerleave', () => { tx = ty = 0; });
    }
    if (reduce) return;
    onFrame(({ y, vh }) => {
      if (y > vh * 1.3) return;
      cx = lerp(cx, tx, 0.07); cy = lerp(cy, ty, 0.07);
      items.forEach((it) => (it.el.style.transform = `translate3d(${(cx * it.dx).toFixed(1)}px,${(cy * it.dy).toFixed(1)}px,0)`));
      const k = clamp(y / (vh * 0.9), 0, 1);
      inner.style.transform = `translate3d(0,${(y * 0.16).toFixed(1)}px,0)`;
      inner.style.opacity = (1 - k * 0.85).toFixed(3);
    });
  }

  /* ---------- 11 · Contadores -------------------------------------------- */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length || reduce) return;
    const fmt = (el, v) => {
      const dec = parseInt(el.dataset.decimals || 0, 10);
      el.textContent = v.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suffix || '');
    };
    els.forEach((el) => fmt(el, 0));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target, end = parseFloat(el.dataset.count), t0 = performance.now(), D = 2200;
      const step = (now) => {
        const t = clamp((now - t0) / D, 0, 1);
        fmt(el, end * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)));        // easeOutExpo
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- 12 · Servicios: acordeón + foto que sigue al cursor -------- */
  function services() {
    const list = $('.svc-list'); if (!list) return;
    const items = $$('.svc', list);
    const set = (li, open) => { li.classList.toggle('is-open', open); $('.svc__head', li).setAttribute('aria-expanded', open); };
    const peek = $('#svcPeek');
    let hidePeek = () => {};
    items.forEach((li) => $('.svc__head', li).addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      items.forEach((x) => x !== li && set(x, false));
      set(li, open); if (open) hidePeek();
    }));
    set(items[0], true);

    // CTAs de cada servicio: preseleccionan el formulario de contacto
    $$('[data-service]').forEach((a) => a.addEventListener('click', () => {
      const r = $(`input[name="service"][value="${a.dataset.service.replace(/"/g, '\\"')}"]`);
      if (r) r.checked = true;
    }));

    if (!peek || !fine || reduce) return;
    let imgs = null, px = 0, py = 0, cx = 0, cy = 0, rot = 0, active = false;
    const ensure = () => {
      if (imgs) return;
      imgs = items.map((li) => { const im = new Image(); im.src = li.dataset.peek; im.alt = ''; im.decoding = 'async'; peek.appendChild(im); return im; });
    };
    hidePeek = () => { active = false; peek.classList.remove('is-on'); };
    items.forEach((li, i) => {
      li.addEventListener('pointerenter', (e) => {
        ensure();
        if (li.classList.contains('is-open')) return hidePeek();
        if (!active) { cx = px = e.clientX; cy = py = e.clientY; }
        active = true;
        imgs.forEach((m, k) => m.classList.toggle('is-on', k === i));
        peek.classList.add('is-on');
      });
      li.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; });
      li.addEventListener('pointerleave', hidePeek);
    });
    onFrame(() => {
      if (!active) return;
      cx = lerp(cx, px, 0.14); cy = lerp(cy, py, 0.14);
      rot = lerp(rot, clamp((px - cx) * 0.08, -10, 10), 0.12);
      peek.style.transform = `translate3d(${(cx + 34).toFixed(1)}px,${(cy - 120).toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`;
    });
  }

  /* ---------- 13 · Galería fijada: scroll vertical -> pan horizontal ----- */
  function work() {
    const sec = $('#trabajos'); if (!sec) return;
    const pin = $('.work__pin', sec), vp = $('.work__viewport', sec), track = $('#workTrack');
    const cards = $$('.wcard', track), imgs = cards.map((c) => $('img', c));
    const cur = $('#workCur'), prog = $('#workProg');
    const FACT = 0.62;                                          // 1 px de scroll mueve 1/0.62 px la galería
    let native = reduce, max = 0, dist = 1, top = 0, cl = [], cw = [], tx = 0, inView = true, lastIdx = 0;

    const measure = () => {
      sec.classList.toggle('is-native', native);
      if (native) { sec.style.height = ''; return; }
      max = Math.max(0, track.scrollWidth - vp.clientWidth);
      dist = Math.max(1, max * FACT);
      sec.style.height = (pin.offsetHeight + dist) + 'px';
      top = sec.getBoundingClientRect().top + scrollY;
      cl = cards.map((c) => c.offsetLeft); cw = cards.map((c) => c.offsetWidth);
    };
    measure();
    addEventListener('load', measure);
    addEventListener('resize', measure);
    document.fonts && document.fonts.ready.then(measure);
    let pending = false;
    new ResizeObserver(() => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; measure(); }); }).observe($('main'));

    const vis = visibleSet([sec], '25% 0px');
    onFrame(({ y, vw }) => {
      if (native || !vis.has(sec)) return;
      const p = clamp((y - top) / dist, 0, 1);
      tx = lerp(tx, -p * max, 0.14);
      track.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
      for (let i = 0; i < cards.length; i++) {
        const im = imgs[i]; if (!im) continue;
        const c = cl[i] + tx + cw[i] / 2 - vw / 2;
        im.style.transform = `translate3d(${(-c * 0.045).toFixed(1)}px,0,0) scale(1.16)`;
      }
      prog.style.transform = `scaleX(${p.toFixed(4)})`;
      const idx = clamp(Math.round(p * (cards.length - 2)) + 1, 1, cards.length - 1);
      if (idx !== lastIdx) { lastIdx = idx; cur.textContent = String(idx).padStart(2, '0'); }
    });
    lightbox($$('.wcard__btn, .gal__btn'));                      // un solo visor para la galería fijada y la galería con filtros
  }

  function lightbox(btns) {
    const lb = $('#lightbox');
    if (!lb || !lb.showModal || !btns.length) return;
    const img = $('#lbImg'), cap = $('#lbCap');
    let i = 0;
    const show = (n, step = 1) => {
      i = (n + btns.length) % btns.length;
      for (let k = 0; k < btns.length && !btns[i].offsetParent; k++) i = (i + step + btns.length) % btns.length;   // salta las fotos ocultas por el filtro
      const b = btns[i], im = $('img', b);
      img.src = im.currentSrc || im.src; img.alt = im.alt;
      cap.textContent = $('.wcard__cap strong, .gal__cap strong', b).textContent;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    };
    btns.forEach((b, k) => b.addEventListener('click', () => { show(k); lb.showModal(); }));
    $('.lb__close', lb).addEventListener('click', () => lb.close());
    $('.lb__nav--prev', lb).addEventListener('click', () => show(i - 1, -1));
    $('.lb__nav--next', lb).addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1, -1); }
      else if (e.key === ' ' || e.key === 'PageDown' || e.key === 'PageUp') e.preventDefault();
    });
    ['wheel', 'touchmove'].forEach((ev) => lb.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  }

  /* ---------- 13b · Galería con filtros por tipo de trabajo -------------- */
  function gallery() {
    const sec = $('#galeria'); if (!sec) return;
    const grid = $('.gal__grid', sec), info = $('#galInfo');
    const chips = $$('.gal__chip', sec), items = $$('.gal__item', sec);
    chips.forEach((c) => {                                       // el contador de cada filtro sale de las fotos reales
      const n = $('sup', c);
      if (n) n.textContent = items.filter((li) => c.dataset.filter === 'todo' || li.dataset.cat === c.dataset.filter).length;
    });
    const apply = (f) => {
      let k = 0;
      items.forEach((li) => {
        const show = f === 'todo' || li.dataset.cat === f;
        li.hidden = !show;
        if (show) li.style.setProperty('--k', Math.min(k++, 14));
      });
      chips.forEach((c) => {
        const on = c.dataset.filter === f;
        c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on);
        if (on) info.textContent = c.dataset.info;
      });
      if (reduce) return;
      grid.classList.remove('is-swap'); void grid.offsetWidth; grid.classList.add('is-swap');
    };
    chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter)));
    // un pequeño desfase por columna para que las fotos entren en ola al hacer scroll
    items.forEach((li, i) => li.style.setProperty('--d', ((i % 4) * 0.07).toFixed(2) + 's'));
  }

  /* ---------- 14 · Configurador: tu nombre sobre la pared ---------------- */
  function studio() {
    const form = $('#studioForm'); if (!form) return;
    const txt = $('#stText'), out = $('#stOut'), wall = $('#wall'), live = $('#stLive'), go = $('#stGo');
    const STYLES = {
      pincel: { n: 'Pincel', f: "'Yellowtail',cursive", w: 400, ls: '0', tt: 'none' },
      letrero: { n: 'Letrero', f: "'Bungee',cursive", w: 400, ls: '.02em', tt: 'uppercase' },
      clasico: { n: 'Clásico', f: "'DM Serif Display',serif", w: 400, ls: '-.01em', tt: 'none' },
      moderno: { n: 'Moderno', f: "'Bricolage Grotesque',sans-serif", w: 800, ls: '-.04em', tt: 'uppercase' },
    };
    const WALLS = { oscura: ['pared oscura', '#1b2326'], persiana: ['persiana', '#c3c8cc'], clara: ['pared clara', '#ece3cf'], barda: ['barda', '#e8e3d4'] };
    const pick = (n) => form.querySelector(`input[name="${n}"]:checked`);
    const lum = (hex) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
    const fit = () => {
      out.style.fontSize = '100px';
      const w = out.scrollWidth || 1;
      out.style.fontSize = clamp((100 * wall.clientWidth * 0.8) / w, 14, wall.clientWidth * 0.3).toFixed(1) + 'px';
    };
    const apply = (repaint) => {
      const st = STYLES[pick('stStyle').value], col = pick('stColor'), wl = pick('stWall').value;
      const text = txt.value.trim() || 'Tu Negocio';
      out.textContent = text;
      wall.style.setProperty('--wf', st.f); wall.style.setProperty('--ww', st.w);
      wall.style.setProperty('--wls', st.ls); wall.style.setProperty('--wtt', st.tt);
      wall.style.setProperty('--paint', col.value);
      wall.dataset.wall = wl;
      fit();
      if (document.fonts) document.fonts.load(`40px ${st.f}`).then(fit);
      const poor = contrast(col.value, WALLS[wl][1]) < 2.2;
      live.textContent = `${text}, estilo ${st.n}, color ${col.dataset.name}, sobre ${WALLS[wl][0]}.` + (poor ? ' Ojo: ese color y esa superficie contrastan poco.' : '');
      go.href = waUrl(`Hola Rótulos Alaniz, quiero cotizar este rótulo: "${text}" en estilo ${st.n}, color ${col.dataset.name}, sobre ${WALLS[wl][0]}.`);
      if (repaint && !reduce) { out.classList.remove('is-paint'); void out.offsetWidth; out.classList.add('is-paint'); }
    };
    out.classList.remove('is-paint');
    txt.addEventListener('input', () => apply(false));
    form.addEventListener('change', (e) => e.target.name && apply(true));
    addEventListener('resize', fit);
    apply(false);
    document.fonts && document.fonts.ready.then(fit);
    // la pintura se "escribe" cuando la pared entra en pantalla
    new IntersectionObserver((es, io) => es.forEach((en) => { if (en.isIntersecting) { io.disconnect(); if (!reduce) out.classList.add('is-paint'); } }), { threshold: 0.4 }).observe(wall);
    if (fine && !reduce) {
      wall.addEventListener('pointermove', (e) => {
        const r = wall.getBoundingClientRect();
        wall.style.setProperty('--lx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        wall.style.setProperty('--ly', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    }
  }

  /* ---------- 15 · Proceso: el trazo se dibuja con el scroll ------------- */
  function flow() {
    const box = $('#flow'); if (!box) return;
    const svg = $('#flowSvg'), path = $('#flowPath'), glow = $('#flowGlowPath'), guide = $('#flowGuide'), tip = $('#flowTip'), grad = $('#flowGrad');
    const nodes = $$('.step__node', box), steps = $$('.step', box);
    let L = 0, pts = [], startY = 0, endY = 0;
    const build = () => {
      const br = box.getBoundingClientRect();
      if (!br.width) return;
      pts = nodes.map((n) => { const r = n.getBoundingClientRect(); return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2 }; });
      const all = [{ x: pts[0].x, y: Math.max(0, pts[0].y - 70) }, ...pts, { x: pts[pts.length - 1].x, y: Math.min(br.height, pts[pts.length - 1].y + 70) }];
      let d = `M${all[0].x.toFixed(1)},${all[0].y.toFixed(1)}`;
      for (let i = 1; i < all.length; i++) {
        const a = all[i - 1], b = all[i], m = ((a.y + b.y) / 2).toFixed(1);
        d += ` C${a.x.toFixed(1)},${m} ${b.x.toFixed(1)},${m} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
      }
      svg.setAttribute('viewBox', `0 0 ${br.width.toFixed(1)} ${br.height.toFixed(1)}`);
      [path, glow, guide].forEach((p) => p.setAttribute('d', d));
      L = path.getTotalLength();
      path.style.strokeDasharray = glow.style.strokeDasharray = `${L} ${L}`;
      path.style.strokeDashoffset = glow.style.strokeDashoffset = reduce ? 0 : L;
      grad.setAttribute('y2', br.height.toFixed(0));
      startY = all[0].y; endY = all[all.length - 1].y;
    };
    build();
    addEventListener('resize', build);
    addEventListener('load', build);
    document.fonts && document.fonts.ready.then(build);
    if (reduce) return steps.forEach((s) => s.classList.add('is-in'));
    const vis = visibleSet([box], '15% 0px');
    onFrame(({ vh }) => {
      if (!vis.has(box) || !L) return;
      const br = box.getBoundingClientRect();
      const line = vh * 0.58 - br.top;                            // "línea de lectura" dentro del bloque
      const yT = clamp(line, startY, endY);
      let lo = 0, hi = L;
      for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y < yT) lo = mid; else hi = mid; }
      path.style.strokeDashoffset = glow.style.strokeDashoffset = (L - hi).toFixed(1);
      const pt = path.getPointAtLength(hi);
      tip.style.transform = `translate3d(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px,0)`;
      box.classList.toggle('is-live', line > startY - 30 && line < endY + 40);
      steps.forEach((s, i) => s.classList.toggle('is-in', line >= pts[i].y - 30));
    });
  }

  /* ---------- 16 · Preguntas frecuentes ---------------------------------- */
  function faq() {
    const qs = $$('.qa');
    qs.forEach((q) => $('button', q).addEventListener('click', () => {
      const open = !q.classList.contains('is-open');
      qs.forEach((x) => { x.classList.remove('is-open'); $('button', x).setAttribute('aria-expanded', 'false'); });
      q.classList.toggle('is-open', open); $('button', q).setAttribute('aria-expanded', open);
    }));
  }

  /* ---------- 17 · Formulario -> WhatsApp -------------------------------- */
  function contactForm() {
    const f = $('#contactForm'); if (!f) return;
    const nameEl = $('#fName'), msgEl = $('#fMsg'), telEl = $('#fTel'), note = $('#formNote');
    [nameEl, msgEl].forEach((el) => el.addEventListener('input', () => el.closest('.field').classList.remove('is-bad')));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameEl.value.trim(), msg = msgEl.value.trim(), tel = telEl.value.trim();
      const svc = (f.querySelector('input[name="service"]:checked') || {}).value || '';
      nameEl.closest('.field').classList.toggle('is-bad', !name);
      msgEl.closest('.field').classList.toggle('is-bad', !msg);
      if (!name || !msg) {
        note.textContent = 'Cuéntanos tu nombre y tu idea para abrir la conversación.';
        note.className = 'form__note is-bad';
        (!name ? nameEl : msgEl).focus();
        return;
      }
      const text = `Hola Rótulos Alaniz, soy ${name}.` + (svc ? ` Me interesa: ${svc}.` : '') + `\n${msg}` + (tel ? `\nMi teléfono: ${tel}` : '');
      window.open(waUrl(text), '_blank', 'noopener');
      note.textContent = 'Listo, abrimos WhatsApp con tu mensaje.';
      note.className = 'form__note is-ok';
    });
  }

  /* ---------- 17b · Mapa: se activa al tocarlo para no atrapar el scroll - */
  function map() {
    const box = $('#mapBox'); if (!box) return;
    const hint = $('.map__hint', box);
    if (hint && fine) hint.textContent = 'Haz clic en el mapa para moverlo';
    box.addEventListener('click', () => box.classList.add('is-live'));
    if (fine) box.addEventListener('pointerleave', () => box.classList.remove('is-live'));
    document.addEventListener('pointerdown', (e) => { if (!box.contains(e.target)) box.classList.remove('is-live'); });
  }

  /* ---------- 18 · Botón magnético --------------------------------------- */
  function magnetic() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
    });
  }

  /* ---------- 19 · Salpicadura de pintura al pulsar un CTA --------------- */
  function splash() {
    const cv = $('#splash'); if (!cv || reduce) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let parts = [], run = false, w = 0, h = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener('resize', size);
    const COLORS = ['#e8bf5a', '#f6dc93', '#c28a2e', '#f6f0e2'];
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      parts = parts.filter((p) => p.l > 0);
      parts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.24; p.vx *= 0.985; p.l -= 0.022;
        ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * Math.max(0.2, p.l), 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(step); else { run = false; ctx.clearRect(0, 0, w, h); }
    };
    const burst = (x, y) => {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.283, s = 2 + Math.random() * 6;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, r: 2 + Math.random() * 4, c: COLORS[i % 4], l: 1 });
      }
      if (!run) { run = true; requestAnimationFrame(step); }
    };
    document.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-cta]')) burst(e.clientX, e.clientY); });
    document.addEventListener('click', (e) => {
      if (e.detail !== 0) return;                                  // activación con teclado
      const t = e.target.closest('[data-cta]');
      if (t) { const r = t.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }
    });
  }

  /* ---------- 20 · WhatsApp flotante: burbuja que aparece una vez -------- */
  function waFloat() {
    const wa = $('.wa-float'); if (!wa) return;
    setTimeout(() => { wa.classList.add('show-label'); setTimeout(() => wa.classList.remove('show-label'), 6500); }, 3500);
  }

  /* ---------- Arranque --------------------------------------------------- */
  function init() {
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    split(); header(); smoothScroll(); anchors();
    words(); parallax(); bands(); hero(); counters();
    particles($('#heroFx'), { count: 74, link: 118 });
    particles($('#ctaFx'), { count: 46, link: 0, speed: 0.28 });
    services(); work(); gallery(); studio(); flow(); faq(); contactForm(); map(); magnetic(); splash();
    requestAnimationFrame(loop);
    loader().then(() => { reveal(); waFloat(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
