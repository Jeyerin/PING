// =============================================================================
// 📁 파일 용도: 앱 전체에서 재사용하는 공통 버튼 컴포넌트
//
// 왜 공통 컴포넌트로 만들었나?
//   버튼은 모든 화면에서 사용해요. 매번 스타일을 새로 작성하면:
//   - 코드가 반복되고 길어져요.
//   - 디자인을 바꾸려면 모든 화면을 하나씩 수정해야 해요.
//   이 파일 하나만 수정하면 앱 전체 버튼이 한 번에 바뀌어요.
//
// variant(변형) 3종류:
//   primary: 핑크 채우기 버튼 — 주요 액션 (로그인, 저장 등)
//   outline: 테두리만 있는 버튼 — 보조 액션 (회원가입, 취소 등)
//   ghost:   배경·테두리 없이 텍스트만 — 링크처럼 보이는 버튼
// =============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator, // 로딩 중 회전 스피너
  StyleSheet,
  ViewStyle,         // View에 적용하는 스타일 타입
  TextStyle,         // Text에 적용하는 스타일 타입
} from 'react-native';

// ── Props 인터페이스: 이 컴포넌트에 넘길 수 있는 props 목록 ──────────────────
interface Props {
  title: string;                              // 버튼 안에 표시될 텍스트
  onPress: () => void;                        // 버튼을 눌렀을 때 실행할 함수
  loading?: boolean;                          // true면 텍스트 대신 스피너 표시 + 비활성화
  disabled?: boolean;                         // true면 클릭 비활성화 + 반투명
  variant?: 'primary' | 'outline' | 'ghost'; // 버튼 스타일 종류 (기본값: primary)
  style?: ViewStyle;                          // 외부에서 추가 스타일을 덮어쓸 때 사용
  textStyle?: TextStyle;                      // 텍스트에 추가 스타일을 덮어쓸 때 사용
}

export default function Button({
  title,
  onPress,
  loading = false,      // 기본값: 로딩 아님
  disabled = false,     // 기본값: 활성화
  variant = 'primary',  // 기본값: 핑크 채우기 버튼
  style,
  textStyle,
}: Props) {
  // loading 중이거나 disabled이면 버튼을 누를 수 없어요.
  // 둘 중 하나라도 true면 비활성 상태로 처리해요.
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      // 스타일 배열: 뒤에 오는 스타일이 앞 스타일을 덮어써요.
      // base(공통) → variant별 스타일 → disabled 스타일 → 외부 주입 style 순으로 적용
      style={[
        styles.base,
        variant === 'primary' && styles.primary,   // primary일 때만 핑크 배경
        variant === 'outline' && styles.outline,   // outline일 때만 테두리
        variant === 'ghost' && styles.ghost,       // ghost일 때만 배경 없음
        isDisabled && styles.disabled,             // 비활성화면 반투명
        style,                                     // 외부에서 넘긴 추가 스타일
      ]}
      activeOpacity={0.8} // 눌렸을 때 80% 투명도 → 눌린 느낌 표현
    >
      {/* loading 상태면 텍스트 대신 스피너를 보여줘요 */}
      {loading ? (
        // primary 버튼이면 흰 스피너, outline/ghost는 핑크 스피너
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#FF6B9D'} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'outline' && styles.textOutline, // outline이면 핑크 텍스트
            variant === 'ghost' && styles.textGhost,     // ghost이면 핑크 텍스트
            textStyle,                                   // 외부에서 넘긴 텍스트 스타일
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 모든 variant에 공통으로 적용되는 기본 스타일
  base: {
    height: 52,           // 터치하기 충분한 높이 (최소 44px 권장)
    borderRadius: 16,     // 둥근 모서리
    alignItems: 'center', // 자식(텍스트/스피너)을 수평 가운데 정렬
    justifyContent: 'center', // 자식을 수직 가운데 정렬
    paddingHorizontal: 24,
  },
  // primary: 핑크 배경 + 흰 텍스트 — 가장 눈에 띄는 주요 액션 버튼
  primary: { backgroundColor: '#FF6B9D' },
  // outline: 배경 없이 핑크 테두리만 — 보조 액션 버튼
  outline: {
    borderWidth: 1.5,
    borderColor: '#FF6B9D',
    backgroundColor: 'transparent',
  },
  // ghost: 완전히 투명 — 링크처럼 쓰는 버튼
  ghost: { backgroundColor: 'transparent' },
  // 비활성화 시 반투명 처리 — 클릭 안 된다는 시각적 피드백
  disabled: { opacity: 0.5 },

  // 기본 텍스트 스타일 (primary용 흰색)
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3, // 약간의 자간으로 가독성 향상
  },
  textOutline: { color: '#FF6B9D' }, // outline 버튼은 핑크 텍스트
  textGhost: { color: '#FF6B9D' },   // ghost 버튼도 핑크 텍스트
});
