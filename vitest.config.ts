import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // グローバル関数を利用可能にする
    globals: true,
    
    // DOM環境をシミュレート
    environment: 'jsdom',
    
    // テスト実行前のセットアップファイル
    setupFiles: './vitest.setup.ts',
    
    // CSSのインポートを有効化
    css: true,
    
    // テストファイルのパターン
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/__tests__/**/*.{test,spec}.{ts,tsx}'
    ],
    
    // テストから除外するファイル
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'storybook-static',
      'tests/e2e/**/*'
    ],
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        'src/mocks/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/next.config.ts',
        '**/tailwind.config.ts',
        '**/vitest.config.ts',
        '**/vitest.setup.ts',
        '.storybook/',
        'tests/e2e/'
      ],
      // カバレッジの閾値
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // テストタイムアウト
    testTimeout: 10000,
    
    // レポーター設定
    reporter: ['verbose', 'json', 'html']
  },
  
  // パスエイリアス（Next.jsの設定と合わせる）
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});