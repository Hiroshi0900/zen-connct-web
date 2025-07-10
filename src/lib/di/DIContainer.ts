// zen-connect DIコンテナ
// Clean Architecture に準拠した軽量依存性注入コンテナ
// 関数型プログラミングアプローチを採用

type DependencyKey = string | symbol;
type Factory<T> = () => T;
type FactoryWithDeps<T> = (container: DIContainer) => T;

export interface DIContainer {
  register<T>(key: DependencyKey, factory: Factory<T>): void;
  registerWithDeps<T>(key: DependencyKey, factory: FactoryWithDeps<T>): void;
  registerSingleton<T>(key: DependencyKey, factory: Factory<T>): void;
  registerSingletonWithDeps<T>(key: DependencyKey, factory: FactoryWithDeps<T>): void;
  resolve<T>(key: DependencyKey): T;
  has(key: DependencyKey): boolean;
  clear(): void;
}

interface Registration {
  factory: Factory<unknown> | FactoryWithDeps<unknown>;
  isSingleton: boolean;
  hasDependencies: boolean;
  instance?: unknown;
}

export class SimpleDIContainer implements DIContainer {
  private registrations = new Map<DependencyKey, Registration>();

  register<T>(key: DependencyKey, factory: Factory<T>): void {
    this.registrations.set(key, {
      factory,
      isSingleton: false,
      hasDependencies: false
    });
  }

  registerWithDeps<T>(key: DependencyKey, factory: FactoryWithDeps<T>): void {
    this.registrations.set(key, {
      factory,
      isSingleton: false,
      hasDependencies: true
    });
  }

  registerSingleton<T>(key: DependencyKey, factory: Factory<T>): void {
    this.registrations.set(key, {
      factory,
      isSingleton: true,
      hasDependencies: false
    });
  }

  registerSingletonWithDeps<T>(key: DependencyKey, factory: FactoryWithDeps<T>): void {
    this.registrations.set(key, {
      factory,
      isSingleton: true,
      hasDependencies: true
    });
  }

  resolve<T>(key: DependencyKey): T {
    const registration = this.registrations.get(key);
    if (!registration) {
      throw new Error(`Dependency not registered: ${String(key)}`);
    }

    // シングルトンの場合、既存のインスタンスを返す
    if (registration.isSingleton && registration.instance) {
      return registration.instance;
    }

    // ファクトリーを実行してインスタンスを作成
    const instance = registration.hasDependencies
      ? (registration.factory as FactoryWithDeps<T>)(this)
      : (registration.factory as Factory<T>)();

    // シングルトンの場合、インスタンスを保存
    if (registration.isSingleton) {
      registration.instance = instance;
    }

    return instance;
  }

  has(key: DependencyKey): boolean {
    return this.registrations.has(key);
  }

  clear(): void {
    this.registrations.clear();
  }
}

// 依存性キーを管理するSymbol定数
export const DI_KEYS = {
  // インフラストラクチャ
  USER_REPOSITORY: Symbol('UserRepository'),
  
  // ユースケース
  REGISTER_USER_USE_CASE: Symbol('RegisterUserUseCase'),
  LOGIN_USER_USE_CASE: Symbol('LoginUserUseCase'),
  
  // ロガー（これから実装）
  LOGGER: Symbol('Logger'),
  
  // 将来的に追加される可能性のあるキー
  HTTP_CLIENT: Symbol('HttpClient'),
  EVENT_BUS: Symbol('EventBus'),
} as const;

// DIコンテナのファクトリー関数
export const createDIContainer = (): DIContainer => {
  return new SimpleDIContainer();
};