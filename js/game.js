(() => {
  "use strict";

  const SAVE_KEY = "moneyclicker_v1";
  const REBIRTH_MIN = 1_000_000;

  // ===== 建物（自動収入）=====
  const BIZ = [
    { id: "lemon",   ic: "🍋", nm: "レモネードスタンド",     base: 15,               rate: 0.1 },
    { id: "paper",   ic: "📰", nm: "新聞配達",               base: 100,              rate: 1 },
    { id: "vending", ic: "🥤", nm: "自販機",                 base: 1100,             rate: 8 },
    { id: "wash",    ic: "🚿", nm: "洗車場",                 base: 12000,            rate: 47 },
    { id: "truck",   ic: "🚚", nm: "フードトラック",         base: 130000,           rate: 260 },
    { id: "shop",    ic: "🏪", nm: "コンビニ",               base: 1400000,          rate: 1400 },
    { id: "factory", ic: "🏭", nm: "工場",                   base: 20000000,         rate: 7800 },
    { id: "bank",    ic: "🏦", nm: "銀行",                   base: 330000000,        rate: 44000 },
    { id: "oil",     ic: "🛢️", nm: "油田",                   base: 5100000000,       rate: 260000 },
    { id: "tech",    ic: "🚀", nm: "テック企業",             base: 75000000000,      rate: 1600000 },
    { id: "estate",  ic: "🏙️", nm: "不動産開発",             base: 1100000000000,    rate: 10500000 },
    { id: "sat",     ic: "📡", nm: "通信衛星",               base: 16000000000000,   rate: 68000000 },
    { id: "media",   ic: "🎬", nm: "メディア帝国",           base: 240000000000000,  rate: 440000000 },
    { id: "air",     ic: "✈️", nm: "航空連合",               base: 3600000000000000, rate: 2900000000 },
    { id: "ship",    ic: "🚢", nm: "海運帝国",               base: 5.5e16,           rate: 1.9e10 },
    { id: "space",   ic: "🛰️", nm: "宇宙開発公社",           base: 8.5e17,           rate: 1.3e11 },
    { id: "cbank",   ic: "🏛️", nm: "中央銀行",               base: 1.3e19,           rate: 8.8e11 },
    { id: "world",   ic: "🌐", nm: "世界経済機構",           base: 2.0e20,           rate: 6.0e12 },
    { id: "colony",  ic: "🪐", nm: "惑星コロニー",           base: 3.1e21,           rate: 4.1e13 },
    { id: "galaxy",  ic: "🌌", nm: "銀河コングロマリット",   base: 4.8e22,           rate: 2.8e14 },
  ];

  // ===== クリック強化 =====
  const CLICKS = [
    { id: "gloves", ic: "🧤",  nm: "軍手",           base: 100,        add: 1 },
    { id: "cursor", ic: "🖱️",  nm: "高級マウス",     base: 1200,       add: 5 },
    { id: "coffee", ic: "☕",  nm: "エナジードリンク", base: 15000,      add: 30 },
    { id: "assist", ic: "🧑‍💼", nm: "アシスタント",   base: 220000,     add: 180 },
    { id: "auto",   ic: "🤖",  nm: "自動クリッカー",  base: 4000000,    add: 1200 },
    { id: "ai",     ic: "🧠",  nm: "AIトレーダー",    base: 90000000,   add: 12000 },
    { id: "ring",   ic: "💎",  nm: "ダイヤの指輪",    base: 2000000000, add: 160000 },
    { id: "arm",    ic: "🦾",  nm: "ロボアーム",      base: 45000000000, add: 2200000 },
  ];

  const COST_MULT = 1.15;

  // ===== 転生ツリー =====
  const TREE = [
    { id: "root", root: true, x: 320, y: 40, nm: "🌱" },
    { id: "A1", x: 110, y: 130, req: ["root"],  cost: 1,   nm: "クリック力 ×2",              eff: { clickMul: 2 } },
    { id: "A2", x: 110, y: 235, req: ["A1"],     cost: 3,   nm: "クリック力 ×3",              eff: { clickMul: 3 } },
    { id: "A3", x: 110, y: 340, req: ["A2"],     cost: 8,   nm: "クリック力 ×5",              eff: { clickMul: 5 } },
    { id: "A4", x: 110, y: 445, req: ["A3"],     cost: 20,  nm: "自動収入の5%をクリックに加算", eff: { clickFromPs: 0.05 } },
    { id: "B1", x: 300, y: 135, req: ["root"],   cost: 1,   nm: "自動収入 ×2",                eff: { psMul: 2 } },
    { id: "B2", x: 235, y: 240, req: ["B1"],     cost: 4,   nm: "自動収入 ×3",                eff: { psMul: 3 } },
    { id: "B3", x: 235, y: 345, req: ["B2"],     cost: 12,  nm: "自動収入 ×5",                eff: { psMul: 5 } },
    { id: "B4", x: 375, y: 240, req: ["B1"],     cost: 6,   nm: "購入価格 -10%",              eff: { costMul: 0.9 } },
    { id: "B5", x: 375, y: 345, req: ["B4"],     cost: 25,  nm: "購入価格 さらに -25%",        eff: { costMul: 0.75 } },
    { id: "B6", x: 305, y: 460, req: ["B3", "B5"], cost: 70, nm: "自動収入 ×10",              eff: { psMul: 10 } },
    { id: "C1", x: 500, y: 135, req: ["root"],   cost: 1,   nm: "転生後 $1,000 スタート",      eff: { start: 1000 } },
    { id: "C2", x: 500, y: 240, req: ["C1"],     cost: 6,   nm: "転生後 $250,000 スタート",    eff: { start: 250000 } },
    { id: "C3", x: 555, y: 345, req: ["C1"],     cost: 3,   nm: "オフライン上限24h・全効率",    eff: { offline: true } },
    { id: "C4", x: 500, y: 445, req: ["root"],   cost: 10,  nm: "🥇獲得量 +30%",              eff: { barBonus: 0.3 } },
    { id: "C5", x: 445, y: 540, req: ["C4", "C3"], cost: 45, nm: "🥇獲得量 さらに +60%",      eff: { barBonus: 0.6 } },
    { id: "C6", x: 300, y: 560, req: ["B6", "C2"], cost: 130, nm: "全収入 ×(1 + 転生回数×0.15)", eff: { rebirthScale: 0.15 } },
    { id: "D1", x: 620, y: 240, req: ["root"],   cost: 4,   nm: "金貨の出現が早くなる",         eff: { goldFast: 0.7 } },
    { id: "D2", x: 620, y: 345, req: ["D1"],     cost: 15,  nm: "金貨の効果 ×2",              eff: { goldPower: 2 } },
    { id: "D3", x: 620, y: 450, req: ["D2"],     cost: 55,  nm: "実績ボーナス 2倍",           eff: { achPower: 2 } },
  ];
  const NODE = Object.fromEntries(TREE.map((n) => [n.id, n]));

  // ===== 数字表示 =====
  const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
    "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc", "Vg"];
  function fmt(n) {
    if (!isFinite(n)) return "$∞";
    if (n < 0) return "-" + fmt(-n);
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

  // ===== 実績 =====
  function buildAch() {
    const A = [];
    const push = (o) => A.push(o);
    const tiers = [1, 10, 25, 50, 100, 150];
    BIZ.forEach((b) => tiers.forEach((t) => push({
      id: `b_${b.id}_${t}`, ic: b.ic, nm: `${b.nm} ×${t}`,
      desc: `「${b.nm}」を ${t}${t === 1 ? "軒" : "軒"} 所有`,
      check: (s) => (s.biz[b.id] || 0) >= t,
    })));
    CLICKS.forEach((c) => [1, 10, 25, 50, 100].forEach((t) => push({
      id: `c_${c.id}_${t}`, ic: c.ic, nm: `${c.nm} ×${t}`,
      desc: `「${c.nm}」を ${t} 個`,
      check: (s) => (s.click[c.id] || 0) >= t,
    })));
    [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27].forEach((m) => push({
      id: `earn_${m}`, ic: "💵", nm: `総資産 ${fmt(m).replace("$", "$")}`,
      desc: `累計 ${fmt(m)} を稼ぐ`, check: (s) => s.lifetimeEarned >= m,
    }));
    [10, 100, 1000, 1e4, 1e5, 1e6, 5e6, 1e7].forEach((c) => push({
      id: `click_${c}`, ic: "👆", nm: `${fmtInt(c)} クリック`,
      desc: `累計 ${fmtInt(c)} 回クリック`, check: (s) => s.totalClicks >= c,
    }));
    [1, 2, 5, 10, 20, 50, 100, 200].forEach((r) => push({
      id: `reb_${r}`, ic: "🔁", nm: `転生 ${r} 回`,
      desc: `${r} 回 転生する`, check: (s) => s.rebirths >= r,
    }));
    [1, 10, 50, 100, 500, 1000, 5000].forEach((g) => push({
      id: `bar_${g}`, ic: "🥇", nm: `ゴールドバー ${g}`,
      desc: `🥇 を ${g} 本 所持`, check: (s) => s.bars >= g,
    }));
    [1, 4, 8, 12, 16, 21].forEach((n) => push({
      id: `tree_${n}`, ic: "🌳", nm: `ツリー ${n} ノード`,
      desc: `ツリーノードを ${n} 個 取得`, check: (s) => Object.keys(s.tree).length >= n,
    }));
    [10, 1e3, 1e5, 1e7, 1e9, 1e12, 1e15, 1e18].forEach((p) => push({
      id: `ps_${p}`, ic: "⚙️", nm: `自動 ${fmt(p)}/秒`,
      desc: `自動収入 ${fmt(p)}/秒 に到達`, check: () => perSecond() >= p,
    }));
    [100, 1e4, 1e6, 1e8, 1e10, 1e13].forEach((p) => push({
      id: `pc_${p}`, ic: "✊", nm: `1クリック ${fmt(p)}`,
      desc: `1クリック ${fmt(p)} に到達`, check: () => perClick() >= p,
    }));
    [1, 10, 50, 100, 500, 1000].forEach((g) => push({
      id: `gold_${g}`, ic: "🪙", nm: `金貨 ${g} 回`,
      desc: `金貨を ${g} 回 クリック`, check: (s) => (s.goldClicks || 0) >= g,
    }));
    push({ id: "allbiz1", ic: "🏢", nm: "総合商社", desc: "全建物を1軒以上所有", check: (s) => BIZ.every((b) => (s.biz[b.id] || 0) >= 1) });
    push({ id: "allbiz25", ic: "🏦", nm: "コングロマリット", desc: "全建物を25軒以上所有", check: (s) => BIZ.every((b) => (s.biz[b.id] || 0) >= 25) });
    push({ id: "allbiz100", ic: "👑", nm: "経済の支配者", desc: "全建物を100軒以上所有", check: (s) => BIZ.every((b) => (s.biz[b.id] || 0) >= 100) });
    push({ id: "noclick", ic: "😴", nm: "不労所得", desc: "1回もクリックせず $100,000 稼ぐ", check: (s) => s.lifetimeEarned >= 1e5 && s.totalClicks === 0 });
    push({ id: "clickonly", ic: "💪", nm: "自力本願", desc: "建物0軒で $10,000 稼ぐ", check: (s) => s.lifetimeEarned >= 1e4 && BIZ.every((b) => !(s.biz[b.id])) });
    push({ id: "pt1h", ic: "⏰", nm: "1時間プレイ", desc: "通算 1 時間 プレイ", check: (s) => Date.now() - s.start >= 3600e3 });
    push({ id: "pt6h", ic: "🕕", nm: "6時間プレイ", desc: "通算 6 時間 プレイ", check: (s) => Date.now() - s.start >= 6 * 3600e3 });
    push({ id: "pt1d", ic: "📅", nm: "1日プレイ", desc: "通算 24 時間 プレイ", check: (s) => Date.now() - s.start >= 86400e3 });
    push({ id: "pt7d", ic: "🗓️", nm: "廃人", desc: "通算 7 日 プレイ", check: (s) => Date.now() - s.start >= 7 * 86400e3 });
    push({ id: "rich50", ic: "🤑", nm: "現ナマ", desc: "所持金 $50M を同時に保有", check: (s) => s.money >= 5e7 });
    push({ id: "rich1t", ic: "💰", nm: "億万長者どころか", desc: "所持金 $1T を同時に保有", check: (s) => s.money >= 1e12 });
    push({ id: "feverride", ic: "🔥", nm: "祭り", desc: "フィーバー中に金貨をもう1枚とる", check: (s) => (s.feverGold || 0) >= 1 });
    push({ id: "half", ic: "🎯", nm: "コレクター", desc: "実績を半分 解除", check: (s) => Object.keys(s.ach).length >= Math.floor(A.length / 2) });
    push({ id: "allach", ic: "🌟", nm: "完全制覇", desc: "他の実績をすべて解除", check: (s) => Object.keys(s.ach).length >= A.length - 1 });
    return A;
  }
  let ACH = [];

  // ===== ニュース =====
  const NEWS = [
    "「不動産開発」の株価が急騰、投資家は歓喜。",
    "経済アナリスト「このペースなら世界を買えます」。",
    "あなたの資産が地域経済を押し上げていると話題に。",
    "新社屋の建設ラッシュ、クレーンが足りない。",
    "金貨をよく見かけるという通報が相次ぐ。",
    "銀行「これ以上の預金はお断りしたい」。",
    "レモネードスタンドの店主、いつのまにか役員に。",
    "自販機、街のあらゆる隙間に増殖中。",
    "「転生」は科学的にはよく分かっていないらしい。",
    "ゴールドバーの相場、あなたのせいで乱高下。",
    "宇宙開発公社、次の目的地は「もっと遠く」。",
    "AIトレーダーが休憩を要求(却下された)。",
    "洗車場のバブル、まだ弾けない。",
    "通貨単位が足りなくなり、学者が新しい名前を考案中。",
    "「フードトラックは動く不動産」学会で発表される。",
    "工場の煙突から出ているのは実はお金だという噂。",
    "実績コレクターの集会、会場は満員。",
    "あなたのクリック音でリズムゲームを作る人が現れる。",
    "中央銀行総裁があなたに面会を希望。",
    "惑星コロニー、家賃は前払い制。",
    "銀河コングロマリット、社名が長すぎて名刺に入らない。",
    "「金貨フィーバー」中の生産性は通常の7倍という研究結果。",
    "油田の下からさらに油田が見つかる。",
    "メディア帝国、あなたの成功をドラマ化。",
    "航空連合のマイル、宇宙まで飛べる量に。",
  ];

  // ===== 状態 =====
  const fresh = () => ({ money: 0, biz: {}, click: {}, runEarned: 0, runStart: Date.now() });
  let state = Object.assign(fresh(), {
    bars: 0, rebirths: 0, tree: {},
    ach: {}, goldClicks: 0, feverGold: 0,
    lifetimeEarned: 0, totalClicks: 0,
    start: Date.now(), last: Date.now(),
  });
  let buffs = []; // {kind:'prod'|'click', mult, until, label}

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === "object") state = Object.assign(state, s);
    } catch (e) {}
    state.biz = state.biz || {}; state.click = state.click || {};
    state.tree = state.tree || {}; state.ach = state.ach || {};
  }
  function save() {
    state.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ===== 効果集計 =====
  function eff() {
    const o = { clickMul: 1, psMul: 1, costMul: 1, clickFromPs: 0, start: 0, barBonus: 0,
      offline: false, global: 1, goldFast: 1, goldPower: 1, achPower: 1 };
    for (const id in state.tree) {
      const n = NODE[id]; if (!n || !n.eff) continue;
      const e = n.eff;
      if (e.clickMul) o.clickMul *= e.clickMul;
      if (e.psMul) o.psMul *= e.psMul;
      if (e.costMul) o.costMul *= e.costMul;
      if (e.clickFromPs) o.clickFromPs += e.clickFromPs;
      if (e.start) o.start = Math.max(o.start, e.start);
      if (e.barBonus) o.barBonus += e.barBonus;
      if (e.offline) o.offline = true;
      if (e.rebirthScale) o.global *= 1 + state.rebirths * e.rebirthScale;
      if (e.goldFast) o.goldFast *= e.goldFast;
      if (e.goldPower) o.goldPower *= e.goldPower;
      if (e.achPower) o.achPower *= e.achPower;
    }
    return o;
  }
  function achMul() {
    const per = 0.01 * eff().achPower;
    return 1 + Object.keys(state.ach).length * per;
  }
  function buffMul(kind) {
    const now = Date.now();
    return buffs.reduce((m, b) => (b.kind === kind && b.until > now ? m * b.mult : m), 1);
  }

  // ===== 計算 =====
  const owned = (map, id) => map[id] || 0;
  function costOf(base, count) { return Math.ceil(base * Math.pow(COST_MULT, count) * eff().costMul); }
  function bulkCost(base, count, n) {
    let c = 0;
    for (let i = 0; i < n; i++) c += costOf(base, count + i);
    return c;
  }
  function perSecond() {
    const E = eff();
    let raw = 0;
    for (const b of BIZ) raw += b.rate * owned(state.biz, b.id);
    return raw * E.psMul * E.global * achMul() * buffMul("prod");
  }
  function perClick() {
    const E = eff();
    let base = 1;
    for (const c of CLICKS) base += c.add * owned(state.click, c.id);
    let v = base * E.clickMul * E.global * achMul() * buffMul("prod");
    v += perSecond() * E.clickFromPs;
    return v * buffMul("click");
  }
  function barsFor(runEarned) {
    if (runEarned < REBIRTH_MIN) return 0;
    return Math.floor(Math.sqrt(runEarned / REBIRTH_MIN) * (1 + eff().barBonus));
  }

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const moneyEl = $("#money"), rateEl = $("#rate"), perClickEl = $("#perclick");
  const listEl = $("#list"), achGrid = $("#achGrid"), achHead = $("#achHead");
  const statsBox = $("#statsBox"), toastEl = $("#toast"), buffbar = $("#buffbar");
  const barLine = $("#barLine"), barsOwnedEl = $("#barsOwned");
  const rebirthOpen = $("#rebirthOpen"), rebirthHint = $("#rebirthHint");
  const view = $("#rebirthView"), treeEl = $("#tree"), treeLines = $("#treeLines");
  const tickerEl = $("#ticker"), achPopWrap = $("#achPopWrap");
  let tab = "biz", bulkN = 1;

  // ===== ショップ =====
  function buy(list, map, it) {
    if (bulkN === 1) {
      const c = costOf(it.base, owned(map, it.id));
      if (state.money < c) return;
      state.money -= c; map[it.id] = owned(map, it.id) + 1;
    } else {
      let bought = 0;
      for (let i = 0; i < bulkN; i++) {
        const c = costOf(it.base, owned(map, it.id));
        if (state.money < c) break;
        state.money -= c; map[it.id] = owned(map, it.id) + 1; bought++;
      }
      if (!bought) return;
    }
    renderShop(); checkAch(); save();
  }

  function renderShop() {
    const showAch = tab === "ach";
    listEl.hidden = showAch;
    achGrid.hidden = !showAch;
    achHead.hidden = !showAch;
    $("#bulk").hidden = showAch;
    if (showAch) return renderAch();

    const data = tab === "biz" ? BIZ : CLICKS;
    const map = tab === "biz" ? state.biz : state.click;
    listEl.innerHTML = "";
    let prevOwned = true;
    data.forEach((it, idx) => {
      const n = owned(map, it.id);
      const cost = bulkN === 1 ? costOf(it.base, n) : bulkCost(it.base, n, bulkN);
      const afford = state.money >= cost;
      const locked = !prevOwned && n === 0;
      prevOwned = n > 0 || idx === 0;
      const row = document.createElement("div");
      row.className = "item" + (afford && !locked ? " afford" : "") + (locked ? " locked" : "");
      const rt = tab === "biz" ? `+${fmt(it.rate)}/秒` : `+$${it.add.toLocaleString("en-US")}/クリック`;
      row.innerHTML = `
        <div class="ic">${it.ic}</div>
        <div><div class="nm">${it.nm}</div><div class="rt">${rt}</div></div>
        <div><div class="cost">${fmt(cost)}${bulkN > 1 ? ` <small>×${bulkN}</small>` : ""}</div><div class="own">${n}${tab === "biz" ? "軒" : "個"}</div></div>`;
      if (!locked) row.addEventListener("click", () => buy(data, map, it));
      listEl.appendChild(row);
    });
  }

  function renderAch() {
    const got = Object.keys(state.ach).length;
    $("#achCount").textContent = `${got} / ${ACH.length}`;
    $("#achBonus").textContent = "×" + achMul().toFixed(2);
    achGrid.innerHTML = "";
    for (const a of ACH) {
      const has = !!state.ach[a.id];
      const el = document.createElement("div");
      el.className = "ach " + (has ? "got" : "locked");
      el.innerHTML = `${a.ic || "🏅"}<div class="tip"><b>${has ? a.nm : "？？？"}</b>${a.desc}</div>`;
      achGrid.appendChild(el);
    }
  }

  function renderStats() {
    const sec = Math.floor((Date.now() - state.start) / 1000);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    statsBox.innerHTML = `
      <div><span>今回の獲得額</span><b>${fmt(state.runEarned)}</b></div>
      <div><span>累計獲得額</span><b>${fmt(state.lifetimeEarned)}</b></div>
      <div><span>自動収入</span><b>${fmt(perSecond())}/秒</b></div>
      <div><span>1クリック</span><b>${fmt(perClick())}</b></div>
      <div><span>実績</span><b>${Object.keys(state.ach).length}/${ACH.length} (×${achMul().toFixed(2)})</b></div>
      <div><span>転生回数</span><b>${state.rebirths}</b></div>
      <div><span>ゴールドバー</span><b>${bar(state.bars)}</b></div>
      <div><span>金貨クリック</span><b>${fmtInt(state.goldClicks || 0)}</b></div>
      <div><span>クリック回数</span><b>${fmtInt(state.totalClicks)}</b></div>
      <div><span>プレイ時間</span><b>${h}時間${m}分</b></div>`;
  }

  function renderBuffs() {
    const now = Date.now();
    buffs = buffs.filter((b) => b.until > now);
    const uniq = [];
    for (const b of buffs) if (b.label && !uniq.some((u) => u.label === b.label)) uniq.push(b);
    buffbar.innerHTML = uniq.map((b) => {
      const s = Math.ceil((b.until - now) / 1000);
      return `<span class="buff">${b.label} ${s}s</span>`;
    }).join("");
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
    $("#achTab").textContent = "実績 " + Object.keys(state.ach).length;
  }

  // ===== 転生ツリー描画 =====
  function nodeState(n) {
    if (n.root || state.tree[n.id]) return "owned";
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
      ? "転生すると所持金・建物・クリック強化がリセットされ、ゴールドバーを獲得します。"
      : `転生には今回 ${fmt(REBIRTH_MIN)} の獲得が必要（現在 ${fmt(state.runEarned)}）。`;
    const spent = TREE.reduce((s, n) => s + (state.tree[n.id] ? (n.cost || 0) : 0), 0);
    $("#respec").disabled = spent === 0;
    $("#respec").textContent = spent === 0 ? "振り直し" : `振り直し（🥇${spent} 返却）`;

    [...treeEl.querySelectorAll(".tnode")].forEach((e) => e.remove());
    for (const n of TREE) {
      const st = nodeState(n);
      const el = document.createElement("div");
      el.className = "tnode " + (n.root ? "rootnode " : "") +
        (st === "owned" ? "owned" : st === "can" ? "can" : st === "locked" ? "locked" : "");
      el.style.left = n.x + "px";
      el.style.top = n.y + "px";
      el.innerHTML = n.root ? n.nm
        : `<div class="tn">${n.nm}</div><div class="tc">${state.tree[n.id] ? "取得済" : "🥇" + n.cost}</div>`;
      if (!n.root) el.addEventListener("click", () => buyNode(n));
      treeEl.appendChild(el);
    }
    const seg = [];
    for (const n of TREE) for (const r of n.req || []) {
      const p = NODE[r]; if (!p) continue;
      const on = nodeState(n) !== "locked" && (r === "root" || state.tree[r]);
      seg.push(`<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}"
        stroke="${state.tree[n.id] ? "#3ddc84" : on ? "#7ad0ff" : "#1f4530"}"
        stroke-width="${state.tree[n.id] ? 3 : 2}" />`);
    }
    treeLines.setAttribute("viewBox", "0 0 700 640");
    treeLines.innerHTML = seg.join("");
  }
  function buyNode(n) {
    if (state.tree[n.id]) return;
    if (nodeState(n) === "locked") { toast("前提のアップグレードが必要です"); return; }
    if (state.bars < n.cost) { toast("ゴールドバーが足りません"); return; }
    state.bars -= n.cost; state.tree[n.id] = true;
    renderTree(); renderTop(); renderShop(); checkAch(); save();
  }
  function respec() {
    const spent = TREE.reduce((s, n) => s + (state.tree[n.id] ? (n.cost || 0) : 0), 0);
    if (spent === 0) return;
    if (!confirm(`ツリーを全て振り直します。🥇${spent} が戻ります。よろしいですか？`)) return;
    state.bars += spent; state.tree = {};
    renderTree(); renderTop(); renderShop(); save();
  }
  function doRebirth() {
    const g = barsFor(state.runEarned);
    if (state.runEarned < REBIRTH_MIN) return;
    if (!confirm(`転生して ${bar(g)} を獲得します。\n所持金・建物・クリック強化はリセットされます。（ツリー・🥇・実績は維持）`)) return;
    state.bars += g; state.rebirths += 1;
    const startMoney = eff().start;
    Object.assign(state, fresh());
    state.money = startMoney;
    tab = "biz"; bulkN = 1;
    document.querySelectorAll(".tab").forEach((x, i) => x.classList.toggle("active", i === 0));
    document.querySelectorAll("#bulk button").forEach((b, i) => b.classList.toggle("active", i === 0));
    renderTree(); renderShop(); renderStats(); renderTop();
    checkAch(); save();
    toast(`転生しました！ ${bar(g)} 獲得（通算 ${state.rebirths} 回）`);
  }

  // ===== 実績チェック =====
  const achQueue = [];
  function checkAch() {
    let n = 0;
    for (const a of ACH) {
      if (state.ach[a.id]) continue;
      let ok = false;
      try { ok = a.check(state); } catch (e) {}
      if (ok) { state.ach[a.id] = Date.now(); achQueue.push(a); n++; }
    }
    if (n) { pumpAch(); renderTop(); if (tab === "ach") renderAch(); save(); }
  }
  let popping = false;
  function pumpAch() {
    if (popping || !achQueue.length) return;
    popping = true;
    const a = achQueue.shift();
    const el = document.createElement("div");
    el.className = "achpop";
    el.innerHTML = `<div class="pi">${a.ic || "🏅"}</div><div><div class="pt">実績 解除！ ＋1% 全生産</div><div class="pn">${a.nm}</div></div>`;
    achPopWrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .4s, transform .4s";
      el.style.opacity = "0"; el.style.transform = "translateX(-120%)";
      setTimeout(() => { el.remove(); popping = false; pumpAch(); }, 400);
    }, 3200);
  }

  // ===== 金貨 =====
  let goldEl = null, goldTimeout = null, nextGold = Date.now() + 55000;
  function scheduleGold() {
    nextGold = Date.now() + (75 + Math.random() * 150) * 1000 * eff().goldFast;
  }
  function spawnGold() {
    if (goldEl) return;
    const el = document.createElement("button");
    el.className = "goldcoin";
    el.textContent = "🪙";
    el.style.left = (8 + Math.random() * 72) + "vw";
    el.style.top = (16 + Math.random() * 64) + "vh";
    el.addEventListener("click", () => collectGold(el));
    document.body.appendChild(el);
    goldEl = el;
    goldTimeout = setTimeout(() => { el.remove(); goldEl = null; scheduleGold(); }, 13000);
  }
  function collectGold(el) {
    clearTimeout(goldTimeout);
    el.remove(); goldEl = null;
    state.goldClicks = (state.goldClicks || 0) + 1;
    if (buffMul("prod") > 1) state.feverGold = (state.feverGold || 0) + 1;
    const P = eff().goldPower;
    const roll = Math.random();
    let msg;
    if (roll < 0.45) {
      const gain = (Math.max(perClick() * 20, Math.min(state.money * 0.13, perSecond() * 900)) + 25) * P;
      state.money += gain; state.runEarned += gain; state.lifetimeEarned += gain;
      msg = `ラッキー！ +${fmt(gain)}`;
    } else if (roll < 0.78) {
      buffs.push({ kind: "prod", mult: 7, until: Date.now() + 30000 * P, label: "🔥 生産 ×7" });
      msg = "フィーバー！ 生産 ×7";
    } else if (roll < 0.94) {
      buffs.push({ kind: "click", mult: 777, until: Date.now() + 13000 * P, label: "✊ クリック ×777" });
      msg = "連打フィーバー！ クリック ×777";
    } else {
      buffs.push({ kind: "prod", mult: 2, until: Date.now() + 60000 * P, label: "✨ すべて ×2" });
      buffs.push({ kind: "click", mult: 2, until: Date.now() + 60000 * P, label: "✨ すべて ×2" });
      msg = "大当たり！ すべて ×2";
    }
    toast("🪙 " + msg);
    renderBuffs(); renderTop(); renderStats(); checkAch(); scheduleGold(); save();
  }

  // ===== ニュース =====
  let newsI = -1;
  function rollNews() {
    const dyn = [];
    const top = BIZ.filter((b) => state.biz[b.id]).slice(-1)[0];
    if (top) dyn.push(`あなたは「${top.nm}」を ${state.biz[top.id]} ${top.id ? "軒" : ""} 所有している。`);
    if (state.rebirths > 0) dyn.push(`これまでに ${state.rebirths} 回 転生した。誰も気づいていない。`);
    if (state.bars > 0) dyn.push(`金庫にはゴールドバーが ${state.bars} 本 眠っている。`);
    const pool = NEWS.concat(dyn);
    newsI = Math.floor(Math.random() * pool.length);
    tickerEl.innerHTML = "📰 " + pool[newsI];
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
    el.className = "float"; el.textContent = txt;
    el.style.left = x + "px"; el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ===== 入力 =====
  $("#coin").addEventListener("click", (e) => {
    const gain = perClick();
    state.money += gain; state.runEarned += gain; state.lifetimeEarned += gain;
    state.totalClicks++;
    const r = e.currentTarget.getBoundingClientRect();
    floatText(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, "+" + fmt(gain));
    renderTop();
    if (tab !== "ach") renderShop();
    checkAch();
  });
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      tab = t.dataset.tab;
      renderShop();
    });
  });
  document.querySelectorAll("#bulk button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#bulk button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      bulkN = +b.dataset.n;
      renderShop();
    });
  });
  rebirthOpen.addEventListener("click", () => { view.hidden = false; renderTree(); });
  $("#ovClose").addEventListener("click", () => { view.hidden = true; });
  view.addEventListener("click", (e) => { if (e.target === view) view.hidden = true; });
  $("#doRebirth").addEventListener("click", doRebirth);
  $("#respec").addEventListener("click", respec);
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("本当に最初からやり直しますか？（転生・ツリー・実績を含む全セーブが消えます）")) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });

  // ===== ループ =====
  // setInterval ベース（バックグラウンドでも動作し、離席分を実時間で追従）
  let acc = 0, newsAcc = 0, lastTick = Date.now();
  function loop() {
    const now = Date.now();
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!(dt > 0)) dt = 0;
    if (dt > 3600) dt = 3600; // 1時間以上の空白はオフライン収入(次回リロード)に任せる
    const ps = perSecond();
    if (ps > 0) {
      const g = ps * dt;
      state.money += g; state.runEarned += g; state.lifetimeEarned += g;
    }
    if (!document.hidden && Date.now() > nextGold) spawnGold();
    renderTop(); renderBuffs();
    acc += dt; newsAcc += dt;
    if (acc > 0.5) {
      acc = 0;
      if (tab !== "ach") renderShop();
      renderStats();
      checkAch();
      if (!view.hidden) renderTree();
    }
    if (newsAcc > 9) { newsAcc = 0; rollNews(); }
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
    state.money += g; state.runEarned += g; state.lifetimeEarned += g;
    toast(`おかえりなさい！ 不在中に ${fmt(g)} 稼ぎました（${Math.floor(elapsed / 60)}分・効率${Math.round(rate * 100)}%）`);
  }

  // ===== 起動 =====
  load();
  ACH = buildAch();
  offlineEarn();
  $("#ver").textContent = "v" + (window.APP_VERSION || "1.2.0");
  renderTop(); renderShop(); renderStats(); renderBuffs(); rollNews();
  checkAch();
  setInterval(loop, 200);
  setInterval(save, 10000);
  window.addEventListener("beforeunload", save);
})();
