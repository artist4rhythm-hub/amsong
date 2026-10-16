// 말씀암송 선포구절 — 화면과 동작
import * as B from "./backend.js";

const $app = document.getElementById("app");
const VERSION = "1.4.0";
const VOLS = ["1", "2", "3"];
const VOL_NAME = { "1": "말씀 선포 1권", "2": "말씀 선포 2권", "3": "말씀 선포 3권 · 성벽기도" };
const VOL_SHORT = { "1": "1권", "2": "2권", "3": "3권" };
// 올려 둔 본문에 남아 있는 '주니어' 이름을 화면에서는 '말씀 선포'로 (본문 파일을 다시 올리지 않아도 됨)
const fixName = (s) => String(s || "")
  .replace(/^주니어\s*(\d+)\s*단계$/, "말씀 선포 $1단계").replace(/^Junior\s*Step\s*(\d+)$/i, "말씀 선포 $1단계")
  .replace(/^주니어\s*(\d+)/, "말씀 선포 $1권").replace(/주니어\s*/g, "").replace(/Junior\s*/gi, "");
const VOL_COVER = {
  "1": "linear-gradient(180deg,#E6F0EB 0 48%,#BFD6CB 48% 62%,#86B09E 62% 76%,#4A876F 76% 88%,#1E3932 88%)",
  "2": "linear-gradient(180deg,#DCE8E3 0 44%,#B9CEC5 44% 60%,#7FA898 60% 74%,#006241 74% 88%,#16302A 88%)",
  "3": "linear-gradient(180deg,#E3EEE9 0 40%,#C3D8CE 40% 56%,#8DB4A3 56% 70%,#4F8A73 70% 84%,#1E3932 84%)"
};
const VOL_TAB = { "1": "#2F5D4E", "2": "#1F4A44", "3": "#16302A" };
const MODES = [
  { id: "read", label: "읽기" },
  { id: "hide", label: "가리기" },
  { id: "say", label: "선포" },
  { id: "rec", label: "녹음 채점" }
];
const MODE_TAB = { read: "#2F5D4E", hide: "#28554A", say: "#1F4A44", rec: "#16302A" };
const MARKS = ["miss", "skip", "hes"];
// 형광펜 · 밑줄 색 (겹쳐 쓸 수 있음: 한 낱말에 형광펜 하나 + 밑줄 하나)
const HL = [["y", "노랑"], ["g", "연두"], ["b", "하늘"], ["p", "분홍"], ["o", "주황"]];
const UL = [["r", "빨강"], ["b", "파랑"], ["g", "초록"], ["k", "검정"]];
const MARK_LABEL = { miss: "틀림", skip: "빠뜨림", hes: "머뭇거림" };

// ───────── 상태
const S = {
  user: null, allow: null, admin: false, userDoc: {},
  books: {}, stages: {}, marks: {}, weak: null,
  view: {}, cleanup: null
};

// ───────── 작은 도구
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const refHtml = (r) => esc(r).replace(/Ⓐ/g, '<span class="jang" title="전장">Ⓐ</span>');
const pref = (k, d) => { try { return localStorage.getItem("amsong." + k) ?? d; } catch (e) { return d; } };
const setPref = (k, v) => { try { localStorage.setItem("amsong." + k, v); } catch (e) {} };
const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  check: '<path d="M5 12l4 4 10-10"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pen: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5z"/><path d="M13.5 7l3.5 3.5"/>',
  eraser: '<path d="M8 20h12"/><path d="M4.5 15.5l9-9 5 5-8.5 8.5H8.5z"/><path d="M9.5 10.5l5 5"/>',
  note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/><path d="M8.5 9h7M8.5 12.5h4"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'
};
const icon = (n, cls = "i") => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200);
}

function applyTheme() {
  let t = pref("theme", "cream");
  if (t === "auto") t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "cream";
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeColor").setAttribute("content", t === "dark" ? "#132A24" : "#EFE8D9");
  document.documentElement.style.setProperty("--fs-scale", pref("size", "1"));
}
const curTheme = () => document.documentElement.getAttribute("data-theme");
function toggleTheme() {
  setPref("theme", curTheme() === "dark" ? "cream" : "dark");
  applyTheme(); render();
}

// ───────── 데이터
async function book(vol) {
  if (!S.books[vol]) {
    const b = await B.getBook(vol);
    if (b) { b.title = fixName(b.title); (b.stages || []).forEach((x) => { x.label = fixName(x.label); }); }
    S.books[vol] = b;
  }
  return S.books[vol];
}
async function stage(vol, num) {
  const k = vol + "_" + num;
  if (!S.stages[k]) {
    const st = await B.getStage(vol, num);
    if (st) st.label = fixName(st.label);
    S.stages[k] = st;
  }
  return S.stages[k];
}
async function marksOf(pid) {
  if (!(pid in S.marks)) {
    try { S.marks[pid] = await B.getMarks(S.user.uid, pid); } catch (e) { S.marks[pid] = null; }
  }
  return S.marks[pid];
}
// 채점 기록은 화면을 기다리게 하지 않음: 있으면 바로 쓰고, 없으면 받아 온 뒤 필요할 때만 다시 그림
function marksNow(pid) {
  if (pid in S.marks) return S.marks[pid];
  if (!S._marksLoading) S._marksLoading = {};
  if (!S._marksLoading[pid]) {
    S._marksLoading[pid] = marksOf(pid).then((m) => {
      delete S._marksLoading[pid];
      if (m && (m.sessions || m.total) && S.ctx && S.ctx.p.id === pid && location.hash.startsWith("#/p/")) render();
    });
  }
  return null;
}
const canVol = (v) => S.admin || (S.allow && (S.allow.vols || []).includes(v));
const memorized = (pid) => !!(S.userDoc.memorized && S.userDoc.memorized[pid]);
const memCount = (vol) => Object.keys(S.userDoc.memorized || {}).filter((k) => k.startsWith("v" + vol + "s")).length;
const memCountStage = (vol, num) => Object.keys(S.userDoc.memorized || {}).filter((k) => k.startsWith(`v${vol}s${num}p`)).length;

// ───────── 형광펜 · 밑줄 · 메모
const PEN = { on: false, tool: pref("penTool", "hl:y") };
const NOTES = {};          // 본문 id → { hl, ul, memo, info }
const noteSaveT = {};
function notesNow(pid) {
  if (NOTES[pid]) return NOTES[pid];
  const mine = NOTES[pid] = { hl: {}, ul: {}, memo: {}, info: null };
  B.getNotes(S.user.uid, pid).then((d) => {
    if (!d) return;
    // 받아 오기 전에 이미 표시한 것이 있으면 그것을 위에 덮음
    mine.hl = { ...(d.hl || {}), ...mine.hl };
    mine.ul = { ...(d.ul || {}), ...mine.ul };
    mine.memo = { ...(d.memo || {}), ...mine.memo };
    const has = Object.keys(mine.hl).length || Object.keys(mine.ul).length || Object.keys(mine.memo).length;
    if (has && S.ctx && S.ctx.p.id === pid && S.ctx.mode === "read" && S.view.memoEdit == null) refreshVerses();
  }).catch(() => {});
  return mine;
}
function saveNotes(pid) {
  clearTimeout(noteSaveT[pid]);
  noteSaveT[pid] = setTimeout(() => flushNotes(pid), 700);
}
function flushNotes(pid) {
  clearTimeout(noteSaveT[pid]); delete noteSaveT[pid];
  const n = NOTES[pid]; if (!n) return;
  B.setNotes(S.user.uid, pid, { ...n, ...(n.info || {}) }).catch(() => toast("표시를 저장하지 못했어요. 인터넷 연결을 확인해 주세요."));
}
document.addEventListener("visibilitychange", () => { if (document.hidden) Object.keys(noteSaveT).forEach(flushNotes); });
function curNotes() {
  const c = S.ctx, n = notesNow(c.p.id);
  n.info = { ref: c.p.ref, vol: c.vol, num: c.num, no: c.p.no };
  return n;
}
// 본문 부분만 다시 그림 (화면 전체를 다시 그리지 않아 빠름)
function refreshVerses() {
  const c = S.ctx; if (!c || c.mode !== "read") return;
  const box = document.querySelector(".verses[data-read]"); if (!box) return;
  box.outerHTML = versesBox(c.p, c.weak, notesNow(c.p.id));
  fitAll();
  const ta = document.querySelector(".memo-edit textarea");
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}
function refreshPenBar() {
  const bar = document.querySelector(".pen-bar, .pen-row"); if (!bar) return;
  const hint = document.querySelector(".pb-hint"); if (hint) hint.remove();
  bar.outerHTML = penBar();
}

