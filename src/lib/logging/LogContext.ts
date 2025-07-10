// zen-connect ログコンテキスト管理
// リクエストやセッションを通じた統一的なログ情報管理

import { LogMetadata } from './LoggingPort';

// ログコンテキストの型定義
export interface LogContext {
  readonly requestId?: string;
  readonly sessionId?: string;
  readonly userId?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly component?: string;
  readonly action?: string;
  readonly traceId?: string;
  readonly spanId?: string;
}

// ログコンテキストの管理クラス
export class LogContextManager {
  private static instance: LogContextManager | null = null;
  private contextStack: LogContext[] = [];
  private globalContext: LogContext = {};

  private constructor() {}

  static getInstance(): LogContextManager {
    if (!this.instance) {
      this.instance = new LogContextManager();
    }
    return this.instance;
  }

  // グローバルコンテキストの設定
  setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  // グローバルコンテキストの取得
  getGlobalContext(): LogContext {
    return { ...this.globalContext };
  }

  // コンテキストスタックにプッシュ
  pushContext(context: Partial<LogContext>): () => void {
    const newContext = { ...this.getCurrentContext(), ...context };
    this.contextStack.push(newContext);

    // ポップ関数を返す
    return () => {
      this.contextStack.pop();
    };
  }

  // 現在のコンテキストを取得
  getCurrentContext(): LogContext {
    if (this.contextStack.length === 0) {
      return this.globalContext;
    }
    return { ...this.globalContext, ...this.contextStack[this.contextStack.length - 1] };
  }

  // コンテキストをLogMetadataに変換
  toLogMetadata(): LogMetadata {
    const context = this.getCurrentContext();
    return {
      requestId: context.requestId,
      sessionId: context.sessionId,
      userId: context.userId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      component: context.component,
      action: context.action,
      traceId: context.traceId,
      spanId: context.spanId,
    };
  }

  // コンテキストクリア（主にテスト用）
  clear(): void {
    this.contextStack = [];
    this.globalContext = {};
  }

  // リクエストIDの生成
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // セッションIDの生成
  generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // トレースIDの生成
  generateTraceId(): string {
    return `trc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Reactコンテキスト用のフック関数
export const useLogContext = () => {
  const manager = LogContextManager.getInstance();

  const withContext = <T>(context: Partial<LogContext>, fn: () => T): T => {
    const popContext = manager.pushContext(context);
    try {
      return fn();
    } finally {
      popContext();
    }
  };

  const withAsyncContext = async <T>(
    context: Partial<LogContext>,
    fn: () => Promise<T>
  ): Promise<T> => {
    const popContext = manager.pushContext(context);
    try {
      return await fn();
    } finally {
      popContext();
    }
  };

  return {
    setGlobalContext: manager.setGlobalContext.bind(manager),
    getCurrentContext: manager.getCurrentContext.bind(manager),
    pushContext: manager.pushContext.bind(manager),
    withContext,
    withAsyncContext,
    generateRequestId: manager.generateRequestId.bind(manager),
    generateSessionId: manager.generateSessionId.bind(manager),
    generateTraceId: manager.generateTraceId.bind(manager),
  };
};

// シングルトンインスタンスのエクスポート
export const logContextManager = LogContextManager.getInstance();

// ヘルパー関数
export const withLogContext = <T>(
  context: Partial<LogContext>,
  fn: () => T
): T => {
  const manager = LogContextManager.getInstance();
  const popContext = manager.pushContext(context);
  try {
    return fn();
  } finally {
    popContext();
  }
};

export const withAsyncLogContext = async <T>(
  context: Partial<LogContext>,
  fn: () => Promise<T>
): Promise<T> => {
  const manager = LogContextManager.getInstance();
  const popContext = manager.pushContext(context);
  try {
    return await fn();
  } finally {
    popContext();
  }
};