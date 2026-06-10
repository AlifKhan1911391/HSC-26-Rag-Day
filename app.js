/* ═══════════════════════════════════════════════
   HSC 2026 RAG DAY — app.js
   BKSP Public School & College
═══════════════════════════════════════════════ */

const API = {
  register:     "/.netlify/functions/register",
  participants: "/.netlify/functions/get-participants",
};

let allParticipants = [];
let activeFilter    = "All";

/* ──────────────── INIT ──────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMobileMenu();
  initTabs();
  initForm();
  fetchParticipants();
});

/* ──────────────── NAVBAR scroll effect ──────────────── */
function initNavbar() {
  const nb = document.getElementById("navbar");
  if (!nb) return;
  window.addEventListener("scroll", () => {
    nb.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
}

/* ──────────────── MOBILE MENU ──────────────── */
function initMobileMenu() {
  const btn = document.getElementById("hamburger");
  if (!btn) return;
  let menuEl = null;

  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    if (!menuEl) {
      menuEl = document.createElement("div");
      menuEl.className = "mobile-menu";
      menuEl.innerHTML = `
        <a href="#register" class="btn btn-gold" style="text-align:center">Register Now</a>
        <a href="#participants">Participants</a>
      `;
      menuEl.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        btn.classList.remove("open");
        menuEl.remove();
        menuEl = null;
      }));
      document.body.appendChild(menuEl);
    } else {
      menuEl.remove();
      menuEl = null;
    }
  });
}

/* ──────────────── FETCH PARTICIPANTS ──────────────── */
async function fetchParticipants() {
  try {
    const res = await fetch(API.participants);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    allParticipants = Array.isArray(data) ? data : [];
    updateStats(allParticipants);
    renderGrid(allParticipants, activeFilter);
  } catch {
    renderError();
  }
}

/* ──────────────── STATS ──────────────── */
function updateStats(data) {
  const count = (s) => s === "All" ? data.length : data.filter(p => p.section === s).length;

  animateNum("totalCount", count("All"));
  animateNum("secACount",  count("A"));
  animateNum("secBCount",  count("B"));
  animateNum("secCCount",  count("C"));
  animateNum("secDCount",  count("D"));

  // Tab badges
  setTabBadge("tabAll", count("All"));
  setTabBadge("tabA",   count("A"));
  setTabBadge("tabB",   count("B"));
  setTabBadge("tabC",   count("C"));
  setTabBadge("tabD",   count("D"));
}

function setTabBadge(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) { if(el) el.textContent = 0; return; }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 24));
  const timer = setInterval(() => {
    cur += step;
    if (cur >= target) { cur = target; clearInterval(timer); }
    el.textContent = cur;
  }, 38);
}

/* ──────────────── RENDER GRID ──────────────── */
function renderGrid(data, filter) {
  const grid = document.getElementById("pGrid");
  const list = filter === "All" ? data : data.filter(p => p.section === filter);

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="p-empty">
        <div class="p-empty-icon">📋</div>
        <p>${filter === "All"
            ? "No one has registered yet — be the first!"
            : `No participants in Section ${filter} yet.`}</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <div class="p-card" style="animation-delay: ${Math.min(i * 0.04, 0.6)}s">
      <div class="p-avatar">${getInitials(p.name)}</div>
      <div class="p-info">
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-meta">Serial&nbsp;#${esc(p.serial)}</div>
        <span class="p-tag">Sec ${esc(p.section)}</span>
      </div>
    </div>
  `).join("");
}

function renderError() {
  const grid = document.getElementById("pGrid");
  grid.innerHTML = `
    <div class="p-empty">
      <div class="p-empty-icon">⚠️</div>
      <p>Failed to load participants.<br/>Please refresh the page.</p>
    </div>`;
}

/* ──────────────── TABS ──────────────── */
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected","false"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected","true");
      activeFilter = tab.dataset.f;
      renderGrid(allParticipants, activeFilter);
    });
  });
}

/* ──────────────── FORM ──────────────── */
function initForm() {
  const form     = document.getElementById("regForm");
  const submitBtn= document.getElementById("submitBtn");
  const btnLabel = document.getElementById("btnLabel");
  const btnSpin  = document.getElementById("btnSpin");
  const formMsg  = document.getElementById("formMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    if (!validateForm()) return;

    // ── Loading state ──
    submitBtn.disabled = true;
    btnLabel.textContent = "Registering";
    btnSpin.classList.remove("hidden");
    hideMessage(formMsg);

    const payload = {
      name:    document.getElementById("fullName").value.trim(),
      serial:  document.getElementById("serial").value.trim(),
      section: document.getElementById("section").value,
    };

    try {
      const res  = await fetch(API.register, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        showMessage(formMsg, "success",
          "🎉 Registration successful! Welcome to Rag Day 2026.");
        form.reset();

        // Optimistic update
        allParticipants.push({
          ...payload,
          id:           Date.now(),
          registeredAt: new Date().toISOString(),
        });
        updateStats(allParticipants);
        renderGrid(allParticipants, activeFilter);

        // Scroll to participants after brief delay
        setTimeout(() => {
          document.getElementById("participants")
            .scrollIntoView({ behavior: "smooth", block: "start" });
        }, 1400);
      } else {
        showMessage(formMsg, "error",
          "❌ " + (json.error || "Registration failed. Please try again."));
      }

    } catch {
      showMessage(formMsg, "error",
        "❌ Network error. Check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      btnLabel.textContent = "Complete Registration";
      btnSpin.classList.add("hidden");
    }
  });
}

/* ──────────────── VALIDATION ──────────────── */
function validateForm() {
  let ok = true;

  const name    = document.getElementById("fullName").value.trim();
  const serial  = document.getElementById("serial").value.trim();
  const section = document.getElementById("section").value;

  if (!name) {
    setError("nameErr", "Full name is required.");
    document.getElementById("fullName").classList.add("invalid");
    ok = false;
  }
  if (!serial) {
    setError("serialErr", "Serial number is required.");
    document.getElementById("serial").classList.add("invalid");
    ok = false;
  }
  if (!section) {
    setError("sectionErr", "Please select your section.");
    ok = false;
  }
  return ok;
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  ["nameErr","serialErr","sectionErr"].forEach(id => setError(id, ""));
  ["fullName","serial"].forEach(id => {
    document.getElementById(id)?.classList.remove("invalid");
  });
}

/* ──────────────── MESSAGE ──────────────── */
function showMessage(el, type, text) {
  el.textContent = text;
  el.className   = `form-msg ${type}`;
  el.classList.remove("hidden");
}
function hideMessage(el) {
  el.className = "form-msg hidden";
  el.textContent = "";
}

/* ──────────────── HELPERS ──────────────── */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join("") || "?";
}

function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
