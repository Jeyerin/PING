// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 앱의 메인 홈 화면 - 커플 소통 버튼 3개를 제공하는 화면
//
// 화면 구성:
//  - "이야기하고 싶어" 버튼: 연인에게 대화를 요청하는 알림을 보낸다
//  - "화해하고 싶어" 버튼: 화해 의사를 전하는 알림을 보낸다
//  - "보고 싶어" 버튼: 그리움을 전하는 알림을 보낸다
//
// 버튼을 누르면 → sendLocalNotification() → 알림 발송 → 성공 팝업 표시
//
// React Native 주요 컴포넌트 설명 (이 파일에서 사용하는 것들):
//  - View: 웹의 <div>에 해당. 레이아웃 박스 역할
//  - Text: 텍스트를 표시. 웹의 <p>, <span>에 해당
//  - TouchableOpacity: 누를 수 있는 영역. 누르면 투명도가 낮아지는 효과
//  - Animated: 애니메이션을 적용할 때 사용 (이 파일에서는 버튼 눌림 효과)
//  - Alert: 팝업 다이얼로그를 표시
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,             // 레이아웃 박스 컴포넌트 (웹의 div)
  Text,             // 텍스트 표시 컴포넌트
  StyleSheet,       // 스타일 정의 객체를 만드는 함수 (웹의 CSS와 유사)
  TouchableOpacity, // 터치 가능한 영역 (누르면 살짝 투명해지는 효과)
  Animated,         // 애니메이션 효과를 적용하는 특수 컴포넌트
  Alert,            // 팝업 알림창을 띄우는 API
} from 'react-native';

// Expo 아이콘 라이브러리에서 Ionicons 아이콘 세트 사용
import { Ionicons } from '@expo/vector-icons';

// 알림 발송 서비스 함수
import { sendLocalNotification } from '../services/notifications';

// ─── 버튼 설정 데이터 ────────────────────────────────────────────────────────
// 3개 버튼의 디자인과 동작을 배열로 정의해둔다.
// 버튼을 추가하거나 색상/텍스트를 바꾸려면 이 배열만 수정하면 된다.
const BUTTONS = [
  {
    type: 'talk',                   // sendLocalNotification에 전달할 타입값
    icon: 'chatbubble-ellipses',    // 말풍선 아이콘
    label: '이야기하고 싶어',
    color: '#A78BFA',               // 아이콘·텍스트 색상 (보라색)
    bg: '#EDE9FE',                  // 버튼 배경색 (연보라)
    desc: '대화를 요청해요',
  },
  {
    type: 'makeup',
    icon: 'heart',                  // 하트 아이콘
    label: '화해하고 싶어',
    color: '#FF6B9D',               // 핑크색
    bg: '#FFE4EF',
    desc: '화해를 원해요',
  },
  {
    type: 'miss',
    icon: 'star',                   // 별 아이콘
    label: '보고 싶어',
    color: '#F59E0B',               // 노란색
    bg: '#FEF3C7',
    desc: '그리움을 전해요',
  },
];

// ─── HomeScreen 컴포넌트 ─────────────────────────────────────────────────────
// 탭에서 "홈" 탭을 선택하면 이 화면이 표시된다.
export default function HomeScreen() {

  // 현재 로딩 중인 버튼의 type을 저장한다.
  // null이면 로딩 중인 버튼 없음, 'talk'이면 이야기 버튼이 처리 중
  // 중복 클릭을 방지하고, 나중에 로딩 스피너를 추가할 때도 활용된다.
  const [loadingType, setLoadingType] = useState(null);

  // ── 버튼 클릭 핸들러 ──────────────────────────────────────────────────────
  // 어떤 버튼을 눌렀는지 type으로 구분하고, 해당 알림을 발송한다.
  async function handlePress(type) {
    // 이미 다른 버튼이 처리 중이면 아무것도 하지 않는다 (중복 클릭 방지)
    if (loadingType) return;

    setLoadingType(type); // 이 버튼이 처리 중임을 표시

    try {
      // 알림 발송 함수 호출. async/await = 완료될 때까지 기다린다
      await sendLocalNotification(type);
      // 발송 성공 시 팝업 표시
      Alert.alert('전송 완료 💌', '연인에게 메시지를 보냈어요!');
    } catch {
      // 발송 실패 시 에러 팝업 표시
      Alert.alert('오류', '메시지 전송에 실패했어요.');
    } finally {
      // 성공/실패 상관없이 로딩 상태를 초기화한다
      // finally 블록은 try/catch 이후 항상 실행된다
      setLoadingType(null);
    }
  }

  return (
    <View style={styles.container}>
      {/* 화면 제목 */}
      <Text style={styles.title}>💑 우리 사이</Text>
      <Text style={styles.subtitle}>연인에게 마음을 전해보세요</Text>

      {/* 버튼 목록 영역 */}
      <View style={styles.buttonsWrap}>
        {/* BUTTONS 배열을 순회하며 각 버튼 컴포넌트를 렌더링한다 */}
        {BUTTONS.map((btn) => (
          <CoupleButton
            key={btn.type}                          // React 내부 구분 키
            {...btn}                                 // btn 객체의 모든 속성을 props로 전달 (spread 문법)
            loading={loadingType === btn.type}       // 이 버튼이 로딩 중인지 여부
            onPress={() => handlePress(btn.type)}    // 눌렸을 때 실행할 함수
          />
        ))}
      </View>

      {/* 하단 안내 문구 */}
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={16} color="#aaa" />
        <Text style={styles.noticeText}>
          버튼을 누르면 연인에게 알림이 전송돼요
        </Text>
      </View>
    </View>
  );
}

