// ─────────────────────────────────────────────────────────────────────────────
// 📁 파일 용도: 앱의 화면 이동(네비게이션) 구조를 정의하는 파일
//
// React Native에서 화면 전환은 React Navigation 라이브러리가 담당한다.
// 이 파일은 앱 하단에 탭 바(홈/달력/설정)를 만들고,
// 각 탭을 누르면 어떤 화면(Screen)이 보여질지 연결해준다.
//
// 네비게이션 타입 종류 (참고):
//  - createBottomTabNavigator: 화면 하단 탭 바 (이 파일에서 사용)
//  - createStackNavigator: 화면이 위로 쌓이는 방식 (일반적인 뒤로가기 구조)
//  - createDrawerNavigator: 옆에서 슬라이드로 나오는 메뉴
// ─────────────────────────────────────────────────────────────────────────────

// NavigationContainer: 앱 전체 네비게이션의 최상위 컨테이너
// 모든 네비게이터는 이 안에 감싸져야 한다
import { NavigationContainer } from '@react-navigation/native';

// createBottomTabNavigator: 하단 탭 바 네비게이터를 만드는 함수
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Expo에서 제공하는 아이콘 라이브러리
// Ionicons: iOS/Android 스타일 아이콘 세트 (https://ionic.io/ionicons 에서 이름 확인)
import { Ionicons } from '@expo/vector-icons';

// 탭에 연결할 세 개의 화면 컴포넌트
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ─── 탭 네비게이터 인스턴스 생성 ────────────────────────────────────────────
// Tab.Navigator와 Tab.Screen을 제공해주는 객체다
const Tab = createBottomTabNavigator();

// ─── 탭 설정 데이터 ──────────────────────────────────────────────────────────
// 탭 3개의 설정을 배열로 정리해두고, 아래에서 .map()으로 반복 렌더링한다.
// 탭을 추가하거나 아이콘/이름을 바꾸려면 이 배열만 수정하면 된다.
const TAB_CONFIG = [
  {
    name: 'Home',                // 네비게이션 내부에서 이 화면을 식별하는 이름
    component: HomeScreen,       // 이 탭을 눌렀을 때 보여줄 화면 컴포넌트
    label: '홈',                  // 탭 바에 표시되는 텍스트
    icon: 'home',                // Ionicons 아이콘 이름
  },
  {
    name: 'Calendar',
    component: CalendarScreen,
    label: '달력',
    icon: 'calendar',
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    label: '설정',
    icon: 'settings',
  },
];

// ─── AppNavigator 컴포넌트 ───────────────────────────────────────────────────
// App.js에서 이 컴포넌트를 렌더링하면 앱 전체 탭 구조가 나타난다.
export default function AppNavigator() {
  return (
    // NavigationContainer: 네비게이션이 작동하기 위해 반드시 감싸야 하는 최상위 컨테이너
    <NavigationContainer>

      {/* Tab.Navigator: 탭 바를 만드는 컴포넌트 */}
      <Tab.Navigator
        // screenOptions: 모든 탭에 공통으로 적용되는 옵션
        // ({ route }): 현재 렌더링 중인 탭 정보를 받아서 탭별로 다르게 설정할 수 있다
        screenOptions={({ route }) => ({

          // 각 화면 상단의 헤더(제목 바)를 숨긴다
          // false = 각 화면이 자체 헤더를 구성한다
          headerShown: false,

          // 현재 선택된 탭 아이콘/텍스트 색상
          tabBarActiveTintColor: '#FF6B9D',

          // 선택되지 않은 탭 아이콘/텍스트 색상
          tabBarInactiveTintColor: '#ccc',

          // 탭 바 전체 스타일
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#FFD6E7', // 탭 바 상단 구분선 색상
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 6,
            height: 62,
          },

          // 탭 라벨(텍스트) 스타일
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },

          // 탭 아이콘 렌더링 함수
          // color: 활성/비활성에 따라 위에서 설정한 색상이 자동으로 들어온다
          // size: 탭 바가 권장하는 아이콘 크기
          tabBarIcon: ({ color, size }) => {
            // 현재 route.name과 일치하는 탭 설정을 TAB_CONFIG에서 찾는다
            const tab = TAB_CONFIG.find(t => t.name === route.name);
            // 찾은 탭의 icon 이름으로 Ionicons 아이콘을 렌더링한다
            return <Ionicons name={tab?.icon} size={size} color={color} />;
          },
        })}
      >
        {/* TAB_CONFIG 배열을 순회하며 탭 화면을 등록한다 */}
        {TAB_CONFIG.map(tab => (
          <Tab.Screen
            key={tab.name}           // React가 목록 아이템을 구분하기 위한 고유 키
            name={tab.name}          // 이 탭의 식별 이름
            component={tab.component} // 탭 선택 시 표시할 화면
            options={{ tabBarLabel: tab.label }} // 탭 텍스트 라벨
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
