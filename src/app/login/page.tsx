'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoginForm, LoginFormData } from '../../features/authentication/ui/components/LoginForm';
import { LoginUserUseCase } from '../../features/authentication/application/use-cases/LoginUserUseCase';
import { InMemoryUserRepository } from '../../features/authentication/infrastructure/repositories/InMemoryUserRepository';

// 実際のアプリでは依存性注入コンテナやProviderで管理
const userRepository = new InMemoryUserRepository();
const loginUseCase = new LoginUserUseCase(userRepository);

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError(undefined);
    
    try {
      const result = await loginUseCase.execute(data);
      
      if (result.isSuccess) {
        // ログイン成功 - ダッシュボードにリダイレクト
        router.push('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ロゴ・戻るリンク */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="text-2xl font-semibold text-accent-teal hover:text-accent-teal/80 transition-colors"
          >
            zen-connect
          </Link>
          <p className="text-gray-400 mt-2">瞑想体験を共有するコミュニティ</p>
        </div>

        {/* ログインフォーム */}
        <LoginForm
          onLogin={handleLogin}
          onRegisterClick={handleRegisterClick}
          loading={loading}
          error={error}
        />

        {/* デモ用案内 */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            💡 <strong>デモ版</strong>: 任意のメールアドレスでアカウントを作成できます
          </p>
        </div>
      </div>
    </div>
  );
}