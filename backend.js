// Firebase 연결 (로그인 · 열람 허용 · 본문 · 내 암송 기록)
// 말씀암송 앱 전용 Firebase 프로젝트를 씁니다 (교사 선교사 등 다른 앱과 분리). 컬렉션 이름은 amsong_ 으로 시작합니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, getDocFromCache, getDocFromServer, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit,
  where, documentId, writeBatch, serverTimestamp, increment, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// 한 번 열어 본 본문은 기기에 남아 인터넷이 끊겨도 다시 볼 수 있어요.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const lower = (s) => (s || "").trim().toLowerCase();

// 기기에 보관된 것이 있으면 바로 쓰고(빠름), 뒤에서 서버의 새 내용을 받아 다음번을 위해 보관
async function cacheFirst(ref) {
  try {
    const c = await getDocFromCache(ref);
    if (c.exists()) { getDocFromServer(ref).catch(() => {}); return c; }
  } catch (e) {}
  return getDoc(ref);
}

export function onAuth(cb) {
  getRedirectResult(auth).catch(() => {});
  return onAuthStateChanged(auth, (u) => {
    cb(u ? { uid: u.uid, email: lower(u.email), name: u.displayName || "" } : null);
  });
}

export async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // 팝업이 막힌 기기(일부 홈 화면 앱 등)는 페이지 이동 방식으로
    if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) {
      await signInWithRedirect(auth, provider);
    } else if (e && e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      throw e;
    }
  }
}

export const signOut = () => fbSignOut(auth);

// ── 열람 허용
export async function getAllow(email) {
  try {
    const s = await getDoc(doc(db, "amsong_allow", lower(email)));
    return s.exists() ? s.data() : null;
  } catch (e) {
    return null;
  }
}

export async function isAdmin() {
  try {
    await getDocs(query(collection(db, "amsong_allow"), limit(1)));
    return true;
  } catch (e) {
    return false;
  }
}

export async function listAllow() {
  const s = await getDocs(collection(db, "amsong_allow"));
  return s.docs.map((d) => ({ email: d.id, ...d.data() })).sort((a, b) => a.email.localeCompare(b.email));
}

// 사람 정보: 볼 수 있는 책 · 역할 · 이름 · 분류 · 세부(학년 · 반 등) · 메모
// 넘겨준 칸만 고침 (예전처럼 저장할 때 이름이 지워지지 않게)
const ALLOW_KEYS = ["vols", "role", "name", "group", "sub", "memo"];
function allowData(data, isNew) {
  const d = { updatedAt: serverTimestamp() };
  ALLOW_KEYS.forEach((k) => { if (data[k] !== undefined) d[k] = typeof data[k] === "string" ? data[k].trim() : data[k]; });
  if (isNew) {
    d.createdAt = serverTimestamp(); d.addedBy = lower(auth.currentUser && auth.currentUser.email);
    if (!d.vols) d.vols = []; if (!d.role) d.role = "user";
  }
  return d;
}
export async function setAllow(email, data, isNew = false) {
  await setDoc(doc(db, "amsong_allow", lower(email)), allowData(data, isNew), { merge: true });
}
// 여러 명 한꺼번에 (등록 · 분류 바꾸기 · 책 바꾸기 · 삭제)
export async function setAllowMany(list, isNew = false) {
  for (let i = 0; i < list.length; i += 400) {
    const b = writeBatch(db);
    list.slice(i, i + 400).forEach((x) => b.set(doc(db, "amsong_allow", lower(x.email)), allowData(x, isNew && !x.exists), { merge: true }));
    await b.commit();
  }
}
export async function deleteAllowMany(emails) {
  for (let i = 0; i < emails.length; i += 400) {
    const b = writeBatch(db);
    emails.slice(i, i + 400).forEach((e) => b.delete(doc(db, "amsong_allow", lower(e))));
    await b.commit();
  }
}

