// =============================================================================
// 📁 파일 용도: 앱 전체에서 사용하는 TypeScript 타입(인터페이스) 정의 모음
//
// TypeScript에서 interface란?
//   - 데이터의 "모양(shape)"을 미리 정해두는 설계도예요.
//   - 예를 들어 User는 id, email, nickname 등을 반드시 가져야 한다고 정해두면,
//     실수로 없는 속성에 접근하거나 잘못된 타입을 쓸 때 에디터가 바로 오류를 알려줘요.
//   - JavaScript에는 없고 TypeScript에만 있는 기능이에요. 빌드 시 사라지므로
//     실제 앱 성능에는 영향을 주지 않아요.
//
// 이 파일을 한 곳에 모아두는 이유:
//   - 여러 파일에서 같은 타입을 쓸 때 import 경로를 통일할 수 있어요.
//   - 백엔드 API 응답 구조가 바뀌면 이 파일 한 곳만 수정하면 돼요.
// =============================================================================

// =============================================================================
// ─── 1. API 공통 응답 형식 ────────────────────────────────────────────────────
// 백엔드가 모든 API에서 동일한 형식으로 응답을 보내요.
// 예: { success: true, data: { ... }, message: "로그인 성공" }
//
// <T = unknown>  →  제네릭(Generic) 문법이에요.
//   T 자리에 실제 데이터 타입을 넣을 수 있어요.
//   예: ApiResponse<User>    → data 안에 User 객체가 들어옴
//       ApiResponse<Letter[]> → data 안에 편지 배열이 들어옴
//   T를 명시 안 하면 unknown(알 수 없는 타입)이 기본값이에요.
// =============================================================================
export interface ApiResponse<T = unknown> {
  success: boolean;   // API 성공 여부 (true/false)
  data: T;            // 실제 응답 데이터 — 요청마다 형태가 달라서 제네릭 사용
  message?: string;   // 성공/실패 메시지 (선택 항목, ?가 붙으면 없어도 됨)
  code?: string;      // 에러 코드 (예: "USER_NOT_FOUND") — 선택 항목
}

// =============================================================================
// ─── 2. 인증(Authentication) 관련 타입들 ─────────────────────────────────────
// 로그인·회원가입 요청 시 서버에 보내는 데이터와 받는 데이터의 형태를 정의해요.
// =============================================================================

// 로그인 요청 시 서버로 보내는 데이터
export interface LoginRequest {
  email: string;    // 이메일 주소
  password: string; // 비밀번호
}

// 회원가입 요청 시 서버로 보내는 데이터
export interface RegisterRequest {
  email: string;    // 이메일 주소
  password: string; // 비밀번호
  nickname: string; // 앱 내 표시될 닉네임 (연인에게 보임)
}

// 서버에서 로그인/회원가입 성공 시 돌려주는 JWT 토큰 쌍
// JWT(JSON Web Token)란?
//   - 로그인 상태를 증명하는 암호화된 문자열이에요.
//   - 매 API 요청 헤더에 "Authorization: Bearer <토큰>"으로 첨부해요.
//   - accessToken: 짧게 유효 (예: 30분). 실제 인증에 사용.
//   - refreshToken: 길게 유효 (예: 30일). accessToken 만료 시 새 토큰 발급에 사용.
export interface AuthTokens {
  accessToken: string;  // 실제 API 호출에 쓰는 짧은 수명의 토큰
  refreshToken: string; // accessToken이 만료됐을 때 새로 발급받기 위한 토큰
}

// 로그인한 사용자 정보
export interface User {
  id: number;                          // 서버 DB의 고유 식별자
  email: string;                       // 이메일
  nickname: string;                    // 앱 내 표시 이름
  subscriptionType: 'FREE' | 'PREMIUM'; // 구독 상태 — 두 값 중 하나만 가능
  subscriptionExpiresAt?: string;       // 프리미엄 만료일 (ISO 날짜 문자열, FREE면 없음)
  inviteCode: string;                   // 연인을 초대할 때 공유하는 코드
  coupleId?: number;                    // 연결된 커플 ID (아직 연결 안 했으면 없음)
}

// =============================================================================
// ─── 3. 커플(Couple) 관련 타입들 ──────────────────────────────────────────────
// 두 사용자가 연결된 "커플" 엔티티와 연결 요청 데이터를 정의해요.
// =============================================================================

// 커플 정보 — 두 사용자와 만난 날짜를 포함
export interface Couple {
  id: number;       // 커플 고유 ID
  startDate: string; // 사귀기 시작한 날짜 (예: "2024-03-14") — D+Day 계산에 사용
  user1: User;      // 먼저 초대를 보낸 사람
  user2: User;      // 초대를 수락한 사람
  dDay: number;     // 서버에서 계산해준 D+Day 숫자 (클라이언트에서도 별도 계산)
}

// 연인과 연결할 때 서버에 보내는 요청 데이터
export interface CoupleConnectRequest {
  inviteCode: string; // 상대방의 초대 코드
}

// =============================================================================
// ─── 4. 달력 / 사진 기록 타입 ─────────────────────────────────────────────────
// 달력에 사진과 메모를 남기는 기능에 필요한 데이터 구조예요.
// =============================================================================

