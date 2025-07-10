import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  LoggerFactory, 
  CompositeLogger, 
  detectEnvironment, 
  getLoggerFactory, 
  createLogger 
} from './LoggerFactory';
import { DEFAULT_LOGGER_CONFIG } from './LoggingPort';
import { ConsoleLoggerAdapter } from './adapters/ConsoleLoggerAdapter';
import { RemoteLoggerAdapter } from './adapters/RemoteLoggerAdapter';
import { TestLoggerAdapter } from './adapters/TestLoggerAdapter';

describe('LoggerFactory', () => {
  let factory: LoggerFactory;

  beforeEach(() => {
    LoggerFactory.resetInstance();
    vi.clearAllMocks();
  });

  describe('シングルトンパターン', () => {
    it('同じインスタンスを返す', () => {
      // When
      const instance1 = LoggerFactory.getInstance();
      const instance2 = LoggerFactory.getInstance();

      // Then
      expect(instance1).toBe(instance2);
    });

    it('resetInstance後は新しいインスタンスを作成する', () => {
      // Given
      const instance1 = LoggerFactory.getInstance();
      
      // When
      LoggerFactory.resetInstance();
      const instance2 = LoggerFactory.getInstance();

      // Then
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('環境別ロガー生成', () => {
    it('development環境でConsoleLoggerAdapterを生成する', () => {
      // Given
      factory = new LoggerFactory('development', DEFAULT_LOGGER_CONFIG);

      // When
      const logger = factory.createLogger('TestLogger');

      // Then
      expect(logger).toBeInstanceOf(ConsoleLoggerAdapter);
    });

    it('test環境でTestLoggerAdapterを生成する', () => {
      // Given
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);

      // When
      const logger = factory.createLogger('TestLogger');

      // Then
      expect(logger).toBeInstanceOf(TestLoggerAdapter);
    });

    it('production環境でCompositeLoggerを生成する', () => {
      // Given
      const productionConfig = {
        ...DEFAULT_LOGGER_CONFIG,
        enableConsole: true,
        enableRemote: true,
        remoteEndpoint: '/api/logs'
      };
      factory = new LoggerFactory('production', productionConfig);

      // When
      const logger = factory.createLogger('TestLogger');

      // Then
      expect(logger).toBeInstanceOf(CompositeLogger);
    });

    it('production環境でremoteのみの場合はRemoteLoggerAdapterを生成する', () => {
      // Given
      const productionConfig = {
        ...DEFAULT_LOGGER_CONFIG,
        enableConsole: false,
        enableRemote: true,
        remoteEndpoint: '/api/logs'
      };
      factory = new LoggerFactory('production', productionConfig);

      // When
      const logger = factory.createLogger('TestLogger');

      // Then
      expect(logger).toBeInstanceOf(RemoteLoggerAdapter);
    });

    it('未知の環境でエラーを投げる', () => {
      // Given
      factory = new LoggerFactory('unknown' as any, DEFAULT_LOGGER_CONFIG);

      // When & Then
      expect(() => {
        factory.createLogger('TestLogger');
      }).toThrow('Unknown environment: unknown');
    });
  });

  describe('ロガーキャッシュ', () => {
    beforeEach(() => {
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);
    });

    it('同じ名前のロガーは同じインスタンスを返す', () => {
      // When
      const logger1 = factory.createLogger('TestLogger');
      const logger2 = factory.createLogger('TestLogger');

      // Then
      expect(logger1).toBe(logger2);
    });

    it('異なる名前のロガーは異なるインスタンスを返す', () => {
      // When
      const logger1 = factory.createLogger('Logger1');
      const logger2 = factory.createLogger('Logger2');

      // Then
      expect(logger1).not.toBe(logger2);
    });

    it('getLoggerで既存のロガーを取得できる', () => {
      // Given
      const logger = factory.createLogger('TestLogger');

      // When
      const retrieved = factory.getLogger('TestLogger');

      // Then
      expect(retrieved).toBe(logger);
    });

    it('存在しないロガーに対してnullを返す', () => {
      // When
      const retrieved = factory.getLogger('NonExistentLogger');

      // Then
      expect(retrieved).toBeNull();
    });
  });

  describe('設定管理', () => {
    it('環境を変更すると既存のロガーがクリアされる', () => {
      // Given
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);
      factory.createLogger('TestLogger');
      expect(factory.getLogger('TestLogger')).not.toBeNull();

      // When
      factory.setEnvironment('development');

      // Then
      expect(factory.getLogger('TestLogger')).toBeNull();
    });

    it('設定を変更すると既存のロガーがクリアされる', () => {
      // Given
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);
      factory.createLogger('TestLogger');
      expect(factory.getLogger('TestLogger')).not.toBeNull();

      // When
      const newConfig = { ...DEFAULT_LOGGER_CONFIG, level: 'debug' as const };
      factory.setConfig(newConfig);

      // Then
      expect(factory.getLogger('TestLogger')).toBeNull();
    });

    it('現在の設定を取得できる', () => {
      // Given
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);

      // When
      const config = factory.getConfig();

      // Then
      expect(config).toEqual(DEFAULT_LOGGER_CONFIG);
      expect(config).not.toBe(DEFAULT_LOGGER_CONFIG); // コピーされていることを確認
    });

    it('現在の環境を取得できる', () => {
      // Given
      factory = new LoggerFactory('development', DEFAULT_LOGGER_CONFIG);

      // When
      const environment = factory.getEnvironment();

      // Then
      expect(environment).toBe('development');
    });
  });

  describe('ロガー管理', () => {
    beforeEach(() => {
      factory = new LoggerFactory('test', DEFAULT_LOGGER_CONFIG);
    });

    it('ロガー名の一覧を取得できる', () => {
      // Given
      factory.createLogger('Logger1');
      factory.createLogger('Logger2');
      factory.createLogger('Logger3');

      // When
      const names = factory.getLoggerNames();

      // Then
      expect(names).toEqual(['Logger1', 'Logger2', 'Logger3']);
    });

    it('ロガーを削除できる', () => {
      // Given
      factory.createLogger('TestLogger');
      expect(factory.getLogger('TestLogger')).not.toBeNull();

      // When
      const removed = factory.removeLogger('TestLogger');

      // Then
      expect(removed).toBe(true);
      expect(factory.getLogger('TestLogger')).toBeNull();
    });

    it('存在しないロガーの削除はfalseを返す', () => {
      // When
      const removed = factory.removeLogger('NonExistentLogger');

      // Then
      expect(removed).toBe(false);
    });

    it('すべてのロガーをクリアできる', () => {
      // Given
      factory.createLogger('Logger1');
      factory.createLogger('Logger2');
      expect(factory.getLoggerNames()).toHaveLength(2);

      // When
      factory.clearLoggers();

      // Then
      expect(factory.getLoggerNames()).toHaveLength(0);
    });
  });

  describe('リソース管理', () => {
    it('flushAllでRemoteLoggerAdapterがフラッシュされる', async () => {
      // Given
      const productionConfig = {
        ...DEFAULT_LOGGER_CONFIG,
        enableRemote: true,
        remoteEndpoint: '/api/logs'
      };
      factory = new LoggerFactory('production', productionConfig);
      
      // RemoteLoggerAdapterのflushメソッドをモック
      const mockFlush = vi.fn().mockResolvedValue(undefined);
      const logger = factory.createLogger('TestLogger') as CompositeLogger;
      const remoteAdapter = logger.getLoggers().find(l => l instanceof RemoteLoggerAdapter) as RemoteLoggerAdapter;
      if (remoteAdapter) {
        remoteAdapter.flush = mockFlush;
      }

      // When
      await factory.flushAll();

      // Then
      expect(mockFlush).toHaveBeenCalled();
    });

    it('destroyでRemoteLoggerAdapterがクリーンアップされる', () => {
      // Given
      const productionConfig = {
        ...DEFAULT_LOGGER_CONFIG,
        enableRemote: true,
        remoteEndpoint: '/api/logs'
      };
      factory = new LoggerFactory('production', productionConfig);
      
      // RemoteLoggerAdapterのdestroyメソッドをモック
      const mockDestroy = vi.fn();
      const logger = factory.createLogger('TestLogger') as CompositeLogger;
      const remoteAdapter = logger.getLoggers().find(l => l instanceof RemoteLoggerAdapter) as RemoteLoggerAdapter;
      if (remoteAdapter) {
        remoteAdapter.destroy = mockDestroy;
      }

      // When
      factory.destroy();

      // Then
      expect(mockDestroy).toHaveBeenCalled();
      expect(factory.getLoggerNames()).toHaveLength(0);
    });
  });
});

