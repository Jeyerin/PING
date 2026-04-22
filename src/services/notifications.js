// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 푸시 알림 관련 모든 기능을 담당하는 서비스 파일
//
// 이 파일에서 하는 일:
//  1. 앱 실행 시 기기에게 "알림 보내도 돼?" 권한을 요청하고 푸시 토큰을 받아온다
//  2. 버튼을 눌렀을 때 상대방에게 보낼 알림 메시지를 종류별로 정의해둔다
//  3. 실제로 알림을 발송하는 함수를 제공한다
//
// React Native에서 푸시 알림은 expo-notifications 라이브러리가 담당한다.
// 실제 기기 간 알림을 보내려면 Expo 푸시 서버를 통해야 하며,
// 그러기 위해 각 기기 고유의 "푸시 토큰"이 필요하다.
// ─────────────────────────────────────────────────────────────────────────────

// expo-notifications: 푸시 알림을 관리하는 Expo 공식 라이브러리
import * as Notifications from 'expo-notifications';
// expo-device: 실제 기기인지 시뮬레이터인지 구분하는 라이브러리
import * as Device from 'expo-device';
// expo-constants: app.json에 적힌 앱 설정 값을 코드에서 읽을 수 있게 해주는 라이브러리
import Constants from 'expo-constants';
// Platform: 현재 기기가 iOS인지 Android인지 구분할 때 사용
import { Platform } from 'react-native';

// ─── 알림 수신 시 동작 방식 전역 설정 ───────────────────────────────────────
// 앱이 열려 있는 상태(포그라운드)에서 알림이 도착했을 때 어떻게 처리할지 정한다.
// 이 설정이 없으면 앱이 켜져 있을 때는 알림이 화면에 표시되지 않는다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // 알림 배너를 화면 상단에 표시할지 여부
    shouldPlaySound: true,   // 알림음을 재생할지 여부
    shouldSetBadge: true,    // 앱 아이콘에 숫자 배지를 표시할지 여부
  }),
});

// ─── 푸시 토큰 등록 함수 ─────────────────────────────────────────────────────
// 앱 최초 실행 시 한 번 호출해서 이 기기의 고유 토큰을 받아온다.
// 이 토큰을 파트너에게 공유하면, 파트너 기기로 알림을 보낼 수 있다.
export async function registerForPushNotificationsAsync() {

  // 푸시 알림은 실제 기기에서만 동작한다.
  // 맥/윈도우 시뮬레이터에서는 토큰 발급이 불가능하다.
  if (!Device.isDevice) {
    alert('실제 기기에서만 푸시 알림을 사용할 수 있습니다.');
    return null;
  }

  // 이미 알림 권한이 허용됐는지 먼저 확인한다.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 아직 권한을 요청한 적 없거나 거부됐다면, 사용자에게 팝업으로 권한을 요청한다.
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 그래도 권한이 없으면 (사용자가 거부) 더 이상 진행하지 않는다.
  if (finalStatus !== 'granted') {
    alert('푸시 알림 권한이 필요합니다.');
    return null;
  }

  // app.json에 설정된 Expo 프로젝트 ID를 가져온다.
  // 이 ID가 있어야 Expo 푸시 서버에서 올바른 토큰을 발급해준다.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  // Expo 서버에 이 기기를 등록하고 고유 푸시 토큰을 받아온다.
  // 토큰 예시: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  // Android는 iOS와 달리 "알림 채널"이라는 개념이 있다.
  // 채널마다 소리, 진동, 중요도를 다르게 설정할 수 있다.
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('couple', {
      name: '커플 알림',
      importance: Notifications.AndroidImportance.MAX, // 최고 우선순위
      vibrationPattern: [0, 250, 250, 250],            // 진동 패턴 (ms 단위)
      lightColor: '#FF6B9D',                           // LED 알림 색상
    });
  }

  return token; // 받아온 토큰을 호출한 곳으로 반환
}

// ─── 알림 메시지 내용 정의 ────────────────────────────────────────────────────
// 버튼 종류(type)별로 랜덤하게 보낼 문구들을 미리 정해둔다.
// 배열 중 하나가 무작위로 선택되어 알림으로 전송된다.
const MESSAGES = {
  talk: [   // "이야기하고 싶어" 버튼을 눌렀을 때
    '💬 나 이야기하고 싶어...',
    '💬 우리 대화 좀 할 수 있을까?',
    '💬 잠깐 얘기 좀 해',
  ],
  makeup: [ // "화해하고 싶어" 버튼을 눌렀을 때
    '🌸 화해하고 싶어요 ㅠㅠ',
    '🌸 미안해, 우리 화해하자',
    '🌸 이제 그만 화해할래?',
  ],
  miss: [   // "보고 싶어" 버튼을 눌렀을 때
    '💕 보고 싶어...',
    '💕 너 생각 나',
    '💕 지금 뭐해? 보고 싶다',
  ],
};

// ─── 로컬 알림 발송 함수 ──────────────────────────────────────────────────────
// 버튼을 눌렀을 때 이 함수를 호출해서 알림을 발송한다.
// "로컬 알림"이란 인터넷 없이 이 기기 자체에서 직접 띄우는 알림이다.
// (실제 파트너 기기로 전송하려면 Expo 푸시 서버 API 호출이 추가로 필요하다)
//
// @param type - 'talk' | 'makeup' | 'miss' 중 하나
export async function sendLocalNotification(type = 'talk') {
  // 해당 타입의 메시지 배열을 가져온다. 없으면 기본으로 talk 사용
  const messages = MESSAGES[type] || MESSAGES.talk;

  // 배열 길이 범위 내에서 랜덤한 인덱스를 골라 문구를 선택한다
  const body = messages[Math.floor(Math.random() * messages.length)];

  // 알림을 예약·발송한다
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💑 연인에게 메시지', // 알림 제목
      body,                        // 위에서 고른 랜덤 문구
      sound: true,                 // 소리 재생
      data: { type },              // 알림과 함께 전달할 추가 데이터 (나중에 알림 탭 시 활용 가능)
    },
    trigger: null, // null이면 즉시 발송 (딜레이 없음)
  });
}
