// 입력 검증 — 서버와 같은 규칙(02 문서 4절). 맞으면 "", 틀리면 필드 아래에 보여 줄 문구를 돌려준다.

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function checkEmail(email: string): string {
  const value = email.trim();
  return value.length <= 100 && EMAIL_PATTERN.test(value) ? '' : '올바른 이메일 형식이 아닙니다';
}

export function checkNickname(nickname: string): string {
  const length = nickname.trim().length;
  return length >= 2 && length <= 12 ? '' : '닉네임은 2~12자로 입력하세요';
}

// 8~64자, 영문과 숫자를 각각 1자 이상. 서버(bcrypt)가 다루는 72바이트도 넘지 않아야 한다.
export function checkPassword(password: string): string {
  const bytes = new TextEncoder().encode(password).length;
  const okLength = password.length >= 8 && password.length <= 64 && bytes <= 72;
  const ok = okLength && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  return ok ? '' : '8자 이상, 영문과 숫자를 포함해야 합니다';
}

export function checkPasswordConfirm(password: string, confirm: string): string {
  return password === confirm ? '' : '비밀번호가 일치하지 않습니다';
}
