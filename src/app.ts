import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

// ── API stubs (Claude wires these to SQS during the demo) ──────────

app.get("/status", (c) => {
  return c.json({ connected: false, queueUrl: null, messageCount: 0 });
});

app.post("/notify", async (c) => {
  return c.json({ error: "Queue not configured" }, 503);
});

app.get("/messages", (c) => {
  return c.json({ messages: [] });
});

// ── Dashboard ───────────────────────────────────────────────────────

app.get("/", (c) => {
  return c.html(dashboard);
});

const dashboard = /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifications</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg-base:     #07070a;
      --bg-surface:  #0e0e12;
      --bg-raised:   #151519;
      --bg-elevated: #1c1c21;
      --border:      #27272a;
      --border-dim:  #1a1a1f;
      --text:        #ededef;
      --text-2:      #a0a0ab;
      --text-3:      #55555e;
      --accent:      #34d399;
      --accent-2:    #059669;
      --accent-glow: rgba(52, 211, 153, 0.12);
      --red:         #f87171;
      --red-dim:     rgba(248, 113, 113, 0.12);
      --blue:        #60a5fa;
      --blue-dim:    rgba(96, 165, 250, 0.12);
      --amber:       #fbbf24;
      --amber-dim:   rgba(251, 191, 36, 0.12);
      --green:       #34d399;
      --green-dim:   rgba(52, 211, 153, 0.12);
      --font:        'Outfit', system-ui, -apple-system, sans-serif;
      --mono:        'JetBrains Mono', ui-monospace, monospace;
      --radius:      10px;
      --radius-sm:   6px;
    }

    html { height: 100%; }

    body {
      font-family: var(--font);
      background: var(--bg-base);
      color: var(--text);
      min-height: 100%;
      -webkit-font-smoothing: antialiased;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(52,211,153,0.04), transparent),
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.012) 1px, transparent 0);
      background-size: 100% 100%, 20px 20px;
    }

    /* ── Layout ─────────────────────────────────── */

    .app {
      max-width: 680px;
      margin: 0 auto;
      padding: 56px 20px 80px;
    }

    /* ── Header ─────────────────────────────────── */

    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 36px;
    }

    .hdr-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--red);
      flex-shrink: 0;
      position: relative;
    }

    .dot.on {
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent-glow);
    }

    .dot.on::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 1.5px solid var(--accent);
      opacity: 0.4;
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes ping {
      0%   { transform: scale(1);   opacity: 0.4; }
      75%  { transform: scale(1.8); opacity: 0; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    .hdr h1 {
      font-size: 21px;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .hdr-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .hdr-status {
      font-size: 13px;
      color: var(--text-3);
    }

    .hdr-status b {
      font-weight: 500;
      color: var(--red);
      transition: color 0.3s;
    }

    .hdr-status.on b {
      color: var(--accent);
    }

    .hdr-count {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-3);
      background: var(--bg-surface);
      border: 1px solid var(--border-dim);
      padding: 4px 11px;
      border-radius: 100px;
    }

    /* ── Compose ────────────────────────────────── */

    .compose {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius);
      margin-bottom: 36px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .compose:focus-within {
      border-color: rgba(52, 211, 153, 0.4);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .compose-type {
      font-family: var(--font);
      font-size: 13px;
      font-weight: 500;
      color: var(--text-2);
      background: var(--bg-raised);
      border: none;
      border-right: 1px solid var(--border-dim);
      padding: 15px 30px 15px 14px;
      border-radius: var(--radius) 0 0 var(--radius);
      cursor: pointer;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='none'%3E%3Cpath d='M2 3.5l3 3 3-3' stroke='%2355555e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }

    .compose-type option {
      background: var(--bg-raised);
      color: var(--text);
    }

    .compose-input {
      flex: 1;
      font-family: var(--font);
      font-size: 14px;
      color: var(--text);
      background: transparent;
      border: none;
      padding: 15px 16px;
      outline: none;
      min-width: 0;
    }

    .compose-input::placeholder { color: var(--text-3); }

    .compose-btn {
      font-family: var(--font);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--bg-base);
      background: var(--accent);
      border: none;
      padding: 9px 20px;
      margin: 5px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      white-space: nowrap;
    }

    .compose-btn:hover { background: var(--accent-2); }
    .compose-btn:active { transform: scale(0.97); }
    .compose-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%  { transform: translateX(-4px); }
      40%  { transform: translateX(4px); }
      60%  { transform: translateX(-3px); }
      80%  { transform: translateX(2px); }
    }

    .compose-btn.shake { animation: shake 0.4s ease; }

    /* ── Divider ────────────────────────────────── */

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .divider span {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-3);
      white-space: nowrap;
    }

    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-dim);
    }

    /* ── Empty state ────────────────────────────── */

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: var(--text-3);
    }

    .empty svg {
      width: 36px;
      height: 36px;
      margin-bottom: 14px;
      opacity: 0.25;
      animation: swing 4s ease-in-out infinite;
      transform-origin: top center;
    }

    @keyframes swing {
      0%, 40%, 100% { transform: rotate(0deg); }
      5%  { transform: rotate(12deg); }
      10% { transform: rotate(-10deg); }
      15% { transform: rotate(6deg); }
      20% { transform: rotate(-3deg); }
      25% { transform: rotate(0deg); }
    }

    .empty p {
      font-size: 14px;
      font-weight: 400;
    }

    /* ── Feed ───────────────────────────────────── */

    .feed {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    /* ── Card ───────────────────────────────────── */

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius);
      padding: 14px 16px;
      animation: slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      transition: border-color 0.15s;
    }

    .card:hover { border-color: var(--border); }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(-10px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 3px 9px 3px 7px;
      border-radius: 100px;
      flex-shrink: 0;
      line-height: 1;
    }

    .badge::before {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .badge.info    { color: var(--blue);  background: var(--blue-dim);  }
    .badge.success { color: var(--green); background: var(--green-dim); }
    .badge.warning { color: var(--amber); background: var(--amber-dim); }
    .badge.alert   { color: var(--red);   background: var(--red-dim);   }

    .card-msg {
      font-size: 14px;
      line-height: 1.5;
      color: var(--text);
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--text-3);
    }

    .card-id {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: -0.02em;
    }

    .card-sep { opacity: 0.4; }

    /* ── Toasts ─────────────────────────────────── */

    .toasts {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
      pointer-events: none;
    }

    .toast {
      font-family: var(--font);
      font-size: 13px;
      font-weight: 500;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast.ok  { border-color: rgba(52,211,153,0.4);  color: var(--accent); }
    .toast.err { border-color: rgba(248,113,113,0.4);  color: var(--red); }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes toast-out {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(8px) scale(0.96); }
    }

    /* ── Responsive ─────────────────────────────── */

    @media (max-width: 520px) {
      .hdr { flex-direction: column; align-items: flex-start; gap: 12px; }
      .hdr-right { width: 100%; }
      .compose { flex-wrap: wrap; }
      .compose-type { border-radius: var(--radius) var(--radius) 0 0; border-right: none; border-bottom: 1px solid var(--border-dim); width: 100%; }
      .compose-btn { width: calc(100% - 10px); margin: 0 5px 5px; }
    }
  </style>
