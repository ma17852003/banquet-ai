// 《宴會指揮官》學生手機端
(function () {
  const $ = s => document.querySelector(s);
  const main = $("#main"), hud = $("#hud"), bar = $("#bar"), live = $("#live");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = no => GAME.courses.find(c => c.no === no);
  const PLAYABLE = GAME.courses.filter(c => c.kind !== "soon").map(c => c.no);
  const pad = n => String(n).padStart(2, "0");
  const esc = BQ.esc;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const vibrate = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) {} };

  // ── 狀態：誰（場次＋桌）與各道成績，存在本機 ──
  let S = BQ.store.get("bq-who", {});
  const qs = new URLSearchParams(location.search);
  if (qs.get("s")) S.session = qs.get("s").replace(/\D/g, "").slice(0, 4);
  let R = {};
  const resKey = () => `bq-res-${S.session}-${S.team}`;
  const loadRes = () => { R = (S.session && S.team) ? BQ.store.get(resKey(), {}) : {}; };
  const saveRes = () => BQ.store.set(resKey(), R);
  const totalScore = () => Object.values(R).reduce((a, r) => a + (r.score || 0), 0);

  // ── 計時 ──
  let timer = null;
  function stopTimer() { if (timer) { clearInterval(timer.id); timer = null; } const t = $("#tmr"); if (t) { t.textContent = ""; t.className = "timer"; } }
  function startTimer(sec, onEnd) {
    stopTimer();
    const end = Date.now() + sec * 1000, tm = $("#tmr");
    const tick = () => {
      if (!timer) return;
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      tm.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
      tm.classList.toggle("warn", left <= 30);
      tm.classList.toggle("pulse", left <= 10 && left > 0 && !RM);
      if ([60, 30, 10].includes(left) && timer.last !== left) live.textContent = `剩 ${left} 秒`;
      timer.last = left;
      if (left <= 0) { toast("收單！時間到，用目前的答案出餐"); onEnd(); }
    };
    timer = { id: setInterval(tick, 250), end, total: sec, last: null };
    tick();
  }
  const timeFrac = () => timer ? Math.max(0, (timer.end - Date.now()) / (timer.total * 1000)) : 0;

  // ── 共用畫面元件 ──
  function renderHud() {
    hud.hidden = false;
    const t = BQ.team(S.team);
    hud.innerHTML = `<span class="chip">${BQ.shapeSVG(t)}<span>${BQ.teamLabel(S.team)}</span></span>
      <span class="timer" id="tmr" role="timer" aria-label="剩餘時間"></span>
      <span class="score"><span class="kicker">總分</span><br><b id="tot">${totalScore()}</b></span>`;
  }
  function setBar(html) { bar.innerHTML = html; }
  let toastT;
  function toast(msg) {
    let el = $(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600);
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("已複製，貼到 ChatGPT 或 Gemini 試試");
  }

  // ── 入場：選桌＋場次碼 ──
  function renderEntry() {
    stopTimer(); hud.hidden = true; main.className = "";
    let pick = S.team || null;
    main.innerHTML = `
      <div class="kicker">MINSHIH · 宴會管理 · AI 業師課</div>
      <h1 class="title" style="margin-top:8px">宴會指揮官</h1>
      <p class="lead">今晚 300 人的國際食品品牌新品發表餐會，交給你們這桌，指揮 AI 超級團隊把它辦好。</p>
      <div class="kicker" style="margin-top:20px">選你們的桌</div>
      <div class="tables-pick">${GAME.teams.map(t => `<button class="seat-card" data-t="${t.no}" aria-pressed="${pick === t.no}">${BQ.shapeSVG(t, 26)}<span><small>TABLE ${pad(t.no)} · 第 ${t.no} 桌</small><b style="font-size:18px">${t.name}</b></span></button>`).join("")}</div>
      <label class="kicker" for="code">輸入投影幕上的 4 位數場次碼</label>
      <input id="code" class="code-input" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(S.session || "")}">`;
    setBar(`<button class="btn-serve" id="go" disabled>入座</button>`);
    const go = $("#go"), code = $("#code");
    const check = () => {
      const ok = pick && /^\d{4}$/.test(code.value);
      go.disabled = !ok; go.textContent = ok ? "入座" : (!pick ? "先選一張桌" : "輸入 4 位數場次碼");
    };
    main.querySelectorAll(".seat-card").forEach(b => b.onclick = () => {
      pick = Number(b.dataset.t);
      main.querySelectorAll(".seat-card").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      check();
    });
    code.oninput = () => { code.value = code.value.replace(/\D/g, "").slice(0, 4); check(); };
    go.onclick = () => { S = { session: code.value, team: pick }; BQ.store.set("bq-who", S); loadRes(); renderMenu(); };
    check();
  }

  // ── 菜單卡（關卡地圖）──
  function renderMenu() {
    stopTimer(); renderHud(); main.className = "";
    const items = GAME.courses.map(c => {
      const r = R[c.no];
      const num = `<span class="num">COURSE<br>${pad(c.no)}</span>`;
      const name = `<span class="name">${c.title}<small>${c.dish} · AI ${c.staff}</small></span>`;
      if (c.kind === "soon") return `<li><div class="course soon">${num}${name}<span class="st"><i class="ph ph-lock-simple" aria-label="下次開放"></i></span></div></li>`;
      if (r) return `<li><button class="course done" data-c="${c.no}" aria-label="${c.title}，已完成，${r.score} 分">${num}${name}<span class="st">${r.score}</span></button></li>`;
      return `<li><button class="course" data-c="${c.no}">${num}${name}<span class="go">開始</span></button></li>`;
    }).join("");
    const unsynced = Object.keys(R).filter(k => !R[k].synced);
    main.innerHTML = `
      <div class="ticket menu"><div class="head"><div class="no">LAUNCH BANQUET · 300 PAX</div>
        <div class="serif" style="font-weight:900;font-size:26px;margin-top:6px">今晚菜單</div>
        <div style="font-size:14px;color:var(--c-ink-muted)">${esc(GAME.scenario.title)}</div></div>
        <ol>${items}</ol></div>
      ${unsynced.length ? `<p class="sync bad"><i class="ph ph-arrow-counter-clockwise"></i>有 ${unsynced.length} 道分數還沒送到投影幕 <button class="btn-ghost" id="resync">重送</button></p>` : ""}
      <p style="text-align:center;margin-top:16px"><button class="btn-ghost" id="swap">換桌／換場次</button></p>`;
    main.querySelectorAll("button.course").forEach(b => b.onclick = () => { const n = Number(b.dataset.c); R[n] ? renderResult(n, false) : renderIntro(n); });
    $("#swap").onclick = renderEntry;
    if (unsynced.length) $("#resync").onclick = async () => {
      for (const k of unsynced) await sync(Number(k));
      renderMenu();
    };
    const allDone = PLAYABLE.every(n => R[n]);
    setBar(allDone ? `<button class="btn-serve" id="fin"><i class="ph ph-trophy"></i>看成果卡</button>`
                   : `<p class="hint">點一道菜開始，${PLAYABLE.length} 道都完成就能領成果卡</p>`);
    if (allDone) $("#fin").onclick = renderFinal;
  }

  // ── 關卡開場：員工證 ──
  function renderIntro(n) {
    const c = C(n); stopTimer(); renderHud(); main.className = "";
    main.innerHTML = `
      <div class="kicker">COURSE ${pad(n)} · ${c.dish}</div>
      <h2 class="title">${c.title}</h2>
      <div class="badge-card"><div class="top"><i class="ph ph-${c.icon}" aria-hidden="true"></i></div>
        <div class="bottom"><div class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--c-ink-muted)">STAFF ID · AI-${pad(n)}</div>
        <div class="role">AI ${c.staff}</div><p style="margin-top:6px">${c.mission}</p></div></div>
      <div class="rules">
        <div><i class="ph ph-hourglass-medium"></i><span>限時 ${Math.round(c.seconds / 60)} 分鐘。答得越對、出餐越快，分數越高</span></div>
        <div><i class="ph ph-check"></i><span>答案在「出餐」之後才揭曉，每道只能出餐一次</span></div></div>`;
    setBar(`<button class="btn-ghost" id="back">菜單</button><button class="btn-serve" id="start" style="flex:1"><i class="ph ph-play"></i>開始</button>`);
    $("#back").onclick = renderMenu;
    $("#start").onclick = () => ({ prompt: playPrompt, spot: playSpot, seat: playSeat })[c.kind](c);
  }

  // ── 計分：答對率決定一切，速度只放大答對的部分（避免亂按快速交卷拿時間分）──
  async function finish(n, acc, detail, extra) {
    const tf = timeFrac(); stopTimer();
    const score = Math.round(acc * (70 + 30 * tf));
    R[n] = Object.assign({ score, acc, tf: Math.round(tf * 100) / 100, synced: false, detail }, extra);
    saveRes();
    renderResult(n, true);
    await sync(n);
    updateSync(n); showRank("#rank");
  }
  async function sync(n) {
    const r = R[n];
    r.synced = await BQ.submitScore({ session: S.session, team: S.team, course: n, score: r.score, detail: r.detail });
    saveRes();
    return r.synced;
  }

  // ── 第 1 道：提示詞積木 ──
  function playPrompt(c) {
    renderHud(); main.className = "fixed";
    const order = c.slots.map(s => shuffle(s.options.map((_, i) => i)));
    const picks = {}; let active = 0, done = false;
    function draw() {
      const left = c.slots.filter(s => picks[s.key] == null).length;
      const s = c.slots[active];
      main.innerHTML = `
        <div class="kicker">COURSE 01 · 組出一句提示詞給 AI 企劃員</div>
        <div class="meter" aria-hidden="true">${c.slots.map(x => `<span class="${picks[x.key] != null ? "on" : ""}"></span>`).join("")}</div>
        <div class="slots">${c.slots.map((x, i) => `<button class="slot ${i === active ? "active" : ""}" data-i="${i}">
            <span class="lab">${x.en}<b>${x.label}</b></span>
            <span class="val ${picks[x.key] == null ? "empty" : ""}">${picks[x.key] == null ? "點這裡選一塊積木" : esc(x.options[picks[x.key]].text)}</span></button>`).join("")}</div>
        <div class="pool"><div class="kicker">選一塊「${s.label}」積木</div>
          ${order[active].map(oi => `<button class="ticket opt ${picks[s.key] === oi ? "picked" : ""}" data-o="${oi}">${esc(s.options[oi].text)}</button>`).join("")}</div>`;
      main.querySelectorAll(".slot").forEach(b => b.onclick = () => { active = Number(b.dataset.i); draw(); });
      main.querySelectorAll(".opt").forEach(b => b.onclick = () => {
        picks[s.key] = Number(b.dataset.o);
        const next = c.slots.findIndex(x => picks[x.key] == null);
        if (next >= 0) active = next;
        draw();
      });
      setBar(`<button class="btn-serve" id="serve" ${left ? "disabled" : ""}>${left ? `還有 ${left} 格沒放積木` : '<i class="ph ph-bell-simple-ringing"></i>出餐'}</button>`);
      if (!left) $("#serve").onclick = submit;
    }
    function submit() {
      if (done) return; done = true;
      const sum = c.slots.reduce((a, s) => a + (picks[s.key] != null ? s.options[picks[s.key]].pts : 0), 0);
      finish(1, sum / 100, { acc: sum / 100 }, { picks: Object.assign({}, picks), prompt: buildPrompt(c, picks) });
    }
    draw(); startTimer(c.seconds, submit);
  }
  function buildPrompt(c, picks) {
    return c.slots.map(s => picks[s.key] != null ? s.options[picks[s.key]].text : "")
                  .filter(t => t && !t.startsWith("（")).join("");
  }
  function bestPicks(c) { const p = {}; c.slots.forEach(s => { p[s.key] = s.options.findIndex(o => o.pts === 25); }); return p; }

  // ── 第 2 道：AI 企劃找碴（標記次數有限，不能整份亂點）──
  function playSpot(c) {
    renderHud(); main.className = "fixed";
    const total = c.lines.filter(l => l.wrong).length;
    const st = { used: 0, found: [], miss: [] }; let done = false;
    main.innerHTML = `
      <div class="spotbar"><span class="dots" id="dots" role="img" aria-label="找到 0 / ${total}">${"<span></span>".repeat(total)}</span>
        <span class="kicker" id="marks">標記剩 ${c.markLimit} 次</span></div>
      <div class="ticket plan"><div class="no">AI OUTPUT · DRAFT</div><h3>宴會企劃書（初稿）</h3>
        <div style="font-size:13px;color:var(--c-ink-muted);margin-bottom:8px;line-height:1.5">${esc(GAME.scenario.title)}<br>賓客：${esc(GAME.scenario.guests)}</div>
        ${c.lines.map((l, i) => `<button class="line" data-i="${i}"><span class="mark"></span><span class="hl">${esc(l.text)}</span><span class="note"></span></button>`).join("")}
      </div>`;
    main.querySelectorAll(".line").forEach(b => b.onclick = () => tap(b));
    setBar(`<button class="btn-serve" id="serve"><i class="ph ph-bell-simple-ringing"></i>出餐</button>`);
    $("#serve").onclick = submit;
    function tap(b) {
      if (b.disabled || done) return;
      const i = Number(b.dataset.i), l = c.lines[i];
      b.disabled = true; st.used++;
      if (l.wrong) { st.found.push(i); b.classList.add("hit"); b.querySelector(".mark").textContent = `錯 ${st.found.length}/${total}`; vibrate(); }
      else { st.miss.push(i); b.classList.add("miss"); b.querySelector(".mark").textContent = "這句沒問題"; }
      b.querySelector(".note").textContent = l.why;
      main.querySelectorAll("#dots span").forEach((d, k) => d.classList.toggle("on", k < st.found.length));
      $("#dots").setAttribute("aria-label", `找到 ${st.found.length} / ${total}`);
      $("#marks").textContent = `標記剩 ${c.markLimit - st.used} 次`;
      if (st.found.length === total || st.used >= c.markLimit) {
        main.querySelectorAll(".line").forEach(x => { if (!x.disabled) { x.disabled = true; x.classList.add("cleared"); } });
        $("#serve").innerHTML = `<i class="ph ph-bell-simple-ringing"></i>${st.found.length === total ? `${total} 個錯全找到了，出餐` : "標記用完了，出餐"}`;
      }
    }
    function submit() {
      if (done) return; done = true;
      finish(2, st.found.length / total, { found: st.found.length, wrong: st.miss.length },
             { foundIdx: st.found.slice(), missIdx: st.miss.slice() });
    }
    startTimer(c.seconds, submit);
  }

  // ── 第 4 道：特殊餐飲排座（先點賓客、再點桌子）──
  function playSeat(c) {
    renderHud(); main.className = "fixed";
    const place = {}; let armed = null, done = false;
    const order = shuffle(c.guests.map((_, i) => i));
    const shortName = n => n.split(" ").pop();
    function tagsHTML(g) { return g.tags.map(k => `<span class="tag"><i class="ph ph-${c.tagInfo[k].icon}" aria-hidden="true"></i>${c.tagInfo[k].label}</span>`).join(""); }
    function draw() {
      const prevScroll = $("#pool") ? $("#pool").scrollLeft : 0;
      const pool = order.filter(i => place[i] == null);
      main.innerHTML = `
        <div class="kicker" style="margin-bottom:6px">${armed == null ? "先點一位賓客" : `再點一張桌子，把「${esc(c.guests[armed].name)}」排過去`}</div>
        <div class="guests" id="pool">${pool.length ? pool.map(i => `<button class="ticket guest ${armed === i ? "armed" : ""}" data-g="${i}" aria-pressed="${armed === i}">
            <b>${esc(c.guests[i].name)}</b><span class="tags">${tagsHTML(c.guests[i])}</span></button>`).join("")
          : `<p style="color:var(--c-muted);padding:16px 4px;font-size:14px">全部入座了。檢查一下就出餐吧，點桌上的名字可以拿回來重排。</p>`}</div>
        <div class="tbls ${armed != null ? "armed-mode" : ""}">${c.tables.map((t, k) => `<div class="tbl ${k === c.tables.length - 1 ? "wide" : ""}" data-t="${t.id}" role="button" tabindex="0" aria-label="${t.name}，${t.note}">
            <span class="nm"><i class="ph ph-${t.icon}" aria-hidden="true"></i>${t.name}</span><span class="nt">${t.note}</span>
            <span class="seated">${order.filter(i => place[i] === t.id).map(i => `<button class="pill" data-g="${i}" aria-label="把 ${esc(c.guests[i].name)} 拿回來">${esc(shortName(c.guests[i].name))}</button>`).join("")}</span></div>`).join("")}</div>`;
      const p = $("#pool"); if (p) p.scrollLeft = prevScroll;
      main.querySelectorAll(".guest").forEach(b => b.onclick = () => { const g = Number(b.dataset.g); armed = armed === g ? null : g; draw(); });
      main.querySelectorAll(".tbl").forEach(t => {
        const put = () => { if (armed == null) { toast("先點上面的賓客"); return; } place[armed] = t.dataset.t; armed = null; vibrate(); draw(); };
        t.onclick = put;
        t.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); put(); } };
      });
      main.querySelectorAll(".pill").forEach(b => b.onclick = e => { e.stopPropagation(); const g = Number(b.dataset.g); delete place[g]; armed = g; draw(); });
      const left = c.guests.length - Object.keys(place).length;
      setBar(`<button class="btn-serve" id="serve" ${left ? "disabled" : ""}>${left ? `還有 ${left} 位賓客沒入座` : '<i class="ph ph-bell-simple-ringing"></i>出餐'}</button>`);
      if (!left) $("#serve").onclick = submit;
    }
    function submit() {
      if (done) return; done = true;
      const correct = c.guests.filter((g, i) => place[i] === g.ans).length;
      finish(4, correct / c.guests.length, { correct }, { place: Object.assign({}, place) });
    }
    draw(); startTimer(c.seconds, submit);
  }

  // ── 本道結算 ──
  const BADGES = {
    chef: { name: "提示詞主廚", icon: "chef-hat" }, eye: { name: "鷹眼審稿", icon: "eye" },
    armchair: { name: "零客訴桌", icon: "armchair" }, clock: { name: "準時上菜", icon: "clock" }
  };
  function badgeFor(n, r) {
    if (n === 1 && r.acc === 1) return BADGES.chef;
    if (n === 2 && r.acc === 1 && r.detail.wrong === 0) return BADGES.eye;
    if (n === 4 && r.acc === 1) return BADGES.armchair;
    return null;
  }
  function statsLine(n, r) {
    const t = `剩餘時間 ${Math.round(r.tf * 100)}%`;
    if (n === 1) return `<span>積木品質 ${Math.round(r.acc * 100)}%</span><span>${t}</span>`;
    if (n === 2) return `<span>找到 ${r.detail.found} / 5 個錯</span><span>誤標 ${r.detail.wrong} 次</span><span>${t}</span>`;
    return `<span>排對 ${r.detail.correct} / ${C(4).guests.length} 位</span><span>${t}</span>`;
  }
  function reviewHTML(n, r) {
    const c = C(n);
    const row = (ok, main_, sub) => `<div class="row ${ok ? "ok" : "ng"}"><i class="ph ph-${ok ? "check" : "x"}" aria-label="${ok ? "對" : "錯"}"></i><span>${main_}<small>${sub}</small></span></div>`;
    if (n === 1) {
      return `<div class="kicker">四塊積木逐一檢查</div>` + c.slots.map(s => {
        const i = r.picks[s.key], o = i != null ? s.options[i] : null, best = s.options.find(x => x.pts === 25);
        return row(o && o.pts === 25, `${s.label}：${o ? esc(o.text) : "沒放"}`, (o ? o.why : "") + (o && o.pts === 25 ? "" : `<br>更好：${esc(best.text)}`));
      }).join("");
    }
    if (n === 2) {
      return `<div class="kicker">5 個錯的解答</div>` + c.lines.map((l, i) => l.wrong
        ? row(r.foundIdx.includes(i), r.foundIdx.includes(i) ? "抓到了" : "漏掉了", `${esc(l.text)}<br>${l.why}`) : "").join("");
    }
    const tName = id => (c.tables.find(t => t.id === id) || { name: "沒排" }).name;
    return `<div class="kicker">每位賓客的正解</div>` + c.guests.map((g, i) => {
      const ok = r.place[i] === g.ans;
      return row(ok, `${esc(g.name)}`, `${ok ? "" : `你排：${tName(r.place[i])}　正解：${tName(g.ans)}<br>`}${g.why}`);
    }).join("");
  }
  function takeHTML(n, r) {
    const c = C(n);
    const links = `<a class="btn-ghost" href="https://chatgpt.com/" target="_blank" rel="noopener">開 ChatGPT</a><a class="btn-ghost" href="https://gemini.google.com/" target="_blank" rel="noopener">開 Gemini</a>`;
    let body;
    if (n === 1) {
      const best = buildPrompt(c, bestPicks(c));
      body = `<div class="kicker">你們組出的提示詞</div><div class="ticket">${esc(r.prompt || "（沒有組出完整的提示詞）")}</div>
        ${r.acc < 1 ? `<div class="kicker" style="margin-top:12px">滿分版本</div><div class="ticket">${esc(best)}</div>` : ""}`;
      r._copy = r.acc < 1 ? best : r.prompt;
    } else { body = `<div class="kicker">帶回家的提示詞：自己用 AI 做一次</div><div class="ticket">${esc(c.takehome)}</div>`; r._copy = c.takehome; }
    return `<div class="take">${body}<div class="acts"><button class="btn-ghost" id="copy"><i class="ph ph-copy"></i>複製提示詞</button>${links}</div></div>`;
  }
  function syncHTML(r, pending) {
    if (pending) return `<span style="color:var(--c-muted)">送到投影幕中…</span>`;
    return r.synced ? `<span style="color:var(--c-muted)"><i class="ph ph-check"></i> 已送到投影幕</span>`
                    : `<span>還沒送到投影幕</span><button class="btn-ghost" id="retry"><i class="ph ph-arrow-counter-clockwise"></i>重送</button>`;
  }
  function updateSync(n) {
    const el = $("#sync"); if (!el) return;
    el.className = "sync" + (R[n].synced ? "" : " bad"); el.innerHTML = syncHTML(R[n], false);
    const btn = $("#retry");
    if (btn) btn.onclick = async () => { el.innerHTML = syncHTML(R[n], true); await sync(n); updateSync(n); showRank("#rank"); };
    const tot = $("#tot"); if (tot) tot.textContent = totalScore();
  }
  async function showRank(sel) {
    const el = $(sel); if (!el) return;
    const board = await BQ.fetchBoard(S.session);
    if (!board || !$(sel)) return;
    const i = board.findIndex(b => String(b.team) === String(S.team));
    if (i < 0) return;
    el.textContent = i === 0 ? `目前全場第 1 名` : `目前全場第 ${i + 1} 名，離第 ${i} 名差 ${board[i - 1].total - board[i].total} 分`;
  }
  function renderResult(n, fresh) {
    const c = C(n), r = R[n]; stopTimer(); renderHud(); main.className = ""; main.scrollTop = 0;
    const badge = badgeFor(n, r);
    main.innerHTML = `
      <div class="result-head"><div class="kicker">COURSE ${pad(n)} · 本道得分</div>
        <h2 class="title" style="margin-bottom:0">${c.title}</h2>
        <div class="bigscore" id="big">${fresh && !RM ? 0 : r.score}</div>
        <div class="stats">${statsLine(n, r)}</div>
        <div class="sync ${!fresh && !r.synced ? "bad" : ""}" id="sync">${syncHTML(r, fresh)}</div>
        ${badge ? `<div class="pin"><i class="ph ph-${badge.icon}" aria-hidden="true"></i><span><span class="kicker">獲得徽章</span><br><b>${badge.name}</b></span></div>` : ""}
        <p id="rank" style="margin-top:12px;color:var(--text-dim);font-size:14px"></p>
      </div>
      <div class="learn"><div class="kicker">學到了什麼</div>${c.lesson}</div>
      <div class="review">${reviewHTML(n, r)}</div>
      ${takeHTML(n, r)}`;
    $("#copy").onclick = () => copyText(r._copy);
    setBar(`<button class="btn-serve" id="menu">回菜單</button>`);
    $("#menu").onclick = renderMenu;
    if (!fresh) { updateSync(n); showRank("#rank"); }
    else cloche(() => rollScore(r.score));
  }
  function rollScore(target) {
    const el = $("#big"); if (!el) return;
    if (RM) { el.textContent = target; return; }
    const t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / 600); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  }

  // ── 銀餐蓋＋金色紙片 ──
  function cloche(done) {
    if (RM) { done(); return; }
    const el = document.createElement("div");
    el.className = "cloche"; el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<svg viewBox="0 0 320 200"><defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#8C8676"/><stop offset=".45" stop-color="#EDE6D6"/><stop offset="1" stop-color="#9C9584"/></linearGradient></defs>
      <g class="dome"><path d="M50 150 A110 110 0 0 1 270 150 Z" fill="url(#cg)"/><rect x="146" y="26" width="28" height="16" rx="8" fill="#C9C2B2"/></g>
      <rect x="28" y="150" width="264" height="8" rx="4" fill="#C9C2B2"/></svg><div class="cap">上菜</div>`;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add("lift"); confetti(); }, 350);
    setTimeout(() => { el.classList.add("out"); done(); }, 1400);
    setTimeout(() => el.remove(), 1900);
  }
  function confetti() {
    const cv = document.createElement("canvas"), dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    cv.id = "confetti"; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const ps = Array.from({ length: 14 }, () => ({ x: W / 2 + (Math.random() - .5) * 160, y: H * .42, vx: (Math.random() - .5) * 4,
      vy: -Math.random() * 5 - 2, r: Math.random() * 6, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 4, h: 3 + Math.random() * 3 }));
    const t0 = performance.now();
    (function f(t) {
      const k = (t - t0) / 1200; ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.vy += .18; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = "#D4AF37"; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (k < 1) requestAnimationFrame(f); else cv.remove();
    })(t0);
  }

  // ── 成果卡（截圖帶走）──
  function renderFinal() {
    stopTimer(); renderHud(); main.className = ""; main.scrollTop = 0;
    const t = BQ.team(S.team), tot = totalScore();
    const got = [badgeFor(1, R[1] || {}), badgeFor(2, R[2] || { detail: {} }), badgeFor(4, R[4] || {})].filter(Boolean);
    if (PLAYABLE.every(n => R[n] && R[n].tf >= 0.5)) got.unshift(BADGES.clock);
    const TITLES = { "準時上菜": "準時上菜王", "鷹眼審稿": "鷹眼審稿組", "零客訴桌": "零客訴桌", "提示詞主廚": "提示詞主廚" };
    const order = ["準時上菜", "鷹眼審稿", "零客訴桌", "提示詞主廚"];
    const top = order.find(nm => got.some(b => b.name === nm));
    const title = top ? TITLES[top] : "全場敬業獎";
    const d = new Date(), date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    main.innerHTML = `
      <div class="ticket final" id="card">
        <div class="no">MINSHIH UNIV. · 餐飲系 · 宴會管理 · ${date}</div>
        <div class="ftitle">${title}</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:14px">${BQ.shapeSVG(t, 20)}<b>${BQ.teamLabel(S.team)}</b></div>
        <div style="display:flex;align-items:baseline;gap:10px"><span class="ftotal">${tot}</span><span style="font-size:13px;color:var(--c-ink-muted)" id="frank">總分</span></div>
        <div>${GAME.courses.map(c => `<div class="frow"><span>${pad(c.no)} ${c.title}</span><b>${c.kind === "soon" ? "下次開放" : (R[c.no] ? R[c.no].score : "—")}</b></div>`).join("")}</div>
        ${got.length ? `<div class="fpins">${got.map(b => `<span>${b.name}</span>`).join("")}</div>` : ""}
        <div class="no">本組寫出的提示詞</div>
        <div class="fprompt">${esc((R[1] && R[1].prompt) || "（第 1 道沒有組出完整提示詞）")}</div>
        <div class="no" style="text-align:center">— TICKET #${esc(S.session)}-${pad(S.team)} —</div>
      </div>
      <p style="text-align:center;color:var(--c-muted);font-size:13px;margin-top:12px">截圖存下這張卡。上面那句提示詞，回家就能直接拿去問 AI。</p>`;
    setBar(`<button class="btn-serve" id="menu">回菜單</button>`);
    $("#menu").onclick = renderMenu;
    BQ.fetchBoard(S.session).then(board => {
      const el = $("#frank"); if (!board || !el) return;
      const i = board.findIndex(b => String(b.team) === String(S.team));
      if (i >= 0) el.textContent = `總分 · 全場第 ${i + 1} 名`;
    });
  }

  // ── 啟動 ──
  loadRes();
  if (S.team && /^\d{4}$/.test(S.session || "")) renderMenu(); else renderEntry();
})();
