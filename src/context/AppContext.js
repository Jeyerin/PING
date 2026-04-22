// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 앱 전체에서 공유되는 전역 상태(데이터)를 관리하는 Context 파일
//
// Context란?
//  - React에서 데이터를 여러 화면/컴포넌트에 걸쳐 공유할 때 사용하는 패턴이다.
//  - 예를 들어 사진 데이터는 CalendarScreen에서도, HomeScreen에서도 필요할 수 있다.
//  - Context 없이는 부모→자식으로 props를 계속 전달해야 해서 코드가 복잡해진다.
//  - Context를 쓰면 어떤 컴포넌트에서든 useApp() 한 줄로 데이터에 접근할 수 있다.
//
// 이 파일에서 관리하는 전역 상태:
//  - photos: 달력에 저장된 날짜별 사진 맵 (CalendarScreen에서 사용)
//  - partnerInfo: 파트너 이름과 토큰 (SettingsScreen에서 수정, 홈에서 표시)
//  - pushToken: 이 기기의 푸시 토큰 (SettingsScreen에서 파트너에게 공유)
// ─────────────────────────────────────────────────────────────────────────────

// React 핵심 함수들:
// - createContext: Context 객체를 만든다 (빈 그릇)
// - useContext: 어떤 컴포넌트에서든 Context 값을 꺼내 쓴다
// - useState: 컴포넌트 내부의 상태 변수를 선언한다 (변하면 화면이 다시 렌더링됨)
// - useEffect: 컴포넌트가 처음 렌더링된 후 실행할 코드를 등록한다
import React, { createContext, useContext, useState, useEffect } from 'react';

// 데이터 저장소에서 사진과 파트너 정보를 불러오는 함수
import { getAllPhotos, getPartnerInfo } from '../services/storage';
// 앱 시작 시 푸시 알림 권한 요청 및 토큰 발급 함수
import { registerForPushNotificationsAsync } from '../services/notifications';

// ─── Context 생성 ─────────────────────────────────────────────────────────────
// createContext()로 빈 Context 그릇을 만든다.
// 이 그릇에 AppProvider가 값을 채워 넣으면, 하위 컴포넌트들이 꺼내 쓸 수 있다.
const AppContext = createContext();

// ─── AppProvider 컴포넌트 ────────────────────────────────────────────────────
// 이 컴포넌트로 앱 전체를 감싸면, 내부의 모든 화면이 전역 상태에 접근할 수 있다.
// App.js에서 <AppProvider>로 <AppNavigator>를 감싸는 방식으로 사용된다.
//
// @param children - AppProvider 안에 들어오는 자식 컴포넌트들 (실질적으로 앱 전체)
export function AppProvider({ children }) {

  // ── 전역 상태 변수 선언 ─────────────────────────────────────────────────────
  // useState의 반환값: [현재값, 값을 바꾸는 함수]
  // 값이 바뀌면 이 상태를 사용하는 모든 컴포넌트가 자동으로 다시 렌더링된다.

  // 날짜별 사진 맵 상태. 초기값은 빈 객체 {}
  // 예: { "2026-04-22": "file:///...", "2026-04-15": "file:///..." }
  const [photos, setPhotos] = useState({});

  // 파트너 정보 상태. 처음엔 null (설정 전)
  // 예: { myName: "나", partnerName: "연인", partnerToken: "ExponentPushToken[...]" }
  const [partnerInfo, setPartnerInfo] = useState(null);

  // 이 기기의 Expo 푸시 토큰. 처음엔 null (권한 요청 전)
  const [pushToken, setPushToken] = useState(null);

  // ── 앱 시작 시 초기화 ────────────────────────────────────────────────────────
  // useEffect의 두 번째 인수가 [] (빈 배열)이면,
  // 컴포넌트가 처음 화면에 나타날 때 딱 한 번만 실행된다.
  useEffect(() => {
    loadData();

    // 푸시 알림 권한을 요청하고, 성공하면 토큰을 상태에 저장한다
    registerForPushNotificationsAsync().then(token => {
      if (token) setPushToken(token);
    });
  }, []); // [] = 마운트(첫 렌더) 시 한 번만 실행

  // ── 저장소에서 초기 데이터 로드 ─────────────────────────────────────────────
  async function loadData() {
    // Promise.all: 두 비동기 작업을 동시에 실행해서 둘 다 완료되면 결과를 받는다
    // 순차적으로 실행하는 것보다 빠르다
    const [allPhotos, partner] = await Promise.all([
      getAllPhotos(),    // 저장된 모든 사진 데이터
      getPartnerInfo(),  // 저장된 파트너 정보
    ]);

    // 받아온 데이터로 상태를 업데이트한다 → 화면이 다시 렌더링됨
    setPhotos(allPhotos);
    setPartnerInfo(partner);
  }

  // ── 사진 데이터 새로고침 ─────────────────────────────────────────────────────
  // CalendarScreen에서 사진을 추가/삭제한 후 Context의 사진 목록도 갱신할 때 호출한다.
  // 이 함수를 Context에 넣어두면 어느 화면에서든 photos를 최신 상태로 유지할 수 있다.
  function refreshPhotos() {
    getAllPhotos().then(setPhotos);
  }

  // ── Context에 제공할 값 목록 ─────────────────────────────────────────────────
  // value에 담긴 것들이 useApp()을 통해 모든 하위 컴포넌트에서 사용 가능해진다.
  return (
    <AppContext.Provider value={{
      photos,           // 날짜별 사진 데이터 (달력에서 사용)
      partnerInfo,      // 파트너 이름/토큰 (설정, 홈에서 사용)
      pushToken,        // 내 기기 푸시 토큰 (설정 화면에서 표시)
      refreshPhotos,    // 사진 목록 새로고침 함수 (달력에서 호출)
      setPartnerInfo,   // 파트너 정보 업데이트 함수 (설정 화면에서 호출)
    }}>
      {/* children = 이 Provider 안에 감싸진 모든 컴포넌트들 (앱 전체) */}
      {children}
    </AppContext.Provider>
  );
}

// ─── 커스텀 훅: useApp ────────────────────────────────────────────────────────
// 각 화면에서 Context 값을 꺼낼 때 사용하는 편의 함수다.
// useContext(AppContext) 대신 useApp()으로 간결하게 쓸 수 있게 해준다.
//
// 사용 예시 (CalendarScreen 등에서):
//   const { photos, refreshPhotos } = useApp();
export function useApp() {
  return useContext(AppContext);
}
