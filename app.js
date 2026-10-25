// 말씀암송 선포구절 — 화면과 동작
import * as B from "./backend.js";

const $app = document.getElementById("app");
const VERSION = "2.0.0";
const VOLS = ["1", "2", "3"];
const VOL_NAME = { "1": "제1권", "2": "제2권", "3": "제3권 · 성벽기도" };
const VOL_SHORT = { "1": "1권", "2": "2권", "3": "3권" };
// 올려 둔 본문에 남아 있는 '주니어' 이름을 화면에서는 'n단계 · 제n권'으로 (본문 파일을 다시 올리지 않아도 됨)
const fixName = (s) => String(s || "")
  .replace(/^(?:주니어|말씀 선포)\s*(\d+)\s*단계$/, "$1단계").replace(/^Junior\s*Step\s*(\d+)$/i, "$1단계")
  .replace(/^(?:주니어|말씀 선포)\s*(\d+)권?/, "제$1권").replace(/주니어\s*/g, "").replace(/Junior\s*/gi, "");
// 소제목 숫자 빼기 (예전에 올린 본문: "성막 · 1. 문" → "성막 · 문")
const fixGroup = (g) => g ? String(g).replace(/·\s*\d+\.\s*/, "· ") : g;
const VOL_COVER = {
  "1": "linear-gradient(180deg,#E6F0EB 0 48%,#BFD6CB 48% 62%,#86B09E 62% 76%,#4A876F 76% 88%,#1E3932 88%)",
  "2": "linear-gradient(180deg,#DCE8E3 0 44%,#B9CEC5 44% 60%,#7FA898 60% 74%,#006241 74% 88%,#16302A 88%)",
  "3": "linear-gradient(180deg,#E3EEE9 0 40%,#C3D8CE 40% 56%,#8DB4A3 56% 70%,#4F8A73 70% 84%,#1E3932 84%)"
};
const VOL_TAB = { "1": "#2F5D4E", "2": "#1F4A44", "3": "#16302A" };
// 책자 표지 그대로 (능선 다섯 겹 · 문장 · 제목 · 권 표시) — 책자 표지 파일과 같은 식으로 그림
const RIDGE = {
  "1": [[0.0209, 0.0623, 0.1848, 2.0199, 2.0221, 4.367], [0.0208, 0.0544, 0.1524, 2.0777, 1.0558, 3.9803], [0.0281, 0.0676, 0.1708, 2.1265, 2.7312, 0.9083], [0.0251, 0.0519, 0.1433, 6.1787, 2.1441, 6.166], [0.0231, 0.0704, 0.1702, 1.1257, 4.4912, 1.6302]],
  "2": [[0.0287, 0.0469, 0.1977, 1.5001, 2.9279, 5.6559], [0.0184, 0.0603, 0.1329, 6.0553, 6.2073, 1.0817], [0.0142, 0.0589, 0.1615, 4.8844, 2.1593, 3.7176], [0.0149, 0.0485, 0.1263, 3.4385, 3.5455, 3.8871], [0.0288, 0.0523, 0.1474, 2.9173, 5.9598, 1.9366]],
  "3": [[0.02, 0.0518, 0.1928, 3.0511, 0.5484, 4.7247], [0.0134, 0.0481, 0.1259, 3.9577, 5.308, 3.8505], [0.016, 0.0738, 0.1897, 2.0673, 1.7247, 4.2447], [0.0295, 0.0765, 0.1901, 4.5096, 1.4351, 3.8615], [0.0197, 0.0655, 0.159, 1.2982, 5.6566, 0.226]]
};
const RIDGE_C = { "1": "#00704A", "2": "#006241", "3": "#1E3932" };
const ridgePaths = {};
function ridgeOf(vol) {
  if (ridgePaths[vol]) return ridgePaths[vol];
  const W = 154, H = 216, cols = ["#BFD6CB", "#86B09E", "#4A876F", RIDGE_C[vol] || "#00704A", "#1E3932"];
  return (ridgePaths[vol] = (RIDGE[vol] || RIDGE["1"]).map((p, i) => {
    const base = H * (0.56 + 0.1 * i), amp = H * (0.2 - 0.035 * i), pts = [];
    for (let j = 0; j <= 60; j++) {
      const x = W * j / 60;
      const y = base - amp * (0.55 + 0.3 * Math.sin(x * p[0] + p[3]) + 0.12 * Math.sin(x * p[1] + p[4]) + 0.04 * Math.sin(x * p[2] + p[5]));
      pts.push(x.toFixed(1) + "," + y.toFixed(1));
    }
    return `<path d="M${pts.join(" L")} L${W},${H} L0,${H} Z" fill="${cols[i]}"/>`;
  }).join(""));
}
let coverSeq = 0;
// 표지 한 장 (SVG 하나라 크기를 바꿔도 모양이 그대로). 559 × 793 = 책자 앞표지 148 × 210mm 비율
function coverSvg(vol) {
  const id = "cvsky" + (++coverSeq);
  return `<svg class="cvsvg" viewBox="0 0 559 793" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F0EB"/><stop offset="1" stop-color="#F2F0EB"/></linearGradient></defs>
    <g transform="scale(3.7770 3.7762) translate(-3 -3)"><rect width="154" height="216" fill="url(#${id})"/>${ridgeOf(vol)}</g>
    <image href="icons/crest.png" x="42" y="42" width="49" height="50"/>
    <g font-family="'IBM Plex Sans KR', sans-serif" font-weight="700" fill="#1E3932" text-anchor="end">
      <text x="517" y="185" font-size="48" letter-spacing="-1.4">말씀암송</text>
      <text x="517" y="238" font-size="48" letter-spacing="-1.4">선포구절</text>
    </g>
    <rect x="447" y="259" width="70" height="25" rx="2" fill="#00704A"/>
    <text x="482" y="277" font-family="'IBM Plex Sans KR', sans-serif" font-weight="700" font-size="15" fill="#FFFFFF" text-anchor="middle">제${esc(vol)}권</text>
  </svg>`;
}
// 진도 동그라미
function ringSvg(pct) {
  const r = 18, c = 2 * Math.PI * r, d = Math.max(pct ? 1.5 : 0, c * pct / 100);
  return `<svg class="ring" viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="${r}" fill="none" class="ring-bg" stroke-width="3"/>
    ${pct ? `<circle cx="21" cy="21" r="${r}" fill="none" class="ring-on" stroke-width="3" stroke-dasharray="${d.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 21 21)" stroke-linecap="round"/>` : ""}
    <text x="21" y="25" text-anchor="middle" class="ring-t">${pct}%</text></svg>`;
}
const MODES = [
  { id: "read", label: "읽기" },
  { id: "hide", label: "가리기" },
  { id: "say", label: "선포" },
  { id: "rec", label: "녹음 채점" }
];
const MODE_TAB = { read: "#2F5D4E", hide: "#28554A", say: "#1F4A44", rec: "#16302A" };
const MARKS = ["miss", "skip", "hes"];
// 가리는 방법 (고른 방법은 기기에 기억)
const HIDES = [["first", "낱말 첫 글자"], ["verse", "절 첫 글자"], ["all", "모두 가리기"], ["weak", "자주 틀린 곳만"]];
const hideNow = () => { const h = pref("hide", "first"); return HIDES.some((x) => x[0] === h) ? h : "first"; };
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
  check: '<path d="M5 12l4 4 10-10"/>', gear: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  screen: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pen: '<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5z"/><path d="M13.5 7l3.5 3.5"/>',
  eraser: '<path d="M8 20h12"/><path d="M4.5 15.5l9-9 5 5-8.5 8.5H8.5z"/><path d="M9.5 10.5l5 5"/>',
  note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/><path d="M8.5 9h7M8.5 12.5h4"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>'
};
const icon = (n, cls = "i") => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200);
}

// 화면 모드: 책상(바탕) · 종이 · 글자 색을 함께 바꿈. 기기마다 따로 기억
const THEMES = [
  { id: "cream", label: "크림 북", desc: "밝은 책상 · 밝은 종이", desk: "#EFE8D9", paper: "#FBF8F1", ink: "#1E3932" },
  { id: "dark", label: "초록 책상", desc: "어두운 초록 바탕 · 밝은 종이", desk: "#132A24", paper: "#F4EEE2", ink: "#1E3932" },
  { id: "night", label: "밤 읽기", desc: "바탕도 종이도 어둡게 · 글자는 밝게", desk: "#0C1311", paper: "#1B2420", ink: "#E8E2D2" },
  { id: "warm", label: "따뜻한 종이", desc: "누런 종이 · 갈색 글자 · 눈이 편하게", desk: "#E3D5B8", paper: "#F3E7CE", ink: "#3E3122" },
  { id: "contrast", label: "선명하게", desc: "흰 종이 · 검은 굵은 글자", desk: "#E6E8E6", paper: "#FFFFFF", ink: "#000000" },
  { id: "auto", label: "기기 설정 따라", desc: "낮에는 크림 북, 밤(어두운 모드)에는 밤 읽기", desk: "#EFE8D9", paper: "#1B2420", ink: "#E8E2D2" },
];
// 본문 글자 크기: 책자 그대로(1)가 가장 크고 기본. 예전에 '크게'를 골랐던 기기도 책자 그대로로
const SIZES = [["1", "책자 그대로"], ["0.92", "조금 작게"], ["0.85", "작게"], ["0.78", "더 작게"], ["0.7", "아주 작게"]];
const sizeNow = () => { const v = pref("size", "1"); return SIZES.some((x) => x[0] === v) ? v : (Number(v) > 1 ? "1" : v === "0.9" ? "0.92" : "1"); };
const THEME_BAR = { cream: "#EFE8D9", dark: "#132A24", night: "#0C1311", warm: "#E3D5B8", contrast: "#E6E8E6" };
function applyTheme() {
  let t = pref("theme", "cream");
  if (t === "auto") t = matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "cream";
  if (!THEME_BAR[t]) t = "cream";
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeColor").setAttribute("content", THEME_BAR[t]);
  document.documentElement.style.setProperty("--fs-scale", sizeNow());
  document.documentElement.classList.toggle("stars", pref("stars", "on") !== "off");
}
const curTheme = () => document.documentElement.getAttribute("data-theme");
// 별빛 배경: 반짝이는 별 + 가끔 떨어지는 별똥별 (교사 선교사 로그인 하늘과 같은 방식, 더 잔잔하게)
// 한 번만 만들어 두고 화면을 바꿔도 그대로 — 움직임은 투명도·위치만 바꿔서 폰에서도 가볍게
function buildSky() {
  const sky = document.getElementById("sky");
  if (!sky || sky.childElementCount) return;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  let h = '<div class="way"></div><div class="glow"></div>';
  const n = small ? 42 : 70;
  for (let i = 0; i < n; i++) {
    const x = (Math.random() * 100).toFixed(2), y = (Math.pow(Math.random(), 1.35) * 100).toFixed(2), r = Math.random();
    const sz = r > 0.93 ? 2.6 : r > 0.75 ? 1.8 : 1.15, big = r > 0.955;
    const tw = (2.6 + Math.random() * 3.6).toFixed(2), dl = (Math.random() * 5).toFixed(2);
    const o1 = (0.1 + Math.random() * 0.22).toFixed(2), o2 = (0.65 + Math.random() * 0.35).toFixed(2);
    h += `<span class="st${big ? " big" : ""}" style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;--tw:${tw}s;--dl:${dl}s;--o1:${o1};--o2:${o2}"></span>`;
  }
  // 별똥별: 한 줄기가 2초쯤 지나가고 한동안 쉼 → 화면 어딘가에서 몇 초에 한 번씩
  [{ x: -4, y: -3, d: 11, dl: 1.2, tail: 180, dx: 600, dy: 248 }, { x: 36, y: -6, d: 13, dl: 5.5, tail: 150, dx: 520, dy: 215 },
   { x: 66, y: 2, d: 12, dl: 9.4, tail: 200, dx: 640, dy: 265 }, { x: 14, y: 30, d: 14, dl: 13.6, tail: 140, dx: 480, dy: 198 }]
    .forEach((c) => { h += `<span class="sh" style="left:${c.x}%;top:${c.y}%;--sd:${c.d}s;--sdl:${c.dl}s;--tail:${c.tail}px;--dx:${c.dx}px;--dy:${c.dy}px"></span>`; });
  sky.innerHTML = h;
}
// 폰에서 본문을 읽는 중에는 종이가 화면을 거의 다 덮으므로 별을 멈춰 둠 (넘길 때 매끄럽게)
function skyQuiet() {
  const r = location.hash.replace(/^#\/?/, "").split("/")[0];
  const quiet = (r === "p" && !wide()) || (S.ctx && S.ctx.mode === "rec" && r === "p");
  document.documentElement.classList.toggle("sky-quiet", !!quiet);
}

// 머리줄의 화면 모드 단추 → 작은 고르기 창
function closeThemePop() { const p = document.getElementById("themePop"); if (p) p.remove(); }
function openThemePop() {
  if (document.getElementById("themePop")) return closeThemePop();
  const cur = pref("theme", "cream");
  const el = document.createElement("div");
  el.id = "themePop";
  el.innerHTML = `<div class="tp-back" data-act="themeclose"></div>
    <div class="tp" role="dialog" aria-label="화면 모드 고르기">
      <div class="tp-h"><b>화면 모드</b><button class="iconbtn" type="button" data-act="themeclose" aria-label="닫기">${icon("close")}</button></div>
      ${THEMES.map((t) => `<button class="tp-opt" type="button" data-pref="theme" data-val="${t.id}" aria-pressed="${t.id === cur}">
        <span class="tp-sw" style="background:${t.desk}"><i style="background:${t.paper};color:${t.ink}">가</i></span>
        <span class="tp-tx"><b>${t.label}</b><small>${t.desc}</small></span>${t.id === cur ? icon("check", "i tp-ck") : ""}</button>`).join("")}
    </div>`;
  document.body.appendChild(el);
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
    if (st) { st.label = fixName(st.label); (st.passages || []).forEach((p) => { p.group = fixGroup(p.group); }); }
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
    const shown = S.ctx && (S.ctx.visible || [S.ctx.p.id]).includes(pid);
    if (has && shown && S.ctx.mode === "read" && S.view.memoEdit == null) { if (S.ctx.book) render(); else refreshVerses(); }
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
const findP = (pid) => (S.ctx && S.ctx.st && S.ctx.st.passages.find((x) => x.id === pid)) || null;
function notesFor(pid) {
  const n = notesNow(pid), p = findP(pid) || (S.ctx && S.ctx.p);
  if (p) n.info = { ref: p.ref, vol: S.ctx.vol, num: S.ctx.num, no: p.no };
  return n;
}
const curNotes = () => notesFor(S.ctx.p.id);
// 본문 부분만 다시 그림 (화면 전체를 다시 그리지 않아 빠름)
function refreshVerses() {
  const c = S.ctx; if (!c || c.mode !== "read") return;
  if (c.book) { render(); return; } // 펼친 책: 쪽을 다시 나눠 그림
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
  if (PEN.tool === "memo") {
    e.preventDefault();
    const box = w.closest("[data-pid]");
    S.view.memoEdit = (box ? box.dataset.pid : S.ctx.p.id) + ":" + w.dataset.w.split("-")[0];
    refreshVerses(); return;
  }
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
  // 본문마다 나눠서 (펼친 두 쪽에 걸쳐 그었을 때)
  const by = {};
  d.all.slice(lo, hi + 1).forEach((x) => {
    const box = x.closest("[data-pid]"), pid = box ? box.dataset.pid : S.ctx.p.id;
    (by[pid] = by[pid] || []).push(x.dataset.w);
  });
  const [kind, col] = PEN.tool.split(":");
  const all = Object.entries(by).flatMap(([pid, ks]) => ks.map((k) => [notesFor(pid), k]));
  if (kind === "erase") all.forEach(([n, k]) => { delete n.hl[k]; delete n.ul[k]; });
  else {
    // 이미 모두 같은 색이면 지우고, 아니면 칠함
    const mapOf = (n) => (kind === "hl" ? n.hl : n.ul);
    if (all.every(([n, k]) => mapOf(n)[k] === col)) all.forEach(([n, k]) => delete mapOf(n)[k]);
    else all.forEach(([n, k]) => { mapOf(n)[k] = col; });
  }
  Object.keys(by).forEach(saveNotes);
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
window.addEventListener("hashchange", () => { S.drawer = false; render(); });

// ───────── 머리줄 (책상 위)
const themeBtn = () => `<button class="iconbtn" type="button" data-act="theme" aria-label="화면 모드 (밝게 · 어둡게 · 밤 읽기)">${icon("screen")}</button>`;
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
// 서재 · 단계 · 본문 세 화면 모두 같은 크기 · 같은 자리 (색인 줄 자리는 색인이 없어도 비워 둠)
const openBook = (top, left, right, tabs = "", folioL = "", folioR = "", cls = "") => `<div class="desk ob-desk${cls ? " " + cls : ""}">${top}
  <div class="ob-wrap"><div class="ob-tabs">${tabs}</div>
    <div class="ob"><div class="ob-stack" aria-hidden="true"></div><div class="ob-pages">
      <aside class="ob-l paperink" aria-label="단계 구절표"><div class="ob-scroll" data-keep="l">${left}</div><div class="folio">${folioL}</div></aside>
      <div class="ob-gutter" aria-hidden="true"></div>
      <section class="ob-r paperink"><div class="ob-scroll" data-keep="r">${right}</div><div class="folio">${folioR}</div></section>
    </div></div>
  </div></div>`;

// ───────── 화면: 로그인 · 대기
function viewLogin() {
  $app.innerHTML = `<main class="gate cover-gate">
    <div class="fan" role="img" aria-label="말씀암송 선포구절 제1권 · 제2권 · 제3권 책자 표지">
      <span class="fan-b fan-1">${coverSvg("1")}</span>
      <span class="fan-b fan-3">${coverSvg("3")}</span>
      <span class="fan-b fan-2">${coverSvg("2")}</span>
    </div>
    <div class="gate-t">
      <small>다니엘 아마츠</small>
      <h1>말씀암송 선포구절</h1>
      <p>제1권 · 제2권 · 제3권 성벽기도</p>
    </div>
    <div class="actions">
      <button class="btn google" type="button" data-act="signin">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.7l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
        구글 계정으로 들어가기
      </button>
      <span class="gate-note">구글 계정으로 들어온 뒤 이름을 적어 열람 요청을 보내 주세요</span>
      <a class="gate-link" href="#/install">홈 화면에 앱으로 설치하는 법 ›</a>
    </div>
  </main>`;
}

// ───────── 이 기기 알아보기 (설치 안내 · 알림)
function envInfo() {
  const ua = navigator.userAgent || "";
  const ipad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
  const ios = ipad || /iPhone|iPod/.test(ua), android = /Android/i.test(ua);
  let app = false; try { app = !!(matchMedia("(display-mode: standalone)").matches || navigator.standalone); } catch (e) {}
  const inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|; wv\)/i.test(ua);
  const vm = /OS (\d+)[_.](\d+)/.exec(ua), iosVer = ios && vm ? Number(vm[1]) + Number(vm[2]) / 100 : 0;
  const browser = /KAKAOTALK/i.test(ua) ? "카카오톡 안 브라우저" : /NAVER\(inapp/i.test(ua) ? "네이버 앱 안 브라우저" : inApp ? "앱 안 브라우저"
    : /SamsungBrowser/i.test(ua) ? "삼성 인터넷" : /Whale/i.test(ua) ? "웨일" : /Edg\//.test(ua) ? "엣지" : /CriOS|Chrome/i.test(ua) ? "크롬" : /FxiOS|Firefox/i.test(ua) ? "파이어폭스" : /Safari/i.test(ua) ? "사파리" : "브라우저";
  const kind = ios ? (ipad ? "ipad" : "iphone") : android ? "android" : "pc";
  const name = kind === "iphone" ? "아이폰" : kind === "ipad" ? "아이패드" : kind === "android" ? "안드로이드" : /Mac/.test(ua) ? "맥" : /Win/.test(ua) ? "윈도우" : "컴퓨터";
  const pushable = typeof window.Notification === "function" && "serviceWorker" in navigator && "PushManager" in window;
  return { ios, ipad, android, app, inApp, iosVer, browser, kind, name, pushable, label: name + " · " + (app ? "홈 화면 앱" : browser) };
}
// 안드로이드 · 컴퓨터 크롬: 브라우저가 주는 '앱 설치' 창을 기억해 두었다가 단추로 띄움
let BIP = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); BIP = e; document.querySelectorAll("[data-act='install']").forEach((b) => { b.hidden = false; }); });
window.addEventListener("appinstalled", () => { BIP = null; setPref("installed", "1"); });

