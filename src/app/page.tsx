'use client';

import { useAuth } from '@/features/authentication/application/auth/AuthContext';
import { useLogger } from '@/lib/di/DependencyProvider';
import { LoadingSpinner } from '@/features/authentication/ui/components/LoadingSpinner';
import { UnauthenticatedHome } from '@/features/authentication/ui/components/UnauthenticatedHome';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function HomeContent() {
  const { isLoading } = useAuth();
  const logger = useLogger('HomePage');
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (authError) {
      logger.error('Authentication error from callback', new Error(authError), {
        error: authError,
        description: errorDescription,
      });
    }
  }, [authError, errorDescription, logger]);

  // ローディング状態
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // エラー状態（重大なエラーのみ表示、認証失敗は除く）
  if (authError) {
    const displayDescription = errorDescription || '認証処理中にエラーが発生しました。';
    
    logger.error('Authentication error from callback', new Error(authError));
    return (
      <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-5">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">認証エラー</h2>
          <p className="text-gray-400 mb-2">{displayDescription}</p>
          {authError === 'auth_failed' && (
            <p className="text-sm text-gray-500 mb-6">Auth0での認証処理に失敗しました。再度お試しください。</p>
          )}
          <button 
            onClick={() => {
              // URLからエラーパラメータを削除して再読み込み
              window.location.href = '/';
            }}
            className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // AuthContextのエラー表示を削除（APIエラーは画面全体に表示しない）
  // 401/404などの認証関連エラーは既にAuthServiceで適切に処理済み

  // 認証状態に関わらずLPページを表示
  logger.info('Rendering landing page');
  return <UnauthenticatedHome />;
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}