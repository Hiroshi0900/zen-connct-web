import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleDIContainer, DI_KEYS } from './DIContainer';

describe('SimpleDIContainer', () => {
  let container: SimpleDIContainer;

  beforeEach(() => {
    container = new SimpleDIContainer();
  });

  describe('register', () => {
    it('サービスを登録して解決できる', () => {
      // Given
      const mockService = { name: 'test' };
      container.register('test', () => mockService);

      // When
      const resolved = container.resolve('test');

      // Then
      expect(resolved).toBe(mockService);
    });

    it('複数のサービスを登録できる', () => {
      // Given
      const service1 = { name: 'service1' };
      const service2 = { name: 'service2' };
      container.register('service1', () => service1);
      container.register('service2', () => service2);

      // When & Then
      expect(container.resolve('service1')).toBe(service1);
      expect(container.resolve('service2')).toBe(service2);
    });

    it('毎回新しいインスタンスを返す', () => {
      // Given
      container.register('counter', () => ({ count: 0 }));

      // When
      const instance1 = container.resolve<{ count: number }>('counter');
      const instance2 = container.resolve<{ count: number }>('counter');

      // Then
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('registerWithDeps', () => {
    it('依存関係を持つサービスを登録できる', () => {
      // Given
      const dependency = { name: 'dependency' };
      container.register('dependency', () => dependency);
      container.registerWithDeps('service', (container) => ({
        name: 'service',
        dep: container.resolve('dependency')
      }));

      // When
      const resolved = container.resolve<{ name: string; dep: any }>('service');

      // Then
      expect(resolved.name).toBe('service');
      expect(resolved.dep).toBe(dependency);
    });
  });

  describe('registerSingleton', () => {
    it('シングルトンとして登録されたサービスは同じインスタンスを返す', () => {
      // Given
      container.registerSingleton('singleton', () => ({ id: Math.random() }));

      // When
      const instance1 = container.resolve('singleton');
      const instance2 = container.resolve('singleton');

      // Then
      expect(instance1).toBe(instance2);
    });

    it('異なるシングルトンは異なるインスタンス', () => {
      // Given
      container.registerSingleton('singleton1', () => ({ name: 'singleton1' }));
      container.registerSingleton('singleton2', () => ({ name: 'singleton2' }));

      // When
      const instance1 = container.resolve('singleton1');
      const instance2 = container.resolve('singleton2');

      // Then
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('registerSingletonWithDeps', () => {
    it('依存関係を持つシングルトンサービスを登録できる', () => {
      // Given
      const dependency = { name: 'dependency' };
      container.registerSingleton('dependency', () => dependency);
      container.registerSingletonWithDeps('service', (container) => ({
        name: 'service',
        dep: container.resolve('dependency')
      }));

      // When
      const instance1 = container.resolve<{ name: string; dep: any }>('service');
      const instance2 = container.resolve<{ name: string; dep: any }>('service');

      // Then
      expect(instance1).toBe(instance2);
      expect(instance1.dep).toBe(dependency);
    });
  });

  describe('has', () => {
    it('登録済みのキーに対してtrueを返す', () => {
      // Given
      container.register('test', () => ({}));

      // When & Then
      expect(container.has('test')).toBe(true);
    });

    it('未登録のキーに対してfalseを返す', () => {
      // When & Then
      expect(container.has('nonexistent')).toBe(false);
    });
  });

  describe('resolve', () => {
    it('未登録のキーに対してエラーを投げる', () => {
      // When & Then
      expect(() => container.resolve('nonexistent')).toThrow('Dependency not registered: nonexistent');
    });
  });

  describe('clear', () => {
    it('すべての登録をクリアする', () => {
      // Given
      container.register('test', () => ({}));
      expect(container.has('test')).toBe(true);

      // When
      container.clear();

      // Then
      expect(container.has('test')).toBe(false);
    });
  });

  describe('DI_KEYS', () => {
    it('定義済みのキーが存在する', () => {
      // Then
      expect(DI_KEYS.USER_REPOSITORY).toBeDefined();
      expect(DI_KEYS.REGISTER_USER_USE_CASE).toBeDefined();
      expect(DI_KEYS.LOGIN_USER_USE_CASE).toBeDefined();
      expect(DI_KEYS.LOGGER).toBeDefined();
    });

    it('キーはSymbolである', () => {
      // Then
      expect(typeof DI_KEYS.USER_REPOSITORY).toBe('symbol');
      expect(typeof DI_KEYS.LOGGER).toBe('symbol');
    });
  });
});