// ───────── 화면: 홈 화면에 설치하는 법 (로그인 전에도 볼 수 있음)
function viewInstall() {
  const E = envInfo(), url = location.origin + location.pathname.replace(/index\.html$/, "");
  const tab = S.instTab || (E.ios ? "ios" : E.android ? "android" : "pc");
  const step = (n, t, d = "") => `<li><span class="no">${n}</span><span><b>${t}</b>${d ? `<small>${d}</small>` : ""}</span></li>`;
  const panes = {
    ios: `<ol class="steps">${step(1, "<b>사파리</b>로 앱 주소를 엽니다", "카톡에서 열렸다면 오른쪽 아래 ··· → '다른 브라우저로 열기' (또는 주소 복사 → 사파리에 붙여 넣기)")}
      ${step(2, "아래쪽(아이패드는 위쪽) <b>공유 단추</b>를 누릅니다", "네모 위로 화살표가 나온 모양 ⬆︎")}
      ${step(3, "목록을 내려 <b>'홈 화면에 추가'</b>를 누릅니다", "안 보이면 맨 아래 '동작 편집'에서 추가할 수 있어요")}
      ${step(4, "오른쪽 위 <b>'추가'</b>를 누르면 끝", "홈 화면에 금빛 '말' 아이콘 <b>말씀선포</b>가 생겨요")}</ol>
      <p class="tip">아이폰 · 아이패드는 <b>홈 화면에 추가한 앱</b>에서만 아침 알림을 받을 수 있어요. (iOS 16.4 이상)</p>`,
    android: `<ol class="steps">${step(1, "<b>크롬</b>(또는 삼성 인터넷)으로 앱 주소를 엽니다", "카톡에서 열렸다면 오른쪽 위 ⋮ → '다른 브라우저로 열기'")}
      ${step(2, "아래 <b>[앱 설치]</b> 단추를 누르거나, 오른쪽 위 <b>⋮ 메뉴</b>를 누릅니다", "삼성 인터넷은 아래쪽 ≡ 메뉴")}
      ${step(3, "<b>'앱 설치'</b> 또는 <b>'홈 화면에 추가'</b>를 누릅니다", "삼성 인터넷: '현재 페이지 추가' → '홈 화면'")}
      ${step(4, "<b>'설치'</b>를 누르면 끝", "홈 화면(앱 목록)에 <b>말씀선포</b>가 생겨요")}</ol>`,
    pc: `<ol class="steps">${step(1, "<b>크롬</b>이나 <b>엣지</b>로 앱 주소를 엽니다")}
      ${step(2, "아래 <b>[앱 설치]</b> 단추를 누르거나, 주소창 오른쪽 끝의 <b>설치 아이콘</b>(화면에 화살표)을 누릅니다", "맥 사파리는 메뉴 '파일 → Dock에 추가'")}
      ${step(3, "<b>'설치'</b>를 누르면 끝", "바탕화면 · Dock · 시작 메뉴에서 앱처럼 열려요")}</ol>`
  };
  const body = `<div class="page-h"><span class="kicker">설치 안내</span><h1>홈 화면에 앱으로 담기</h1>
      <div class="meta">앱스토어 없이 1분이면 끝 · 용량 부담 없이 늘 새 버전으로 열려요</div></div>
    ${E.app ? `<div class="ok-box"><b>이미 앱으로 열려 있어요</b> 이 기기에는 설치가 끝났어요.</div>` : ""}
    ${E.inApp ? `<div class="ok-box warn"><b>지금은 ${esc(E.browser)}예요</b> 이 안에서는 설치가 안 돼요. ${E.ios ? "오른쪽 아래 ··· → '다른 브라우저로 열기'(사파리)" : "오른쪽 위 ⋮ → '다른 브라우저로 열기'(크롬)"}로 연 다음 따라 해 주세요.</div>` : ""}
    <div class="inst-url"><span>${esc(url)}</span><button class="btn ghost small" type="button" data-act="copyurl">주소 복사</button></div>
    <button class="btn inst-btn" type="button" data-act="install" ${BIP ? "" : "hidden"}>${icon("next")} 이 기기에 앱 설치</button>
    <div class="adm-tabs inst-tabs" role="tablist">${[["ios", "아이폰 · 아이패드"], ["android", "안드로이드"], ["pc", "컴퓨터"]].map(([k, l]) =>
      `<button class="adm-tab" type="button" role="tab" data-act="insttab" data-v="${k}" aria-selected="${tab === k}">${l}${(k === "ios" && E.ios) || (k === "android" && E.android) || (k === "pc" && !E.ios && !E.android) ? " <small>· 이 기기</small>" : ""}</button>`).join("")}</div>
    ${panes[tab]}
    <div class="faq"><b>설치하면 무엇이 좋아요?</b><p>주소를 칠 필요 없이 아이콘으로 바로 열리고, 화면이 앱처럼 꽉 차고, 아침 알림을 받을 수 있어요. 외운 기록은 계정에 남아서 지웠다가 다시 설치해도 그대로예요.</p>
      <b>아이콘이 예전 모양이에요</b><p>홈 화면의 앱을 길게 눌러 지운 다음 위 순서대로 다시 추가하면 새 아이콘으로 바뀌어요.</p></div>`;
  const back = S.user ? "#/settings" : "#/";
  $app.innerHTML = deskPage(topBar("<b>설치 안내</b>", back), tome(body));
}

// ───────── 화면: 승인 대기 — 열람 요청 보내기
async function viewPending() {
  const rid = rendering;
  if (S.myReq === undefined) S.myReq = await B.getMyRequest(S.user.email);
  if (rid !== rendering) return;
  const R = S.myReq, editing = S.reqEdit || !R;
  $app.innerHTML = `<main class="gate">${tome(`
    <span class="kicker">${R && !editing ? "요청 보냄" : "열람 요청"}</span>
    <h1>${R && !editing ? "열람 요청을<br>보냈어요" : "아직 열람 허용이<br>되지 않았어요"}</h1>
    ${R && !editing ? `<p>관리자가 허용하면 바로 볼 수 있어요. 허용된 뒤 [다시 확인]을 눌러 주세요.</p>
      <div class="mail"><b>${esc(R.name || "")}</b> · ${esc(S.user.email)}${R.note ? `<br><small>${esc(R.note)}</small>` : ""}<br><small>${ago(R.at)} 보냄</small></div>
      <div class="actions"><button class="btn" type="button" data-act="recheck">다시 확인</button>
        <button class="btn ghost" type="button" data-act="reqedit">요청 고치기</button>
        <button class="btn ghost" type="button" data-act="signout">다른 계정으로 들어가기</button></div>`
    : `<p>이름을 적어 열람 요청을 보내면, 관리자가 확인하고 허용해 드려요.</p>
      <form class="req-form" id="reqForm">
        <label>이름<input type="text" name="name" required maxlength="60" value="${esc((R && R.name) || S.user.name || "")}" placeholder="홍길동"></label>
        <label>한 줄 소개 (선택)<input type="text" name="note" maxlength="200" value="${esc((R && R.note) || "")}" placeholder="예: 3학년 김하늘 엄마 · 찬양팀"></label>
        <div class="mail">${esc(S.user.email)}</div>
        <div class="actions"><button class="btn" type="submit">열람 요청 보내기</button>
          ${R ? '<button class="btn ghost" type="button" data-act="reqcancel">그대로 두기</button>' : ""}
          <button class="btn ghost" type="button" data-act="signout">다른 계정으로 들어가기</button></div>
      </form>`}
    <a class="gate-link" href="#/install">홈 화면에 앱으로 설치하는 법 ›</a>`)}
  </main>`;
  const f = document.getElementById("reqForm");
  if (f) f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = f.name.value.trim(); if (!name) return;
    try { await B.requestAccess(S.user, name, f.note.value); S.myReq = { name, note: f.note.value.trim(), at: Date.now() }; S.reqEdit = false; toast("열람 요청을 보냈어요"); render(); }
    catch (err) { toast("보내지 못했어요. 잠시 뒤 다시 해 주세요"); }
  });
}

// ───────── 아침 알림 받기 (이 기기)
const tokKey = (t) => { let h = 2166136261; t = String(t || ""); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return "d" + (h >>> 0).toString(36) + t.length.toString(36); };
const pushOnHere = () => { try { return pref("pushOn", "") === "1" && Notification.permission === "granted" && !!(S.myPush && S.myPush.devices && S.myPush.devices[pref("pushKey", "")]); } catch (e) { return false; } };
async function pushLoad() {
  if (S.pushCfg === undefined) S.pushCfg = await B.getConfig("push");
  if (S.myPush === undefined) S.myPush = await B.getMyPush(S.user.uid);
}
const alarmTxt = (cfg) => ((cfg && cfg.alarms) || []).filter((a) => a.on !== false).map((a) => {
  const d = a.days || [], days = d.length === 7 ? "매일" : d.join() === "1,2,3,4,5" ? "월~금" : d.map((k) => DAYS[k]).join("·");
  return `${days} ${a.time}`; }).join(" · ");
async function pushEnable() {
  const E = envInfo(), cfg = S.pushCfg;
  if (E.inApp) return toast(`${E.browser}에서는 알림을 받을 수 없어요. 사파리나 크롬으로 열어 주세요`);
  if (E.ios && !E.app) { toast("아이폰은 홈 화면에 추가한 앱에서 켤 수 있어요"); return go("#/install"); }
  if (!E.pushable) return toast("이 브라우저는 알림을 받을 수 없어요");
  if (!cfg || !cfg.vapidKey) return toast("관리자가 아직 알림을 준비하지 않았어요");
  const btn = document.querySelector('[data-act="pushon"]'); if (btn) { btn.disabled = true; btn.textContent = "켜는 중…"; }
  try {
    const perm = await Notification.requestPermission();      // 누른 그때 바로 물어야 아이폰에서도 창이 떠요
    if (perm !== "granted") { toast(perm === "denied" ? "알림이 막혀 있어요. 기기 설정에서 이 앱의 알림을 허용해 주세요" : "알림 허용을 눌러 주세요"); return viewSettings(); }
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    const token = await B.pushGetToken(cfg.vapidKey, reg);
    if (!token) throw new Error("no-token");
    const key = tokKey(token);
    await B.savePushDevice(S.user, key, { t: token, label: E.label, kind: E.kind });
    setPref("pushOn", "1"); setPref("pushKey", key);
    S.myPush = S.myPush || { devices: {} }; S.myPush.devices = { ...(S.myPush.devices || {}), [key]: { t: token, label: E.label, kind: E.kind, at: Date.now() } };
    toast("이 기기에서 아침 알림을 받아요");
  } catch (e) {
    console.error(e);
    toast("알림을 켜지 못했어요" + (e && e.code ? " (" + e.code + ")" : ""));
  }
  viewSettings();
}
async function pushDisable(key) {
  const mine = !key || key === pref("pushKey", "");
  key = key || pref("pushKey", "");
  try {
    if (key) await B.removePushDevice(S.user, key);
    if (mine) { await B.pushDeleteToken(); setPref("pushOn", ""); }
    if (S.myPush && S.myPush.devices) delete S.myPush.devices[key];
    toast(mine ? "이 기기 알림을 껐어요" : "그 기기를 뺐어요");
  } catch (e) { toast("끄지 못했어요"); }
  viewSettings();
}

// ───────── 접속 기록 (관리자 통계용) — 같은 기기에서 20분 안에 다시 열면 한 번으로
function logVisitOnce() {
  try {
    const k = "lastLog." + S.user.uid, last = Number(pref(k, "0"));
    if (Date.now() - last < 20 * 60000) return;
    setPref(k, String(Date.now()));
    const E = envInfo();
    B.logVisit(S.user, { kind: E.kind, app: E.app, mem: Object.keys(S.userDoc.memorized || {}).length }).catch(() => {});
  } catch (e) {}
}
const VIEWED = new Set();
function logViewOnce(p) {
  if (!p || VIEWED.has(p.id)) return;
  VIEWED.add(p.id);
  B.logView(S.user, String(p.ref || "").replace(/Ⓐ/g, ""), Object.keys(S.userDoc.memorized || {}).length).catch(() => {});
}

