// =============================================================================
// 📁 파일 용도: 이메일/비밀번호 로그인 화면
//
// 이 화면에서 하는 일:
//   1. 이메일·비밀번호 입력 필드와 로그인 버튼을 보여줘요.
//   2. 클라이언트 측 유효성 검사 (이메일 형식, 빈 값 등)
//   3. authApi.login() 호출 → 성공 시 JWT를 SecureStore에 저장 + 메인화면 이동
//   4. 서버 에러 코드에 따른 에러 메시지 표시
//
// 네비게이션 타입을 2개 쓰는 이유:
//   - authNav: AuthStack 안에서 Register 화면으로 이동할 때 사용
//   - rootNav: 로그인 성공 후 Root 스택의 Main 화면으로 교체할 때 사용
//     (reset을 써서 뒤로 가기 시 로그인 화면으로 돌아오지 않게 해요)
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView, // 키보드가 올라올 때 화면이 밀리지 않도록 처리
  Platform,             // iOS/Android 분기 처리에 사용
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { AuthStackParamList, RootStackParamList } from '../../types';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// AuthStack 안에서의 네비게이션 타입 (Login → Register 이동에 사용)
type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
// Root 스택 네비게이션 타입 (로그인 성공 후 Main으로 reset에 사용)
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  // useNavigation을 두 번 호출해서 두 스택의 네비게이터에 각각 접근해요.
  const authNav = useNavigation<Nav>();
  const rootNav = useNavigation<RootNav>();

  // Zustand 스토어에서 필요한 액션을 가져와요.
  const { setTokens, setUser } = useAuthStore();
  const { setSubscription } = useSubscriptionStore();

  // ── 로컬 상태 ────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // API 호출 중 버튼 비활성화에 사용

  // 에러 메시지 상태: 각 필드별 에러와 전체 에러(general)를 구분해요.
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string; // 서버에서 반환하는 전체 오류 (예: 이메일 없음, 비번 틀림)
  }>({});

  // ── validate: 서버 호출 전 클라이언트 측 유효성 검사 ─────────────────────────
  // 서버에 잘못된 값을 보내기 전에 먼저 걸러내서 불필요한 네트워크 요청을 줄여요.
  // 에러가 없으면 true, 하나라도 있으면 false를 반환해요.
  const validate = () => {
    const next: typeof errors = {};

    if (!email.trim()) {
      next.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // 정규식: @ 앞뒤에 점(.)이 있고, 공백이 없는 기본 이메일 형식 검사
      next.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!password) next.password = '비밀번호를 입력해주세요';

    setErrors(next);
    return Object.keys(next).length === 0; // 에러 객체가 비어있으면 통과
  };

  // ── handleLogin: 로그인 버튼 클릭 핸들러 ─────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return; // 유효성 검사 실패 시 API 호출 생략

    setLoading(true);
    setErrors({}); // 이전 에러 메시지 초기화

    try {
      // 서버에 로그인 요청 — email 양쪽 공백 제거(trim)는 사용자 실수 방지
      const res = await authApi.login({ email: email.trim(), password });
      const { tokens, user } = res.data.data;

      // 1. JWT 토큰을 SecureStore에 저장 + 스토어 상태 업데이트
      await setTokens(tokens);

      // 2. 사용자 정보를 스토어에 저장
      setUser(user);

      // 3. 구독 상태를 subscriptionStore에 저장
      setSubscription(user.subscriptionType === 'PREMIUM', user.subscriptionExpiresAt);

      // 4. 네비게이션 스택을 완전히 리셋해서 Main으로 이동
      //    reset: 현재 스택을 비우고 새 스택으로 교체 → 뒤로 가기로 로그인 화면 못 돌아옴
      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });

    } catch (err: unknown) {
      // HTTP 상태 코드에 따라 다른 에러 메시지를 보여줘요.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setErrors({ general: '이메일 또는 비밀번호가 올바르지 않아요' });
      } else {
        setErrors({ general: '잠시 후 다시 시도해주세요' });
      }
    } finally {
      // 성공/실패 무관하게 로딩 상태를 해제해요.
      setLoading(false);
    }
  };

  return (
    // KeyboardAvoidingView: 키보드가 올라올 때 화면 콘텐츠가 키보드에 가리지 않게 처리
    // iOS는 'padding'(아래를 밀어올림), Android는 'height'(전체 높이 줄임)로 동작이 달라요.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* StatusBar: 상단 시간/배터리 아이콘 색상 — dark = 어두운 아이콘 (밝은 배경용) */}
      <StatusBar style="dark" />

      {/*
        ScrollView: 화면이 작은 기기에서 키보드가 올라왔을 때 스크롤이 되어야 해요.
        keyboardShouldPersistTaps="handled": 키보드가 열린 채로 버튼 탭이 제대로 작동해요.
        없으면 버튼 첫 탭에서 키보드만 닫히고 버튼 동작은 안 될 수 있어요.
      */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ── 헤더 영역: 앱 로고, 이름, 서브타이틀 ── */}
        <View style={styles.header}>
          <Text style={styles.heartLogo}>💕</Text>
          <Text style={styles.appName}>우리 사이</Text>
          <Text style={styles.subtitle}>우리만의 소중한 공간</Text>
        </View>

        {/* ── 폼 영역: 입력 필드와 버튼 ── */}
        <View style={styles.form}>
          {/* 공통 Input 컴포넌트 — label, error, isPassword 등을 props로 받아요 */}
          <Input
            label="이메일"
            placeholder="love@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}          // 에러가 있으면 빨간 테두리 + 에러 텍스트
            keyboardType="email-address"  // 이메일 키보드 레이아웃 (@ 키가 있음)
            autoComplete="email"          // 자동완성 힌트 (브라우저처럼 저장된 이메일 제안)
          />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword                    // 눈 아이콘으로 비밀번호 표시/숨기기 토글
            autoComplete="password"       // 저장된 비밀번호 자동완성 제안
          />

          {/* 서버 에러 배너 — general 에러가 있을 때만 표시 */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>💔 {errors.general}</Text>
            </View>
          )}

          <Button
            title="로그인"
            onPress={handleLogin}
            loading={loading} // loading=true면 버튼 비활성화 + 스피너 표시
            style={styles.loginBtn}
          />

          {/* 구분선 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>처음이신가요?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 회원가입으로 이동 — outline 스타일 버튼 */}
          <Button
            title="회원가입"
            onPress={() => authNav.navigate('Register')}
            variant="outline"
          />
        </View>

        {/* 하단 장식 문구 */}
        <Text style={styles.footer}>우리가 함께한 모든 순간을 기억해요 🌸</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── 스타일 정의 ───────────────────────────────────────────────────────────────
