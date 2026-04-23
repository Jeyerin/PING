// =============================================================================
// 📁 파일 용도: 달력 사진/메모 기록 관련 API 함수 모음
//
// 사진 업로드 주의사항:
//   - 사진은 일반 JSON이 아닌 multipart/form-data 형식으로 보내야 해요.
//   - FormData 객체에 파일을 담아서 Content-Type 헤더를 변경해요.
//   - React Native에서 파일은 { uri, name, type } 형태의 객체로 첨부해요.
// =============================================================================

import apiClient from './client';
import { ApiResponse, CalendarEntry } from '../types';

export const calendarApi = {
  // ── getEntries: 특정 연월의 달력 기록 전체 조회 ─────────────────────────────
  // GET /calendar?year=2024&month=7
  // 달력 화면에서 월이 바뀔 때마다 호출해요.
  // 해당 커플의 해당 월에 있는 CalendarEntry 목록을 반환해요.
  getEntries: (year: number, month: number) =>
    apiClient.get<ApiResponse<CalendarEntry[]>>(`/calendar?year=${year}&month=${month}`),

  // ── getEntry: 특정 날짜의 기록 상세 조회 ───────────────────────────────────
  // GET /calendar/2024-07-14
  // 달력에서 특정 날짜를 탭했을 때 상세 정보를 가져와요.
  getEntry: (date: string) =>
    apiClient.get<ApiResponse<CalendarEntry>>(`/calendar/${date}`),

  // ── createEntry: 특정 날짜에 사진 + 메모 추가 ──────────────────────────────
  // POST /calendar (multipart/form-data)
  // 사진 파일을 서버로 직접 업로드하는 API예요.
  //
  // FormData 사용 이유:
  //   JSON은 텍스트만 담을 수 있어요. 이진 파일(이미지)을 전송하려면
  //   multipart/form-data 형식이 필요해요.
  //
  // as unknown as Blob:
  //   React Native의 FormData는 웹 표준과 달리 파일을 { uri, name, type }
  //   객체로 처리해요. TypeScript가 타입 불일치로 오류를 내서 타입 캐스팅으로 우회해요.
  createEntry: (date: string, photoUri: string, memo?: string) => {
    const form = new FormData();
    form.append('date', date);
    if (memo) form.append('memo', memo); // 메모는 선택사항 — 있을 때만 추가
    form.append('photo', {
      uri: photoUri,      // 로컬 파일 경로 (예: file:///storage/.../photo.jpg)
      name: 'photo.jpg',  // 서버에서 받을 파일 이름
      type: 'image/jpeg', // MIME 타입 — 서버가 어떤 파일인지 판단하는 데 사용
    } as unknown as Blob);
    return apiClient.post<ApiResponse<CalendarEntry>>('/calendar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }, // JSON이 아님을 명시
    });
  },

  // ── deleteEntry: 달력 기록 삭제 ────────────────────────────────────────────
  // DELETE /calendar/:id
  deleteEntry: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/calendar/${id}`),
};