// 낱말을 누르거나 쭉 그어서 표시 (손가락 · 펜 · 마우스)
let drag = null;
const paintSel = () => {
  const lo = Math.min(drag.a, drag.b), hi = Math.max(drag.a, drag.b);
  drag.all.forEach((x, i) => x.classList.toggle("sel", i >= lo && i <= hi));
};
document.addEventListener("pointerdown", (e) => {
  if (!PEN.on || !S.ctx || S.ctx.mode !== "read") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const w = e.target.closest(".verses.pen [data-w]"); if (!w) return;
  if (PEN.tool === "memo") { e.preventDefault(); S.view.memoEdit = Number(w.dataset.w.split("-")[0]); refreshVerses(); return; }
  const all = [...document.querySelectorAll(".verses.pen [data-w]")];
  drag = { all, a: all.indexOf(w), b: all.indexOf(w), id: e.pointerId };
  paintSel();
});
document.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const w = el && el.closest && el.closest(".verses.pen [data-w]");
  if (!w) return;
  const i = drag.all.indexOf(w);
  if (i >= 0 && i !== drag.b) { drag.b = i; paintSel(); }
});
document.addEventListener("pointerup", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  const lo = Math.min(d.a, d.b), hi = Math.max(d.a, d.b);
  const keys = d.all.slice(lo, hi + 1).map((x) => x.dataset.w);
  const n = curNotes(), [kind, col] = PEN.tool.split(":");
  if (kind === "erase") keys.forEach((k) => { delete n.hl[k]; delete n.ul[k]; });
  else {
    const map = kind === "hl" ? n.hl : n.ul;
    // 이미 모두 같은 색이면 지우고, 아니면 칠함
    if (keys.every((k) => map[k] === col)) keys.forEach((k) => delete map[k]);
    else keys.forEach((k) => { map[k] = col; });
  }
  saveNotes(S.ctx.p.id);
  refreshVerses();
});
document.addEventListener("pointercancel", () => {
  if (drag) { drag.all.forEach((x) => x.classList.remove("sel")); drag = null; }
});

// 단어 단위로 나누기 (줄 바꿈은 책 그대로)
const words = (line) => line.split(" ").filter((w) => w.length);
const weakSet = (m) => {
  const out = new Set();
  if (m && m.words) for (const [k, v] of Object.entries(m.words)) if ((v.n || 0) >= 2) out.add(k);
  return out;
};

// ───────── 길 찾기
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, qs] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams(qs || ""));
  return { parts, q };
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
window.addEventListener("hashchange", () => render());

// ───────── 머리줄 (책상 위)
const themeBtn = () => `<button class="iconbtn" type="button" data-act="theme" aria-label="${curTheme() === "dark" ? "밝은 바탕으로" : "어두운 바탕으로"}">${icon(curTheme() === "dark" ? "sun" : "moon")}</button>`;
function topBar(title, back, extra = "") {
  return `<header class="top">
    ${back ? `<a class="iconbtn" href="${back}" aria-label="뒤로">${icon("back")}</a>` : ""}
    <div class="t">${title}</div>
    ${extra}
    ${themeBtn()}
  </header>`;
}

// ───────── 책 모양 틀
// 책상 위에 놓인 책 한 권(초록 표지 + 종이). tabs가 있으면 종이 위에 책갈피 색인을 붙임
const tome = (inner, tabs = "") =>
  `${tabs}<div class="tome${tabs ? " tabbed" : ""}"><div class="leaf paperink">${inner}</div></div>`;
const deskPage = (top, body) => `<div class="desk">${top}<main class="desk-main">${body}</main></div>`;
// 넓은 화면(패드 가로 · 컴퓨터): 좌우가 같은 두 쪽 펼친 책 (왼쪽 구절표 · 오른쪽 본문)
// 쪽마다 따로 넘겨 보고, 아래 바깥쪽 모서리에 책처럼 쪽 표시
const openBook = (top, left, right, tabs = "", folioL = "", folioR = "") => `<div class="desk ob-desk">${top}
  <div class="ob-wrap${tabs ? " has-tabs" : ""}">${tabs ? `<div class="ob-tabs">${tabs}</div>` : ""}
    <div class="ob"><div class="ob-stack" aria-hidden="true"></div><div class="ob-pages">
      <aside class="ob-l paperink" aria-label="단계 구절표"><div class="ob-scroll" data-keep="l">${left}</div><div class="folio" aria-hidden="true">${folioL}</div></aside>
      <div class="ob-gutter" aria-hidden="true"></div>
      <section class="ob-r paperink"><div class="ob-scroll" data-keep="r">${right}</div><div class="folio" aria-hidden="true">${folioR}</div></section>
    </div></div>
  </div></div>`;

// ───────── 화면: 로그인 · 대기
function viewLogin() {
  $app.innerHTML = `<main class="gate cover-gate">
    <div class="cv" role="img" aria-label="말씀암송 선포구절 책 표지">
      <small>다니엘 아마츠</small>
      <span class="cv-rule"></span>
      <h1>말씀암송<br>선포구절</h1>
      <span class="cv-rule"></span>
      <span class="cv-sub">1 · 2 · 3권</span>
    </div>
    <p>등록된 구글 계정으로 들어와 주세요.</p>
    <div class="actions">
      <button class="btn google" type="button" data-act="signin">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.7l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
        구글 계정으로 들어가기
      </button>
    </div>
  </main>`;
}

function viewPending() {
  $app.innerHTML = `<main class="gate">${tome(`
    <span class="kicker">승인 대기</span>
    <h1>아직 열람 허용이<br>되지 않았어요</h1>
    <p>아래 메일 주소를 관리자에게 알려 주세요. 등록되면 바로 볼 수 있어요.</p>
    <div class="mail">${esc(S.user.email)}</div>
    <div class="actions">
      <button class="btn" type="button" data-act="recheck">다시 확인</button>
      <button class="btn ghost" type="button" data-act="signout">다른 계정으로 들어가기</button>
    </div>`)}
  </main>`;
}

// 안내 한 장 (본문 없음 · 오류)
function notePage(back, title, msg, action = "") {
  $app.innerHTML = deskPage(topBar("", back), tome(`<div class="note-page">
    <h1 class="ptitle">${title}</h1><p class="muted">${msg}</p>${action ? `<div class="tools">${action}</div>` : ""}</div>`));
}

// ───────── 화면: 서재
// ───────── 화면: 서재 — 펼친 책 (패드·컴퓨터: 두 쪽 펼침 / 폰: 한 쪽씩 넘기기)
// 가로로 넓은 화면(패드 가로·컴퓨터·폰 가로)만 두 쪽 펼침, 세로 화면은 한 쪽씩
const spreadMode = () => matchMedia("(min-width: 700px) and (orientation: landscape)").matches;
const LIB = { vol: null, side: Number(pref("libSide", "0")) || 0 };

async function libData(vol) {
  const b = await book(vol);
  if (!b) return null;
  const sts = await Promise.all(b.stages.map((s) => stage(vol, s.num).catch(() => null)));
  const stages = b.stages.map((s, k) => {
    const st = sts[k];
    const next = st ? st.passages.find((p) => !memorized(p.id)) : null;
    return { ...s, done: memCountStage(vol, s.num), next, st };
  });
  // 이 책에서 이어서 외울 본문: 이 책의 지난 위치 → 없으면 아직 안 외운 첫 본문
  const lb = (S.userDoc.lastByVol || {})[vol] || (S.userDoc.last && S.userDoc.last.vol === vol ? S.userDoc.last : null);
  let cont = null;
  if (lb) {
    const s = stages.find((x) => x.num === lb.num);
    const p = s && s.st && s.st.passages.find((x) => x.no === lb.no);
    if (p) cont = { st: s.st, p };
  }
  if (!cont) {
    const s = stages.find((x) => x.next) || stages[0];
    if (s && s.st) cont = { st: s.st, p: s.next || s.st.passages[0] };
  }
  return { b, stages, cont, done: memCount(vol) };
}

function libContPage(vol, D) {
  if (!D.cont) return `<div class="pg-kick">이어서 외우기</div><p class="pg-muted">본문을 불러오지 못했어요.</p>`;
  const { st, p } = D.cont;
  const lines = [];
  // 빈 공간이 남지 않도록 들어가는 만큼 보여 주고, 넘치는 아래쪽은 흐리게
  p.verses.forEach((v) => v.lines.forEach((l, i) => { if (lines.length < 40) lines.push({ n: i === 0 ? v.n : "", l }); }));
  const href = `#/p/${vol}/${st.num}/${p.no}`;
  return `<div class="pg-kick"><b>이어서 외우기</b> · ${esc(st.label)}${p.group ? " · " + esc(p.group) : ""}</div>
    <div class="pg-refrow"><span class="pg-ref">${refHtml(p.ref)}</span>${p.topic ? `<span class="pg-topic">${esc(p.topic)}</span>` : ""}</div>
    <div class="pg-lines" data-fit>${lines.map((x) => `<div class="pg-line"><span class="vn">${x.n ?? ""}</span><span class="ln">${esc(x.l)}</span></div>`).join("")}</div>
    <div class="pg-more">${p.verses.length}절 · 이어서 외우기를 누르면 본문 화면으로 가요</div>
    ${libAfter(vol, st, p)}
    <a class="pg-go only-spread" href="${href}">이어서 외우기 ${icon("next")}</a>`;
}