// ── 열람 요청: 처음 들어온 사람이 이름을 남기면 관리자가 [허용]만 누름
export async function getMyRequest(email) {
  try { const s = await getDoc(doc(db, "amsong_requests", lower(email))); return s.exists() ? s.data() : null; } catch (e) { return null; }
}
export const requestAccess = (user, name, note) => setDoc(doc(db, "amsong_requests", lower(user.email)), {
  name: (name || "").trim().slice(0, 60), note: (note || "").trim().slice(0, 200), dname: (user.name || "").slice(0, 60), uid: user.uid, at: serverTimestamp()
});
export async function listRequests() {
  const s = await getDocs(collection(db, "amsong_requests"));
  return s.docs.map((d) => ({ email: d.id, ...d.data() }));
}
export const deleteRequest = (email) => deleteDoc(doc(db, "amsong_requests", lower(email)));
// 요청을 허용: 사람으로 등록 + 요청 지우기 (한 번에)
export async function approveRequests(list) {
  for (let i = 0; i < list.length; i += 200) {
    const b = writeBatch(db);
    list.slice(i, i + 200).forEach((x) => {
      b.set(doc(db, "amsong_allow", lower(x.email)), allowData(x, true), { merge: true });
      b.delete(doc(db, "amsong_requests", lower(x.email)));
    });
    await b.commit();
  }
}

// ── 설정 (관리자가 정함): admin = 분류 이름 · push = 알림 시각 · 문구 · 웹 푸시 키 / pushLog = 알림 보내는 곳이 남기는 기록
export async function getConfig(id) {
  try { const s = await getDoc(doc(db, "amsong_config", id)); return s.exists() ? s.data() : null; } catch (e) { return null; }
}
export const setConfig = (id, data) => setDoc(doc(db, "amsong_config", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });

