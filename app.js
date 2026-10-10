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

  // ── 關卡開場：員工證（第二條規則依關卡不同）──
  const RULE = {
    default: "答案在「出餐」之後才揭曉，每道只能出餐一次",
    cost: "答案在「出餐」之後才揭曉。小心陷阱：選到 1 張陷阱會抵掉 2 張答對",
    sort: "每則只能分一次，分完立刻揭曉對錯；連續答對有加分"
  };
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
        <div><i class="ph ph-check"></i><span>${RULE[c.kind] || RULE.default}</span></div></div>`;
    setBar(`<button class="btn-ghost" id="back">菜單</button><button class="btn-serve" id="start" style="flex:1"><i class="ph ph-play"></i>開始</button>`);
    $("#back").onclick = renderMenu;
    $("#start").onclick = () => ({ prompt: playPrompt, spot: playSpot, cost: playCost, seat: playSeat, sort: playSort })[c.kind](c);
  }

  // ── 結算：公式在 common.js 的 BQ.courseScore（有測試）──
  async function finish(n, acc, detail, extra, bonus) {
    const tf = timeFrac(); stopTimer();
    const score = BQ.courseScore(acc, tf, bonus);
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

  // ── 第 3 道：隱藏成本大挑戰（點選＝勾選，預估總成本即時跳動）──
  const nt = v => "NT$" + v.toLocaleString("en-US");
  function playCost(c) {
    renderHud(); main.className = "fixed";
    const sub = c.budget.reduce((a, b) => a + b.amount, 0);
    const order = shuffle(c.cards.map((_, i) => i));
    const sel = new Set(); let done = false, shown = sub;
    main.innerHTML = `
      <div class="ticket budget"><div class="no">AI OUTPUT · 預算單</div>
        ${c.budget.map(b => `<div class="brow"><span>${esc(b.item)}</span><b class="mono">${nt(b.amount)}</b></div>`).join("")}
        <div class="brow sum"><span>AI 算的合計</span><b class="mono">${nt(sub)}</b></div></div>
      <div class="kicker" style="margin:12px 0 6px">AI 漏算了哪些？點選你認為要加進去的成本</div>
      <div class="costs">${order.map(i => `<button class="cost" data-i="${i}" aria-pressed="false"><span>${esc(c.cards[i].name)}</span><b class="mono">+${nt(c.cards[i].amount)}</b></button>`).join("")}</div>
      <div class="costtotal"><span class="kicker">預估總成本</span><b class="mono" id="ctot">${nt(sub)}</b><span class="capnote" id="capnote" aria-live="polite"></span></div>`;
    function total() { return sub + [...sel].reduce((a, i) => a + c.cards[i].amount, 0); }
    function update() {
      const to = total(), from = shown; shown = to;
      const el = $("#ctot"), t0 = performance.now();
      if (RM) el.textContent = nt(to);
      else (function f(t) { const k = Math.min(1, (t - t0) / 600); el.textContent = nt(Math.round(from + (to - from) * k)); if (k < 1) requestAnimationFrame(f); })(t0);
      $("#capnote").textContent = to <= c.cap ? `上限 ${nt(c.cap)}，還剩 ${nt(c.cap - to)}` : `已超出上限 ${nt(to - c.cap)}`;
      const sv = $("#serve"); sv.disabled = sel.size === 0;
      sv.innerHTML = sel.size ? `<i class="ph ph-bell-simple-ringing"></i>出餐（已選 ${sel.size} 項）` : "先選出你認為漏算的成本";
    }
    main.querySelectorAll(".cost").forEach(b => b.onclick = () => {
      if (done) return;
      const i = Number(b.dataset.i);
      sel.has(i) ? sel.delete(i) : sel.add(i);
      b.setAttribute("aria-pressed", String(sel.has(i)));
      update();
    });
    setBar(`<button class="btn-serve" id="serve"></button>`);
    $("#serve").onclick = submit;
    update();
    function submit() {
      if (done) return; done = true;
      const picked = [...sel], hits = picked.filter(i => c.cards[i].hidden).length;
      finish(3, BQ.costAcc(picked, c.cards), { hits, traps: picked.length - hits }, { sel: picked });
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

  // ── 第 5 道：客訴分類閃電戰（一則只分一次不能改，所以當場揭曉對錯＋連擊，不會變成試錯）──
  function playSort(c) {
    renderHud(); main.className = "fixed";
    const order = shuffle(c.items.map((_, i) => i));
    const answers = {};
    let k = 0, s = { streak: 0, bonus: 0 }, best = 0, done = false, busy = false;
    main.innerHTML = `
      <div class="sorthead"><span class="kicker" id="prog"></span><span class="combo mono" id="combo" aria-live="polite"></span></div>
      <div class="stack" id="stack"></div>
      <p class="verdict" id="verdict" aria-live="polite"></p>
      <div class="zones">${c.cats.map(z => `<button class="zone" data-z="${z.id}"><span class="zn"><i class="ph ph-${z.icon}" aria-hidden="true"></i>${z.label}</span><span class="zh">${z.hint}</span></button>`).join("")}</div>`;
    function drawCard() {
      const left = order.length - k;
      $("#stack").innerHTML = left
        ? `<div class="ticket qcard"><div class="no">COMPLAINT #${pad(k + 1)}</div><p>「${esc(c.items[order[k]].text)}」</p></div>` +
          (left > 1 ? '<div class="edge e1"></div>' : "") + (left > 2 ? '<div class="edge e2"></div>' : "")
        : `<p class="alldone">${order.length} 則全部分完，出餐看統計</p>`;
      $("#prog").textContent = left ? `第 ${k + 1} / ${order.length} 則` : "分類完成";
      if ($("#verdict").innerHTML) $("#verdict").classList.add("prev");
      const n = order.length - k;
      setBar(`<button class="btn-serve" id="serve" ${n ? "disabled" : ""}>${n ? `還有 ${n} 則沒分` : '<i class="ph ph-bell-simple-ringing"></i>出餐'}</button>`);
      $("#serve").onclick = submit;
    }
    main.querySelectorAll(".zone").forEach(b => b.onclick = () => {
      if (busy || done || k >= order.length) return;
      busy = true;
      const i = order[k], ok = c.items[i].cat === b.dataset.z;
      answers[i] = b.dataset.z;
      s = BQ.comboStep(s, ok); best = Math.max(best, s.streak);
      b.classList.add(ok ? "ok" : "ng"); if (ok) vibrate();
      $("#combo").textContent = s.streak >= 3 ? `連擊 ×${s.streak}` : "";
      const right = c.cats.find(z => z.id === c.items[i].cat).label;
      $("#verdict").className = "verdict " + (ok ? "ok" : "ng");
      $("#verdict").innerHTML = ok ? '<i class="ph ph-check" aria-hidden="true"></i>答對' : `<i class="ph ph-x" aria-hidden="true"></i>答錯，正解是「${right}」`;
      const sv = $("#serve"), n = order.length - k - 1;
      if (sv) sv.textContent = n ? `還有 ${n} 則沒分` : "出餐";
      const card = $(".qcard"); if (card) card.classList.add(ok ? "flyok" : "flyng");
      setTimeout(() => { b.classList.remove("ok", "ng"); k++; busy = false; if (!done) drawCard(); }, ok ? (RM ? 120 : 380) : 900);
    });
    function submit() {
      if (done) return; done = true;
      const correct = c.items.filter((it, i) => answers[i] === it.cat).length;
      finish(5, correct / c.items.length, { correct, bonus: s.bonus, best }, { answers: Object.assign({}, answers) }, s.bonus);
    }
    drawCard(); startTimer(c.seconds, submit);
  }

  // ── 本道結算 ──
  const BADGES = {
    chef: { name: "提示詞主廚", icon: "chef-hat" }, eye: { name: "鷹眼審稿", icon: "eye" },
    armchair: { name: "零客訴桌", icon: "armchair" }, clock: { name: "準時上菜", icon: "clock" },
    cost: { name: "成本鷹眼", icon: "coins" }, flash: { name: "閃電客服", icon: "lightning" }
  };
  function badgeFor(n, r) {
    if (n === 1 && r.acc === 1) return BADGES.chef;
    if (n === 2 && r.acc === 1 && r.detail.wrong === 0) return BADGES.eye;
    if (n === 3 && r.acc === 1) return BADGES.cost;
    if (n === 4 && r.acc === 1) return BADGES.armchair;
    if (n === 5 && r.detail.best >= 8) return BADGES.flash;
    return null;
  }
  function statsLine(n, r) {
    const t = `剩餘時間 ${Math.round(r.tf * 100)}%`;
    if (n === 1) return `<span>積木品質 ${Math.round(r.acc * 100)}%</span><span>${t}</span>`;
    if (n === 2) return `<span>找到 ${r.detail.found} / 5 個錯</span><span>誤標 ${r.detail.wrong} 次</span><span>${t}</span>`;
    if (n === 3) return `<span>抓到 ${r.detail.hits} / ${C(3).cards.filter(x => x.hidden).length} 項漏算</span><span>踩到陷阱 ${r.detail.traps} 次</span><span>${t}</span>`;
    if (n === 5) return `<span>分對 ${r.detail.correct} / ${C(5).items.length} 則</span><span>最高連擊 ×${r.detail.best}</span><span>連擊加分 +${r.detail.bonus}</span><span>${t}</span>`;
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
    if (n === 3) {
      const sub = c.budget.reduce((a, b) => a + b.amount, 0);
      const real = sub + c.cards.filter(x => x.hidden).reduce((a, b) => a + b.amount, 0);
      const idx = c.cards.map((_, i) => i).sort((a, b) => c.cards[b].hidden - c.cards[a].hidden);
      return `<div class="learn" style="margin-top:0"><div class="kicker">實際要花多少</div>AI 說 ${nt(sub)}，在上限內。把真正漏掉的加回去，實際是 <b>${nt(real)}</b>，<b class="over">超出上限 ${nt(real - c.cap)}</b>。<br>評分規則：選到 1 張陷阱，會抵掉 2 張答對。</div>
        <div class="kicker" style="margin-top:12px">${c.cards.length} 張成本卡的解答</div>` + idx.map(i => {
        const x = c.cards[i], picked = r.sel.includes(i);
        const label = x.hidden ? (picked ? "抓到了" : "漏掉了") : (picked ? "踩到陷阱" : "沒上當");
        return row(x.hidden === picked, `${label}：${esc(x.name)}（${nt(x.amount)}）`, x.why);
      }).join("");
    }
    if (n === 5) {
      const lab = id => c.cats.find(z => z.id === id).label;
      const cnt = c.cats.map(z => ({ z, n: c.items.filter(it => it.cat === z.id).length })).sort((a, b) => b.n - a.n);
      return `<div class="learn" style="margin-top:0"><div class="kicker">這場客訴統計</div>${cnt.map(x => `${x.z.label} ${x.n} 件`).join("｜")}<br>件數最多：<b>${cnt[0].z.label}</b>。但排優先順序也要看嚴重度，食安和過敏優先。</div>
        <div class="kicker" style="margin-top:12px">每則客訴的正解</div>` + c.items.map((it, i) => {
        const a = r.answers[i], ok = a === it.cat;
        return row(ok, `「${esc(it.text)}」`, ok ? lab(it.cat) : `你分：${a ? lab(a) : "沒分到"}　正解：${lab(it.cat)}`);
      }).join("");
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
    // 稀有度由高到低；成果卡最多放 3 枚，稱號取最稀有的那枚
    const RARITY = ["準時上菜", "鷹眼審稿", "成本鷹眼", "零客訴桌", "閃電客服", "提示詞主廚"];
    const TITLES = { "準時上菜": "準時上菜王", "鷹眼審稿": "鷹眼審稿組", "成本鷹眼": "成本鷹眼組",
                     "零客訴桌": "零客訴桌", "閃電客服": "閃電客服組", "提示詞主廚": "提示詞主廚" };
    const got = PLAYABLE.map(n => R[n] ? badgeFor(n, R[n]) : null).filter(Boolean);
    if (PLAYABLE.every(n => R[n] && R[n].tf >= 0.5)) got.push(BADGES.clock);
    got.sort((a, b) => RARITY.indexOf(a.name) - RARITY.indexOf(b.name));
    const pins = got.slice(0, 3);
    const title = got.length ? TITLES[got[0].name] : "全場敬業獎";
    const d = new Date(), date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    main.innerHTML = `
      <div class="ticket final" id="card">
        <div class="no">MINSHIH UNIV. · 餐飲系 · 宴會管理 · ${date}</div>
        <div class="ftitle">${title}</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:14px">${BQ.shapeSVG(t, 20)}<b>${BQ.teamLabel(S.team)}</b></div>
        <div style="display:flex;align-items:baseline;gap:10px"><span class="ftotal">${tot}</span><span style="font-size:13px;color:var(--c-ink-muted)" id="frank">總分</span></div>
        <div>${GAME.courses.map(c => `<div class="frow"><span>${pad(c.no)} ${c.title}</span><b>${c.kind === "soon" ? "下次開放" : (R[c.no] ? R[c.no].score : "—")}</b></div>`).join("")}</div>
        ${pins.length ? `<div class="fpins">${pins.map(b => `<span>${b.name}</span>`).join("")}</div>` : ""}
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
