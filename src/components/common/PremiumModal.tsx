// =============================================================================
// 📁 파일 용도: 프리미엄 전용 기능에 접근했을 때 표시되는 업그레이드 유도 모달
//
// 언제 사용하나?
//   - 달력 사진 10장 초과 시도
//   - 편지함 화면 진입 (FREE 유저)
//   - 기타 프리미엄 전용 기능 접근 시
//
// 왜 공통 컴포넌트로 만들었나?
//   여러 화면에서 프리미엄 유도가 필요해요. 공통 컴포넌트로 만들면
//   visible/onClose만 넘기면 되고, 중복 코드가 없어져요.
//
// featureName prop:
//   어떤 기능 때문에 모달이 떴는지 안내하는 맞춤 문구에 사용해요.
//   예: featureName="편지함" → "편지함은 프리미엄 구독자만 이용할 수 있어요."
// =============================================================================

import React from 'react';
import {
  Modal,           // React Native 내장 모달 컴포넌트
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,       // 더 세밀한 터치 처리가 가능한 컴포넌트 (배경 탭 닫기에 사용)
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

interface Props {
  visible: boolean;      // 모달을 보여줄지 여부 — 부모 컴포넌트의 state로 제어
  onClose: () => void;   // 모달을 닫는 함수 — 부모에서 setState(false) 형태로 전달
  featureName?: string;  // 어떤 기능이 프리미엄인지 설명하는 이름 (없으면 기본 문구 사용)
}

export default function PremiumModal({ visible, onClose, featureName }: Props) {
  // Premium 화면으로 이동하기 위해 Root 스택 네비게이터에 접근해요.
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // "프리미엄 시작하기" 버튼 클릭 처리
  const handleUpgrade = () => {
    onClose();                      // 모달을 먼저 닫고
    navigation.navigate('Premium'); // 프리미엄 구독 화면으로 이동
  };

  return (
    /*
      Modal 컴포넌트:
        visible: false면 아무것도 렌더링하지 않아요.
        transparent: true — 배경을 반투명하게 해서 뒤의 화면이 비쳐 보여요.
        animationType: "fade" — 모달이 서서히 나타나고 사라져요.
        onRequestClose: Android 뒤로 가기 버튼을 눌렀을 때 실행 (iOS는 무시됨)
    */
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/*
        Pressable을 배경으로 사용해서 모달 바깥을 탭하면 닫히게 해요.
        안쪽 Pressable은 이벤트 전파를 막아서 카드 탭 시 닫히지 않아요.
      */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* onPress={() => {}} — 카드 자체를 탭해도 backdrop의 onClose가 실행되지 않게 막아요 */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>💎</Text>
          <Text style={styles.title}>프리미엄 전용 기능</Text>
          <Text style={styles.desc}>
            {/*
              featureName이 있으면 그 이름을 사용하고, 없으면 기본 "이 기능"을 써요.
              ?? : nullish coalescing — null 또는 undefined일 때만 오른쪽 값 사용
            */}
            {featureName ?? '이 기능'}은 프리미엄 구독자만 이용할 수 있어요.{'\n'}
            월 2,900원으로 모든 기능을 무제한으로 사용해보세요 💕
          </Text>

          {/* 주요 CTA 버튼 — Premium 화면으로 이동 */}
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Text style={styles.upgradeText}>프리미엄 시작하기</Text>
          </TouchableOpacity>

          {/* 보조 버튼 — 그냥 모달 닫기 */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>나중에</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 전체 화면을 덮는 반투명 어두운 배경 — 모달 카드를 부각시켜요
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(61,32,48,0.4)', // 다크 버건디 40% 투명도
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // 모달 카드 — 흰 배경 + 핑크 그림자
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    // 핑크 그림자 (iOS)
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8, // Android 그림자
  },

  emoji: { fontSize: 48, marginBottom: 12 },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D2030',
    marginBottom: 12,
  },

  desc: {
    fontSize: 14,
    color: '#8B6570',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  // 프리미엄 업그레이드 버튼 — 핑크 채우기, 전체 너비
  upgradeBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // "나중에" 버튼 — 시각적으로 눈에 띄지 않게 연한 색상
  cancelBtn: { paddingVertical: 8 },
  cancelText: { color: '#C4A4B0', fontSize: 14 },
});