// 책장 위 작은 안내 띠: 설치 → (설치했으면) 알림 켜기 — 닫으면 다시 안 보임
function shelfNudge() {
  const E = envInfo();
  if (!E.app && !E.inApp && pref("nudgeInstall", "") !== "x") return `<div class="nudge"><span><b>홈 화면에 설치</b>하면 앱처럼 바로 열리고 아침 알림도 받을 수 있어요</span><a class="btn small" href="#/install">설치 안내</a><button class="iconbtn" type="button" data-act="nudgex" data-v="nudgeInstall" aria-label="닫기">${icon("close")}</button></div>`;
  if ((E.app || !E.ios) && E.pushable && S.pushCfg && S.pushCfg.vapidKey && alarmTxt(S.pushCfg) && !pushOnHere() && pref("nudgePush", "") !== "x")
    return `<div class="nudge"><span><b>아침 알림</b> ${esc(alarmTxt(S.pushCfg))} — 이 기기로 받아 볼까요?</span><a class="btn small" href="#/settings">켜기</a><button class="iconbtn" type="button" data-act="nudgex" data-v="nudgePush" aria-label="닫기">${icon("close")}</button></div>`;
  return "";
}

// 안내 한 장 (본문 없음 · 오류)
function notePage(back, title, msg, action = "") {
  $app.innerHTML = deskPage(topBar("", back), tome(`<div class="note-page">
    <h1 class="ptitle">${title}</h1><p class="muted">${msg}</p>${action ? `<div class="tools">${action}</div>` : ""}</div>`));
}

// ───────── 화면: 서재
// ───────── 화면: 서재 — 펼친 책 (패드·컴퓨터: 두 쪽 펼침 / 폰: 한 쪽씩 넘기기)
// 가로로 넓은 화면(패드 가로·컴퓨터·폰 가로)만 두 쪽 펼침, 세로 화면은 한 쪽씩
const spreadMode = () => wide();
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
  const decl = p.after.filter((a) => a.kind === "decl").map((a) => `<div class="pg-decl ns">${a.lines.map(esc).join("<br>")}</div>`).join("");
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

// 서재 머리줄 (책장 · 책 한 권 화면 같이 씀)
const libTop = (back) => `<header class="top lib-top">
      ${back ? `<a class="iconbtn lib-back" href="#/" aria-label="서재로">${icon("back")}</a>` : ""}
      <span class="lib-brand"><small>다니엘 아마츠</small><b>말씀암송 선포구절</b></span>
      <span style="display:flex;margin-left:auto">${S.admin ? `<a class="iconbtn" href="#/admin" aria-label="열람 허용 관리">${icon("users")}</a>` : ""}
      <a class="iconbtn" href="#/settings" aria-label="설정">${icon("gear")}</a>
      ${themeBtn()}</span>
    </header>`;