// ── 접속 통계 (관리자만 봄)
//  amsong_stats_users/{uid}: 마지막 접속 · 들어온 횟수 · 들어온 날 수 · 본 본문 수 · 외운 본문 수
//  amsong_stats_days/{날짜}: { uid: 그날 들어온 횟수 }
export const kstDay = (t = Date.now()) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
export async function logVisit(user, info) {
  const ref = doc(db, "amsong_stats_users", user.uid), day = kstDay();
  let old = null;
  try { const s = await getDoc(ref); old = s.exists() ? s.data() : null; } catch (e) {}
  const d = { email: lower(user.email), name: (user.name || "").slice(0, 60), lastAt: serverTimestamp(), lastDay: day, visits: increment(1), kind: info.kind || "", app: !!info.app };
  if (typeof info.mem === "number") d.mem = info.mem;
  if (!old) { d.firstAt = serverTimestamp(); d.days = 1; d.views = 0; }
  else if (old.lastDay !== day) d.days = increment(1);
  await setDoc(ref, d, { merge: true });
  await setDoc(doc(db, "amsong_stats_days", day), { [user.uid]: increment(1) }, { merge: true });
}
export const logView = (user, ref, mem) => setDoc(doc(db, "amsong_stats_users", user.uid), {
  email: lower(user.email), views: increment(1), lastRef: String(ref || "").slice(0, 80), lastAt: serverTimestamp(), ...(typeof mem === "number" ? { mem } : {})
}, { merge: true });
export const logMem = (user, mem) => setDoc(doc(db, "amsong_stats_users", user.uid), { email: lower(user.email), mem }, { merge: true });
export async function listStatsUsers() {
  const s = await getDocs(collection(db, "amsong_stats_users"));
  return s.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
export async function listStatsDays(n = 30) {
  const from = kstDay(Date.now() - (n - 1) * 86400e3);
  const s = await getDocs(query(collection(db, "amsong_stats_days"), where(documentId(), ">=", from)));
  return s.docs.map((d) => ({ day: d.id, u: d.data() }));
}

// ── 알림 (이 기기로 받기)
//  amsong_push/{uid}: { email, on, devices: { 열쇠: { t: 토큰, label, kind, at } } }
const MSG_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
export async function pushSupported() {
  try { const m = await import(MSG_URL); return await m.isSupported(); } catch (e) { return false; }
}
export async function pushGetToken(vapidKey, reg) {
  const m = await import(MSG_URL);
  if (!(await m.isSupported())) throw new Error("unsupported");
  return m.getToken(m.getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
}
export async function pushDeleteToken() {
  try { const m = await import(MSG_URL); await m.deleteToken(m.getMessaging(app)); } catch (e) {}
}
export async function getMyPush(uid) {
  try { const s = await getDoc(doc(db, "amsong_push", uid)); return s.exists() ? s.data() : null; } catch (e) { return null; }
}
export const savePushDevice = (user, key, dev) => setDoc(doc(db, "amsong_push", user.uid), {
  email: lower(user.email), on: true, devices: { [key]: { ...dev, at: serverTimestamp() } }, updatedAt: serverTimestamp()
}, { merge: true });
export const removePushDevice = (user, key) => updateDoc(doc(db, "amsong_push", user.uid), { [`devices.${key}`]: deleteField(), updatedAt: serverTimestamp() });
export async function listPush() {
  const s = await getDocs(collection(db, "amsong_push"));
  return s.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export const deleteAllow = (email) => deleteDoc(doc(db, "amsong_allow", lower(email)));

// ── 본문
export async function getBook(vol) {
  const s = await cacheFirst(doc(db, "amsong_books", String(vol)));
  return s.exists() ? s.data() : null;
}

export async function getStage(vol, num) {
  const s = await cacheFirst(doc(db, "amsong_books", String(vol), "stages", String(num)));
  return s.exists() ? s.data() : null;
}

export async function uploadContent(content, onStep) {
  if (!content || content.format !== "amsong-content-1") throw new Error("본문 파일 형식이 맞지 않아요.");
  let batch = writeBatch(db), n = 0, done = 0;
  const total = Object.keys(content.books).length + Object.keys(content.stages).length;
  const flush = async () => { await batch.commit(); batch = writeBatch(db); n = 0; };
  for (const [vol, b] of Object.entries(content.books)) {
    batch.set(doc(db, "amsong_books", vol), { ...b, uploadedAt: serverTimestamp() });
    n++; done++;
  }
  for (const st of Object.values(content.stages)) {
    batch.set(doc(db, "amsong_books", st.vol, "stages", String(st.num)), st);
    n++; done++;
    if (n >= 20) { await flush(); onStep && onStep(done, total); }
  }
  if (n) await flush();
  onStep && onStep(total, total);
  return total;
}

// ── 내 암송 기록
export async function getUserDoc(uid) {
  const s = await getDoc(doc(db, "amsong_users", uid));
  return s.exists() ? s.data() : {};
}

// 지난 위치: 전체 마지막 + 책(권)마다 마지막
export const setLast = (uid, last) =>
  setDoc(doc(db, "amsong_users", uid), {
    last: { ...last, at: serverTimestamp() },
    lastByVol: { [last.vol]: { num: last.num, no: last.no, ref: last.ref, label: last.label } }
  }, { merge: true });

export const setMemorized = (uid, pid, on) =>
  setDoc(doc(db, "amsong_users", uid), { memorized: { [pid]: on ? serverTimestamp() : deleteField() } }, { merge: true });

export async function getMarks(uid, pid) {
  const s = await cacheFirst(doc(db, "amsong_users", uid, "marks", pid));
  return s.exists() ? s.data() : null;
}

// marks: { "절-줄-낱말": "miss" | "skip" | "hes" }
export async function addMarks(uid, pid, marks, info) {
  const words = {};
  for (const [k, t] of Object.entries(marks)) words[k] = { [t]: increment(1), n: increment(1) };
  const count = Object.keys(marks).length;
  await setDoc(doc(db, "amsong_users", uid, "marks", pid), {
    words, total: increment(count), sessions: increment(1), lastCount: count,
    lastAt: serverTimestamp(), ref: info.ref, vol: info.vol, num: info.num, no: info.no
  }, { merge: true });
}

// 형광펜 · 밑줄 · 메모 (본문마다 한 문서): hl{낱말: 색} · ul{낱말: 색} · memo{절: 글}
export async function getNotes(uid, pid) {
  const s = await cacheFirst(doc(db, "amsong_users", uid, "notes", pid));
  return s.exists() ? s.data() : null;
}
export const setNotes = (uid, pid, d) =>
  setDoc(doc(db, "amsong_users", uid, "notes", pid), {
    hl: d.hl || {}, ul: d.ul || {}, memo: d.memo || {},
    ref: d.ref || "", vol: d.vol || "", num: d.num || 0, no: d.no || 0, updatedAt: serverTimestamp()
  });

export async function weakList(uid, n = 8) {
  const s = await getDocs(query(collection(db, "amsong_users", uid, "marks"), orderBy("total", "desc"), limit(n)));
  return s.docs.map((d) => ({ pid: d.id, ...d.data() })).filter((x) => (x.total || 0) > 0);
}
