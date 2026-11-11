'use client';

// 컴포넌트를 시안의 목업 값으로 한 화면에 늘어놓는다. 버튼으로 시트·다이얼로그·토스트를 연다.

import { useState } from 'react';
import { Camera, PencilLine, Trash2 } from 'lucide-react';
import { ActionBar } from '../../_components/ActionBar';
import { Banner } from '../../_components/Banner';
import { Button } from '../../_components/Button';
import { CategoryChip } from '../../_components/CategoryChip';
import { CategoryGrid } from '../../_components/CategoryGrid';
import { DayGroup } from '../../_components/DayGroup';
import { Dialog } from '../../_components/Dialog';
import { Fab } from '../../_components/Fab';
import { Field } from '../../_components/Field';
import { Header } from '../../_components/Header';
import { IconButton } from '../../_components/IconButton';
import { LogoMark } from '../../_components/LogoMark';
import { MonthSelector } from '../../_components/MonthSelector';
import { Segmented } from '../../_components/Segmented';
import { Sheet } from '../../_components/Sheet';
import { SummaryCard } from '../../_components/SummaryCard';
import { TabBar } from '../../_components/TabBar';
import { useToast } from '../../_components/Toast';
import { TxRow } from '../../_components/TxRow';
import { EXPENSE_CATEGORIES } from '../../_lib/categories';
import { currentMonth } from '../../_lib/format';
import s from './components.module.css';

export function ComponentsView() {
  const showToast = useToast();
  const [email, setEmail] = useState('zalssm@example.com');
  const [password, setPassword] = useState('password1');
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('expense');
  const [category, setCategory] = useState('식비');
  const [month, setMonth] = useState(currentMonth());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBarOpen, setActionBarOpen] = useState(false);

  return (
    <main className={s.page}>
      <Header title="컴포넌트" back={false} right={<LogoMark size={28} />} />

      <section className={s.section}>
        <h2 className={s.h2}>버튼</h2>
        <Button>기본 버튼</Button>
        <Button variant="soft">보조 버튼</Button>
        <Button variant="outline">외곽 버튼</Button>
        <Button variant="danger">삭제</Button>
        <Button disabled>비활성</Button>
        <Button icon={Camera}>영수증 촬영</Button>
        <Button variant="soft" icon={PencilLine}>직접 입력</Button>
        <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>
          제출 중 표시
        </Button>
        <div className={s.row}>
          <IconButton icon={Trash2} label="삭제" color="var(--danger)" />
          <CategoryChip category={category} />
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>입력</h2>
        <Field label="기본" type="email" value={email} onChange={setEmail} />
        <Field label="오류" type="password" value={password} onChange={setPassword} error="비밀번호가 일치하지 않습니다" />
        <Field label="비밀번호" type="password" value={password} onChange={setPassword} helper="8자 이상, 영문과 숫자 포함" />
        <Field label="금액" value="6,900" onChange={() => {}} suffix="원" inputMode="numeric" />
        <Segmented
          options={[{ value: 'all', label: '전체' }, { value: 'expense', label: '지출' }, { value: 'income', label: '수입' }]}
          value={filter} onChange={setFilter} />
        <CategoryGrid categories={EXPENSE_CATEGORIES} value={category} onChange={setCategory} />
      </section>

      <section className={s.section}>
        <h2 className={s.h2}>안내 줄</h2>
        <Banner variant="success">품목 합계가 영수증 합계와 일치합니다</Banner>
        <Banner variant="warn">품목 합계와 영수증 합계가 다릅니다 (차액 1,200원)</Banner>
        <Banner variant="info" action={<a href="#">영수증 보기</a>}>영수증으로 등록된 내역</Banner>
        <Banner variant="danger" action={<button type="button">다시 시도</button>}>불러오지 못했습니다</Banner>
      </section>

      <MonthSelector month={month} onChange={setMonth} />
      <SummaryCard monthLabel="11월" totalExpense={354600} totalIncome={2000000} balance={1645400} />
      <DayGroup day="2026-11-03" net={-13500}>
        <TxRow type="expense" amount={9000} category="식비" title="김치찌개" />
        <TxRow type="expense" amount={4500} category="카페·간식" title="아메리카노" />
      </DayGroup>
      <DayGroup day="2026-11-02" net={-14200}>
        <TxRow type="expense" amount={2800} category="식비" title="우유 1L" merchant="한빛마트 경산점" hasReceipt />
        <TxRow type="expense" amount={-1000} category="생활" title="행사 할인" merchant="한빛마트 경산점" hasReceipt />
      </DayGroup>
      <DayGroup day="2026-11-01" net={2000000}>
        <TxRow type="income" amount={2000000} category="급여" title="10월 급여" />
      </DayGroup>

      <section className={s.section}>
        <h2 className={s.h2}>겹쳐 뜨는 것</h2>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>시트 열기</Button>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>다이얼로그 열기</Button>
        <Button variant="outline" onClick={() => showToast('저장되었습니다')}>토스트 띄우기</Button>
        <Button variant="outline" onClick={() => setActionBarOpen(!actionBarOpen)}>액션 바 보이기·숨기기</Button>
      </section>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="내역 추가">
        <div className={s.row}>
          <Button icon={Camera} onClick={() => setSheetOpen(false)}>영수증 촬영</Button>
          <Button variant="soft" icon={PencilLine} onClick={() => setSheetOpen(false)}>직접 입력</Button>
        </div>
      </Sheet>
      <Dialog open={dialogOpen} title="로그아웃하시겠습니까?" actions={<>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>취소</Button>
        <Button size="sm" onClick={() => setDialogOpen(false)}>로그아웃</Button>
      </>} />

      <div className={s.bottomSpace} />
      {actionBarOpen ? <ActionBar><Button>5건 저장</Button></ActionBar> : <><Fab onClick={() => setSheetOpen(true)} /><TabBar /></>}
    </main>
  );
}
