// =============================================================================
// 📁 파일 용도: 달력 화면 — 날짜별 사진·메모 기록 및 조회
//
// 주요 기능:
//   - react-native-calendars로 월별 달력을 렌더링해요.
//   - 사진이 있는 날짜에는 핑크 점(dot)을 표시해요.
//   - 날짜 탭 시: 사진이 있으면 상세 모달, 없으면 추가 모달을 열어요.
//   - 사진 추가: 카메라 또는 갤러리 선택 → 서버에 multipart 업로드
//   - FREE 플랜: 사진 10장 초과 시도 시 PremiumModal을 보여줘요.
//
// markedDates:
//   react-native-calendars에서 달력 날짜에 점, 선택 표시 등을 설정하는 객체예요.
//   { "2024-07-14": { marked: true, dotColor: '#FF6B9D' } } 형태로 구성해요.
//   entries 배열을 reduce()로 변환해서 만들어요.
//
// useFocusEffect + useCallback:
//   달력 탭에 올 때마다 해당 연월의 사진 기록을 서버에서 최신화해요.
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarEntry } from '../types';
import { calendarApi } from '../api/calendar';
import { useSubscriptionStore } from '../store/subscriptionStore';
import PremiumModal from '../components/common/PremiumModal';
import { toISODate } from '../utils/date';

const FREE_PHOTO_LIMIT = 10;

export default function CalendarScreen() {
  const { isPremium } = useSubscriptionStore();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [totalPhotoCount, setTotalPhotoCount] = useState(0);

  // 상세 모달
  const [detailVisible, setDetailVisible] = useState(false);
  // 사진 추가 모달
  const [addVisible, setAddVisible] = useState(false);
  const [memo, setMemo] = useState('');
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // 프리미엄 모달
  const [premiumVisible, setPremiumVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEntries(currentYear, currentMonth);
    }, [currentYear, currentMonth]),
  );

  const loadEntries = async (year: number, month: number) => {
    setLoadingEntries(true);
    try {
      const res = await calendarApi.getEntries(year, month);
      const map: Record<string, CalendarEntry> = {};
      res.data.data.forEach((e) => { map[e.date] = e; });
      setEntries(map);
    } catch {}
    finally { setLoadingEntries(false); }
  };

  const markedDates = Object.keys(entries).reduce<Record<string, unknown>>((acc, date) => {
    const entry = entries[date];
    acc[date] = {
      marked: true,
      dotColor: '#FF6B9D',
      customStyles: entry.photoUrl
        ? {
            container: { backgroundColor: 'transparent' },
            text: { color: '#3D2030' },
          }
        : {},
    };
    return acc;
  }, {});

  const handleDayPress = (day: DateData) => {
    const date = day.dateString;
    const entry = entries[date];
    if (entry) {
      setSelectedEntry(entry);
      setSelectedDate(date);
      setDetailVisible(true);
    } else {
      setSelectedDate(date);
      setAddVisible(true);
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleAddEntry = async () => {
    if (!pickedUri || !selectedDate) return;

    if (!isPremium && totalPhotoCount >= FREE_PHOTO_LIMIT) {
      setAddVisible(false);
      setPremiumVisible(true);
      return;
    }

    setUploading(true);
    try {
      const res = await calendarApi.createEntry(selectedDate, pickedUri, memo || undefined);
      setEntries((prev) => ({ ...prev, [selectedDate]: res.data.data }));
      setTotalPhotoCount((n) => n + 1);
      setAddVisible(false);
      setPickedUri(null);
      setMemo('');
    } catch {
      Alert.alert('오류', '사진을 저장하지 못했어요');
    } finally {
      setUploading(false);
    }
  };

  const showSourcePicker = () => {
    Alert.alert('사진 선택', '', [
      { text: '카메라', onPress: () => handlePickImage('camera') },
      { text: '갤러리', onPress: () => handlePickImage('gallery') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>우리의 달력 📅</Text>

      <Calendar
        current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
        onMonthChange={(month) => {
          setCurrentYear(month.year);
          setCurrentMonth(month.month);
        }}
        onDayPress={handleDayPress}
        markedDates={markedDates as Record<string, never>}
        markingType="custom"
        theme={{
          backgroundColor: '#FFF5F8',
          calendarBackground: '#FFF5F8',
          selectedDayBackgroundColor: '#FF6B9D',
          selectedDayTextColor: '#fff',
          todayTextColor: '#FF6B9D',
          dayTextColor: '#3D2030',
          arrowColor: '#FF6B9D',
          monthTextColor: '#3D2030',
          textMonthFontWeight: '700',
          textDayFontSize: 14,
          dotColor: '#FF6B9D',
        }}
      />

      {/* 날짜 상세 모달 */}
      <Modal visible={detailVisible} animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕ 닫기</Text>
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.modalDate}>{selectedDate}</Text>
            {selectedEntry?.photoUrl && (
              <Image source={{ uri: selectedEntry.photoUrl }} style={styles.detailPhoto} />
            )}
            {selectedEntry?.memo && (
              <View style={styles.memoBox}>
                <Text style={styles.memoLabel}>메모</Text>
                <Text style={styles.memoText}>{selectedEntry.memo}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 사진 추가 모달 */}
      <Modal visible={addVisible} animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity onPress={() => { setAddVisible(false); setPickedUri(null); setMemo(''); }} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕ 취소</Text>
          </TouchableOpacity>
          <Text style={styles.modalDate}>{selectedDate} 추가하기</Text>

          <TouchableOpacity style={styles.photoPickBtn} onPress={showSourcePicker}>
            {pickedUri ? (
              <Image source={{ uri: pickedUri }} style={styles.pickedPhoto} />
            ) : (
              <>
                <Text style={styles.photoPickIcon}>📷</Text>
                <Text style={styles.photoPickText}>사진을 선택해주세요</Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.memoInput}
            placeholder="오늘의 한마디를 남겨요 (선택)"
            placeholderTextColor="#C4A4B0"
            value={memo}
            onChangeText={setMemo}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[styles.saveBtn, (!pickedUri || uploading) && styles.saveBtnDisabled]}
            onPress={handleAddEntry}
            disabled={!pickedUri || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>저장하기 💕</Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <PremiumModal
        visible={premiumVisible}
        onClose={() => setPremiumVisible(false)}
        featureName={`사진 ${FREE_PHOTO_LIMIT}장 초과 등록`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D2030',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  modalContainer: { flex: 1, backgroundColor: '#FFF5F8', padding: 20 },
  modalClose: { marginBottom: 16 },
  modalCloseText: { color: '#FF6B9D', fontWeight: '600', fontSize: 15 },
  modalDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2030',
    marginBottom: 20,
  },
  detailPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginBottom: 16,
  },
  memoBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  memoLabel: { fontSize: 12, color: '#C4A4B0', marginBottom: 6, fontWeight: '600' },
  memoText: { fontSize: 15, color: '#3D2030', lineHeight: 22 },

  photoPickBtn: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FADADD',
    borderStyle: 'dashed',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoPickIcon: { fontSize: 36, marginBottom: 8 },
  photoPickText: { color: '#C4A4B0', fontSize: 14 },
  pickedPhoto: { width: '100%', height: '100%' },
  memoInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FADADD',
    padding: 14,
    fontSize: 15,
    color: '#3D2030',
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
