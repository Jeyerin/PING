// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 설정 화면 - 내 이름, 파트너 이름, 파트너 푸시 토큰을 입력·저장하는 화면
//
// 화면 구성:
//  1. "내 정보" 섹션: 내 이름 입력
//  2. "파트너 정보" 섹션: 파트너 이름 + 파트너의 푸시 토큰 입력
//  3. "내 푸시 토큰" 섹션: 이 기기의 토큰 표시 (파트너에게 공유용)
//  4. 저장하기 버튼
//
// 푸시 알림 연결 방법:
//  - 내 토큰 → 파트너에게 공유 → 파트너가 설정 화면에 입력
//  - 파트너 토큰 → 내 설정에 입력
//  - 그러면 버튼 클릭 시 파트너 토큰을 사용해서 알림을 보낼 수 있다
//
// React Native 주요 컴포넌트:
//  - TextInput: 텍스트를 입력받는 컴포넌트 (웹의 <input>)
//  - ScrollView: 내용이 화면보다 길 때 스크롤되는 컨테이너
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,         // 텍스트 입력 필드 컴포넌트 (웹의 <input type="text">)
  TouchableOpacity,
  Alert,
  ScrollView,        // 스크롤 가능한 컨테이너 (내용이 화면보다 길 때 사용)
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

// 전역 Context에서 파트너 정보, 푸시 토큰, 파트너 정보 업데이트 함수를 가져온다
import { useApp } from '../context/AppContext';

// 파트너 정보를 기기에 저장하는 함수
import { savePartnerInfo } from '../services/storage';

