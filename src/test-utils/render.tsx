import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// カスタムレンダー関数のプロバイダー型定義
interface AllTheProvidersProps {
  children: ReactNode;
}

// 将来的にContext Providerを追加する際のラッパーコンポーネント
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <>
      {/* TODO: 認証Context、テーマContext等をここに追加 */}
      {/* <AuthProvider> */}
      {/* <ThemeProvider> */}
      {children}
      {/* </ThemeProvider> */}
      {/* </AuthProvider> */}
    </>
  );
};

// カスタムレンダー関数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Testing Libraryの元のrenderをre-export
export * from '@testing-library/react';

// カスタムレンダー関数をデフォルトのrenderとしてexport
export { customRender as render };