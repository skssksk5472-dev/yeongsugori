'use client';

// O2 분석 중 — 3단계는 시간에 맞춘 연출이다. 실제로는 업로드와 분석이 한 번의 요청으로 끝난다 (02 문서 5절)

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { IconButton } from '../../_components/IconButton';
import { ReceiptIllustration } from '../../_components/ReceiptIllustration';
import s from './scan.module.css';

const STEPS = ['업로드', '품목 인식', '카테고리 분류'];
// 이 시간(ms)이 지나면 다음 단계로 넘어간 것처럼 보여 준다. 응답이 오면 화면이 바로 바뀐다.
const STEP_TIMES = [800, 5000];

export function AnalyzingView({ onCancel }: { onCancel: () => void }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timers = STEP_TIMES.map((time, index) => setTimeout(() => setCurrent(index + 1), time));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className={s.analyzing}>
      <div className={s.closeRow}>
        <IconButton icon={X} label="닫기" onClick={onCancel} />
      </div>
      <div className={s.center}>
        <div className={s.scanBox}>
          <ReceiptIllustration width={168} height={220} stamp={false} rows={6} label="분석 중인 영수증 일러스트" />
          <span className={s.scanBand} aria-hidden="true" />
          <span className={s.scanLine} aria-hidden="true" />
        </div>
        <h1 className={s.analyzingTitle}>영수증을 분석하고 있습니다</h1>
        <p className={s.analyzingSub}>약 10초 소요됩니다</p>
      </div>
      <ol className={s.steps}>
        {STEPS.map((label, index) => (
          <Step key={label} label={label} state={index < current ? 'done' : index === current ? 'active' : 'pending'} />
        ))}
      </ol>
      <button type="button" className={s.cancel} onClick={onCancel}>취소</button>
    </main>
  );
}

const STATE_TEXT = { done: '완료', active: '진행 중', pending: '대기' };

function Step({ label, state }: { label: string; state: 'done' | 'active' | 'pending' }) {
  return (
    <li className={s.step}>
      {state === 'done' && <span className={s.dotDone}><Check size={16} color="#fff" strokeWidth={3} aria-hidden="true" /></span>}
      {state === 'active' && <span className={s.dotActive} aria-hidden="true" />}
      {state === 'pending' && <span className={s.dotPending} aria-hidden="true" />}
      <span className={state === 'pending' ? `${s.stepLabel} ${s.stepPending}` : s.stepLabel}>{label}</span>
      <span className={state === 'active' ? `${s.stepState} ${s.stepActive}` : s.stepState}>{STATE_TEXT[state]}</span>
    </li>
  );
}
