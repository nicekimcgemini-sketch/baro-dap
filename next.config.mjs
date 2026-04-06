/** @type {import('next').NextConfig} */
const nextConfig = {
  // X-Powered-By 헤더 제거 (보안 + 경량화)
  poweredByHeader: false,

  // 응답 압축 (gzip)
  compress: true,

  // 프로덕션 소스맵 제거 (번들 크기 감소)
  productionBrowserSourceMaps: false,

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // HTTP 캐시 헤더 + 보안 헤더
  async headers() {
    return [
      {
        // 정적 자산 장기 캐시
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API 응답 캐시 방지 (실시간 데이터)
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        // 전체 경로 보안 헤더
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "font-src 'self' https://cdn.jsdelivr.net",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.supabase.com https://www.shinhancard.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
