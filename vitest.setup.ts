import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import React from 'react';

// MSWサーバーの設定
import { server } from './src/mocks/server';

// 全テスト実行前にMSWサーバーを起動
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// 各テスト実行後にリクエストハンドラをリセット
afterEach(() => {
  server.resetHandlers();
});

// 全テスト実行後にMSWサーバーを停止
afterAll(() => {
  server.close();
});

// グローバルなモック設定
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// IntersectionObserver のモック
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// ResizeObserver のモック
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Next.js のルーターモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Next.js のImageコンポーネントモック
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, width, height, ...restProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', {
      src,
      alt,
      width,
      height,
      ...restProps,
    });
  },
}));