// =============================================================================
// 📁 파일 용도: 앱의 최상위 진입점(Entry Point)
//
// 이 파일에서 하는 일:
//   1. RevenueCat SDK를 앱 시작 전에 초기화해요.
//   2. 앱이 열려 있는 동안 푸시 알림 수신·탭 이벤트를 감지해요.
//   3. StatusBar(상단 시간/배터리 표시줄) 스타일을 설정해요.
//   4. 전체 네비게이션 구조를 담은 AppNavigator를 렌더링해요.
//
// 렌더링 구조:
//   App
//   └── AppNavigator (NavigationContainer + Stack)
//        ├── AuthNavigator (로그인/회원가입)
//        └── MainNavigator (탭 바 + 메인 화면들)
//
// react-native-gesture-handler를 파일 맨 위에서 import하는 이유:
//   React Navigation이 스와이프 등 제스처를 인식하려면
//   반드시 앱 파일의 가장 첫 줄에서 import해야 해요.
//   순서가 틀리면 제스처가 작동하지 않아요.
// =============================================================================

import 'react-native-gesture-handler'; // 반드시 최상단 (React Navigation 제스처 활성화)

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import AppNavigator from './src/navigation/AppNavigator';
import { initRevenueCat } from './src/utils/revenuecat';
import { registerForPushNotifications } from './src/utils/notifications';

// ── RevenueCat 초기화 ─────────────────────────────────────────────────────────
// 컴포넌트 외부에서 호출하는 이유:
//   React 컴포넌트가 렌더링되기 전에 SDK가 준비되어야 해요.
//   useEffect 안에서 초기화하면 첫 렌더링 이후에 실행되어 늦을 수 있어요.
initRevenueCat();

export default function App() {
  // ── 알림 리스너 참조(ref) ─────────────────────────────────────────────────
  // useRef를 쓰는 이유:
  //   - 리스너 구독 객체를 저장해뒀다가 컴포넌트가 사라질 때(언마운트) 해제해야 해요.
  //   - useState와 달리 값이 바뀌어도 화면이 다시 렌더링되지 않아요.
  //   - 렌더링 간에 유지되어야 하는 "참조"를 저장할 때 useRef를 써요.
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // ── 푸시 알림 권한 요청 + Expo Push Token 발급 ─────────────────────────
    // 앱 시작 시 한 번만 실행돼요. 반환된 토큰을 서버에 저장하면
    // 서버가 이 기기로 직접 알림을 보낼 수 있어요.
    registerForPushNotifications();

    // ── 리스너 1: 앱이 열려 있을 때(포그라운드) 알림이 도착하면 실행 ──────────
    // 예: 상대방이 하트 버튼을 눌렀을 때 내 앱에서 이 이벤트 발생
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // notification.request.content: 알림의 제목, 내용, 추가 데이터
        // 여기에 상태 뱃지 업데이트, 특정 화면으로 이동 등 원하는 동작 추가 가능
        console.log('알림 수신:', notification);
      },
    );

    // ── 리스너 2: 사용자가 알림 배너를 탭했을 때 실행 ─────────────────────────
    // 예: 하트 알림 탭 → 홈 화면으로 이동하는 기능 구현 가능
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // response.notification.request.content.data: 알림과 함께 보낸 커스텀 데이터
        // 서버에서 알림 보낼 때 { type: 'heart', from: 'nickname' } 같은 데이터를 담으면
        // 여기서 읽어서 해당 화면으로 navigate() 할 수 있어요.
        console.log('알림 탭:', response);
      },
    );

    // ── 클린업 함수: 컴포넌트 언마운트 시 리스너 해제 ────────────────────────
    // useEffect가 반환하는 함수는 컴포넌트가 사라질 때 자동 실행돼요.
    // 리스너를 해제하지 않으면 메모리 누수(memory leak)가 발생할 수 있어요.
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []); // [] = 마운트 시 한 번, 언마운트 시 클린업 한 번만 실행

  return (
    <>
      {/* StatusBar: 상단 시간/배터리 아이콘 — dark = 어두운 아이콘 (밝은 배경용) */}
      <StatusBar style="dark" />

      {/* 앱 전체 화면 구조 (로그인 분기, 탭 네비게이션 등을 담당) */}
      <AppNavigator />
    </>
  );
}
