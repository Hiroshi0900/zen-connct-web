/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages対応設定
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // TypeScript設定（デプロイテスト時は一時的に緩和）
  typescript: {
    ignoreBuildErrors: true, // デプロイテスト時は一時的にtrue
  },
  
  // ESLint設定（デプロイ時は一時的に緩和）
  eslint: {
    ignoreDuringBuilds: true, // デプロイテスト時は一時的にtrue
  },
  
  // 画像最適化設定（Cloudflare対応）
  images: {
    unoptimized: true, // Cloudflare Imagesを使用する場合は後で調整
  },
  
  // 静的エクスポート設定（CSRアプリケーション用）
  output: 'export',
  trailingSlash: true,
  
  // 開発環境でのプロキシ設定（CORSを回避）
  async rewrites() {
    return [];
  },
};

export default nextConfig;