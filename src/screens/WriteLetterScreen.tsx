// =============================================================================
// 📁 파일 용도: 편지 쓰기 화면 — 본문 입력 + 열람 날짜 선택 + 전송
//
// Props:
//   onClose: 편지 전송 완료 또는 취소 후 부모(LettersScreen)에 알리는 콜백
//            부모에서 Modal을 닫고 편지 목록을 새로고침해요.
//
// 열람 날짜 기본값:
//   오늘로부터 30일 후로 설정해요. 사용자가 변경할 수 있어요.
//   최소 날짜(minimumDate)는 내일로 제한 — 오늘 이전 날짜는 선택 불가.
//
// DateTimePicker:
//   iOS에서는 스피너 또는 달력 형태로 날짜를 선택해요.
//   Android에서는 네이티브 날짜 선택 다이얼로그가 열려요.
//   onChange: 날짜 선택 후 자동으로 닫히고 선택한 날짜를 state에 저장해요.
//
// toISODate(openDate):
//   Date 객체 → "2025-12-25" 형태의 문자열로 변환해서 서버에 보내요.
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { lettersApi } from '../api/letters';
import { toISODate } from '../utils/date';

interface Props {
  onClose: () => void;
}

export default function WriteLetterScreen({ onClose }: Props) {
  const [content, setContent] = useState('');
  const [openDate, setOpenDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const handleSend = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '편지 내용을 입력해주세요');
      return;
    }
    setSubmitting(true);
    try {
      await lettersApi.writeLetter({
        content: content.trim(),
        openDate: toISODate(openDate),
      });
      Alert.alert('전송 완료', '편지가 전송됐어요 💌', [{ text: '확인', onPress: onClose }]);
    } catch {
      Alert.alert('오류', '편지를 보내지 못했어요. 다시 시도해주세요');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>편지 쓰기</Text>
          <TouchableOpacity onPress={handleSend} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#FF6B9D" size="small" />
            ) : (
              <Text style={styles.sendText}>보내기</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.letterPaper}>
            <Text style={styles.letterDecor}>💌 ─────────────────</Text>
            <TextInput
              style={styles.letterInput}
              placeholder="연인에게 전하고 싶은 말을 적어요..."
              placeholderTextColor="#C4A4B0"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
              autoFocus
            />
            <Text style={styles.charCount}>{content.length} / 1000</Text>
          </View>

          {/* 열람일 선택 */}
          <View style={styles.dateSection}>
            <Text style={styles.dateSectionLabel}>편지가 열리는 날</Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerEmoji}>📅</Text>
              <Text style={styles.datePickerText}>
                {openDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateHint}>
              설정한 날짜가 되어야 연인이 편지를 열어볼 수 있어요
            </Text>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={openDate}
            mode="date"
            minimumDate={minDate}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setOpenDate(date);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FADADD',
  },
  cancelText: { color: '#8B6570', fontSize: 15 },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#3D2030' },
  sendText: { color: '#FF6B9D', fontSize: 15, fontWeight: '700' },

  scrollView: { flex: 1 },
  letterPaper: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    minHeight: 280,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  letterDecor: { color: '#FADADD', fontSize: 13, marginBottom: 12 },
  letterInput: {
    fontSize: 16,
    color: '#3D2030',
    lineHeight: 26,
    flex: 1,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, color: '#C4A4B0', textAlign: 'right', marginTop: 8 },

  dateSection: { paddingHorizontal: 20, paddingBottom: 24 },
  dateSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2030',
    marginBottom: 10,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FADADD',
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  datePickerEmoji: { fontSize: 20 },
  datePickerText: { fontSize: 15, color: '#3D2030', fontWeight: '500' },
  dateHint: { fontSize: 12, color: '#C4A4B0', lineHeight: 18 },
});
