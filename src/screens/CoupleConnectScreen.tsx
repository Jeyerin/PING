// =============================================================================
// 📁 파일 용도: 커플 연결 화면 — 초대 코드 공유 및 상대방 코드 입력으로 연결
//
// 화면 구성:
//   1. 내 초대 코드 카드 + 복사 버튼
//   2. 상대방 초대 코드 입력 필드 + 연결 버튼
//   3. 연결 성공 시 하트 애니메이션 + 자동으로 홈 화면으로 이동
//
// playConnectAnimation:
//   두 개의 하트가 순차적으로 튀어오르는 Spring 애니메이션이에요.
//   애니메이션이 끝나고 1.8초 뒤에 홈 화면으로 이동해요.
//   navigation.reset()을 써서 뒤로 가기로 이 화면에 돌아오지 못하게 해요.
// =============================================================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';
import { coupleApi } from '../api/couple';
import { useCoupleStore } from '../store/coupleStore';
import { haptic } from '../utils/haptics';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function CoupleConnectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setCouple } = useCoupleStore();

  const [myCode, setMyCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const heartScale1 = useRef(new Animated.Value(0)).current;
  const heartScale2 = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMyCode();
  }, []);

  const loadMyCode = async () => {
    try {
      const res = await coupleApi.getMyInviteCode();
      setMyCode(res.data.data.inviteCode);
    } catch {}
  };

  const handleCopyCode = async () => {
    Clipboard.setString(myCode);
    await haptic.light();
    Alert.alert('복사 완료', '초대 코드가 복사됐어요 💕');
  };

  const handleConnect = async () => {
    if (!partnerCode.trim()) {
      setError('상대방의 초대 코드를 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await coupleApi.connect({ inviteCode: partnerCode.trim() });
      setCouple(res.data.data);
      await haptic.success();
      playConnectAnimation();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setError('존재하지 않는 초대 코드예요');
      else if (status === 409) setError('이미 연결된 계정이에요');
      else setError('연결에 실패했어요. 다시 시도해주세요');
      await haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const playConnectAnimation = () => {
    setConnected(true);
    Animated.parallel([
      Animated.spring(heartScale1, { toValue: 1, useNativeDriver: true, tension: 50 }),
      Animated.spring(heartScale2, { toValue: 1, useNativeDriver: true, tension: 50, delay: 150 }),
      Animated.timing(heartOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }, 1800);
    });
  };

  if (connected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.heartRow,
              { opacity: heartOpacity },
            ]}
          >
            <Animated.Text style={[styles.bigHeart, { transform: [{ scale: heartScale1 }] }]}>
              ❤️
            </Animated.Text>
            <Animated.Text style={[styles.bigHeart, { transform: [{ scale: heartScale2 }] }]}>
              ❤️
            </Animated.Text>
          </Animated.View>
          <Text style={styles.successTitle}>연결됐어요!</Text>
          <Text style={styles.successDesc}>이제 함께 소중한 순간을 기록해요 💕</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>연인과 연결하기 💌</Text>
        <Text style={styles.subtitle}>서로의 초대 코드를 교환해서 연결해요</Text>

        {/* 내 초대 코드 */}
        <View style={styles.myCodeCard}>
          <Text style={styles.myCodeLabel}>내 초대 코드</Text>
          <Text style={styles.myCodeValue}>{myCode || '불러오는 중...'}</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyCode}
            disabled={!myCode}
          >
            <Text style={styles.copyBtnText}>📋 코드 복사</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>💕</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 상대방 코드 입력 */}
        <Input
          label="상대방 초대 코드"
          placeholder="연인의 코드를 입력해주세요"
          value={partnerCode}
          onChangeText={setPartnerCode}
          error={error}
          autoCapitalize="characters"
        />

        <Button
          title="연결하기"
          onPress={handleConnect}
          loading={loading}
          style={styles.connectBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  backBtn: { marginBottom: 24 },
  backText: { color: '#FF6B9D', fontSize: 14, fontWeight: '500' },
  title: { fontSize: 26, fontWeight: '800', color: '#3D2030', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B6570', marginBottom: 32 },

  myCodeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  myCodeLabel: { fontSize: 12, color: '#C4A4B0', marginBottom: 8, fontWeight: '500' },
  myCodeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B9D',
    letterSpacing: 4,
    marginBottom: 16,
  },
  copyBtn: {
    backgroundColor: '#FFF0F4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  copyBtnText: { color: '#FF6B9D', fontWeight: '600', fontSize: 14 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#FADADD' },
  dividerText: { fontSize: 18 },

  connectBtn: { marginTop: 8 },

  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  heartRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  bigHeart: { fontSize: 72 },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3D2030',
    marginBottom: 12,
  },
  successDesc: { fontSize: 16, color: '#8B6570', textAlign: 'center' },
});
