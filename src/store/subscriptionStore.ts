// =============================================================================
// 📁 파일 용도: 프리미엄 구독 상태를 전역으로 관리하는 Zustand 스토어
//
// 왜 구독 상태를 별도 스토어로 관리하나?
//   - 앱 전체에서 "이 기능 쓸 수 있나?" 체크가 빈번하게 일어나요.
//   - 달력 사진 제한, 편지함 잠금, 탭 아이콘 배지 등 여러 곳에서 isPremium을 봐요.
//   - Zustand에 두면 어느 컴포넌트에서든 useSubscriptionStore()로 즉시 접근 가능해요.
//
// RevenueCat과의 관계:
//   - RevenueCat SDK에서 결제 확인 후 setSubscription()을 호출해 여기에 저장해요.
//   - RevenueCat을 직접 호출하는 건 PremiumScreen과 AppNavigator에서만 해요.
//   - 나머지 화면은 이 스토어의 isPremium만 보면 돼서 간결해져요.
// =============================================================================

import { create } from 'zustand';

interface SubscriptionState {
  // ── 상태(State) ─────────────────────────────────────────────────────────────
  isPremium: boolean;      // 현재 프리미엄 구독 중인지 여부
  expiresAt: string | null; // 구독 만료일 (ISO 날짜 문자열, FREE면 null)

  // ── 액션(Action) ─────────────────────────────────────────────────────────────
  // isPremium과 만료일을 함께 업데이트
  setSubscription: (isPremium: boolean, expiresAt?: string) => void;
  // 구독 상태 초기화 (로그아웃 시 호출)
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  // ── 초기 상태값 ──────────────────────────────────────────────────────────────
  isPremium: false,
  expiresAt: null,

  // ── setSubscription: 구독 상태 갱신 ──────────────────────────────────────────
  // 호출 시점:
  //   1. 앱 시작 시 → AppNavigator가 서버에서 User 정보를 가져와 subscriptionType 확인
  //   2. 결제 완료 시 → PremiumScreen에서 RevenueCat 결제 후 엔타이틀먼트 확인
  //   3. 구독 복원 시 → PremiumScreen에서 "이전 구매 복원" 버튼 클릭 후
  //
  // expiresAt은 넘겨줄 수도 있고 안 넘겨줄 수도 있어요.
  //   없으면 null로 저장해요.
  //   ?? null: expiresAt이 undefined일 때 null로 대체 (nullish coalescing 연산자)
  setSubscription: (isPremium, expiresAt) =>
    set({ isPremium, expiresAt: expiresAt ?? null }),

  // ── clearSubscription: 구독 상태 초기화 ──────────────────────────────────────
  // 로그아웃 시 authStore.logout()과 함께 호출해 구독 상태도 리셋해요.
  clearSubscription: () => set({ isPremium: false, expiresAt: null }),
}));
