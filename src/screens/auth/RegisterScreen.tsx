// =============================================================================
// 📁 파일 용도: 회원가입 화면 — 이메일, 닉네임, 비밀번호 입력 및 계정 생성
//
// 유효성 검사 항목:
//   - 이메일: 빈 값 + 정규식으로 형식 검사
//   - 닉네임: 빈 값 + 최대 10자 제한 (연인에게 보이는 이름)
//   - 비밀번호: 빈 값 + 최소 8자 이상
//   - 비밀번호 확인: 비밀번호 일치 여부
//
// LoginScreen과의 차이점:
//   비밀번호 확인 필드가 하나 더 있고,
//   에러 타입이 LoginScreen보다 더 많아서 FormErrors 인터페이스를 별도로 정의했어요.
//
// 회원가입 성공 후 흐름:
//   authApi.register() → 서버가 바로 JWT 발급 → setTokens() → 메인화면 이동
//   로그인 화면을 거치지 않고 바로 앱을 사용할 수 있어요.
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

interface FormErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
  general?: string;
}

export default function RegisterScreen() {
  const authNav = useNavigation<Nav>();
  const rootNav = useNavigation<RootNav>();
  const { setTokens, setUser } = useAuthStore();
  const { setSubscription } = useSubscriptionStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!email.trim()) next.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = '올바른 이메일 형식이 아닙니다';
    if (!password) next.password = '비밀번호를 입력해주세요';
    else if (password.length < 8) next.password = '비밀번호는 8자 이상이어야 해요';
    if (password !== passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않아요';
    if (!nickname.trim()) next.nickname = '닉네임을 입력해주세요';
    else if (nickname.trim().length > 10) next.nickname = '닉네임은 10자 이하로 입력해주세요';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await authApi.register({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });
      const { tokens, user } = res.data.data;

      await setTokens(tokens);
      setUser(user);
      setSubscription(user.subscriptionType === 'PREMIUM', user.subscriptionExpiresAt);

      rootNav.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrors({ email: '이미 사용 중인 이메일이에요' });
      } else {
        setErrors({ general: '회원가입에 실패했어요. 잠시 후 다시 시도해주세요' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => authNav.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 로그인으로</Text>
          </TouchableOpacity>
          <Text style={styles.heartLogo}>🌸</Text>
          <Text style={styles.title}>시작해요</Text>
          <Text style={styles.subtitle}>함께할 준비가 됐나요?</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이메일"
            placeholder="love@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="닉네임"
            placeholder="연인에게 보여질 이름 (최대 10자)"
            value={nickname}
            onChangeText={setNickname}
            error={errors.nickname}
            maxLength={10}
          />
          <Input
            label="비밀번호"
            placeholder="8자 이상"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />
          <Input
            label="비밀번호 확인"
            placeholder="비밀번호를 한 번 더 입력해주세요"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            error={errors.passwordConfirm}
            isPassword
          />

          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>💔 {errors.general}</Text>
            </View>
          )}

          <Button
            title="회원가입 완료"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        <Text style={styles.footer}>가입하면 이용약관 및 개인정보처리방침에 동의하게 됩니다</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFF5F8' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: { marginBottom: 36 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#FF6B9D', fontSize: 14, fontWeight: '500' },
  heartLogo: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3D2030',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#C4A4B0',
    textAlign: 'center',
  },
  form: {},
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorBannerText: { color: '#C0392B', fontSize: 13, fontWeight: '500' },
  submitBtn: { marginTop: 8 },
  footer: {
    textAlign: 'center',
    color: '#C4A4B0',
    fontSize: 11,
    marginTop: 24,
    lineHeight: 18,
  },
});
