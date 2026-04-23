// =============================================================================
// 📁 파일 용도: 로그인 상태(JWT 토큰, 사용자 정보)를 전역으로 관리하는 스토어
//
// Zustand란?
//   - React의 전역 상태 관리 라이브러리예요. Redux보다 훨씬 코드가 적고 간단해요.
//   - create() 함수 하나로 상태(state)와 그 상태를 바꾸는 함수(action)를 함께 정의해요.
//   - 어느 컴포넌트에서든 useAuthStore()를 import하면 같은 상태를 공유해요.
//   - 상태가 바뀌면 해당 상태를 구독하는 컴포넌트만 자동으로 다시 렌더링돼요.
//
// SecureStore란?
//   - expo-secure-store가 제공하는 보안 저장소예요.
//   - iOS의 Keychain, Android의 Keystore를 사용해 암호화하여 저장해요.
//   - JWT처럼 민감한 데이터는 일반 AsyncStorage 대신 반드시 여기에 저장해야 해요.
//   - 앱을 껐다 켜도 데이터가 유지돼요 (로그인 상태 유지).
// =============================================================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens } from '../types';

// SecureStore에서 값을 꺼내고 넣을 때 사용하는 키(key) 이름들을 상수로 모아둠.
// 문자열을 직접 쓰면 오타가 날 수 있어서 상수로 분리하는 게 좋은 습관이에요.
const KEYS = {
  ACCESS_TOKEN: 'access_token',   // 짧은 수명의 인증 토큰 저장 키
  REFRESH_TOKEN: 'refresh_token', // 토큰 갱신용 리프레시 토큰 저장 키
};

// ─── 스토어의 "모양" 정의 ────────────────────────────────────────────────────
// interface로 이 스토어가 가져야 할 상태(state)와 함수(action)를 미리 선언해요.
// Zustand의 create<AuthState>()에 타입으로 넘겨서 자동완성과 타입 검사를 받아요.
interface AuthState {
  // ── 상태(State) ─────────────────────────────────────────────────────────────
  user: User | null;              // 현재 로그인한 사용자 정보 (로그아웃 시 null)
  accessToken: string | null;     // 메모리에 캐싱된 accessToken (빠른 접근용)
  refreshToken: string | null;    // 메모리에 캐싱된 refreshToken
  isAuthenticated: boolean;       // 로그인 여부 — 네비게이터가 이 값을 보고 화면 분기
  isLoading: boolean;             // 앱 시작 시 저장된 토큰을 불러오는 중인지 여부

  // ── 액션(Action) ─────────────────────────────────────────────────────────────
  setTokens: (tokens: AuthTokens) => Promise<void>;      // 로그인 성공 후 토큰 저장
  setUser: (user: User) => void;                          // 사용자 정보 업데이트
  logout: () => Promise<void>;                            // 로그아웃 (토큰 + 상태 삭제)
  loadStoredTokens: () => Promise<{                       // 앱 시작 시 저장된 토큰 복원
    accessToken: string | null;
    refreshToken: string | null;
  }>;
  updateAccessToken: (token: string) => Promise<void>;   // 토큰 갱신 시 accessToken만 교체
}

// ─── Zustand 스토어 생성 ──────────────────────────────────────────────────────
// create<AuthState>((set) => ({ ... }))
//   - set: 상태를 변경하는 함수예요. set({ key: value }) 형태로 씁니다.
//   - set은 이전 상태를 자동으로 병합(merge)해줘요.
//     즉, set({ user: newUser })는 user만 바꾸고 나머지는 그대로 유지해요.
export const useAuthStore = create<AuthState>((set) => ({
  // ── 초기 상태값 ──────────────────────────────────────────────────────────────
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // 앱 시작 직후엔 토큰 불러오기 전이라 true로 시작

  // ── setTokens: 로그인/회원가입 성공 후 호출 ──────────────────────────────────
  // 1. SecureStore에 두 토큰을 암호화해서 저장 (앱 종료 후에도 유지)
  // 2. 메모리 상태에도 저장해 빠른 접근 가능하게 하고
  // 3. isAuthenticated를 true로 바꿔 네비게이터가 메인 화면으로 이동시킴
  setTokens: async (tokens) => {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  // ── setUser: 사용자 정보를 메모리 상태에 저장 ────────────────────────────────
  // API에서 받아온 User 객체를 스토어에 넣어요.
  // user 정보는 암호화할 필요 없으므로 SecureStore가 아닌 메모리에만 저장해요.
  // (앱 재시작 시엔 loadStoredTokens → authApi.getMe()로 다시 불러와요)
  setUser: (user) => set({ user }),

  // ── logout: 모든 인증 정보를 완전히 제거 ─────────────────────────────────────
  // 1. SecureStore에서 두 토큰을 삭제 (다음 앱 실행 시 자동 로그인 안 됨)
  // 2. 메모리 상태를 초기화해 네비게이터가 로그인 화면으로 돌아가게 함
  logout: async () => {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  // ── loadStoredTokens: 앱 시작 시 이전에 저장된 토큰을 복원 ───────────────────
  // AppNavigator에서 앱이 처음 열릴 때 한 번만 호출돼요.
  // 토큰이 있으면 → 자동 로그인 상태로 진입
  // 토큰이 없으면 → 로그인 화면으로 이동
  // 마지막에 isLoading을 false로 설정해 스플래시 스크린을 해제해요.
  loadStoredTokens: async () => {
    const accessToken = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    const refreshToken = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    if (accessToken) {
      // 토큰이 존재하면 인증됨 상태로 업데이트
      set({ accessToken, refreshToken, isAuthenticated: true });
    }
    set({ isLoading: false }); // 토큰 확인 완료 → 스플래시 종료
    return { accessToken, refreshToken }; // 호출한 쪽(AppNavigator)에서 토큰 유무를 활용
  },

  // ── updateAccessToken: accessToken만 교체 ────────────────────────────────────
  // 언제 씀?
  //   accessToken은 짧게 유효하고(예: 30분), 만료되면 401 에러가 와요.
  //   이때 axios 인터셉터가 refreshToken으로 새 accessToken을 받아와서 이 함수를 호출해요.
  //   refreshToken은 그대로 유지하고 accessToken만 교체하면 돼요.
  updateAccessToken: async (token) => {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token); // 저장소에도 교체
    set({ accessToken: token });                               // 메모리 상태도 교체
  },
}));
