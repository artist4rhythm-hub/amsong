// ① Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 일반 → "내 앱"의 웹 앱 → SDK 설정 및 구성 → "구성"
//    에 나오는 값을 아래에 그대로 붙여 넣으세요. (daniel-amatz 프로젝트)
//    이 값들은 공개되어도 괜찮은 '주소' 정보입니다. 본문 보호는 Firestore 보안 규칙이 맡습니다.
export const firebaseConfig = {
  apiKey: "여기에_apiKey",
  authDomain: "daniel-amatz.firebaseapp.com",
  projectId: "daniel-amatz",
  storageBucket: "daniel-amatz.appspot.com",
  messagingSenderId: "여기에_messagingSenderId",
  appId: "여기에_appId"
};
