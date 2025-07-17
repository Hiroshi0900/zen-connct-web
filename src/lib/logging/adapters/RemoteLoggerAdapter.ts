// ゼンコネクト リモートロガーアダプター
// 本番環境向けのリモートログ送信（バッチ処理）

import { ILogger, LogLevel, LogMetadata, LogEntry, LoggerConfig, isLogLevelEnabled } from '../LoggingPort';
import { maskSecrets } from '../LogMasking';
import { logContextManager } from '../LogContext';

interface RemoteLogEntry extends LogEntry {
  readonly id: string;
  readonly userAgent?: string;
  readonly url?: string;
  readonly referrer?: string;
}

interface BatchLogRequest {
  readonly logs: RemoteLogEntry[];
  readonly batchId: string;
  readonly timestamp: Date;
}

export class RemoteLoggerAdapter implements ILogger {
  private pendingLogs: RemoteLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private currentLevel: LogLevel;
  private enableMasking: boolean;
  private batchSize: number;
  private batchInterval: number;
  private remoteEndpoint: string;

  constructor(
    private config: LoggerConfig,
    private name: string = 'Remote'
  ) {
    this.currentLevel = config.level;
    this.enableMasking = config.enableMasking;
    this.batchSize = config.batchSize || 10;
    this.batchInterval = config.batchInterval || 5000;
    this.remoteEndpoint = config.remoteEndpoint || '/api/logs';
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createRemoteLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): RemoteLogEntry {
    // コンテキストメタデータをマージ
    const contextMetadata = logContextManager.toLogMetadata();
    const mergedMetadata = { ...contextMetadata, ...metadata };
    
    // マスキング処理
    const finalMetadata = this.enableMasking 
      ? maskSecrets(mergedMetadata) 
      : mergedMetadata;

    // ブラウザ情報の取得
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    const url = typeof window !== 'undefined' ? window.location.href : undefined;
    const referrer = typeof document !== 'undefined' ? document.referrer : undefined;

    return {
      id: this.generateLogId(),
      level,
      message,
      timestamp: new Date(),
      metadata: finalMetadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
      userAgent,
      url,
      referrer,
    };
  }

  private async sendBatch(logs: RemoteLogEntry[]): Promise<void> {
    if (logs.length === 0) return;

    const batchRequest: BatchLogRequest = {
      logs,
      batchId: this.generateBatchId(),
      timestamp: new Date(),
    };

    try {
      const response = await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // デバッグ用のローカルログ
      if (this.currentLevel === 'debug') {
        console.debug(`Sent batch ${batchRequest.batchId} with ${logs.length} logs`);
      }

    } catch (error) {
      // 送信エラーの場合、ローカルストレージに保存して後でリトライ
      this.saveToLocalStorage(logs);
      
      // コンソールにエラーを出力（サイレントフェイルを避ける）
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private saveToLocalStorage(logs: RemoteLogEntry[]): void {
    try {
      const key = `zen-connect-logs-${Date.now()}`;
      const data = JSON.stringify(logs);
      localStorage.setItem(key, data);
      
      // 古いログを削除（最大10個まで保持）
      this.cleanupLocalStorage();
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  private cleanupLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('zen-connect-logs-'))
        .sort();
      
      // 10個を超えた場合、古いものから削除
      if (keys.length > 10) {
        const keysToDelete = keys.slice(0, keys.length - 10);
        keysToDelete.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(async () => {
      await this.flushLogs();
    }, this.batchInterval);
  }

  private async flushLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToSend = this.pendingLogs.splice(0);
    await this.sendBatch(logsToSend);
  }

  private async addLogAndMaybeFlush(entry: RemoteLogEntry): Promise<void> {
    this.pendingLogs.push(entry);

    // バッチサイズに達したら即座に送信
    if (this.pendingLogs.length >= this.batchSize) {
      await this.flushLogs();
    } else {
      // そうでなければタイマーをスケジュール
      this.scheduleBatch();
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (!isLogLevelEnabled(this.currentLevel, 'debug')) return;
    
    const entry = this.createRemoteLogEntry('debug', message, metadata);
    this.addLogAndMaybeFlush(entry);
  }

  info(message: string, metadata?: LogMetadata): void {
    if (!isLogLevelEnabled(this.currentLevel, 'info')) return;
    
    const entry = this.createRemoteLogEntry('info', message, metadata);
    this.addLogAndMaybeFlush(entry);
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (!isLogLevelEnabled(this.currentLevel, 'warn')) return;
    
    const entry = this.createRemoteLogEntry('warn', message, metadata);
    this.addLogAndMaybeFlush(entry);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (!isLogLevelEnabled(this.currentLevel, 'error')) return;
    
    const entry = this.createRemoteLogEntry('error', message, metadata, error);
    this.addLogAndMaybeFlush(entry);
  }

  // 強制的にすべてのログを送信
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    await this.flushLogs();
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

  // 状態確認用のメソッド
  getPendingLogCount(): number {
    return this.pendingLogs.length;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  getName(): string {
    return this.name;
  }

  // リソースのクリーンアップ
  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}