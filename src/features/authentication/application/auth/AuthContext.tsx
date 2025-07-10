// zen-connect Auth0認証コンテキスト
// 認証状態のグローバル管理

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, AuthUser, AuthConfig, DEFAULT_AUTH_CONFIG } from './AuthTypes';
import { AuthService } from './AuthService';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

// Action types
type AuthAction =
  | { type: 'LOADING' }
  | { type: 'AUTHENTICATED'; user: AuthUser }
  | { type: 'UNAUTHENTICATED'; error?: string }
  | { type: 'ERROR'; error: string };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return { status: 'loading' };
    case 'AUTHENTICATED':
      return { status: 'authenticated', user: action.user };
    case 'UNAUTHENTICATED':
      return { status: 'unauthenticated', error: action.error };
    case 'ERROR':
      return { status: 'error', error: action.error };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
  config?: AuthConfig;
}

// Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  config = DEFAULT_AUTH_CONFIG 
}) => {
  const [state, dispatch] = useReducer(authReducer, { status: 'loading' });
  const logger = useLogger('AuthProvider');
  const authService = new AuthService(config, logger);

  // 初期認証状態の確認
  useEffect(() => {
    const checkAuthStatus = async () => {
      await withLogContext(
        { 
          component: 'AuthProvider',
          action: 'checkAuthStatus'
        },
        async () => {
          logger.info('Checking initial authentication status');
          
          try {
            const user = await authService.getCurrentUser();
            
            if (user) {
              dispatch({ type: 'AUTHENTICATED', user });
              logger.info('User authenticated on initialization', {
                userId: user.id,
                email: user.email,
              });
            } else {
              dispatch({ type: 'UNAUTHENTICATED' });
              logger.info('User not authenticated on initialization');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            dispatch({ type: 'ERROR', error: errorMessage });
            logger.error('Authentication check failed', error as Error);
          }
        }
      );
    };

    checkAuthStatus();
  }, [authService, logger]);

  // ログイン処理
  const login = async (): Promise<void> => {
    await withLogContext(
      { 
        component: 'AuthProvider',
        action: 'login'
      },
      async () => {
        logger.info('Login initiated');
        
        try {
          dispatch({ type: 'LOADING' });
          await authService.login();
          // Auth0リダイレクトのため、この後の処理は実行されない
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          dispatch({ type: 'ERROR', error: errorMessage });
          logger.error('Login failed', error as Error);
        }
      }
    );
  };

  // ログアウト処理
  const logout = async (): Promise<void> => {
    await withLogContext(
      { 
        component: 'AuthProvider',
        action: 'logout'
      },
      async () => {
        logger.info('Logout initiated');
        
        try {
          dispatch({ type: 'LOADING' });
          await authService.logout();
          // ログアウトリダイレクトのため、この後の処理は実行されない
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          dispatch({ type: 'ERROR', error: errorMessage });
          logger.error('Logout failed', error as Error);
        }
      }
    );
  };

  // ユーザー情報の再取得
  const refreshUser = async (): Promise<void> => {
    await withLogContext(
      { 
        component: 'AuthProvider',
        action: 'refreshUser'
      },
      async () => {
        logger.info('Refreshing user information');
        
        try {
          dispatch({ type: 'LOADING' });
          const user = await authService.getCurrentUser();
          
          if (user) {
            dispatch({ type: 'AUTHENTICATED', user });
            logger.info('User information refreshed successfully', {
              userId: user.id,
              email: user.email,
            });
          } else {
            dispatch({ type: 'UNAUTHENTICATED' });
            logger.info('User not authenticated after refresh');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
          dispatch({ type: 'ERROR', error: errorMessage });
          logger.error('User refresh failed', error as Error);
        }
      }
    );
  };

  // Context value
  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    refreshUser,
    isLoading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
    user: state.status === 'authenticated' ? state.user : null,
    error: state.status === 'error' ? state.error : 
           state.status === 'unauthenticated' ? state.error || null : null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth0コールバック処理のフック
export const useAuthCallback = () => {
  const logger = useLogger('useAuthCallback');
  const authService = new AuthService(DEFAULT_AUTH_CONFIG, logger);
  const { refreshUser } = useAuth();

  const handleCallback = async (): Promise<void> => {
    await withLogContext(
      { 
        component: 'useAuthCallback',
        action: 'handleCallback'
      },
      async () => {
        logger.info('Processing Auth0 callback');
        
        try {
          await authService.handleCallback();
          await refreshUser();
          logger.info('Auth0 callback processed successfully');
        } catch (error) {
          logger.error('Auth0 callback processing failed', error as Error);
          throw error;
        }
      }
    );
  };

  return { handleCallback };
};