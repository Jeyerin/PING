// =============================================================================
// 📁 파일 용도: 앱 전체에서 사용하는 Axios HTTP 클라이언트 설정
//
// Axios란?
//   - JavaScript/TypeScript에서 HTTP 요청(GET, POST, DELETE 등)을 쉽게 보내는 라이브러리예요.
//   - fetch()보다 에러 처리, 타임아웃, 헤더 설정이 편리해요.
//
// Interceptor(인터셉터)란?
//   - 요청/응답이 실제로 처리되기 전에 가로채서 뭔가를 추가하거나 수정하는 미들웨어예요.
//   - 마치 공항 보안 검색대처럼, 나가는 짐(요청)에는 여권(토큰)을 붙이고,
//     들어오는 짐(응답)에서 문제(401)가 있으면 재처리해요.
//
// 이 파일의 핵심 기능 2가지:
//   1. 요청 인터셉터: 모든 API 요청 헤더에 JWT accessToken 자동 첨부
//      → 각 화면에서 매번 토큰을 꺼내 헤더에 달 필요가 없어요.
//
//   2. 응답 인터셉터: 서버가 401(Unauthorized)을 응답하면 자동으로 토큰 갱신 후 재시도
//      → 사용자가 로그인 만료를 느끼지 못하게 해요.
//      → 여러 요청이 동시에 401을 받으면 하나만 갱신하고 나머지는 기다렸다 재시도 (failedQueue)
// =============================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

// 백엔드 서버 주소 — 나중에 실제 서버 주소로 교체해야 해요.
// 이 파일 밖에서도 쓸 수 있도록 export해두었어요.
export const BASE_URL = 'https://api.yourcouple.app/api/v1';

// ─── Axios 인스턴스 생성 ──────────────────────────────────────────────────────
// axios.create()로 기본값이 세팅된 인스턴스를 만들어요.
// 이렇게 하면 모든 API 요청이 동일한 기본 설정을 공유해요.
const apiClient = axios.create({
  baseURL: BASE_URL,                             // 모든 요청 URL 앞에 자동으로 붙음
  timeout: 10000,                                // 10초 이내에 응답 없으면 에러 처리
  headers: { 'Content-Type': 'application/json' }, // JSON 형식으로 주고받겠다고 선언
});

// =============================================================================
// ─── 요청 인터셉터(Request Interceptor) ──────────────────────────────────────
// apiClient로 보내는 모든 HTTP 요청이 실제로 전송되기 직전에 이 함수가 실행돼요.
//
// 하는 일:
//   1. SecureStore에서 저장된 accessToken을 꺼내요.
//   2. 토큰이 있으면 요청 헤더에 "Authorization: Bearer <토큰>" 형식으로 추가해요.
//      → 서버는 이 헤더를 보고 "인증된 사용자의 요청"으로 판단해요.
//   3. 수정된 config(요청 설정 객체)를 반환하면 실제 전송이 시작돼요.
// =============================================================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // SecureStore는 비동기라서 await가 필요해요.
    const token = await SecureStore.getItemAsync('access_token');
    if (token && config.headers) {
      // Bearer 인증 방식: "Bearer " 접두어 뒤에 토큰을 붙이는 표준 형식이에요.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 수정된 요청 설정을 반환해야 실제 전송이 일어나요.
  },
  // 요청 설정 자체가 잘못됐을 때(거의 발생하지 않음)의 에러 처리
  (error) => Promise.reject(error),
);

