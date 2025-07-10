// zen-connect コンソールロガーアダプター
// 開発環境向けの美しいコンソール出力

import { ILogger, LogLevel, LogMetadata, isLogLevelEnabled, LoggerConfig } from '../LoggingPort';
import { maskSecrets } from '../LogMasking';
import { logContextManager } from '../LogContext';

// カラー定義
const COLORS = {
  debug: '#6B7280', // グレー
  info: '#3B82F6',  // ブルー
  warn: '#F59E0B',  // アンバー
  error: '#EF4444', // レッド
  timestamp: '#9CA3AF',
  component: '#10B981',
  action: '#8B5CF6',
  metadata: '#6B7280',
} as const;

// コンソールスタイル
const STYLES = {
  debug: `color: ${COLORS.debug}; font-weight: normal;`,
  info: `color: ${COLORS.info}; font-weight: normal;`,
  warn: `color: ${COLORS.warn}; font-weight: bold;`,
  error: `color: ${COLORS.error}; font-weight: bold;`,
  timestamp: `color: ${COLORS.timestamp}; font-size: 0.85em;`,
  component: `color: ${COLORS.component}; font-weight: bold;`,
  action: `color: ${COLORS.action}; font-style: italic;`,
  metadata: `color: ${COLORS.metadata}; font-size: 0.9em;`,
  reset: 'color: inherit; font-weight: normal; font-style: normal;',
} as const;

// レベル別のアイコン
const ICONS = {
  debug: '🔍',
  info: '💡',
  warn: '⚠️',
  error: '❌',
} as const;

export class ConsoleLoggerAdapter implements ILogger {
  private currentLevel: LogLevel;
  private enableMasking: boolean;

  constructor(
    private config: LoggerConfig,
    private name: string = 'Console'
  ) {
    this.currentLevel = config.level;
    this.enableMasking = config.enableMasking;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = this.formatTimestamp();
    const icon = ICONS[level];
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let formatted = `[${timestamp}] ${icon} ${levelUpper}`;
    
    // コンポーネント情報
    if (metadata?.component) {
      formatted += ` [${metadata.component}]`;
    }
    
    // アクション情報
    if (metadata?.action) {
      formatted += ` {${metadata.action}}`;
    }
    
    formatted += ` ${message}`;
    
    return formatted;
  }

  private logWithStyle(level: LogLevel, message: string, metadata?: LogMetadata, error?: Error): void {
    if (!isLogLevelEnabled(this.currentLevel, level)) {
      return;
    }

    // コンテキストメタデータをマージ
    const contextMetadata = logContextManager.toLogMetadata();
    const mergedMetadata = { ...contextMetadata, ...metadata };
    
    // メッセージをフォーマット
    const formattedMessage = this.formatMessage(level, message, mergedMetadata);
    
    // マスキング処理
    const maskedMetadata = this.enableMasking 
      ? maskSecrets(mergedMetadata) 
      : mergedMetadata;

    // コンソール出力
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : console.log;

    // スタイル付きでログ出力
    consoleMethod(
      `%c${formattedMessage}`,
      STYLES[level],
      maskedMetadata
    );

    // エラーオブジェクトがある場合は別途出力
    if (error && level === 'error') {
      console.error('%cError Details:', STYLES.error, error);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.logWithStyle('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logWithStyle('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.logWithStyle('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.logWithStyle('error', message, metadata, error);
  }

  // 設定可能なメソッド
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  isEnabled(level: LogLevel): boolean {
    return isLogLevelEnabled(this.currentLevel, level);
  }

  // テスト用のヘルパー
  getName(): string {
    return this.name;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}