</head>
<body>
  <div class="app">

    <!-- Header -->
    <header class="hdr">
      <div class="hdr-left">
        <div class="dot" id="dot"></div>
        <h1>Notifications</h1>
      </div>
      <div class="hdr-right">
        <span class="hdr-status" id="hdrStatus"><b>Disconnected</b></span>
        <span class="hdr-count" id="hdrCount">0 sent</span>
      </div>
    </header>

    <!-- Compose -->
    <form class="compose" id="compose" onsubmit="return false">
      <select class="compose-type" id="nType">
        <option value="info">Info</option>
        <option value="success">Success</option>
        <option value="warning">Warning</option>
        <option value="alert">Alert</option>
      </select>
      <input class="compose-input" id="nMsg" type="text" placeholder="Type a notification…" autocomplete="off" spellcheck="false">
      <button class="compose-btn" id="nSend" type="submit">Send</button>
    </form>

    <!-- Feed -->
    <div class="divider"><span>Activity</span></div>

    <div class="empty" id="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <p>No notifications yet</p>
    </div>

    <div class="feed" id="feed"></div>
  </div>

  <div class="toasts" id="toasts"></div>

  <script>
    const $ = (s) => document.getElementById(s);
    const dot      = $('dot');
    const hdrSt    = $('hdrStatus');
    const hdrCt    = $('hdrCount');
    const nMsg     = $('nMsg');
    const nType    = $('nType');
    const nSend    = $('nSend');
    const feed     = $('feed');
    const empty    = $('empty');
    const toasts   = $('toasts');

    let seen = new Set();

    // ── Status ──────────────────────────────────

    async function pollStatus() {
      try {
        const r = await fetch('/status');
        const d = await r.json();
        if (d.connected) {
          dot.classList.add('on');
          hdrSt.classList.add('on');
          hdrSt.querySelector('b').textContent = 'Connected';
        } else {
          dot.classList.remove('on');
          hdrSt.classList.remove('on');
          hdrSt.querySelector('b').textContent = 'Disconnected';
        }
        hdrCt.textContent = d.messageCount + ' sent';
      } catch {}
    }

    // ── Messages ────────────────────────────────

    async function pollMessages() {
      try {
        const r = await fetch('/messages');
        const d = await r.json();
        if (!d.messages || d.messages.length === 0) return;
        empty.style.display = 'none';

        for (const m of d.messages) {
          if (seen.has(m.id)) continue;
          seen.add(m.id);

          const el = document.createElement('div');
          el.className = 'card';
          el.innerHTML =
            '<div class="card-top">' +
              '<span class="badge ' + esc(m.type) + '">' + esc(m.type) + '</span>' +
              '<span class="card-msg">' + esc(m.message) + '</span>' +
            '</div>' +
            '<div class="card-meta">' +
              '<span class="card-id">' + esc(m.id) + '</span>' +
              '<span class="card-sep">&middot;</span>' +
              '<span>' + ago(m.timestamp) + '</span>' +
            '</div>';

          feed.prepend(el);
        }
      } catch {}
    }

    // ── Send ────────────────────────────────────

    async function send() {
      const message = nMsg.value.trim();
      if (!message) { nMsg.focus(); return; }

      nSend.disabled = true;
      try {
        const r = await fetch('/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, type: nType.value }),
        });

        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          toast(d.error || 'Send failed', 'err');
          nSend.classList.add('shake');
          setTimeout(() => nSend.classList.remove('shake'), 400);
          return;
        }

        nMsg.value = '';
        toast('Queued', 'ok');
        await pollMessages();
        await pollStatus();
      } catch {
        toast('Network error', 'err');
      } finally {
        nSend.disabled = false;
        nMsg.focus();
      }
    }

    nSend.addEventListener('click', send);
    nMsg.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    // ── Toasts ──────────────────────────────────

    function toast(msg, cls) {
      const el = document.createElement('div');
      el.className = 'toast' + (cls ? ' ' + cls : '');
      el.textContent = msg;
      toasts.appendChild(el);
      setTimeout(() => {
        el.style.animation = 'toast-out 0.2s ease forwards';
        el.addEventListener('animationend', () => el.remove());
      }, 2200);
    }

    // ── Helpers ─────────────────────────────────

    function ago(ts) {
      const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
      if (s < 3) return 'just now';
      if (s < 60) return s + 's ago';
      if (s < 3600) return Math.floor(s / 60) + 'm ago';
      return Math.floor(s / 3600) + 'h ago';
    }

    function esc(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    // ── Init ────────────────────────────────────

    pollStatus();
    pollMessages();
    setInterval(pollStatus, 3000);
    setInterval(pollMessages, 2000);
  </script>
</body>
</html>`;

export { app };
