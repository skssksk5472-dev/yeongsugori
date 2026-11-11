'use client';

// 입력 칸 — 라벨 13/700, 높이 52, 테두리 1.5. 오류면 빨간 테두리와 문구, 비밀번호는 눈 아이콘으로 표시 전환 (06 문서 3절)

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import s from './field.module.css';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  error?: string;
  helper?: string;
  suffix?: string; // 입력 뒤에 붙는 단위 (예: 원)
  inputMode?: 'text' | 'numeric' | 'email';
  autoComplete?: string;
};

export function Field({
  label, value, onChange, onBlur, type = 'text', placeholder, error, helper, suffix, inputMode, autoComplete,
}: Props) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const message = error || helper;

  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <div className={s.box}>
        <input
          id={id}
          className={[s.input, error && s.inputError, (isPassword || suffix) && s.withRight].filter(Boolean).join(' ')}
          type={inputType}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? `${id}-message` : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {isPassword && (
          <button type="button" className={s.eye} aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={22} color="var(--ink-3)" /> : <Eye size={22} color="var(--ink-3)" />}
          </button>
        )}
        {suffix && <span className={s.suffix}>{suffix}</span>}
      </div>
      {message && <p id={`${id}-message`} className={error ? s.error : s.helper}>{message}</p>}
    </div>
  );
}
