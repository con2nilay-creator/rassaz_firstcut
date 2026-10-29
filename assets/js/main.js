/* Rassaz Group — shared interactions
   Libraries (vendored): GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13 */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  // anchor links
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      document.body.classList.remove("menu-open");
      if (lenis) lenis.scrollTo(t, { offset: -10 }); else t.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- split text into masked lines (by words) ---------- */
  function splitLines(el) {
    if (el.__split) return el.__split;
    var html = el.innerHTML.trim();
    // keep <br> as forced breaks
    var parts = html.split(/<br\s*\/?>/i);
    el.innerHTML = "";
    var words = [];
    parts.forEach(function (part, pi) {
      var tmp = document.createElement("div");
      tmp.innerHTML = part;
      var tokens = tmp.textContent.trim().split(/\s+/);
      var ems = !!tmp.querySelector("em");
      tokens.forEach(function (w) {
        var s = document.createElement("span");
        s.className = "sw";
        s.style.display = "inline-block";
        s.textContent = w;
        if (ems && tmp.querySelector("em") && tmp.querySelector("em").textContent.indexOf(w) > -1) s.style.fontWeight = "700";
        el.appendChild(s); el.appendChild(document.createTextNode(" "));
        words.push(s);
      });
      if (pi < parts.length - 1) { var br = document.createElement("br"); el.appendChild(br); }
    });
    // group words into lines by offsetTop
    var lines = [], cur = [], top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) < 4) { cur.push(w); }
      else { lines.push(cur); cur = [w]; }
      top = t;
    });
    if (cur.length) lines.push(cur);
    el.innerHTML = "";
    var inners = [];
    lines.forEach(function (ln) {
      var line = document.createElement("span"); line.className = "sl-line";
      var inner = document.createElement("span");
      inner.innerHTML = ln.map(function (w) { return w.outerHTML; }).join(" ");
      line.appendChild(inner); el.appendChild(line); inners.push(inner);
    });
    el.__split = inners;
    return inners;
  }

  /* ---------- preloader ---------- */
  var pre = $(".preloader");
  function intro() {
    document.dispatchEvent(new CustomEvent("rassaz:intro"));
    if (!hasGsap || reduce) return;
    var heroLines = $$("[data-hero-split]");
    heroLines.forEach(function (el) {
      var inners = splitLines(el);
      gsap.fromTo(inners, { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.09, delay: 0.1 });
    });
    gsap.fromTo("[data-hero-fade]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.08, delay: 0.5 });
  }
  if (pre && hasGsap && !reduce) {
    if (lenis) lenis.stop();
    var counter = $(".pl-count", pre), bar = $(".pl-bar i", pre), logo = $("img", pre);
    var obj = { v: 0 };
    var tl = gsap.timeline();
    tl.to(logo, { opacity: 1, filter: "blur(0px)", duration: 1, ease: "power2.out" })
      .to(obj, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: function () { counter.textContent = String(Math.round(obj.v)).padStart(3, "0"); } }, 0.1)
      .to(bar, { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0.1)
      .to(pre.firstElementChild, { y: -40, opacity: 0, duration: 0.6, ease: "power2.in" }, ">")
      .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut", onStart: intro }, "<0.2")
      .add(function () { pre.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); });
  } else {
    if (pre) pre.remove();
    window.addEventListener("load", intro);
    if (document.readyState === "complete") intro();
  }

  /* ---------- header ---------- */
  var header = $(".header");
  if (header) {
    var lastY = 0;
    var heroEl = $("[data-hero]");
    function onScroll() {
      var y = window.scrollY;
      var limit = heroEl ? heroEl.offsetHeight - 90 : 40;
      header.classList.toggle("solid", y > limit || header.classList.contains("always"));
      if (!document.body.classList.contains("menu-open")) header.classList.toggle("hide", y > lastY && y > 500);
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  $$(".menu [data-img]").forEach(function (a) {
    a.addEventListener("mouseenter", function () {
      $$(".menu .m-media img").forEach(function (im) { im.classList.toggle("on", im.dataset.key === a.dataset.img); });
    });
  });
  $$(".menu a").forEach(function (a) { a.addEventListener("click", function () { document.body.classList.remove("menu-open"); if (lenis) lenis.start(); }); });

  /* ---------- cursor ---------- */
  if (finePointer && !reduce) {
    var cur = document.createElement("div");
    cur.className = "cursor"; cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<div class="c-ring"><b></b></div><div class="c-dot"></div>';
    document.body.appendChild(cur);
    var ring = cur.firstChild, dot = cur.lastChild, lbl = ring.firstChild;
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; dot.style.left = mx + "px"; dot.style.top = my + "px"; }, { passive: true });
    (function loop() { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.left = rx + "px"; ring.style.top = ry + "px"; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-cursor]");
      var l = e.target.closest("a,button,input,select,textarea,label");
      cur.classList.toggle("is-label", !!t);
      cur.classList.toggle("is-link", !t && !!l);
      lbl.textContent = t ? t.getAttribute("data-cursor") : "";
    });
  }

  /* ---------- magnetic ---------- */
  if (finePointer && !reduce && hasGsap) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.4)" }); });
    });
  }

  /* ---------- 3D tilt with glare ---------- */
  if (finePointer && !reduce) {
    $$("[data-tilt]").forEach(function (el) {
      var max = parseFloat(el.getAttribute("data-tilt")) || 8;
      el.classList.add("tilt");
      if (!el.querySelector(".glare")) { var g = document.createElement("i"); g.className = "glare"; el.appendChild(g); }
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = "perspective(1100px) rotateY(" + ((px - 0.5) * max * 2) + "deg) rotateX(" + (-(py - 0.5) * max * 2) + "deg) scale3d(1.02,1.02,1.02)";
        el.style.setProperty("--gx", px * 100 + "%"); el.style.setProperty("--gy", py * 100 + "%");
      });
      el.addEventListener("mouseleave", function () { el.style.transition = "transform .9s cubic-bezier(.22,1,.36,1)"; el.style.transform = ""; setTimeout(function () { el.style.transition = ""; }, 900); });
    });
  }

  /* ---------- hover video in cards ---------- */
  $$("[data-hover-video]").forEach(function (card) {
    var v = card.querySelector("video");
    if (!v) return;
    card.addEventListener("mouseenter", function () { if (!v.src && v.dataset.src) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    card.addEventListener("mouseleave", function () { v.pause(); });
  });

  /* ---------- scroll animations ---------- */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    // line reveals
    $$("[data-split]").forEach(function (el) {
      var inners = splitLines(el);
      gsap.fromTo(inners, { yPercent: 105 }, { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    // word-by-word scrub (from faded, readable at rest)
    $$("[data-scrub]").forEach(function (el) {
      var inners = splitLines(el);
      var ws = [];
      inners.forEach(function (i) { ws = ws.concat($$(".sw", i)); });
      gsap.fromTo(ws, { opacity: 0.18 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
    // fade up
    $$("[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    // stagger children
    $$("[data-stagger]").forEach(function (el) {
      gsap.fromTo(el.children, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    // clip reveal for images
    $$("[data-clip]").forEach(function (el) {
      var dir = el.getAttribute("data-clip") || "up";
      var from = dir === "left" ? "inset(0 100% 0 0)" : dir === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
      gsap.fromTo(el, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%" } });
      var img = el.querySelector("img");
      if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    // parallax
    $$("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 12;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // counters
    $$("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count")), suf = el.getAttribute("data-suffix") || "";
      var o = { v: 0 };
      gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" }, onUpdate: function () { el.textContent = Math.round(o.v) + suf; } });
    });
    // horizontal pinned tracks
    var mm = gsap.matchMedia();
    mm.add("(min-width: 721px)", function () {
      $$("[data-hscroll]").forEach(function (sec) {
        var track = sec.querySelector("[data-htrack]");
        if (!track) return;
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        gsap.to(track, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
        // skew on velocity for depth
        $$(".media img", track).forEach(function (im) {
          gsap.fromTo(im, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, scrub: true } });
        });
      });
    });
    mm.add("(max-width: 720px)", function () {
      $$("[data-hscroll]").forEach(function (sec) { var t = sec.querySelector("[data-htrack]"); if (t) { t.style.overflowX = "auto"; t.style.width = "auto"; t.style.scrollSnapType = "x mandatory"; } });
    });
    // film expand
    $$("[data-film]").forEach(function (sec) {
      var frame = sec.querySelector(".f-frame"), vid = sec.querySelector("video"), title = sec.querySelector(".f-title");
      var t = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: true } });
      t.fromTo(frame, { clipPath: "inset(18% 24% 18% 24%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut" }, 0)
       .fromTo(vid, { scale: 1.3 }, { scale: 1, ease: "power2.inOut" }, 0)
       .fromTo(title, { scale: 0.85, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, ease: "power2.out" }, 0);
    });
    // text-mask video zoom
    $$("[data-mask]").forEach(function (sec) {
      var svg = sec.querySelector(".mask-svg"), cap = sec.querySelector(".m-cap");
      var t = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: true } });
      t.fromTo(svg, { scale: 1 }, { scale: 14, ease: "power2.in", transformOrigin: "50% 52%", duration: 1 }, 0)
       .to(svg, { opacity: 0, ease: "none", duration: 0.3 }, 0.7)
       .fromTo(cap, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.8);
    });
    // footer word
    $$(".f-word").forEach(function (el) {
      var txt = el.textContent; el.textContent = "";
      txt.split("").forEach(function (c) { var s = document.createElement("span"); s.textContent = c === " " ? " " : c; el.appendChild(s); });
      gsap.fromTo(el.children, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.04, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 95%" } });
    });
  } else {
    $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
  }

  /* ---------- 3D ring gallery (CSS 3D, drag + scroll) ---------- */
  $$("[data-ring]").forEach(function (stage) {
    var ringEl = stage.querySelector(".ring");
    var items = $$("figure", ringEl);
    var n = items.length;
    var rot = 0, vel = 0.06, dragging = false, lastX = 0, scrollBoost = 0;
    var hovering = false;
    stage.addEventListener("mouseenter", function () { hovering = true; stage.classList.add("paused"); });
    stage.addEventListener("mouseleave", function () { hovering = false; stage.classList.remove("paused"); });
    function layout() {
      var w = Math.min(400, Math.max(180, stage.clientWidth * 0.27));
      var radius = Math.round((w + 26) / (2 * Math.tan(Math.PI / n)));
      items.forEach(function (f, i) {
        f.style.setProperty("--rw", w + "px");
        f.style.transform = "rotateY(" + (i * 360 / n) + "deg) translateZ(" + radius + "px)";
      });
      stage.__radius = radius;
    }
    layout(); window.addEventListener("resize", layout);
    function frame() {
      if (!dragging && !hovering) { rot += vel + scrollBoost; scrollBoost *= 0.92; }
      ringEl.style.transform = "translateZ(" + (-stage.__radius * 1.1) + "px) rotateX(-6deg) rotateY(" + rot + "deg)";
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
    stage.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; rot += dx * 0.25; vel = dx > 0 ? 0.06 : -0.06; });
    stage.addEventListener("pointerup", function () { dragging = false; });
    stage.addEventListener("pointercancel", function () { dragging = false; });
    if (lenis) lenis.on("scroll", function (e) { scrollBoost = Math.max(-2, Math.min(2, e.velocity * 0.08)); });
  });

  /* ---------- fly-through 3D gallery ---------- */
  $$("[data-fly]").forEach(function (sec) {
    var items = $$(".fly-item", sec);
    var depth = 1500;
    var pos = items.map(function (it, i) {
      var side = i % 2 === 0 ? -1 : 1;
      var narrow = window.innerWidth < 721;
      return { x: narrow ? side * 6 : side * (18 + (i % 3) * 6), y: ((i * 37) % 30) - 15, z: -i * depth - 900 };
    });
    var count = sec.querySelector("[data-fly-count]");
    function update(p) {
      var travel = p * ((items.length - 1) * depth + 400);
      items.forEach(function (it, i) {
        var z = pos[i].z + travel;
        var o = z > 300 ? Math.max(0, 1 - (z - 300) / 500) : z < -5000 ? 0 : Math.min(1, (z + 5000) / 2000);
        it.style.transform = "translate(-50%,-50%) translate3d(" + pos[i].x + "vw," + pos[i].y + "vh," + z + "px)";
        it.style.opacity = o;
        it.style.visibility = o < 0.01 ? "hidden" : "visible";
      });
      if (count) { var idx = Math.min(items.length, Math.max(1, Math.round(p * (items.length - 1)) + 1)); count.textContent = String(idx).padStart(2, "0") + " / " + String(items.length).padStart(2, "0"); }
      var title = sec.querySelector(".fly-title");
      if (title) title.style.opacity = Math.max(0, 1 - p * 6);
    }
    update(0);
    if (hasGsap && window.ScrollTrigger && !reduce && window.innerWidth > 1024) {
      ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", scrub: true, onUpdate: function (s) { update(s.progress); } });
    } else {
      sec.classList.add("fly-static");
    }
  });

  /* ---------- compare slider ---------- */
  $$("[data-compare]").forEach(function (c) {
    var input = c.querySelector("input");
    var set = function (v) { c.style.setProperty("--pos", v + "%"); };
    input.addEventListener("input", function () { set(input.value); });
    set(input.value);
    if (hasGsap && window.ScrollTrigger && !reduce) {
      var o = { v: 88 };
      gsap.to(o, { v: 50, duration: 2.2, ease: "power3.inOut", scrollTrigger: { trigger: c, start: "top 70%" }, onUpdate: function () { input.value = o.v; set(o.v); } });
    }
  });

  /* ---------- master plan hotspots ---------- */
  $$("[data-plan]").forEach(function (wrap) {
    var map = wrap.querySelector(".plan-map");
    var btns = $$("[data-hs]", wrap);
    function activate(key) {
      btns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-hs") === key); });
    }
    btns.forEach(function (b) {
      b.addEventListener("mouseenter", function () { activate(b.getAttribute("data-hs")); });
      b.addEventListener("focus", function () { activate(b.getAttribute("data-hs")); });
      b.addEventListener("click", function () {
        var dot = map.querySelector('.hs[data-hs="' + b.getAttribute("data-hs") + '"]');
        if (!dot) return;
        if (map.classList.contains("zoom") && map.__key === b.getAttribute("data-hs")) { map.classList.remove("zoom"); map.__key = null; return; }
        map.style.setProperty("--ox", dot.style.left); map.style.setProperty("--oy", dot.style.top);
        map.classList.add("zoom"); map.__key = b.getAttribute("data-hs");
      });
    });
    map.addEventListener("click", function (e) { if (e.target === map || e.target.tagName === "IMG") { map.classList.remove("zoom"); map.__key = null; } });
  });

  /* ---------- drag-to-scroll galleries ---------- */
  $$(".hgal").forEach(function (g) {
    var down = false, sx = 0, sl = 0, moved = false;
    g.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = g.scrollLeft; g.style.scrollSnapType = "none"; });
    window.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; g.scrollLeft = sl - dx; });
    window.addEventListener("pointerup", function () { if (!down) return; down = false; g.style.scrollSnapType = ""; setTimeout(function () { moved = false; }, 0); });
    g.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------- lightbox (images + film) ---------- */
  var lb = document.createElement("div");
  lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Media viewer");
  lb.innerHTML = '<div class="lb-body"></div><button class="lb-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l14 14M19 5L5 19"/></svg></button><button class="lb-nav lb-prev" aria-label="Previous image"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button><button class="lb-nav lb-next" aria-label="Next image"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button><div class="lb-cap"></div>';
  document.body.appendChild(lb);
  var lbBody = lb.querySelector(".lb-body"), lbCap = lb.querySelector(".lb-cap"), group = [], gi = 0, lastFocus = null;
  function showImg() {
    var a = group[gi];
    lbBody.innerHTML = '<img src="' + a.getAttribute("href") + '" alt="' + (a.getAttribute("data-caption") || "") + '">';
    lbCap.textContent = (a.getAttribute("data-caption") || "") + "  ·  " + (gi + 1) + " / " + group.length;
  }
  function openLb() { lastFocus = document.activeElement; lb.classList.add("open"); if (lenis) lenis.stop(); lb.querySelector(".lb-close").focus(); }
  function closeLb() { lb.classList.remove("open"); var v = lbBody.querySelector("video"); if (v) v.pause(); setTimeout(function () { lbBody.innerHTML = ""; }, 400); if (lenis) lenis.start(); if (lastFocus) lastFocus.focus(); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-lightbox]");
    if (a) {
      e.preventDefault();
      var name = a.getAttribute("data-lightbox");
      group = $$('[data-lightbox="' + name + '"]'); gi = group.indexOf(a);
      lb.querySelector(".lb-prev").hidden = lb.querySelector(".lb-next").hidden = group.length < 2;
      showImg(); openLb(); return;
    }
    var v = e.target.closest("[data-video]");
    if (v) {
      e.preventDefault();
      lb.querySelector(".lb-prev").hidden = lb.querySelector(".lb-next").hidden = true;
      lbBody.innerHTML = '<video src="' + v.getAttribute("data-video") + '" controls autoplay playsinline></video>';
      lbCap.textContent = v.getAttribute("data-caption") || "";
      openLb();
    }
  });
  lb.querySelector(".lb-close").addEventListener("click", closeLb);
  lb.querySelector(".lb-prev").addEventListener("click", function () { gi = (gi - 1 + group.length) % group.length; showImg(); });
  lb.querySelector(".lb-next").addEventListener("click", function () { gi = (gi + 1) % group.length; showImg(); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lbBody) closeLb(); });
  lb.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight" && group.length > 1 && !lbBody.querySelector("video")) lb.querySelector(".lb-next").click();
    if (e.key === "ArrowLeft" && group.length > 1 && !lbBody.querySelector("video")) lb.querySelector(".lb-prev").click();
  });

  /* ---------- enquiry form (front-end only for first cut) ---------- */
  $$("form[data-enquiry]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = f.querySelector(".form-note");
      if (!f.checkValidity()) { note.textContent = "Please fill in your name and a valid phone number."; return; }
      note.textContent = "Thank you. Your details are noted for this preview; the live site will send them to the Rassaz sales team.";
      f.reset();
    });
  });

  /* ---------- fit mask word to the visible area ---------- */
  function fitMask() {
    $$("[data-mask] svg.mask-svg").forEach(function (svg) {
      var txt = svg.querySelector("text"); if (!txt) return;
      var vw = svg.clientWidth || innerWidth, vh = svg.clientHeight || innerHeight;
      var visible = vw / vh < 1600 / 900 ? 900 * vw / vh : 1600;
      txt.setAttribute("font-size", "236");
      var len = txt.getComputedTextLength ? txt.getComputedTextLength() : 1300;
      var fs = Math.min(236, 236 * (visible * 0.88) / len);
      txt.setAttribute("font-size", fs.toFixed(1));
      txt.setAttribute("y", (450 + fs * 0.33).toFixed(1));
    });
  }
  fitMask(); window.addEventListener("resize", fitMask);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMask);

  /* ---------- fit footer wordmark to width ---------- */
  function fitWord() {
    $$(".f-word").forEach(function (el) {
      el.style.fontSize = "100px";
      var avail = el.clientWidth || el.parentElement.clientWidth;
      var rg = document.createRange(); rg.selectNodeContents(el);
      var w = rg.getBoundingClientRect().width;
      if (w) el.style.fontSize = Math.floor(100 * avail / w * 0.98) + "px";
    });
  }
  fitWord(); window.addEventListener("resize", fitWord);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);

  window.addEventListener("load", function () { if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
