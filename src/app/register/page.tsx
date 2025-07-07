'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm, RegisterFormData } from '../../features/authentication/ui/components/RegisterForm';
import { RegisterUserUseCase } from '../../features/authentication/application/use-cases/RegisterUserUseCase';
import { InMemoryUserRepository } from '../../features/authentication/infrastructure/repositories/InMemoryUserRepository';

// 実際のアプリでは依存性注入コンテナやProviderで管理
const userRepository = new InMemoryUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepository);

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);
    setError(undefined);
    
    try {
      const result = await registerUseCase.execute(data);
      
      if (result.isSuccess) {
        // 登録成功 - ダッシュボードにリダイレクト
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

  const handleLoginClick = () => {
    router.push('/login');
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

        {/* 新規登録フォーム */}
        <RegisterForm
          onRegister={handleRegister}
          onLoginClick={handleLoginClick}
          loading={loading}
          error={error}
        />

        {/* デモ用案内 */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 text-center mb-2">
            💡 <strong>デモ版</strong>: パスワード要件
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 8文字以上</li>
            <li>• 大文字・小文字を含む</li>
            <li>• 数字を含む</li>
            <li>• 特殊文字を含む (!@#$%^&*など)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}