// 본문이 짧아 남는 자리에: 선포 상자 + 이 단계의 다음 본문
function libAfter(vol, st, p) {
  const decl = p.after.filter((a) => a.kind === "decl").map((a) => `<div class="pg-decl">${a.lines.map(esc).join("<br>")}</div>`).join("");
  const i = st.passages.findIndex((x) => x.no === p.no);
  const nexts = st.passages.slice(i + 1, i + 4);
  const list = nexts.length ? `<div class="pg-sub">이어지는 본문</div>${nexts.map((x) =>
    `<a class="pg-next" href="#/p/${vol}/${st.num}/${x.no}"><span>${refHtml(x.ref)}</span><small>${x.verses.length}절${memorized(x.id) ? " · 외움" : ""}</small></a>`).join("")}` : "";
  return decl || list ? `<div class="pg-after">${decl}${list}</div>` : "";
}

function libStagesPage(vol, D) {
  const weak = (S.weak || []).filter((w) => w.vol === vol).slice(0, 3);
  return `<div class="pg-head"><span><b class="pg-name">${esc(D.b.title)}</b><small>${esc(D.b.range)} · 본문 ${D.b.total}개</small></span>
      <span class="pg-count"><b>${D.done}</b> / ${D.b.total}</span></div>
    <div class="pg-stages">${D.stages.map((s) => {
      const w = s.count ? Math.round((s.done / s.count) * 100) : 0;
      const nxt = s.next ? `다음 ${refHtml(s.next.ref)}` : "모두 외웠어요";
      return `<a class="pg-stage" href="#/s/${vol}/${s.num}"><span class="ps-main"><span class="ps-t">${esc(s.label)} <small>· ${nxt}</small></span>
        <span class="ps-bar"><i style="width:${w}%"></i></span></span><span class="ps-n">${s.done}/${s.count}</span>${icon("next")}</a>`;
    }).join("")}</div>
    ${weak.length ? `<div class="pg-sub">자주 틀리는 본문</div>${weak.map((w) =>
      `<a class="pg-weak" href="#/p/${w.vol}/${w.num}/${w.no}?m=hide"><b>${refHtml(w.ref)}</b><span class="wk-n">표시 ${w.total}곳</span></a>`).join("")}` : ""}
    <div class="pg-sub">함께 읽기</div>
    <div class="pg-extras"><a href="#/x/${vol}/prayer">암송 기도문</a><a href="#/x/${vol}/slogans">개념 구호</a>${D.b.names ? `<a href="#/x/${vol}/names">하나님의 이름</a>` : ""}</div>`;
}

