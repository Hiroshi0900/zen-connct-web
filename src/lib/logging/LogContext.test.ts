import { describe, it, expect, beforeEach } from 'vitest';
import { LogContextManager, withLogContext, withAsyncLogContext } from './LogContext';

describe('LogContextManager', () => {
  let manager: LogContextManager;

  beforeEach(() => {
    manager = LogContextManager.getInstance();
    manager.clear();
  });

  describe('シングルトンパターン', () => {
    it('同じインスタンスを返す', () => {
      // When
      const instance1 = LogContextManager.getInstance();
      const instance2 = LogContextManager.getInstance();

      // Then
      expect(instance1).toBe(instance2);
    });
  });

  describe('グローバルコンテキスト', () => {
    it('グローバルコンテキストを設定・取得できる', () => {
      // Given
      const context = { userId: 'user123', sessionId: 'session456' };

      // When
      manager.setGlobalContext(context);
      const result = manager.getGlobalContext();

      // Then
      expect(result).toEqual(context);
    });

    it('グローバルコンテキストをマージできる', () => {
      // Given
      manager.setGlobalContext({ userId: 'user123' });
      
      // When
      manager.setGlobalContext({ sessionId: 'session456' });
      const result = manager.getGlobalContext();

      // Then
      expect(result).toEqual({
        userId: 'user123',
        sessionId: 'session456',
      });
    });
  });

  describe('コンテキストスタック', () => {
    it('コンテキストをプッシュして取得できる', () => {
      // Given
      const context = { component: 'TestComponent', action: 'test' };

      // When
      const popContext = manager.pushContext(context);
      const result = manager.getCurrentContext();

      // Then
      expect(result).toEqual(context);
      
      // Cleanup
      popContext();
    });

    it('コンテキストをポップできる', () => {
      // Given
      const context = { component: 'TestComponent' };
      const popContext = manager.pushContext(context);

      // When
      popContext();
      const result = manager.getCurrentContext();

      // Then
      expect(result).toEqual({});
    });

    it('ネストしたコンテキストが正しく管理される', () => {
      // Given
      manager.setGlobalContext({ userId: 'user123' });
      
      // When
      const popContext1 = manager.pushContext({ component: 'Component1' });
      const popContext2 = manager.pushContext({ action: 'action1' });
      
      const result = manager.getCurrentContext();

      // Then
      expect(result).toEqual({
        userId: 'user123',
        component: 'Component1',
        action: 'action1',
      });

      // Cleanup
      popContext2();
      popContext1();
    });

    it('内側のコンテキストがポップされても外側は残る', () => {
      // Given
      const popContext1 = manager.pushContext({ component: 'Component1' });
      const popContext2 = manager.pushContext({ action: 'action1' });

      // When
      popContext2();
      const result = manager.getCurrentContext();

      // Then
      expect(result).toEqual({ component: 'Component1' });

      // Cleanup
      popContext1();
    });

    it('グローバルコンテキストとスタックコンテキストがマージされる', () => {
      // Given
      manager.setGlobalContext({ userId: 'user123', sessionId: 'session456' });
      
      // When
      const popContext = manager.pushContext({ component: 'TestComponent', userId: 'user999' });
      const result = manager.getCurrentContext();

      // Then
      expect(result).toEqual({
        userId: 'user999', // スタックコンテキストが優先される
        sessionId: 'session456',
        component: 'TestComponent',
      });

      // Cleanup
      popContext();
    });
  });

  describe('LogMetadata変換', () => {
    it('現在のコンテキストをLogMetadataに変換できる', () => {
      // Given
      const context = {
        requestId: 'req123',
        sessionId: 'ses456',
        userId: 'user789',
        component: 'TestComponent',
        action: 'test',
      };
      const popContext = manager.pushContext(context);

      // When
      const metadata = manager.toLogMetadata();

      // Then
      expect(metadata).toEqual({
        requestId: 'req123',
        sessionId: 'ses456',
        userId: 'user789',
        userAgent: undefined,
        ipAddress: undefined,
        component: 'TestComponent',
        action: 'test',
        traceId: undefined,
        spanId: undefined,
      });

      // Cleanup
      popContext();
    });
  });

  describe('ID生成', () => {
    it('リクエストIDを生成できる', () => {
      // When
      const requestId = manager.generateRequestId();

      // Then
      expect(requestId).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('セッションIDを生成できる', () => {
      // When
      const sessionId = manager.generateSessionId();

      // Then
      expect(sessionId).toMatch(/^ses_\d+_[a-z0-9]{9}$/);
    });

    it('トレースIDを生成できる', () => {
      // When
      const traceId = manager.generateTraceId();

      // Then
      expect(traceId).toMatch(/^trc_\d+_[a-z0-9]{9}$/);
    });

    it('生成されるIDは毎回異なる', () => {
      // When
      const id1 = manager.generateRequestId();
      const id2 = manager.generateRequestId();

      // Then
      expect(id1).not.toBe(id2);
    });
  });

  describe('clear', () => {
    it('すべてのコンテキストをクリアできる', () => {
      // Given
      manager.setGlobalContext({ userId: 'user123' });
      manager.pushContext({ component: 'TestComponent' });

      // When
      manager.clear();

      // Then
      expect(manager.getCurrentContext()).toEqual({});
      expect(manager.getGlobalContext()).toEqual({});
    });
  });
});

describe('withLogContext', () => {
  let manager: LogContextManager;

  beforeEach(() => {
    manager = LogContextManager.getInstance();
    manager.clear();
  });

  it('コンテキストを設定して関数を実行できる', () => {
    // Given
    const context = { component: 'TestComponent', action: 'test' };
    let capturedContext: any;

    // When
    const result = withLogContext(context, () => {
      capturedContext = manager.getCurrentContext();
      return 'test result';
    });

    // Then
    expect(result).toBe('test result');
    expect(capturedContext).toEqual(context);
    expect(manager.getCurrentContext()).toEqual({}); // 実行後はクリア
  });

  it('例外が発生してもコンテキストがクリアされる', () => {
    // Given
    const context = { component: 'TestComponent' };

    // When & Then
    expect(() => {
      withLogContext(context, () => {
        throw new Error('Test error');
      });
    }).toThrow('Test error');

    expect(manager.getCurrentContext()).toEqual({});
  });
});

describe('withAsyncLogContext', () => {
  let manager: LogContextManager;

  beforeEach(() => {
    manager = LogContextManager.getInstance();
    manager.clear();
  });

  it('非同期コンテキストを設定して関数を実行できる', async () => {
    // Given
    const context = { component: 'TestComponent', action: 'async-test' };
    let capturedContext: any;

    // When
    const result = await withAsyncLogContext(context, async () => {
      capturedContext = manager.getCurrentContext();
      return 'async result';
    });

    // Then
    expect(result).toBe('async result');
    expect(capturedContext).toEqual(context);
    expect(manager.getCurrentContext()).toEqual({}); // 実行後はクリア
  });

  it('非同期例外が発生してもコンテキストがクリアされる', async () => {
    // Given
    const context = { component: 'TestComponent' };

    // When & Then
    await expect(async () => {
      await withAsyncLogContext(context, async () => {
        throw new Error('Async error');
      });
    }).rejects.toThrow('Async error');

    expect(manager.getCurrentContext()).toEqual({});
  });
});