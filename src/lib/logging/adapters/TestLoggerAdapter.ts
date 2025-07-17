// ゼンコネクト テストロガーアダプター
// テスト環境向けのログキャプチャとアサーション

import { ILogger, LogLevel, LogMetadata, LogEntry, LoggerConfig } from '../LoggingPort';
import { maskSecrets } from '../LogMasking';
import { logContextManager } from '../LogContext';

export class TestLoggerAdapter implements ILogger {
  private logs: LogEntry[] = [];
  private enableMasking: boolean;

  constructor(
    private config: LoggerConfig,
    private name: string = 'Test'
  ) {
    this.enableMasking = config.enableMasking;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): LogEntry {
    // コンテキストメタデータをマージ
    const contextMetadata = logContextManager.toLogMetadata();
    const mergedMetadata = { ...contextMetadata, ...metadata };
    
    // マスキング処理
    const finalMetadata = this.enableMasking 
      ? maskSecrets(mergedMetadata) 
      : mergedMetadata;

    return {
      level,
      message,
      timestamp: new Date(),
      metadata: finalMetadata,
      error,
    };
  }

  debug(message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('debug', message, metadata);
    this.logs.push(entry);
  }

  info(message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('info', message, metadata);
    this.logs.push(entry);
  }

  warn(message: string, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('warn', message, metadata);
    this.logs.push(entry);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const entry = this.createLogEntry('error', message, metadata, error);
    this.logs.push(entry);
  }

  // テスト用のメソッド
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByMessage(message: string): LogEntry[] {
    return this.logs.filter(log => log.message.includes(message));
  }

  getLogsByMetadata(key: string, value: any): LogEntry[] {
    return this.logs.filter(log => log.metadata?.[key] === value);
  }

  getLastLog(): LogEntry | null {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : null;
  }

  getLogCount(): number {
    return this.logs.length;
  }

  getLogCountByLevel(level: LogLevel): number {
    return this.logs.filter(log => log.level === level).length;
  }

  hasLogWithMessage(message: string): boolean {
    return this.logs.some(log => log.message.includes(message));
  }

  hasLogWithMetadata(key: string, value: any): boolean {
    return this.logs.some(log => log.metadata?.[key] === value);
  }

  hasLogWithError(error: Error): boolean {
    return this.logs.some(log => log.error === error);
  }

  clear(): void {
    this.logs = [];
  }

  // アサーション用のヘルパーメソッド
  assertLogExists(level: LogLevel, message: string, metadata?: Partial<LogMetadata>): void {
    const matchingLogs = this.logs.filter(log => {
      if (log.level !== level || !log.message.includes(message)) {
        return false;
      }
      
      if (metadata) {
        return Object.entries(metadata).every(([key, value]) => {
          return log.metadata?.[key] === value;
        });
      }
      
      return true;
    });

    if (matchingLogs.length === 0) {
      throw new Error(
        `Expected log not found: level=${level}, message="${message}", metadata=${JSON.stringify(metadata)}`
      );
    }
  }

  assertLogDoesNotExist(level: LogLevel, message: string): void {
    const matchingLogs = this.logs.filter(log => 
      log.level === level && log.message.includes(message)
    );

    if (matchingLogs.length > 0) {
      throw new Error(
        `Unexpected log found: level=${level}, message="${message}"`
      );
    }
  }

  assertLogCount(expectedCount: number): void {
    if (this.logs.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} logs, but got ${this.logs.length}`
      );
    }
  }

  assertLogCountByLevel(level: LogLevel, expectedCount: number): void {
    const actualCount = this.getLogCountByLevel(level);
    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} logs with level ${level}, but got ${actualCount}`
      );
    }
  }

  // 設定情報の取得
  getName(): string {
    return this.name;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // JSON形式でのログ出力（デバッグ用）
  toJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // ログの要約情報
  getSummary(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentLogs: LogEntry[];
  } {
    const byLevel = {
      debug: this.getLogCountByLevel('debug'),
      info: this.getLogCountByLevel('info'),
      warn: this.getLogCountByLevel('warn'),
      error: this.getLogCountByLevel('error'),
    };

    return {
      total: this.logs.length,
      byLevel,
      recentLogs: this.logs.slice(-5), // 最新5件
    };
  }
}