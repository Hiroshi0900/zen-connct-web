import { useState } from 'react';
import Button from '../../../../components/Button';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onLogin: (data: LoginFormData) => void;
  onRegisterClick: () => void;
  loading?: boolean;
  error?: string;
}

export function LoginForm({ 
  onLogin, 
  onRegisterClick, 
  loading = false, 
  error 
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const logger = useLogger('LoginForm');

  // エラー状態の変化をログに記録
  if (error) {
    logger.error('Login form error displayed', new Error(error), {
      email,
      error,
    });
  }

  const validateForm = () => {
    return withLogContext(
      { 
        component: 'LoginForm',
        action: 'validateForm',
        email
      },
      () => {
        const errors: { email?: string; password?: string } = {};

        if (!email.trim()) {
          errors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.email = '有効なメールアドレスを入力してください';
        }

        if (!password.trim()) {
          errors.password = 'パスワードを入力してください';
        }

        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        
        logger.debug('Form validation completed', {
          email,
          isValid,
          errors: Object.keys(errors),
        });

        return isValid;
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    withLogContext(
      { 
        component: 'LoginForm',
        action: 'handleSubmit',
        email
      },
      () => {
        logger.info('Login form submitted', {
          email,
        });
        
        if (validateForm()) {
          logger.info('Login form validation passed, calling onLogin', {
            email,
          });
          onLogin({ email, password });
        } else {
          logger.warn('Login form validation failed', {
            email,
            errors: Object.keys(validationErrors),
          });
        }
      }
    );
  };

  const handleRegisterClick = () => {
    withLogContext(
      { 
        component: 'LoginForm',
        action: 'handleRegisterClick'
      },
      () => {
        logger.info('Register link clicked');
        onRegisterClick();
      }
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 md:p-8 bg-primary-dark rounded-2xl border border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
        ログイン
      </h2>

      {error && (
        <div 
          role="alert" 
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm sm:text-base"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-3 sm:px-4 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50
                     text-base min-h-[44px] touch-manipulation"
            placeholder="example@email.com"
          />
          {validationErrors.email && (
            <p className="mt-2 text-sm text-red-400">
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-3 sm:px-4 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50
                     text-base min-h-[44px] touch-manipulation"
            placeholder="パスワードを入力"
          />
          {validationErrors.password && (
            <p className="mt-2 text-sm text-red-400">
              {validationErrors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          className="w-full min-h-[44px]"
        >
          ログイン
        </Button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <button
          type="button"
          onClick={handleRegisterClick}
          className="text-accent-teal hover:text-accent-teal/80 text-sm font-medium 
                   min-h-[44px] px-4 py-2 touch-manipulation"
        >
          新規登録はこちら
        </button>
      </div>
    </div>
  );
}