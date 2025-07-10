import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// テスト用のエラーを投げるコンポーネント
const ThrowErrorComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// テスト用のカスタムフォールバック
const CustomFallback = (error: Error) => (
  <div data-testid="custom-fallback">
    Custom Error: {error.message}
  </div>
);

// useErrorHandlerをテストするためのコンポーネント
const ErrorHandlerTestComponent: React.FC = () => {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleSyncError = () => {
    const error = new Error('Sync error');
    handleError(error, { component: 'TestComponent', action: 'handleSync' });
  };

  const handleAsyncErrorClick = async () => {
    try {
      await handleAsyncError(
        async () => {
          throw new Error('Async error');
        },
        { component: 'TestComponent', action: 'handleAsync' }
      );
    } catch {
      // エラーをキャッチしたことを示すために表示
      return <div data-testid="async-error-caught">Async error caught</div>;
    }
  };

  return (
    <div>
      <button data-testid="sync-error-button" onClick={handleSyncError}>
        Sync Error
      </button>
      <button data-testid="async-error-button" onClick={handleAsyncErrorClick}>
        Async Error
      </button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // コンソールエラーを抑制
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('正常なレンダリング', () => {
    it('エラーがない場合は子コンポーネントを正常に表示する', () => {
      // When
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Then
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('エラーキャッチ', () => {
    it('エラーが発生した場合はデフォルトのエラーUIを表示する', () => {
      // When
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Then
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('申し訳ございません。予期しないエラーが発生しました。')).toBeInTheDocument();
      expect(screen.getByText('再試行')).toBeInTheDocument();
    });

    it('カスタムフォールバックが指定された場合はそれを使用する', () => {
      // When
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Then
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error: Test error message')).toBeInTheDocument();
    });

    it('onErrorコールバックが指定された場合は呼び出される', () => {
      // Given
      const onErrorMock = vi.fn();

      // When
      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Then
      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('開発環境でエラー詳細が表示される', () => {
      // Given
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // When
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Then
      expect(screen.getByText('エラー詳細 (開発環境のみ)')).toBeInTheDocument();

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('再試行機能', () => {
    it('再試行ボタンをクリックするとエラー状態がリセットされる', () => {
      // Given
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();

      // When
      fireEvent.click(screen.getByText('再試行'));

      // Then
      rerender(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary', () => {
  it('HOCが正しく動作する', () => {
    // Given
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('HOC test error');
      }
      return <div>HOC working</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    // When
    render(<WrappedComponent shouldThrow={false} />);

    // Then
    expect(screen.getByText('HOC working')).toBeInTheDocument();
  });

  it('HOCでエラーが発生した場合もエラーバウンダリーが機能する', () => {
    // Given
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('HOC test error');
      }
      return <div>HOC working</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    // When
    render(<WrappedComponent shouldThrow={true} />);

    // Then
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('カスタムフォールバックがHOCで正しく動作する', () => {
    // Given
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('HOC test error');
      }
      return <div>HOC working</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent, CustomFallback);

    // When
    render(<WrappedComponent shouldThrow={true} />);

    // Then
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error: HOC test error')).toBeInTheDocument();
  });
});

describe('useErrorHandler', () => {
  it('同期エラーハンドリングが正しく動作する', () => {
    // Given
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    render(<ErrorHandlerTestComponent />);
    fireEvent.click(screen.getByTestId('sync-error-button'));

    // Then
    // ログが出力されることを確認（実際のログシステムのテストは別で行う）
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('非同期エラーハンドリングが正しく動作する', async () => {
    // Given
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    render(<ErrorHandlerTestComponent />);
    fireEvent.click(screen.getByTestId('async-error-button'));

    // Then
    // ログが出力されることを確認
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});