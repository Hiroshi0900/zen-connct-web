// ゼンコネクト React依存性注入プロバイダー
// Clean Architecture に準拠した依存性の管理

'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { DIContainer, createDIContainer, DI_KEYS } from './DIContainer';
import { InMemoryUserRepository } from '../../features/authentication/infrastructure/repositories/InMemoryUserRepository';
import { RegisterUserUseCase } from '../../features/authentication/application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../features/authentication/application/use-cases/LoginUserUseCase';
import { ILogger } from '../logging/LoggingPort';
import { createLogger } from '../logging/LoggerFactory';
import { logContextManager } from '../logging/LogContext';
import { AuthProvider } from '../../features/authentication/application/auth/AuthContext';

// DIコンテキストの型定義
interface DIContextType {
  container: DIContainer;
  getLogger: (name: string) => ILogger;
}

// DIコンテキストの作成
const DIContext = createContext<DIContextType | null>(null);

// DI設定の関数
const configureDependencies = (container: DIContainer): void => {
  // ロガーの設定
  container.register(DI_KEYS.LOGGER, () => createLogger('Application'));

  // リポジトリの設定
  container.register(DI_KEYS.USER_REPOSITORY, () => {
    const logger = createLogger('UserRepository');
    return new InMemoryUserRepository(logger);
  });

  // ユースケースの設定
  container.registerWithDeps(DI_KEYS.REGISTER_USER_USE_CASE, (container) => {
    const userRepository = container.resolve(DI_KEYS.USER_REPOSITORY);
    const logger = createLogger('RegisterUserUseCase');
    return new RegisterUserUseCase(userRepository, logger);
  });

  container.registerWithDeps(DI_KEYS.LOGIN_USER_USE_CASE, (container) => {
    const userRepository = container.resolve(DI_KEYS.USER_REPOSITORY);
    const logger = createLogger('LoginUserUseCase');
    return new LoginUserUseCase(userRepository, logger);
  });
};

// DependencyProviderのprops
interface DependencyProviderProps {
  children: ReactNode;
}

// DependencyProviderコンポーネント
export const DependencyProvider: React.FC<DependencyProviderProps> = ({ children }) => {
  const contextValue = useMemo(() => {
    const container = createDIContainer();
    configureDependencies(container);

    // セッションIDを設定
    const sessionId = logContextManager.generateSessionId();
    logContextManager.setGlobalContext({ sessionId });

    return {
      container,
      getLogger: (name: string) => createLogger(name),
    };
  }, []);

  return (
    <DIContext.Provider value={contextValue}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </DIContext.Provider>
  );
};

// DIコンテキストを使用するためのカスタムフック
export const useDI = (): DIContextType => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI must be used within a DependencyProvider');
  }
  return context;
};

// 依存性を解決するためのカスタムフック
export const useDependency = <T,>(key: symbol): T => {
  const { container } = useDI();
  return container.resolve<T>(key);
};

// ロガーを取得するためのカスタムフック
export const useLogger = (name: string): ILogger => {
  const { getLogger } = useDI();
  return getLogger(name);
};

// 各ユースケースのためのカスタムフック
export const useRegisterUserUseCase = () => {
  return useDependency<RegisterUserUseCase>(DI_KEYS.REGISTER_USER_USE_CASE);
};

export const useLoginUserUseCase = () => {
  return useDependency<LoginUserUseCase>(DI_KEYS.LOGIN_USER_USE_CASE);
};

export const useUserRepository = () => {
  return useDependency<InMemoryUserRepository>(DI_KEYS.USER_REPOSITORY);
};