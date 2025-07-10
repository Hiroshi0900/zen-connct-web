import { useState } from 'react';
import Button from '../../../../components/Button';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

export interface RegisterFormData {
  email: string;
  password: string;
}

export interface RegisterFormProps {
  onRegister: (data: RegisterFormData) => void;
  onLoginClick: () => void;
  loading?: boolean;
  error?: string;
}

export function RegisterForm({ 
  onRegister, 
  onLoginClick, 
  loading = false, 
  error 
}: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const logger = useLogger('RegisterForm');

  // エラー状態の変化をログに記録
  if (error) {
    logger.error('Register form error displayed', new Error(error), {
      email,
      error,
    });
  }

  const validateForm = () => {
    return withLogContext(
      { 
        component: 'RegisterForm',
        action: 'validateForm',
        email
      },
      () => {
        const errors: { email?: string; password?: string; confirmPassword?: string } = {};

        if (!email.trim()) {
          errors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.email = '有効なメールアドレスを入力してください';
        }

        if (!password.trim()) {
          errors.password = 'パスワードを入力してください';
        } else if (password.length < 8) {
          errors.password = 'パスワードは8文字以上で入力してください';
        }

        if (!confirmPassword.trim()) {
          errors.confirmPassword = 'パスワード（確認）を入力してください';
        } else if (password !== confirmPassword) {
          errors.confirmPassword = 'パスワードが一致しません';
        }

        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        
        logger.debug('Form validation completed', {
          email,
          isValid,
          errors: Object.keys(errors),
          passwordLength: password.length,
          passwordsMatch: password === confirmPassword,
        });

        return isValid;
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    withLogContext(
      { 
        component: 'RegisterForm',
        action: 'handleSubmit',
        email
      },
      () => {
        logger.info('Register form submitted', {
          email,
        });
        
        if (validateForm()) {
          logger.info('Register form validation passed, calling onRegister', {
            email,
          });
          onRegister({ email, password });
        } else {
          logger.warn('Register form validation failed', {
            email,
            errors: Object.keys(validationErrors),
          });
        }
      }
    );
  };

  const handleLoginClick = () => {
    withLogContext(
      { 
        component: 'RegisterForm',
        action: 'handleLoginClick'
      },
      () => {
        logger.info('Login link clicked');
        onLoginClick();
      }
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 md:p-8 bg-primary-dark rounded-2xl border border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
        新規登録
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
            placeholder="8文字以上のパスワード"
          />
          {validationErrors.password && (
            <p className="mt-2 text-sm text-red-400">
              {validationErrors.password}
            </p>
          )}
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            パスワード（確認）
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-3 sm:px-4 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50
                     text-base min-h-[44px] touch-manipulation"
            placeholder="パスワードを再入力"
          />
          {validationErrors.confirmPassword && (
            <p className="mt-2 text-sm text-red-400">
              {validationErrors.confirmPassword}
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
          新規登録
        </Button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <span className="text-gray-400 text-sm block sm:inline">既にアカウントをお持ちの方</span>
        <button
          type="button"
          onClick={handleLoginClick}
          className="ml-0 sm:ml-2 mt-2 sm:mt-0 text-accent-teal hover:text-accent-teal/80 text-sm font-medium 
                   min-h-[44px] px-4 py-2 touch-manipulation"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  );
}