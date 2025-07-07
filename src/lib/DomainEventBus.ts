// zen-connect ドメインイベントバス
// ドメインレイヤーでのイベント発行と、アプリケーションレイヤーでの購読を管理

type EventHandler<T = any> = (event: T) => void | Promise<void>;

interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly aggregateId?: string;
}

export class DomainEventBus {
  private static instance: DomainEventBus | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  static getInstance(): DomainEventBus {
    if (!this.instance) {
      this.instance = new DomainEventBus();
    }
    return this.instance;
  }

  /**
   * イベントハンドラーを登録
   */
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    
    const eventHandlers = this.handlers.get(eventName)!;
    eventHandlers.push(handler);

    // アンサブスクライブ関数を返す
    return () => {
      const index = eventHandlers.indexOf(handler);
      if (index !== -1) {
        eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * ドメインイベントを発行
   */
  async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || [];
    
    // 全ハンドラーを並行実行
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventName}:`, error);
        // エラーが発生してもイベント処理は継続
      }
    });

    await Promise.all(promises);
  }

  /**
   * 特定のイベントタイプのハンドラーをすべてクリア（主にテスト用）
   */
  clear(eventName?: string): void {
    if (eventName) {
      this.handlers.delete(eventName);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * 登録されているハンドラーの数を取得（主にテスト用）
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.length || 0;
  }
}

// シングルトンのインスタンスをエクスポート
export const domainEventBus = DomainEventBus.getInstance();

// ベースイベント型をエクスポート
export type { DomainEvent, EventHandler };