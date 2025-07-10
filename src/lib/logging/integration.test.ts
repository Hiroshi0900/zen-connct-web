import { describe, it, expect, beforeEach } from 'vitest';
import { 
  LoggerFactory, 
  createLogger, 
  getLoggerFactory, 
  detectEnvironment 
} from './LoggerFactory';
import { TestLoggerAdapter } from './adapters/TestLoggerAdapter';
import { logContextManager } from './LogContext';
import { DEFAULT_LOGGER_CONFIG } from './LoggingPort';

describe('Logging System Integration Tests', () => {
  beforeEach(() => {
    LoggerFactory.resetInstance();
    logContextManager.clear();
  });

  describe('環境検出とロガー生成', () => {
    it('テスト環境でTestLoggerAdapterが作成される', () => {
      // Given
      const environment = detectEnvironment();
      
      // When
      const logger = createLogger('IntegrationTest');
      
      // Then
      expect(environment).toBe('test');
      expect(logger).toBeInstanceOf(TestLoggerAdapter);
    });

    it('同じ名前のロガーは同じインスタンスを返す', () => {
      // When
      const logger1 = createLogger('SameName');
      const logger2 = createLogger('SameName');
      
      // Then
      expect(logger1).toBe(logger2);
    });
  });

  describe('ログコンテキストとマスキングの統合', () => {
    it('グローバルコンテキストがログに含まれる', () => {
      // Given
      const logger = createLogger('ContextTest') as TestLoggerAdapter;
      logContextManager.setGlobalContext({ 
        sessionId: 'session123',
        userId: 'user456' 
      });

      // When
      logger.info('Test message', { action: 'test' });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        sessionId: 'session123',
        userId: 'user456',
        action: 'test',
      }));
    });

    it('機密情報が自動的にマスキングされる', () => {
      // Given
      const logger = createLogger('MaskingTest') as TestLoggerAdapter;
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secretpassword',
        token: 'abc123def456',
        normalField: 'normal value'
      };

      // When
      logger.info('Sensitive data test', sensitiveData);

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        email: 'use***@example.com',
        password: '***',
        token: '***',
        normalField: 'normal value',
      }));
    });

    it('ネストしたコンテキストが正しく処理される', () => {
      // Given
      const logger = createLogger('NestedContextTest') as TestLoggerAdapter;
      logContextManager.setGlobalContext({ sessionId: 'session123' });

      // When
      const popContext = logContextManager.pushContext({ 
        component: 'TestComponent',
        action: 'testAction'
      });
      
      logger.info('Nested context test');
      popContext();

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        sessionId: 'session123',
        component: 'TestComponent',
        action: 'testAction',
      }));
    });
  });

  describe('ログレベルとフィルタリング', () => {
    it('設定されたレベル以下のログは出力されない', () => {
      // Given
      const config = { ...DEFAULT_LOGGER_CONFIG, level: 'warn' as const };
      const factory = new LoggerFactory('test', config);
      const logger = factory.createLogger('LevelTest') as TestLoggerAdapter;

      // When
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe('warn');
      expect(logs[1].level).toBe('error');
    });
  });

  describe('エラーハンドリングの統合', () => {
    it('エラーオブジェクトが正しく処理される', () => {
      // Given
      const logger = createLogger('ErrorTest') as TestLoggerAdapter;
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      // When
      logger.error('Error occurred', error, { 
        component: 'TestComponent',
        action: 'testAction'
      });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].error).toBe(error);
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        component: 'TestComponent',
        action: 'testAction',
      }));
    });
  });

  describe('パフォーマンスとメモリ使用量', () => {
    it('大量のログを効率的に処理する', () => {
      // Given
      const logger = createLogger('PerformanceTest') as TestLoggerAdapter;
      const logCount = 1000;

      // When
      const startTime = Date.now();
      for (let i = 0; i < logCount; i++) {
        logger.info(`Message ${i}`, { index: i });
      }
      const endTime = Date.now();

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(logCount);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内に完了
    });

    it('メモリリークが発生しない', () => {
      // Given
      const logger = createLogger('MemoryTest') as TestLoggerAdapter;
      const initialLogCount = logger.getLogCount();

      // When
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      logger.clear();

      // Then
      expect(logger.getLogCount()).toBe(0);
      expect(logger.getLogCount()).toBe(initialLogCount);
    });
  });

  describe('ファクトリーのライフサイクル', () => {
    it('ファクトリーの破棄とクリーンアップ', () => {
      // Given
      const factory = getLoggerFactory();
      const logger1 = factory.createLogger('Test1');
      const logger2 = factory.createLogger('Test2');

      expect(factory.getLoggerNames()).toHaveLength(2);

      // When
      factory.destroy();

      // Then
      expect(factory.getLoggerNames()).toHaveLength(0);
    });

    it('設定変更時のロガー再生成', () => {
      // Given
      const factory = getLoggerFactory();
      const originalLogger = factory.createLogger('ConfigTest');
      expect(factory.getLoggerNames()).toContain('ConfigTest');

      // When
      const newConfig = { ...DEFAULT_LOGGER_CONFIG, level: 'debug' as const };
      factory.setConfig(newConfig);

      // Then
      expect(factory.getLoggerNames()).toHaveLength(0);
      expect(factory.getConfig()).toEqual(newConfig);
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('認証フローの完全なログ追跡', () => {
      // Given
      const logger = createLogger('AuthFlow') as TestLoggerAdapter;
      logContextManager.setGlobalContext({ sessionId: 'session123' });

      // When: 認証フローをシミュレート
      const popContext = logContextManager.pushContext({ 
        component: 'LoginForm',
        action: 'handleSubmit'
      });
      
      logger.info('Login form submitted', { 
        email: 'user@example.com'
      });
      
      logger.debug('Form validation passed');
      
      logger.info('Calling login use case');
      
      const popUseCaseContext = logContextManager.pushContext({ 
        component: 'LoginUserUseCase',
        action: 'execute'
      });
      
      logger.info('User login started');
      logger.debug('User found in repository');
      logger.info('User login completed successfully', { 
        duration: 250 
      });
      
      popUseCaseContext();
      popContext();

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(6);
      
      // すべてのログにセッションIDが含まれている
      logs.forEach(log => {
        expect(log.metadata?.sessionId).toBe('session123');
      });

      // 各ログが適切なコンテキストを持っている
      expect(logs[0].metadata).toEqual(expect.objectContaining({
        component: 'LoginForm',
        action: 'handleSubmit',
        email: 'use***@example.com', // マスキング確認
      }));
      
      expect(logs[4].metadata).toEqual(expect.objectContaining({
        component: 'LoginUserUseCase',
        action: 'execute',
      }));
    });

    it('エラー発生時の完全なログ追跡', () => {
      // Given
      const logger = createLogger('ErrorFlow') as TestLoggerAdapter;
      logContextManager.setGlobalContext({ sessionId: 'session123' });

      // When: エラーフローをシミュレート
      const popContext = logContextManager.pushContext({ 
        component: 'RegisterForm',
        action: 'handleSubmit'
      });
      
      logger.info('Register form submitted', { 
        email: 'user@example.com'
      });
      
      const error = new Error('Email already exists');
      logger.error('Registration failed', error, { 
        email: 'user@example.com',
        duration: 150 
      });
      
      popContext();

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      
      const errorLog = logs.find(log => log.level === 'error');
      expect(errorLog).toBeDefined();
      expect(errorLog?.error).toBe(error);
      expect(errorLog?.metadata).toEqual(expect.objectContaining({
        component: 'RegisterForm',
        action: 'handleSubmit',
        email: 'use***@example.com',
        duration: 150,
      }));
    });
  });
});