async function viewLibrary() {
  const rid = rendering;
  const vols = [];
  for (const v of VOLS) if (canVol(v)) { try { if (await book(v)) vols.push(v); } catch (e) {} }
  if (S.weak === null) {
    S.weak = [];
    B.weakList(S.user.uid, 8).then((w) => { S.weak = w; if (w.length && !location.hash.replace(/^#\/?/, "")) render(); }).catch(() => {});
  }
  const top = `<header class="lib-top">
      <span class="lib-brand"><small>다니엘 아마츠</small><b>말씀암송 선포구절</b></span>
      <span style="display:flex">${S.admin ? `<a class="iconbtn" href="#/admin" aria-label="열람 허용 관리">${icon("users")}</a>` : ""}
      <a class="iconbtn" href="#/settings" aria-label="설정">${icon("gear")}</a>
      <button class="iconbtn" type="button" data-act="theme" aria-label="${curTheme() === "dark" ? "밝은 바탕으로" : "어두운 바탕으로"}">${icon(curTheme() === "dark" ? "sun" : "moon")}</button></span>
    </header>`;
  if (!vols.length) {
    $app.innerHTML = `<div class="lib">${top}<div class="book1"><div class="paper"><div class="page-in">
      <div class="pg-kick"><b>내 책</b></div><p class="pg-muted">${S.admin ? "본문이 아직 없어요. 관리 화면에서 본문 파일을 올려 주세요." : "볼 수 있는 책이 아직 없어요. 관리자에게 문의해 주세요."}</p>
      ${S.admin ? `<a class="pg-go" href="#/admin">관리 화면으로 ${icon("next")}</a>` : ""}</div></div></div></div>`;
    return;
  }
  if (!LIB.vol || !vols.includes(LIB.vol)) {
    const saved = pref("libVol", "");
    const lastV = S.userDoc.last && S.userDoc.last.vol;
    LIB.vol = vols.includes(saved) ? saved : vols.includes(lastV) ? lastV : vols[0];
  }
  if (rid !== rendering) return;
  const vol = LIB.vol;
  const D = await libData(vol);
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  const tabs = vols.map((v) => {
    const b = S.books[v], pct = b && b.total ? Math.round((memCount(v) / b.total) * 100) : 0;
    const label = VOL_SHORT[v];
    return `<button class="btab" type="button" role="tab" data-libvol="${v}" aria-selected="${v === vol}" aria-label="${esc(VOL_NAME[v])} · 외움 ${pct}%" style="--tabc:${VOL_TAB[v]}">
      <b>${label}</b><span>${spreadMode() ? "" : "외움 "}${pct}%</span></button>`;
  }).join("");
  const contHref = D && D.cont ? `#/p/${vol}/${D.cont.st.num}/${D.cont.p.no}` : "#/";
  if (spreadMode()) {
    $app.innerHTML = `<div class="lib">${top}
      <div class="spread-wrap"><div class="spread">
        <div class="sp-stack"></div>
        <div class="sp-pages" id="libPages">
          <section class="sp-left page-in" aria-label="단계와 진도">${D ? libStagesPage(vol, D) : ""}</section>
          <div class="sp-gutter" aria-hidden="true"></div>
          <section class="sp-right page-in" aria-label="이어서 외우기">${D ? libContPage(vol, D) : ""}</section>
        </div>
        <div class="side-tabs" role="tablist" aria-label="책 고르기">${tabs}</div>
      </div></div></div>`;
  } else {
    const side = LIB.side;
    $app.innerHTML = `<div class="lib">${top}
      <div class="tabs-top" role="tablist" aria-label="책 고르기">${tabs}</div>
      <div class="book1"><div class="paper" id="libPages">
        <div class="page-in">
          <div class="pg-body">${D ? (side === 0 ? libContPage(vol, D) : libStagesPage(vol, D)) : ""}</div>
          <div class="pg-actions">
            <button class="pg-flip" type="button" data-act="libflip">${side === 0 ? "단계 · 진도 ↗" : "↖ 앞 쪽으로"}</button>
            <a class="pg-go" href="${contHref}">이어서 외우기 ${icon("next")}</a>
          </div>
          <div class="pg-dots" aria-hidden="true"><i class="${side === 0 ? "on" : ""}"></i><i class="${side === 1 ? "on" : ""}"></i></div>
        </div>
      </div></div></div>`;
  }
  fitAll();
}

// 책 바꾸기 · 쪽 넘기기: 효과 없이 바로 바뀜 (폰에서 멈칫거리지 않게)
function libTurn(change) { change(); render(); }
// 책의 한 줄이 한 줄로 보이도록 글자 크기 자동 맞춤 (최소 82%)
function fitAll() {
  document.querySelectorAll("[data-fit]").forEach((box) => {
    box.style.removeProperty("--fit");
    const lines = [...box.querySelectorAll(".ln")];
    if (!lines.length) return;
    box.classList.add("measuring");
    let ratio = 1;
    for (const l of lines) { if (l.scrollWidth > l.clientWidth + 1) ratio = Math.min(ratio, l.clientWidth / l.scrollWidth); }
    box.classList.remove("measuring");
    if (ratio < 1) box.style.setProperty("--fit", String(Math.max(0.82, Math.floor(ratio * 100) / 100)));
    box.classList.toggle("clip", box.scrollHeight > box.clientHeight + 2);
  });
}

// ───────── 화면: 책 (단계 목록)
// 책의 단계 목록은 서재의 '단계 · 진도' 쪽과 같으므로, 그 책을 펼친 서재로 보냄
async function viewBook(vol) {
  if (!canVol(vol)) return go("#/");
  LIB.vol = vol; LIB.side = 1; setPref("libVol", vol); setPref("libSide", "1");
  history.replaceState(null, "", "#/");
  S._route = "#/";
  return viewLibrary();
}

function viewEmpty(back) {
  notePage(back, "본문이 아직 없어요",
    S.admin ? "관리 화면에서 본문 파일을 올려 주세요." : "관리자가 본문을 올리면 볼 수 있어요.",
    S.admin ? '<a class="btn" href="#/admin">관리 화면으로</a>' : "");
}

// ───────── 단계 구절표 (책과 같은 녹색 상자 · 소주제)
function stageList(vol, st, curNo) {
  let out = "", lastg = null, lastt = null;
  for (const p of st.passages) {
    if (p.group && p.group !== lastg) { out += `<span class="g-head">${esc(p.group)}</span>`; lastg = p.group; lastt = null; }
    if (p.topic && p.topic !== lastt) { out += `<span class="t-head">${esc(p.topic)}</span>`; lastt = p.topic; }
    const on = memorized(p.id), cur = p.no === curNo;
    out += `<a class="srow" href="#/p/${vol}/${st.num}/${p.no}" ${cur ? 'aria-current="true"' : ""}>
      <span class="no">${p.no}</span><span class="ref">${refHtml(p.ref)}${p.note ? `<small>${esc(p.note)}</small>` : ""}</span>
      <span class="nv">${p.verses.length}절</span>
      <span class="ck${on ? " on" : ""}" aria-label="${on ? "외움" : "아직"}">${on ? icon("check") : ""}</span></a>`;
  }
  (st.lists || []).forEach((l, k) => {
    out += `<span class="t-head">${esc(l.title)}</span><a class="srow" href="#/l/${vol}/${st.num}/${k + 1}">
      <span class="no"></span><span class="ref">회개 기도 ${l.items.length}가지</span><span class="nv"></span><span></span></a>`;
  });
  return `<div class="slist">${out}</div>`;
}

function stageHead(vol, st, b) {
  const nverse = st.passages.reduce((a, p) => a + p.verses.length, 0);
  return `<div class="page-h"><span class="kicker">${st.lang === "en" ? "STEP" : "단계 구절"}</span><h1>${esc(st.label)}</h1>
    <div class="meta">${esc(VOL_SHORT[vol])} · 본문 ${st.passages.length}개 · ${nverse}절 · 외운 본문 ${memCountStage(vol, st.num)}</div></div>`;
}

// 두 쪽 펼친 책은 가로로 넓은 화면(패드 가로 · 컴퓨터)에서만. 폰 · 패드 세로는 한 쪽씩 세로로 길게
const wide = () => matchMedia("(min-width: 900px) and (orientation: landscape) and (min-height: 560px)").matches;

async function viewStage(vol, num) {
  if (!canVol(vol)) return go("#/");
  const rid = rendering;
  const [b, st] = await Promise.all([book(vol), stage(vol, num)]);
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  if (!b || !st) return viewEmpty("#/b/" + vol);
  if (wide()) {
    // 패드 가로 · 컴퓨터: 펼친 책 — 왼쪽 구절표 + 오른쪽 시작 안내
    const first = st.passages.find((p) => !memorized(p.id)) || st.passages[0];
    const done = memCountStage(vol, num), w = st.passages.length ? Math.round((done / st.passages.length) * 100) : 0;
    const right = `<div class="ob-intro">
        <div class="crumb">${esc(VOL_NAME[vol])}</div>
        <h1 class="ptitle">${esc(st.label)}</h1>
        <div class="intro-prog"><span class="ps-bar"><i style="width:${w}%"></i></span><span>외운 본문 <b>${done}</b> / ${st.passages.length}</span></div>
        <p class="muted">왼쪽 구절표에서 본문을 고르거나, 아직 외우지 않은 본문부터 시작하세요.</p>
        <div class="tools"><a class="btn" href="#/p/${vol}/${num}/${first.no}">${refHtml(first.ref)}부터 외우기 ${icon("next")}</a></div>
      </div>`;
    $app.innerHTML = openBook(topBar(`${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b>`, "#/b/" + vol), leftPage(vol, st, null), right, "",
      `${esc(VOL_NAME[vol])}`, `${esc(st.label)}`);
    return;
  }
  $app.innerHTML = deskPage(topBar(`${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b>`, "#/b/" + vol),
    tome(`${stageHead(vol, st, b)}${stageList(vol, st, null)}`));
}

// 펼친 책의 왼쪽 쪽: 단계 구절표
function leftPage(vol, st, curNo) {
  return `<a class="ob-back" href="#/b/${vol}">${icon("back")}<span>${esc(VOL_SHORT[vol])} · 단계 목록</span></a>
    ${stageHead(vol, st)}${stageList(vol, st, curNo)}`;
}

// ───────── 본문 화면
function neighbors(b, st, no) {
  const i = st.passages.findIndex((p) => p.no === no);
  const prev = i > 0 ? { vol: st.vol, num: st.num, no: st.passages[i - 1].no, ref: st.passages[i - 1].ref } : null;
  let next = i < st.passages.length - 1 ? { vol: st.vol, num: st.num, no: st.passages[i + 1].no, ref: st.passages[i + 1].ref } : null;
  if (!next) {
    const si = b.stages.findIndex((s) => s.num === st.num);
    const ns = b.stages[si + 1];
    if (ns) next = { vol: st.vol, num: ns.num, no: 1, ref: ns.label + " 시작" };
  }
  return { prev, next };
}

function crumbOf(st, p) {
  return [st.label, p.group].filter(Boolean).map(esc).join(" · ");
}

function headHtml(st, p) {
  return `<div class="crumb">${crumbOf(st, p)}</div>
    ${p.topic ? `<span class="band">${esc(p.topic)}</span>` : ""}
    <h1 class="ptitle">${refHtml(p.ref)}${p.note ? `<span class="pnote">${esc(p.note)}</span>` : ""}</h1>`;
}

function afterHtml(p) {
  return p.after.map((a) => a.kind === "decl"
    ? `<div class="decl">${a.lines.map(esc).join("<br>")}</div>`
    : `<div class="pnote-box">${a.lines.map(esc).join("<br>")}</div>`).join("");
}

function versesRead(p, weak, nt) {
  return versesBox(p, weak, nt) + `<div class="closing">— ${refHtml(p.ref)}</div>`;
}

// 낱말마다 형광펜(h-색) · 밑줄(u-색)을 붙이고, 이웃 낱말과 같은 색이면 사이 띄어쓰기도 이어 칠함
function versesBox(p, weak, nt) {
  const hl = nt.hl || {}, ul = nt.ul || {}, memo = nt.memo || {}, ed = S.view.memoEdit;
  return `<div class="verses${PEN.on ? " pen" : ""}" data-fit data-read>${p.verses.map((v, vi) => `<div class="verse"><span class="vn">${v.n ?? ""}</span><div class="lines">
    ${v.lines.map((l, li) => {
      const ws = words(l);
      return `<span class="ln">${ws.map((w, wi) => {
        const k = `${vi}-${li}-${wi}`, k2 = `${vi}-${li}-${wi + 1}`;
        const cls = ["w"];
        if (weak.has(k)) cls.push("weak");
        if (hl[k]) cls.push("h-" + hl[k]);
        if (ul[k]) cls.push("u-" + ul[k]);
        let sp = "";
        if (wi < ws.length - 1) {
          const sc = [];
          if (hl[k] && hl[k] === hl[k2]) sc.push("h-" + hl[k]);
          if (ul[k] && ul[k] === ul[k2]) sc.push("u-" + ul[k]);
          sp = sc.length ? `<span class="sp ${sc.join(" ")}"> </span>` : " ";
        }
        return `<span class="${cls.join(" ")}" data-w="${k}">${esc(w)}</span>${sp}`;
      }).join("")}</span>`;
    }).join("")}
    ${ed === vi ? `<div class="memo-edit"><textarea maxlength="1000" rows="3" placeholder="이 절에 메모를 적어요" aria-label="${esc(String(v.n ?? ""))}절 메모">${esc(memo[vi] || "")}</textarea>
      <div class="me-btns"><button class="btn small" type="button" data-act="memosave" data-vi="${vi}">저장</button>
      ${memo[vi] ? `<button class="btn ghost small" type="button" data-act="memodel" data-vi="${vi}">메모 지우기</button>` : ""}
      <button class="btn ghost small" type="button" data-act="memocancel">닫기</button></div></div>`
      : memo[vi] ? `<button type="button" class="memo-note" data-memo="${vi}" aria-label="메모 고치기">${icon("note")}<span>${esc(memo[vi])}</span></button>` : ""}
    </div></div>`).join("")}</div>`;
}

// 형광펜 도구 줄 (읽기에서만)
function penBar() {
  if (!PEN.on) return `<div class="pen-row"><button type="button" class="pen-open" data-act="pen">${icon("pen")}<span>형광펜 · 밑줄 · 메모</span></button></div>`;
  const kind = PEN.tool.split(":")[0];
  const sw = (k, c, label) => `<button type="button" class="sw sw-${k} c-${c}" data-tool="${k}:${c}" aria-pressed="${PEN.tool === k + ":" + c}" aria-label="${k === "hl" ? "형광펜" : "밑줄"} ${label}"><i></i></button>`;
  const tool = (t, ic, label) => `<button type="button" class="pb-tool" data-tool="${t}" aria-pressed="${PEN.tool === t}">${icon(ic)}<span>${label}</span></button>`;
  const hint = kind === "erase" ? "지울 낱말을 누르거나 손가락으로 쭉 그으세요."
    : kind === "memo" ? "메모를 달 절의 아무 낱말이나 누르세요."
    : "낱말을 누르거나 옆으로 쭉 그어 표시해요. 같은 색으로 다시 그으면 지워지고, 형광펜과 밑줄은 겹쳐 쓸 수 있어요.";
  return `<div class="pen-bar" role="toolbar" aria-label="형광펜 · 밑줄 · 메모">
    <div class="pb-row pb-colors"><span class="pb-lab">형광펜</span>${HL.map(([c, l]) => sw("hl", c, l)).join("")}<span class="pb-sep"></span>
      <span class="pb-lab">밑줄</span>${UL.map(([c, l]) => sw("ul", c, l)).join("")}</div>
    <div class="pb-row">${tool("erase", "eraser", "지우개")}${tool("memo", "note", "메모")}
      <button type="button" class="pb-tool" data-act="penclear" aria-label="표시 모두 지우기">${icon("trash")}<span><span class="pb-long">표시 </span>모두 지우기</span></button>
      <button type="button" class="pb-done" data-act="pen">완료</button></div>
  </div><p class="pb-hint">${hint}</p>`;
}

function maskWord(w, how) {
  if (how === "all") return `<span class="blk" style="width:${Math.max(1, w.length) * 0.92}em"></span>`;
  return esc(w[0]) + `<span class="mk">${"○".repeat(Math.max(0, w.length - 1))}</span>`;
}

// 가리기 한 줄 (줄을 누르면 그 줄만 바꿔 끼움 — 화면 전체를 다시 그리지 않아 빠름)
function hideLine(p, weak, v, vi, li) {
  const how = v.hide || "first", l = p.verses[vi].lines[li];
  const key = `${vi}-${li}`;
  if (v.open.has(key) || v.openAll) return `<span class="ln masked" data-line="${key}" role="button" tabindex="0" aria-label="이 줄 다시 가리기">${esc(l)}</span>`;
  const ws = words(l).map((w, wi) => {
    const k = `${vi}-${li}-${wi}`;
    if (how === "weak") return weak.has(k) ? maskWord(w, "first") : esc(w);
    return maskWord(w, how);
  }).join(" ");
  return `<span class="ln masked" data-line="${key}" role="button" tabindex="0" aria-label="이 줄 열기">${ws}</span>`;
}

function versesHide(p, weak, v) {
  return `<div class="verses" data-fit>${p.verses.map((vs, vi) => `<div class="verse"><span class="vn">${vs.n ?? ""}</span><div class="lines">
    ${vs.lines.map((l, li) => hideLine(p, weak, v, vi, li)).join("")}</div></div>`).join("")}</div>`;
}

function versesSay(p, v) {
  // 한 호흡(책의 한 줄)씩
  const flat = [];
  p.verses.forEach((vs, vi) => vs.lines.forEach((l, li) => flat.push({ vi, li, n: vs.n, l })));
  const cur = Math.min(v.say || 0, flat.length - 1);
  let out = "", lastV = null;
  flat.forEach((x, i) => {
    if (i > cur) return;
    if (x.vi !== lastV) { out += `<span class="vtag">${x.n ?? ""}</span>`; lastV = x.vi; }
    out += `<span class="ln${i === cur ? " now" : ""}">${esc(x.l)}</span>`;
  });
  return { html: `<div class="breath" aria-live="polite">${out}</div>`, cur, total: flat.length };
}

function versesGrade(p, marks) {
  return `<div class="verses grade" data-fit>${p.verses.map((vs, vi) => `<div class="verse"><span class="vn">${vs.n ?? ""}</span><div class="lines">
    ${vs.lines.map((l, li) => `<span class="ln">${words(l).map((w, wi) => {
      const k = `${vi}-${li}-${wi}`, m = marks[k];
      return `<button type="button" class="tok${m ? " m-" + m : ""}" data-tok="${k}" aria-label="${esc(w)}${m ? " · " + MARK_LABEL[m] : ""}">${esc(w)}</button>`;
    }).join(" ")}</span>`).join("")}</div></div>`).join("")}</div>`;
}

async function viewPassage(vol, num, no, q) {
  if (!canVol(vol)) return go("#/");
  const rid = rendering;
  const [b, st] = await Promise.all([book(vol), stage(vol, num)]);
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  if (!b || !st) return viewEmpty("#/b/" + vol);
  const p = st.passages.find((x) => x.no === no) || st.passages[0];
  const mode = MODES.some((m) => m.id === q.m) ? q.m : pref("mode", "read");
  const key = `${vol}/${num}/${p.no}/${mode}`;
  if (S.view.key !== key) {
    if (S.cleanup) { S.cleanup(); S.cleanup = null; }
    S.view = { key, open: new Set(), openAll: false, hide: S.view.hide || "first", say: 0, rec: "idle", marks: {}, result: null };
  }
  const v = S.view;
  const m = marksNow(p.id);
  const weak = weakSet(m);
  const nb = neighbors(b, st, p.no);

  // 지난 위치 저장
  const last = { vol, num, no: p.no, ref: p.ref, label: st.label };
  const lk = JSON.stringify(last);
  if (S._lastKey !== lk) {
    S._lastKey = lk; S.userDoc.last = last;
    S.userDoc.lastByVol = { ...(S.userDoc.lastByVol || {}), [vol]: last };
    B.setLast(S.user.uid, last).catch(() => {});
  }

  let body = "", side = "";
  if (mode === "read") {
    body = penBar() + versesRead(p, weak, notesNow(p.id));
    side = afterHtml(p);
  } else if (mode === "hide") {
    body = `<div class="tools" role="group" aria-label="가리는 방법">
      ${[["first", "첫 글자"], ["all", "모두 가리기"], ["weak", "자주 틀린 곳만"]].map(([id, lb]) =>
        `<button class="chip" type="button" data-hide="${id}" aria-pressed="${v.hide === id}">${lb}</button>`).join("")}
      <button class="chip" type="button" data-act="openall" aria-pressed="${v.openAll}">${v.openAll ? "다시 가리기" : "모두 열기"}</button>
    </div>${versesHide(p, weak, v)}
    <p class="hint">줄을 누르면 그 줄이 열리고, 다시 누르면 가려져요.${v.hide === "weak" && !weak.size ? " 아직 자주 틀린 곳 기록이 없어요. 녹음 채점을 해 보세요." : ""}</p>`;
    side = afterHtml(p);
  } else if (mode === "say") {
    const r = versesSay(p, v);
    body = r.html + `<div class="breath-ctrl">
      <button class="btn ghost" type="button" data-say="-1" ${r.cur <= 0 ? "disabled" : ""}>이전 줄</button>
      <button class="btn" type="button" data-say="1" ${r.cur >= r.total - 1 ? "disabled" : ""}>다음 줄</button></div>
      <div class="tools"><button class="chip" type="button" data-say="0">처음부터</button><span class="hint" style="margin:0;align-self:center">${r.cur + 1} / ${r.total} 호흡</span></div>`;
    side = r.cur >= r.total - 1 ? afterHtml(p) : "";
  } else {
    body = recBody(p, v, m);
  }

  const statLine = m && m.sessions && mode !== "rec" ? `<div class="side-h">나의 녹음 채점</div><p class="muted" style="margin:0">채점 ${m.sessions}번 · 지난번 표시 ${m.lastCount ?? 0}곳 · 누적 ${m.total ?? 0}곳</p>` : "";
  const isWide = wide();
  const sheet = `<article class="sheet">${headHtml(st, p)}${body}${side}${statLine}</article>`;
  // 보기 방식: 종이 위에 꽂힌 책갈피 색인
  const modes = `<nav class="tabs-top mode-tabs" aria-label="보기 방식">${MODES.map((x) =>
    `<a class="btab" data-nav="replace" href="#/p/${vol}/${num}/${p.no}?m=${x.id}" style="--tabc:${MODE_TAB[x.id]}" ${x.id === mode ? 'aria-current="page"' : ""}>${x.id === "rec" ? '<span class="dot"></span>' : ""}<b>${x.label}</b></a>`).join("")}</nav>`;
  const on = memorized(p.id);
  const pager = `<nav class="pager" aria-label="본문 이동">
    ${nb.prev ? `<a data-nav="replace" href="#/p/${nb.prev.vol}/${nb.prev.num}/${nb.prev.no}?m=${mode}" aria-label="이전 본문 ${esc(nb.prev.ref)}">${icon("back")}<span>${refHtml(nb.prev.ref)}</span></a>` : '<span class="ghostlink"></span>'}
    <button class="memo-btn" type="button" data-act="memo" aria-pressed="${on}">${icon("check")}${on ? "외웠어요" : "외웠어요 표시"}</button>
    ${nb.next ? `<a data-nav="replace" href="#/p/${nb.next.vol}/${nb.next.num}/${nb.next.no}?m=${mode}" aria-label="다음 본문 ${esc(nb.next.ref)}"><span>${refHtml(nb.next.ref)}</span>${icon("next")}</a>` : '<span class="ghostlink"></span>'}
  </nav>`;
  const top = `<header class="top">
    ${isWide ? "" : `<a class="iconbtn" href="#/s/${vol}/${num}" aria-label="구절표로">${icon("menu")}</a>`}
    <a class="iconbtn" href="#/" aria-label="서재로">${icon("home")}</a>
    <div class="t">${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b></div>
    ${themeBtn()}
  </header>`;
  if (isWide) {
    const i = st.passages.findIndex((x) => x.no === p.no);
    $app.innerHTML = openBook(top, leftPage(vol, st, p.no), sheet + pager, modes,
      `${esc(VOL_SHORT[vol])} · ${esc(st.label)}`, `${i + 1} / ${st.passages.length}`);
    // 다른 단계에서 왔을 때만 왼쪽 구절표를 지금 본문 쪽으로 (같은 단계 안에서는 render가 위치 유지)
    if (S._keepL == null) {
      const L = $app.querySelector('[data-keep="l"]'), cur = L && L.querySelector('[aria-current="true"]');
      if (cur) L.scrollTop = Math.max(0, cur.offsetTop - L.clientHeight / 2);
    }
  } else {
    $app.innerHTML = deskPage(top, tome(sheet + pager, modes));
  }
  S.ctx = { vol, num, p, st, mode, nb, weak };
  fitAll();
  if (mode === "rec") wireRec();
}

// ───────── 녹음 · 채점
function recBody(p, v, m) {
  const prevLine = m && m.sessions ? `지난번 표시 ${m.lastCount ?? 0}곳 · 채점 ${m.sessions}번` : "처음 녹음해요";
  if (v.rec === "idle" || v.rec === "denied") {
    return `<div class="rec-panel">
      <div class="rec-row"><button class="rec-btn" type="button" data-act="recstart" aria-label="녹음 시작">${icon("mic")}</button>
      <div class="rec-info"><b>본문을 가리고 선포해 보세요</b><span>${prevLine}</span></div></div>
      ${v.rec === "denied" ? `<p class="hint" style="margin:0">마이크를 쓸 수 없어요. 브라우저 설정에서 마이크 허용을 켜 주세요.</p>` : `<p class="hint" style="margin:0">녹음은 이 기기 안에서만 잠시 쓰고 올리지 않아요. 다 듣고 표시한 결과만 저장돼요.</p>`}
    </div>${versesHide(p, new Set(), { hide: "first", open: new Set(), openAll: false })}`;
  }
  if (v.rec === "recording") {
    return `<div class="rec-panel">
      <div class="rec-row"><button class="rec-btn stop" type="button" data-act="recstop" aria-label="녹음 멈추기">${icon("stop")}</button>
      <div class="rec-info"><b>녹음 중 <span id="recTime">0:00</span></b><span>다 외웠으면 멈춤을 누르세요</span></div></div>
      <div class="meter" aria-hidden="true"><i id="recMeter"></i></div>
    </div>${versesHide(p, new Set(), { hide: "first", open: new Set(), openAll: false })}`;
  }
  // 다 녹음함 → 들으며 표시
  const n = Object.keys(v.marks).length;
  return `<div class="rec-panel">
      <audio id="recAudio" controls preload="auto" src="${v.url}"></audio>
      <div class="legend"><span>낱말을 누를 때마다</span><span class="lg-miss">틀림</span><span class="lg-skip">빠뜨림</span><span class="lg-hes">머뭇거림</span><span>→ 지우기</span></div>
    </div>
    ${versesGrade(p, v.marks)}
    ${v.result ? `<div class="result" style="margin-top:16px">${esc(v.result)}</div>` : ""}
    <div class="breath-ctrl">
      <button class="btn ghost" type="button" data-act="recagain">다시 녹음</button>
      <button class="btn" type="button" data-act="recsave" ${v.saved ? "disabled" : ""}>${v.saved ? "저장했어요" : `채점 저장 (${n}곳)`}</button>
    </div>`;
}

function wireRec() {
  const v = S.view;
  if (v.rec === "recording" && !v.ticking) { v.ticking = true; tickRec(); }
}

async function recStart() {
  const v = S.view;
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast("이 브라우저는 녹음을 지원하지 않아요"); return; }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) { v.rec = "denied"; render(); return; }
  const types = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/aac"];
  const mime = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/mp4" });
    if (v.url) URL.revokeObjectURL(v.url);
    v.url = URL.createObjectURL(blob);
    v.rec = "done"; v.marks = {}; v.saved = false; v.result = null;
    stopStream();
    render();
  };
  let ac = null, an = null;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(stream);
    an = ac.createAnalyser(); an.fftSize = 512; src.connect(an);
  } catch (e) {}
  function stopStream() {
    stream.getTracks().forEach((t) => t.stop());
    if (ac) ac.close().catch(() => {});
    cancelAnimationFrame(v.raf);
  }
  v.recorder = rec; v.an = an; v.t0 = Date.now(); v.rec = "recording";
  S.cleanup = () => {
    try { if (rec.state !== "inactive") { rec.onstop = null; rec.stop(); } } catch (e) {}
    stopStream();
    if (v.url) URL.revokeObjectURL(v.url);
  };
  rec.start();
  render();
}