async function myVols() {
  const vols = [];
  for (const v of VOLS) if (canVol(v)) { try { if (await book(v)) vols.push(v); } catch (e) {} }
  return vols;
}
function loadWeak() {
  if (S.weak !== null) return;
  S.weak = [];
  B.weakList(S.user.uid, 8).then((w) => { S.weak = w; if (w.length && /^#\/b\//.test(location.hash)) render(); }).catch(() => {});
}
function viewNoBooks(top) {
  $app.innerHTML = `<div class="lib">${top}<div class="book1"><div class="paper paperink"><div class="page-in">
      <div class="pg-kick"><b>내 책</b></div><p class="pg-muted">${S.admin ? "본문이 아직 없어요. 관리 화면에서 본문 파일을 올려 주세요." : "볼 수 있는 책이 아직 없어요. 관리자에게 문의해 주세요."}</p>
      ${S.admin ? `<a class="pg-go" href="#/admin">관리 화면으로 ${icon("next")}</a>` : ""}</div></div></div></div>`;
}

// ───────── 화면: 서재 (책장) — 책자 표지 그대로 세 권 · 진도 동그라미 · 이어서 외우기
async function viewLibrary() {
  const rid = rendering;
  const vols = await myVols();
  if (rid !== rendering) return;
  const top = libTop(false);
  if (!vols.length) return viewNoBooks(top);
  // 이어서 외우기: 마지막으로 본 본문 → 없으면 첫 책의 아직 안 외운 첫 본문
  const lastV = S.userDoc.last && vols.includes(S.userDoc.last.vol) ? S.userDoc.last.vol : (vols.includes(pref("libVol", "")) ? pref("libVol", "") : vols[0]);
  const D = await libData(lastV).catch(() => null);
  if (rid !== rendering) return;
  const books = vols.map((v) => {
    const b = S.books[v], n = memCount(v), pct = b && b.total ? Math.round((n / b.total) * 100) : 0;
    return `<a class="shelf-b" href="#/b/${v}" aria-label="${esc(VOL_NAME[v])} 펼치기 · 외운 본문 ${n} / ${b ? b.total : 0}">
      <span class="bk3"><span class="bk3-in">
        <span class="bk3-face">${coverSvg(v)}</span>
        <span class="bk3-spine"><span>말씀암송 선포구절 · 제${v}권</span></span>
        <span class="bk3-pages"></span>
        <span class="bk3-back"></span>
      </span></span>
      <span class="shelf-info">${ringSvg(pct)}<span class="shelf-tx"><b>제${v}권</b><small>${v === "3" ? "성벽기도 · " : ""}${b && b.range ? esc(b.range) : ""}</small><small>외운 본문 ${n} / ${b ? b.total : 0}</small></span></span>
      <span class="shelf-go" aria-hidden="true">${icon("next")}</span>
    </a>`;
  }).join("");
  const c = D && D.cont;
  const cont = c ? `<a class="shelf-cont" href="#/p/${lastV}/${c.st.num}/${c.p.no}">
      <span class="sc-tx"><small>이어서 외우기</small><b>${refHtml(c.p.ref)}</b><span>${esc(VOL_NAME[lastV])} · ${esc(c.st.label)}${c.p.topic ? " · " + esc(c.p.topic) : ""}</span></span>
      <span class="sc-go">펼치기 ${icon("next")}</span></a>` : "";
  $app.innerHTML = `<div class="lib shelf">${top}
    <main class="shelf-main">
      <h1 class="shelf-h">어떤 말씀을 외울까요?</h1>
      ${shelfNudge()}
      <div class="shelf-row n${vols.length}">${books}</div>
      <p class="shelf-hint">책을 누르면 단계와 진도가 펼쳐져요</p>
      ${cont}
    </main></div>`;
}

// ───────── 화면: 책 한 권 — 펼친 책 (패드·컴퓨터: 두 쪽 펼침 / 폰: 한 쪽씩 넘기기)
async function viewBookPage(vol, fresh) {
  const rid = rendering;
  const vols = await myVols();
  if (rid !== rendering) return;
  loadWeak();
  const top = libTop(true);
  if (!vols.length) return viewNoBooks(top);
  if (!vols.includes(vol)) return go("#/");
  LIB.vol = vol; setPref("libVol", vol);
  // 책장에서 새로 펼치면 단계 · 진도 쪽부터
  if (fresh) { LIB.side = 1; setPref("libSide", "1"); }
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
    // 본문 화면과 같은 펼친 책 — 책 고르기 색인은 왼쪽 쪽 위에
    const nav = `<nav class="tabs-top mode-tabs book-tabs" role="tablist" aria-label="책 고르기">${tabs}</nav>`;
    const left = D ? `<div class="ob-back ob-runhead">${esc(VOL_NAME[vol])} · 단계와 진도</div>${libStagesPage(vol, D)}` : "";
    const right = D ? `<div class="page-in lib-cont">${libContPage(vol, D)}</div>` : "";
    $app.innerHTML = openBook(top, `<div class="page-in">${left}</div>`, right, nav, esc(VOL_NAME[vol]), "이어서 외우기", "lib-ob");
  } else {
    const side = LIB.side;
    $app.innerHTML = `<div class="lib">${top}
      <div class="tabs-top" role="tablist" aria-label="책 고르기">${tabs}</div>
      <div class="book1"><div class="paper paperink" id="libPages">
        <div class="page-in">
          <div class="pg-body">${D ? (side === 0 ? libContPage(vol, D) : libStagesPage(vol, D)) : ""}</div>
          <div class="pg-actions">
            <button class="pg-flip" type="button" data-act="libflip">${side === 0 ? "단계 · 진도 ↗" : "↖ 지금 외우는 본문"}</button>
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
// 책장에서 책을 누르면: 그 책의 '단계 · 진도' 쪽 (폰은 옆으로 넘기면 '지금 외우는 본문' 쪽)
async function viewBook(vol, fresh) {
  if (!canVol(vol)) return go("#/");
  return viewBookPage(vol, fresh);
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
    if (p.sub) out += `<span class="s-head">[${esc(p.sub)}]</span>`;
    const on = memorized(p.id), cur = p.no === curNo;
    out += `<a class="srow" href="#/p/${vol}/${st.num}/${p.no}" ${cur ? 'aria-current="true"' : ""}>
      <span class="no">${p.no}</span><span class="ref">${refHtml(p.ref)}${p.note ? `<small>${esc(p.note)}</small>` : ""}</span>
      <span class="nv">${p.verses.length}절</span>
      <span class="ck${on ? " on" : ""}" aria-label="${on ? "외움" : "아직"}">${on ? icon("check") : ""}</span></a>`;
  }
  (st.lists || []).forEach((l, k) => {
    out += `<span class="t-head">${esc(l.title)}</span><a class="srow" href="#/l/${vol}/${st.num}/${k + 1}">
      <span class="no"></span><span class="ref">회개 기도</span><span class="nv"></span><span></span></a>`;
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

const subLead = (p) => (p.sub ? `<div class="sub-band">[${esc(p.sub)}]</div>` : "")
  + (p.lead || []).map((a) => `<div class="pnote-box ns lead">${a.lines.map(esc).join("<br>")}</div>`).join("");
const glossHtml = (v) => (v.gloss || []).map((g) => `<span class="gloss ns">${esc(g)}</span>`).join("");
function headHtml(st, p) {
  return `<div class="crumb">${crumbOf(st, p)}</div>
    ${p.topic ? `<span class="band">${esc(p.topic)}</span>` : ""}${subLead(p)}
    <h1 class="ptitle">${refHtml(p.ref)}${p.note ? `<span class="pnote">${esc(p.note)}</span>` : ""}</h1>`;
}

function afterHtml(p) {
  return p.after.map((a) => a.kind === "decl"
    ? `<div class="decl ns">${a.lines.map(esc).join("<br>")}</div>`
    : `<div class="pnote-box ns">${a.lines.map(esc).join("<br>")}</div>`).join("");
}

function versesRead(p, weak, nt) {
  return versesBox(p, weak, nt) + `<div class="closing">— ${refHtml(p.ref)}</div>`;
}

// 낱말마다 형광펜(h-색) · 밑줄(u-색)을 붙이고, 이웃 낱말과 같은 색이면 사이 띄어쓰기도 이어 칠함
function versesBox(p, weak, nt) {
  return `<div class="verses${PEN.on ? " pen" : ""}" data-fit data-read data-pid="${p.id}">${p.verses.map((v, vi) => `<div class="verse"><span class="vn">${v.n ?? ""}</span><div class="lines">
    ${v.lines.map((l, li) => readLine(p, vi, li, weak, nt)).join("")}${glossHtml(v)}${memoHtml(p, vi, nt)}</div></div>`).join("")}</div>`;
}

// 읽기 한 줄: 낱말마다 형광펜(h-색) · 밑줄(u-색), 이웃 낱말과 같은 색이면 사이 띄어쓰기도 이어 칠함
function readLine(p, vi, li, weak, nt) {
  const hl = nt.hl || {}, ul = nt.ul || {};
  const ws = words(p.verses[vi].lines[li]);
  return `<span class="ln" data-u="${vi}-${li}">${ws.map((w, wi) => {
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
}

// 절 아래 메모 (적어 둔 메모 · 고치는 칸)
function memoHtml(p, vi, nt) {
  const memo = nt.memo || {}, k = p.id + ":" + vi, n = p.verses[vi].n;
  if (S.view.memoEdit === k) return `<div class="memo-edit"><textarea maxlength="1000" rows="3" placeholder="이 절에 메모를 적어요" aria-label="${esc(String(n ?? ""))}절 메모">${esc(memo[vi] || "")}</textarea>
      <div class="me-btns"><button class="btn small" type="button" data-act="memosave" data-k="${k}">저장</button>
      ${memo[vi] ? `<button class="btn ghost small" type="button" data-act="memodel" data-k="${k}">메모 지우기</button>` : ""}
      <button class="btn ghost small" type="button" data-act="memocancel">닫기</button></div></div>`;
  return memo[vi] ? `<button type="button" class="memo-note" data-memo="${k}" aria-label="메모 고치기">${icon("note")}<span>${esc(memo[vi])}</span></button>` : "";
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
function hideLine(p, weak, v, vi, li, pfx = "") {
  const how = v.hide || "first", l = p.verses[vi].lines[li];
  const key = `${pfx}${vi}-${li}`;
  if (v.open.has(key) || v.openAll) return `<span class="ln masked" data-u="${vi}-${li}" data-line="${key}" role="button" tabindex="0" aria-label="이 줄 다시 가리기">${esc(l)}</span>`;
  const ws = words(l).map((w, wi) => {
    const k = `${vi}-${li}-${wi}`;
    // 절 첫 글자: 그 절의 맨 첫 글자 하나만 보이고 나머지는 모두 가림
    if (how === "verse") return li === 0 && wi === 0 ? esc(w[0]) + (w.length > 1 ? maskWord(w.slice(1), "all") : "") : maskWord(w, "all");
    if (how === "weak") return weak.has(k) ? maskWord(w, "first") : esc(w);
    return maskWord(w, how);
  }).join(" ");
  return `<span class="ln masked" data-u="${vi}-${li}" data-line="${key}" role="button" tabindex="0" aria-label="이 줄 열기">${ws}</span>`;
}

function versesHide(p, weak, v) {
  return `<div class="verses" data-fit>${p.verses.map((vs, vi) => `<div class="verse"><span class="vn">${vs.n ?? ""}</span><div class="lines">
    ${vs.lines.map((l, li) => hideLine(p, weak, v, vi, li)).join("")}${glossHtml(vs)}</div></div>`).join("")}</div>`;
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
    S.view = { key, open: new Set(), openAll: false, hide: hideNow(), say: 0, rec: "idle", marks: {}, result: null };
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
    body = `${hideChips(v)}${versesHide(p, weak, v)}
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
  // 넓은 화면 · 읽기와 가리기: 책처럼 두 쪽에 나눠 넘겨 보기
  if (isWide && (mode === "read" || mode === "hide")) { viewBookSpread({ vol, num, b, st, p, mode, v, nb, modes }); return; }
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
    // 넓은 화면 · 선포와 녹음 채점: 왼쪽 쪽에 제목과 조작, 오른쪽 쪽에 본문
    let left, right;
    if (mode === "say") {
      const r = versesSay(p, v);
      left = `${bkHead(st, p)}<p class="hint">한 줄(한 호흡)씩 소리 내어 선포해요. 오른쪽 쪽에 지금 줄이 크게 보여요.</p>
        <div class="breath-ctrl"><button class="btn ghost" type="button" data-say="-1" ${r.cur <= 0 ? "disabled" : ""}>이전 줄</button>
        <button class="btn" type="button" data-say="1" ${r.cur >= r.total - 1 ? "disabled" : ""}>다음 줄</button></div>
        <div class="tools"><button class="chip" type="button" data-say="0">처음부터</button><span class="hint" style="margin:0;align-self:center">${r.cur + 1} / ${r.total} 호흡</span></div>${side}${statLine}`;
      right = r.html;
    } else {
      const r = recParts(p, v, m);
      left = `${bkHead(st, p)}${r.panel}${r.foot}${statLine}`;
      right = r.verses;
    }
    const lk = (n, dir) => n ? `<a class="flip" data-nav="replace" href="#/p/${n.vol}/${n.num}/${n.no}?m=${mode}">${dir < 0 ? icon("back") : ""}<span>${refHtml(n.ref)}</span>${dir > 0 ? icon("next") : ""}</a>` : "";
    $app.innerHTML = openBook(bkTop(vol, st), `<div class="sheet">${left}</div>`, `<div class="sheet">${right}</div>`, `<div class="bk-tools"></div>${modes}`,
      lk(nb.prev, -1), lk(nb.next, 1), "duo-mode") + drawerHtml(vol, st, p.no);
  } else {
    $app.innerHTML = deskPage(top, tome(sheet + pager, modes));
    if (pref("swipeHint", "") !== "1" && mode !== "rec") { setPref("swipeHint", "1"); setTimeout(() => toast("옆으로 밀면 앞 · 뒤 본문으로 넘어가요"), 600); }
  }
  S.ctx = { vol, num, p, st, mode, nb, weak };
  logViewOnce(p);
  fitAll();
  if (mode === "rec") wireRec();
}

// ═════════ 펼친 책으로 읽기 (패드 가로 · 컴퓨터 · 읽기와 가리기) ═════════
// 단계 하나를 책처럼 쪽으로 나눠 왼쪽 · 오른쪽 두 쪽씩 넘겨 봐요. 책자와 같은 규칙:
//  - 1 · 2권: 본문마다 새 쪽에서 시작 / 3권: 짧은 본문은 한 쪽에 두 개까지
//  - 두 쪽 이상인 본문은 왼쪽 쪽에서 시작해 펼친 두 쪽에 한눈에 (앞 오른쪽 쪽은 비워 둠)
const NOTE0 = { hl: {}, ul: {}, memo: {} };
function bkHead(st, p) {
  const on = memorized(p.id);
  return `<div class="bk-head"><div class="crumb">${crumbOf(st, p)}</div>
    ${p.topic ? `<span class="band">${esc(p.topic)}</span>` : ""}${subLead(p)}
    <div class="bk-titlerow"><h2 class="ptitle">${refHtml(p.ref)}${p.note ? `<span class="pnote">${esc(p.note)}</span>` : ""}</h2>
    <button class="bk-memo" type="button" data-act="memo" data-pid="${p.id}" aria-pressed="${on}">${icon("check")}<span>${on ? "외웠어요" : "외웠어요 표시"}</span></button></div></div>`;
}
const bkRun = (p) => `<div class="bk-run">${refHtml(p.ref)}<span> · 이어서</span></div>`;
const bkLine = (p, vi, li, weak, nt, mode, v) => mode === "read" ? readLine(p, vi, li, weak, nt) : hideLine(p, weak, v, vi, li, p.id + "|");
function afterItem(p, k, mode) {
  if (k === "c") return `<div class="closing">— ${refHtml(p.ref)}</div>`;
  const a = p.after[k];
  return a.kind === "decl" ? `<div class="decl ns">${a.lines.map(esc).join("<br>")}</div>` : `<div class="pnote-box ns">${a.lines.map(esc).join("<br>")}</div>`;
}
const afterKeys = (p, mode) => [...(mode === "read" ? ["c"] : []), ...p.after.map((a, i) => i)];
const notesSig = (st) => st.passages.map((p) => { const n = NOTES[p.id]; return n ? Object.keys(n.memo).length + ":" + Object.values(n.memo).join("").length : 0; }).join(",") + "|" + (S.view.memoEdit || "");

// 숨긴 상자에 단계 전체를 한 번 그려 줄마다 높이를 재고, 쪽에 나눠 담음
function paginateStage(host, bw, bh, vol, st, mode, v) {
  const box = document.createElement("div");
  box.className = "bk-measure"; box.style.width = bw + "px";
  box.innerHTML = st.passages.map((p) => {
    const nt = NOTES[p.id] || NOTE0, weak = new Set();
    return `<div class="bk-p" data-fit data-pid="${p.id}">${bkHead(st, p)}<div class="verses">${p.verses.map((vs, vi) =>
      `<div class="verse"><span class="vn">${vs.n ?? ""}</span><div class="lines">${vs.lines.map((l, li) => bkLine(p, vi, li, weak, nt, mode, v)).join("")}${vs.gloss ? `<div data-g="${vi}">${glossHtml(vs)}</div>` : ""}${mode === "read" ? memoHtml(p, vi, nt) : ""}</div></div>`).join("")}</div>
      ${afterKeys(p, mode).map((k) => `<div data-a="${k}">${afterItem(p, k, mode)}</div>`).join("")}</div>`;
  }).join("") + `<div class="bk-m1">${bkRun(st.passages[0])}</div><div class="bk-m2"><hr class="bk-sep"></div>`;
  host.appendChild(box);
  const fits = {}, U = {};
  box.querySelectorAll(".bk-p").forEach((el) => {
    // 책의 한 줄이 한 줄로 들어가게 글자 크기 맞춤 (본문마다 같은 크기)
    el.classList.add("measuring");
    let r = 1;
    el.querySelectorAll(".ln").forEach((l) => { if (l.scrollWidth > l.clientWidth + 1) r = Math.min(r, l.clientWidth / l.scrollWidth); });
    el.classList.remove("measuring");
    const f = r < 1 ? Math.max(0.82, Math.floor(r * 100) / 100) : 1;
    fits[el.dataset.pid] = f; el.style.setProperty("--fit", f);
  });
  box.querySelectorAll(".bk-p").forEach((el) => {
    const pid = el.dataset.pid, top0 = el.getBoundingClientRect().top;
    let prev = 0;
    U[pid] = [...el.querySelectorAll(".bk-head, .ln[data-u], [data-g], .memo-note, .memo-edit, [data-a]")].map((x) => {
      const r = x.getBoundingClientRect(), bottom = r.bottom - top0, h = bottom - prev;
      prev = bottom;
      if (x.classList.contains("bk-head")) return { t: "h", pid, h };
      if (x.dataset.a != null) return { t: "a", pid, k: x.dataset.a === "c" ? "c" : Number(x.dataset.a), h };
      if (x.dataset.g != null) return { t: "g", pid, vi: Number(x.dataset.g), h };
      const vi = Number((x.dataset.u || "").split("-")[0]);
      if (x.classList.contains("ln")) return { t: "l", pid, vi, li: Number(x.dataset.u.split("-")[1]), h };
      return { t: "m", pid, vi: Number(x.closest(".verse") ? [...x.closest(".verses").children].indexOf(x.closest(".verse")) : 0), h };
    });
  });
  const runH = box.querySelector(".bk-m1").getBoundingClientRect().height;
  const sepH = box.querySelector(".bk-m2").getBoundingClientRect().height;
  box.remove();

  const pages = []; let cur = null;
  const newPage = () => { cur = { items: [], used: 0, npass: 0 }; pages.push(cur); };
  st.passages.forEach((p) => {
    const units = U[p.id] || [], total = units.reduce((a, u) => a + u.h, 0);
    const multi = total > bh;
    const pack = vol === "3" && cur && !cur.blank && cur.npass > 0 && cur.npass < 2 && !multi && cur.used + sepH + total <= bh;
    if (pack) { cur.items.push({ t: "sep" }); cur.used += sepH; }
    else {
      if (multi && pages.length % 2 === 1) pages.push({ blank: true, items: [] });
      newPage();
    }
    cur.npass++;
    units.forEach((u, i) => {
      // 제목은 첫 두 줄과 함께
      const need = u.t === "h" ? u.h + (units[i + 1] ? units[i + 1].h : 0) + (units[i + 2] ? units[i + 2].h : 0) : u.h;
      if (cur.items.length && cur.used + need > bh) { newPage(); cur.items.push({ t: "r", pid: p.id }); cur.used += runH; cur.npass = 1; }
      cur.items.push(u); cur.used += u.h;
    });
  });
  if (pages.length % 2 === 1) pages.push(null);
  const headSpread = {}, spreadPids = [];
  pages.forEach((pg, i) => {
    const k = i >> 1; spreadPids[k] = spreadPids[k] || [];
    ((pg && pg.items) || []).forEach((it) => {
      if (it.pid && !spreadPids[k].includes(it.pid)) spreadPids[k].push(it.pid);
      if (it.t === "h") headSpread[it.pid] = k;
    });
  });
  return { pages, fits, headSpread, spreadPids, nSpreads: pages.length / 2 };
}

function bkPage(pg, st, mode, v, fits) {
  if (!pg) return `<div class="bk-blank" aria-hidden="true"></div>`;
  if (pg.blank) return `<div class="bk-blank" aria-hidden="true"><span>말씀 선포</span></div>`;
  let out = "", i = 0;
  const items = pg.items;
  while (i < items.length) {
    if (items[i].t === "sep") { out += `<hr class="bk-sep">`; i++; continue; }
    const pid = items[i].pid, p = st.passages.find((x) => x.id === pid);
    const seg = [];
    while (i < items.length && items[i].pid === pid) seg.push(items[i++]);
    const nt = NOTES[pid] || NOTE0, weak = weakSet(S.marks[pid]);
    let head = "", verses = "", afters = "", curVi = -1, firstLi = 0, lbuf = "";
    const flush = () => {
      if (curVi >= 0) verses += `<div class="verse"><span class="vn">${firstLi === 0 ? (p.verses[curVi].n ?? "") : ""}</span><div class="lines">${lbuf}</div></div>`;
      curVi = -1; lbuf = "";
    };
    seg.forEach((u) => {
      if (u.t === "h") head = bkHead(st, p);
      else if (u.t === "r") head = bkRun(p);
      else if (u.t === "l") { if (u.vi !== curVi) { flush(); curVi = u.vi; firstLi = u.li; } lbuf += bkLine(p, u.vi, u.li, weak, nt, mode, v); }
      else if (u.t === "g") { if (u.vi !== curVi) { flush(); curVi = u.vi; firstLi = 99; } lbuf += glossHtml(p.verses[u.vi]); }
      else if (u.t === "m") { if (u.vi !== curVi) { flush(); curVi = u.vi; firstLi = 99; } lbuf += memoHtml(p, u.vi, nt); }
      else if (u.t === "a") { flush(); afters += afterItem(p, u.k, mode); }
    });
    flush();
    out += `<section class="bk-seg" style="--fit:${fits[pid] || 1}">${head}${verses ? `<div class="verses${mode === "read" && PEN.on ? " pen" : ""}" data-pid="${pid}"${mode === "read" ? " data-read" : ""}>${verses}</div>` : ""}${afters}</section>`;
  }
  return out;
}

// 구절표 (보고 싶을 때만 왼쪽에서 꺼내 봄)
function drawerHtml(vol, st, curNo) {
  if (!S.drawer) return "";
  return `<div class="drawer-back" data-act="drawer" aria-hidden="true"></div>
    <aside class="drawer paperink" aria-label="단계 구절표">
      <div class="drawer-top"><a class="ob-back" href="#/b/${vol}">${icon("back")}<span>${esc(VOL_SHORT[vol])} · 단계 목록</span></a>
        <button class="iconbtn" type="button" data-act="drawer" aria-label="구절표 닫기">${icon("close")}</button></div>
      <div class="drawer-body">${stageHead(vol, st)}${stageList(vol, st, curNo)}</div>
    </aside>`;
}
const bkTop = (vol, st) => `<header class="top">
    <button class="iconbtn" type="button" data-act="drawer" aria-label="구절표 열기" aria-expanded="${!!S.drawer}">${icon("menu")}</button>
    <a class="iconbtn" href="#/" aria-label="서재로">${icon("home")}</a>
    <div class="t">${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b></div>
    ${themeBtn()}
  </header>`;
const hideChips = (v) => `<div class="tools" role="group" aria-label="가리는 방법">
    ${HIDES.map(([id, lb]) =>
      `<button class="chip" type="button" data-hide="${id}" aria-pressed="${v.hide === id}">${lb}</button>`).join("")}
    <button class="chip" type="button" data-act="openall" aria-pressed="${v.openAll}">${v.openAll ? "다시 가리기" : "모두 열기"}</button></div>`;

function viewBookSpread(c) {
  const { vol, num, b, st, p, mode, v, nb, modes } = c;
  const tools = mode === "read" ? penBar() : hideChips(v);
  $app.innerHTML = openBook(bkTop(vol, st), "", "", `<div class="bk-tools">${tools}</div>${modes}`, "", "", "bk-mode") + drawerHtml(vol, st, p.no);
  const L = $app.querySelector(".ob-l .ob-scroll"), Rp = $app.querySelector(".ob-r .ob-scroll");
  const cs = getComputedStyle(L);
  const bw = Math.floor(L.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  const bh = Math.floor(L.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom));
  const key = [vol, num, mode, v.hide, bw, bh, cs.getPropertyValue("--fs"), notesSig(st), S._fontsOk ? 1 : 0].join("|");
  let BK = S.bookCache && S.bookCache.key === key ? S.bookCache : null;
  if (!BK) { BK = paginateStage(L, bw, bh, vol, st, mode, v); BK.key = key; S.bookCache = BK; }
  // 몇 번째 펼친 쪽인지: 넘겨 온 자리 → 아니면 이 본문이 시작하는 자리
  const sk = vol + "/" + num;
  let sp = BK.headSpread[p.id] ?? 0;
  if (S.bookPos && S.bookPos.key === sk) {
    const want = S.bookPos.spread === "last" ? BK.nSpreads - 1 : S.bookPos.spread;
    if (want >= 0 && want < BK.nSpreads && BK.spreadPids[want].includes(p.id)) sp = want;
  }
  S.bookPos = { key: sk, spread: sp };
  const visible = BK.spreadPids[sp] || [p.id];
  visible.forEach((pid) => { notesNow(pid); if (pid !== p.id) marksNow(pid); });
  L.innerHTML = bkPage(BK.pages[sp * 2], st, mode, v, BK.fits);
  Rp.innerHTML = bkPage(BK.pages[sp * 2 + 1], st, mode, v, BK.fits);
  // 아래 바깥 모서리: 쪽 번호 + 넘기기
  const si = b.stages.findIndex((x) => x.num === num);
  const hasPrev = sp > 0 || si > 0, hasNext = sp < BK.nSpreads - 1 || !!nb.next;
  const [fl, fr] = $app.querySelectorAll(".folio");
  fl.innerHTML = `<button class="flip" type="button" data-act="bkprev" aria-label="앞 쪽으로" ${hasPrev ? "" : "disabled"}>${icon("back")}<span>${sp > 0 ? "앞 쪽" : hasPrev ? "앞 단계" : ""}</span></button><span class="pno">${sp * 2 + 1}</span>`;
  fr.innerHTML = `<span class="pno">${sp * 2 + 2} / ${BK.nSpreads * 2}</span><button class="flip" type="button" data-act="bknext" aria-label="다음 쪽으로" ${hasNext ? "" : "disabled"}><span>${sp < BK.nSpreads - 1 ? "다음 쪽" : hasNext ? "다음 단계" : ""}</span>${icon("next")}</button>`;
  S.ctx = { vol, num, p, st, mode, nb, b, weak: weakSet(S.marks[p.id]), book: true, visible, spread: sp, BK };
  logViewOnce(p);
}

// 쪽 넘기기: 같은 단계 안에서는 두 쪽씩, 끝에서는 앞 · 다음 단계로
function bkFlip(dir) {
  const c = S.ctx; if (!c || !c.book) return;
  const sk = c.vol + "/" + c.num, to = c.spread + dir, BK = c.BK;
  if (to >= 0 && to < BK.nSpreads) {
    S.bookPos = { key: sk, spread: to };
    const pids = BK.spreadPids[to];
    // 그 펼친 쪽에서 시작하는 첫 본문(없으면 이어지는 본문)을 지금 본문으로
    const head = BK.pages.slice(to * 2, to * 2 + 2).flatMap((pg) => (pg && pg.items) || []).find((it) => it.t === "h");
    const pid = head ? head.pid : pids[0];
    const np = c.st.passages.find((x) => x.id === pid);
    const h = `#/p/${c.vol}/${c.num}/${np.no}?m=${c.mode}`;
    if (location.hash === h) render(); else location.replace(h);
    return;
  }
  const si = c.b.stages.findIndex((x) => x.num === c.num);
  const ns = c.b.stages[si + dir];
  if (!ns) return;
  if (dir > 0) { S.bookPos = null; location.replace(`#/p/${c.vol}/${ns.num}/1?m=${c.mode}`); }
  else {
    S.bookPos = { key: c.vol + "/" + ns.num, spread: "last" };
    location.replace(`#/p/${c.vol}/${ns.num}/${ns.count || 1}?m=${c.mode}`);
  }
}
document.addEventListener("keydown", (e) => {
  if (!S.ctx || !S.ctx.book || e.target.closest("textarea, input, select")) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); bkFlip(1); }
  else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); bkFlip(-1); }
  else if (e.key === "Escape" && S.drawer) { S.drawer = false; render(); }
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { S._fontsOk = true; if (S.ctx && S.ctx.book) render(); });

// ───────── 녹음 · 채점
function recBody(p, v, m) { const r = recParts(p, v, m); return r.panel + r.verses + r.foot; }
function recParts(p, v, m) {
  const prevLine = m && m.sessions ? `지난번 표시 ${m.lastCount ?? 0}곳 · 채점 ${m.sessions}번` : "처음 녹음해요";
  if (v.rec === "idle" || v.rec === "denied") {
    return { panel: `<div class="rec-panel">
      <div class="rec-row"><button class="rec-btn" type="button" data-act="recstart" aria-label="녹음 시작">${icon("mic")}</button>
      <div class="rec-info"><b>본문을 가리고 선포해 보세요</b><span>${prevLine}</span></div></div>
      ${v.rec === "denied" ? `<p class="hint" style="margin:0">마이크를 쓸 수 없어요. 브라우저 설정에서 마이크 허용을 켜 주세요.</p>` : `<p class="hint" style="margin:0">녹음은 이 기기 안에서만 잠시 쓰고 올리지 않아요. 다 듣고 표시한 결과만 저장돼요.</p>`}
    </div>`, verses: versesHide(p, new Set(), { hide: "first", open: new Set(), openAll: false }), foot: "" };
  }
  if (v.rec === "recording") {
    return { panel: `<div class="rec-panel">
      <div class="rec-row"><button class="rec-btn stop" type="button" data-act="recstop" aria-label="녹음 멈추기">${icon("stop")}</button>
      <div class="rec-info"><b>녹음 중 <span id="recTime">0:00</span></b><span>다 외웠으면 멈춤을 누르세요</span></div></div>
      <div class="meter" aria-hidden="true"><i id="recMeter"></i></div>
    </div>`, verses: versesHide(p, new Set(), { hide: "first", open: new Set(), openAll: false }), foot: "" };
  }
  // 다 녹음함 → 들으며 표시
  const n = Object.keys(v.marks).length;
  return { panel: `<div class="rec-panel">
      <audio id="recAudio" controls preload="auto" src="${v.url}"></audio>
      <div class="legend"><span>낱말을 누를 때마다</span><span class="lg-miss">틀림</span><span class="lg-skip">빠뜨림</span><span class="lg-hes">머뭇거림</span><span>→ 지우기</span></div>
    </div>`, verses: versesGrade(p, v.marks), foot: `
    ${v.result ? `<div class="result" style="margin-top:16px">${esc(v.result)}</div>` : ""}
    <div class="breath-ctrl">
      <button class="btn ghost" type="button" data-act="recagain">다시 녹음</button>
      <button class="btn" type="button" data-act="recsave" ${v.saved ? "disabled" : ""}>${v.saved ? "저장했어요" : `채점 저장 (${n}곳)`}</button>
    </div>` };
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
      <div class="decl ns" style="margin-top:18px">${esc(b.names.close)}</div>`;
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
  const kids = !!(l.kids && l.kids.length) && pref("replist", "adult") === "kids";
  let n = 0;
  const body = kids
    ? l.kids.map((g) => `<div class="rep-h ns">${esc(g.title)}</div>${g.items.map((x) => `<div class="rep ns num"><span class="rn">${++n}</span>${esc(x)}</div>`).join("")}`).join("")
    : l.items.map((x) => `<div class="rep ns">${esc(x)}</div>`).join("");
  const tog = l.kids && l.kids.length ? `<div class="opts rep-tog">${[["adult", "어른용"], ["kids", "어린이용"]].map(([val, lab]) =>
    `<button class="chip" type="button" data-pref="replist" data-val="${val}" aria-pressed="${(kids ? "kids" : "adult") === val}">${lab}</button>`).join("")}</div>` : "";
  $app.innerHTML = deskPage(topBar(`${esc(VOL_SHORT[vol])} · <b>${esc(st.label)}</b>`, `#/s/${vol}/${num}`),
    tome(`<article class="sheet"><div class="crumb">${esc(st.label)}</div>
    <h1 class="ptitle">${esc(l.title)}</h1>${tog}<p class="hint ns">한 줄씩 소리 내어 고백합니다</p>
    <div>${body}</div>
    ${l.after ? `<div class="decl ns">${esc(l.after)}</div>` : ""}</article>`));
}

// ───────── 설정
async function viewSettings() {
  const rid = rendering;
  await pushLoad().catch(() => {});
  if (rid !== rendering && location.hash.split("?")[0] !== "#/settings") return;
  const theme = pref("theme", "cream"), size = sizeNow(), mode = pref("mode", "read");
  const E = envInfo(), P = S.pushCfg || {}, on = pushOnHere(), at = alarmTxt(P);
  const devs = Object.entries((S.myPush && S.myPush.devices) || {});
  const pushField = `<div class="field" id="pushField"><b>아침 알림 받기</b>
      ${!P.vapidKey || !at ? `<p>관리자가 알림을 준비하면 여기서 켤 수 있어요.</p>`
      : `<p>${esc(at)} · “${esc(((P.alarms || []).find((a) => a.on !== false) || {}).title || "말씀선포")}” 알림이 이 기기로 와요.</p>
        ${E.inApp ? `<p class="warn-t">${esc(E.browser)}에서는 알림을 받을 수 없어요. 사파리 · 크롬으로 열어 주세요.</p>`
        : E.ios && !E.app ? `<p class="warn-t">아이폰 · 아이패드는 <b>홈 화면에 추가한 앱</b>에서만 알림을 받을 수 있어요.</p><div class="opts"><a class="btn small" href="#/install">홈 화면에 설치하는 법</a></div>`
        : !E.pushable ? `<p class="warn-t">이 브라우저는 알림을 받을 수 없어요.</p>`
        : `<div class="opts">${on ? `<span class="on-pill">${icon("check")} 이 기기에서 받는 중</span><button class="btn ghost small" type="button" data-act="pushoff">이 기기 끄기</button>`
          : `<button class="btn small" type="button" data-act="pushon">이 기기에서 알림 받기</button>`}</div>`}
        ${devs.length ? `<div class="devs">${devs.map(([k, d]) => `<span class="dev">${esc(d.label || "기기")}${k === pref("pushKey", "") ? " <small>· 이 기기</small>" : ""}<button class="iconbtn" type="button" data-act="pushrm" data-v="${esc(k)}" aria-label="이 기기는 그만 받기">${icon("close")}</button></span>`).join("")}</div>` : ""}`}</div>`;
  const opt = (name, val, cur, label) => `<button class="chip" type="button" data-pref="${name}" data-val="${val}" aria-pressed="${val === cur}">${label}</button>`;
  $app.innerHTML = deskPage(topBar("<b>설정</b>", "#/"), tome(`
    <div class="page-h"><span class="kicker">설정</span><h1>나에게 맞게</h1></div>
    <div class="field"><b>화면 모드</b><div class="tp-list">${THEMES.map((t) => `<button class="tp-opt" type="button" data-pref="theme" data-val="${t.id}" aria-pressed="${t.id === theme}">
        <span class="tp-sw" style="background:${t.desk}"><i style="background:${t.paper};color:${t.ink}">가</i></span>
        <span class="tp-tx"><b>${t.label}</b><small>${t.desc}</small></span>${t.id === theme ? icon("check", "i tp-ck") : ""}</button>`).join("")}</div>
      <p>화면 모드는 기기마다 따로 기억해요. 폰은 밤 읽기, 패드는 크림 북처럼 쓸 수 있어요. 위쪽 반달 단추로도 바로 바꿀 수 있어요.</p></div>
    <div class="field"><b>본문 글자 크기</b><div class="opts">${SIZES.map(([val, lb]) => opt("size", val, size, lb)).join("")}</div>
      <div class="size-demo paperink"><span class="ln">태초에 하나님이 천지를 창조하시니라</span></div>
      <p>'책자 그대로'가 기본이고 가장 커요. 작게 할수록 한 쪽에 더 많은 줄이 들어가요. 기기마다 따로 기억해요.</p></div>
    <div class="field"><b>별빛 배경</b><div class="opts">${opt("stars", "on", pref("stars", "on"), "켜기")}${opt("stars", "off", pref("stars", "on"), "끄기")}</div>
      <p>책상 바탕에 별빛이 반짝이고 가끔 별똥별이 지나가요. 오래된 폰에서 느리면 꺼 주세요.</p></div>
    ${pushField}
    <div class="field"><b>본문을 열 때 기본 방식</b><div class="opts">${MODES.map((m) => opt("mode", m.id, mode, m.label)).join("")}</div></div>
    <div class="field"><b>홈 화면에 앱으로 설치</b><p>${E.app ? "이 기기는 앱으로 열려 있어요." : "아이콘으로 바로 열고 아침 알림도 받을 수 있어요."}</p><div class="opts"><a class="btn ghost small" href="#/install">설치 안내 보기</a></div></div>
    <div class="field"><b>계정</b><p>${esc(S.user.email)}</p><div class="opts"><button class="btn ghost small" type="button" data-act="signout">나가기</button></div></div>
    <p class="muted colo">말씀암송 선포구절 · 다니엘 아마츠 · ${VERSION}</p>`));
}

// ───────── 관리자 (사람 관리 · 열람 요청 · 접속 통계 · 아침 알림 · 본문 올리기)
const GROUPS0 = ["교사", "학부모", "학생", "성도", "기타"];
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const ALARM0 = () => ({ id: "a" + Date.now().toString(36), on: true, time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], title: "말씀선포", body: "{이름}님, 오늘 말씀 선포 하셨나요?" });
const ADM = { tab: "people", q: "", grp: "*", sort: "name", sel: new Set(), open: null, panel: null, data: null, loadedAt: 0, alarms: null };
const tsMs = (t) => !t ? 0 : typeof t === "number" ? t : t.toMillis ? t.toMillis() : t.seconds ? t.seconds * 1000 : t instanceof Date ? t.getTime() : 0;
function ago(t) {
  const ms = tsMs(t); if (!ms) return "";
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 2) return "방금"; if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60); if (h < 24) return h + "시간 전";
  const d = Math.floor(h / 24); if (d === 1) return "어제"; if (d < 31) return d + "일 전";
  const x = new Date(ms); return `${x.getFullYear()}.${x.getMonth() + 1}.${x.getDate()}`;
}
const ymd = (t) => { const ms = tsMs(t); if (!ms) return ""; const x = new Date(ms + 9 * 3600e3); return x.toISOString().slice(0, 10); };
const volTxt = (vols) => (vols || []).slice().sort().join("·") + ((vols || []).length ? "권" : "책 없음");

