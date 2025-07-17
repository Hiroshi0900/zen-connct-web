// ゼンコネクト Auth0コールバック処理コンポーネント
// Auth0からのリダイレクト後の処理を担当

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCallback } from '../../application/auth/AuthContext';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';
import { LoadingSpinner } from './LoadingSpinner';

export const AuthCallback: React.FC = () => {
  const router = useRouter();
  const { handleCallback } = useAuthCallback();
  const logger = useLogger('AuthCallback');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      await withLogContext(
        { 
          component: 'AuthCallback',
          action: 'processCallback'
        },
        async () => {
          logger.info('Processing Auth0 callback');
          
          try {
            await handleCallback();
            logger.info('Auth0 callback processed successfully, redirecting to home');
            router.replace('/');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            setError(errorMessage);
            logger.error('Auth0 callback processing failed', error as Error);
          }
        }
      );
    };

    processCallback();
  }, [handleCallback, router, logger]);

  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-5">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">認証に失敗しました</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => router.replace('/')}
              className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors"
            >
              ホームに戻る
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="border border-accent-teal text-accent-teal px-6 py-3 rounded-lg font-medium hover:bg-accent-teal hover:text-primary-dark transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ローディング状態の表示
  return <LoadingSpinner message="認証処理中..." />;
};