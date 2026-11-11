import type { NextConfig } from 'next';

// npm run dev 에서만 쓰인다. docker에서는 nginx가 /api 를 백엔드로 보낸다.
const nextConfig: NextConfig = {
  rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' }];
  },
};

export default nextConfig;
