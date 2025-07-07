# zen-connect フロントエンドテスト環境ルール

## 🎯 基本方針
**TDD（Test-Driven Development）を第一とする**
- Red → Green → Refactor のサイクルを厳守
- テストファーストで機能を実装
- リファクタリング時もテストで安全性を担保

## 📚 テストフレームワーク構成

### 採用技術スタック
- **テストランナー**: Vitest（高速・ESMネイティブ）
- **コンポーネントテスト**: @testing-library/react
- **ユーザーインタラクション**: @testing-library/user-event
- **アサーション拡張**: @testing-library/jest-dom
- **APIモック**: MSW (Mock Service Worker) v2
- **E2Eテスト**: Playwright
- **コンポーネントカタログ**: Storybook

### なぜVitestを選択したか
- **速度**: Jestより大幅に高速
- **設定**: ESMネイティブで設定がシンプル
- **Next.js連携**: SWCとの親和性が高い
- **TypeScript**: 型安全性が標準

## 🧪 テスト戦略（5層構造）

### Level 1: 静的解析
- **ツール**: ESLint, Prettier, TypeScript
- **目的**: コーディング規約、潜在バグ検出、型安全性
- **実行タイミング**: 保存時、コミット前、CI

### Level 2: 単体テスト（ユニットテスト）
- **対象**: 純粋関数、カスタムフック、個別コンポーネント
- **配置**: 同じディレクトリに`.test.tsx`
- **カバレッジ目標**: 90%以上
- **実行コマンド**: `make test-unit`

**命名規則:**
```
src/components/Button.tsx
src/components/Button.test.tsx
```

**テストパターン:**
```tsx
describe('Button', () => {
  it('クリック時にイベントが発火する', async () => {
    // Given: 初期条件の設定
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    // When: アクションの実行
    const button = screen.getByRole('button');
    await userEvent.click(button);

    // Then: 結果の検証
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Level 3: 統合テスト
- **対象**: 複数コンポーネントの連携、ページ単位の機能
- **配置**: `src/__tests__/`
- **カバレッジ目標**: 80%以上
- **実行コマンド**: `make test-integration`

**例:**
```tsx
// src/__tests__/ExperienceFlow.test.tsx
describe('体験記録フロー', () => {
  it('体験を投稿して一覧に表示される', async () => {
    // APIモックの設定
    server.use(
      http.post('/api/experiences', () => {
        return HttpResponse.json({ id: '1', content: 'テスト体験' });
      })
    );

    // フロー全体のテスト
    render(<ExperiencePage />);
    // ... テストロジック
  });
});
```

### Level 4: コンポーネントカタログテスト（Storybook）
- **対象**: UIコンポーネントの見た目とインタラクション
- **目的**: デザインシステムの品質保証
- **実行コマンド**: `make storybook-test`

### Level 5: E2Eテスト
- **対象**: ユーザーシナリオの完全なフロー
- **ツール**: Playwright
- **カバレッジ目標**: 主要フロー100%
- **実行コマンド**: `make test-e2e`

**主要なE2Eシナリオ:**
1. ユーザー登録〜ログイン
2. 体験記録の作成〜表示
3. プロフィール編集
4. 体験記録の編集・削除

## 📁 ディレクトリ構造

```
front-app/
├── Makefile                    # 開発コマンド集約
├── vitest.config.ts           # Vitest設定
├── vitest.setup.ts            # テストセットアップ
├── playwright.config.ts       # E2E設定
├── .storybook/               # Storybook設定
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx   # 単体テスト
│   │   └── Button.stories.tsx # Storybook
│   ├── hooks/                # カスタムフック
│   │   ├── useAuth.ts
│   │   └── useAuth.test.ts   # フックテスト
│   ├── lib/                  # ユーティリティ
│   │   ├── utils.ts
│   │   └── utils.test.ts     # 関数テスト
│   ├── __tests__/            # 統合テスト
│   │   ├── ExperienceFlow.test.tsx
│   │   └── AuthFlow.test.tsx
│   ├── mocks/               # MSW設定
│   │   ├── handlers.ts      # APIモック定義
│   │   ├── server.ts        # テスト用サーバー
│   │   └── browser.ts       # ブラウザ用サーバー
│   └── test-utils/          # テストユーティリティ
│       ├── render.tsx       # カスタムrender
│       └── mock-data.ts     # テストデータ
└── tests/
    └── e2e/                 # E2Eテスト
        ├── auth.spec.ts
        └── experience.spec.ts
