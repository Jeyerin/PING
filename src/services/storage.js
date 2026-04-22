// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 앱 데이터를 기기에 저장하고 불러오는 서비스 파일
//
// 이 파일에서 하는 일:
//  1. 달력에 업로드한 사진을 날짜별로 저장·조회·삭제한다
//  2. 파트너 이름과 푸시 토큰 정보를 저장·조회한다
//
// AsyncStorage란?
//  - React Native에서 기기 로컬에 데이터를 저장하는 저장소다.
//  - 웹의 localStorage와 비슷한 개념이다.
//  - key(문자열) → value(문자열) 형태로 저장된다.
//  - 앱을 껐다 켜도 데이터가 유지된다.
//  - 복잡한 객체를 저장할 때는 JSON.stringify로 문자열로 변환해서 넣고,
//    꺼낼 때는 JSON.parse로 다시 객체로 변환한다.
// ─────────────────────────────────────────────────────────────────────────────

// AsyncStorage: 기기 내 영구 저장소 접근 라이브러리
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── 저장소 키 상수 ───────────────────────────────────────────────────────────
// AsyncStorage는 키-값 저장소이므로, 어떤 키로 저장할지 상수로 정의해둔다.
// 오타를 방지하고 여러 파일에서 일관되게 사용하기 위함이다.
const PHOTO_KEY = 'couple_photos';   // 날짜별 사진 URI들을 담는 객체의 키
const PARTNER_KEY = 'partner_info';  // 파트너 정보 객체의 키

// ─── 특정 날짜에 사진 저장 ────────────────────────────────────────────────────
// 달력에서 날짜를 선택하고 사진을 고르면 이 함수가 호출된다.
//
// @param dateString - 날짜 문자열 (예: "2026-04-22")
// @param photoUri   - 기기에 저장된 사진의 경로 (예: "file:///var/mobile/...jpg")
export async function savePhotoForDate(dateString, photoUri) {
  try {
    // 기존에 저장된 모든 날짜-사진 데이터를 먼저 불러온다
    const existing = await getAllPhotos();

    // 해당 날짜 키에 새 사진 URI를 덮어쓴다
    // 예: existing["2026-04-22"] = "file:///..."
    existing[dateString] = photoUri;

    // 수정된 전체 객체를 다시 문자열로 변환해서 저장한다
    await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('사진 저장 실패:', e);
  }
}

// ─── 특정 날짜의 사진 URI 조회 ───────────────────────────────────────────────
// 달력에서 특정 날짜를 렌더링할 때 사진이 있는지 확인하기 위해 호출된다.
//
// @param dateString - 조회할 날짜 문자열 (예: "2026-04-22")
// @returns 사진 URI 문자열 또는 null (없으면)
export async function getPhotoForDate(dateString) {
  try {
    const all = await getAllPhotos();
    // 해당 날짜의 사진이 없으면 null을 반환한다
    return all[dateString] || null;
  } catch (e) {
    return null;
  }
}

// ─── 전체 날짜-사진 맵 조회 ──────────────────────────────────────────────────
// 달력 전체를 렌더링할 때 모든 날짜의 사진 정보가 한 번에 필요하다.
// 반환 형태 예시: { "2026-04-22": "file:///...", "2026-04-15": "file:///..." }
//
// @returns 날짜 문자열을 키, 사진 URI를 값으로 하는 객체
export async function getAllPhotos() {
  try {
    // AsyncStorage에서 저장된 JSON 문자열을 가져온다
    const raw = await AsyncStorage.getItem(PHOTO_KEY);
    // 저장된 값이 있으면 JSON 파싱 후 반환, 없으면 빈 객체 반환
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// ─── 특정 날짜의 사진 삭제 ───────────────────────────────────────────────────
// 사용자가 사진을 삭제하면 이 함수가 호출된다.
//
// @param dateString - 삭제할 날짜 문자열
export async function deletePhotoForDate(dateString) {
  try {
    const existing = await getAllPhotos();
    // JavaScript 객체에서 특정 키를 완전히 제거한다
    delete existing[dateString];
    // 변경된 객체를 다시 저장한다
    await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('사진 삭제 실패:', e);
  }
}

// ─── 파트너 정보 저장 ─────────────────────────────────────────────────────────
// 설정 화면에서 파트너 이름과 토큰을 입력하면 이 함수가 호출된다.
//
// @param info - 저장할 파트너 정보 객체
//               예: { myName: "나", partnerName: "연인", partnerToken: "ExponentPushToken[...]" }
export async function savePartnerInfo(info) {
  try {
    // 객체를 JSON 문자열로 변환해서 저장한다
    await AsyncStorage.setItem(PARTNER_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('파트너 정보 저장 실패:', e);
  }
}

// ─── 파트너 정보 조회 ─────────────────────────────────────────────────────────
// 앱 시작 시 이전에 저장한 파트너 정보를 불러온다.
//
// @returns 저장된 파트너 정보 객체 또는 null (최초 실행 시)
export async function getPartnerInfo() {
  try {
    const raw = await AsyncStorage.getItem(PARTNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
