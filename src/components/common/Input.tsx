// =============================================================================
// 📁 파일 용도: 앱 전체에서 재사용하는 공통 텍스트 입력 컴포넌트
//
// 기본 TextInput에 추가한 기능:
//   1. label — 입력 필드 위에 표시되는 라벨 (예: "이메일", "비밀번호")
//   2. error — 유효성 검사 실패 시 빨간 테두리 + 에러 메시지 표시
//   3. isPassword — 눈 아이콘 버튼으로 비밀번호 표시/숨기기 토글
//
// extends TextInputProps:
//   React Native의 TextInput이 받는 모든 props를 그대로 받을 수 있어요.
//   (placeholder, onChangeText, keyboardType, autoComplete 등)
//   우리가 추가한 label, error, isPassword만 별도로 처리하고,
//   나머지는 ...rest로 TextInput에 그대로 전달해요.
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps, // React Native TextInput의 모든 props 타입
} from 'react-native';

// TextInputProps를 extends해서 기존 TextInput props를 모두 상속받아요.
// 추가로 label, error, isPassword만 정의해요.
interface Props extends TextInputProps {
  label?: string;      // 입력 필드 위의 라벨 텍스트 (없어도 됨)
  error?: string;      // 에러 메시지 (있으면 빨간 테두리 + 하단에 에러 문구 표시)
  isPassword?: boolean; // true면 비밀번호 모드 (입력값 숨기기 + 눈 아이콘)
}

export default function Input({
  label,
  error,
  isPassword = false, // 기본값: 일반 텍스트 필드
  style,
  ...rest             // label, error, isPassword 제외한 나머지 props를 TextInput에 전달
}: Props) {

  // secureText: 비밀번호를 숨길지(true) 보여줄지(false) 결정하는 상태
  // isPassword가 true이면 처음엔 숨김 상태로 시작해요.
  const [secureText, setSecureText] = useState(isPassword);

  return (
    // container: label + 입력창 + 에러 텍스트를 세로로 묶는 컨테이너
    <View style={styles.container}>

      {/* label이 있을 때만 표시 — 없으면 아예 렌더링하지 않아요 */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/*
        inputWrapper: 텍스트 입력 영역을 감싸는 박스
        error가 있으면 빨간 테두리(inputError), 없으면 연한 핑크(inputNormal)
        flexDirection: 'row' — 입력창과 눈 아이콘 버튼을 가로로 나란히 배치
      */}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#C4A4B0" // 연한 핑크 플레이스홀더
          secureTextEntry={secureText}   // true면 입력값을 ●●●●로 표시
          autoCapitalize="none"          // 자동 대문자 변환 끄기 (이메일 입력 시 필요)
          {...rest}                       // 외부에서 전달된 나머지 props (placeholder, value 등)
        />

        {/* isPassword일 때만 눈 아이콘 버튼 표시 */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecureText(!secureText)} // 탭할 때마다 숨기기/보이기 토글
            style={styles.eyeBtn}
          >
            {/* secureText(숨김 상태): 눈 아이콘 → 탭하면 보임 상태로 */}
            {/* !secureText(보임 상태): 원숭이 아이콘 → 탭하면 숨김 상태로 */}
            <Text style={styles.eyeIcon}>{secureText ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 에러 메시지 — error 값이 있을 때만 표시 */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // marginBottom: 각 입력 필드 사이 간격 (폼에서 여러 개 쌓일 때 자연스럽게 분리)
  container: { marginBottom: 16 },

  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B6570',
    marginBottom: 6,
    marginLeft: 4, // 입력창과 라벨의 왼쪽 정렬을 맞춰요
  },

  // inputWrapper: 입력창 + 눈 버튼을 감싸는 박스
  // flexDirection: 'row' — 가로 배치 (입력창이 flex:1로 남은 공간 채우고, 눈 버튼은 우측)
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFF9FB', // 아주 연한 핑크빛 흰색
  },
  inputNormal: { borderColor: '#FADADD' }, // 기본 상태: 연한 핑크 테두리
  inputError: { borderColor: '#FF3B30' },  // 에러 상태: 빨간 테두리

  input: {
    flex: 1, // inputWrapper의 남은 가로 공간을 모두 차지해요 (눈 버튼 자리 제외)
    fontSize: 15,
    color: '#3D2030',
  },

  eyeBtn: { padding: 4 }, // 탭 영역을 이모지보다 약간 넓게 만들어 터치 편의성 향상
  eyeIcon: { fontSize: 18 },

  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4, // 라벨과 좌측 정렬 맞춤
  },
});