describe('CompositeLogger', () => {
  it('複数のロガーに同じメッセージを送信する', () => {
    // Given
    const logger1 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger1');
    const logger2 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger2');
    const composite = new CompositeLogger([logger1, logger2]);

    // When
    composite.info('Test message', { component: 'Test' });

    // Then
    expect(logger1.hasLogWithMessage('Test message')).toBe(true);
    expect(logger2.hasLogWithMessage('Test message')).toBe(true);
    expect(logger1.hasLogWithMetadata('component', 'Test')).toBe(true);
    expect(logger2.hasLogWithMetadata('component', 'Test')).toBe(true);
  });

  it('エラーログを複数のロガーに送信する', () => {
    // Given
    const logger1 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger1');
    const logger2 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger2');
    const composite = new CompositeLogger([logger1, logger2]);
    const error = new Error('Test error');

    // When
    composite.error('Error occurred', error, { component: 'Test' });

    // Then
    expect(logger1.hasLogWithMessage('Error occurred')).toBe(true);
    expect(logger2.hasLogWithMessage('Error occurred')).toBe(true);
    expect(logger1.hasLogWithError(error)).toBe(true);
    expect(logger2.hasLogWithError(error)).toBe(true);
  });

  it('内部ロガーの一覧を取得できる', () => {
    // Given
    const logger1 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger1');
    const logger2 = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'Logger2');
    const composite = new CompositeLogger([logger1, logger2]);

    // When
    const loggers = composite.getLoggers();

    // Then
    expect(loggers).toHaveLength(2);
    expect(loggers[0]).toBe(logger1);
    expect(loggers[1]).toBe(logger2);
  });
});

