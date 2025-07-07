import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEventBus, domainEventBus, DomainEvent } from './DomainEventBus';

// テスト用のドメインイベント
interface TestEvent extends DomainEvent {
  eventName: 'testEvent';
  data: string;
}

interface AnotherTestEvent extends DomainEvent {
  eventName: 'anotherTestEvent';
  value: number;
}

describe('DomainEventBus', () => {
  let eventBus: DomainEventBus;

  beforeEach(() => {
    // 各テストで新しいインスタンスを使用
    eventBus = DomainEventBus.getInstance();
    eventBus.clear(); // 全ハンドラーをクリア
  });

  describe('シングルトンパターン', () => {
    it('同じインスタンスを返す', () => {
      const instance1 = DomainEventBus.getInstance();
      const instance2 = DomainEventBus.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('エクスポートされたインスタンスと同じ', () => {
      const instance = DomainEventBus.getInstance();
      
      expect(domainEventBus).toBe(instance);
    });
  });

  describe('イベントの購読と発行', () => {
    it('ハンドラーが正しく呼ばれる', async () => {
      // Given
      const handler = vi.fn();
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      // When
      eventBus.subscribe('testEvent', handler);
      await eventBus.dispatch(testEvent);

      // Then
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    it('複数のハンドラーが登録できる', async () => {
      // Given
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      // When
      eventBus.subscribe('testEvent', handler1);
      eventBus.subscribe('testEvent', handler2);
      await eventBus.dispatch(testEvent);

      // Then
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(eventBus.getHandlerCount('testEvent')).toBe(2);
    });

    it('異なるイベントタイプは独立して処理される', async () => {
      // Given
      const testHandler = vi.fn();
      const anotherHandler = vi.fn();
      
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };
      
      const anotherEvent: AnotherTestEvent = {
        eventName: 'anotherTestEvent',
        occurredAt: new Date(),
        value: 123,
      };

      // When
      eventBus.subscribe('testEvent', testHandler);
      eventBus.subscribe('anotherTestEvent', anotherHandler);
      
      await eventBus.dispatch(testEvent);
      await eventBus.dispatch(anotherEvent);

      // Then
      expect(testHandler).toHaveBeenCalledTimes(1);
      expect(testHandler).toHaveBeenCalledWith(testEvent);
      expect(anotherHandler).toHaveBeenCalledTimes(1);
      expect(anotherHandler).toHaveBeenCalledWith(anotherEvent);
    });

    it('存在しないイベントタイプでもエラーにならない', async () => {
      // Given
      const nonExistentEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      // When & Then
      await expect(eventBus.dispatch(nonExistentEvent)).resolves.not.toThrow();
    });
  });

  describe('アンサブスクライブ', () => {
    it('アンサブスクライブ関数でハンドラーが削除される', async () => {
      // Given
      const handler = vi.fn();
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      const unsubscribe = eventBus.subscribe('testEvent', handler);

      // When
      unsubscribe();
      await eventBus.dispatch(testEvent);

      // Then
      expect(handler).not.toHaveBeenCalled();
      expect(eventBus.getHandlerCount('testEvent')).toBe(0);
    });

    it('複数ハンドラーの一部だけアンサブスクライブできる', async () => {
      // Given
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      const unsubscribe1 = eventBus.subscribe('testEvent', handler1);
      eventBus.subscribe('testEvent', handler2);

      // When
      unsubscribe1();
      await eventBus.dispatch(testEvent);

      // Then
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(eventBus.getHandlerCount('testEvent')).toBe(1);
    });
  });

  describe('エラーハンドリング', () => {
    it('ハンドラーでエラーが発生しても他のハンドラーは実行される', async () => {
      // Given
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'test data',
      };

      // When
      eventBus.subscribe('testEvent', errorHandler);
      eventBus.subscribe('testEvent', successHandler);
      await eventBus.dispatch(testEvent);

      // Then
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(successHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling event testEvent:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('非同期ハンドラー', () => {
    it('非同期ハンドラーが正しく処理される', async () => {
      // Given
      const asyncHandler = vi.fn().mockImplementation(async (event) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed: ${event.data}`;
      });
      
      const testEvent: TestEvent = {
        eventName: 'testEvent',
        occurredAt: new Date(),
        data: 'async test',
      };

      // When
      eventBus.subscribe('testEvent', asyncHandler);
      await eventBus.dispatch(testEvent);

      // Then
      expect(asyncHandler).toHaveBeenCalledWith(testEvent);
    });
  });

  describe('ユーティリティメソッド', () => {
    it('clear()で特定イベントのハンドラーがクリアされる', () => {
      // Given
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe('testEvent', handler1);
      eventBus.subscribe('anotherTestEvent', handler2);

      // When
      eventBus.clear('testEvent');

      // Then
      expect(eventBus.getHandlerCount('testEvent')).toBe(0);
      expect(eventBus.getHandlerCount('anotherTestEvent')).toBe(1);
    });

    it('clear()引数なしで全ハンドラーがクリアされる', () => {
      // Given
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe('testEvent', handler1);
      eventBus.subscribe('anotherTestEvent', handler2);

      // When
      eventBus.clear();

      // Then
      expect(eventBus.getHandlerCount('testEvent')).toBe(0);
      expect(eventBus.getHandlerCount('anotherTestEvent')).toBe(0);
    });
  });
});