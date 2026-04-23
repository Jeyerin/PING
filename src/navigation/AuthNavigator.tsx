// =============================================================================
// 📁 파일 용도: 로그인/회원가입 화면을 묶는 인증 전용 Stack Navigator
//
// 왜 AuthNavigator를 별도로 분리했나?
//   - AppNavigator에서 로그인 여부에 따라 Auth/Main을 통째로 교체해요.
//   - 분리하면 로그인 관련 화면들의 구성이 명확하고, 나중에 "비밀번호 찾기" 등
//     화면을 추가할 때 이 파일만 수정하면 돼요.
//
// 화면 흐름:
//   Login (기본 화면) → Register (회원가입 링크 클릭 시)
//   Register → Login (뒤로 가기 버튼)
// =============================================================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// AuthStackParamList 타입으로 이 스택 안의 화면 이름과 파라미터를 제한해요.
// 이 타입에 없는 화면 이름으로 navigate()를 호출하면 TypeScript가 에러를 알려줘요.
const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    // headerShown: false — 각 화면에서 자체 헤더를 구현하기 때문에 기본 헤더를 숨겨요.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* initialRouteName을 따로 안 써도 첫 번째 Screen이 기본 화면이 돼요. */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
