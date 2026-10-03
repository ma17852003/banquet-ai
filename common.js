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
  async function submitScore(p) {
    try {
      const body = new URLSearchParams({ session: p.session, team: String(p.team), level: String(p.course),
                                         score: String(p.score), detail: JSON.stringify(p.detail || {}) });
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(GAME.api + "/banquet-score", { method: "POST", body, signal: ctrl.signal });
      clearTimeout(tid);
      const j = await r.json().catch(() => null);
      return !!(j && j.ok === true);
    } catch (e) { return false; }
  }
  async function fetchBoard(session) {
    try {
      const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(GAME.api + "/banquet-board?session=" + encodeURIComponent(session), { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(tid);
      const j = await r.json();
      return Array.isArray(j.board) ? j.board : null;
    } catch (e) { return null; }
  }

  // localStorage 可能被擋（無痕模式），讀寫一律包起來，失敗就當沒存
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.BQ = { shapeSVG, team, teamLabel, submitScore, fetchBoard, store, esc };
})();
