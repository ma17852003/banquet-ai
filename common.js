// 學生端與投影幕共用：組別形狀、後端 API、本機存檔
(function () {
  const SHAPES = {
    circle:   '<circle cx="12" cy="12" r="9"/>',
    square:   '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/>',
    triangle: '<path d="M12 2.5 22 20.5H2z"/>',
    diamond:  '<path d="M12 1.5 22.5 12 12 22.5 1.5 12z"/>',
    hexagon:  '<path d="M7 2.5h10l5.5 9.5-5.5 9.5H7L1.5 12z"/>',
    star:     '<path d="m12 1.8 3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.4L5.7 21l1.3-7L1.9 9.1l7-.9z"/>',
    cross:    '<path d="M8.5 2.5h7v6h6v7h-6v6h-7v-6h-6v-7h6z"/>',
    ring:     '<circle cx="12" cy="12" r="8.5" fill="none" stroke-width="3.5"/><circle cx="12" cy="12" r="3.5"/>'
  };

  // 深藍描邊：深色底上看不出來，燈亮模式下補足對比
  function shapeSVG(team, size) {
    const s = size || 18;
    return `<svg class="shape" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${team.color}" stroke="${team.color}" aria-hidden="true">` +
      `<g stroke="#0E1B33" stroke-width="1.2" paint-order="stroke">${SHAPES[team.shape]}</g></svg>`;
  }
  function team(no) { return GAME.teams.find(t => t.no === Number(no)); }
  function teamLabel(no) { const t = team(no); return t ? `第 ${t.no} 桌 · ${t.name}` : `第 ${no} 桌`; }

  // 交分數：表單格式＝瀏覽器不會先送預檢請求；回應必須是 {ok:true} 才算成功
  //（後端擋下不合法資料時會回 200 但內容是空的，所以不能只看 HTTP 200）
  async function post(path, fields, ms) {
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), ms || 8000);
      const r = await fetch(GAME.api + path, { method: "POST", body: new URLSearchParams(fields), signal: ctrl.signal });
      clearTimeout(tid);
      const j = await r.json().catch(() => null);
      return j && j.ok === true ? j : null;
    } catch (e) { return null; }
  }
  // 分數要帶個人編號和這一輪的 resetId；後端只算這一輪的分數
  async function submitScore(p) {
    return !!(await post("/banquet-score", { session: p.session, team: String(p.team), level: String(p.course), score: String(p.score), tf: String(p.tf || 0),
                                             player: String(p.player), resetId: String(p.resetId), detail: JSON.stringify(p.detail || {}) }));
  }
  // 這支手機的固定識別碼：取號回應掉了重送，或換桌重新入座，都拿回同一個號碼
  let cid = "";   // 瀏覽器擋住 localStorage 時，至少這次開著的期間識別碼不變
  function deviceId() {
    if (!cid) cid = store.get("bq-cid", "");
    if (!cid) { cid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("bq-cid", cid); }
    return cid;
  }
  // 入座取號：回 { player, resetId }，失敗回 null
  async function joinPlayer(session, team) {
    const j = await post("/banquet-join", { session, team: String(team), cid: deviceId() }, 20000);   // 全班同時掃碼時 NocoDB 偶爾卡十幾秒，多等一下少跳「網路不太穩」
    return j && j.player >= 1 ? { player: j.player, resetId: j.resetId } : null;
  }
  // 新的一堂課：清掉這個場次的成績、編號。回 { resetId }，失敗回 null
  async function resetSession(session) {
    return post("/banquet-reset", { session, confirm: "yes" }, 15000);
  }
  // 排行榜：回 { board:[{player,team,total,levels,tfs,cleared,rank}], players, resetId }，失敗回 null（tfs＝每道作答速度）
  async function fetchBoard(session) {
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(GAME.api + "/banquet-board?session=" + encodeURIComponent(session), { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(tid);
      const j = await r.json();
      return Array.isArray(j.board) ? j : null;
    } catch (e) { return null; }
  }

  // localStorage 可能被擋（無痕模式），讀寫一律包起來，失敗就當沒存
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ── 計分（純函式，tests/game.test.js 會測）──
  // 全對＝100，分數只看答對率（James 2026-10-27）；速度不算分，只在排行榜和頒獎同分時比。連擊加分最多到 99：只有全對拿得到 100
  function courseScore(acc, bonus) {
    return acc >= 1 ? 100 : Math.min(99, Math.round(acc * 100) + (bonus || 0));
  }
  // 第 3 道：踩一個陷阱的代價＝漏選兩張，全選不能拿分
  function costAcc(selected, cards) {
    const hidden = cards.filter(c => c.hidden).length;
    const hits = selected.filter(i => cards[i].hidden).length;
    const traps = selected.length - hits;
    return Math.max(0, hits - 2 * traps) / hidden;
  }
  // 第 5 道：第 3 次連續答對起每題 +2，最多 +10；答錯連擊歸零，已得加分保留
  function comboStep(s, correct) {
    if (!correct) return { streak: 0, bonus: s.bonus };
    const streak = s.streak + 1;
    return { streak, bonus: streak >= 3 ? Math.min(10, s.bonus + 2) : s.bonus };
  }

  // ── 場次碼：1、2、3…（最多 4 位數，"0002" 當成 "2"，0 不算）──
  function normSession(raw) {
    const s = String(raw == null ? "" : raw).trim();
    if (!/^\d{1,4}$/.test(s)) return "";
    return Number(s) > 0 ? String(Number(s)) : "";
  }
  // 題目檔是快取的舊版時 GAME.site 會是 undefined，QR 就壞了；所以這裡留一份保險
  // openExternalBrowser=1：用 LINE 掃碼時改用手機預設瀏覽器開，學生不會中途換瀏覽器又拿到第二個號碼
  const studentURL = session => (GAME.site || "https://ma17852003.github.io/banquet-ai/") + "index.html?s=" + session + "&openExternalBrowser=1";

  // ── 個人編號（純函式，有測試；n8n 計分流程嵌入同一份）──
  // Players 表每次入座寫一列 join、每次「新的一堂課」寫一列 reset（reset 列永遠不刪，所以 resetId 只增不減）。
  // 編號＝自己這列在「最後一次 reset 之後的 join」裡排第幾；同時入座各拿到不同的 Id，編號不會重複（實測 30 人同時入座＝1～30）
  function lastReset(rows) {
    return rows.filter(r => r.Kind === "reset").reduce((m, r) => Math.max(m, Number(r.Id)), 0);
  }
  // 這一輪的「人」：同一支手機（Cid）重送入座只算一個人、用第一次的順序排號；換桌時桌號用最新那列
  function joinsSince(rows) {
    const from = lastReset(rows), people = [], byCid = {};
    rows.filter(r => r.Kind === "join" && Number(r.Id) > from).sort((a, b) => a.Id - b.Id).forEach(r => {
      const p = r.Cid ? byCid[r.Cid] : null;
      if (p) { p.Team = r.Team; p.ids.push(Number(r.Id)); return; }
      const np = { Team: r.Team, ids: [Number(r.Id)] };
      if (r.Cid) byCid[r.Cid] = np;
      people.push(np);
    });
    return people;
  }
  function playerNo(rows, id) {
    return joinsSince(rows).findIndex(p => p.ids.includes(Number(id))) + 1;
  }
  // 個人排行：只算這一輪（Epoch＝resetId）的分數，同人同道取最高再加總；同分同名次
  function rankPlayers(scores, players) {
    const resetId = lastReset(players), joins = joinsSince(players);
    const board = joins.map((r, i) => ({ player: i + 1, team: Number(r.Team), levels: {}, tfs: {}, total: 0, cleared: 0 }));
    scores.forEach(s => {
      const b = board[Number(s.Player) - 1];
      if (!b || Number(s.Epoch) !== resetId) return;
      const lv = String(s.Level), sc = Number(s.Score) || 0, tf = Number(s.Tf) || 0;   // tf＝這道剩下的時間比例，越大越快
      if (b.levels[lv] == null || sc > b.levels[lv] || (sc === b.levels[lv] && tf > b.tfs[lv])) { b.levels[lv] = sc; b.tfs[lv] = tf; }
    });
    board.forEach(b => { b.total = Object.values(b.levels).reduce((a, x) => a + x, 0); b.cleared = Object.keys(b.levels).length; });
    const speed = p => Math.round(Object.values(p.tfs).reduce((a, x) => a + x, 0) * 100) / 100;   // n8n 用 toString() 嵌入這個函式，不能改成呼叫 speedOf；同分比出餐速度：加總全部玩過的道（頒獎只加該獎的道），四捨五入方式同頒獎
    board.sort((a, b) => b.total - a.total || speed(b) - speed(a) || a.player - b.player);
    board.forEach(b => { b.rank = 1 + board.filter(x => x.total > b.total).length; });
    return { resetId, players: joins.length, board };
  }

  // 分組對抗：同桌組員總分的平均（還沒得分的人算 0，人數不同也公平），同分同名次、同分照桌號排
  function rankTeams(board) {
    const t = {};
    board.forEach(b => { const k = Number(b.team); (t[k] = t[k] || { team: k, sum: 0, members: 0 }); t[k].sum += Number(b.total) || 0; t[k].members++; });
    const list = Object.values(t).map(x => ({ team: x.team, members: x.members, avg: Math.round(x.sum / x.members) }));
    list.sort((a, b) => b.avg - a.avg || a.team - b.team);
    list.forEach(x => { x.rank = 1 + list.filter(y => y.avg > x.avg).length; });
    return list;
  }

  // 不按名次的獎項：依序頒發。個人獎比「相關道次分數合計 → 作答速度合計 → 號碼小」，得過個人獎的人跳過；
  // 符合門檻的人都得過獎時，改給還沒得獎、最接近門檻的人（先比達標道數），全班都得過獎或其他人都沒分數才從缺（James 2026-10-29）。
  // 最後頒小組冠軍＝投影幕「分組對抗」第一名（組員平均分，同分比全桌平均速度），可以跟個人獎重複。投影幕只秀名稱和提示，不秀條件
  const AWARDS = [
    { id: "eagle", name: "鷹眼審稿獎", icon: "eye", levels: [2, 4] },
    { id: "budget", name: "精算大師獎", icon: "coins", levels: [3] },
    { id: "seat", name: "排座外交官", icon: "armchair", levels: [5] },
    { id: "complaint", name: "客訴救火隊", icon: "fire-extinguisher", levels: [6] },
    { id: "comeback", name: "下半場逆轉獎", icon: "rocket-launch", levels: [5, 6] },
    { id: "steady", name: "最穩出菜獎", icon: "cooking-pot", levels: [1, 2, 3, 4, 5, 6], min: 70 },
    { id: "team", name: "小組冠軍", icon: "trophy", team: true }
  ];
  const speedOf = (b, lvs) => Math.round(lvs.reduce((x, lv) => x + ((b.tfs || {})[lv] || 0), 0) * 100) / 100;   // 四捨五入，避免小數誤差決定得主
  function pickAwards(board) {
    const won = new Set();
    return AWARDS.map(a => {
      const base = { id: a.id, name: a.name, icon: a.icon, kind: a.team ? "team" : "player",
                     hint: a.team ? "看的是：全桌平均分最高" : "看的是：正確率＋作答速度" };
      if (a.team) {
        const t = {};
        // 平均算法必須跟 rankTeams 一樣，投影幕「分組對抗」第一名才會是冠軍
        board.forEach(b => { const k = Number(b.team); (t[k] = t[k] || { team: k, sum: 0, spd: 0, members: 0 }); t[k].sum += Number(b.total) || 0; t[k].spd += speedOf(b, Object.keys(b.levels || {})); t[k].members++; });
        const c = Object.values(t).map(x => ({ team: x.team, members: x.members, avg: Math.round(x.sum / x.members), speed: Math.round(x.spd / x.members * 100) / 100 }))
          .filter(x => x.avg > 0 && team(x.team)).sort((x, y) => y.avg - x.avg || y.speed - x.speed || x.team - y.team);   // 不存在的桌號投影幕秀不出來，不能當冠軍
        return Object.assign(base, { winner: c[0] || null });
      }
      const min = a.min || 0, lvOf = b => b.levels || {}, hit = b => a.levels.filter(lv => lvOf(b)[lv] != null && lvOf(b)[lv] >= min).length;
      const left = board.filter(b => !won.has(b.player) && Number(b.total) > 0);   // 總分 0（只玩了 0 分的那道）不算候選
      const strict = left.filter(b => hit(b) === a.levels.length);
      const c = (strict.length ? strict : left)   // 沒人達標：還沒得獎、有分數的人裡找最接近的
        .map(b => ({ player: b.player, team: b.team, hit: hit(b), score: a.levels.reduce((x, lv) => x + (lvOf(b)[lv] || 0), 0), speed: speedOf(b, a.levels) }))
        .sort((x, y) => y.hit - x.hit || y.score - x.score || y.speed - x.speed || x.player - y.player);
      if (c[0]) won.add(c[0].player);
      return Object.assign(base, { winner: c[0] || null });
    });
  }

  window.BQ = { shapeSVG, team, teamLabel, submitScore, fetchBoard, joinPlayer, resetSession, store, esc, courseScore, costAcc, comboStep, normSession, studentURL,
                lastReset, playerNo, rankPlayers, rankTeams, pickAwards };
})();