async function admLoad(force) {
  if (ADM.data && !force && Date.now() - ADM.loadedAt < 60000) return ADM.data;
  const safe = (p, d) => p.catch(() => d);
  const [rows, reqs, stats, days, cfgA, cfgP, log, subs] = await Promise.all([
    safe(B.listAllow(), []), safe(B.listRequests(), []), safe(B.listStatsUsers(), []), safe(B.listStatsDays(30), []),
    safe(B.getConfig("admin"), null), safe(B.getConfig("push"), null), safe(B.getConfig("pushLog"), null), safe(B.listPush(), [])]);
  const statBy = {}; stats.forEach((x) => { if (x.email) statBy[x.email] = x; });
  ADM.data = { rows, reqs, stats, statBy, days, groups: (cfgA && cfgA.groups && cfgA.groups.length) ? cfgA.groups : GROUPS0, push: cfgP || {}, log: log || {}, subs };
  ADM.loadedAt = Date.now();
  return ADM.data;
}
const admGroups = (D) => { const g = [...D.groups]; D.rows.forEach((r) => { if (r.group && !g.includes(r.group)) g.push(r.group); }); return g; };
const grpList = (D) => `<datalist id="grpList">${admGroups(D).map((g) => `<option value="${esc(g)}">`).join("")}</datalist>`;
const volChecks = (name, vols) => `<div class="checks">${VOLS.map((v) =>
  `<label><input type="checkbox" name="${esc(name)}" value="${v}" ${(vols || []).includes(v) ? "checked" : ""}>${v}권</label>`).join("")}</div>`;
const checkedVols = (box, name) => [...box.querySelectorAll(`input[name="${name}"]:checked`)].map((x) => x.value);

async function viewAdmin(q = {}) {
  if (!S.admin) return go("#/");
  const rid = rendering;
  if (q.t) ADM.tab = q.t;
  if (!ADM.data) $app.innerHTML = deskPage(topBar("<b>관리</b>", "#/"), tome(`<p class="muted">불러오는 중…</p>`));
  const D = await admLoad();
  if (rid !== rendering) return;
  const tabs = [["people", `사람 <small>${D.rows.length}</small>`], ["req", `열람 요청${D.reqs.length ? ` <em class="badge">${D.reqs.length}</em>` : ""}`],
    ["stats", "접속 통계"], ["alarm", "아침 알림"], ["content", "본문 올리기"]];
  const body = ADM.tab === "req" ? admReq(D) : ADM.tab === "stats" ? admStats(D) : ADM.tab === "alarm" ? admAlarm(D) : ADM.tab === "content" ? admContent() : admPeople(D);
  $app.innerHTML = deskPage(topBar("<b>관리</b>", "#/", `<button class="iconbtn" type="button" data-adm="reload" aria-label="새로 불러오기">${icon("refresh")}</button>`), tome(`
    <nav class="adm-tabs adm-top" role="tablist" aria-label="관리 메뉴">${tabs.map(([id, lb]) =>
      `<a class="adm-tab" role="tab" href="#/admin?t=${id}" data-nav aria-selected="${ADM.tab === id}">${lb}</a>`).join("")}</nav>
    <div class="adm-body">${body}</div>${grpList(D)}`));
  admWire(D);
}