// 달력의 특정 날짜에 저장된 사진 + 메모 항목
export interface CalendarEntry {
  id: number;          // 항목 고유 ID
  date: string;        // 해당 날짜 (예: "2024-07-14")
  photoUrl?: string;   // 서버에 업로드된 사진 URL (없을 수도 있음)
  memo?: string;       // 그날의 짧은 메모 (없을 수도 있음)
  coupleId: number;    // 어느 커플의 기록인지 — 보안 검증에도 사용
}

// =============================================================================
// ─── 5. 커플 문답(Q&A) 타입들 ─────────────────────────────────────────────────
// 매일 하나의 질문이 내려오고, 커플이 각자 답변을 남기는 기능이에요.
// 둘 다 답변해야 서로의 답변이 공개돼요.
// =============================================================================

// 오늘의 질문 (서버에서 날짜별로 자동 생성)
export interface DailyQuestion {
  id: number;       // 질문 고유 ID
  question: string; // 질문 내용 (예: "오늘 가장 기억에 남는 순간은?")
  date: string;     // 질문이 출제된 날짜
}

// 사용자 한 명이 특정 질문에 남긴 답변
export interface QuestionAnswer {
  id: number;         // 답변 고유 ID
  questionId: number; // 어떤 질문에 대한 답변인지
  userId: number;     // 누가 쓴 답변인지
  answer: string;     // 답변 내용
  createdAt: string;  // 답변 작성 시각
}

// 화면에 표시할 때 질문 + 내 답변 + 상대 답변을 묶은 통합 형태
// 서버가 이 형태로 한 번에 내려줘서 여러 번 요청할 필요가 없어요.
export interface QuestionWithAnswers {
  question: DailyQuestion;       // 질문 내용
  myAnswer?: QuestionAnswer;     // 내 답변 (아직 안 썼으면 없음)
  partnerAnswer?: QuestionAnswer; // 상대방 답변 (아직 안 썼거나 내가 안 썼으면 없음)
  bothAnswered: boolean;          // 둘 다 답변했는지 여부 — true일 때만 서로 공개
}

// =============================================================================
// ─── 6. 편지함 타입들 ────────────────────────────────────────────────────────
// 미래에 열리는 타임캡슐 편지 기능이에요. (프리미엄 전용)
// 편지를 쓸 때 "열람 날짜"를 지정하면 그날이 되어야 상대가 읽을 수 있어요.
// =============================================================================

// 편지 한 통의 데이터
export interface Letter {
  id: number;           // 편지 고유 ID
  senderId: number;     // 보낸 사람 ID
  receiverId: number;   // 받는 사람 ID
  content: string;      // 편지 본문 내용
  openDate: string;     // 열람 가능한 날짜 (이 날짜 이전엔 잠겨있음)
  isOpened: boolean;    // 실제로 열어봤는지 여부
  createdAt: string;    // 편지를 쓴 시각
}

// 편지 쓰기 요청 시 서버로 보내는 데이터
export interface WriteLetterRequest {
  content: string;  // 편지 본문
  openDate: string; // 열람 날짜 (ISO 형식 날짜 문자열, 예: "2025-12-25")
}

// =============================================================================
// ─── 7. 구독(Subscription) 타입 ───────────────────────────────────────────────
// RevenueCat에서 결제 상태 확인 후 이 형태로 앱 내에서 관리해요.
// =============================================================================

export interface SubscriptionInfo {
  type: 'FREE' | 'PREMIUM'; // 현재 구독 단계
  expiresAt?: string;       // 프리미엄 만료일 (FREE면 없음)
}

// =============================================================================
// ─── 8. 네비게이션(Navigation) 타입들 ────────────────────────────────────────
// React Navigation에서 화면 이동 시 타입 안전성을 보장하기 위해 사용해요.
//
// ParamList란?
//   - 각 화면 이름과, 그 화면으로 이동할 때 전달하는 파라미터(데이터)를 정의해요.
//   - undefined = 파라미터 없이 그냥 이동하는 화면
//   - { letterId: number } 같이 쓰면 이동할 때 해당 데이터를 반드시 넘겨야 해요.
//   - 이렇게 정의해두면 navigation.navigate('없는화면') 같은 실수를 미리 잡아줘요.
// =============================================================================

// 앱 최상위 스택: 로그인 전/후를 구분하고 모달 화면들을 포함
export type RootStackParamList = {
  Auth: undefined;         // 로그인/회원가입 플로우 전체 (파라미터 없음)
  Main: undefined;         // 로그인 후 메인 탭 네비게이터 (파라미터 없음)
  CoupleConnect: undefined; // 커플 연결 화면 — modal로 뜸
  Premium: undefined;       // 프리미엄 구독 화면 — modal로 뜸
};

// 로그인/회원가입 스택
export type AuthStackParamList = {
  Login: undefined;    // 로그인 화면
  Register: undefined; // 회원가입 화면
};

// 로그인 후 하단 탭 바 구성
export type MainTabParamList = {
  Home: undefined;      // 홈 (D+Day, 하트 버튼)
  Calendar: undefined;  // 달력 (사진 기록)
  Questions: undefined; // 문답
  Letters: undefined;   // 편지함 (프리미엄)
  Settings: undefined;  // 설정
};

// 편지함 내부 스택 (목록 → 상세 → 작성)
export type LettersStackParamList = {
  LettersList: undefined;              // 편지 목록 화면
  WriteLetter: undefined;              // 편지 쓰기 화면
  LetterDetail: { letterId: number };  // 편지 상세 — 어떤 편지인지 ID 필요
};