// =============================================================================
// ─── 응답 인터셉터(Response Interceptor) — 401 자동 토큰 갱신 ─────────────────
//
// isRefreshing: 현재 토큰을 갱신하는 중인지 나타내는 플래그
//   왜 필요?
//     여러 API 요청이 동시에 401을 받았을 때, 토큰 갱신을 여러 번 하면 안 돼요.
//     첫 번째 요청만 실제로 갱신하고, 나머지는 갱신이 끝날 때까지 기다려야 해요.
//
// failedQueue: 토큰 갱신이 진행되는 동안 대기하는 요청들의 목록
//   갱신 성공 → 대기 중인 요청들을 새 토큰으로 재시도
//   갱신 실패 → 대기 중인 요청들을 모두 에러 처리
// =============================================================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void; // 갱신 성공 시 이 함수를 호출해 재시도
  reject: (reason?: unknown) => void; // 갱신 실패 시 이 함수를 호출해 에러 전달
}> = [];

// ─── processQueue: 대기 중인 요청들을 일괄 처리하는 헬퍼 함수 ────────────────
// 토큰 갱신이 끝난 후 failedQueue에 쌓인 요청들을 한꺼번에 처리해요.
//   - error가 있으면: 모든 대기 요청을 실패 처리 (사용자를 로그인 화면으로)
//   - error가 없으면: 모든 대기 요청에 새 토큰을 주고 재시도
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error); // 갱신 실패 → 대기 요청들도 에러 처리
    else resolve(token);      // 갱신 성공 → 새 토큰으로 재시도
  });
  failedQueue = []; // 큐를 비워서 다음 번 401 처리를 준비
};

apiClient.interceptors.response.use(
  // 응답이 정상(2xx)이면 그냥 통과시켜요.
  (response) => response,

  // 응답이 에러(4xx, 5xx 등)이면 이 함수가 실행돼요.
  async (error: AxiosError) => {
    // error.config: 실패한 원래 요청의 설정 정보
    // _retry: 이미 재시도한 요청인지 표시하는 커스텀 플래그 (무한 루프 방지)
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401(Unauthorized)이고, 아직 재시도하지 않은 요청만 갱신 로직을 실행해요.
    if (error.response?.status === 401 && !originalRequest._retry) {

      // ── 이미 갱신 중인 경우: 대기 큐에 넣고 갱신 완료를 기다림 ────────────────
      // 동시에 여러 요청이 401을 받으면, 첫 번째만 실제로 갱신하고
      // 나머지는 여기서 Promise로 대기해요.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject }); // 대기 큐에 추가
        }).then((token) => {
          // 갱신 완료 후 새 토큰을 헤더에 넣고 원래 요청을 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      // ── 첫 번째 401 처리: 실제로 토큰 갱신을 시도 ────────────────────────────
      originalRequest._retry = true; // 이 요청이 재시도 중임을 표시 (무한 루프 방지)
      isRefreshing = true;            // 갱신 시작 플래그 — 다른 401 요청은 위 큐로 진입

      try {
        // SecureStore에서 refreshToken을 꺼내요.
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token'); // 없으면 바로 로그아웃

        // apiClient 대신 일반 axios를 씀: 인터셉터를 타지 않아 무한 루프를 방지해요.
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken: string = data.data.accessToken;

        // 스토어와 SecureStore에 새 토큰 저장
        await useAuthStore.getState().updateAccessToken(newAccessToken);

        // 대기 중이던 요청들을 새 토큰으로 재시도
        processQueue(null, newAccessToken);

        // 원래 실패했던 요청도 새 토큰으로 재시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);

      } catch (refreshError) {
        // 갱신 자체가 실패 (refreshToken도 만료됨) → 모든 대기 요청 실패 처리 + 강제 로그아웃
        processQueue(refreshError as AxiosError, null);
        await useAuthStore.getState().logout(); // 스토어와 SecureStore 완전 초기화
        return Promise.reject(refreshError);   // 에러를 위로 전파

      } finally {
        // 성공/실패 무관하게 갱신 플래그를 반드시 해제해야 다음 번 갱신이 동작해요.
        isRefreshing = false;
      }
    }

    // 401이 아니거나 이미 재시도한 요청은 그냥 에러 전파
    return Promise.reject(error);
  },
);

// 이 apiClient를 모든 api/*.ts 파일에서 import해서 사용해요.
export default apiClient;