// ── 사람
function admFilter(D) {
  const q = ADM.q.trim().toLowerCase();
  let list = D.rows.filter((r) => ADM.grp === "*" || (ADM.grp === "" ? !r.group : r.group === ADM.grp));
  if (q) list = list.filter((r) => [r.name, r.email, r.sub, r.memo, r.group].some((x) => String(x || "").toLowerCase().includes(q)));
  const seen = (r) => tsMs((D.statBy[r.email] || {}).lastAt);
  const by = {
    name: (a, b) => (a.name || "힣").localeCompare(b.name || "힣", "ko") || a.email.localeCompare(b.email),
    seen: (a, b) => seen(b) - seen(a),
    new: (a, b) => tsMs(b.createdAt || b.updatedAt) - tsMs(a.createdAt || a.updatedAt),
    group: (a, b) => (a.group || "힣").localeCompare(b.group || "힣", "ko") || (a.name || "").localeCompare(b.name || "", "ko")
  }[ADM.sort] || ((a, b) => 0);
  return list.sort(by);
}
function admPeopleList(D) {
  const list = admFilter(D);
  if (!list.length) return `<p class="muted adm-empty">${D.rows.length ? "찾는 사람이 없어요." : "아직 등록된 사람이 없어요. 위에서 추가하거나, 들어온 사람이 남긴 열람 요청을 허용해 주세요."}</p>`;
  return list.map((r) => {
    const st = D.statBy[r.email] || {}, open = ADM.open === r.email;
    return `<div class="pp${open ? " open" : ""}" data-email="${esc(r.email)}">
      <label class="pp-ck"><input type="checkbox" data-sel="${esc(r.email)}" ${ADM.sel.has(r.email) ? "checked" : ""} aria-label="${esc(r.name || r.email)} 고르기"></label>
      <button class="pp-main" type="button" data-adm="ppopen" aria-expanded="${open}">
        <span class="pp-n"><b>${esc(r.name || "이름 없음")}</b>${r.group ? `<i class="gb">${esc(r.group)}</i>` : ""}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}${r.role === "admin" ? '<i class="gb ad">관리자</i>' : ""}</span>
        <span class="pp-e">${esc(r.email)} · ${volTxt(r.vols)}</span>
      </button>
      <span class="pp-seen">${st.lastAt ? `${ago(st.lastAt)}<small>${st.days || 1}일 들어옴</small>` : '<small class="never">아직 안 들어옴</small>'}</span>
    </div>${open ? admEdit(D, r) : ""}`;
  }).join("");
}
function admEdit(D, r) {
  const st = D.statBy[r.email] || {};
  return `<form class="pp-edit" data-email="${esc(r.email)}" id="ppEdit">
    <div class="g2"><label>이름<input type="text" name="name" value="${esc(r.name || "")}" maxlength="60" placeholder="홍길동"></label>
      <label>분류<input type="text" name="group" list="grpList" value="${esc(r.group || "")}" maxlength="40" placeholder="고르거나 적기"></label></div>
    <div class="g2"><label>세부 (선택)<input type="text" name="sub" value="${esc(r.sub || "")}" maxlength="60" placeholder="3학년 · 1반 · 찬양팀"></label>
      <label>역할<select name="role"><option value="user" ${r.role !== "admin" ? "selected" : ""}>열람</option><option value="admin" ${r.role === "admin" ? "selected" : ""}>관리자</option></select></label></div>
    <label>메모 (선택)<input type="text" name="memo" value="${esc(r.memo || "")}" maxlength="300" placeholder="관리자만 봐요"></label>
    <div><span class="muted">볼 수 있는 책</span>${volChecks("ev", r.vols)}</div>
    <p class="muted pp-info">등록 ${ymd(r.createdAt) || "예전"}${r.addedBy ? " · " + esc(r.addedBy) : ""}${st.lastAt ? ` · 마지막 접속 ${ago(st.lastAt)} · ${st.days || 1}일 들어옴 · 외운 본문 ${st.mem || 0}` : ""}</p>
    <div class="row-btns"><button class="btn small" type="submit">저장</button><button class="btn ghost small" type="button" data-adm="ppclose">닫기</button>
      <button class="btn ghost small danger" type="button" data-adm="ppdel">삭제</button></div></form>`;
}
function admPeople(D) {
  const gs = admGroups(D), n = (g) => D.rows.filter((r) => g === "" ? !r.group : r.group === g).length;
  const chips = [["*", "전체", D.rows.length], ...gs.map((g) => [g, g, n(g)]).filter((x) => x[2] || D.groups.includes(x[0])), ...(n("") ? [["", "분류 없음", n("")]] : [])];
  const panel = ADM.panel === "add" ? `<form class="adm-add" id="addForm">
      <div class="g2"><label>구글 메일 주소<input type="email" name="email" required placeholder="name@gmail.com" autocomplete="off"></label>
        <label>이름<input type="text" name="name" maxlength="60" placeholder="홍길동"></label></div>
      <div class="g2"><label>분류<input type="text" name="group" list="grpList" maxlength="40" placeholder="고르거나 적기"></label>
        <label>세부 (선택)<input type="text" name="sub" maxlength="60" placeholder="3학년 · 1반"></label></div>
      <div><span class="muted">볼 수 있는 책</span>${volChecks("v_new", VOLS)}</div>
      <div class="row-btns"><button class="btn" type="submit">등록</button><button class="btn ghost" type="button" data-adm="panel" data-v="">닫기</button></div></form>`
    : ADM.panel === "bulk" ? `<form class="adm-add" id="bulkForm">
      <label>한 줄에 한 명씩 붙여 넣기 <small>이름, 메일, 분류, 세부 순서 (쉼표나 탭으로 나눔 · 엑셀에서 복사해도 돼요)</small>
        <textarea name="lines" rows="7" placeholder="김하늘, sky@gmail.com, 학부모, 3학년&#10;이바다, sea@gmail.com, 교사&#10;park@gmail.com"></textarea></label>
      <div class="g2"><label>분류가 비어 있는 줄은<input type="text" name="group" list="grpList" maxlength="40" placeholder="고르거나 적기"></label><span></span></div>
      <div><span class="muted">볼 수 있는 책</span>${volChecks("v_bulk", VOLS)}</div>
      <p class="muted" id="bulkMsg">붙여 넣으면 몇 명인지 바로 세어 드려요.</p>
      <div class="row-btns"><button class="btn" type="submit">한꺼번에 등록</button><button class="btn ghost" type="button" data-adm="panel" data-v="">닫기</button></div></form>`
    : ADM.panel === "groups" ? `<form class="adm-add" id="grpForm">
      <label>분류 이름 <small>쉼표로 나눠 적어요. 이 순서대로 보여요.</small><input type="text" name="groups" value="${esc(D.groups.join(", "))}"></label>
      <p class="muted">분류 이름을 바꿔도 이미 등록된 사람의 분류는 그대로예요. (사람을 골라 '분류 바꾸기'로 한꺼번에 바꿀 수 있어요)</p>
      <div class="row-btns"><button class="btn" type="submit">저장</button><button class="btn ghost" type="button" data-adm="panel" data-v="">닫기</button></div></form>` : "";
  const sel = ADM.sel.size ? `<div class="sel-bar" id="selBar"><b>${ADM.sel.size}명 골랐어요</b>
      <span class="sb-g"><input type="text" id="selGroup" list="grpList" placeholder="분류" maxlength="40"><button class="btn small" type="button" data-adm="selgroup">분류 바꾸기</button></span>
      <span class="sb-g">${volChecks("v_sel", VOLS)}<button class="btn small" type="button" data-adm="selvols">책 바꾸기</button></span>
      <span class="sb-g"><button class="btn ghost small danger" type="button" data-adm="seldel">삭제</button><button class="btn ghost small" type="button" data-adm="selnone">고르기 풀기</button></span></div>` : "";
  return `<div class="adm-acts">
      <button class="btn small" type="button" data-adm="panel" data-v="add">+ 한 명 등록</button>
      <button class="btn ghost small" type="button" data-adm="panel" data-v="bulk">여러 명 한꺼번에</button>
      <button class="btn ghost small" type="button" data-adm="panel" data-v="groups">분류 이름 정하기</button>
      <button class="btn ghost small" type="button" data-adm="csv">엑셀(CSV) 내려받기</button></div>
    ${panel}
    <div class="adm-tools"><input type="search" id="admQ" value="${esc(ADM.q)}" placeholder="이름 · 메일 · 세부 · 메모로 찾기" aria-label="사람 찾기">
      <select id="admSort" aria-label="정렬">${[["name", "이름순"], ["group", "분류순"], ["seen", "최근 접속순"], ["new", "최근 등록순"]].map(([v, l]) => `<option value="${v}" ${ADM.sort === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    <div class="grp-chips" role="group" aria-label="분류로 보기">${chips.map(([v, l, c]) => `<button class="chip" type="button" data-adm="grp" data-v="${esc(v)}" aria-pressed="${ADM.grp === v}">${esc(l)} <small>${c}</small></button>`).join("")}
      <label class="pp-all"><input type="checkbox" id="selAll"> 보이는 사람 모두 고르기</label></div>
    ${sel}
    <div class="pp-list" id="ppList">${admPeopleList(D)}</div>`;
}
function parseBulk(text, defGroup) {
  const out = [], bad = [];
  text.split(/\r?\n/).forEach((line) => {
    const t = line.split(/[,\t;]/).map((x) => x.trim()).filter(Boolean);
    if (!t.length) return;
    const ei = t.findIndex((x) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
    if (ei < 0) { bad.push(line.trim()); return; }
    const email = t[ei].toLowerCase(), rest = t.filter((x, i) => i !== ei);
    out.push({ email, name: rest[0] || "", group: rest[1] || defGroup || "", sub: rest.slice(2).join(" · ") });
  });
  const seen = new Set(); return { list: out.filter((x) => !seen.has(x.email) && seen.add(x.email)), bad };
}
function csvDownload(D) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["이름", "메일", "분류", "세부", "볼 수 있는 책", "역할", "메모", "등록일", "마지막 접속", "들어온 날 수", "들어온 횟수", "본 본문", "외운 본문"];
  const lines = admFilter(D).map((r) => { const s = D.statBy[r.email] || {};
    return [r.name, r.email, r.group, r.sub, (r.vols || []).sort().join(" "), r.role === "admin" ? "관리자" : "열람", r.memo, ymd(r.createdAt), ymd(s.lastAt), s.days || 0, s.visits || 0, s.views || 0, s.mem || 0].map(q).join(","); });
  const blob = new Blob(["﻿" + [head.map(q).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `말씀선포_사람목록_${B.kstDay()}.csv`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// ── 열람 요청
function admReq(D) {
  if (!D.reqs.length) return `<p class="muted adm-empty">새 열람 요청이 없어요.<br>처음 들어온 사람이 이름을 적어 '열람 요청'을 누르면 여기에 보여요.</p>
    <div class="howto"><b>사람들에게 이렇게 알려 주세요</b><ol><li>앱 주소를 열고 구글 계정으로 들어가기</li><li>이름을 적고 [열람 요청 보내기]</li><li>관리자가 허용하면 바로 볼 수 있어요</li></ol></div>`;
  const list = D.reqs.slice().sort((a, b) => tsMs(b.at) - tsMs(a.at));
  return `<p class="muted">구글로 들어와 열람 요청을 남긴 사람이에요. 분류와 책을 확인하고 [허용]을 누르면 바로 볼 수 있어요.</p>
    <div class="adm-acts"><button class="btn small" type="button" data-adm="reqall">보이는 요청 모두 허용 (${list.length}명)</button></div>
    ${list.map((r) => `<form class="rq" data-email="${esc(r.email)}">
      <div class="rq-h"><b>${esc(r.name || r.dname || "이름 없음")}</b><span>${esc(r.email)} · ${ago(r.at)}</span>${r.note ? `<p class="rq-note">“${esc(r.note)}”</p>` : ""}</div>
      <div class="g3"><label>이름<input type="text" name="name" value="${esc(r.name || r.dname || "")}" maxlength="60"></label>
        <label>분류<input type="text" name="group" list="grpList" maxlength="40" placeholder="고르거나 적기"></label>
        <label>세부 (선택)<input type="text" name="sub" maxlength="60" value=""></label></div>
      <div class="rq-f">${volChecks("rv", VOLS)}<span class="row-btns"><button class="btn small" type="button" data-adm="reqok">허용</button><button class="btn ghost small danger" type="button" data-adm="reqno">거절</button></span></div>
    </form>`).join("")}`;
}

// ── 접속 통계
function admStats(D) {
  const now = Date.now(), within = (d) => (s) => now - tsMs(s.lastAt) < d * 86400e3;
  const reg = new Set(D.rows.map((r) => r.email)), st = D.stats.filter((s) => reg.has(s.email));
  const today = B.kstDay(), tSet = new Set(Object.keys((D.days.find((x) => x.day === today) || { u: {} }).u));
  const w7 = st.filter(within(7)).length, w30 = st.filter(within(30)).length;
  const devs = D.subs.reduce((a, s) => a + Object.keys(s.devices || {}).length, 0), subsN = D.subs.filter((s) => Object.keys(s.devices || {}).length).length;
  // 날짜별 막대 (최근 30일)
  const days = []; for (let i = 29; i >= 0; i--) { const day = B.kstDay(now - i * 86400e3), x = D.days.find((d) => d.day === day); const u = x ? x.u : {};
    days.push({ day, n: Object.keys(u).length, opens: Object.values(u).reduce((a, b) => a + (Number(b) || 0), 0) }); }
  const max = Math.max(4, ...days.map((d) => d.n)), W = 600, H = 150, bw = W / 30;
  const nice = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const bars = days.map((d, i) => { const h = d.n ? Math.max(3, (d.n / nice) * (H - 20)) : 0, x = i * bw + 2, y = H - h;
    const lab = `${Number(d.day.slice(5, 7))}/${Number(d.day.slice(8))} · ${d.n}명 · ${d.opens}번`;
    return `<g class="bar" tabindex="0" aria-label="${lab}"><rect class="hit" x="${i * bw}" y="0" width="${bw}" height="${H}"/>${h ? `<path d="M${x},${H} V${y + 3} q0,-3 3,-3 h${(bw - 10).toFixed(1)} q3,0 3,3 V${H} Z"/>` : ""}<title>${lab}</title></g>`; }).join("");
  const grid = [0, .5, 1].map((f) => `<line x1="0" x2="${W}" y1="${H - f * (H - 20)}" y2="${H - f * (H - 20)}"/><text x="${W + 6}" y="${H - f * (H - 20) + 4}">${Math.round(nice * f)}</text>`).join("");
  const ticks = [0, 7, 14, 21, 29].map((i) => `<text x="${i * bw + bw / 2}" y="${H + 16}" text-anchor="middle">${Number(days[i].day.slice(5, 7))}/${Number(days[i].day.slice(8))}</text>`).join("");
  // 분류별
  const gs = admGroups(D), gRows = [...gs, ""].map((g) => { const ppl = D.rows.filter((r) => g === "" ? !r.group : r.group === g); if (!ppl.length) return "";
    const ss = ppl.map((r) => D.statBy[r.email]).filter(Boolean), a7 = ss.filter(within(7)).length, mem = ss.reduce((a, s) => a + (s.mem || 0), 0);
    return `<tr><th>${esc(g || "분류 없음")}</th><td>${ppl.length}</td><td>${a7}<small> (${Math.round(a7 / ppl.length * 100)}%)</small></td><td>${ss.length ? (mem / ppl.length).toFixed(1) : "0"}</td></tr>`; }).join("");
  // 사람별
  const ppl = D.rows.map((r) => ({ r, s: D.statBy[r.email] || null })).sort((a, b) => tsMs(b.s && b.s.lastAt) - tsMs(a.s && a.s.lastAt));
  const never = ppl.filter((x) => !x.s), sleep = ppl.filter((x) => x.s && now - tsMs(x.s.lastAt) >= 30 * 86400e3);
  const nm = (x) => `<span class="nm">${esc(x.r.name || x.r.email)}${x.r.group ? `<small>${esc(x.r.group)}</small>` : ""}</span>`;
  return `<div class="tiles">
      <div class="tile"><small>등록한 사람</small><b>${D.rows.length}</b><span>명</span></div>
      <div class="tile"><small>오늘 들어온 사람</small><b>${tSet.size}</b><span>명</span></div>
      <div class="tile"><small>최근 7일</small><b>${w7}</b><span>명 · ${D.rows.length ? Math.round(w7 / D.rows.length * 100) : 0}%</span></div>
      <div class="tile"><small>최근 30일</small><b>${w30}</b><span>명</span></div>
      <div class="tile"><small>알림 받는 사람</small><b>${subsN}</b><span>명 · 기기 ${devs}대</span></div>
    </div>
    <div class="sec-h">날짜별 들어온 사람 · 최근 30일</div>
    <figure class="chart"><svg viewBox="0 0 ${W + 28} ${H + 22}" role="img" aria-label="최근 30일 날짜별 들어온 사람 수"><g class="grid">${grid}</g><g class="bars">${bars}</g><g class="ticks">${ticks}</g></svg>
      <figcaption class="muted">막대에 손가락이나 마우스를 올리면 그날 들어온 사람 수와 들어온 횟수가 보여요. (같은 사람이 20분 안에 다시 열면 한 번으로 셈)</figcaption></figure>
    <details class="daytable"><summary>날짜별 숫자로 보기</summary><table class="st-t"><thead><tr><th>날짜</th><th>사람</th><th>횟수</th></tr></thead><tbody>${days.slice().reverse().map((d) => `<tr><td>${d.day}</td><td>${d.n}</td><td>${d.opens}</td></tr>`).join("")}</tbody></table></details>
    <div class="sec-h">분류별</div>
    <table class="st-t"><thead><tr><th>분류</th><th>등록</th><th>7일 안에 들어옴</th><th>한 사람 평균 외운 본문</th></tr></thead><tbody>${gRows}</tbody></table>
    <div class="sec-h">사람별 · 최근 접속순</div>
    <div class="st-wrap"><table class="st-t st-p"><thead><tr><th>이름</th><th>마지막 접속</th><th>들어온 날</th><th>본 본문</th><th>외운 본문</th><th>마지막 본 본문</th></tr></thead><tbody>
      ${ppl.map((x) => `<tr><td>${nm(x)}</td><td>${x.s ? ago(x.s.lastAt) : '<small class="never">아직</small>'}</td><td>${x.s ? (x.s.days || 1) + "일" : "-"}</td><td>${x.s ? x.s.views || 0 : "-"}</td><td>${x.s ? x.s.mem || 0 : "-"}</td><td class="ref">${x.s && x.s.lastRef ? esc(x.s.lastRef) : ""}</td></tr>`).join("")}</tbody></table></div>
    <div class="sec-h">한 번도 안 들어온 사람 · ${never.length}명</div>
    <div class="nm-list">${never.map(nm).join("") || '<span class="muted">없어요</span>'}</div>
    <div class="sec-h">30일 넘게 안 들어온 사람 · ${sleep.length}명</div>
    <div class="nm-list">${sleep.map(nm).join("") || '<span class="muted">없어요</span>'}</div>
    <p class="muted st-note">통계는 2.0 버전부터 모여요. 그 전에 들어왔던 사람은 다음에 들어올 때부터 보여요.</p>`;
}

// ── 아침 알림
function admAlarm(D) {
  const P = D.push || {}, L = D.log || {};
  if (!ADM.alarms) ADM.alarms = (P.alarms && P.alarms.length ? P.alarms : [ALARM0()]).map((a) => ({ ...a, days: [...(a.days || [])] }));
  const run = tsMs(L.lastRunAt), fresh = run && Date.now() - run < 40 * 60000;
  const status = !P.vapidKey ? `<div class="ok-box warn"><b>아직 준비 전이에요</b> 아래 '처음 한 번 설정'의 1번(웹 푸시 키)부터 해 주세요.</div>`
    : !run ? `<div class="ok-box warn"><b>알림 보내는 곳이 아직 연결되지 않았어요</b> '처음 한 번 설정'의 2·3번(GitHub)을 마치면 10분 안에 '연결됨'으로 바뀌어요.</div>`
    : fresh ? `<div class="ok-box"><b>연결됨</b> 알림 보내는 곳이 10분마다 확인하고 있어요 · 마지막 확인 ${ago(L.lastRunAt)}</div>`
    : `<div class="ok-box warn"><b>한동안 확인이 없어요</b> 마지막 확인 ${ago(L.lastRunAt)} · GitHub의 Actions 화면에서 '말씀선포 아침 알림'이 켜져 있는지 봐 주세요.</div>`;
  const devs = D.subs.reduce((a, s) => a + Object.keys(s.devices || {}).length, 0), subsN = D.subs.filter((s) => Object.keys(s.devices || {}).length).length;
  const runs = (L.runs || []).slice(-6).reverse();
  return `${status}
    <p class="muted">알림 받는 사람 <b>${subsN}명</b> · 기기 ${devs}대 · 각자 앱의 설정 → '아침 알림 받기'를 켠 사람에게만 가요.</p>
    <div class="sec-h">보낼 알림 (최대 3개)</div>
    <div id="alarmList">${ADM.alarms.map((a, i) => `<div class="al" data-i="${i}">
      <div class="al-h"><label class="sw"><input type="checkbox" data-al="on" ${a.on !== false ? "checked" : ""}><span>${a.on !== false ? "켜짐" : "꺼짐"}</span></label>
        <input type="time" data-al="time" value="${esc(a.time || "07:00")}" aria-label="보낼 시각">
        <button class="btn ghost small danger" type="button" data-adm="aldel" ${ADM.alarms.length < 2 ? "disabled" : ""}>빼기</button></div>
      <div class="al-days" role="group" aria-label="요일">${DAYS.map((d, k) => `<button class="chip" type="button" data-adm="alday" data-k="${k}" aria-pressed="${(a.days || []).includes(k)}">${d}</button>`).join("")}
        <button class="chip" type="button" data-adm="alevery">매일</button><button class="chip" type="button" data-adm="alweek">월~금</button></div>
      <label>제목<input type="text" data-al="title" value="${esc(a.title || "")}" maxlength="40" placeholder="말씀선포"></label>
      <label>문구 <small>{이름} 을 넣으면 받는 사람 이름으로 바뀌어요</small><textarea data-al="body" rows="2" maxlength="160">${esc(a.body || "")}</textarea></label>
      <div class="al-prev"><img src="icons/icon-192.png" alt=""><span><b>${esc((a.title || "말씀선포"))}</b>${esc((a.body || "").replace(/\{이름\}/g, S.user.name || "홍길동"))}</span></div>
    </div>`).join("")}</div>
    <div class="row-btns"><button class="btn" type="button" data-adm="alsave">알림 저장</button>
      ${ADM.alarms.length < 3 ? '<button class="btn ghost small" type="button" data-adm="aladd">+ 알림 하나 더</button>' : ""}</div>
    <div class="sec-h">시험해 보기</div>
    <div class="row-btns"><button class="btn ghost small" type="button" data-adm="alpreview">이 기기에 모양만 미리 보기</button>
      <button class="btn ghost small" type="button" data-adm="altest" ${P.vapidKey ? "" : "disabled"}>나에게 진짜 알림 보내 보기</button></div>
    <p class="muted">'진짜 알림'은 알림 보내는 곳이 다음 확인 때(10분 안) 내 계정의 알림 켠 기기로 보내요. 먼저 설정 → 아침 알림 받기를 켜 두세요.${P.testReq ? ` · 마지막 요청 ${ago(P.testReq.at)}${L.testDone && L.testDone >= P.testReq.at ? " → 보냈어요" : " → 기다리는 중"}` : ""}</p>
    ${runs.length ? `<div class="sec-h">최근 보낸 기록</div><table class="st-t"><thead><tr><th>때</th><th>알림</th><th>보냄</th><th>실패</th></tr></thead><tbody>${runs.map((r) =>
      `<tr><td>${ago(r.at)}</td><td>${esc(r.label || r.id || "")}</td><td>${r.sent || 0}</td><td>${r.failed || 0}${r.removed ? `<small> (안 쓰는 기기 ${r.removed} 정리)</small>` : ""}</td></tr>`).join("")}</tbody></table>` : ""}
    <div class="sec-h">처음 한 번 설정</div>
    <details class="howto" ${P.vapidKey && run ? "" : "open"}><summary>순서 보기 (10분 정도 · 한 번만)</summary>
      <ol>
        <li><b>웹 푸시 키 만들기</b> — Firebase 콘솔에서 <b>amsong-99f03</b> 프로젝트 → 톱니(프로젝트 설정) → <b>클라우드 메시징</b> 탭 → 맨 아래 '웹 구성'의 <b>웹 푸시 인증서 → 키 쌍 생성</b> → 생긴 긴 키를 복사해 아래 칸에 붙여 넣고 저장</li>
        <li><b>서비스 계정 키 받기</b> — 같은 프로젝트 설정 → <b>서비스 계정</b> 탭 → <b>새 비공개 키 생성</b> → 파일(.json)이 내려받아져요. 이 파일은 아무에게도 보내지 말고 GitHub에도 올리지 마세요.</li>
        <li><b>GitHub에 넣기</b> — github.com/artist4rhythm-hub/amsong → Settings → Secrets and variables → Actions → <b>New repository secret</b> → 이름 <code>AMSONG_FIREBASE_SA</code>, 값에는 2번 파일을 텍스트 편집기로 열어 내용 전체를 붙여 넣기 → Add secret. 그다음 저장소 첫 화면 → Add file → Create new file → 이름 칸에 <code>.github/workflows/amsong-push.yml</code> → 압축 파일의 '4_알림실행파일' 안 내용을 그대로 붙여 넣고 Commit</li>
      </ol>
      <p class="muted">다 하면 이 화면 위쪽이 10분 안에 '연결됨'으로 바뀌어요. 자세한 그림 안내는 압축 파일의 읽어보세요 문서에 있어요.</p></details>
    <form class="adm-add" id="vapidForm"><label>웹 푸시 키 (1번에서 복사한 키)<input type="text" name="vapid" value="${esc(P.vapidKey || "")}" placeholder="B로 시작하는 긴 키" autocomplete="off" spellcheck="false"></label>
      <div class="row-btns"><button class="btn small" type="submit">키 저장</button></div></form>`;
}

// ── 본문 올리기
const admContent = () => `<div class="upload">
    <p class="muted" style="margin:0">제작 키트의 <b>amsong_content.json</b> 파일을 고르면 1·2·3권 본문이 올라가요. 책을 고쳐 다시 뽑았을 때도 같은 방법으로 덮어써요. (이 파일은 GitHub에 올리지 않아요)</p>
    <label class="btn ghost small" style="align-self:flex-start">파일 고르기<input type="file" accept="application/json,.json" id="contentFile" class="sr"></label>
    <span class="muted" id="upMsg"></span></div>`;

// 관리 화면의 입력 칸 연결 (글자를 칠 때마다 화면 전체를 다시 그리지 않게)
function admWire(D) {
  const $ = (id) => document.getElementById(id);
  const q = $("admQ");
  if (q) q.addEventListener("input", () => { ADM.q = q.value; $("ppList").innerHTML = admPeopleList(D); });
  const so = $("admSort");
  if (so) so.addEventListener("change", () => { ADM.sort = so.value; $("ppList").innerHTML = admPeopleList(D); });
  const all = $("selAll");
  if (all) all.addEventListener("change", () => { admFilter(D).forEach((r) => all.checked ? ADM.sel.add(r.email) : ADM.sel.delete(r.email)); viewAdmin(); });
  const pl = $("ppList");
  if (pl) pl.addEventListener("change", (e) => { const c = e.target.closest("[data-sel]"); if (!c) return; c.checked ? ADM.sel.add(c.dataset.sel) : ADM.sel.delete(c.dataset.sel); viewAdmin(); });
  const af = $("addForm");
  if (af) af.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim().toLowerCase();
    if (!email) return;
    const ex = D.rows.find((r) => r.email === email);
    try { await B.setAllow(email, { vols: checkedVols(f, "v_new"), name: f.name.value, group: f.group.value, sub: f.sub.value, ...(ex ? {} : { role: "user" }) }, !ex);
      toast(ex ? "이미 있던 사람이라 정보를 고쳤어요" : "등록했어요"); ADM.panel = null; await admLoad(true); viewAdmin(); }
    catch (err) { toast("등록하지 못했어요"); }
  });
  const bf = $("bulkForm");
  if (bf) {
    const msg = $("bulkMsg"), count = () => { const r = parseBulk(bf.lines.value, bf.group.value), ex = r.list.filter((x) => D.rows.some((y) => y.email === x.email)).length;
      msg.textContent = r.list.length || r.bad.length ? `${r.list.length}명 알아봤어요${ex ? ` (이미 있는 ${ex}명은 이름 · 분류만 고침)` : ""}${r.bad.length ? ` · 메일 주소가 없는 줄 ${r.bad.length}개는 건너뜀` : ""}` : "붙여 넣으면 몇 명인지 바로 세어 드려요."; return r; };
    bf.lines.addEventListener("input", count); bf.group.addEventListener("input", count);
    bf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const r = count(); if (!r.list.length) return toast("등록할 사람이 없어요");
      const vols = checkedVols(bf, "v_bulk");
      const list = r.list.map((x) => { const ex = D.rows.find((y) => y.email === x.email);
        return ex ? { email: x.email, exists: true, ...(x.name ? { name: x.name } : {}), ...(x.group ? { group: x.group } : {}), ...(x.sub ? { sub: x.sub } : {}) }
          : { email: x.email, name: x.name, group: x.group, sub: x.sub, vols, role: "user" }; });
      try { msg.textContent = "등록하는 중…"; await B.setAllowMany(list, true); toast(`${list.length}명 등록했어요`); ADM.panel = null; await admLoad(true); viewAdmin(); }
      catch (err) { msg.textContent = "등록하지 못했어요: " + (err.message || err); }
    });
  }
  const gf = $("grpForm");
  if (gf) gf.addEventListener("submit", async (e) => {
    e.preventDefault();
    const groups = [...new Set(gf.groups.value.split(/[,，]/).map((x) => x.trim()).filter(Boolean))].slice(0, 30);
    try { await B.setConfig("admin", { groups }); D.groups = groups.length ? groups : GROUPS0; ADM.panel = null; toast("분류 이름을 저장했어요"); viewAdmin(); }
    catch (err) { toast("저장하지 못했어요"); }
  });
  const pe = $("ppEdit");
  if (pe) pe.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = pe.dataset.email, d = { name: pe.name.value, group: pe.group.value, sub: pe.sub.value, memo: pe.memo.value, role: pe.role.value, vols: checkedVols(pe, "ev") };
    if (email === S.user.email && d.role !== "admin" && S.allow && S.allow.role === "admin" && !confirm("내 계정을 '열람'으로 바꾸면 관리 화면을 못 쓸 수 있어요. 바꿀까요?")) return;
    try { await B.setAllow(email, d); Object.assign(D.rows.find((r) => r.email === email), d); ADM.open = null; toast("저장했어요"); viewAdmin(); }
    catch (err) { toast("저장하지 못했어요"); }
  });
  const al = $("alarmList");
  if (al) al.addEventListener("input", (e) => {
    const f = e.target.closest("[data-al]"); if (!f) return;
    const a = ADM.alarms[Number(f.closest(".al").dataset.i)], k = f.dataset.al;
    a[k] = k === "on" ? f.checked : f.value;
    if (k === "on") f.nextElementSibling.textContent = f.checked ? "켜짐" : "꺼짐";
    if (k === "title" || k === "body") { const pv = f.closest(".al").querySelector(".al-prev span"); pv.innerHTML = `<b>${esc(a.title || "말씀선포")}</b>${esc((a.body || "").replace(/\{이름\}/g, S.user.name || "홍길동"))}`; }
  });
  const vf = $("vapidForm");
  if (vf) vf.addEventListener("submit", async (e) => {
    e.preventDefault();
    const k = vf.vapid.value.trim().replace(/\s+/g, "");
    if (k && !/^[A-Za-z0-9_-]{60,120}$/.test(k)) return toast("키 모양이 달라요. 'B'로 시작하는 긴 글자를 그대로 붙여 넣어 주세요");
    try { await B.setConfig("push", { vapidKey: k }); D.push.vapidKey = k; toast("웹 푸시 키를 저장했어요"); viewAdmin(); } catch (err) { toast("저장하지 못했어요"); }
  });
  const cf = $("contentFile");
  if (cf) cf.addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const msg = $("upMsg");
    try {
      const json = JSON.parse(await file.text());
      msg.textContent = "올리는 중…";
      const n = await B.uploadContent(json, (d, t) => { msg.textContent = `올리는 중… ${d} / ${t}`; });
      S.books = {}; S.stages = {};
      msg.textContent = `다 올렸어요 (${n}개 문서). 서재에서 확인해 보세요.`;
    } catch (err) { msg.textContent = "올리지 못했어요: " + (err.message || err); }
  });
}

async function admClick(t) {
  const D = ADM.data; if (!D) return;
  const act = t.dataset.adm, row = t.closest("[data-email]"), email = row && row.dataset.email;
  switch (act) {
    case "reload": await admLoad(true); ADM.alarms = null; viewAdmin(); toast("새로 불러왔어요"); break;
    case "panel": ADM.panel = t.dataset.v || null; viewAdmin(); break;
    case "grp": ADM.grp = t.dataset.v; viewAdmin(); break;
    case "ppopen": ADM.open = ADM.open === email ? null : email; viewAdmin(); break;
    case "ppclose": ADM.open = null; viewAdmin(); break;
    case "ppdel": {
      if (email === S.user.email) return toast("내 계정은 지울 수 없어요");
      if (!confirm(`${email} 을(를) 지울까요? 더 이상 책을 볼 수 없어요.`)) return;
      try { await B.deleteAllow(email); D.rows = D.rows.filter((r) => r.email !== email); ADM.sel.delete(email); ADM.open = null; toast("지웠어요"); viewAdmin(); } catch (e) { toast("지우지 못했어요"); }
      break;
    }
    case "csv": csvDownload(D); break;
    case "selnone": ADM.sel.clear(); viewAdmin(); break;
    case "selgroup": case "selvols": {
      const emails = [...ADM.sel]; if (!emails.length) return;
      const g = document.getElementById("selGroup").value.trim(), vols = checkedVols(document.getElementById("selBar"), "v_sel");
      const d = act === "selgroup" ? { group: g } : { vols };
      if (act === "selgroup" && !g && !confirm("분류를 비울까요?")) return;
      try { await B.setAllowMany(emails.map((e) => ({ email: e, ...d }))); D.rows.forEach((r) => { if (ADM.sel.has(r.email)) Object.assign(r, d); });
        toast(`${emails.length}명의 ${act === "selgroup" ? "분류" : "볼 수 있는 책"}를 바꿨어요`); viewAdmin(); } catch (e) { toast("바꾸지 못했어요"); }
      break;
    }
    case "seldel": {
      const emails = [...ADM.sel].filter((e) => e !== S.user.email); if (!emails.length) return toast("내 계정은 지울 수 없어요");
      if (!confirm(`고른 ${emails.length}명을 지울까요? 더 이상 책을 볼 수 없어요.`)) return;
      try { await B.deleteAllowMany(emails); D.rows = D.rows.filter((r) => !emails.includes(r.email)); ADM.sel.clear(); toast(`${emails.length}명을 지웠어요`); viewAdmin(); } catch (e) { toast("지우지 못했어요"); }
      break;
    }
    case "reqok": case "reqall": {
      const forms = act === "reqall" ? [...document.querySelectorAll("form.rq")] : [t.closest("form.rq")];
      if (act === "reqall" && !confirm(`${forms.length}명의 요청을 모두 허용할까요? (각 줄에 적은 분류 · 책으로)`)) return;
      const list = forms.map((f) => ({ email: f.dataset.email, name: f.name.value, group: f.group.value, sub: f.sub.value, vols: checkedVols(f, "rv"), role: "user" }));
      try { await B.approveRequests(list); toast(`${list.length}명을 허용했어요`); await admLoad(true); viewAdmin(); } catch (e) { toast("허용하지 못했어요"); }
      break;
    }
    case "reqno": {
      if (!confirm(`${email} 의 요청을 거절(지우기)할까요?`)) return;
      try { await B.deleteRequest(email); D.reqs = D.reqs.filter((r) => r.email !== email); viewAdmin(); } catch (e) { toast("지우지 못했어요"); }
      break;
    }
    case "alday": case "alevery": case "alweek": {
      const a = ADM.alarms[Number(t.closest(".al").dataset.i)], k = Number(t.dataset.k);
      if (act === "alevery") a.days = [0, 1, 2, 3, 4, 5, 6]; else if (act === "alweek") a.days = [1, 2, 3, 4, 5];
      else a.days = a.days.includes(k) ? a.days.filter((x) => x !== k) : [...a.days, k].sort();
      viewAdmin(); break;
    }
    case "aladd": if (ADM.alarms.length < 3) { ADM.alarms.push({ ...ALARM0(), time: "21:00", body: "{이름}님, 오늘 외운 말씀을 한 번 더 선포해 볼까요?" }); viewAdmin(); } break;
    case "aldel": ADM.alarms.splice(Number(t.closest(".al").dataset.i), 1); viewAdmin(); break;
    case "alsave": {
      const bad = ADM.alarms.find((a) => !/^\d{2}:\d{2}$/.test(a.time || "") || !(a.days || []).length || !(a.body || "").trim());
      if (bad) return toast("시각 · 요일 · 문구를 모두 정해 주세요");
      const alarms = ADM.alarms.map((a) => ({ id: a.id, on: a.on !== false, time: a.time, days: a.days, title: (a.title || "말씀선포").trim(), body: a.body.trim() }));
      try { await B.setConfig("push", { alarms }); D.push.alarms = alarms; toast("알림을 저장했어요"); } catch (e) { toast("저장하지 못했어요"); }
      break;
    }
    case "alpreview": {
      const a = ADM.alarms[0] || ALARM0();
      try {
        if (!("Notification" in window)) return toast("이 브라우저는 알림을 띄울 수 없어요");
        const p = await Notification.requestPermission(); if (p !== "granted") return toast("알림 허용을 눌러 주세요");
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(a.title || "말씀선포", { body: (a.body || "").replace(/\{이름\}/g, S.user.name || ""), icon: "icons/icon-192.png", tag: "amsong-preview" });
      } catch (e) { toast("미리 보기를 띄우지 못했어요"); }
      break;
    }
    case "altest": {
      try { const at = Date.now(); await B.setConfig("push", { testReq: { uid: S.user.uid, at } }); D.push.testReq = { uid: S.user.uid, at }; toast("10분 안에 내 기기로 시험 알림이 가요"); viewAdmin(); } catch (e) { toast("요청하지 못했어요"); }
      break;
    }
  }
}

// ───────── 클릭 처리
document.addEventListener("click", async (e) => {
  const nav = e.target.closest("a[data-nav]");
  if (nav && !e.metaKey && !e.ctrlKey) { e.preventDefault(); location.replace(nav.getAttribute("href")); return; }
  const t = e.target.closest("[data-act],[data-adm],[data-hide],[data-say],[data-pref],[data-tok],[data-line],[data-libvol],[data-tool],[data-memo]");
  if (!t) return;
  if (t.dataset.adm) return admClick(t);
  if (t.dataset.tool) { PEN.tool = t.dataset.tool; setPref("penTool", PEN.tool); S.view.memoEdit = null; refreshPenBar(); refreshVerses(); return; }
  if (t.dataset.memo) { S.view.memoEdit = t.dataset.memo; refreshVerses(); return; }
  if (t.dataset.libvol) {
    const v = t.dataset.libvol;
    if (v !== LIB.vol) location.replace("#/b/" + v);
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
    const bar = k.indexOf("|"), pid = bar >= 0 ? k.slice(0, bar) : S.ctx.p.id;
    const pp = findP(pid) || S.ctx.p, [vi, li] = k.slice(bar + 1).split("-").map(Number);
    t.outerHTML = hideLine(pp, weakSet(S.marks[pid]), v, vi, li, bar >= 0 ? pid + "|" : "");
    return;
  }
  if (t.dataset.hide) { v.hide = t.dataset.hide; setPref("hide", v.hide); v.open = new Set(); v.openAll = false; return render(); }
  if (t.dataset.say) {
    const d = Number(t.dataset.say);
    v.say = d === 0 ? 0 : Math.max(0, (v.say || 0) + d);
    return render();
  }
  if (t.dataset.pref) { setPref(t.dataset.pref, t.dataset.val); if (t.dataset.pref === "theme") { closeThemePop(); toast((THEMES.find((x) => x.id === t.dataset.val) || {}).label + "(으)로 바꿨어요"); } applyTheme(); return render(); }
  switch (t.dataset.act) {
    case "signin":
      try { await B.signIn(); } catch (err) { toast("로그인하지 못했어요: " + (err.code || err.message)); }
      break;
    case "signout": await B.signOut(); location.hash = "#/"; break;
    case "recheck": await boot(S.user); break;
    case "theme": openThemePop(); break;
    case "themeclose": closeThemePop(); break;
    case "libflip": libTurn(() => { LIB.side = LIB.side ? 0 : 1; setPref("libSide", String(LIB.side)); }); break;
    case "openall": v.openAll = !v.openAll; v.open = new Set(); render(); break;
    case "drawer": S.drawer = !S.drawer; render(); break;
    case "bkprev": bkFlip(-1); break;
    case "bknext": bkFlip(1); break;
    case "pen": PEN.on = !PEN.on; v.memoEdit = null; refreshPenBar(); refreshVerses(); break;
    case "penclear": {
      const pids = S.ctx.visible || [S.ctx.p.id];
      const ns = pids.map((pid) => [pid, notesFor(pid)]).filter(([, n]) => Object.keys(n.hl).length || Object.keys(n.ul).length);
      if (!ns.length) { toast("지울 표시가 없어요"); break; }
      if (!confirm(`${S.ctx.book ? "펼친 두 쪽" : "이 본문"}의 형광펜과 밑줄을 모두 지울까요? (메모는 남아요)`)) break;
      ns.forEach(([pid, n]) => { n.hl = {}; n.ul = {}; saveNotes(pid); });
      refreshVerses(); toast("표시를 모두 지웠어요");
      break;
    }
    case "memosave": case "memodel": {
      const [pid, vi] = t.dataset.k.split(":"), n = notesFor(pid);
      const ta = document.querySelector(".memo-edit textarea");
      const text = t.dataset.act === "memosave" && ta ? ta.value.trim() : "";
      if (text) n.memo[vi] = text; else delete n.memo[vi];
      v.memoEdit = null; saveNotes(pid); refreshVerses();
      break;
    }
    case "memocancel": v.memoEdit = null; refreshVerses(); break;
    case "memo": {
      const id = t.dataset.pid || S.ctx.p.id, on = !memorized(id);
      S.userDoc.memorized = S.userDoc.memorized || {};
      if (on) S.userDoc.memorized[id] = true; else delete S.userDoc.memorized[id];
      render();
      B.setMemorized(S.user.uid, id, on).catch(() => toast("저장하지 못했어요"));
      B.logMem(S.user, Object.keys(S.userDoc.memorized).length).catch(() => {});
      if (on) toast("외운 본문으로 표시했어요");
      break;
    }
    case "recstart": recStart(); break;
    case "recstop": if (v.recorder && v.recorder.state !== "inactive") v.recorder.stop(); break;
    case "recagain":
      if (v.url) URL.revokeObjectURL(v.url);
      v.url = null; v.rec = "idle"; v.marks = {}; v.result = null; v.saved = false; render(); break;
    case "recsave": recSave(); break;
    case "install": if (BIP) { BIP.prompt(); const r = await BIP.userChoice.catch(() => null); if (r && r.outcome === "accepted") toast("설치했어요"); BIP = null; t.hidden = true; } break;
    case "insttab": S.instTab = t.dataset.v; viewInstall(); break;
    case "copyurl": const u = location.origin + location.pathname.replace(/index\.html$/, ""); try { await navigator.clipboard.writeText(u); toast("주소를 복사했어요"); } catch (err) { toast(u); } break;
    case "reqedit": S.reqEdit = true; render(); break;
    case "reqcancel": S.reqEdit = false; render(); break;
    case "pushon": pushEnable(); break;
    case "pushoff": pushDisable(); break;
    case "pushrm": if (confirm("이 기기는 더 이상 알림을 받지 않게 뺄까요?")) pushDisable(t.dataset.v); break;
    case "nudgex": setPref(t.dataset.v, "x"); t.closest(".nudge").remove(); break;
  }
});
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t.dataset && t.dataset.line) { e.preventDefault(); t.click(); }
});

// 옆으로 밀어 넘기기 (폰 · 패드 모두)
// 손가락이 처음 12px 움직일 때 가로/세로를 정하고, 가로면 화면 옆에 '다음 본문' 표시를 띄워 줌
const SW = { x: null, y: null, axis: null, dir: 0 };
const swCue = () => document.getElementById("swipeCue") || (() => { const d = document.createElement("div"); d.id = "swipeCue"; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d); return d; })();
function swTarget(dir) {
  const h = location.hash.replace(/^#\/?/, "");
  if (/^b\//.test(h) && !spreadMode()) return (dir > 0 && LIB.side === 0) || (dir < 0 && LIB.side === 1) ? (dir > 0 ? "단계 · 진도" : "이어서 외우기") : null;
  if (!S.ctx || !location.hash.startsWith("#/p/") || S.ctx.mode === "rec") return null;
  if (PEN.on && S.ctx.mode === "read") return null;
  if (S.ctx.book) return dir > 0 ? "다음 쪽" : "앞 쪽";
  const n = dir > 0 ? S.ctx.nb.next : S.ctx.nb.prev;
  return n ? (dir > 0 ? "다음 본문" : "이전 본문") + " · " + n.ref.replace(/Ⓐ/g, "") : null;
}
function swHide() { const c = document.getElementById("swipeCue"); if (c) c.className = ""; }
document.addEventListener("touchstart", (e) => {
  SW.x = null; SW.axis = null;
  if (e.touches.length !== 1) return;
  const x = e.touches[0].clientX;
  // 화면 가장자리에서 시작한 밀기는 기기의 '뒤로 가기' 몸짓이라 건드리지 않음
  if (x < 24 || x > window.innerWidth - 24) return;
  if (e.target.closest("audio, input, textarea, select, .drawer, #themePop")) return;
  SW.x = x; SW.y = e.touches[0].clientY;
}, { passive: true });
document.addEventListener("touchmove", (e) => {
  if (SW.x === null || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - SW.x, dy = e.touches[0].clientY - SW.y;
  if (!SW.axis) {
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    SW.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
  }
  if (SW.axis !== "x") return;
  const dir = dx < 0 ? 1 : -1, label = swTarget(dir);
  const c = swCue();
  if (!label) { c.className = ""; return; }
  c.textContent = (dir > 0 ? "" : "‹ ") + label + (dir > 0 ? " ›" : "");
  c.className = "on " + (dir > 0 ? "r" : "l") + (Math.abs(dx) >= 56 ? " go" : "");
}, { passive: true });
document.addEventListener("touchend", (e) => {
  if (SW.x === null) return;
  const dx = e.changedTouches[0].clientX - SW.x, axis = SW.axis;
  SW.x = null; SW.axis = null; swHide();
  if (axis !== "x" || Math.abs(dx) < 56) return;
  const dir = dx < 0 ? 1 : -1;
  if (!swTarget(dir)) return;
  const h = location.hash.replace(/^#\/?/, "");
  if (/^b\//.test(h) && !spreadMode()) { libTurn(() => { LIB.side = LIB.side ? 0 : 1; setPref("libSide", String(LIB.side)); }); return; }
  if (S.ctx.book) { bkFlip(dir); return; }
  const n = dir > 0 ? S.ctx.nb.next : S.ctx.nb.prev;
  if (n) location.replace(`#/p/${n.vol}/${n.num}/${n.no}?m=${S.ctx.mode}`);
}, { passive: true });
document.addEventListener("touchcancel", () => { SW.x = null; SW.axis = null; swHide(); }, { passive: true });

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
  if (location.hash.split("?")[0] === "#/install") { document.documentElement.classList.remove("sky-quiet"); return viewInstall(); }
  if (!S.user) { document.documentElement.classList.remove("sky-quiet"); return viewLogin(); }
  if (!S.allow && !S.admin) return viewPending();
  const { parts, q } = parseHash();
  // 같은 화면을 다시 그릴 때는 스크롤 위치 유지, 다른 화면으로 가면 맨 위로
  const route = location.hash.split("?")[0];
  const sameRoute = S._route === route;
  if (!sameRoute) S.drawer = false;
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
    else if (r === "b") await viewBook(a, !sameRoute);
    else if (r === "s") await viewStage(a, Number(b2));
    else if (r === "p") await viewPassage(a, Number(b2), Number(c), q);
    else if (r === "x") await viewExtra(a, b2);
    else if (r === "l") await viewList(a, Number(b2), Number(c));
    else if (r === "settings") await viewSettings();
    else if (r === "admin") await viewAdmin(q);
    else go("#/");
  } catch (err) {
    if (my !== rendering) return;
    console.error(err);
    notePage("#/", "불러오지 못했어요",
      err && err.code === "permission-denied" ? "이 본문을 볼 권한이 없어요." : "인터넷 연결을 확인한 뒤 다시 열어 주세요.",
      '<a class="btn" href="#/">서재로</a>');
  }
  if (my !== rendering) return;
  skyQuiet();
  window.scrollTo(0, sameRoute ? keepY : 0);
  const nl = document.querySelector('[data-keep="l"]'), nr = document.querySelector('[data-keep="r"]');
  if (nl && S._keepL != null) nl.scrollTop = S._keepL;
  if (nr && keepR != null) nr.scrollTop = keepR;
}

// ───────── 시작
async function boot(user) {
  Object.keys(NOTES).forEach((k) => delete NOTES[k]);
  S.user = user; S.allow = null; S.admin = false; S.userDoc = {}; S.books = {}; S.stages = {}; S.marks = {}; S.weak = null;
  S.myReq = undefined; S.reqEdit = false; S.pushCfg = undefined; S.myPush = undefined; ADM.data = null; ADM.alarms = null; ADM.sel.clear();
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
    logVisitOnce();
    B.getConfig("push").then((c) => { S.pushCfg = c; if (c && c.vapidKey && !location.hash.replace(/^#\/?/, "")) render(); }).catch(() => {});
    B.getMyPush(user.uid).then((m) => { S.myPush = m; }).catch(() => {});
  }
  render();
}

applyTheme();
buildSky();
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
