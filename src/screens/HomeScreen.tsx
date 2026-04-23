// =============================================================================
// 📁 파일 용도: 앱의 메인 홈 화면
//
// 이 화면에서 보여주는 것:
//   1. 커플 미연결 상태 → "연인 연결하기" 버튼과 안내 문구
//   2. 커플 연결 상태 → D+Day 숫자, 하트 버튼, 오늘의 문답 카드 미리보기
//
// useFocusEffect 사용 이유:
//   다른 탭에 갔다가 홈 탭으로 돌아올 때마다 최신 데이터를 다시 불러와요.
//   useEffect([], [])는 처음 마운트될 때만 실행되지만,
//   useFocusEffect는 화면이 포커스를 받을 때마다 실행돼요.
//
// Animated.Value를 컴포넌트 본문에서 선언하는 이유:
//   하트 버튼 누를 때마다 새로운 애니메이션이 시작돼야 해서
//   렌더링마다 새 값으로 초기화해요. (useRef로 고정하면 재사용 가능하지만
//   이 패턴은 간단한 일회성 애니메이션에 적합해요)
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated, // React Native 내장 애니메이션 API
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context'; // 노치/홈 인디케이터 영역 안전 처리

import { RootStackParamList, Couple, QuestionWithAnswers } from '../types';
import { coupleApi } from '../api/couple';
import { questionsApi } from '../api/questions';
import { useCoupleStore } from '../store/coupleStore';
import { useAuthStore } from '../store/authStore';
import { haptic } from '../utils/haptics';
import { calcDDay } from '../utils/date';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 스토어에서 커플 상태와 내 정보를 가져와요.
  const { setCouple, isConnected, couple } = useCoupleStore();
  const { user } = useAuthStore();

  // ── 로컬 상태 ────────────────────────────────────────────────────────────────
  const [loadingCouple, setLoadingCouple] = useState(true); // 데이터 첫 로딩 여부
  const [todayQ, setTodayQ] = useState<QuestionWithAnswers | null>(null); // 오늘의 문답
  const [presenceSent, setPresenceSent] = useState(false); // 하트 버튼 전송 완료 상태

  // 하트 버튼 애니메이션에 쓸 크기 값 (1 = 원래 크기)
  const heartScale = new Animated.Value(1);

  // ── useFocusEffect: 화면이 포커스될 때마다 데이터 새로고침 ─────────────────
  // useCallback으로 감싸야 하는 이유:
  //   useFocusEffect는 콜백이 바뀔 때마다 다시 등록하는데,
  //   useCallback(fn, [])은 의존성이 없으니 콜백이 바뀌지 않아요. → 무한 루프 방지
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // ── loadData: 커플 정보 + 오늘의 문답을 서버에서 가져오는 함수 ──────────────
  const loadData = async () => {
    try {
      // 커플 정보 조회 (API 에러 나면 → 미연결 상태로 처리)
      const coupleRes = await coupleApi.getMyCouple();
      setCouple(coupleRes.data.data); // 스토어에 저장

      // 오늘의 문답 카드 미리보기용
      const qRes = await questionsApi.getToday();
      setTodayQ(qRes.data.data);
    } catch {
      // 커플 미연결(404) 또는 기타 에러 → null 처리
      setCouple(null);
    } finally {
      setLoadingCouple(false); // 로딩 스피너 해제
    }
  };

  // ── handleHeartPress: "나 여기 있어요" 하트 버튼 클릭 ───────────────────────
  const handleHeartPress = async () => {
    // Animated.sequence: 애니메이션들을 순서대로 실행해요.
    // 1) 크기를 1 → 1.25로 늘리고 (spring: 탄성 있는 애니메이션)
    // 2) 다시 1로 줄여요.
    // useNativeDriver: true — JS 스레드 대신 네이티브 스레드에서 실행해서 부드러워요.
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.25, useNativeDriver: true, speed: 20 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 12 }),
    ]).start();

    // 진동 피드백 (성공 패턴)
    await haptic.success();

    try {
      // 서버에 "나 여기 있어요" 신호 전송 → 서버가 상대방에게 푸시 알림 발송
      await coupleApi.sendPresence();
      setPresenceSent(true);

      // 3초 후 전송 완료 메시지를 원래 안내 문구로 되돌려요.
      setTimeout(() => setPresenceSent(false), 3000);
    } catch {
      // 전송 실패는 조용히 무시 (네트워크 문제 등 — 사용자에게 에러 띄우지 않음)
    }
  };

  // ── 로딩 중 UI ───────────────────────────────────────────────────────────────
  if (loadingCouple) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6B9D" size="large" />
      </View>
    );
  }

  // ── 커플 미연결 상태 UI ───────────────────────────────────────────────────────
  // isConnected가 false이거나 couple 데이터가 없으면 이 화면을 보여줘요.
  if (!isConnected || !couple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notConnected}>
          <Text style={styles.notConnectedEmoji}>💌</Text>
          <Text style={styles.notConnectedTitle}>연인과 아직 연결되지 않았어요</Text>
          <Text style={styles.notConnectedDesc}>초대 코드로 서로를 연결해 보세요</Text>
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => navigation.navigate('CoupleConnect')} // CoupleConnect 모달 열기
          >
            <Text style={styles.connectBtnText}>연인 연결하기 →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── 연결 상태에서 D+Day 계산 ──────────────────────────────────────────────────
  const dDay = calcDDay(couple.startDate); // 사귀기 시작한 날로부터 오늘까지 일 수

  // 상대방 정보 추출: 커플의 user1, user2 중 내가 아닌 쪽이 파트너예요.
  const partnerUser = couple.user1.id === user?.id ? couple.user2 : couple.user1;

  // ── 메인 UI (커플 연결 상태) ──────────────────────────────────────────────────
  return (
    // edges={['top']}: 상단 Safe Area(노치 영역)만 피해요. 아래는 탭 바가 처리해요.
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── D+Day 섹션 ─────────────────────────────────────────────────── */}
        <View style={styles.dDaySection}>
          <Text style={styles.dDayLabel}>우리가 함께한 지</Text>
          {/* D+365 처럼 숫자를 크게 강조해서 커플앱 핵심 감성을 전달해요 */}
          <Text style={styles.dDayNumber}>D+{dDay}</Text>
          {/* 내 닉네임 💕 상대방 닉네임 형태로 표시 */}
          <Text style={styles.dDaySubLabel}>
            {user?.nickname} 💕 {partnerUser.nickname}
          </Text>
        </View>

        {/* ── 하트 버튼 섹션 ─────────────────────────────────────────────── */}
        <View style={styles.heartSection}>
          {/*
            presenceSent가 true이면 "전달됐어요" 메시지로 교체돼요.
            3초 후 자동으로 원래 문구로 돌아와요.
          */}
          <Text style={styles.heartGuide}>
            {presenceSent
              ? `${partnerUser.nickname}에게 전달됐어요 💌`
              : '나 여기 있어요'}
          </Text>

          {/*
            Animated.View: 이 안의 컴포넌트에 애니메이션을 적용할 수 있어요.
            transform: [{ scale: heartScale }]: heartScale 값이 바뀌면 크기가 변해요.
          */}
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={handleHeartPress}
              activeOpacity={0.85} // 탭 시 85% 투명도로 눌린 느낌 표현
            >
              <Text style={styles.heartEmoji}>❤️</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.heartDesc}>버튼을 누르면 연인에게 알림이 가요</Text>
        </View>

        {/* ── 오늘의 문답 미리보기 카드 ──────────────────────────────────── */}
        {/* todayQ가 null이면 이 카드 자체를 렌더링하지 않아요 */}
        {todayQ && (
          <View style={styles.questionCard}>
            <View style={styles.questionCardHeader}>
              <Text style={styles.questionCardBadge}>오늘의 문답</Text>
              {/* 둘 다 답변 완료했을 때만 "✓ 완료" 뱃지 표시 */}
              {todayQ.bothAnswered && (
                <Text style={styles.questionCardBadgeDone}>✓ 완료</Text>
              )}
            </View>
            <Text style={styles.questionText}>{todayQ.question.question}</Text>
            {todayQ.myAnswer ? (
              // 내 답변이 있으면 앞 40글자만 미리보기로 보여줘요.
              <Text style={styles.questionAnswerPreview}>
                내 답변: {todayQ.myAnswer.answer.slice(0, 40)}
                {todayQ.myAnswer.answer.length > 40 ? '...' : ''}
              </Text>
            ) : (
              <Text style={styles.questionAnswerEmpty}>아직 답변하지 않았어요</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
  },

  // ── 미연결 상태 스타일 ─────────────────────────────────────────────────────
  notConnected: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  notConnectedEmoji: { fontSize: 64, marginBottom: 16 },
  notConnectedTitle: {
    fontSize: 20, fontWeight: '700', color: '#3D2030',
    textAlign: 'center', marginBottom: 8,
  },
  notConnectedDesc: { fontSize: 14, color: '#8B6570', textAlign: 'center', marginBottom: 32 },
  connectBtn: {
    backgroundColor: '#FF6B9D', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── D+Day 섹션 스타일 ──────────────────────────────────────────────────────
  dDaySection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  dDayLabel: { fontSize: 15, color: '#8B6570', marginBottom: 4, letterSpacing: 0.3 },
  dDayNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FF6B9D',
    letterSpacing: -2, // 글자 간격을 좁혀서 큰 숫자가 하나로 붙은 것처럼 보이게 해요
  },
  dDaySubLabel: { fontSize: 16, color: '#C4A4B0', marginTop: 4 },

  // ── 하트 버튼 섹션 스타일 ─────────────────────────────────────────────────
  heartSection: { alignItems: 'center', paddingBottom: 36 },
  heartGuide: { fontSize: 16, color: '#8B6570', marginBottom: 20, fontWeight: '500' },
  heartButton: {
    width: 140,
    height: 140,
    borderRadius: 70, // 정원 (width/2)
    backgroundColor: '#FFF0F4',
    justifyContent: 'center',
    alignItems: 'center',
    // 핑크 그림자 — iOS
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10, // Android 그림자
    borderWidth: 3,
    borderColor: '#FADADD',
  },
  heartEmoji: { fontSize: 64 },
  heartDesc: { fontSize: 12, color: '#C4A4B0', marginTop: 16 },

  // ── 문답 카드 스타일 ───────────────────────────────────────────────────────
  questionCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // pill 형태의 태그 뱃지 스타일
  questionCardBadge: {
    backgroundColor: '#FFF0F4', color: '#FF6B9D',
    fontSize: 12, fontWeight: '600',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  questionCardBadgeDone: {
    backgroundColor: '#F0FFF4', color: '#27AE60',
    fontSize: 12, fontWeight: '600',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  questionText: {
    fontSize: 16, fontWeight: '600', color: '#3D2030',
    lineHeight: 24, marginBottom: 10,
  },
  questionAnswerPreview: { fontSize: 13, color: '#8B6570', lineHeight: 20 },
  questionAnswerEmpty: { fontSize: 13, color: '#C4A4B0', fontStyle: 'italic' },
});
