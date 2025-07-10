// zen-connect ロガーファクトリー
// 環境に応じたロガーの生成と管理

import { ILogger, ILoggerFactory, LoggerConfig, DEFAULT_LOGGER_CONFIG } from './LoggingPort';
import { ConsoleLoggerAdapter } from './adapters/ConsoleLoggerAdapter';
import { RemoteLoggerAdapter } from './adapters/RemoteLoggerAdapter';
import { TestLoggerAdapter } from './adapters/TestLoggerAdapter';

export type LoggerEnvironment = 'development' | 'production' | 'test';

// 複数のアダプターを組み合わせるコンポジットロガー
export class CompositeLogger implements ILogger {
  constructor(private loggers: ILogger[]) {}

  debug(message: string, metadata?: any): void {
    this.loggers.forEach(logger => logger.debug(message, metadata));
  }

  info(message: string, metadata?: any): void {
    this.loggers.forEach(logger => logger.info(message, metadata));
  }

  warn(message: string, metadata?: any): void {
    this.loggers.forEach(logger => logger.warn(message, metadata));
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.loggers.forEach(logger => logger.error(message, error, metadata));
  }

  getLoggers(): ILogger[] {
    return [...this.loggers];
  }
}

export class LoggerFactory implements ILoggerFactory {
  private static instance: LoggerFactory | null = null;
  private loggers: Map<string, ILogger> = new Map();

  constructor(
    private environment: LoggerEnvironment,
    private config: LoggerConfig = DEFAULT_LOGGER_CONFIG
  ) {}

  static getInstance(
    environment: LoggerEnvironment = 'development',
    config: LoggerConfig = DEFAULT_LOGGER_CONFIG
  ): LoggerFactory {
    if (!this.instance) {
      this.instance = new LoggerFactory(environment, config);
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }

  createLogger(name: string): ILogger {
    // 既に作成済みのロガーがあれば返す
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }

    const logger = this.createLoggerByEnvironment(name);
    this.loggers.set(name, logger);
    return logger;
  }

  private createLoggerByEnvironment(name: string): ILogger {
    const adapters: ILogger[] = [];

    switch (this.environment) {
      case 'development':
        // 開発環境：美しいコンソール出力
        adapters.push(new ConsoleLoggerAdapter(this.config, name));
        break;

      case 'production':
        // 本番環境：リモート送信 + 最小限のコンソール出力
        adapters.push(new RemoteLoggerAdapter(this.config, name));
        
        // エラーレベルのみコンソールにも出力
        if (this.config.enableConsole) {
          const consoleConfig = { ...this.config, level: 'error' as const };
          adapters.push(new ConsoleLoggerAdapter(consoleConfig, name));
        }
        break;

      case 'test':
        // テスト環境：テスト用アダプター
        adapters.push(new TestLoggerAdapter(this.config, name));
        break;

      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }

    return adapters.length === 1 ? adapters[0] : new CompositeLogger(adapters);
  }

  // 環境の変更（主にテスト用）
  setEnvironment(environment: LoggerEnvironment): void {
    this.environment = environment;
    this.loggers.clear(); // 既存のロガーをクリア
  }

  // 設定の変更（主にテスト用）
  setConfig(config: LoggerConfig): void {
    this.config = config;
    this.loggers.clear(); // 既存のロガーをクリア
  }

  // 作成済みのロガーの取得
  getLogger(name: string): ILogger | null {
    return this.loggers.get(name) || null;
  }

  // 作成済みのロガー一覧
  getLoggerNames(): string[] {
    return Array.from(this.loggers.keys());
  }

  // ロガーの削除
  removeLogger(name: string): boolean {
    return this.loggers.delete(name);
  }

  // すべてのロガーをクリア
  clearLoggers(): void {
    this.loggers.clear();
  }

  // 現在の設定を取得
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // 現在の環境を取得
  getEnvironment(): LoggerEnvironment {
    return this.environment;
  }

  // リモートロガーの強制フラッシュ（終了時用）
  async flushAll(): Promise<void> {
    const flushPromises: Promise<void>[] = [];

    for (const logger of this.loggers.values()) {
      if (logger instanceof CompositeLogger) {
        for (const adapter of logger.getLoggers()) {
          if (adapter instanceof RemoteLoggerAdapter) {
            flushPromises.push(adapter.flush());
          }
        }
      } else if (logger instanceof RemoteLoggerAdapter) {
        flushPromises.push(logger.flush());
      }
    }

    await Promise.all(flushPromises);
  }

  // リソースのクリーンアップ
  destroy(): void {
    for (const logger of this.loggers.values()) {
      if (logger instanceof CompositeLogger) {
        for (const adapter of logger.getLoggers()) {
          if (adapter instanceof RemoteLoggerAdapter) {
            adapter.destroy();
          }
        }
      } else if (logger instanceof RemoteLoggerAdapter) {
        logger.destroy();
      }
    }
    this.loggers.clear();
  }
}

// 環境判定のヘルパー関数
export const detectEnvironment = (): LoggerEnvironment => {
  // テスト環境の判定
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return 'test';
  }

  // Vitest環境の判定
  if (typeof globalThis !== 'undefined' && 'vitest' in globalThis) {
    return 'test';
  }

  // 本番環境の判定
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'production';
  }

  // デフォルトは開発環境
  return 'development';
};

// グローバルファクトリーインスタンスの取得
export const getLoggerFactory = (): LoggerFactory => {
  const environment = detectEnvironment();
  return LoggerFactory.getInstance(environment);
};

// 便利なヘルパー関数
export const createLogger = (name: string): ILogger => {
  const factory = getLoggerFactory();
  return factory.createLogger(name);
};