# zen-connect ロガーシステム

## 概要

zen-connectアプリケーション向けのエンタープライズグレードロガーシステムです。Clean Architecture の Port/Adapter パターンに基づいて設計されており、開発・テスト・本番環境で異なるロガーアダプターを使用できます。

## 特徴

- **環境別アダプター**: 開発（Console）、テスト（TestLogger）、本番（Remote）
- **自動機密情報マスキング**: パスワード、トークン、メールアドレスなどを自動でマスク
- **構造化ログ**: JSON形式の構造化ログによる効率的な分析
- **コンテキスト管理**: リクエストやセッションを通じた統一的なログ追跡
- **エラートラッキング**: 詳細なエラー情報とスタックトレースの記録
- **パフォーマンス監視**: 処理時間の自動測定と記録
- **依存性注入**: Clean Architecture に準拠したDI統合

## 基本的な使用方法

### 1. ロガーの取得

```typescript
import { useLogger } from '@/lib/di/DependencyProvider';

const MyComponent = () => {
  const logger = useLogger('MyComponent');
  
  // ログの出力
  logger.info('Component mounted');
  logger.debug('Debug information', { userId: 'user123' });
  logger.warn('Warning message', { action: 'validation' });
  logger.error('Error occurred', error, { context: 'api_call' });
};
```

### 2. UseCase での使用

```typescript
import { ILogger } from '@/lib/logging/LoggingPort';
import { withLogContext } from '@/lib/logging/LogContext';

export class MyUseCase {
  constructor(
    private repository: MyRepository,
    private logger: ILogger
  ) {}

  async execute(command: MyCommand): Promise<MyResult> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'MyUseCase',
        action: 'execute',
        userId: command.userId
      },
      async () => {
        this.logger.info('Use case execution started', {
          userId: command.userId,
        });

        try {
          const result = await this.repository.findById(command.id);
          
          const duration = Date.now() - startTime;
          this.logger.info('Use case execution completed', {
            userId: command.userId,
            duration,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(
            'Use case execution failed',
            error instanceof Error ? error : new Error('Unknown error'),
            {
              userId: command.userId,
              duration,
            }
          );
          throw error;
        }
      }
    );
  }
}
```

### 3. Repository での使用

```typescript
import { ILogger } from '@/lib/logging/LoggingPort';
import { withLogContext } from '@/lib/logging/LogContext';

export class MyRepository {
  constructor(private logger: ILogger) {}

  async findById(id: string): Promise<MyEntity | null> {
    return withLogContext(
      { 
        component: 'MyRepository',
        action: 'findById',
        entityId: id
      },
      async () => {
        this.logger.debug('Finding entity by ID', { entityId: id });
        
        // データベース操作
        const entity = await this.database.findById(id);
        
        if (entity) {
          this.logger.debug('Entity found', { entityId: id });
        } else {
          this.logger.debug('Entity not found', { entityId: id });
        }

        return entity;
      }
    );
  }
}
```

## 環境別設定

### 開発環境

```typescript
// 美しいコンソール出力とカラー表示
const logger = createLogger('MyLogger');
logger.info('User logged in', { userId: 'user123' });

// 出力例:
// [2023-12-01T10:30:45.123Z] 💡 INFO  [MyLogger] {login} User logged in { userId: 'user123' }
```

### テスト環境

```typescript
// テスト用のロガー（アサーション機能付き）
const logger = createLogger('TestLogger') as TestLoggerAdapter;

logger.info('Test message', { component: 'TestComponent' });

// テスト検証
expect(logger.hasLogWithMessage('Test message')).toBe(true);
expect(logger.hasLogWithMetadata('component', 'TestComponent')).toBe(true);
logger.assertLogExists('info', 'Test message');
```

### 本番環境

```typescript
// リモートエンドポイントへの自動送信
const config = {
  level: 'info',
  enableRemote: true,
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  batchInterval: 5000,
};

// バッチ処理で効率的にログを送信
// エラー発生時はローカルストレージに保存してリトライ
```

## 機密情報マスキング