function tickRec() {
  const v = S.view;
  const buf = v.an ? new Uint8Array(v.an.fftSize) : null;
  const step = () => {
    if (v.rec !== "recording") { v.ticking = false; return; }
    const s = Math.floor((Date.now() - v.t0) / 1000);
    const t = document.getElementById("recTime");
    if (t) t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const mtr = document.getElementById("recMeter");
    if (mtr && v.an) {
      v.an.getByteTimeDomainData(buf);
      let peak = 0; for (const x of buf) peak = Math.max(peak, Math.abs(x - 128));
      mtr.style.width = Math.min(100, (peak / 128) * 160) + "%";
    }
    v.raf = requestAnimationFrame(step);
  };
  step();
}

async function recSave() {
  const v = S.view, c = S.ctx;
  const n = Object.keys(v.marks).length;
  const prev = S.marks[c.p.id];
  try {
    await B.addMarks(S.user.uid, c.p.id, v.marks, { ref: c.p.ref, vol: c.vol, num: c.num, no: c.p.no });
  } catch (e) { toast("저장하지 못했어요. 인터넷 연결을 확인해 주세요."); return; }
  const before = prev && prev.sessions ? prev.lastCount ?? 0 : null;
  v.result = n === 0 ? "표시한 곳 없이 모두 맞게 선포했어요!" :
    before === null ? `${n}곳 표시했어요. 다음 녹음과 비교해 드릴게요.` :
    n < before ? `${n}곳 표시 · 지난번보다 ${before - n}곳 줄었어요.` :
    n === before ? `${n}곳 표시 · 지난번과 같아요.` : `${n}곳 표시 · 지난번보다 ${n - before}곳 늘었어요.`;
  v.saved = true;
  delete S.marks[c.p.id]; S.weak = null;
  await marksOf(c.p.id);
  render();
}

