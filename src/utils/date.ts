// =============================================================================
// 📁 파일 용도: 날짜 계산·포맷 관련 유틸리티 함수 모음
//
// 왜 별도 파일로 분리했나?
//   날짜 계산은 여러 화면(홈, 달력, 편지함)에서 반복적으로 필요해요.
//   한 곳에 모아두면 로직이 바뀔 때 이 파일만 수정하면 돼요.
// =============================================================================

// ── calcDDay: 사귀기 시작한 날로부터 오늘까지 몇 일째인지 계산 ──────────────────
// 예: startDate = "2024-01-01", 오늘 = "2025-01-01" → 366 반환
//
// +1을 하는 이유:
//   "사귄 첫날"을 D+1로 표현하는 게 일반적인 커플앱 관례예요.
//   수학적으로는 0이지만 "첫날"은 1로 세요.
//
// setHours(0,0,0,0)을 하는 이유:
//   시간 차이(예: 오전 9시 vs 오후 11시)가 계산에 영향을 주지 않도록
//   두 날짜 모두 자정(00:00:00.000)으로 맞춰요.
export function calcDDay(startDateStr: string): number {
  const start = new Date(startDateStr); // 시작일을 Date 객체로 변환
  const today = new Date();             // 오늘 날짜

  // 시분초를 제거해서 "날짜"만 비교 (시간대 차이 제거)
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // getTime()은 1970년 1월 1일 자정(UTC)으로부터의 밀리초(ms)를 반환해요.
  const diff = today.getTime() - start.getTime();

  // ms → 일수 변환: 1일 = 1000ms × 60초 × 60분 × 24시간
  // Math.floor: 소수점은 버려요 (예: 1.9일 → 1일)
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

// ── formatDate: ISO 날짜 문자열을 "YYYY.MM.DD" 형태로 변환 ───────────────────
// 예: "2024-07-14T09:00:00Z" → "2024.07.14"
//
// padStart(2, '0'): 한 자리 숫자를 두 자리로 만들어요.
//   예: 7 → "07", 3 → "03"
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // getMonth()는 0~11이라서 +1
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// ── toISODate: Date 객체를 "YYYY-MM-DD" 형태 문자열로 변환 ────────────────────
// 예: new Date(2024, 11, 25) → "2024-12-25"
//
// toISOString()은 "2024-12-25T00:00:00.000Z" 같이 반환하는데,
// split('T')[0]으로 날짜 부분만 잘라내요.
// 편지 열람일, 달력 기록 날짜 등 API에 날짜를 보낼 때 사용해요.
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
