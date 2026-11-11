// validators.ts 단위 테스트 — npm test (node --test). 서버 규칙(back/app/utils/validator.py)과 같아야 한다.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkEmail, checkNickname, checkPassword, checkPasswordConfirm } from './validators.ts';

test('checkEmail', () => {
  assert.equal(checkEmail('demo@zalssm.test'), '');
  assert.equal(checkEmail(' demo@zalssm.test '), '');
  assert.equal(checkEmail('abc'), '올바른 이메일 형식이 아닙니다');
  assert.equal(checkEmail(`${'a'.repeat(95)}@b.com`), '올바른 이메일 형식이 아닙니다');
});

test('checkNickname: 앞뒤 공백을 빼고 2~12자', () => {
  assert.equal(checkNickname('잘쓰는사람'), '');
  assert.equal(checkNickname(' 가 '), '닉네임은 2~12자로 입력하세요');
  assert.equal(checkNickname('가'.repeat(13)), '닉네임은 2~12자로 입력하세요');
});

test('checkPassword: 8~64자, 영문과 숫자', () => {
  assert.equal(checkPassword('demo1234a'), '');
  assert.equal(checkPassword('password'), '8자 이상, 영문과 숫자를 포함해야 합니다');
  assert.equal(checkPassword('12345678'), '8자 이상, 영문과 숫자를 포함해야 합니다');
  assert.equal(checkPassword('ab12'), '8자 이상, 영문과 숫자를 포함해야 합니다');
  // 한글 30자 = 90바이트 → bcrypt 한도(72바이트) 초과
  assert.equal(checkPassword(`a1${'가'.repeat(30)}`), '8자 이상, 영문과 숫자를 포함해야 합니다');
});

test('checkPasswordConfirm', () => {
  assert.equal(checkPasswordConfirm('demo1234a', 'demo1234a'), '');
  assert.equal(checkPasswordConfirm('demo1234a', 'demo1234b'), '비밀번호가 일치하지 않습니다');
});
