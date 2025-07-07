import { useState } from 'react';
import Button from '../../../../components/Button';

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

  const validateForm = () => {
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
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onRegister({ email, password });
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-primary-dark rounded-2xl border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">
        新規登録
      </h2>

      {error && (
        <div 
          role="alert" 
          className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50"
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
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50"
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
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl 
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-accent-teal focus:border-transparent disabled:opacity-50"
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
          className="w-full"
        >
          新規登録
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-gray-400 text-sm">既にアカウントをお持ちの方</span>
        <button
          type="button"
          onClick={onLoginClick}
          className="ml-2 text-accent-teal hover:text-accent-teal/80 text-sm font-medium"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  );
}