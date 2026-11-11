import { Suspense } from 'react';
import { LoginView } from './LoginView';

// A1 로그인. 주소의 ?expired=1 을 읽으므로 Suspense 로 감싼다 (Next.js 규칙)
export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