```

## 🛠️ Makefileコマンド仕様

### 開発用コマンド
```makefile
dev              # 開発サーバー起動
build            # プロダクションビルド
preview          # ビルド結果プレビュー
```

### テスト用コマンド
```makefile
test             # 全テスト実行（CI用）
test-unit        # 単体テストのみ
test-integration # 統合テストのみ
test-e2e         # E2Eテストのみ
test-watch       # ウォッチモード（TDD用）
test-coverage    # カバレッジレポート生成
```

### 品質チェック用コマンド
```makefile
lint             # ESLint実行
lint-fix         # ESLint自動修正
type-check       # TypeScript型チェック
format           # Prettierフォーマット
quality          # lint + type-check + test
```

### Storybook用コマンド
```makefile
storybook        # Storybook起動
storybook-build  # Storybookビルド
storybook-test   # Storybookテスト実行
```

### CI/CD用コマンド
```makefile
ci               # CI環境での全チェック
ci-setup         # CI環境セットアップ
```

### ユーティリティコマンド
```makefile
clean            # ビルド成果物削除
install          # 依存関係インストール
update-snapshots # スナップショット更新
```

## 🎨 テストの書き方ルール

### 1. TDDサイクルの実践
```bash
# 1. Red: 失敗するテストを書く
make test-watch  # ウォッチモードで開始

# 2. Green: テストをパスする最小限のコードを書く

# 3. Refactor: コードを改善（テストは維持）
```

### 2. テストの命名規則
- **describe**: 対象の説明（コンポーネント名・機能名）
- **it/test**: 期待する動作（`〜すべき`, `〜である`, `〜する`）

```tsx
describe('LoginForm', () => {
  it('有効な認証情報でログインできる', () => {});
  it('無効な認証情報でエラーメッセージを表示する', () => {});
  it('送信中は送信ボタンが無効化される', () => {});
});
```

### 3. Given-When-Thenパターン
```tsx
it('送信ボタンクリック時にAPIが呼ばれる', async () => {
  // Given: 初期条件の設定
  const mockSubmit = vi.fn();
  render(<ContactForm onSubmit={mockSubmit} />);

  // When: アクションの実行
  await userEvent.type(screen.getByLabelText('メッセージ'), 'テスト');
  await userEvent.click(screen.getByRole('button', { name: '送信' }));

  // Then: 結果の検証
  expect(mockSubmit).toHaveBeenCalledWith({ message: 'テスト' });
});
```

### 4. APIモックの書き方（MSW）
```tsx
// src/mocks/handlers.ts
export const handlers = [
  http.get('/api/experiences', () => {
    return HttpResponse.json([
      { id: '1', content: 'テスト体験', author: 'テストユーザー' }
    ]);
  }),
  
  http.post('/api/experiences', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ 
      id: '2', 
      ...body,
      createdAt: new Date().toISOString()
    });
  }),
];
```

### 5. サーバーコンポーネントのテスト
```tsx
// RSC（React Server Component）のテスト例
it('ユーザー情報を正しく表示する', async () => {
  // MSWでAPIレスポンスをモック
  server.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({ 
        name: 'テストユーザー', 
        email: 'test@example.com' 
      });
    })
  );

  // RSCは非同期コンポーネントなのでawait
  const ui = await UserProfile({ userId: '1' });
  render(ui);

  expect(screen.getByText('テストユーザー')).toBeInTheDocument();
});
```

## 📊 カバレッジ目標

### 最低基準
- **単体テスト**: 90%以上
- **統合テスト**: 80%以上
- **E2Eテスト**: 主要フロー100%

### カバレッジ除外対象
- `next.config.ts`
- `tailwind.config.ts`
- `.storybook/`設定ファイル
- `src/mocks/`（テスト用ファイル）

## 🚀 CI/CD統合

### GitHub Actions設定例
```yaml
name: Frontend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: make install
      
      - name: Run quality checks
        run: make quality
      
      - name: Run E2E tests
        run: make test-e2e
```

## 📝 zen-connect固有のテスト観点

### 体験記録機能
- 入力フォームのバリデーション
- 公開設定の動作
- タグ機能の選択・表示
- 画像アップロード（該当時）

### 認証機能
- ログイン・ログアウトフロー
- セッション管理
- 権限チェック

### コミュニティ機能（Phase 2）
- フォロー・アンフォロー
- いいね機能
- コメント機能

## 🎓 学習リソース

### 必読ドキュメント
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [MSW Documentation](https://mswjs.io/)
- [Playwright Testing](https://playwright.dev/)

### 推奨記事
- Kent C. Dodds: "Write tests. Not too many. Mostly integration."
- "Testing Implementation Details"
- "Common mistakes with React Testing Library"

---

**作成日**: 2025年1月6日  
**最終更新**: 2025年1月6日  
**ステータス**: 運用開始  
**適用範囲**: zen-connect フロントエンド全体