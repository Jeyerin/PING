// =============================================================================
// 📁 파일 용도: RevenueCat 인앱 결제 SDK 초기화 및 헬퍼 함수
//
// RevenueCat이란?
//   - iOS App Store / Android Play Store의 구독 결제를 쉽게 처리해주는 서비스예요.
//   - 직접 StoreKit(iOS)이나 Billing Library(Android)를 구현하면 복잡하고 오류가 많아요.
//   - RevenueCat은 이를 추상화해서 한 줄의 코드로 결제, 영수증 검증, 구독 관리를 해줘요.
//   - "Entitlement(엔타이틀먼트)"란 특정 구독을 결제한 사용자가 어떤 기능을 쓸 수 있는지
//     정의한 것이에요. 우리 앱에서는 "premium" 이름의 엔타이틀먼트를 사용해요.
//
// 사용 전 준비:
//   1. app.revenuecat.com에서 앱 등록
//   2. iOS용, Android용 API 키를 각각 발급
//   3. 아래 상수에 발급받은 키를 입력하세요.
// =============================================================================

import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// ⚠️ 실제 서비스 전에 여기에 RevenueCat 대시보드에서 발급받은 키를 입력하세요.
const RC_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const RC_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

// ── initRevenueCat: 앱 시작 시 RevenueCat SDK 초기화 ────────────────────────
// App.tsx에서 앱이 렌더링되기 전에 호출해요.
//
// userId (선택):
//   로그인된 사용자 ID를 넘기면 RevenueCat이 해당 유저에 구매 내역을 연결해요.
//   userId 없이 초기화해도 익명 ID가 자동 할당돼요.
//   로그인 후 identifyUser()를 호출해 연결하는 방법도 가능해요.
export function initRevenueCat(userId?: string) {
  // 플랫폼에 따라 다른 API 키를 사용해요.
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

  // 개발 중에는 DEBUG 레벨로 설정해 모든 로그를 볼 수 있어요.
  // 배포 전에 LOG_LEVEL.WARN 또는 ERROR로 변경하세요.
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  // SDK 초기화 — 이 호출 이후부터 구매, 조회 등이 가능해요.
  Purchases.configure({ apiKey, appUserID: userId });
}

// ── identifyUser: 로그인 후 RevenueCat 계정에 사용자 연결 ───────────────────
// 로그인 성공 후 이 함수를 호출하면 RevenueCat의 익명 유저가 실제 유저로 전환돼요.
// 여러 기기에서 같은 계정으로 구독 상태를 공유할 수 있게 돼요.
export async function identifyUser(userId: string) {
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('RevenueCat login error:', err);
  }
}

// ── checkEntitlement: 현재 "premium" 엔타이틀먼트 보유 여부 확인 ─────────────
// 앱 시작 시 또는 구독 복원 후 실제 결제 상태를 확인할 때 사용해요.
// RevenueCat이 Apple/Google 서버와 통신해서 최신 상태를 반환해요.
// 반환값: true(프리미엄 구독 활성) / false(미구독 또는 만료)
export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    // entitlements.active: 현재 활성화된 엔타이틀먼트 목록
    // 'premium' 키가 존재하면 구독 중이에요.
    return !!customerInfo.entitlements.active['premium'];
  } catch {
    return false; // 네트워크 오류 등 → 기본적으로 프리미엄 아님으로 처리
  }
}
