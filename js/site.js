const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.01, rootMargin: "0px 0px -24px 0px" }
  );
  nodes.forEach((node) => observer.observe(node));
}

function initParallax() {
  if (reduce) return;
  const layers = document.querySelectorAll("[data-parallax]");
  if (!layers.length) return;
  let ticking = false;

  function update() {
    const y = window.scrollY || 0;
    const viewMid = y + window.innerHeight / 2;
    layers.forEach((el) => {
      const depth = Number(el.dataset.parallax) || 0.06;
      const rect = el.getBoundingClientRect();
      const center = rect.top + y + rect.height / 2;
      const delta = (viewMid - center) * depth;
      el.style.transform = `translate3d(0, ${delta.toFixed(2)}px, 0)`;
    });
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initProgress() {
  const bar = document.querySelector(".progress");
  const header = document.querySelector(".top");
  if (!bar || !header) return;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${ratio})`;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initToc() {
  const links = [...document.querySelectorAll(".toc a")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const byId = new Map(
    links.map((link) => [link.getAttribute("href").slice(1), link])
  );
  const sections = [...byId.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.removeAttribute("aria-current"));
      const current = byId.get(visible.target.id);
      if (current) current.setAttribute("aria-current", "true");
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
  );
  sections.forEach((section) => observer.observe(section));
}

function sizeDiagrams() {
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  document.querySelectorAll(".diagram svg").forEach((svg) => {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (!box || !box.width || !box.height) return;
    const tall = svg.closest(".diagram-tall");
    if (tall) {
      const avail = Math.max(200, tall.clientWidth - 24);
      const target = Math.min(box.width, avail, 440);
      svg.style.width = `${target}px`;
      svg.style.maxWidth = "100%";
      svg.style.height = `${(box.height / box.width) * target}px`;
      return;
    }
    const wide = box.width / box.height > 1.2;
    if (narrow && wide) {
      const target = Math.min(box.width, 920);
      svg.style.width = `${target}px`;
      svg.style.maxWidth = "none";
      svg.style.height = `${(box.height / box.width) * target}px`;
    } else {
      svg.style.width = "";
      svg.style.maxWidth = "";
      svg.style.height = "";
    }
  });
}

async function initDiagrams() {
  const nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length) return;
  try {
    const mod = await import(
      "https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs"
    );
    const mermaid = mod.default ?? mod;
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      fontFamily: "IBM Plex Sans, sans-serif",
      themeVariables: {
        fontFamily: "IBM Plex Sans, sans-serif",
        fontSize: "16px",
        primaryColor: "#e7eef6",
        primaryTextColor: "#12315c",
        primaryBorderColor: "#8aa0be",
        secondaryColor: "#f8f1de",
        secondaryTextColor: "#12315c",
        secondaryBorderColor: "#a6843d",
        tertiaryColor: "#f4f7fb",
        tertiaryTextColor: "#12315c",
        tertiaryBorderColor: "#d5deea",
        lineColor: "#7a5b22",
        textColor: "#12315c",
        actorBkg: "#e7eef6",
        actorBorder: "#12315c",
        actorTextColor: "#12315c",
        signalColor: "#12315c",
        signalTextColor: "#12315c",
        noteBkgColor: "#f8f1de",
        noteTextColor: "#12315c"
      },
      flowchart: { htmlLabels: true, useMaxWidth: true, curve: "basis" },
      sequence: { useMaxWidth: true, actorMargin: 48, messageMargin: 36 }
    });
    await mermaid.run({ nodes: [...nodes] });
    sizeDiagrams();
    window.addEventListener("resize", sizeDiagrams);
  } catch (error) {
    console.error(error);
  }
}

initReveal();
initParallax();
initProgress();
initToc();
initDiagrams();
