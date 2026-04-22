// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 앱의 진입점(Entry Point) - 앱을 켜면 가장 먼저 실행되는 파일
//
// 이 파일에서 하는 일:
//  1. 앱 전체를 AppProvider로 감싸서 전역 상태를 모든 화면에서 쓸 수 있게 한다
//  2. 상단 상태 표시줄(시간, 배터리 등) 스타일을 설정한다
//  3. 화면 네비게이션(탭 바)을 최상위에서 렌더링한다
//  4. 앱이 켜져 있는 동안 알림 수신 이벤트를 감지하는 리스너를 등록한다
//
// React Native 앱의 렌더링 구조:
//  App.js
//  └── AppProvider (전역 상태 공급자)
//       └── AppNavigator (탭 바 + 화면 전환)
//            ├── HomeScreen (홈 탭)
//            ├── CalendarScreen (달력 탭)
//            └── SettingsScreen (설정 탭)
// ─────────────────────────────────────────────────────────────────────────────

// react-native-gesture-handler: React Navigation이 스와이프 등 제스처를 인식하려면
// 반드시 앱 파일의 가장 첫 줄에서 import해야 한다. 순서가 중요하다!
import 'react-native-gesture-handler';

import React, { useEffect, useRef } from 'react';

// StatusBar: 화면 상단의 시간·배터리 표시줄 컴포넌트
// style="dark"로 설정하면 밝은 배경에 어두운 텍스트로 표시된다
import { StatusBar } from 'expo-status-bar';

// expo-notifications: 알림 수신 이벤트를 감지하는 리스너 등록에 사용
import * as Notifications from 'expo-notifications';

// 전역 상태(사진, 파트너 정보, 토큰)를 모든 화면에 공급하는 Provider
import { AppProvider } from './src/context/AppContext';

// 하단 탭 바와 화면 전환을 담당하는 Navigator
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {

  // ── 알림 리스너 참조(ref) ────────────────────────────────────────────────────
  // useRef: 렌더링과 무관하게 유지되는 변수를 만든다.
  // useState와 달리 값이 바뀌어도 화면이 다시 렌더링되지 않는다.
  // 여기서는 리스너 구독 객체를 저장해두고, 컴포넌트가 사라질 때(언마운트) 구독 해제에 사용한다.
  const notificationListener = useRef();
  const responseListener = useRef();

  // ── 알림 이벤트 리스너 등록 ──────────────────────────────────────────────────
  // useEffect는 컴포넌트가 처음 렌더링된 후 실행된다.
  // [] (빈 배열) = 앱 시작 시 딱 한 번만 실행
  useEffect(() => {

    // 리스너 1: 앱이 열려 있는 상태(포그라운드)에서 알림이 도착했을 때 실행
    // 예) 내가 버튼을 눌러 알림을 보냈을 때, 내 앱에서도 이 이벤트가 발생
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // notification 객체에는 제목, 내용, 추가 데이터 등이 들어 있다
      console.log('알림 수신:', notification);
      // 여기에 원하는 동작 추가 가능 (예: 상태 배지 업데이트, 화면 이동 등)
    });

    // 리스너 2: 사용자가 알림 배너를 탭했을 때 실행
    // 예) 알림을 탭하면 특정 화면으로 이동하는 기능을 여기에 구현한다
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // response.notification.request.content.data에 알림과 함께 보낸 추가 데이터가 있다
      console.log('알림 응답:', response);
      // 여기에 원하는 동작 추가 가능 (예: 달력 탭으로 이동 등)
    });

    // ── 클린업 함수 ──────────────────────────────────────────────────────────────
    // useEffect가 반환하는 함수는 컴포넌트가 사라질 때(언마운트) 자동으로 실행된다.
    // 리스너를 해제하지 않으면 메모리 누수가 발생할 수 있다.
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []); // 빈 배열 = 마운트·언마운트 시 딱 한 번씩만 실행

  return (
    // AppProvider: 전역 상태(Context)를 모든 하위 컴포넌트에 공급한다.
    // 이 안에 있는 모든 컴포넌트는 useApp()으로 전역 데이터에 접근 가능하다.
    <AppProvider>
      {/* StatusBar: 상단 상태 표시줄 스타일 설정 (dark = 어두운 텍스트/아이콘) */}
      <StatusBar style="dark" />

      {/* AppNavigator: 하단 탭 바와 각 탭의 화면을 렌더링한다 */}
      <AppNavigator />
    </AppProvider>
  );
}