// StyleSheet.create(): React Native의 스타일 정의 방식 (CSS와 비슷하지만 카멜케이스 사용)
// 색상 팔레트:
//   #FFF5F8 — 매우 연한 핑크 (배경)
//   #FF6B9D — 메인 핑크 (버튼, 포인트)
//   #3D2030 — 진한 다크 버건디 (제목 텍스트)
//   #8B6570 — 중간 톤 (본문 텍스트)
//   #C4A4B0 — 연한 톤 (플레이스홀더, 부제목)
//   #FADADD — 매우 연한 핑크 (테두리, 구분선)
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFF5F8' },

  // flexGrow: 1 — ScrollView 내부에서 남은 공간을 모두 채워요.
  // flex: 1만 쓰면 ScrollView 안에서 동작이 이상할 수 있어서 flexGrow를 써요.
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heartLogo: { fontSize: 56, marginBottom: 12 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3D2030',
    letterSpacing: 2, // 자간 넓히기 — "우 리 사 이" 느낌
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: '#C4A4B0', letterSpacing: 0.5 },
  form: { flex: 1 },

  // 에러 배너: 왼쪽에 빨간 선을 긋고, 배경을 연하게 물들여 강조해요.
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorBannerText: { color: '#C0392B', fontSize: 13, fontWeight: '500' },

  loginBtn: { marginBottom: 24, marginTop: 8 },

  // 구분선: 가로선 두 개 사이에 텍스트를 배치하는 패턴
  // flexDirection: 'row'로 [선] [텍스트] [선] 순서로 나란히 배치해요.
  // 각 선에 flex: 1을 줘서 텍스트를 중앙으로 밀어내요.
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#FADADD' },
  dividerText: { color: '#C4A4B0', fontSize: 13 },

  footer: { textAlign: 'center', color: '#C4A4B0', fontSize: 13, marginTop: 32 },
});
