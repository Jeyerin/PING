// =============================================================================
// 📁 파일 용도: 푸시 알림 권한 요청 및 초기 설정
//
// 푸시 알림 작동 방식:
//   1. 앱이 처음 실행될 때 사용자에게 알림 권한을 요청해요.
//   2. 허용하면 Expo 서버로부터 "Expo Push Token"을 받아요.
//   3. 이 토큰을 우리 서버에 저장해두면, 서버가 필요할 때 Expo API를 통해
//      특정 기기로 알림을 보낼 수 있어요. (예: 하트 버튼 눌렸을 때 상대방에게 알림)
//
// setNotificationHandler:
//   앱이 포그라운드(열려 있는 상태)일 때 알림이 오면 어떻게 할지 결정해요.
//   기본값은 "포그라운드에서는 표시 안 함"이에요.
//   우리 앱은 항상 표시하도록 설정해요.
// =============================================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 앱이 열려 있을 때(포그라운드) 알림이 와도 표시하도록 전역 설정
// shouldShowAlert: 알림 배너 표시 여부
// shouldPlaySound: 알림 소리 재생 여부
// shouldSetBadge: 앱 아이콘 뱃지 업데이트 여부
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── registerForPushNotifications: 알림 권한 요청 + 푸시 토큰 반환 ─────────────
// 반환값: Expo Push Token 문자열 (예: "ExponentPushToken[xxx...]")
//         에뮬레이터거나 권한 거부 시 null 반환
//
// 이 함수는 App.tsx에서 앱 시작 시 한 번만 호출해요.
// 받은 토큰은 authApi 등으로 서버에 저장해두면 돼요.
export async function registerForPushNotifications(): Promise<string | null> {
  // 에뮬레이터/시뮬레이터는 실제 기기가 아니라 푸시 토큰을 받을 수 없어요.
  if (!Device.isDevice) return null;

  // 이미 알림 권한이 있는지 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한이 없으면 사용자에게 팝업으로 권한 요청
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 권한을 거부했으면 토큰을 받을 수 없음
  if (finalStatus !== 'granted') return null;

  // Android 8.0 이상에서는 알림 채널을 별도로 만들어야 알림이 제대로 표시돼요.
  // iOS는 채널 개념이 없어서 이 코드가 필요 없어요.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '우리 사이 알림',
      importance: Notifications.AndroidImportance.MAX, // 최우선 알림 (헤드업 표시)
      vibrationPattern: [0, 250, 250, 250],            // 진동 패턴 (ms 단위)
      lightColor: '#FF6B9D',                           // 알림 LED 색상 (일부 기기)
    });
  }

  // Expo 푸시 토큰 발급 — 이 토큰을 서버에 저장해두면 서버→기기 알림 발송 가능
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
