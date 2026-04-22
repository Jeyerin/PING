// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 달력 화면 - 날짜별로 사진을 업로드하고, 그 사진이 달력 셀 배경이 되는 화면
//
// 화면 동작 흐름:
//  1. 달력이 표시된다. 사진이 있는 날짜는 해당 사진이 셀 배경으로 표시된다.
//  2. 날짜를 탭하면 모달(팝업)이 열린다.
//  3. 사진이 없는 날: "사진 선택하기" 버튼 → 갤러리에서 사진 선택 → 저장
//  4. 사진이 있는 날: 사진 미리보기 + "사진 바꾸기" / "사진 삭제" 버튼
//
// 사용 라이브러리:
//  - react-native-calendars: 달력 UI를 제공하는 서드파티 라이브러리
//  - expo-image-picker: 기기 갤러리에서 사진을 선택하는 Expo 라이브러리
//
// React Native 주요 개념:
//  - Modal: 화면 위에 떠 있는 팝업 창
//  - Image: 이미지를 표시하는 컴포넌트 (로컬 파일 또는 URL)
//  - useCallback: 함수를 메모이제이션(캐시)해서 불필요한 재생성을 막는 훅
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,            // 이미지를 표시하는 컴포넌트
  Alert,            // 확인/취소 팝업을 띄우는 API
  Modal,            // 화면 위에 겹쳐서 표시되는 팝업 컴포넌트
  Dimensions,       // 현재 화면의 가로/세로 크기를 픽셀로 알려주는 API
} from 'react-native';

// Calendar: 달력 UI 컴포넌트 (react-native-calendars 라이브러리 제공)
import { Calendar } from 'react-native-calendars';

// ImagePicker: 갤러리 또는 카메라에서 이미지를 선택하는 Expo 라이브러리
import * as ImagePicker from 'expo-image-picker';

// 전역 상태(사진 데이터, 새로고침 함수) 접근
import { useApp } from '../context/AppContext';

// 사진을 날짜별로 저장/삭제하는 함수
import { savePhotoForDate, deletePhotoForDate } from '../services/storage';

// ─── 화면 너비 상수 ───────────────────────────────────────────────────────────
// Dimensions.get('window')로 현재 기기 화면 크기를 가져온다.
// 모달 너비를 화면의 85%로 설정할 때 사용한다.
const { width } = Dimensions.get('window');

