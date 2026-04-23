// =============================================================================
// 📁 파일 용도: 인증(로그인·회원가입·내 정보) 관련 API 함수 모음
//
// 왜 API 함수를 파일로 분리하나?
//   - 화면 파일(LoginScreen 등)에 API 호출 코드를 바로 쓰면, 화면이 커지고 복잡해져요.
//   - 여기에 모아두면 "LoginScreen은 화면만, authApi는 통신만" 역할이 명확해져요.
//   - 백엔드 URL이 바뀌면 이 파일 한 곳만 수정하면 돼요.
//
// 반환 타입 설명:
//   apiClient.post<ApiResponse<...>>() 에서 <...> 안이 data의 타입이에요.
//   실제로 쓸 때는 res.data.data 로 실제 값에 접근해요.
//   예: const { tokens, user } = res.data.data
// =============================================================================

import apiClient from './client';
import { ApiResponse, LoginRequest, RegisterRequest, AuthTokens, User } from '../types';

export const authApi = {
  // ── login: 이메일 + 비밀번호로 로그인 ──────────────────────────────────────
  // POST /auth/login
  // 성공 시: JWT 토큰 쌍 + 사용자 정보를 반환해요.
  // 실패 시: 401(이메일/비밀번호 불일치) 또는 500(서버 오류)
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<{ tokens: AuthTokens; user: User }>>('/auth/login', body),

  // ── register: 신규 회원가입 ─────────────────────────────────────────────────
  // POST /auth/register
  // 성공 시: 로그인과 동일하게 바로 토큰 + 사용자 정보를 반환 (가입 후 자동 로그인)
  // 실패 시: 409(이메일 중복) 또는 400(입력값 검증 실패)
  register: (body: RegisterRequest) =>
    apiClient.post<ApiResponse<{ tokens: AuthTokens; user: User }>>('/auth/register', body),

  // ── getMe: 현재 로그인한 사용자 정보 조회 ──────────────────────────────────
  // GET /auth/me
  // 앱이 시작될 때 AppNavigator에서 호출해요.
  // 저장된 accessToken으로 서버에서 최신 사용자 정보를 가져와요.
  // (구독 타입, 커플 ID 등이 서버 기준으로 최신화됨)
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  // ── refresh: accessToken 갱신 ──────────────────────────────────────────────
  // POST /auth/refresh
  // 이 함수는 화면에서 직접 쓰지 않아요.
  // axios 인터셉터(client.ts)에서 401 에러가 났을 때 자동으로 호출돼요.
  // refreshToken을 서버에 보내면 새 accessToken을 발급해줘요.
  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }),
};
