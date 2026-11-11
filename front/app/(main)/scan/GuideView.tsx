// O1 촬영 안내 — 모서리 표시 안의 영수증 그림, 촬영 팁 3가지, 촬영하기 / 앨범에서 선택 (시안 O1)

import { Camera, Image as ImageIcon, Maximize, ScanLine, Sun, type LucideIcon } from 'lucide-react';
import { ActionBar } from '../../_components/ActionBar';
import { Button } from '../../_components/Button';
import { Header } from '../../_components/Header';
import { ReceiptIllustration } from '../../_components/ReceiptIllustration';
import s from './scan.module.css';

type Props = { onCamera: () => void; onAlbum: () => void };

export function GuideView({ onCamera, onAlbum }: Props) {
  return (
    <main>
      <Header title="영수증 촬영" />
      <div className={s.frame}>
        <span className={`${s.corner} ${s.topLeft}`} />
        <span className={`${s.corner} ${s.topRight}`} />
        <span className={`${s.corner} ${s.bottomLeft}`} />
        <span className={`${s.corner} ${s.bottomRight}`} />
        <ReceiptIllustration width={150} height={280} stamp={false} rows={8} label="촬영 안내용 영수증 일러스트" />
      </div>
      <div className={s.tips}>
        <Tip icon={Maximize} text="평평하게 펼치기" />
        <Tip icon={ScanLine} text="전체가 보이게" />
        <Tip icon={Sun} text="밝은 곳에서" />
      </div>
      <ActionBar>
        <div className={s.buttons}>
          <Button icon={Camera} onClick={onCamera}>촬영하기</Button>
          <Button variant="outline" icon={ImageIcon} onClick={onAlbum}>앨범에서 선택</Button>
        </div>
      </ActionBar>
    </main>
  );
}

function Tip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className={s.tip}>
      <span className={s.tipIcon}><Icon size={22} color="var(--primary)" aria-hidden="true" /></span>
      {text}
    </div>
  );
}
