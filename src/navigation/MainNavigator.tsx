// =============================================================================
// 📁 파일 용도: 로그인 후 하단 탭 바(Bottom Tab) 네비게이터
//
// Bottom Tab Navigator란?
//   화면 아래쪽에 항상 보이는 탭 바로 화면 간 이동을 하는 네비게이터예요.
//   각 탭은 독립적인 화면(또는 하위 스택)을 가져요.
//
// 탭 구성:
//   홈(❤️)  달력(📅)  문답(💬)  편지함(💌)
//
// 아이콘을 이미지 대신 이모지로 쓰는 이유:
//   - 외부 아이콘 라이브러리 없이도 귀여운 커플앱 감성을 낼 수 있어요.
//   - 추후 @expo/vector-icons로 교체하기 쉬워요.
// =============================================================================

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { MainTabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import QuestionScreen from '../screens/QuestionScreen';
import LettersScreen from '../screens/LettersScreen';
import { useSubscriptionStore } from '../store/subscriptionStore';

// MainTabParamList 타입으로 탭 이름과 파라미터를 제한해요.
const Tab = createBottomTabNavigator<MainTabParamList>();

// 탭 이름 → 활성/비활성 이모지 아이콘 매핑 테이블
// 활성(focused): 선택된 탭의 진한 이모지
// 비활성(!focused): 선택 안 된 탭의 연한 이모지
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '❤️', inactive: '🤍' },
  Calendar: { active: '📅', inactive: '🗓️' },
  Questions: { active: '💬', inactive: '🗨️' },
  Letters: { active: '💌', inactive: '📭' },
};

// ── TabIcon: 각 탭에 렌더링되는 이모지 아이콘 컴포넌트 ───────────────────────
// React Navigation은 tabBarIcon prop으로 { focused, color, size }를 전달해요.
// 우리는 focused(선택 여부)만 사용해서 아이콘을 바꿔요.
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons = TAB_ICONS[name] ?? { active: '●', inactive: '○' }; // 정의 없으면 기본값
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.iconEmoji}>{focused ? icons.active : icons.inactive}</Text>
    </View>
  );
}

export default function MainNavigator() {
  // 편지함 탭에 💎 뱃지를 붙이기 위해 구독 상태를 확인해요.
  const { isPremium } = useSubscriptionStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // 각 화면이 자체 헤더를 갖거나 헤더 없이 구성됨

        // 탭 바 전체 스타일
        tabBarStyle: styles.tabBar,

        // 선택된 탭의 텍스트/아이콘 색상
        tabBarActiveTintColor: '#FF6B9D',

        // 선택 안 된 탭의 텍스트/아이콘 색상
        tabBarInactiveTintColor: '#C4A4B0',

        tabBarLabelStyle: styles.tabLabel,

        // 모든 탭의 아이콘을 이 함수로 통일 — route.name으로 어떤 탭인지 식별
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarLabel: '달력' }}
      />
      <Tab.Screen
        name="Questions"
        component={QuestionScreen}
        options={{ tabBarLabel: '문답' }}
      />
      <Tab.Screen
        name="Letters"
        component={LettersScreen}
        options={{
          tabBarLabel: '편지함',
          // FREE 유저에게는 편지함 탭에 💎 뱃지를 달아 프리미엄 기능임을 암시해요.
          // tabBarBadge에 undefined를 넘기면 뱃지가 사라져요.
          tabBarBadge: !isPremium ? '💎' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: 'transparent', // 배경 없이 이모지만 표시
            color: '#FF6B9D',
            fontSize: 10,
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#FADADD',  // 연한 핑크 구분선
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
    height: 60,
    // iOS 그림자
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // Android 그림자
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 20 },
});
