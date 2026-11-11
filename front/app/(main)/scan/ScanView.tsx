'use client';

// 영수증 촬영 — 안내(O1) → 사진 고르기 → 분석 중(O2) → 결과(/scan/[id]) 또는 실패(O5) (02 문서 5절)

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, uploadReceipt } from '../../_lib/api';
import { AnalyzingView } from './AnalyzingView';
import { FailedView } from './FailedView';
import { GuideView } from './GuideView';

const MAX_MB = 10;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

type State = { step: 'guide' } | { step: 'analyzing' } | { step: 'failed'; code: string };

// 올리기 전에 기기에서 먼저 확인한다 (서버도 다시 확인한다).
function checkFile(file: File): string {
  if (file.size > MAX_MB * 1024 * 1024) return 'file_too_large';
  const isHeic = /\.(heic|heif)$/i.test(file.name);
  if (!IMAGE_TYPES.includes(file.type) && !isHeic) return 'unsupported_media';
  return '';
}

export function ScanView() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: 'guide' });
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 사진을 다시 골라도 change 가 일어나게 비운다
    if (!file) return;

    const problem = checkFile(file);
    if (problem) {
      setState({ step: 'failed', code: problem });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState({ step: 'analyzing' });
    try {
      const receipt = await uploadReceipt(file, controller.signal);
      router.replace(`/scan/${receipt.receipt_id}`);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'ocr_failed';
      if (code === 'aborted') setState({ step: 'guide' });
      else setState({ step: 'failed', code });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setState({ step: 'guide' });
  }

  return (
    <>
      {state.step === 'guide' && (
        <GuideView onCamera={() => cameraRef.current?.click()} onAlbum={() => albumRef.current?.click()} />
      )}
      {state.step === 'analyzing' && <AnalyzingView onCancel={cancel} />}
      {state.step === 'failed' && (
        <FailedView code={state.code} onRetry={() => setState({ step: 'guide' })} />
      )}

      {/* HTTP(같은 Wi-Fi) 접속에서는 카메라 API를 쓸 수 없어 파일 입력으로 촬영한다 (01 문서 6절) */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={albumRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </>
  );
}
