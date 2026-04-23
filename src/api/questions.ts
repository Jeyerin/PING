// =============================================================================
// 📁 파일 용도: 커플 문답(오늘의 질문 + 답변 제출 + 히스토리) 관련 API
// =============================================================================

import apiClient from './client';
import { ApiResponse, QuestionWithAnswers } from '../types';

export const questionsApi = {
  // ── getToday: 오늘의 질문 + 내 답변 + 상대 답변 조회 ───────────────────────
  // GET /questions/today
  // 서버가 오늘 날짜의 질문과 커플 양쪽의 답변을 묶어서 반환해요.
  // bothAnswered가 false이면 상대방의 답변은 공개되지 않아요.
  getToday: () =>
    apiClient.get<ApiResponse<QuestionWithAnswers>>('/questions/today'),

  // ── submitAnswer: 오늘 질문에 내 답변 제출 ─────────────────────────────────
  // POST /questions/:questionId/answer
  // 답변을 서버에 저장해요.
  // 제출 후에는 getToday()를 다시 호출해서 화면을 갱신해요.
  // 이미 답변한 경우 서버가 409를 반환할 수 있어요.
  submitAnswer: (questionId: number, answer: string) =>
    apiClient.post<ApiResponse<void>>(`/questions/${questionId}/answer`, { answer }),

  // ── getHistory: 지난 문답 목록 조회 ────────────────────────────────────────
  // GET /questions/history?page=0&size=20
  // 페이지네이션(pagination)을 지원해요:
  //   page: 0부터 시작하는 페이지 번호
  //   size: 한 번에 가져올 항목 수 (기본 20개)
  // QuestionScreen 아래쪽 히스토리 목록에 사용해요.
  getHistory: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<QuestionWithAnswers[]>>(
      `/questions/history?page=${page}&size=${size}`,
    ),
};
