import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { 
  DependencyProvider, 
  useDI, 
  useDependency, 
  useLogger, 
  useRegisterUserUseCase, 
  useLoginUserUseCase, 
  useUserRepository 
} from './DependencyProvider';
import { DI_KEYS } from './DIContainer';

// テスト用のコンポーネント
const TestComponent: React.FC = () => {
  const { container } = useDI();
  const logger = useLogger('TestComponent');
  const registerUseCase = useRegisterUserUseCase();
  const loginUseCase = useLoginUserUseCase();
  const userRepository = useUserRepository();

  return (
    <div>
      <div data-testid="container-exists">{container ? 'exists' : 'not exists'}</div>
      <div data-testid="logger-exists">{logger ? 'exists' : 'not exists'}</div>
      <div data-testid="register-use-case-exists">{registerUseCase ? 'exists' : 'not exists'}</div>
      <div data-testid="login-use-case-exists">{loginUseCase ? 'exists' : 'not exists'}</div>
      <div data-testid="user-repository-exists">{userRepository ? 'exists' : 'not exists'}</div>
    </div>
  );
};

const TestComponentWithDependency: React.FC = () => {
  const userRepository = useDependency(DI_KEYS.USER_REPOSITORY);
  const logger = useDependency(DI_KEYS.LOGGER);

  return (
    <div>
      <div data-testid="dependency-user-repository">{userRepository ? 'exists' : 'not exists'}</div>
      <div data-testid="dependency-logger">{logger ? 'exists' : 'not exists'}</div>
    </div>
  );
};

const TestComponentWithoutProvider: React.FC = () => {
  const { container } = useDI();
  return <div>{container ? 'exists' : 'not exists'}</div>;
};

describe('DependencyProvider', () => {
  describe('プロバイダーの動作', () => {
    it('子コンポーネントにDIコンテキストを提供する', () => {
      // When
      render(
        <DependencyProvider>
          <TestComponent />
        </DependencyProvider>
      );

      // Then
      expect(screen.getByTestId('container-exists')).toHaveTextContent('exists');
      expect(screen.getByTestId('logger-exists')).toHaveTextContent('exists');
      expect(screen.getByTestId('register-use-case-exists')).toHaveTextContent('exists');
      expect(screen.getByTestId('login-use-case-exists')).toHaveTextContent('exists');
      expect(screen.getByTestId('user-repository-exists')).toHaveTextContent('exists');
    });

    it('useDependencyで直接依存性を解決できる', () => {
      // When
      render(
        <DependencyProvider>
          <TestComponentWithDependency />
        </DependencyProvider>
      );

      // Then
      expect(screen.getByTestId('dependency-user-repository')).toHaveTextContent('exists');
      expect(screen.getByTestId('dependency-logger')).toHaveTextContent('exists');
    });

    it('プロバイダーなしでuseDIを使用するとエラーが発生する', () => {
      // スパイを設定してコンソールエラーを抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When & Then
      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useDI must be used within a DependencyProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('依存性の解決', () => {
    it('同じ依存性キーに対して同じインスタンスを返す', () => {
      // Given
      let userRepository1: unknown;
      let userRepository2: unknown;

      const TestComponent1: React.FC = () => {
        userRepository1 = useUserRepository();
        return <div>Test1</div>;
      };

      const TestComponent2: React.FC = () => {
        userRepository2 = useUserRepository();
        return <div>Test2</div>;
      };

      // When
      render(
        <DependencyProvider>
          <TestComponent1 />
          <TestComponent2 />
        </DependencyProvider>
      );

      // Then
      expect(userRepository1).toBe(userRepository2);
    });

    it('異なるロガー名で異なるロガーインスタンスが作成される', () => {
      // Given
      let logger1: unknown;
      let logger2: unknown;

      const TestComponent: React.FC = () => {
        logger1 = useLogger('Logger1');
        logger2 = useLogger('Logger2');
        return <div>Test</div>;
      };

      // When
      render(
        <DependencyProvider>
          <TestComponent />
        </DependencyProvider>
      );

      // Then
      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('ユースケースフック', () => {
    it('RegisterUserUseCaseを正しく提供する', () => {
      // Given
      let registerUseCase: any;

      const TestComponent: React.FC = () => {
        registerUseCase = useRegisterUserUseCase();
        return <div>Test</div>;
      };

      // When
      render(
        <DependencyProvider>
          <TestComponent />
        </DependencyProvider>
      );

      // Then
      expect(registerUseCase).toBeDefined();
      expect(registerUseCase).toHaveProperty('execute');
      expect(typeof registerUseCase.execute).toBe('function');
    });

    it('LoginUserUseCaseを正しく提供する', () => {
      // Given
      let loginUseCase: any;

      const TestComponent: React.FC = () => {
        loginUseCase = useLoginUserUseCase();
        return <div>Test</div>;
      };

      // When
      render(
        <DependencyProvider>
          <TestComponent />
        </DependencyProvider>
      );

      // Then
      expect(loginUseCase).toBeDefined();
      expect(loginUseCase).toHaveProperty('execute');
      expect(typeof loginUseCase.execute).toBe('function');
    });
  });

  describe('メモ化の動作', () => {
    it('プロバイダーの再レンダリングで同じコンテナを返す', () => {
      // Given
      let container1: any;
      let container2: any;

      const TestComponent: React.FC = () => {
        const { container } = useDI();
        if (!container1) {
          container1 = container;
        } else {
          container2 = container;
        }
        return <div>Test</div>;
      };

      const ParentComponent: React.FC<{ rerenderTrigger: number }> = ({ rerenderTrigger }) => {
        return (
          <DependencyProvider>
            <TestComponent />
            <div>{rerenderTrigger}</div>
          </DependencyProvider>
        );
      };

      // When
      const { rerender } = render(<ParentComponent rerenderTrigger={1} />);
      rerender(<ParentComponent rerenderTrigger={2} />);

      // Then
      expect(container1).toBe(container2);
    });
  });
});