// ─── CoupleButton 컴포넌트 ───────────────────────────────────────────────────
// 홈 화면의 각 소통 버튼을 렌더링하는 서브 컴포넌트.
// props로 아이콘, 텍스트, 색상, 클릭 핸들러 등을 받는다.
//
// @param icon    - Ionicons 아이콘 이름
// @param label   - 버튼 주요 텍스트
// @param color   - 아이콘/텍스트 색상
// @param bg      - 버튼 배경색
// @param desc    - 버튼 설명 텍스트
// @param loading - 현재 이 버튼이 처리 중인지 여부
// @param onPress - 버튼을 눌렀을 때 실행할 함수
function CoupleButton({ icon, label, color, bg, desc, loading, onPress }) {

  // ── 버튼 눌림 애니메이션 ────────────────────────────────────────────────────
  // Animated.Value는 애니메이션으로 변화시킬 수 있는 특수한 숫자 변수다.
  // 초기값 1 = 원래 크기 (scale 1배)
  const scale = new Animated.Value(1);

  // 버튼을 누르는 순간 실행: 크기를 0.95배로 줄인다 (눌린 느낌)
  function onPressIn() {
    Animated.spring(scale, {
      toValue: 0.95,            // 목표값: 0.95배 크기로 줄어든다
      useNativeDriver: true,    // 네이티브 레이어에서 처리 = 더 부드럽고 빠른 애니메이션
    }).start();
  }

  // 버튼에서 손을 떼는 순간 실행: 크기를 다시 1배(원래 크기)로 되돌린다
  function onPressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  return (
    // Animated.View: 애니메이션 효과를 적용할 수 있는 특수 View
    // style의 transform: [{ scale }]가 scale 값에 따라 크기를 조절한다
    <Animated.View style={{ transform: [{ scale }] }}>

      <TouchableOpacity
        style={[styles.coupleBtn, { backgroundColor: bg }]} // 동적으로 bg 색상 적용
        onPress={onPress}         // 탭(빠르게 누르고 떼기) 시 실행
        onPressIn={onPressIn}     // 누르는 순간 실행 (애니메이션 시작)
        onPressOut={onPressOut}   // 손 떼는 순간 실행 (애니메이션 복귀)
        activeOpacity={0.9}       // 누를 때 투명도를 0.9로 (거의 변화 없게)
        disabled={loading}        // 로딩 중에는 버튼 비활성화
      >
        {/* 왼쪽 아이콘 원형 배경 */}
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Ionicons name={icon} size={28} color="#fff" />
        </View>

        {/* 중간 텍스트 영역 (flex:1 = 남은 공간 모두 차지) */}
        <View style={styles.btnTextWrap}>
          <Text style={[styles.btnLabel, { color }]}>{label}</Text>
          <Text style={styles.btnDesc}>{desc}</Text>
        </View>

        {/* 오른쪽 화살표 아이콘 */}
        <Ionicons name="chevron-forward" size={20} color={color} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── 스타일 정의 ──────────────────────────────────────────────────────────────
// StyleSheet.create()로 스타일 객체를 만든다.
// 웹 CSS와 비슷하지만 카멜케이스(backgroundColor)를 사용하고,
// 단위는 dp(밀도 독립 픽셀)이며 숫자로 표기한다.
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // 부모 공간 전체를 차지한다
    backgroundColor: '#FFF9FB', // 연한 핑크 배경
    paddingHorizontal: 20,      // 좌우 여백 20dp
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginTop: 40,              // 상단 여백 40dp
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 40,
  },
  buttonsWrap: {
    gap: 14,                    // 자식 요소들 사이의 간격 (React Native 0.71+)
  },
  coupleBtn: {
    flexDirection: 'row',       // 자식 요소를 가로(행)로 나열한다
    alignItems: 'center',       // 세로 중앙 정렬
    borderRadius: 18,
    padding: 18,
    gap: 14,
    // 그림자 (iOS용)
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // 그림자 (Android용)
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,           // 정원형으로 만들려면 width/height의 절반값
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextWrap: { flex: 1 },    // 남은 가로 공간을 모두 차지
  btnLabel: { fontSize: 17, fontWeight: 'bold' },
  btnDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    justifyContent: 'center',
  },
  noticeText: { color: '#bbb', fontSize: 12 },
});