// ─── SettingsScreen 컴포넌트 ─────────────────────────────────────────────────
export default function SettingsScreen() {

  // Context에서 전역 상태와 함수를 가져온다
  const { partnerInfo, pushToken, setPartnerInfo } = useApp();

  // ── 로컬 폼 상태 ─────────────────────────────────────────────────────────────
  // TextInput의 현재 입력값을 각각의 state로 관리한다.
  // 사용자가 타이핑할 때마다 state가 업데이트되어 화면이 다시 렌더링된다.
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerToken, setPartnerToken] = useState(''); // 파트너의 푸시 토큰

  // ── 기존 저장된 정보로 폼 초기화 ─────────────────────────────────────────────
  // Context의 partnerInfo가 로드되면 (앱 시작 시 AsyncStorage에서 읽혀오면)
  // 폼 필드에 기존 값을 채워넣는다.
  //
  // useEffect의 두 번째 인수 [partnerInfo]:
  // partnerInfo가 바뀔 때마다 이 코드가 실행된다.
  useEffect(() => {
    if (partnerInfo) {
      // Optional chaining (?.) + 기본값(|| ''): 값이 없으면 빈 문자열로 대체
      setMyName(partnerInfo.myName || '');
      setPartnerName(partnerInfo.partnerName || '');
      setPartnerToken(partnerInfo.partnerToken || '');
    }
  }, [partnerInfo]); // partnerInfo가 변경될 때만 실행

  // ── 저장 버튼 핸들러 ─────────────────────────────────────────────────────────
  async function save() {
    // 내 이름은 필수값이므로 비어 있으면 저장하지 않는다
    if (!myName.trim()) {
      Alert.alert('이름을 입력해주세요');
      return;
    }

    // 저장할 파트너 정보 객체를 만든다
    // .trim()으로 앞뒤 공백을 제거한다
    const info = {
      myName: myName.trim(),
      partnerName: partnerName.trim(),
      partnerToken: partnerToken.trim(),
    };

    // AsyncStorage에 저장 (앱을 껐다 켜도 유지됨)
    await savePartnerInfo(info);

    // Context의 전역 상태도 업데이트 (다른 화면에서도 즉시 반영됨)
    setPartnerInfo(info);

    Alert.alert('저장 완료 ✅', '파트너 정보가 저장되었습니다.');
  }

  // ── 내 토큰 표시 ─────────────────────────────────────────────────────────────
  // 파트너에게 알려줄 내 푸시 토큰을 팝업으로 보여준다.
  // (실제 앱에서는 클립보드 복사 기능을 추가하면 좋다)
  function copyToken() {
    if (pushToken) {
      Alert.alert('내 토큰', pushToken, [{ text: '확인' }]);
    }
  }

  return (
    // ScrollView: 화면보다 내용이 길 때 스크롤할 수 있게 해준다
    // contentContainerStyle: ScrollView 내부 컨텐츠에 적용할 스타일
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>설정 ⚙️</Text>

      {/* 내 정보 섹션 */}
      <Section title="내 정보">
        <InputRow
          icon="person"
          placeholder="내 이름"
          value={myName}
          onChangeText={setMyName}  // 텍스트가 바뀔 때마다 state 업데이트
        />
      </Section>

      {/* 파트너 정보 섹션 */}
      <Section title="파트너 정보">
        <InputRow
          icon="heart"
          placeholder="파트너 이름"
          value={partnerName}
          onChangeText={setPartnerName}
        />
        {/* 토큰은 길기 때문에 여러 줄 입력(multiline)으로 표시 */}
        <InputRow
          icon="notifications"
          placeholder="파트너 푸시 토큰"
          value={partnerToken}
          onChangeText={setPartnerToken}
          multiline  // 여러 줄 입력 허용 (long text)
        />
      </Section>

      {/* 내 푸시 토큰 섹션: 파트너에게 알려줄 토큰 */}
      <Section title="내 푸시 토큰">
        {/* 터치하면 전체 토큰을 팝업으로 보여준다 */}
        <TouchableOpacity style={styles.tokenBox} onPress={copyToken}>
          <Ionicons name="key-outline" size={18} color="#FF6B9D" />
          {/* numberOfLines: 최대 2줄까지만 표시하고 넘치면 ... 처리 */}
          <Text style={styles.tokenText} numberOfLines={2}>
            {pushToken || '토큰을 불러오는 중...'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.tokenHint}>
          이 토큰을 파트너에게 공유하면 알림을 받을 수 있어요
        </Text>
      </Section>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>저장하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Section 컴포넌트 ─────────────────────────────────────────────────────────
// 설정 섹션(그룹)을 표시하는 재사용 컴포넌트.
// 제목 텍스트와 그 아래 컨텐츠(children)를 세트로 묶어준다.
//
// @param title    - 섹션 제목 텍스트 (예: "내 정보", "파트너 정보")
// @param children - 섹션 안에 들어올 컴포넌트들 (InputRow 등)
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── InputRow 컴포넌트 ───────────────────────────────────────────────────────
// 아이콘 + 입력 필드를 한 행으로 묶는 재사용 컴포넌트.
// Section 안에서 각 입력 항목마다 사용된다.
//
// @param icon         - 왼쪽에 표시할 Ionicons 아이콘 이름
// @param placeholder  - 입력 전에 표시되는 힌트 텍스트
// @param value        - 현재 입력된 텍스트 값 (state에서 온다)
// @param onChangeText - 텍스트가 바뀔 때 호출되는 함수 (state 업데이트 함수)
// @param multiline    - true이면 여러 줄 입력 허용
function InputRow({ icon, placeholder, value, onChangeText, multiline }) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color="#FF6B9D" style={styles.inputIcon} />

      {/* TextInput: 웹의 <input type="text">에 해당
          - value + onChangeText 조합 = "제어 컴포넌트"
            state가 항상 입력값과 동기화됨 */}
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        placeholder={placeholder}
        placeholderTextColor="#ccc"    // placeholder 텍스트 색상
        value={value}                  // 현재 텍스트값 (state로 제어)
        onChangeText={onChangeText}    // 글자 입력 시 state 업데이트
        multiline={multiline}          // 여러 줄 입력 여부
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9FB' },
  // contentContainerStyle: ScrollView 내부 컨텐츠 영역의 스타일
  // paddingBottom: 60으로 키보드가 올라와도 마지막 요소가 가리지 않게 여백 확보
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6B9D', marginBottom: 28, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 10,
    textTransform: 'uppercase', // 소문자를 대문자로 변환해서 표시
    letterSpacing: 0.8,         // 글자 간격을 살짝 넓혀 제목처럼 보이게
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD6E7',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  // multiline일 때: 최소 높이를 지정하고, 텍스트를 위쪽부터 정렬
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F6',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFD6E7',
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    fontFamily: 'Courier', // 토큰은 고정폭 폰트로 표시 (가독성)
  },
  tokenHint: { fontSize: 12, color: '#bbb', marginTop: 8, lineHeight: 18 },
  saveBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B9D',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
