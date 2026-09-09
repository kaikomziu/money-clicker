(() => {
  "use strict";

  const SAVE_KEY = "moneyclicker_v1";
  const REBIRTH_MIN = 1_000_000; // 転生解禁ライン（この転生で稼いだ額）

  // ===== 定義 =====
  const BIZ = [
    { id: "lemon",   ic: "🍋", nm: "レモネードスタンド", base: 15,          rate: 0.1 },
    { id: "paper",   ic: "📰", nm: "新聞配達",           base: 100,         rate: 1 },
    { id: "vending", ic: "🥤", nm: "自販機",             base: 1100,        rate: 8 },
    { id: "wash",    ic: "🚿", nm: "洗車場",             base: 12000,       rate: 47 },
    { id: "truck",   ic: "🚚", nm: "フードトラック",     base: 130000,      rate: 260 },
    { id: "shop",    ic: "🏪", nm: "コンビニ",           base: 1400000,     rate: 1400 },
    { id: "factory", ic: "🏭", nm: "工場",               base: 20000000,    rate: 7800 },
    { id: "bank",    ic: "🏦", nm: "銀行",               base: 330000000,   rate: 44000 },
    { id: "oil",     ic: "🛢️", nm: "油田",               base: 5100000000,  rate: 260000 },
    { id: "tech",    ic: "🚀", nm: "テック企業",         base: 75000000000, rate: 1600000 },
  ];

  const CLICKS = [
    { id: "gloves", ic: "🧤", nm: "軍手",           base: 100,      add: 1 },
    { id: "cursor", ic: "🖱️", nm: "高級マウス",     base: 1200,     add: 5 },
    { id: "coffee", ic: "☕", nm: "エナジードリンク", base: 15000,    add: 30 },
    { id: "assist", ic: "🧑‍💼", nm: "アシスタント",   base: 220000,   add: 180 },
    { id: "auto",   ic: "🤖", nm: "自動クリッカー",  base: 4000000,  add: 1200 },
    { id: "ai",     ic: "🧠", nm: "AIトレーダー",    base: 90000000, add: 12000 },
  ];

  const COST_MULT = 1.15;

  // ===== 転生ツリー =====
  // x,y は tree(640x600) 内のピクセル座標
  const TREE = [
    { id: "root", root: true, x: 320, y: 40, nm: "🌱" },

    // 左：クリック
    { id: "A1", x: 110, y: 130, req: ["root"],  cost: 1,   nm: "クリック力 ×2",             eff: { clickMul: 2 } },
    { id: "A2", x: 110, y: 235, req: ["A1"],     cost: 3,   nm: "クリック力 ×3",             eff: { clickMul: 3 } },
    { id: "A3", x: 110, y: 340, req: ["A2"],     cost: 8,   nm: "クリック力 ×5",             eff: { clickMul: 5 } },
    { id: "A4", x: 110, y: 445, req: ["A3"],     cost: 20,  nm: "自動収入の5%をクリックに加算", eff: { clickFromPs: 0.05 } },

    // 中央：ビジネス
    { id: "B1", x: 300, y: 135, req: ["root"],   cost: 1,   nm: "自動収入 ×2",               eff: { psMul: 2 } },
    { id: "B2", x: 235, y: 240, req: ["B1"],     cost: 4,   nm: "自動収入 ×3",               eff: { psMul: 3 } },
    { id: "B3", x: 235, y: 345, req: ["B2"],     cost: 12,  nm: "自動収入 ×5",               eff: { psMul: 5 } },
    { id: "B4", x: 375, y: 240, req: ["B1"],     cost: 6,   nm: "購入価格 -10%",             eff: { costMul: 0.9 } },
    { id: "B5", x: 375, y: 345, req: ["B4"],     cost: 25,  nm: "購入価格 さらに -25%",       eff: { costMul: 0.75 } },
    { id: "B6", x: 305, y: 460, req: ["B3", "B5"], cost: 70, nm: "自動収入 ×10",             eff: { psMul: 10 } },

    // 右：転生
    { id: "C1", x: 500, y: 135, req: ["root"],   cost: 1,   nm: "転生後 $1,000 スタート",     eff: { start: 1000 } },
    { id: "C2", x: 500, y: 240, req: ["C1"],     cost: 6,   nm: "転生後 $250,000 スタート",   eff: { start: 250000 } },
    { id: "C3", x: 555, y: 345, req: ["C1"],     cost: 3,   nm: "オフライン上限24h・全効率",   eff: { offline: true } },
    { id: "C4", x: 500, y: 445, req: ["root"],   cost: 10,  nm: "🥇獲得量 +30%",             eff: { barBonus: 0.3 } },
    { id: "C5", x: 445, y: 540, req: ["C4", "C3"], cost: 45, nm: "🥇獲得量 さらに +60%",     eff: { barBonus: 0.6 } },
    { id: "C6", x: 300, y: 560, req: ["B6", "C2"], cost: 130, nm: "全収入 ×(1 + 転生回数×0.15)", eff: { rebirthScale: 0.15 } },
  ];
  const NODE = Object.fromEntries(TREE.map((n) => [n.id, n]));

  // ===== 状態 =====
  const fresh = () => ({
    money: 0,
    biz: {},
    click: {},
    runEarned: 0,        // この転生で稼いだ額
    runStart: Date.now(),
  });
  let state = Object.assign(fresh(), {
    bars: 0,             // 所持ゴールドバー
    rebirths: 0,
    tree: {},            // 取得済みノード
    lifetimeEarned: 0,
    totalClicks: 0,
    start: Date.now(),
    last: Date.now(),
  });

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === "object") state = Object.assign(state, s);
    } catch (e) {}
    state.biz = state.biz || {};
    state.click = state.click || {};
    state.tree = state.tree || {};
  }
  function save() {
    state.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ===== ツリー効果の集計 =====
  function eff() {
    let clickMul = 1, psMul = 1, costMul = 1, clickFromPs = 0, start = 0, barBonus = 0, offline = false, global = 1;
    for (const id in state.tree) {
      const n = NODE[id]; if (!n || !n.eff) continue;
      const e = n.eff;
      if (e.clickMul) clickMul *= e.clickMul;
      if (e.psMul) psMul *= e.psMul;
      if (e.costMul) costMul *= e.costMul;
      if (e.clickFromPs) clickFromPs += e.clickFromPs;
      if (e.start) start = Math.max(start, e.start);
      if (e.barBonus) barBonus += e.barBonus;
      if (e.offline) offline = true;
      if (e.rebirthScale) global *= 1 + state.rebirths * e.rebirthScale;
    }
    return { clickMul, psMul, costMul, clickFromPs, start, barBonus, offline, global };
  }

  // ===== 計算 =====
  const owned = (map, id) => map[id] || 0;
  function costOf(base, count) {
    return Math.ceil(base * Math.pow(COST_MULT, count) * eff().costMul);
  }
  function perSecond() {
    const E = eff();
    let v = 0;
    for (const b of BIZ) v += b.rate * owned(state.biz, b.id);
    return v * E.psMul * E.global;
  }
  function perClick() {
    const E = eff();
    let base = 1;
    for (const c of CLICKS) base += c.add * owned(state.click, c.id);
    return base * E.clickMul * E.global + perSecond() * E.clickFromPs;
  }

  // ===== 転生で得られるゴールドバー =====
  function barsFor(runEarned) {
    if (runEarned < REBIRTH_MIN) return 0;
    const raw = Math.sqrt(runEarned / REBIRTH_MIN);
    return Math.floor(raw * (1 + eff().barBonus));
  }

  // ===== 数字表示 =====
  const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  function fmt(n) {
    if (!isFinite(n)) return "$∞";
    if (n < 1000) {
      const d = n < 10 && n % 1 !== 0 ? 1 : 0;
      return "$" + n.toLocaleString("en-US", { maximumFractionDigits: d });
    }
    let u = 0;
    while (n >= 1000 && u < UNITS.length - 1) { n /= 1000; u++; }
    return "$" + n.toFixed(2) + UNITS[u];
  }
  const fmtInt = (n) => Math.floor(n).toLocaleString("en-US");
  const bar = (n) => "🥇" + fmtInt(n);

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const moneyEl = $("#money"), rateEl = $("#rate"), perClickEl = $("#perclick");
  const listEl = $("#list"), statsBox = $("#statsBox"), toastEl = $("#toast");
  const barLine = $("#barLine"), barsOwnedEl = $("#barsOwned");
  const rebirthOpen = $("#rebirthOpen"), rebirthHint = $("#rebirthHint");
  const view = $("#rebirthView"), treeEl = $("#tree"), treeLines = $("#treeLines");
  let tab = "biz";

  // ===== ショップ =====
  function buy(list, map, it) {
    const cost = costOf(it.base, owned(map, it.id));
    if (state.money < cost) return;
    state.money -= cost;
    map[it.id] = owned(map, it.id) + 1;
    renderShop(); save();
  }

  function renderShop() {
    const data = tab === "biz" ? BIZ : CLICKS;
    const map = tab === "biz" ? state.biz : state.click;
    listEl.innerHTML = "";
    let prevOwned = true;
    data.forEach((it, idx) => {
      const n = owned(map, it.id);
      const cost = costOf(it.base, n);
      const afford = state.money >= cost;
      const locked = !prevOwned && n === 0;
      prevOwned = n > 0 || idx === 0;

      const row = document.createElement("div");
      row.className = "item" + (afford && !locked ? " afford" : "") + (locked ? " locked" : "");
      const rt = tab === "biz"
        ? `+${fmt(it.rate)}/秒`
        : `+$${it.add.toLocaleString("en-US")}/クリック`;
      row.innerHTML = `
        <div class="ic">${it.ic}</div>
        <div><div class="nm">${it.nm}</div><div class="rt">${rt}</div></div>
        <div><div class="cost">${fmt(cost)}</div><div class="own">${n}個</div></div>`;
      if (!locked) row.addEventListener("click", () => buy(data, map, it));
      listEl.appendChild(row);
    });
  }

  function renderStats() {
    const sec = Math.floor((Date.now() - state.start) / 1000);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    statsBox.innerHTML = `
      <div><span>今回の獲得額</span><b>${fmt(state.runEarned)}</b></div>
      <div><span>累計獲得額</span><b>${fmt(state.lifetimeEarned)}</b></div>
      <div><span>自動収入</span><b>${fmt(perSecond())}/秒</b></div>
      <div><span>1クリック</span><b>${fmt(perClick())}</b></div>
      <div><span>転生回数</span><b>${state.rebirths}</b></div>
      <div><span>ゴールドバー</span><b>${bar(state.bars)}</b></div>
      <div><span>クリック回数</span><b>${fmtInt(state.totalClicks)}</b></div>
      <div><span>プレイ時間</span><b>${h}時間${m}分</b></div>`;
  }

  function renderTop() {
    moneyEl.textContent = fmt(state.money);
    rateEl.textContent = fmt(perSecond()) + " / 秒";
    perClickEl.textContent = fmt(perClick());

    const unlocked = state.rebirths > 0 || state.runEarned >= REBIRTH_MIN;
    rebirthOpen.hidden = !unlocked;
    barLine.hidden = !(unlocked || state.bars > 0);
    barsOwnedEl.textContent = bar(state.bars);
    if (unlocked) {
      const g = barsFor(state.runEarned);
      rebirthHint.textContent = g > 0 ? `今なら +${bar(g)}` : `あと ${fmt(REBIRTH_MIN - state.runEarned)} で1本`;
    }
  }

  // ===== ツリー描画 =====
  function nodeState(n) {
    if (n.root) return "owned";
    if (state.tree[n.id]) return "owned";
    const reqOk = (n.req || []).every((r) => r === "root" || state.tree[r]);
    if (!reqOk) return "locked";
    return state.bars >= n.cost ? "can" : "avail";
  }

  function renderTree() {
    $("#ovBars").textContent = bar(state.bars);
    $("#ovCount").textContent = state.rebirths;
    const gain = barsFor(state.runEarned);
    $("#ovGain").textContent = bar(gain);
    const canReb = state.runEarned >= REBIRTH_MIN;
    $("#doRebirth").disabled = !canReb;
    $("#ovNote").textContent = canReb
      ? "転生すると所持金・ビジネス・クリック強化がリセットされ、ゴールドバーを獲得します。"
      : `転生には今回 ${fmt(REBIRTH_MIN)} の獲得が必要（現在 ${fmt(state.runEarned)}）。`;
    const spent = TREE.reduce((s, n) => s + (state.tree[n.id] ? (n.cost || 0) : 0), 0);
    $("#respec").disabled = spent === 0;
    $("#respec").textContent = spent === 0 ? "振り直し" : `振り直し（🥇${spent} 返却）`;

    // ノード
    [...treeEl.querySelectorAll(".tnode")].forEach((e) => e.remove());
    for (const n of TREE) {
      const st = nodeState(n);
      const el = document.createElement("div");
      el.className = "tnode " + (n.root ? "rootnode " : "") +
        (st === "owned" ? "owned" : st === "can" ? "can" : st === "locked" ? "locked" : "");
      el.style.left = n.x + "px";
      el.style.top = n.y + "px";
      el.innerHTML = n.root
        ? n.nm
        : `<div class="tn">${n.nm}</div><div class="tc">${state.tree[n.id] ? "取得済" : "🥇" + n.cost}</div>`;
      if (!n.root) el.addEventListener("click", () => buyNode(n));
      treeEl.appendChild(el);
    }

    // 線
    const seg = [];
    for (const n of TREE) {
      for (const r of n.req || []) {
        const p = NODE[r]; if (!p) continue;
        const on = (state.tree[n.id] || nodeState(n) !== "locked") && (r === "root" || state.tree[r]);
        seg.push(`<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}"
          stroke="${state.tree[n.id] ? "#3ddc84" : on ? "#7ad0ff" : "#1f4530"}"
          stroke-width="${state.tree[n.id] ? 3 : 2}" />`);
      }
    }
    treeLines.setAttribute("viewBox", "0 0 640 600");
    treeLines.innerHTML = seg.join("");
  }

  function buyNode(n) {
    if (state.tree[n.id]) return;
    if (nodeState(n) === "locked") { toast("前提のアップグレードが必要です"); return; }
    if (state.bars < n.cost) { toast("ゴールドバーが足りません"); return; }
    state.bars -= n.cost;
    state.tree[n.id] = true;
    renderTree(); renderTop(); renderShop(); save();
  }

  function respec() {
    const spent = TREE.reduce((s, n) => s + (state.tree[n.id] ? (n.cost || 0) : 0), 0);
    if (spent === 0) return;
    if (!confirm(`ツリーを全て振り直します。🥇${spent} が戻ります。よろしいですか？`)) return;
    state.bars += spent;
    state.tree = {};
    renderTree(); renderTop(); renderShop(); save();
  }

  function doRebirth() {
    const g = barsFor(state.runEarned);
    if (state.runEarned < REBIRTH_MIN) return;
    if (!confirm(`転生して ${bar(g)} を獲得します。\n所持金・ビジネス・クリック強化はリセットされます。（ツリーとゴールドバーは維持）`)) return;
    state.bars += g;
    state.rebirths += 1;
    const startMoney = eff().start;
    Object.assign(state, fresh());
    state.money = startMoney;
    tab = "biz";
    document.querySelectorAll(".tab").forEach((x, i) => x.classList.toggle("active", i === 0));
    renderTree(); renderShop(); renderStats(); renderTop();
    save();
    toast(`転生しました！ ${bar(g)} 獲得（通算 ${state.rebirths} 回）`);
  }

  // ===== 演出 =====
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 3400);
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

  // ===== 入力 =====
  $("#coin").addEventListener("click", (e) => {
    const gain = perClick();
    state.money += gain;
    state.runEarned += gain;
    state.lifetimeEarned += gain;
    state.totalClicks++;
    const r = e.currentTarget.getBoundingClientRect();
    floatText(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, "+" + fmt(gain));
    renderTop(); renderShop();
  });

  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      tab = t.dataset.tab;
      renderShop();
    });
  });

  rebirthOpen.addEventListener("click", () => { view.hidden = false; renderTree(); });
  $("#ovClose").addEventListener("click", () => { view.hidden = true; });
  view.addEventListener("click", (e) => { if (e.target === view) view.hidden = true; });
  $("#doRebirth").addEventListener("click", doRebirth);
  $("#respec").addEventListener("click", respec);

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("本当に最初からやり直しますか？（転生・ツリーを含む全セーブが消えます）")) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });

  // ===== ループ =====
  let acc = 0, lastTick = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTick) / 1000, 1);
    lastTick = now;
    const ps = perSecond();
    if (ps > 0) {
      const g = ps * dt;
      state.money += g;
      state.runEarned += g;
      state.lifetimeEarned += g;
    }
    renderTop();
    acc += dt;
    if (acc > 0.5) { acc = 0; renderShop(); renderStats(); if (!view.hidden) renderTree(); }
    requestAnimationFrame(loop);
  }

  // ===== オフライン収入 =====
  function offlineEarn() {
    const E = eff();
    const capH = E.offline ? 24 : 8;
    const rate = E.offline ? 1 : 0.6;
    const elapsed = Math.min((Date.now() - (state.last || Date.now())) / 1000, capH * 3600);
    if (elapsed < 60) return;
    const g = perSecond() * elapsed * rate;
    if (g <= 0) return;
    state.money += g;
    state.runEarned += g;
    state.lifetimeEarned += g;
    toast(`おかえりなさい！ 不在中に ${fmt(g)} 稼ぎました（${Math.floor(elapsed / 60)}分・効率${Math.round(rate * 100)}%）`);
  }

  // ===== 起動 =====
  load();
  offlineEarn();
  $("#ver").textContent = "v" + (window.APP_VERSION || "1.1.0");
  renderTop();
  renderShop();
  renderStats();
  requestAnimationFrame(loop);
  setInterval(save, 10000);
  window.addEventListener("beforeunload", save);
})();
