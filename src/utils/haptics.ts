// =============================================================================
// 📁 파일 용도: 햅틱(진동) 피드백 유틸리티
//
// 햅틱 피드백이란?
//   버튼을 눌렀을 때 물리적인 진동으로 반응하는 기능이에요.
//   터치 인터페이스에서 "실제로 뭔가를 눌렀다"는 느낌을 줘서 UX를 향상시켜요.
//
// expo-haptics 사용 이유:
//   React Native의 Vibration API보다 더 세밀한 피드백 패턴을 제공해요.
//   iOS는 Taptic Engine, Android는 진동 모터를 사용해요.
//
// 이 파일을 만든 이유:
//   expo-haptics를 직접 쓰면 매번 함수 이름을 기억해야 해요.
//   haptic.success(), haptic.light() 처럼 의미 있는 이름으로 래핑하면 더 쓰기 편해요.
// =============================================================================

import * as Haptics from 'expo-haptics';

export const haptic = {
  // 가벼운 진동 — 메뉴 항목 선택 등 일반적인 터치 피드백
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // 중간 진동 — 버튼 클릭, 토글 전환 등에 사용
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // 강한 진동 — 중요한 액션이나 강조할 때 사용
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  // 성공 패턴 진동 — 하트 버튼, 커플 연결 성공, 답변 제출 완료 등에 사용
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // 에러 패턴 진동 — 커플 연결 실패, 코드 불일치 등 오류 상황에 사용
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
