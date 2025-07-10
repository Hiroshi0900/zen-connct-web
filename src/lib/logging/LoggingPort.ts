// zen-connect ロガー抽象化レイヤー
// Clean Architecture の Port パターンに準拠

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly action?: string;
  readonly component?: string;
  readonly duration?: number;
  readonly [key: string]: any;
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Date;
  readonly metadata?: LogMetadata;
  readonly error?: Error;
}

// ロガーのコアインターフェース（Port）
export interface ILogger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, error?: Error, metadata?: LogMetadata): void;
}

// ロガーファクトリーのインターフェース
export interface ILoggerFactory {
  createLogger(name: string): ILogger;
}

// 設定可能なロガーの拡張インターフェース
export interface IConfigurableLogger extends ILogger {
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  isEnabled(level: LogLevel): boolean;
}

// ロガーの設定
export interface LoggerConfig {
  readonly level: LogLevel;
  readonly enableConsole: boolean;
  readonly enableRemote: boolean;
  readonly enableMasking: boolean;
  readonly remoteEndpoint?: string;
  readonly batchSize?: number;
  readonly batchInterval?: number;
}

// デフォルトの設定
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  enableConsole: true,
  enableRemote: false,
  enableMasking: true,
  batchSize: 10,
  batchInterval: 5000, // 5秒
};

// ログレベルの優先順位
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ログレベルの比較ユーティリティ
export const isLogLevelEnabled = (currentLevel: LogLevel, targetLevel: LogLevel): boolean => {
  return LOG_LEVELS[targetLevel] >= LOG_LEVELS[currentLevel];
};