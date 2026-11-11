'use client';

// H2 내역 추가 시트 — 영수증 촬영(/scan) 또는 직접 입력(/add)을 고른다 (02 문서 5절)

import { useRouter } from 'next/navigation';
import { Camera, PencilLine, type LucideIcon } from 'lucide-react';
import { Sheet } from '../_components/Sheet';
import s from './addSheet.module.css';

type Props = { open: boolean; onClose: () => void };

export function AddSheet({ open, onClose }: Props) {
  const router = useRouter();
  return (
    <Sheet open={open} onClose={onClose} title="내역 추가">
      <div className={s.options}>
        <Option icon={Camera} title="영수증 촬영" description="자동으로 인식" onClick={() => router.push('/scan')} />
        <Option icon={PencilLine} title="직접 입력" description="금액과 항목 입력" onClick={() => router.push('/add')} />
      </div>
    </Sheet>
  );
}

type OptionProps = { icon: LucideIcon; title: string; description: string; onClick: () => void };

function Option({ icon: Icon, title, description, onClick }: OptionProps) {
  return (
    <button type="button" className={s.option} onClick={onClick}>
      <span className={s.icon}><Icon size={24} color="var(--primary)" aria-hidden="true" /></span>
      <span>
        <span className={s.title}>{title}</span>
        <span className={s.description}>{description}</span>
      </span>
    </button>
  );
}
