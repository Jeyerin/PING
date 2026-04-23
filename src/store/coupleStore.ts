// =============================================================================
// 📁 파일 용도: 커플 연결 상태를 전역으로 관리하는 Zustand 스토어
//
// 왜 별도 스토어로 분리했나?
//   - authStore는 "내가 누구인가(인증)"를 담당하고,
//     coupleStore는 "나와 연결된 커플 정보"를 담당해요.
//   - 관심사(Concern)가 다른 상태는 분리하는 것이 코드를 읽기 쉽게 만들어요.
//   - 예: 커플 연결을 끊어도 로그인은 유지되어야 하므로 분리가 자연스러워요.
//
// 어디서 사용하나?
//   - HomeScreen: 커플 연결됐는지 확인해서 D+Day 또는 "연결하기" 화면을 보여줌
//   - AppNavigator: 앱 시작 시 커플 정보를 서버에서 불러와 여기에 저장
//   - CoupleConnectScreen: 연결 성공 후 setCouple 호출
// =============================================================================

import { create } from 'zustand';
import { Couple } from '../types';

interface CoupleState {
  // ── 상태(State) ─────────────────────────────────────────────────────────────
  couple: Couple | null; // 커플 정보 (아직 연결 안 했거나 연결 끊기면 null)
  isConnected: boolean;  // 커플 연결 여부 — true/false로 빠르게 확인할 수 있게 따로 관리

  // ── 액션(Action) ─────────────────────────────────────────────────────────────
  setCouple: (couple: Couple | null) => void; // 커플 정보 저장 (null 넘기면 연결 해제)
  clearCouple: () => void;                    // 커플 연결 완전 해제 (로그아웃 시 등)
}

export const useCoupleStore = create<CoupleState>((set) => ({
  // ── 초기 상태값 ──────────────────────────────────────────────────────────────
  couple: null,
  isConnected: false,

  // ── setCouple: 커플 정보를 스토어에 저장 ─────────────────────────────────────
  // couple에 값을 넣으면 isConnected를 자동으로 true로 설정해요.
  // couple에 null을 넣으면(연결 끊김) isConnected를 false로 설정해요.
  // couple !== null  →  Boolean 변환  →  true 또는 false
  setCouple: (couple) => set({ couple, isConnected: couple !== null }),

  // ── clearCouple: 커플 상태를 초기화 ──────────────────────────────────────────
  // 로그아웃할 때나 커플 연결을 끊을 때 호출해요.
  // setCouple(null)과 결과는 같지만, 의도를 더 명확히 표현하기 위해 별도로 만들었어요.
  clearCouple: () => set({ couple: null, isConnected: false }),
}));
