// ゼンコネクト プロテクトルートコンポーネント
// 認証が必要なページのアクセス制御

'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../application/auth/AuthContext';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerified?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerified = false,
  fallbackPath = '/'
}) => {
  const { isLoading, isAuthenticated, user, error } = useAuth();
  const router = useRouter();
  const logger = useLogger('ProtectedRoute');

  // ローディング状態
  if (isLoading) {
    return <LoadingSpinner message="認証状態を確認中..." />;
  }

  // エラー状態
  if (error) {
    logger.error('Authentication error in protected route', new Error(error));
    return (
      <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-5">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">認証エラー</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push(fallbackPath)}
            className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 未認証の場合
  if (!isAuthenticated || !user) {
    withLogContext(
      { 
        component: 'ProtectedRoute',
        action: 'redirectUnauthenticated'
      },
      () => {
        logger.info('Redirecting unauthenticated user', { 
          requestedPath: window.location.pathname,
          fallbackPath 
        });
      }
    );

    return (
      <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-5">
          <div className="w-16 h-16 bg-accent-teal/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-accent-teal mb-4">ログインが必要です</h2>
          <p className="text-gray-400 mb-6">このページにアクセスするにはログインしてください。</p>
          <button 
            onClick={() => router.push(fallbackPath)}
            className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors"
          >
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  // メール認証が必要なページで未認証の場合
  if (requireEmailVerified && !user.emailVerified) {
    logger.warn('User accessing email-verified route without verification', { 
      userId: user.id,
      email: user.email 
    });

    return (
      <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-5">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">メール認証が必要です</h2>
          <p className="text-gray-400 mb-6">
            このページにアクセスするには、メールアドレスの認証が必要です。
            受信ボックスを確認して認証を完了してください。
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => router.push('/profile')}
              className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors"
            >
              プロフィールページへ
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="border border-accent-teal text-accent-teal px-6 py-3 rounded-lg font-medium hover:bg-accent-teal hover:text-primary-dark transition-colors"
            >
              再確認
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 認証済みの場合、子コンポーネントをレンダリング
  logger.info('Protected route accessed successfully', { 
    userId: user.id,
    path: window.location.pathname,
    emailVerified: user.emailVerified 
  });

  return <>{children}</>;
};