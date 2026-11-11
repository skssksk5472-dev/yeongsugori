// 금액·날짜 표시 — 저장값(정수 원, "YYYY-MM-DD", "YYYY-MM")을 화면 문구로 바꾼다 (02 문서 3절).

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export type TransactionType = 'expense' | 'income';

// 9000 → "9,000" (부호 없이)
export function formatWon(amount: number): string {
  return Math.abs(amount).toLocaleString('ko-KR');
}

// 지출 9000 → "-9,000", 수입 → "+2,000,000", 음수 지출(할인) -1000 → "+1,000"
export function formatSignedAmount(type: TransactionType, amount: number): string {
  const isPlus = type === 'income' || amount < 0;
  return `${isPlus ? '+' : '-'}${formatWon(amount)}`;
}

// 수입이거나 할인(음수 지출)이면 primary 색으로 보여 준다.
export function isPlusAmount(type: TransactionType, amount: number): boolean {
  return type === 'income' || amount < 0;
}

// 날짜별 순합계(수입 - 지출): 0 이하는 "-", 초과는 "+"
export function formatNetAmount(net: number): string {
  return `${net <= 0 ? '-' : '+'}${formatWon(net)}`;
}

// 시간대에 흔들리지 않도록 "YYYY-MM-DD" 를 직접 나눠서 Date를 만든다.
function toDate(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

// "2026-11-03" → "2026.11.03 (화)"
export function formatDate(day: string): string {
  return `${day.replaceAll('-', '.')} (${WEEKDAYS[toDate(day).getDay()]})`;
}

// "2026-11-03" → "11월 3일 화요일" (내역 날짜 묶음 제목)
export function formatDayTitle(day: string): string {
  const date = toDate(day);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

// "2026-11" → "2026년 11월"
export function formatMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return `${year}년 ${mon}월`;
}

// "2026-11" → "11월"
export function formatMonthShort(month: string): string {
  return `${Number(month.split('-')[1])}월`;
}

// 한국 시간 기준 오늘 "YYYY-MM-DD"
export function todayKorea(now: Date = new Date()): string {
  const korea = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return korea.toISOString().slice(0, 10);
}

// 한국 시간 기준 이번 달 "YYYY-MM"
export function currentMonth(now: Date = new Date()): string {
  return todayKorea(now).slice(0, 7);
}

// "2026-11", +1 → "2026-12"
export function addMonth(month: string, diff: number): string {
  const [year, mon] = month.split('-').map(Number);
  const total = year * 12 + (mon - 1) + diff;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

// 금액 입력 칸: 숫자만 남기고 9자리(999,999,999)까지. 영수증 할인 내역처럼 음수가 허용되면 앞의 - 를 남긴다.
export function parseAmountInput(text: string, allowNegative = false): number {
  const negative = allowNegative && text.trim().startsWith('-');
  const digits = text.replace(/[^0-9]/g, '').slice(0, 9);
  const amount = digits ? Number(digits) : 0;
  return negative ? -amount : amount;
}

// 금액 입력 칸에 보여 줄 문구: 0이면 빈칸, 아니면 천 단위 콤마
export function formatAmountInput(amount: number): string {
  if (amount === 0) return '';
  return `${amount < 0 ? '-' : ''}${formatWon(amount)}`;
}

// 비율(%)을 소수 첫째 자리까지. 0.05는 올린다 (서버 stats_model 과 같은 방식)
export function roundRatio(amount: number, total: number): number {
  if (total <= 0) return 0;
  return Math.floor((amount * 1000) / total + 0.5) / 10;
}
