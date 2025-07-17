// ゼンコネクト Auth0認証システム型定義
// 認証状態の型安全な管理

export interface AuthUser {
  readonly id: string;
  readonly auth0UserId: string;
  readonly email: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly profileImageUrl?: string;
  readonly emailVerified: boolean;
  readonly createdAt: Date;
  readonly verifiedAt?: Date;
  readonly updatedAt: Date;
}

export type AuthState = 
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'error'; error: string };

export interface AuthContextType {
  readonly state: AuthState;
  readonly login: () => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly user: AuthUser | null;
  readonly error: string | null;
}

export interface AuthConfig {
  readonly apiBaseUrl: string;
  readonly loginUrl: string;
  readonly callbackUrl: string;
  readonly logoutUrl: string;
  readonly userInfoUrl: string;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  loginUrl: '/auth/login',
  callbackUrl: '/auth/callback',
  logoutUrl: '/auth/logout',
  userInfoUrl: '/auth/me',
  retryAttempts: 3,
  retryDelay: 1000,
};

export interface AuthError {
  readonly type: 'network' | 'authentication' | 'authorization' | 'server' | 'unknown';
  readonly message: string;
  readonly statusCode?: number;
  readonly originalError?: Error;
}

export const createAuthError = (
  type: AuthError['type'],
  message: string,
  statusCode?: number,
  originalError?: Error
): AuthError => ({
  type,
  message,
  statusCode,
  originalError,
});

// APIレスポンス型
export interface AuthMeResponse {
  readonly id: string;
  readonly auth0_user_id: string;
  readonly email: string;
  readonly display_name?: string;
  readonly bio?: string;
  readonly profile_image_url?: string;
  readonly email_verified: boolean;
  readonly created_at: string;
  readonly verified_at?: string;
  readonly updated_at: string;
}

// レスポンスをドメインオブジェクトに変換
export const mapAuthResponseToUser = (response: AuthMeResponse): AuthUser => ({
  id: response.id,
  auth0UserId: response.auth0_user_id,
  email: response.email,
  displayName: response.display_name,
  bio: response.bio,
  profileImageUrl: response.profile_image_url,
  emailVerified: response.email_verified,
  createdAt: new Date(response.created_at),
  verifiedAt: response.verified_at ? new Date(response.verified_at) : undefined,
  updatedAt: new Date(response.updated_at),
});