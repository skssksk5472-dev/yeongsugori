// 백엔드 API 호출 — 화면은 이 파일(과 인증용 session.ts)만 부른다. 주소는 항상 /api 로 시작하는 상대 경로다.
//
// 서버 모양은 슈퍼노바와 같다 — 요청 {header, body}, 응답 {header, body: {result, detail, error_code, …}}.
// 실패는 HTTP 200 + result false + error_code로 온다. 로그인이 필요할 때만 HTTP 401이다.
// 401이 오면 로그인 화면으로 보낸다(전역 처리). 로그인 화면은 ?expired=1 을 보고 "로그인이 만료되었습니다"를 띄운다.

import type { TransactionType } from './format';

export class ApiError extends Error {
  code: string;
  fields: Record<string, string>; // 입력 검증 실패일 때 필드별 문구

  constructor(code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

const NETWORK_ERROR = '서버에 연결할 수 없습니다';

// 화면에 보여 줄 오류 문구. 입력 검증 실패면 첫 번째 필드 문구를 쓴다.
export function errorText(err: unknown): string {
  if (err instanceof ApiError && err.code === 'validation') return Object.values(err.fields)[0] ?? err.message;
  return err instanceof Error ? err.message : NETWORK_ERROR;
}
const HEADER = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

type Options = {
  // false 이면 401이어도 로그인 화면으로 보내지 않는다 (처음 들어올 때 로그인 확인용)
  redirectOn401?: boolean;
};

function goToLogin() {
  if (window.location.pathname !== '/login') window.location.replace('/login?expired=1');
}

async function read(res: Response, { redirectOn401 = true }: Options): Promise<Row> {
  if (res.status === 401) {
    if (redirectOn401) goToLogin();
    throw new ApiError('unauthorized', '로그인이 필요합니다');
  }
  if (res.status === 413) throw new ApiError('file_too_large', '이미지 용량이 너무 큽니다 (10MB 이하)');
  if (!res.ok) throw new ApiError('server', NETWORK_ERROR);
  let data: Row;
  try {
    data = (await res.json()) as Row;
  } catch {
    throw new ApiError('server', NETWORK_ERROR);
  }
  const body = data?.body as Row | undefined;
  if (!body) throw new ApiError('server', NETWORK_ERROR);
  if (!body.result) throw new ApiError(String(body.error_code || 'server'), String(body.detail || NETWORK_ERROR), body.fields ?? {});
  return body;
}

async function send(run: () => Promise<Response>, options: Options): Promise<Row> {
  let res: Response;
  try {
    res = await run();
  } catch (err) {
    // 사용자가 취소(AbortController)한 경우는 네트워크 오류와 구분한다.
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiError('aborted', '취소되었습니다');
    throw new ApiError('network', NETWORK_ERROR);
  }
  return read(res, options);
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function apiGet(path: string, params: Record<string, string | undefined> = {}, options: Options = {}): Promise<Row> {
  return send(() => fetch(`/api${path}${query(params)}`, { credentials: 'include', cache: 'no-store' }), options);
}

export function apiPost(path: string, body: Row = {}, options: Options = {}): Promise<Row> {
  return send(() => fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ header: HEADER, body }),
  }), options);
}

// ── 설정 (닉네임·비밀번호 변경, 탈퇴) ──

export async function changeNickname(nickname: string): Promise<{ nickname: string }> {
  return (await apiPost('/user/change_nickname', { nickname })).user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPost('/user/change_password', { current_password: currentPassword, new_password: newPassword });
}

// 성공하면 서버가 로그인 쿠키를 지운다.
export async function withdraw(password: string): Promise<void> {
  await apiPost('/user/withdraw', { password });
}

// ── 내역 ──

export type Transaction = {
  transaction_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  merchant: string | null;
  memo: string;
  occurred_on: string; // "YYYY-MM-DD"
  receipt_id: string | null;
};

// 저장할 때 보내는 값 (상호·영수증은 직접 입력에서 받지 않는다)
export type TransactionInput = Pick<Transaction, 'type' | 'amount' | 'category' | 'title' | 'memo' | 'occurred_on'>;

export type MonthSummary = { total_expense: number; total_income: number; balance: number };

// summary 는 필터와 상관없는 월 전체 합계, items 는 필터가 적용된 목록 (최신순)
export async function getMonthList(month: string, type = '', category = ''): Promise<{ summary: MonthSummary; items: Transaction[] }> {
  const body = await apiGet('/transaction/get_month_list', { month, type, category });
  return { summary: body.summary, items: body.items };
}

export async function getTransaction(transactionId: string): Promise<Transaction> {
  return (await apiGet('/transaction/get_transaction', { transaction_id: transactionId })).item;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  return (await apiPost('/transaction/create_transaction', input)).item;
}

export async function editTransaction(transactionId: string, input: TransactionInput): Promise<Transaction> {
  return (await apiPost('/transaction/edit_transaction', { transaction_id: transactionId, ...input })).item;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await apiPost('/transaction/delete_transaction', { transaction_id: transactionId });
}

// 영수증 이미지 주소 (본인 것만 서버가 내려준다)
export function receiptImageUrl(receiptId: string): string {
  return `/api/receipt/get_receipt_image?receipt_id=${encodeURIComponent(receiptId)}`;
}

// ── 분석 ──

export type CategoryStat = { category: string; amount: number; count: number; ratio: number };

export type CategoryStats = {
  total_expense: number;
  prev_month_expense: number;
  categories: CategoryStat[]; // 금액이 큰 순서, 0원 카테고리 제외
};

export async function getCategoryStats(month: string): Promise<CategoryStats> {
  const body = await apiGet('/stats/get_category_stats', { month });
  return { total_expense: body.total_expense, prev_month_expense: body.prev_month_expense, categories: body.categories };
}

// ── 영수증 ──

export type ReceiptItem = {
  name: string;
  quantity: number;
  amount: number; // 할인 품목은 음수
  category: string;
  is_discount: boolean;
};

export type Receipt = {
  receipt_id: string;
  status: 'analyzed' | 'confirmed';
  merchant: string | null;
  purchased_on: string | null;
  total_amount: number | null; // 영수증에 적힌 최종 결제액
  items: ReceiptItem[];
  items_sum: number;
  mismatch: boolean;
  confidence: 'high' | 'medium' | 'low';
};

// 사진을 올리고 분석이 끝날 때까지 기다린다. signal 로 중간에 취소할 수 있다.
export async function uploadReceipt(image: File, signal: AbortSignal): Promise<Receipt> {
  const form = new FormData();
  form.append('image', image);
  const body = await send(() => fetch('/api/receipt/upload_receipt', {
    method: 'POST', credentials: 'include', body: form, signal,
  }), {});
  return body.receipt;
}

export async function getReceipt(receiptId: string): Promise<Receipt> {
  return (await apiGet('/receipt/get_receipt', { receipt_id: receiptId })).receipt;
}

export type ConfirmItem = Pick<ReceiptItem, 'name' | 'amount' | 'category'>;

// 고친 품목을 내역으로 한 번에 저장한다. 전부 저장되거나 하나도 저장되지 않는다.
export async function confirmReceipt(receiptId: string, merchant: string, occurredOn: string, items: ConfirmItem[]): Promise<{ created: number; month: string }> {
  const body = await apiPost('/receipt/confirm_receipt', { receipt_id: receiptId, merchant, occurred_on: occurredOn, items });
  return { created: body.created, month: body.month };
}
