// zen-connect Auth0認証サービス
// Auth0 APIとの通信を担当

import { 
  AuthConfig, 
  AuthError, 
  AuthUser, 
  AuthMeResponse, 
  mapAuthResponseToUser,
  createAuthError 
} from './AuthTypes';
import { ILogger } from '../../../../lib/logging/LoggingPort';
import { withLogContext } from '../../../../lib/logging/LogContext';

export class AuthService {
  constructor(
    private config: AuthConfig,
    private logger: ILogger
  ) {}

  /**
   * ログインURLを取得してリダイレクト
   */
  async login(): Promise<void> {
    return withLogContext(
      { 
        component: 'AuthService',
        action: 'login'
      },
      async () => {
        this.logger.info('Initiating Auth0 login');
        
        try {
          // Auth0 Universal Loginへリダイレクト
          window.location.href = `${this.config.apiBaseUrl}${this.config.loginUrl}`;
        } catch (error) {
          const authError = createAuthError(
            'unknown',
            'Failed to redirect to login',
            undefined,
            error as Error
          );
          
          this.logger.error('Login redirect failed', error as Error);
          throw authError;
        }
      }
    );
  }

  /**
   * ログアウト処理
   */
  async logout(): Promise<void> {
    return withLogContext(
      { 
        component: 'AuthService',
        action: 'logout'
      },
      async () => {
        this.logger.info('Initiating logout');
        
        try {
          // バックエンドのログアウトエンドポイントにリダイレクト
          window.location.href = `${this.config.apiBaseUrl}${this.config.logoutUrl}`;
        } catch (error) {
          const authError = createAuthError(
            'unknown',
            'Failed to redirect to logout',
            undefined,
            error as Error
          );
          
          this.logger.error('Logout redirect failed', error as Error);
          throw authError;
        }
      }
    );
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    return withLogContext(
      { 
        component: 'AuthService',
        action: 'getCurrentUser'
      },
      async () => {
        this.logger.debug('Fetching current user information');
        
        try {
          const response = await this.fetchWithRetry(
            `${this.config.apiBaseUrl}${this.config.userInfoUrl}`,
            {
              method: 'GET',
              credentials: 'include', // Cookieを含める
              headers: {
                'Accept': 'application/json',
                // GETリクエストではContent-Typeは不要（プリフライトリクエストを避けるため）
              },
              mode: 'cors', // 明示的にCORSモードを指定
            }
          );

          if (response.status === 401) {
            this.logger.debug('User not authenticated (401)');
            return null;
          }

          if (response.status === 404) {
            this.logger.debug('User not found (404)');
            return null;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const userData: AuthMeResponse = await response.json();
          const user = mapAuthResponseToUser(userData);
          
          this.logger.info('User information retrieved successfully', {
            userId: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
          });

          return user;
        } catch (error) {
          if (error instanceof Error) {
            const authError = this.mapErrorToAuthError(error);
            this.logger.error('Failed to fetch user information', error);
            throw authError;
          }
          
          const authError = createAuthError(
            'unknown',
            'Unknown error occurred while fetching user information'
          );
          
          this.logger.error('Unknown error fetching user information', authError.originalError);
          throw authError;
        }
      }
    );
  }

  /**
   * リトライ機能付きのfetch
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        this.logger.warn(`Fetch attempt ${attempt} failed, retrying...`, {
          url,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        await this.delay(this.config.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * 遅延ユーティリティ
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * エラーをAuthErrorにマッピング
   */
  private mapErrorToAuthError(error: Error): AuthError {
    if (error.message.includes('Failed to fetch')) {
      return createAuthError(
        'network',
        'Network error occurred. Please check your internet connection.',
        undefined,
        error
      );
    }
    
    if (error.message.includes('401')) {
      return createAuthError(
        'authentication',
        'Authentication required. Please login.',
        401,
        error
      );
    }
    
    if (error.message.includes('403')) {
      return createAuthError(
        'authorization',
        'Access denied. You do not have permission to access this resource.',
        403,
        error
      );
    }
    
    if (error.message.includes('500')) {
      return createAuthError(
        'server',
        'Server error occurred. Please try again later.',
        500,
        error
      );
    }
    
    return createAuthError(
      'unknown',
      error.message || 'An unexpected error occurred.',
      undefined,
      error
    );
  }

  /**
   * Auth0コールバック処理のヘルパー
   */
  async handleCallback(): Promise<AuthUser | null> {
    return withLogContext(
      { 
        component: 'AuthService',
        action: 'handleCallback'
      },
      async () => {
        this.logger.info('Handling Auth0 callback');
        
        // URLパラメータをチェック
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          const authError = createAuthError(
            'authentication',
            errorDescription || `Authentication error: ${error}`
          );
          
          this.logger.error('Auth0 callback error', new Error(errorDescription || error));
          throw authError;
        }
        
        // 認証成功の場合、ユーザー情報を取得
        return this.getCurrentUser();
      }
    );
  }
}