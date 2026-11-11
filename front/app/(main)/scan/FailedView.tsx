'use client';

// O5 인식 실패 — 오류 코드에 따라 제목만 바꾼다. 다시 촬영(O1) 또는 직접 입력(/add) (02 문서 5절)

import { useRouter } from 'next/navigation';
import { Camera, PencilLine, TriangleAlert } from 'lucide-react';
import { ActionBar } from '../../_components/ActionBar';
import { Button } from '../../_components/Button';
import { Header } from '../../_components/Header';
import s from './scan.module.css';

const TITLES: Record<string, string> = {
  ocr_timeout: '분석 시간이 초과되었습니다',
  rate_limited: '요청이 많습니다. 잠시 후 다시 시도하세요',
  file_too_large: '이미지 용량이 너무 큽니다 (10MB 이하)',
  unsupported_media: '지원하지 않는 이미지 형식입니다',
};
const DEFAULT_TITLE = '영수증을 인식하지 못했습니다';

export function FailedView({ code, onRetry }: { code: string; onRetry: () => void }) {
  const router = useRouter();
  return (
    <main>
      <Header title="영수증 촬영" />
      <div className={s.failed}>
        <span className={s.failedIcon}><TriangleAlert size={44} color="var(--warn-text)" aria-hidden="true" /></span>
        <h2 className={s.failedTitle}>{TITLES[code] ?? DEFAULT_TITLE}</h2>
        <p className={s.failedSub}>다시 촬영하거나 직접 입력하세요</p>
      </div>
      <ActionBar>
        <div className={s.buttons}>
          <Button icon={Camera} onClick={onRetry}>다시 촬영</Button>
          <Button variant="outline" icon={PencilLine} onClick={() => router.replace('/add')}>직접 입력</Button>
        </div>
      </ActionBar>
    </main>
  );
}
