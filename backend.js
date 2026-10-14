// Firebase 연결 (로그인 · 열람 허용 · 본문 · 내 암송 기록)
// 컬렉션 이름은 모두 amsong_ 으로 시작해서 같은 프로젝트의 다른 앱(교사 선교사 등)과 섞이지 않습니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, limit,
  writeBatch, serverTimestamp, increment, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// 한 번 열어 본 본문은 기기에 남아 인터넷이 끊겨도 다시 볼 수 있어요.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const lower = (s) => (s || "").trim().toLowerCase();

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

export async function setAllow(email, data) {
  await setDoc(doc(db, "amsong_allow", lower(email)), {
    vols: data.vols || [], role: data.role || "user", name: data.name || "",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export const deleteAllow = (email) => deleteDoc(doc(db, "amsong_allow", lower(email)));

// ── 본문
export async function getBook(vol) {
  const s = await getDoc(doc(db, "amsong_books", String(vol)));
  return s.exists() ? s.data() : null;
}

export async function getStage(vol, num) {
  const s = await getDoc(doc(db, "amsong_books", String(vol), "stages", String(num)));
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

export const setLast = (uid, last) =>
  setDoc(doc(db, "amsong_users", uid), { last: { ...last, at: serverTimestamp() } }, { merge: true });

export const setMemorized = (uid, pid, on) =>
  setDoc(doc(db, "amsong_users", uid), { memorized: { [pid]: on ? serverTimestamp() : deleteField() } }, { merge: true });

export async function getMarks(uid, pid) {
  const s = await getDoc(doc(db, "amsong_users", uid, "marks", pid));
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

export async function weakList(uid, n = 8) {
  const s = await getDocs(query(collection(db, "amsong_users", uid, "marks"), orderBy("total", "desc"), limit(n)));
  return s.docs.map((d) => ({ pid: d.id, ...d.data() })).filter((x) => (x.total || 0) > 0);
}
