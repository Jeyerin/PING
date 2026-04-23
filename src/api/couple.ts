// =============================================================================
// 📁 파일 용도: 커플 연결·하트 신호·초대코드 관련 API 함수 모음
// =============================================================================

import apiClient from './client';
import { ApiResponse, Couple, CoupleConnectRequest } from '../types';

export const coupleApi = {
  // ── getMyCouple: 내 커플 정보 조회 ─────────────────────────────────────────
  // GET /couple/me
  // 앱 시작 시, 홈 화면 진입 시 호출해요.
  // 커플 미연결 상태면 서버가 404를 반환 → catch에서 setCouple(null) 처리해요.
  getMyCouple: () =>
    apiClient.get<ApiResponse<Couple>>('/couple/me'),

  // ── connect: 상대방 초대 코드로 커플 연결 ──────────────────────────────────
  // POST /couple/connect
  // CoupleConnectScreen에서 상대방 코드 입력 후 "연결하기" 버튼을 누를 때 호출해요.
  // 성공 시: 새로 생성된 Couple 정보를 반환해요.
  // 실패 시: 404(코드 없음), 409(이미 연결됨)
  connect: (body: CoupleConnectRequest) =>
    apiClient.post<ApiResponse<Couple>>('/couple/connect', body),

  // ── sendPresence: "나 여기 있어요" 하트 신호 전송 ──────────────────────────
  // POST /couple/presence
  // 홈 화면 하트 버튼을 눌렀을 때 호출해요.
  // 서버에서 상대방에게 푸시 알림을 보내줘요.
  // 응답 data는 void(반환 없음) — 성공 여부만 확인하면 돼요.
  sendPresence: () =>
    apiClient.post<ApiResponse<void>>('/couple/presence'),

  // ── getMyInviteCode: 내 초대 코드 조회 ─────────────────────────────────────
  // GET /couple/invite-code
  // CoupleConnectScreen 진입 시 호출해서 "내 초대 코드" 카드에 표시해요.
  // 초대 코드는 회원가입 시 서버가 자동 생성해요.
  getMyInviteCode: () =>
    apiClient.get<ApiResponse<{ inviteCode: string }>>('/couple/invite-code'),
};
