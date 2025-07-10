// zen-connect 認証ガードフック
// プログラマティックな認証チェック

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  redirectTo?: string;
  onAuthSuccess?: () => void;
  onAuthFailure?: (error: string) => void;
}

interface AuthGuardResult {
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  canAccess: boolean;
  user: unknown;
  error: string | null;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}): AuthGuardResult => {
  const {
    requireAuth = false,
    requireEmailVerified = false,
    redirectTo = '/',
    onAuthSuccess,
    onAuthFailure
  } = options;

  const { isLoading, isAuthenticated, user, error } = useAuth();
  const router = useRouter();
  const logger = useLogger('useAuthGuard');

  const isEmailVerified = user?.emailVerified ?? false;
  const canAccess = !requireAuth || (isAuthenticated && (!requireEmailVerified || isEmailVerified));

  useEffect(() => {
    if (isLoading) return;

    withLogContext(
      { 
        component: 'useAuthGuard',
        action: 'checkAccess'
      },
      () => {
        // エラー状態の処理
        if (error) {
          logger.error('Auth guard detected error', new Error(error));
          onAuthFailure?.(error);
          return;
        }

        // 認証が必要だが未認証の場合
        if (requireAuth && !isAuthenticated) {
          logger.info('Auth guard: authentication required but user not authenticated', {
            requireAuth,
            requireEmailVerified,
            redirectTo
          });
          onAuthFailure?.('認証が必要です');
          router.push(redirectTo);
          return;
        }

        // メール認証が必要だが未認証の場合
        if (requireEmailVerified && isAuthenticated && !isEmailVerified) {
          logger.warn('Auth guard: email verification required but not verified', {
            userId: user?.id,
            email: user?.email
          });
          onAuthFailure?.('メール認証が必要です');
          router.push('/profile');
          return;
        }

        // アクセス許可の場合
        if (canAccess) {
          logger.info('Auth guard: access granted', {
            userId: user?.id,
            requireAuth,
            requireEmailVerified,
            isAuthenticated,
            isEmailVerified
          });
          onAuthSuccess?.();
        }
      }
    );
  }, [
    isLoading,
    isAuthenticated,
    isEmailVerified,
    error,
    requireAuth,
    requireEmailVerified,
    redirectTo,
    router,
    onAuthSuccess,
    onAuthFailure,
    canAccess,
    user?.id,
    user?.email,
    logger
  ]);

  return {
    isLoading,
    isAuthenticated,
    isEmailVerified,
    canAccess,
    user,
    error
  };
};

// 特定の権限チェック用のヘルパーフック
export const useRequireAuth = (redirectTo?: string) => {
  return useAuthGuard({
    requireAuth: true,
    redirectTo
  });
};

export const useRequireEmailVerified = (redirectTo?: string) => {
  return useAuthGuard({
    requireAuth: true,
    requireEmailVerified: true,
    redirectTo
  });
};

// ロール/権限ベースのガード（将来の拡張用）
export const useRoleGuard = (requiredRoles: string[], redirectTo?: string) => {
  const authResult = useAuthGuard({ requireAuth: true, redirectTo });
  const logger = useLogger('useRoleGuard');

  // 現在はロール機能未実装のため、認証済みユーザーのみ許可
  // 将来的にはユーザーのロール情報をチェック
  const hasRequiredRole = authResult.isAuthenticated; // TODO: 実際のロールチェック

  useEffect(() => {
    if (!authResult.isLoading && authResult.isAuthenticated && !hasRequiredRole) {
      logger.warn('Role guard: insufficient permissions', {
        userId: authResult.user?.id,
        requiredRoles
      });
    }
  }, [authResult.isLoading, authResult.isAuthenticated, hasRequiredRole, authResult.user?.id, requiredRoles, logger]);

  return {
    ...authResult,
    hasRequiredRole,
    canAccess: authResult.canAccess && hasRequiredRole
  };
};