// ───────── 부록 화면 (기도문 · 개념 구호 · 하나님의 이름 · 회개 기도)
async function viewExtra(vol, kind) {
  if (!canVol(vol)) return go("#/");
  const rid = rendering;
  const b = await book(vol);
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  if (!b) return viewEmpty("#/");
  let title = "", inner = "";
  if (kind === "prayer") {
    title = "암송 기도문";
    inner = `<div class="plain-lines">${b.prayer.map((l) => `<span class="ln">${esc(l)}</span>`).join("")}</div>`;
  } else if (kind === "slogans") {
    title = "암송 선포 개념 구호";
    inner = `<div class="plain-lines">${b.slogans.map((s, i) => `<div class="slogan"><span class="n">${i + 1}</span>
      <div><b>말씀암송은</b><br>${esc(s.text).replace(/\n/g, "<br>")} <small>(${esc(s.ref)})</small></div></div>`).join("")}</div>`;
  } else if (kind === "names" && b.names) {
    title = "하나님의 이름";
    inner = `<div class="plain-lines">${b.names.lines.map((l) => `<span class="ln">${esc(l)}</span>`).join("")}</div>
      <div class="decl" style="margin-top:18px">${esc(b.names.close)}</div>`;
  } else return go("#/b/" + vol);
  $app.innerHTML = deskPage(topBar(`${esc(VOL_SHORT[vol])} · <b>${esc(title)}</b>`, "#/b/" + vol),
    tome(`<article class="sheet"><div class="crumb">함께 읽기</div><h1 class="ptitle">${esc(title)}</h1>${inner}</article>`));
}

