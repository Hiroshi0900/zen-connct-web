/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  typescript: {
    // 開発中は型チェックを緩める
    ignoreBuildErrors: false,
  },
  eslint: {
    // 開発中はESLintエラーを緩める
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    // 開発環境でのプロキシ設定（CORSを回避）
    return [];
  },
};

export default nextConfig;