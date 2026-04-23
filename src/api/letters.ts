// =============================================================================
// 📁 파일 용도: 편지함 (받은 편지 목록·상세·쓰기) 관련 API — 프리미엄 전용
//
// 이 API들은 서버에서 subscription_type == 'PREMIUM' 인지 검사해요.
// FREE 유저가 호출하면 403 Forbidden을 반환해요.
// 클라이언트에서도 isPremium을 체크하지만, 서버 체크가 최종 보안 방어선이에요.
// =============================================================================

import apiClient from './client';
import { ApiResponse, Letter, WriteLetterRequest } from '../types';

export const lettersApi = {
  // ── getReceived: 내가 받은 편지 목록 조회 ──────────────────────────────────
  // GET /letters/received
  // openDate가 지난 것(열람 가능)과 아직 안 지난 것(잠금) 모두 반환해요.
  // 화면에서 isOpenable()로 두 가지를 구분해서 표시해요.
  getReceived: () =>
    apiClient.get<ApiResponse<Letter[]>>('/letters/received'),

  // ── getSent: 내가 보낸 편지 목록 조회 ──────────────────────────────────────
  // GET /letters/sent
  // 현재 LettersScreen에서는 받은 편지만 보여주지만, 나중에 "보낸 편지함" 탭 추가 시 사용해요.
  getSent: () =>
    apiClient.get<ApiResponse<Letter[]>>('/letters/sent'),

  // ── getLetter: 편지 상세 내용 조회 ─────────────────────────────────────────
  // GET /letters/:id
  // openDate가 지나지 않은 편지를 요청하면 서버가 403을 반환해요.
  // 클라이언트에서 미리 isOpenable() 체크를 하지만, 서버가 최종 방어해요.
  getLetter: (id: number) =>
    apiClient.get<ApiResponse<Letter>>(`/letters/${id}`),

  // ── writeLetter: 편지 쓰기 ──────────────────────────────────────────────────
  // POST /letters
  // content(본문)와 openDate(열람 날짜)를 서버에 보내요.
  // 서버는 로그인한 사용자의 파트너 ID를 receiverId로 자동 설정해요.
  writeLetter: (body: WriteLetterRequest) =>
    apiClient.post<ApiResponse<Letter>>('/letters', body),
};
