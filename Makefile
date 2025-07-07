# zen-connect フロントエンド開発用 Makefile

# デフォルトターゲット
.DEFAULT_GOAL := help

# 変数定義
NODE_ENV ?= development
PORT ?= 3000

# ヘルプ表示
help: ## コマンド一覧を表示
	@echo "zen-connect フロントエンド開発コマンド"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# =============================================================================
# 開発用コマンド
# =============================================================================

dev: ## 開発サーバーを起動
	npm run dev

build: ## プロダクションビルドを実行
	npm run build

preview: ## ビルド結果をプレビュー
	npm run start

clean: ## ビルド成果物を削除
	rm -rf .next
	rm -rf dist
	rm -rf storybook-static
	rm -rf coverage
	rm -rf test-results
	rm -rf playwright-report

# =============================================================================
# 依存関係管理
# =============================================================================

install: ## 依存関係をインストール
	npm install

install-test-deps: ## テスト関連の依存関係をインストール
	npm install -D vitest @vitejs/plugin-react @vitest/ui
	npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
	npm install -D msw
	npm install -D @playwright/test
	npm install -D @storybook/react @storybook/nextjs @storybook/addon-interactions

update: ## 依存関係を更新
	npm update

# =============================================================================
# テスト関連コマンド
# =============================================================================

test: ## 全テストを実行（CI用）
	@echo "🧪 全テストを実行中..."
	@make test-unit
	@make test-integration
	@echo "✅ 全テスト完了"

test-unit: ## 単体テストを実行
	@echo "🔬 単体テストを実行中..."
	npx vitest run --reporter=verbose src/**/*.test.{ts,tsx}

test-integration: ## 統合テストを実行
	@echo "🔗 統合テストを実行中..."
	npx vitest run --reporter=verbose src/__tests__/**/*.test.{ts,tsx}

test-e2e: ## E2Eテストを実行
	@echo "🌐 E2Eテストを実行中..."
	npx playwright test

test-e2e-ui: ## E2EテストをUI付きで実行
	npx playwright test --ui

test-watch: ## テストをウォッチモードで実行（TDD用）
	@echo "👀 ウォッチモードでテスト開始（TDD用）"
	npx vitest --watch

test-coverage: ## カバレッジレポートを生成
	@echo "📊 カバレッジレポートを生成中..."
	npx vitest run --coverage
	@echo "📊 カバレッジレポート: coverage/index.html"

test-ui: ## Vitest UIを起動
	npx vitest --ui

update-snapshots: ## スナップショットを更新
	npx vitest run --update-snapshots

# =============================================================================
# 品質チェック
# =============================================================================

lint: ## ESLintを実行
	@echo "🔍 ESLintを実行中..."
	npm run lint

lint-fix: ## ESLintで自動修正
	@echo "🔧 ESLintで自動修正中..."
	npm run lint -- --fix

type-check: ## TypeScriptの型チェック
	@echo "🏷️  TypeScript型チェック中..."
	npx tsc --noEmit

format: ## Prettierでコードフォーマット
	@echo "💄 Prettierでフォーマット中..."
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"

format-check: ## フォーマットチェック
	npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,md}"

quality: ## 品質チェック全実行（lint + type-check + test）
	@echo "🎯 品質チェックを実行中..."
	@make lint
	@make type-check
	@make test
	@echo "✅ 品質チェック完了"

# =============================================================================
# Storybook関連
# =============================================================================

storybook: ## Storybookを起動
	@echo "📚 Storybookを起動中..."
	npm run storybook

storybook-build: ## Storybookをビルド
	@echo "📦 Storybookをビルド中..."
	npm run build-storybook

storybook-test: ## Storybookのテストを実行
	@echo "🧪 Storybookテストを実行中..."
	npm run test-storybook

# =============================================================================
# CI/CD用コマンド
# =============================================================================

ci-setup: ## CI環境のセットアップ
	@echo "🤖 CI環境をセットアップ中..."
	npm ci
	npx playwright install --with-deps

ci: ## CI環境での全チェック
	@echo "🤖 CI環境での全チェックを実行中..."
	@make ci-setup
	@make quality
	@make test-e2e
	@echo "✅ CI全チェック完了"

