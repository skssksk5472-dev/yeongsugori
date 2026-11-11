import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import { ToastProvider } from './_components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: '잘씀',
  description: '영수증 가계부',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ToastProvider>
          <div className="app">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
