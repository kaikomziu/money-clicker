(() => {
  "use strict";

  const SAVE_KEY = "moneyclicker_v1";
  const OFFLINE_CAP = 8 * 3600; // 秒

  // ===== 定義 =====
  const BIZ = [
    { id: "lemon",   ic: "🍋", nm: "レモネードスタンド", base: 15,        rate: 0.1 },
    { id: "paper",   ic: "📰", nm: "新聞配達",           base: 100,       rate: 1 },
    { id: "vending", ic: "🥤", nm: "自販機",             base: 1100,      rate: 8 },
    { id: "wash",    ic: "🚿", nm: "洗車場",             base: 12000,     rate: 47 },
    { id: "truck",   ic: "🚚", nm: "フードトラック",     base: 130000,    rate: 260 },
    { id: "shop",    ic: "🏪", nm: "コンビニ",           base: 1400000,   rate: 1400 },
    { id: "factory", ic: "🏭", nm: "工場",               base: 20000000,  rate: 7800 },
    { id: "bank",    ic: "🏦", nm: "銀行",               base: 330000000, rate: 44000 },
    { id: "oil",     ic: "🛢️", nm: "油田",               base: 5100000000, rate: 260000 },
    { id: "tech",    ic: "🚀", nm: "テック企業",         base: 75000000000, rate: 1600000 },
  ];

  const CLICKS = [
    { id: "gloves", ic: "🧤", nm: "軍手",         base: 100,       add: 1 },
    { id: "cursor", ic: "🖱️", nm: "高級マウス",   base: 1200,      add: 5 },
    { id: "coffee", ic: "☕", nm: "エナジードリンク", base: 15000,   add: 30 },
    { id: "assist", ic: "🧑‍💼", nm: "アシスタント", base: 220000,  add: 180 },
    { id: "auto",   ic: "🤖", nm: "自動クリッカー", base: 4000000,  add: 1200 },
    { id: "ai",     ic: "🧠", nm: "AIトレーダー",   base: 90000000, add: 12000 },
  ];

  const COST_MULT = 1.15;

  // ===== 状態 =====
  let state = {
    money: 0,
    totalEarned: 0,
    clicks: 0,
    biz: {},
    click: {},
    start: Date.now(),
    last: Date.now(),
  };

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === "object") state = Object.assign(state, s);
    } catch (e) {}
    state.biz = state.biz || {};
    state.click = state.click || {};
  }
  function save() {
    state.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ===== 計算 =====
  const owned = (map, id) => map[id] || 0;
  const costOf = (base, count) => Math.ceil(base * Math.pow(COST_MULT, count));

  function perClick() {
    let v = 1;
    for (const c of CLICKS) v += c.add * owned(state.click, c.id);
    return v;
  }
  function perSecond() {
    let v = 0;
    for (const b of BIZ) v += b.rate * owned(state.biz, b.id);
    return v;
  }

  // ===== 数字表示 =====
  const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  function fmt(n) {
    if (n < 1000) return "$" + (Math.floor(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 1 : 0 });
    let u = 0;
    while (n >= 1000 && u < UNITS.length - 1) { n /= 1000; u++; }
    return "$" + n.toFixed(2) + UNITS[u];
  }
  const fmtInt = (n) => Math.floor(n).toLocaleString("en-US");

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const moneyEl = $("#money"), rateEl = $("#rate"), perClickEl = $("#perclick");
  const listEl = $("#list"), statsBox = $("#statsBox"), toastEl = $("#toast");
  let tab = "biz";

  function buyBiz(b) {
    const c = costOf(b.base, owned(state.biz, b.id));
    if (state.money < c) return;
    state.money -= c;
    state.biz[b.id] = owned(state.biz, b.id) + 1;
    renderShop(); save();
  }
  function buyClick(c) {
    const cost = costOf(c.base, owned(state.click, c.id));
    if (state.money < cost) return;
    state.money -= cost;
    state.click[c.id] = owned(state.click, c.id) + 1;
    renderShop(); save();
  }

  function renderShop() {
    const data = tab === "biz" ? BIZ : CLICKS;
    listEl.innerHTML = "";
    let prevOwned = true;
    for (const it of data) {
      const map = tab === "biz" ? state.biz : state.click;
      const n = owned(map, it.id);
      const cost = costOf(it.base, n);
      const afford = state.money >= cost;
      // 直前が0個かつ自分も0個なら軽くロック表示（段階解禁）
      const locked = !prevOwned && n === 0;
      prevOwned = n > 0 || it === data[0];

      const row = document.createElement("div");
      row.className = "item" + (afford && !locked ? " afford" : "") + (locked ? " locked" : "");
      const rateTxt = tab === "biz"
        ? `+${fmt(it.rate).replace("$", "$")}/秒`
        : `+$${it.add.toLocaleString("en-US")}/クリック`;
      row.innerHTML = `
        <div class="ic">${it.ic}</div>
        <div>
          <div class="nm">${it.nm}</div>
          <div class="rt">${rateTxt}</div>
        </div>
        <div>
          <div class="cost">${fmt(cost)}</div>
          <div class="own">${n}個</div>
        </div>`;
      if (!locked) row.addEventListener("click", () => tab === "biz" ? buyBiz(it) : buyClick(it));
      listEl.appendChild(row);
    }
  }

  function renderStats() {
    const playSec = Math.floor((Date.now() - state.start) / 1000);
    const h = Math.floor(playSec / 3600), m = Math.floor((playSec % 3600) / 60);
    statsBox.innerHTML = `
      <div><span>総獲得額</span><b>${fmt(state.totalEarned)}</b></div>
      <div><span>クリック回数</span><b>${fmtInt(state.clicks)}</b></div>
      <div><span>自動収入</span><b>${fmt(perSecond())}/秒</b></div>
      <div><span>1クリック</span><b>${fmt(perClick())}</b></div>
      <div><span>プレイ時間</span><b>${h}時間${m}分</b></div>`;
  }

  function renderTop() {
    moneyEl.textContent = fmt(state.money);
    rateEl.textContent = fmt(perSecond()) + " / 秒";
    perClickEl.textContent = fmt(perClick());
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  function floatText(x, y, txt) {
    const el = document.createElement("div");
    el.className = "float";
    el.textContent = txt;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ===== クリック =====
  $("#coin").addEventListener("click", (e) => {
    const gain = perClick();
    state.money += gain;
    state.totalEarned += gain;
    state.clicks++;
    const r = e.currentTarget.getBoundingClientRect();
    floatText(
      e.clientX || r.left + r.width / 2,
      e.clientY || r.top + r.height / 2,
      "+" + fmt(gain)
    );
    renderTop();
    renderShop();
  });

  // ===== タブ =====
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      tab = t.dataset.tab;
      renderShop();
    });
  });

  // ===== リセット =====
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("本当に最初からやり直しますか？（セーブが消えます）")) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });

  // ===== ループ =====
  let acc = 0, lastTick = performance.now();
  function loop(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const ps = perSecond();
    if (ps > 0) {
      const g = ps * dt;
      state.money += g;
      state.totalEarned += g;
    }
    renderTop();
    acc += dt;
    if (acc > 0.5) { acc = 0; renderShop(); renderStats(); }
    requestAnimationFrame(loop);
  }

  // ===== オフライン収入 =====
  function offline() {
    const elapsed = Math.min((Date.now() - (state.last || Date.now())) / 1000, OFFLINE_CAP);
    if (elapsed < 60) return;
    const g = perSecond() * elapsed;
    if (g <= 0) return;
    state.money += g;
    state.totalEarned += g;
    const mins = Math.floor(elapsed / 60);
    toast(`おかえりなさい！ 不在中に ${fmt(g)} 稼ぎました（${mins}分）`);
  }

  // ===== 起動 =====
  load();
  offline();
  document.getElementById("ver").textContent = "v" + (window.APP_VERSION || "1.0.0");
  renderTop();
  renderShop();
  renderStats();
  requestAnimationFrame(loop);
  setInterval(save, 10000);
  window.addEventListener("beforeunload", save);
})();