```typescript
const logger = createLogger('SecurityExample');

// 機密情報が自動的にマスクされる
logger.info('User authentication', {
  email: 'user@example.com',      // → 'use***@example.com'
  password: 'secret123',          // → '***'
  token: 'abc123def456',          // → '***'
  authHeader: 'Bearer xyz789',    // → '***'
  normalField: 'normal value',    // → 'normal value'
});
```

## コンテキスト管理

```typescript
import { logContextManager } from '@/lib/logging/LogContext';

// グローバルコンテキストの設定
logContextManager.setGlobalContext({
  sessionId: 'session123',
  userId: 'user456',
});

// ローカルコンテキストのプッシュ
const popContext = logContextManager.pushContext({
  component: 'OrderService',
  action: 'processOrder',
});

logger.info('Processing order'); // sessionId, userId, component, action が自動的に含まれる

popContext(); // コンテキストを復元
```

## エラーハンドリング

```typescript
import { useErrorHandler } from '@/lib/error/ErrorBoundary';

const MyComponent = () => {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleClick = async () => {
    try {
      await handleAsyncError(
        async () => {
          // 非同期処理
          await someAsyncOperation();
        },
        { component: 'MyComponent', action: 'handleClick' }
      );
    } catch (error) {
      // エラーは自動的にログに記録される
      console.error('Operation failed:', error);
    }
  };
};
```

## パフォーマンス監視

```typescript
const startTime = Date.now();

// ... 処理 ...

const duration = Date.now() - startTime;
logger.info('Operation completed', {
  operation: 'user_registration',
  duration,
  performanceLevel: duration < 500 ? 'good' : 'slow',
});
```

## テストでの使用

```typescript
import { TestLoggerAdapter } from '@/lib/logging/adapters/TestLoggerAdapter';

describe('MyComponent', () => {
  let logger: TestLoggerAdapter;

  beforeEach(() => {
    logger = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG);
  });

  it('should log user interaction', () => {
    // Given
    const component = new MyComponent(logger);

    // When
    component.handleUserClick();

    // Then
    logger.assertLogExists('info', 'User clicked button');
    logger.assertLogCountByLevel('info', 1);
    expect(logger.hasLogWithMetadata('action', 'click')).toBe(true);
  });
});
```

## 設定オプション

```typescript
interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  enableMasking: boolean;
  remoteEndpoint?: string;
  batchSize?: number;
  batchInterval?: number;
}

const customConfig: LoggerConfig = {
  level: 'info',
  enableConsole: true,
  enableRemote: true,
  enableMasking: true,
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  batchInterval: 5000,
};
```

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   UseCase       │  │   Repository    │  │   Component     │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │        │
└───────────┼─────────────────────┼─────────────────────┼────────┘
            │                     │                     │
        ┌───▼─────────────────────▼─────────────────────▼───┐
        │              LoggingPort (Interface)              │
        └───────────────────────┬───────────────────────────┘
                                │
        ┌───────────────────────▼───────────────────────────┐
        │              LoggerFactory                        │
        └───┬───────────────────┬───────────────────────┬───┘
            │                   │                       │
    ┌───────▼───────┐  ┌────────▼────────┐  ┌───────────▼──────────┐
    │ ConsoleLogger │  │  TestLogger     │  │  RemoteLogger        │
    │ (Development) │  │  (Testing)      │  │  (Production)        │
    └───────────────┘  └─────────────────┘  └──────────────────────┘
```

## ベストプラクティス

1. **構造化ログ**: 常にメタデータを含めてログを記録
2. **コンテキスト活用**: withLogContext を使用して関連情報を自動追加
3. **適切なレベル**: debug < info < warn < error の順で重要度を設定
4. **エラー詳細**: エラーオブジェクトを必ず含める
5. **パフォーマンス監視**: 重要な処理の実行時間を記録
6. **機密情報保護**: 自動マスキングに頼らず、必要に応じて手動でマスク

このロガーシステムにより、zen-connectアプリケーションの監視・デバッグ・運用が大幅に向上します。