async function viewList(vol, num, k) {
  if (!canVol(vol)) return go("#/");
  const rid = rendering;
  const st = await stage(vol, num);
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  const l = st && st.lists && st.lists[k - 1];
  if (!l) return go(`#/s/${vol}/${num}`);
  $app.innerHTML = deskPage(topBar(`${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b>`, `#/s/${vol}/${num}`),
    tome(`<article class="sheet"><div class="crumb">${esc(st.label)}</div>
    <h1 class="ptitle">${esc(l.title)}</h1><p class="hint">한 줄씩 소리 내어 고백합니다</p>
    <div>${l.items.map((x) => `<div class="rep">${esc(x)}</div>`).join("")}</div>
    ${l.after ? `<div class="pnote-box">${esc(l.after)}</div>` : ""}</article>`));
}

// ───────── 설정
function viewSettings() {
  const theme = pref("theme", "cream"), size = pref("size", "1"), mode = pref("mode", "read");
  const opt = (name, val, cur, label) => `<button class="chip" type="button" data-pref="${name}" data-val="${val}" aria-pressed="${val === cur}">${label}</button>`;
  $app.innerHTML = deskPage(topBar("<b>설정</b>", "#/"), tome(`
    <div class="page-h"><span class="kicker">설정</span><h1>나에게 맞게</h1></div>
    <div class="field"><b>바탕</b><div class="opts">${opt("theme", "cream", theme, "크림 북")}${opt("theme", "dark", theme, "어두운 초록")}${opt("theme", "auto", theme, "기기 설정 따라")}</div>
      <p>바탕은 기기마다 따로 기억해요. 폰은 크림, 패드는 어두운 초록처럼 쓸 수 있어요.</p></div>
    <div class="field"><b>본문 글자 크기</b><div class="opts">${opt("size", "0.9", size, "작게")}${opt("size", "1", size, "보통")}${opt("size", "1.15", size, "크게")}${opt("size", "1.3", size, "아주 크게")}</div></div>
    <div class="field"><b>본문을 열 때 기본 방식</b><div class="opts">${MODES.map((m) => opt("mode", m.id, mode, m.label)).join("")}</div></div>
    <div class="field"><b>계정</b><p>${esc(S.user.email)}</p><div class="opts"><button class="btn ghost small" type="button" data-act="signout">나가기</button></div></div>
    <p class="muted colo">말씀암송 선포구절 · 다니엘 아마츠 · ${VERSION}</p>`));
}

// ───────── 관리자
async function viewAdmin() {
  if (!S.admin) return go("#/");
  const rid = rendering;
  let rows = [];
  try { rows = await B.listAllow(); } catch (e) { toast("목록을 불러오지 못했어요"); }
  if (rid !== rendering) return; // 그새 다른 화면으로 갔으면 그리지 않음
  const volChecks = (prefix, vols) => `<div class="checks">${VOLS.map((v) =>
    `<label><input type="checkbox" name="${prefix}" value="${v}" ${vols.includes(v) ? "checked" : ""}>${v}권</label>`).join("")}</div>`;
  const list = rows.map((r) => `<div class="adm-row" data-email="${esc(r.email)}">
      <div class="who"><b>${esc(r.email)}</b><span>${esc(r.name || "")}${r.role === "admin" ? " · 관리자" : ""}</span></div>
      <div class="ctl">${volChecks("v_" + r.email, r.vols || [])}
        <select aria-label="역할" data-role><option value="user" ${r.role !== "admin" ? "selected" : ""}>열람</option><option value="admin" ${r.role === "admin" ? "selected" : ""}>관리자</option></select>
        <button class="btn small" type="button" data-act="allowsave">저장</button>
        <button class="btn ghost small" type="button" data-act="allowdel">삭제</button></div></div>`).join("");
  const counts = VOLS.map((v) => `${v}권 ${rows.filter((r) => (r.vols || []).includes(v)).length}명`).join(" · ");
  $app.innerHTML = deskPage(topBar("<b>열람 허용 관리</b>", "#/"), tome(`
    <div class="page-h"><span class="kicker">관리자</span><h1>열람 허용 메일</h1><div class="meta">${rows.length}명 · ${counts}</div></div>
    <form class="adm-add" id="addForm">
      <label>구글 메일 주소<input type="email" name="email" required placeholder="name@gmail.com" autocomplete="off"></label>
      <label>이름 (선택)<input type="text" name="name" placeholder="홍길동 · 3학년 학부모"></label>
      <div><span class="muted">볼 수 있는 책</span>${volChecks("v_new", ["1", "2", "3"])}</div>
      <button class="btn" type="submit">허용 추가</button>
    </form>
    <div class="sec-h">등록된 메일</div>
    ${list || '<p class="muted">아직 등록된 메일이 없어요.</p>'}
    <div class="sec-h">본문 올리기</div>
    <div class="upload">
      <p class="muted" style="margin:0">제작 키트의 <b>amsong_content.json</b> 파일을 고르면 1·2·3권 본문이 올라가요. 책을 고쳐 다시 뽑았을 때도 같은 방법으로 덮어써요.</p>
      <label class="btn ghost small" style="align-self:flex-start">파일 고르기<input type="file" accept="application/json,.json" id="contentFile" class="sr"></label>
      <span class="muted" id="upMsg"></span>
    </div>`));
  document.getElementById("addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim().toLowerCase();
    const vols = [...f.querySelectorAll('input[name="v_new"]:checked')].map((x) => x.value);
    if (!email) return;
    try { await B.setAllow(email, { vols, name: f.name.value.trim(), role: "user" }); toast("추가했어요"); viewAdmin(); }
    catch (err) { toast("추가하지 못했어요"); }
  });
  document.getElementById("contentFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const msg = document.getElementById("upMsg");
    try {
      const json = JSON.parse(await file.text());
      msg.textContent = "올리는 중…";
      const n = await B.uploadContent(json, (d, t) => { msg.textContent = `올리는 중… ${d} / ${t}`; });
      S.books = {}; S.stages = {};
      msg.textContent = `다 올렸어요 (${n}개 문서). 서재에서 확인해 보세요.`;
    } catch (err) { msg.textContent = "올리지 못했어요: " + (err.message || err); }
  });
}

// ───────── 클릭 처리
document.addEventListener("click", async (e) => {
  const nav = e.target.closest("a[data-nav]");
  if (nav && !e.metaKey && !e.ctrlKey) { e.preventDefault(); location.replace(nav.getAttribute("href")); return; }
  const t = e.target.closest("[data-act],[data-hide],[data-say],[data-pref],[data-tok],[data-line],[data-libvol],[data-tool],[data-memo]");
  if (!t) return;
  if (t.dataset.tool) { PEN.tool = t.dataset.tool; setPref("penTool", PEN.tool); S.view.memoEdit = null; refreshPenBar(); refreshVerses(); return; }
  if (t.dataset.memo) { S.view.memoEdit = Number(t.dataset.memo); refreshVerses(); return; }
  if (t.dataset.libvol) {
    const v = t.dataset.libvol;
    if (v !== LIB.vol) libTurn(() => { LIB.vol = v; LIB.side = 0; setPref("libVol", v); setPref("libSide", "0"); });
    return;
  }
  const v = S.view;
  if (t.dataset.tok) {
    const k = t.dataset.tok, cur = v.marks[k];
    const nxt = cur ? MARKS[MARKS.indexOf(cur) + 1] : MARKS[0];
    if (nxt) v.marks[k] = nxt; else delete v.marks[k];
    t.className = "tok" + (v.marks[k] ? " m-" + v.marks[k] : "");
    t.setAttribute("aria-label", t.textContent + (v.marks[k] ? " · " + MARK_LABEL[v.marks[k]] : ""));
    v.saved = false; v.result = null;
    const sb = document.querySelector('[data-act="recsave"]');
    if (sb) { sb.disabled = false; sb.textContent = `채점 저장 (${Object.keys(v.marks).length}곳)`; }
    return;
  }
  if (t.dataset.line) {
    const k = t.dataset.line;
    if (v.openAll) {
      // 모두 열린 상태에서 누른 줄만 다시 가리기
      v.openAll = false;
      v.open = new Set([...document.querySelectorAll("[data-line]")].map((x) => x.dataset.line));
    }
    v.open.has(k) ? v.open.delete(k) : v.open.add(k);
    if (!S.ctx || v.openAll) return render();
    const [vi, li] = k.split("-").map(Number);
    t.outerHTML = hideLine(S.ctx.p, weakSet(S.marks[S.ctx.p.id]), v, vi, li);
    return;
  }
  if (t.dataset.hide) { v.hide = t.dataset.hide; v.open = new Set(); v.openAll = false; return render(); }
  if (t.dataset.say) {
    const d = Number(t.dataset.say);
    v.say = d === 0 ? 0 : Math.max(0, (v.say || 0) + d);
    return render();
  }
  if (t.dataset.pref) { setPref(t.dataset.pref, t.dataset.val); applyTheme(); return render(); }
  switch (t.dataset.act) {
    case "signin":
      try { await B.signIn(); } catch (err) { toast("로그인하지 못했어요: " + (err.code || err.message)); }
      break;
    case "signout": await B.signOut(); location.hash = "#/"; break;
    case "recheck": await boot(S.user); break;
    case "theme": toggleTheme(); break;
    case "libflip": libTurn(() => { LIB.side = LIB.side ? 0 : 1; setPref("libSide", String(LIB.side)); }); break;
    case "openall": v.openAll = !v.openAll; v.open = new Set(); render(); break;
    case "pen": PEN.on = !PEN.on; v.memoEdit = null; refreshPenBar(); refreshVerses(); break;
    case "penclear": {
      const n = curNotes();
      if (!Object.keys(n.hl).length && !Object.keys(n.ul).length) { toast("지울 표시가 없어요"); break; }
      if (!confirm("이 본문의 형광펜과 밑줄을 모두 지울까요? (메모는 남아요)")) break;
      n.hl = {}; n.ul = {}; saveNotes(S.ctx.p.id); refreshVerses(); toast("표시를 모두 지웠어요");
      break;
    }
    case "memosave": case "memodel": {
      const n = curNotes(), vi = t.dataset.vi;
      const ta = document.querySelector(".memo-edit textarea");
      const text = t.dataset.act === "memosave" && ta ? ta.value.trim() : "";
      if (text) n.memo[vi] = text; else delete n.memo[vi];
      v.memoEdit = null; saveNotes(S.ctx.p.id); refreshVerses();
      break;
    }
    case "memocancel": v.memoEdit = null; refreshVerses(); break;
    case "memo": {
      const id = S.ctx.p.id, on = !memorized(id);
      S.userDoc.memorized = S.userDoc.memorized || {};
      if (on) S.userDoc.memorized[id] = true; else delete S.userDoc.memorized[id];
      render();
      B.setMemorized(S.user.uid, id, on).catch(() => toast("저장하지 못했어요"));
      if (on) toast("외운 본문으로 표시했어요");
      break;
    }
    case "recstart": recStart(); break;
    case "recstop": if (v.recorder && v.recorder.state !== "inactive") v.recorder.stop(); break;
    case "recagain":
      if (v.url) URL.revokeObjectURL(v.url);
      v.url = null; v.rec = "idle"; v.marks = {}; v.result = null; v.saved = false; render(); break;
    case "recsave": recSave(); break;
    case "allowsave": {
      const row = t.closest(".adm-row"), email = row.dataset.email;
      const vols = [...row.querySelectorAll('input[type="checkbox"]:checked')].map((x) => x.value);
      const role = row.querySelector("[data-role]").value;
      try { await B.setAllow(email, { vols, role }); toast("저장했어요"); } catch (err) { toast("저장하지 못했어요"); }
      break;
    }
    case "allowdel": {
      const email = t.closest(".adm-row").dataset.email;
      if (email === S.user.email) { toast("내 계정은 지울 수 없어요"); break; }
      if (!confirm(email + " 의 열람 허용을 지울까요?")) break;
      try { await B.deleteAllow(email); viewAdmin(); } catch (err) { toast("지우지 못했어요"); }
      break;
    }
  }
});
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t.dataset && t.dataset.line) { e.preventDefault(); t.click(); }
});

