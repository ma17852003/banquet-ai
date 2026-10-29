// 《迎賓台》核心：解析名單、事件紀錄 → 目前狀態、主持人佇列、搜尋、唸稿、後端 API
// 純函式都在 tests/greet.test.js 測；foldState 會被 create_greet_wf.py 原封不動嵌進 n8n（單一來源）
(function () {
  const API = "https://n8n.infernoedge247365.dpdns.org/webhook";

  // ── 名單：從 Excel／Google 試算表／ChatGPT 表格直接貼上（Tab、逗號、Markdown 表格都吃）──
  const FIELDS = {
    zh: ["中文名", "中文姓名", "姓名", "名字", "中文", "name"],
    en: ["英文名", "英文姓名", "英文", "english", "englishname"],
    say: ["唸法", "念法", "發音", "讀音", "pronunciation"],
    title: ["頭銜", "職稱", "title"],
    org: ["單位", "公司", "組織", "organization", "company", "org"],
    country: ["國家", "國籍", "country"],
    order: ["禮賓順序", "順序", "排序", "order", "priority"],
    vip: ["vip", "貴賓", "主賓"],
    ok: ["唸法已確認", "念法已確認", "已確認", "confirmed"],
    intro: ["介紹", "一句介紹", "介紹詞", "intro"]
  };
  const YES = ["是", "y", "yes", "true", "1", "v", "✓", "✔", "o", "○"];
  const norm = s => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, "");
  function splitRow(line, sep) {
    if (sep === "|") return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(c => c.trim());
    return line.split(sep).map(c => c.trim());
  }
  // 名字當鑰匙算短代號：同一個人重貼名單，代號不變，到場紀錄還對得上
  function gidOf(zh, en) {
    let h = 5381; const k = norm(zh) + "|" + norm(en);
    for (let i = 0; i < k.length; i++) h = ((h * 33) ^ k.charCodeAt(i)) >>> 0;
    return "g" + h.toString(36);
  }
  function parseList(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const errors = [], warnings = [], guests = [];
    const first = lines.findIndex(l => l.trim());
    if (first < 0) return { guests, errors: [{ row: 1, msg: "沒有貼上任何內容" }], warnings };
    const head = lines[first], sep = head.includes("\t") ? "\t" : head.trim().startsWith("|") ? "|" : ",";
    const col = {};
    splitRow(head, sep).forEach((h, i) => { for (const f in FIELDS) if (col[f] == null && FIELDS[f].includes(norm(h))) col[f] = i; });
    if (col.zh == null && col.en == null) return { guests, errors: [{ row: first + 1, msg: "找不到名字欄：表頭要有「中文名」或「英文名」" }], warnings };
    const seen = {};
    for (let i = first + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || (sep === "|" && /^\s*\|?[\s:|-]+\|?\s*$/.test(line))) continue;   // 空行、Markdown 分隔線
      const c = splitRow(line, sep), v = f => (col[f] == null ? "" : c[col[f]] || "").trim(), row = i + 1;
      const g = { zh: v("zh"), en: v("en"), say: v("say"), title: v("title"), org: v("org"), country: v("country"),
                  vip: YES.includes(norm(v("vip"))), ok: YES.includes(norm(v("ok"))), intro: v("intro") };
      if (!g.zh && !g.en) { errors.push({ row, msg: "名字是空的（中文名、英文名至少填一個）" }); continue; }
      if (col.order == null) g.order = guests.length + 1;   // 沒有順序欄：照貼上的順序
      else if (!/^\d+$/.test(v("order"))) { errors.push({ row, msg: `禮賓順序要填數字（現在是「${v("order")}」）` }); continue; }
      else g.order = Number(v("order"));
      g.gid = gidOf(g.zh, g.en);
      if (seen[g.gid]) { errors.push({ row, msg: `名字跟第 ${seen[g.gid]} 列重複` }); continue; }
      seen[g.gid] = row;
      if (g.vip && !g.ok) warnings.push({ row, msg: `${g.zh || g.en} 是 VIP，唸法還沒確認` });
      guests.push(g);
    }
    if (!guests.length && !errors.length) errors.push({ row: first + 1, msg: "表頭下面沒有任何來賓" });
    if (guests.length > 1000) errors.push({ row: first + 1, msg: `最多 1000 位（後端上限），現在有 ${guests.length} 位` });
    return { guests, errors, warnings };
  }

  // ── 事件紀錄 → 目前狀態。後端只增不刪：list（整份名單）、arrive、unarrive、leave、read、unread、reset ──
  // 重複的「到了」不會重算（兩個櫃台同時按同一位只算一次）；reset＝新的一場，只清到場紀錄、名單留著
  // 唸過的人離開又回來，還是算唸過（不會被主持人再唸一次）
  function foldState(rows) {
    let guests = [], st = {}, version = 0;
    rows.slice().sort((a, b) => Number(a.Id) - Number(b.Id)).forEach(r => {
      const id = Number(r.Id), k = r.Kind, s = st[r.Gid] || { state: "waiting" };
      version = Math.max(version, id);
      if (k === "list") { try { const l = JSON.parse(r.Data); if (Array.isArray(l)) guests = l; } catch (e) { /* 壞掉的名單略過 */ } return; }
      if (k === "reset") { st = {}; return; }
      if (k === "arrive" && s.state === "left" && s.readSeq) st[r.Gid] = Object.assign({}, s, { state: "read" });
      else if (k === "arrive" && (s.state === "waiting" || s.state === "left")) st[r.Gid] = { state: "arrived", seq: id, at: r.CreatedAt };
      else if (k === "unarrive" && s.state !== "waiting") st[r.Gid] = { state: "waiting" };
      else if (k === "leave" && s.state !== "waiting") st[r.Gid] = Object.assign({}, s, { state: "left" });
      else if (k === "read" && s.state === "arrived") st[r.Gid] = Object.assign({}, s, { state: "read", readSeq: id, readAt: r.CreatedAt });
      else if (k === "unread" && s.state === "read") st[r.Gid] = Object.assign({}, s, { state: "arrived" });
    });
    const out = {};
    guests.forEach(g => { out[g.gid] = st[g.gid] || { state: "waiting" }; });
    return { guests, st: out, version };
  }

  // ── 主持人畫面：已到、還沒唸的照禮賓順序排（同順序照到場先後）。「下一位」釘住，晚到的高順位只提示不頂掉 ──
  function hostView(state, pinned) {
    const all = state.guests.map(g => Object.assign({}, g, state.st[g.gid] || { state: "waiting" }));
    const line = all.filter(g => g.state === "arrived").sort((a, b) => a.order - b.order || a.seq - b.seq);
    const next = line.find(g => g.gid === pinned) || line[0] || null;
    const rs = g => g.readSeq == null ? Infinity : g.readSeq;
    const preempt = next && line[0] && line[0].gid !== next.gid && line[0].order < next.order ? line[0] : null;
    return {
      next, preempt,
      queue: line.filter(g => g !== next),
      pendingVip: all.filter(g => g.vip && g.state === "waiting").sort((a, b) => a.order - b.order),
      done: all.filter(g => g.state === "read").sort((a, b) => rs(b) - rs(a) || 0),   // 沒有 readSeq＝剛按、還沒確認，排最前
      counts: { arrived: all.filter(g => g.state === "arrived" || g.state === "read").length,
                read: all.filter(g => g.state === "read").length, waiting: line.length }
    };
  }

  // 主持人頁先收起來的「已唸」（gid → 送到伺服器的時間，0＝還沒送到）什麼時候放掉：
  // 伺服器已唸、名單沒這個人、或送到之後才讀的狀態卻是已到（別人按了放回去）
  function pruneHidden(hidden, st, fetchedAt) {
    hidden.forEach((sentAt, gid) => {
      const s = st[gid];
      if (!s || s.state !== "arrived" || (sentAt && sentAt <= fetchedAt)) hidden.delete(gid);
    });
  }

  // 下一次輪詢等多久：30 支手機同時開，每支隨機錯開 ±15% 免得一起撞進來；連續失敗就退開（2 倍、最多 4 倍）讓伺服器喘口氣
  const pollDelay = (base, fails, rnd) => Math.round(base * Math.pow(2, Math.min(fails, 2)) * (0.85 + 0.3 * rnd));

  // 主持人照念的一句：「讓我們歡迎 {頭銜・單位} {名字}」，畫面把名字放最大
  function hostScript(g) {
    return { who: [g.title, g.org].filter(Boolean).join("・"), name: g.zh || g.en || "" };
  }

  function search(guests, q) {
    const k = norm(q);
    if (!k) return guests;
    return guests.filter(g => [g.zh, g.en, g.org, g.title, g.say].some(x => norm(x).includes(k)));
  }
  // NocoDB 回「2026-10-27 21:53:00+00:00」（空格、Safari 不認）→ 先換成 T 再轉當地時:分
  function hhmm(at) {
    const d = new Date(String(at || "").replace(" ", "T"));
    return isNaN(d) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const normEvent = raw =>String(raw == null ? "" : raw).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);

  // 示範名單：沿用第 5 道排座那 10 位（虛構人物），補上英文名、唸法、頭銜、介紹
  const DEMO = [
    "中文名\t英文名\t唸法\t頭銜\t單位\t國家\t禮賓順序\tVIP\t唸法已確認\t介紹",
    "林志遠\tLin Chih-yuan\tlin jr-YUAN\t品牌總經理\t主辦品牌\t台灣\t1\t是\t是\t今晚新品發表的主講人",
    "佐藤健二\tSato Kenji\tSA-toh KEN-jee\t日本通路代表\t佐藤商事\t日本\t2\t是\t否\t合作十年的日本通路夥伴",
    "\tOmar Al-Farsi\tOH-mar al-FAR-see\t杜拜代表\tGulf Fresh Foods\t阿聯\t3\t是\t是\t遠從杜拜來的經銷夥伴",
    "\tAhmed Hassan\tAH-med ha-SAN\t中東經銷商\tHassan Trading\t約旦\t4\t否\t是\t負責中東六國的經銷",
    "\tSiti Aminah\tSEE-tee a-MEE-nah\t馬來西亞採購\tKL Fresh Mart\t馬來西亞\t5\t否\t否\t馬來西亞連鎖超市採購",
    "王大同\tWang Ta-tung\t\t董事長\t大同通路\t台灣\t6\t否\t是\t北部最大的通路商",
    "陳怡君\tChen Yi-chun\t\t營養師\t\t台灣\t7\t否\t是\t今晚蔬食菜單的顧問",
    "張文華\tChang Wen-hua\t\t採購經理\t好市超市\t台灣\t8\t否\t是\t超市生鮮採購",
    "林小芸\tLin Hsiao-yun\t\t美食部落客\t\t台灣\t9\t否\t是\t專寫蔬食的美食部落客",
    "林佳慧\tLin Chia-hui\t\t記者\t美食週刊\t台灣\t10\t否\t是\t美食週刊記者",
    // 11～30：全班一起當櫃台時才按不完；前 10 位是示範腳本，不要動
    "黃志明\tHuang Chih-ming\t\t總經理\t日日鮮蔬果\t台灣\t11\t否\t是\t供應今晚全部的有機蔬菜",
    "吳淑芬\tWu Shu-fen\t\t主廚\t綠灶蔬食餐廳\t台灣\t12\t否\t是\t今晚甜點的客座主廚",
    "鈴木美咲\tSuzuki Misaki\tsu-ZU-ki mi-SA-ki\t採購主任\t鈴木食品\t日本\t13\t否\t是\t日本超市的進口採購",
    "\tDaniel Tan\tDAN-yel TAHN\t區域經理\tLion City Grocers\t新加坡\t14\t否\t是\t新加坡連鎖超市",
    "李建宏\tLee Chien-hung\t\t理事長\t中區餐飲公會\t台灣\t15\t否\t是\t中部餐飲業的老前輩",
    "周雅婷\tChou Ya-ting\t\t行銷經理\t好饗冷凍食品\t台灣\t16\t否\t是\t冷凍調理包的合作夥伴",
    "\tNguyen Van An\tNWEN van AHN\t進口商\tSaigon Fresh\t越南\t17\t否\t是\t越南的經銷夥伴",
    "許文彬\tHsu Wen-pin\t\t廠長\t山海醬油\t台灣\t18\t否\t是\t百年醬油老店第四代",
    "郭怡安\tKuo Yi-an\t\t營運長\t早安連鎖早餐\t台灣\t19\t否\t是\t全台三百家早餐店",
    "朴志恩\tPark Ji-eun\tPAHK jee-UN\t商品開發\t韓味食品\t韓國\t20\t否\t是\t韓國泡菜工廠",
    "曾國峰\tTseng Kuo-feng\t\t董事長\t曾記烘焙\t台灣\t21\t否\t是\t新品麵包的代工廠",
    "\tMaria Santos\tma-REE-ah SAHN-tos\t採購經理\tManila Food Hub\t菲律賓\t22\t否\t是\t菲律賓的食品通路",
    "賴佩君\tLai Pei-chun\t\t店長\t好市超市\t台灣\t23\t否\t是\t旗艦店店長",
    "蔡明哲\tTsai Ming-che\t\t物流經理\t冷鏈快遞\t台灣\t24\t否\t是\t負責今晚食材的冷鏈配送",
    "\tSomchai Prasert\tSOM-chai pra-SERT\t代表\tBangkok Spice Co.\t泰國\t25\t否\t是\t泰國香料供應商",
    "劉家豪\tLiu Chia-hao\t\t主編\t餐飲新聞網\t台灣\t26\t否\t是\t餐飲新聞網主編",
    "江美玲\tChiang Mei-ling\t\t教授\t餐旅學院\t台灣\t27\t否\t是\t研究蔬食營養的老師",
    "高振宇\tKao Chen-yu\t\t創辦人\t小農直送\t台灣\t28\t否\t是\t串起兩百位小農",
    "邱詩涵\tChiu Shih-han\t\t網紅\t\t台灣\t29\t否\t是\t十萬追蹤的料理網紅",
    "范書豪\tFan Shu-hao\t\t攝影師\t\t台灣\t30\t否\t是\t今晚的活動攝影"
  ].join("\n");

  // ── 後端：失敗一律回 null（呼叫端顯示連線狀態），表單格式＝瀏覽器不先送預檢請求 ──
  async function post(path, fields, ms) {
    try {
      const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), ms || 10000);
      const r = await fetch(API + path, { method: "POST", body: new URLSearchParams(fields), signal: ctrl.signal });
      const j = await r.json().catch(() => null);
      clearTimeout(tid);   // 內容讀完才停計時：標頭到了、內容卡住也會逾時，不然排在後面的動作全部跟著卡死
      return j && j.ok === true ? j : null;
    } catch (e) { return null; }
  }
  // 帶上手上的版本號：後端版本沒變只回 { same: true }，不重傳整份名單
  async function fetchState(event, version) {
    try {
      const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(API + "/greet-state?event=" + encodeURIComponent(event) + "&v=" + (version || 0), { signal: ctrl.signal, cache: "no-store" });
      const j = await r.json();
      clearTimeout(tid);   // 同上：內容卡住也要逾時，不然輪詢永遠停在半路
      return j && j.ok && (j.same || Array.isArray(j.guests)) ? j : null;
    } catch (e) { return null; }
  }
  const act = (event, kind, gid) => post("/greet-act", { event, kind, gid });
  // 送不出去的動作先排隊，讀得到伺服器時照原順序補送（同一個動作送兩次沒關係：重複的「到了」「已唸」只算一次）
  const outbox = [];
  let tail = Promise.resolve();   // 上一個動作還在路上，下一個就等它：不然「放回去」可能比「已唸」先到，被伺服器當成沒事
  function actOrQueue(event, kind, gid) {
    const run = tail.then(async () => {
      if (!outbox.length && await act(event, kind, gid)) return true;
      outbox.push({ event, kind, gid });   // 前面還有沒送出的就排在後面，維持順序
      return false;
    });
    tail = run;
    return run;
  }
  let flushing = null;   // 同時只跑一個補送，免得兩個輪詢一起 shift 掉還沒送出的動作
  function flush() {
    return flushing || (flushing = (async () => {
      while (outbox.length) { const a = outbox[0]; if (!(await act(a.event, a.kind, a.gid))) return false; outbox.shift(); }
      return true;
    })().finally(() => { flushing = null; }));
  }
  const queued = () => outbox.length;
  const saveList = (event, guests) => post("/greet-list", { event, list: JSON.stringify(guests) }, 15000);
  const resetEvent = event => post("/greet-reset", { event, confirm: "yes" });

  // 名單是人貼進來的：畫面上一律跳脫，免得名字裡的 < > 把頁面弄壞
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  window.GR = { parseList, foldState, hostView, hostScript, pruneHidden, pollDelay, search, hhmm, normEvent, esc, DEMO, fetchState, act, actOrQueue, flush, queued, saveList, resetEvent };
})();