describe('detectEnvironment', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalVitest = (globalThis as any).vitest;

  beforeEach(() => {
    delete (globalThis as any).vitest;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalVitest) {
      (globalThis as any).vitest = originalVitest;
    } else {
      delete (globalThis as any).vitest;
    }
  });

  it('test環境を正しく判定する（NODE_ENV）', () => {
    // Given
    process.env.NODE_ENV = 'test';

    // When
    const environment = detectEnvironment();

    // Then
    expect(environment).toBe('test');
  });

  it('test環境を正しく判定する（Vitest）', () => {
    // Given
    process.env.NODE_ENV = 'development';
    (globalThis as any).vitest = {};

    // When
    const environment = detectEnvironment();

    // Then
    expect(environment).toBe('test');
  });

  it('production環境を正しく判定する', () => {
    // Given
    process.env.NODE_ENV = 'production';

    // When
    const environment = detectEnvironment();

    // Then
    expect(environment).toBe('production');
  });

  it('デフォルトでdevelopment環境を返す', () => {
    // Given
    process.env.NODE_ENV = 'development';

    // When
    const environment = detectEnvironment();

    // Then
    expect(environment).toBe('development');
  });
});

describe('Helper functions', () => {
  beforeEach(() => {
    LoggerFactory.resetInstance();
  });

  it('getLoggerFactoryが正しいファクトリーを返す', () => {
    // When
    const factory = getLoggerFactory();

    // Then
    expect(factory).toBeInstanceOf(LoggerFactory);
  });

  it('createLoggerが正しいロガーを作成する', () => {
    // When
    const logger = createLogger('TestLogger');

    // Then
    expect(logger).toBeDefined();
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('debug');
  });
});