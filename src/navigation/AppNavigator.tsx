// =============================================================================
// 📁 파일 용도: 앱 최상위 네비게이터 — 로그인 분기 및 앱 부트스트랩 담당
//
// "부트스트랩(Bootstrap)"이란?
//   앱이 처음 켜졌을 때 필요한 초기화 작업들을 수행하는 과정이에요.
//   저장된 토큰 복원 → 사용자 정보 가져오기 → 커플 정보 가져오기 순서로 실행해요.
//   이 작업들이 끝나기 전까지는 로딩 스피너를 보여줘요.
//
// 화면 분기 로직:
//   isAuthenticated == false → AuthNavigator (로그인/회원가입 화면들)
//   isAuthenticated == true  → MainNavigator (탭 바 + 모든 메인 화면들)
//
// 왜 NavigationContainer가 이 파일에 있나?
//   NavigationContainer는 앱에서 딱 한 개만 있어야 해요.
//   가장 상위 네비게이터에 두는 게 관례예요.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { useCoupleStore } from '../store/coupleStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { authApi } from '../api/auth';
import { coupleApi } from '../api/couple';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CoupleConnectScreen from '../screens/CoupleConnectScreen';
import PremiumScreen from '../screens/PremiumScreen';

// RootStackParamList 타입으로 타입 안전한 Stack Navigator 생성
// createNativeStackNavigator: iOS/Android 네이티브 스택 애니메이션을 사용해요.
// (push/pop 시 슬라이드 효과)
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // 필요한 스토어 액션들을 구독
  const { loadStoredTokens, setUser, isAuthenticated, isLoading } = useAuthStore();
  const { setCouple } = useCoupleStore();
  const { setSubscription } = useSubscriptionStore();

  // bootstrapping: 앱 최초 실행 시 초기화 작업이 끝났는지 여부
  // isLoading과 별도로 관리하는 이유: isLoading은 토큰 로딩만 담당하고,
  // bootstrapping은 그 이후 API 호출(getMe, getMyCouple)까지 포함해요.
  const [bootstrapping, setBootstrapping] = useState(true);

  // 앱이 처음 마운트될 때 딱 한 번만 bootstrap 실행
  useEffect(() => {
    bootstrap();
  }, []);

  // ── bootstrap: 앱 시작 초기화 함수 ──────────────────────────────────────────
  // 실행 순서:
  //   1. SecureStore에서 이전에 저장된 JWT 토큰을 불러옴
  //   2. 토큰이 있으면 서버에서 최신 사용자 정보(구독 타입 포함) 조회
  //   3. 사용자 정보를 스토어에 저장
  //   4. 커플 정보 조회 (없으면 null로 처리 — 커플 미연결 상태)
  //   5. bootstrapping = false로 설정 → 로딩 스피너 해제
  const bootstrap = async () => {
    try {
      const { accessToken } = await loadStoredTokens();

      if (accessToken) {
        // 저장된 토큰이 있으면 서버에서 최신 유저 정보를 가져와요.
        // 왜 getMe()를 다시 부르나?
        //   → 앱이 꺼져 있는 동안 구독이 만료됐거나, 닉네임이 바뀌었을 수 있어요.
        //   → 매 앱 시작 시 서버 기준으로 최신화해야 정확해요.
        const meRes = await authApi.getMe();
        const user = meRes.data.data;
        setUser(user);

        // 구독 상태를 subscriptionStore에 반영
        setSubscription(
          user.subscriptionType === 'PREMIUM',
          user.subscriptionExpiresAt,
        );

        // 커플 정보를 별도로 조회
        // try/catch를 분리한 이유:
        //   커플 미연결 상태(404 에러)여도 앱은 정상 실행돼야 해요.
        //   커플 정보 실패가 전체 초기화를 막아서는 안 돼요.
        try {
          const coupleRes = await coupleApi.getMyCouple();
          setCouple(coupleRes.data.data);
        } catch {
          setCouple(null); // 커플 미연결 — HomeScreen이 연결 유도 화면을 보여줌
        }
      }
      // 토큰이 없으면 로그인 화면으로 (isAuthenticated = false 상태 유지)
    } catch {
      // 토큰이 만료되어 getMe()가 실패한 경우 — 인터셉터가 자동 로그아웃 처리함
      // 별도 처리 없이 finally로 진행해요.
    } finally {
      setBootstrapping(false); // 성공/실패 무관하게 반드시 스피너를 해제
    }
  };

  // 초기화가 끝나기 전까지 분홍색 로딩 스피너를 보여줘요.
  // 스플래시 화면이 끝난 뒤 잠깐 보이는 화면이에요.
  if (bootstrapping || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' }}>
        <ActivityIndicator color="#FF6B9D" size="large" />
      </View>
    );
  }

  return (
    // NavigationContainer: React Navigation의 최상위 컨테이너
    // 내부의 모든 네비게이터와 화면에 네비게이션 context를 제공해요.
    <NavigationContainer>
      {/*
        headerShown: false — 모든 화면에서 기본 헤더를 숨겨요.
        각 화면이 자체적으로 헤더 UI를 구현하기 때문이에요.
      */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 로그인 전: 로그인·회원가입 화면만 있는 AuthNavigator
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            {/* 로그인 후: 탭 바가 있는 메인 화면 */}
            <Stack.Screen name="Main" component={MainNavigator} />

            {/*
              커플 연결 화면 — presentation: 'modal'로 설정하면
              아래에서 위로 슬라이드하는 모달 형태로 표시돼요.
              홈에서 "연인 연결하기" 버튼을 누르면 이 화면이 열려요.
            */}
            <Stack.Screen
              name="CoupleConnect"
              component={CoupleConnectScreen}
              options={{ presentation: 'modal' }}
            />

            {/*
              프리미엄 구독 화면 — 마찬가지로 모달 형태로 표시
              PremiumModal 컴포넌트에서 "프리미엄 시작하기" 누르면 이 화면이 열려요.
            */}
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
