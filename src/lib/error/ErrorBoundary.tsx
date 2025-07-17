// ゼンコネクト エラーバウンダリー
// React エラーバウンダリーとログシステムの統合

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ILogger } from '../logging/LoggingPort';
import { createLogger } from '../logging/LoggerFactory';
import { withLogContext } from '../logging/LogContext';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger: ILogger;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.logger = createLogger('ErrorBoundary');
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ログコンテキストでエラーを記録
    withLogContext(
      { 
        component: 'ErrorBoundary',
        action: 'componentDidCatch' 
      },
      () => {
        this.logger.error(
          'React Error Boundary caught an error',
          error,
          {
            errorInfo: {
              componentStack: errorInfo.componentStack,
              errorBoundary: 'ErrorBoundary',
            }
          }
        );
      }
    );

    // 状態を更新
    this.setState({
      errorInfo,
    });

    // カスタムエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.logger.info('Error boundary retry attempted', {
      component: 'ErrorBoundary',
      action: 'retry',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバックがある場合はそれを使用
      if (this.props.fallback && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-300 mb-6">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            
            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-gray-900 p-4 rounded mb-4">
                <summary className="cursor-pointer text-gray-400 mb-2">
                  エラー詳細 (開発環境のみ)
                </summary>
                <pre className="text-xs text-red-300 overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleRetry}
              className="bg-accent-teal hover:bg-accent-teal/80 text-white px-6 py-2 rounded-lg transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 関数コンポーネント版のエラーバウンダリー用HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// 非同期エラーハンドリング用のフック
export const useErrorHandler = () => {
  const logger = createLogger('ErrorHandler');

  const handleError = (error: Error, context?: { component?: string; action?: string }) => {
    withLogContext(
      { 
        component: context?.component || 'Unknown',
        action: context?.action || 'handleError'
      },
      () => {
        logger.error(
          'Handled error',
          error,
          {
            context,
            timestamp: new Date().toISOString(),
          }
        );
      }
    );
  };

  const handleAsyncError = async (
    asyncOperation: () => Promise<unknown>,
    context?: { component?: string; action?: string }
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error as Error, context);
      throw error; // 再スロー
    }
  };

  return {
    handleError,
    handleAsyncError,
  };
};