# =============================================================================
# 開発ツール
# =============================================================================

dev-tools: ## 開発用ツールを起動（並列実行）
	@echo "🛠️  開発ツールを起動中..."
	@echo "- Next.js dev server: http://localhost:3000"
	@echo "- Storybook: http://localhost:6006"
	@echo "- Vitest UI: http://localhost:51204"
	npm run dev & npm run storybook & npx vitest --ui

analyze: ## バンドルサイズを分析
	@echo "📊 バンドルサイズを分析中..."
	npm run build
	npx @next/bundle-analyzer

# =============================================================================
# データベース・API関連（将来用）
# =============================================================================

mock-server: ## MSWモックサーバーを起動
	@echo "🎭 MSWモックサーバーを起動中..."
	# TODO: MSWのブラウザサーバー起動コマンドを追加

# =============================================================================
# デプロイ関連
# =============================================================================

deploy-staging: ## ステージング環境にデプロイ
	@echo "🚀 ステージング環境にデプロイ中..."
	# TODO: デプロイコマンドを追加

deploy-production: ## 本番環境にデプロイ
	@echo "🚀 本番環境にデプロイ中..."
	# TODO: デプロイコマンドを追加

# =============================================================================
# ログ・モニタリング
# =============================================================================

logs: ## 開発サーバーのログを表示
	@echo "📄 開発サーバーのログ..."
	# TODO: ログ表示コマンドを追加

# =============================================================================
# その他のユーティリティ
# =============================================================================

fresh: ## クリーンインストール（node_modules削除→再インストール）
	@echo "🧹 フレッシュインストール中..."
	rm -rf node_modules
	rm -f package-lock.json
	npm install

reset: ## プロジェクトを初期状態にリセット
	@echo "🔄 プロジェクトをリセット中..."
	@make clean
	@make fresh

check-deps: ## 依存関係の脆弱性をチェック
	@echo "🔒 依存関係の脆弱性をチェック中..."
	npm audit

fix-deps: ## 依存関係の脆弱性を修正
	@echo "🔧 依存関係の脆弱性を修正中..."
	npm audit fix

# =============================================================================
# パフォーマンス
# =============================================================================

lighthouse: ## Lighthouseでパフォーマンス測定
	@echo "💡 Lighthouseでパフォーマンス測定中..."
	npx lighthouse http://localhost:3000 --output html --output-path lighthouse-report.html
	@echo "📊 レポート: lighthouse-report.html"

# =============================================================================
# 情報表示
# =============================================================================

info: ## プロジェクト情報を表示
	@echo "📋 zen-connect フロントエンド情報"
	@echo "================================"
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Next.js: $$(npm list next --depth=0 2>/dev/null | grep next || echo 'Not installed')"
	@echo "TypeScript: $$(npm list typescript --depth=0 2>/dev/null | grep typescript || echo 'Not installed')"
	@echo "Tailwind CSS: $$(npm list tailwindcss --depth=0 2>/dev/null | grep tailwindcss || echo 'Not installed')"
	@echo ""
	@echo "📁 プロジェクト構造:"
	@echo "- src/app/          : Next.js App Router"
	@echo "- src/components/   : 共通コンポーネント"
	@echo "- src/hooks/        : カスタムフック"
	@echo "- src/lib/          : ユーティリティ"
	@echo "- src/__tests__/    : 統合テスト"
	@echo "- tests/e2e/        : E2Eテスト"
	@echo ""
	@echo "🔗 URL:"
	@echo "- 開発サーバー: http://localhost:3000"
	@echo "- Storybook: http://localhost:6006"
	@echo "- Vitest UI: http://localhost:51204"

# Makefileの構文チェック
.PHONY: help dev build preview clean install install-test-deps update test test-unit test-integration test-e2e test-e2e-ui test-watch test-coverage test-ui update-snapshots lint lint-fix type-check format format-check quality storybook storybook-build storybook-test ci-setup ci dev-tools analyze mock-server deploy-staging deploy-production logs fresh reset check-deps fix-deps lighthouse info