// =============================================================================
// 📁 파일 용도: 커플 문답 화면 — 오늘의 질문 답변 + 히스토리
//
// 화면 구성:
//   1. 오늘의 질문 카드 (최상단 고정)
//      - 미답변 상태: 텍스트 입력창 + "답변 제출하기" 버튼
//      - 답변 완료 (상대방 미답변): 내 답변 + "상대방이 아직 답변 중이에요..." 박스
//      - 둘 다 완료: 내 답변 + 상대방 답변 모두 공개
//   2. 지난 문답 히스토리 (스크롤 가능한 카드 목록)
//
// 답변 제출 후 loadData()를 다시 호출하는 이유:
//   답변 제출 후 상대방이 이미 답변했을 경우 서버가 bothAnswered=true를 반환해요.
//   재조회해서 최신 상태를 즉시 반영해요.
//
// Promise.all:
//   오늘의 문답과 히스토리를 동시에(병렬로) 가져와서 로딩 시간을 절반으로 줄여요.
//   순차적으로 기다리면 두 요청의 시간이 더해지지만, Promise.all은 동시에 시작해요.
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionWithAnswers } from '../types';
import { questionsApi } from '../api/questions';
import { useAuthStore } from '../store/authStore';
import { haptic } from '../utils/haptics';

export default function QuestionScreen() {
  const { user } = useAuthStore();
  const [today, setToday] = useState<QuestionWithAnswers | null>(null);
  const [history, setHistory] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        questionsApi.getToday(),
        questionsApi.getHistory(),
      ]);
      setToday(todayRes.data.data);
      setHistory(histRes.data.data);
      if (todayRes.data.data.myAnswer) {
        setAnswer(todayRes.data.data.myAnswer.answer);
      }
    } catch {
      Alert.alert('오류', '문답을 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || !today) return;
    setSubmitting(true);
    try {
      await questionsApi.submitAnswer(today.question.id, answer.trim());
      await haptic.success();
      await loadData();
    } catch {
      Alert.alert('오류', '답변을 제출하지 못했어요');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6B9D" size="large" />
      </View>
    );
  }

  const alreadyAnswered = !!today?.myAnswer;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>오늘의 문답 💬</Text>

          {/* 오늘 질문 카드 */}
          {today && (
            <View style={styles.todayCard}>
              <Text style={styles.cardLabel}>TODAY</Text>
              <Text style={styles.questionText}>{today.question.question}</Text>

              {!alreadyAnswered ? (
                <>
                  <TextInput
                    style={styles.answerInput}
                    placeholder="솔직하게 답해봐요..."
                    placeholderTextColor="#C4A4B0"
                    value={answer}
                    onChangeText={setAnswer}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[styles.submitBtn, (!answer.trim() || submitting) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!answer.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>답변 제출하기 💕</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.answeredSection}>
                  {/* 내 답변 */}
                  <View style={styles.answerBubble}>
                    <Text style={styles.answerBubbleLabel}>나 ({user?.nickname})</Text>
                    <Text style={styles.answerBubbleText}>{today.myAnswer?.answer}</Text>
                  </View>

                  {/* 상대방 답변 */}
                  {today.bothAnswered && today.partnerAnswer ? (
                    <View style={[styles.answerBubble, styles.partnerBubble]}>
                      <Text style={styles.answerBubbleLabel}>상대방</Text>
                      <Text style={styles.answerBubbleText}>{today.partnerAnswer.answer}</Text>
                    </View>
                  ) : (
                    <View style={styles.waitingBox}>
                      <Text style={styles.waitingEmoji}>⏳</Text>
                      <Text style={styles.waitingText}>상대방이 아직 답변 중이에요...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 히스토리 */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>지난 문답들 📖</Text>
              {history.map((item) => (
                <View key={item.question.id} style={styles.historyCard}>
                  <Text style={styles.historyDate}>{item.question.date}</Text>
                  <Text style={styles.historyQuestion}>{item.question.question}</Text>
                  {item.bothAnswered ? (
                    <View style={styles.historyBothBadge}>
                      <Text style={styles.historyBothText}>둘 다 답변 완료 ✓</Text>
                    </View>
                  ) : (
                    <Text style={styles.historyPendingText}>미완료</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D2030',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  todayCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B9D',
    letterSpacing: 2,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D2030',
    lineHeight: 26,
    marginBottom: 20,
  },
  answerInput: {
    backgroundColor: '#FFF9FB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FADADD',
    padding: 14,
    fontSize: 15,
    color: '#3D2030',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  answeredSection: { gap: 12 },
  answerBubble: {
    backgroundColor: '#FFF0F4',
    borderRadius: 14,
    padding: 14,
  },
  partnerBubble: { backgroundColor: '#FFF5F0' },
  answerBubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C4A4B0',
    marginBottom: 6,
  },
  answerBubbleText: { fontSize: 14, color: '#3D2030', lineHeight: 20 },

  waitingBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  waitingEmoji: { fontSize: 28, marginBottom: 8 },
  waitingText: { fontSize: 14, color: '#8B6570' },

  historySection: { paddingHorizontal: 20, paddingBottom: 24 },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D2030',
    marginBottom: 14,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FADADD',
  },
  historyDate: { fontSize: 11, color: '#C4A4B0', marginBottom: 4 },
  historyQuestion: { fontSize: 14, color: '#3D2030', fontWeight: '500', marginBottom: 8 },
  historyBothBadge: {
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  historyBothText: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  historyPendingText: { fontSize: 11, color: '#C4A4B0' },
});