// ─── CalendarScreen 컴포넌트 ────────────────────────────────────────────────
export default function CalendarScreen() {

  // 전역 Context에서 사진 데이터와 새로고침 함수를 가져온다
  const { photos, refreshPhotos } = useApp();

  // 사용자가 탭한 날짜 문자열 (예: "2026-04-22"). 모달에서 표시·저장에 사용
  const [selectedDate, setSelectedDate] = useState('');

  // 날짜 탭 시 사진 추가/삭제 모달의 표시 여부
  const [modalVisible, setModalVisible] = useState(false);

  // ── 달력의 날짜별 마킹 데이터 생성 ──────────────────────────────────────────
  // react-native-calendars는 markedDates라는 객체로 날짜별 표시 방식을 받는다.
  // photos 객체(날짜→URI 맵)를 순회해서 사진 있는 날짜에 핑크 점을 찍는다.
  //
  // reduce: 배열을 순회하면서 하나의 결과 객체를 만들어가는 Array 메서드
  // acc = 누적 결과 객체, date = 현재 순회 중인 날짜 키
  const markedDates = Object.keys(photos).reduce((acc, date) => {
    acc[date] = {
      marked: true,               // 날짜 아래에 점(dot)을 표시한다
      dotColor: '#FF6B9D',        // 점 색상
      customStyles: {
        container: { backgroundColor: 'transparent' },
      },
    };
    return acc;
  }, {});

  // 현재 선택된 날짜는 핑크 배경으로 강조 표시
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}), // 기존 마킹 정보가 있으면 유지
      selected: true,
      selectedColor: '#FF6B9D',
    };
  }

  // ── 날짜 클릭 핸들러 ────────────────────────────────────────────────────────
  // useCallback: 이 함수를 컴포넌트가 재렌더링될 때마다 새로 만들지 않고 캐시해둔다.
  // DayCell 컴포넌트에 prop으로 전달되므로, 함수가 매번 바뀌면 DayCell도 매번 재렌더링된다.
  // [] = 의존성 없음 → 컴포넌트 생애 동안 한 번만 생성된다.
  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString); // 선택된 날짜를 상태에 저장
    setModalVisible(true);           // 모달을 열어 사진 추가/조회 팝업 표시
  }, []);

  // ── 이미지 선택 함수 ────────────────────────────────────────────────────────
  // 갤러리 권한 요청 → 사진 선택 UI 열기 → 선택 완료 시 저장
  async function pickImage() {
    // 사진 라이브러리 접근 권한을 요청한다
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    // 갤러리(사진 앱)를 열어 사용자가 사진을 선택하게 한다
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 이미지만 선택 가능 (동영상 제외)
      allowsEditing: true,    // 선택 후 자르기/회전 편집 화면을 보여준다
      aspect: [1, 1],         // 편집 비율을 정사각형(1:1)으로 고정
      quality: 0.8,           // 이미지 품질 (0~1, 1이 최고 화질, 용량도 커짐)
    });

    // canceled: 사용자가 취소 버튼을 눌렀을 때
    if (!result.canceled && result.assets[0]) {
      // 선택한 사진의 로컬 파일 경로(URI)를 날짜와 함께 저장
      await savePhotoForDate(selectedDate, result.assets[0].uri);
      refreshPhotos();       // Context의 사진 목록을 갱신 → 달력이 즉시 업데이트됨
      setModalVisible(false); // 모달 닫기
    }
  }

  // ── 사진 삭제 함수 ──────────────────────────────────────────────────────────
  async function deletePhoto() {
    // Alert.alert(제목, 내용, 버튼 배열): 확인/취소 다이얼로그를 띄운다
    Alert.alert('사진 삭제', '이 날의 사진을 삭제할까요?', [
      { text: '취소', style: 'cancel' }, // 취소 버튼: 아무 동작 없음
      {
        text: '삭제',
        style: 'destructive',             // iOS에서 빨간색 버튼으로 표시됨
        onPress: async () => {
          await deletePhotoForDate(selectedDate); // 저장소에서 삭제
          refreshPhotos();                        // 달력 새로고침
          setModalVisible(false);                 // 모달 닫기
        },
      },
    ]);
  }

  // 현재 선택된 날짜에 저장된 사진 URI (없으면 undefined)
  const selectedPhoto = photos[selectedDate];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>우리의 달력 💑</Text>

      {/* ── 달력 컴포넌트 ── */}
      <Calendar
        style={styles.calendar}

        // theme: 달력 내부 색상과 폰트 크기를 커스터마이징한다
        theme={{
          backgroundColor: '#FFF9FB',
          calendarBackground: '#FFF9FB',
          textSectionTitleColor: '#FF6B9D',      // 요일 텍스트(일,월,화...) 색상
          selectedDayBackgroundColor: '#FF6B9D', // 선택된 날짜 배경색
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#FF6B9D',             // 오늘 날짜 텍스트 색상
          dayTextColor: '#2d4150',
          arrowColor: '#FF6B9D',                 // 이전/다음 달 화살표 색상
          monthTextColor: '#FF6B9D',             // 월/연도 제목 색상
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}

        // markedDates: 사진 있는 날짜에 점 표시 + 선택된 날짜 강조
        markedDates={markedDates}

        // 날짜를 탭했을 때 호출되는 콜백
        // day 객체 예시: { dateString: "2026-04-22", day: 22, month: 4, year: 2026 }
        onDayPress={handleDayPress}

        // markingType: 날짜 마킹 방식. "simple"은 점 하나 표시하는 기본 방식
        markingType="simple"

        // 좌우 스와이프로 월을 전환할 수 있게 한다
        enableSwipeMonths

        // dayComponent: 날짜 셀을 완전히 커스텀 렌더링한다.
        // 기본 달력 셀 대신 DayCell 컴포넌트를 사용해서 사진을 배경으로 넣는다.
        dayComponent={({ date, state, marking }) => (
          <DayCell
            date={date}
            state={state}
            marking={marking}
            photo={photos[date?.dateString]}  // 이 날짜에 저장된 사진 URI
            onPress={() => handleDayPress(date)}
          />
        )}
      />

      {/* ── 사진 추가/확인 모달 ── */}
      <Modal
        visible={modalVisible}      // true일 때 모달이 화면에 보인다
        transparent                 // 배경을 투명하게 해서 뒤쪽 화면이 보이게 한다
        animationType="fade"        // 모달이 나타날 때 페이드인 효과
        onRequestClose={() => setModalVisible(false)} // 안드로이드 뒤로가기 버튼 처리
      >
        {/* 반투명 검정 배경 레이어 */}
        <View style={styles.overlay}>
          {/* 흰 모달 박스 */}
          <View style={styles.modalBox}>

            {/* 선택한 날짜 표시 */}
            <Text style={styles.modalDate}>{selectedDate}</Text>

            {/* 사진이 있는 경우: 미리보기 + 바꾸기/삭제 버튼 */}
            {selectedPhoto ? (
              <>
                {/* source: 이미지 출처. { uri: "file:///..." } 형태로 로컬 파일 경로를 넣는다 */}
                <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
                <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
                  <Text style={styles.btnSecondaryText}>사진 바꾸기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={deletePhoto}>
                  <Text style={styles.btnDangerText}>사진 삭제</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* 사진이 없는 경우: 안내 문구 + 추가 버튼 */
              <>
                <Text style={styles.emptyText}>이 날의 사진을 추가해보세요 📸</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={pickImage}>
                  <Text style={styles.btnPrimaryText}>사진 선택하기</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── DayCell 컴포넌트 ────────────────────────────────────────────────────────
// 달력의 각 날짜 셀을 커스텀 렌더링하는 컴포넌트.
// 사진이 있는 날짜는 사진을 배경으로 표시하고, 날짜 숫자를 위에 겹쳐 보여준다.
//
// @param date     - 이 셀의 날짜 정보 (day, month, year, dateString)
// @param state    - 'disabled'(다른 달 날짜), 'today', '' 중 하나
// @param marking  - markedDates에서 이 날짜에 해당하는 마킹 정보
// @param photo    - 이 날짜에 저장된 사진 URI (없으면 undefined)
// @param onPress  - 셀을 탭했을 때 실행할 함수
function DayCell({ date, state, marking, photo, onPress }) {
  const isDisabled = state === 'disabled'; // 이전/다음 달의 날짜 (흐릿하게 표시)
  const isSelected = marking?.selected;   // 현재 선택된 날짜 여부 (?. = null safe 접근)
  const hasPhoto = !!photo;               // 사진 유무 (!!로 불리언 변환)

  return (
    <TouchableOpacity
      onPress={onPress}
      // 조건부 스타일: 선택된 날짜면 테두리를 추가한다
      // StyleSheet.create 대신 배열로 여러 스타일을 합칠 수 있다
      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
    >
      {/* 사진이 있으면 셀 전체를 배경으로 채운다 (absoluteFill 역할) */}
      {hasPhoto && (
        <Image source={{ uri: photo }} style={styles.dayPhoto} />
      )}

      {/* 날짜 숫자 텍스트. 사진 위에 겹쳐서 표시된다 */}
      <Text style={[
        styles.dayText,
        isDisabled && styles.dayTextDisabled,     // 다른 달: 회색
        isSelected && styles.dayTextSelected,     // 선택됨: 핑크 + 굵게
        hasPhoto && styles.dayTextOnPhoto,        // 사진 위: 흰색 + 그림자
      ]}>
        {date?.day}  {/* 날짜 숫자만 표시 (22, 15 등) */}
      </Text>

      {/* 사진이 없는데 마킹된 날짜: 아래에 핑크 점 표시 */}
      {marking?.marked && !hasPhoto && (
        <View style={styles.dot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9FB' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B9D',
    textAlign: 'center',
    paddingVertical: 16,
  },
  calendar: {
    borderRadius: 12,
    marginHorizontal: 12,
    elevation: 2,               // Android 그림자 높이
    shadowColor: '#FF6B9D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  // 각 날짜 셀 (정사각형, 둥근 모서리)
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    overflow: 'hidden',         // 자식 요소가 이 경계를 벗어나면 잘라낸다 (사진이 삐져나오지 않게)
    margin: 2,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: '#FF6B9D',
  },
  dayPhoto: {
    position: 'absolute',       // 부모 View를 기준으로 절대 위치 (다른 요소와 겹칠 수 있다)
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  dayText: { fontSize: 13, color: '#333', fontWeight: '500' },
  dayTextDisabled: { color: '#ccc' },
  dayTextSelected: { color: '#FF6B9D', fontWeight: 'bold' },
  dayTextOnPhoto: {
    color: '#fff',
    fontWeight: 'bold',
    // 텍스트 그림자: 사진 위에서도 날짜가 잘 보이도록
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF6B9D', marginTop: 1 },
  // 모달 배경 (반투명 검정)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // rgba = R,G,B,알파(투명도)
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,        // 화면 너비의 85%
    alignItems: 'center',
  },
  modalDate: { fontSize: 16, fontWeight: 'bold', color: '#FF6B9D', marginBottom: 16 },
  previewImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 16 },
  emptyText: { color: '#999', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  btnPrimary: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#FF6B9D', fontWeight: 'bold', fontSize: 15 },
  btnDanger: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 32, marginBottom: 10, width: '100%', alignItems: 'center' },
  btnDangerText: { color: '#FF4444', fontSize: 14 },
  btnClose: { marginTop: 4, paddingVertical: 8 },
  btnCloseText: { color: '#aaa', fontSize: 14 },
});