// 폰에서 옆으로 밀어 이전/다음 본문
let tx = null, ty = null;
document.addEventListener("touchstart", (e) => {
  tx = null;
  if (e.touches.length !== 1) return;
  const x = e.touches[0].clientX;
  // 화면 가장자리에서 시작한 밀기는 기기의 '뒤로 가기' 몸짓이라 건드리지 않음
  if (x < 28 || x > window.innerWidth - 28) return;
  if (e.target.closest("audio, input, select, .tok")) return;
  tx = x; ty = e.touches[0].clientY;
}, { passive: true });
document.addEventListener("touchend", (e) => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  tx = null;
  const h = location.hash.replace(/^#\/?/, "");
  if (!h && !spreadMode() && Math.abs(dx) >= 60 && Math.abs(dy) < 50) {
    if ((dx < 0 && LIB.side === 0) || (dx > 0 && LIB.side === 1)) libTurn(() => { LIB.side = LIB.side ? 0 : 1; setPref("libSide", String(LIB.side)); });
    return;
  }
  if (!S.ctx || !location.hash.startsWith("#/p/")) return;
  if (Math.abs(dx) < 80 || Math.abs(dy) > 50 || S.ctx.mode === "rec") return;
  if (PEN.on && S.ctx.mode === "read") return;
  const n = dx < 0 ? S.ctx.nb.next : S.ctx.nb.prev;
  if (n) location.replace(`#/p/${n.vol}/${n.num}/${n.no}?m=${S.ctx.mode}`);
}, { passive: true });

// 기기 방향·크기가 바뀌면 (패드 회전 등) 배치를 다시 그림
let lastWide = wide() + "" + spreadMode(), lastW = window.innerWidth, rzT = 0;
window.addEventListener("resize", () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    const w = wide() + "" + spreadMode();
    if (w !== lastWide) { lastWide = w; render(); } else fitAll();
  }, 150);
});
// 글꼴이 다 내려온 뒤 한 번만 줄 맞춤 다시
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAll());
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (pref("theme", "cream") === "auto") { applyTheme(); render(); } });

// ───────── 그리기
let rendering = 0;
async function render() {
  const my = ++rendering;
  if (!S.user) return viewLogin();
  if (!S.allow && !S.admin) return viewPending();
  const { parts, q } = parseHash();
  // 같은 화면을 다시 그릴 때는 스크롤 위치 유지, 다른 화면으로 가면 맨 위로
  const route = location.hash.split("?")[0];
  const sameRoute = S._route === route;
  const keepY = window.scrollY;
  // 펼친 책은 쪽마다 따로 넘겨 보므로 그 위치도 기억: 오른쪽은 같은 화면일 때, 왼쪽 구절표는 같은 단계 안일 때
  const stageKey = (r) => { const x = (r || "").split("/"); return (x[1] === "p" || x[1] === "s") ? x[2] + "/" + x[3] : null; };
  const oldL = document.querySelector('[data-keep="l"]'), oldR = document.querySelector('[data-keep="r"]');
  S._keepL = oldL && stageKey(route) && stageKey(route) === stageKey(S._route) ? oldL.scrollTop : null;
  const keepR = oldR && sameRoute ? oldR.scrollTop : null;
  S._route = route;
  try {
    const [r, a, b2, c] = parts;
    if (r !== "p" && S.cleanup) { S.cleanup(); S.cleanup = null; S.view = {}; }
    if (!r) await viewLibrary();
    else if (r === "b") await viewBook(a);
    else if (r === "s") await viewStage(a, Number(b2));
    else if (r === "p") await viewPassage(a, Number(b2), Number(c), q);
    else if (r === "x") await viewExtra(a, b2);
    else if (r === "l") await viewList(a, Number(b2), Number(c));
    else if (r === "settings") viewSettings();
    else if (r === "admin") await viewAdmin();
    else go("#/");
  } catch (err) {
    if (my !== rendering) return;
    console.error(err);
    notePage("#/", "불러오지 못했어요",
      err && err.code === "permission-denied" ? "이 본문을 볼 권한이 없어요." : "인터넷 연결을 확인한 뒤 다시 열어 주세요.",
      '<a class="btn" href="#/">서재로</a>');
  }
  if (my !== rendering) return;
  window.scrollTo(0, sameRoute ? keepY : 0);
  const nl = document.querySelector('[data-keep="l"]'), nr = document.querySelector('[data-keep="r"]');
  if (nl && S._keepL != null) nl.scrollTop = S._keepL;
  if (nr && keepR != null) nr.scrollTop = keepR;
}

// ───────── 시작
async function boot(user) {
  Object.keys(NOTES).forEach((k) => delete NOTES[k]);
  S.user = user; S.allow = null; S.admin = false; S.userDoc = {}; S.books = {}; S.stages = {}; S.marks = {}; S.weak = null;
  if (!user) return render();
  // 열람 허용과 내 기록을 한꺼번에 받아 시작을 빠르게
  const udoc = B.getUserDoc(user.uid).catch(() => null);
  S.allow = await B.getAllow(user.email);
  if (!S.allow || S.allow.role === "admin") S.admin = await B.isAdmin();
  if (!S.allow && S.admin) {
    // 최고 관리자: 처음 들어오면 내 허용 정보를 자동으로 만듦
    await B.setAllow(user.email, { vols: VOLS, role: "admin", name: user.name }).catch(() => {});
    S.allow = { vols: VOLS, role: "admin" };
  }
  if (S.allow) {
    let ud = await udoc;
    if (!ud) { try { ud = await B.getUserDoc(user.uid); } catch (e) {} } // 처음 허용된 직후 등
    S.userDoc = ud || {};
  }
  render();
}

applyTheme();
B.onAuth((u) => boot(u));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  // 새 버전을 올리면: 기기가 새 파일을 받자마자 한 번 새로고침해서 바로 새 화면으로
  const hadController = !!navigator.serviceWorker.controller;
  let swReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || swReloaded) return;
    swReloaded = true;
    Object.keys(noteSaveT).forEach(flushNotes);
    setTimeout(() => location.reload(), 300);
  });
}
