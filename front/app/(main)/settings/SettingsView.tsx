'use client';

// S1 설정 — 프로필, 닉네임·비밀번호 변경으로 가는 줄, 앱 버전, 로그아웃(S3a)·회원 탈퇴(S3b) 다이얼로그 (02 문서 5절)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { Banner } from '../../_components/Banner';
import { Button } from '../../_components/Button';
import { Dialog } from '../../_components/Dialog';
import { Field } from '../../_components/Field';
import { Header } from '../../_components/Header';
import { useToast } from '../../_components/Toast';
import { ApiError, withdraw } from '../../_lib/api';
import { getMe, logout, type User } from '../../_lib/session';
import s from './settings.module.css';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

export function SettingsView() {
  const router = useRouter();
  const showToast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dialog, setDialog] = useState<'none' | 'logout' | 'withdraw'>('none');

  function loadUser() {
    getMe()
      .then((me) => {
        setUser(me);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  }

  useEffect(loadUser, []);

  async function handleLogout() {
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
    }
  }

  return (
    <main>
      <Header title="설정" back={false} />

      {loadFailed && (
        <div className={s.banner}>
          <Banner variant="danger" action={<button type="button" onClick={loadUser}>다시 시도</button>}>
            불러오지 못했습니다
          </Banner>
        </div>
      )}

      <section className={s.profile}>
        <span className={s.avatar} aria-hidden="true">{user?.nickname.slice(0, 1)}</span>
        <div className={s.profileText}>
          <p className={s.nickname}>{user?.nickname}</p>
          <p className={s.email}>{user?.email}</p>
        </div>
      </section>

      <Group title="계정">
        <Link href="/settings/nickname" className={s.row}>
          <span className={s.label}>닉네임 변경</span>
          <span className={s.value}>{user?.nickname}</span>
          <ChevronRight size={20} color="var(--ink-3)" aria-hidden="true" />
        </Link>
        <Link href="/settings/password" className={s.row}>
          <span className={s.label}>비밀번호 변경</span>
          <ChevronRight size={20} color="var(--ink-3)" aria-hidden="true" />
        </Link>
      </Group>

      <Group title="정보">
        <div className={s.row}>
          <span className={s.label}>앱 버전</span>
          <span className={s.value}>{APP_VERSION}</span>
        </div>
      </Group>

      <Group title="계정 관리">
        <button type="button" className={s.row} onClick={() => setDialog('logout')}>
          <LogOut size={20} color="var(--ink-2)" aria-hidden="true" />
          <span className={s.label}>로그아웃</span>
        </button>
        <button type="button" className={s.row} onClick={() => setDialog('withdraw')}>
          <Trash2 size={20} color="var(--danger)" aria-hidden="true" />
          <span className={`${s.label} ${s.danger}`}>회원 탈퇴</span>
        </button>
      </Group>

      <Dialog open={dialog === 'logout'} title="로그아웃하시겠습니까?" actions={<>
        <Button variant="outline" size="sm" onClick={() => setDialog('none')}>취소</Button>
        <Button size="sm" onClick={handleLogout}>로그아웃</Button>
      </>} />

      {dialog === 'withdraw' && <WithdrawDialog onCancel={() => setDialog('none')} />}
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.group}>
      <h2 className={s.groupTitle}>{title}</h2>
      <div className={s.card}>{children}</div>
    </section>
  );
}

// S3b — 비밀번호를 다시 받아 탈퇴한다. 비어 있으면 탈퇴 버튼 비활성
function WithdrawDialog({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const showToast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleWithdraw() {
    setSubmitting(true);
    setError('');
    try {
      await withdraw(password);
      showToast('탈퇴 처리되었습니다');
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'wrong_password') setError(err.message);
      else showToast(err instanceof Error ? err.message : '서버에 연결할 수 없습니다');
      setSubmitting(false);
    }
  }

  return (
    <Dialog open title="회원 탈퇴" actions={<>
      <Button variant="outline" size="sm" onClick={onCancel}>취소</Button>
      <Button variant="danger" size="sm" disabled={!password} loading={submitting} onClick={handleWithdraw}>탈퇴</Button>
    </>}>
      <p className={s.dialogText}>모든 내역과 영수증 이미지가 삭제되며 복구할 수 없습니다.</p>
      <Field label="비밀번호 확인" type="password" value={password} onChange={setPassword} error={error}
        autoComplete="current-password" />
    </Dialog>
  );
}
