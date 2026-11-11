// 로그인·가입·로그아웃과 로그인 상태 확인 (auth 모듈) — 로그인 토큰은 HttpOnly 쿠키라 JS에서 읽을 수 없으므로 서버에 물어본다.

import { ApiError, apiGet, apiPost } from './api';

export type User = { uid: string; email: string; nickname: string };

// 로그인했으면 사용자 정보, 아니면 null. 처음 들어올 때 쓰므로 401이어도 화면을 옮기지 않는다.
export async function getMe(): Promise<User | null> {
  try {
    const body = await apiGet('/auth/get_me', {}, { redirectOn401: false });
    return body.user as User;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'unauthorized') return null;
    throw error;
  }
}

// 성공하면 서버가 로그인 쿠키를 내려준다.
export async function login(email: string, password: string): Promise<User> {
  return (await apiPost('/auth/login', { email, password })).user as User;
}

// 가입하면 바로 로그인된다.
export async function signup(email: string, nickname: string, password: string): Promise<User> {
  return (await apiPost('/auth/signup', { email, nickname, password })).user as User;
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}
