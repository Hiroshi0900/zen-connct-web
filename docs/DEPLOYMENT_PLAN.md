# ゼンコネクト フロントエンド本番デプロイ計画書

**作成日**: 2025-07-19  
**対象**: ゼンコネクト フロントエンドアプリケーション  
**デプロイ先**: Cloudflare Pages  

---

## 1. プロジェクト概要

### 目的
- ベータ版リリースに向けた本番環境の構築
- 低コストでの運用環境確立
- 将来的なスケーラビリティの確保

### 背景
- 資金を多く投じられない状況での環境構築が必要
- Cloudflare Pagesによる低コスト・高パフォーマンス運用を目指す
- バックエンドAPI開発と並行してフロントエンド環境を先行構築

---

## 2. ASIS-TOBE分析

### 2.1 現状分析（ASIS）

#### **技術構成**
- **フレームワーク**: Next.js 15.3.5 (App Router)
- **言語**: TypeScript (strict mode)
- **UI**: React 19.0.0 + Tailwind CSS v4
- **アーキテクチャ**: Feature-Sliced Design (FSD) + Domain-Driven Design
- **テスト**: Vitest + Playwright (TDD環境完備)

#### **実装済み機能**
- 認証システム（外部API依存）
- プロフィール機能（画像アップロード含む）
- ログ管理システム
- エラーハンドリング
- モック環境（MSW v2）

#### **現在の制約・課題**
- 本番環境が未構築
- next.config.tsとnext.config.mjsの重複
- Edge Runtime対応状況が不明確
- バックエンドAPI未完成による機能制限
- デプロイフローが未確立

#### **依存関係**
```typescript
// バックエンドAPI依存機能
- 認証: NEXT_PUBLIC_API_URL + OAuth連携
- プロフィール: ユーザー情報CRUD + 画像アップロード
- ログ: リモートログ送信 (/api/logs)
```

### 2.2 目標状態（TOBE）

#### **インフラ構成**
- **プラットフォーム**: Cloudflare Pages
- **デプロイ方式**: Git連携自動デプロイ
- **ランタイム**: Edge Runtime (Node.js非依存)
- **SSL**: 自動SSL証明書
- **CDN**: グローバル配信（200+拠点）

#### **パフォーマンス目標**
- **初期表示**: 2秒以内（LCP）
- **可用性**: 99.9%
- **課金**: 月額$5以下（Cloudflare Pages無料枠活用）

#### **セキュリティ要件**
- 環境変数の暗号化管理（Cloudflare Secrets）
- セキュリティヘッダーの適用
- HTTPS強制

#### **運用体制**
- 自動デプロイ（GitHub push連携）
- 基本監視（Cloudflare Analytics）
- エラー追跡とアラート

### 2.3 ギャップ分析

| **領域** | **現状（ASIS）** | **目標（TOBE）** | **ギャップ** | **優先度** | **対応工数** |
|---------|----------------|-----------------|-------------|------------|-------------|
| **ビルド設定** | 標準Next.jsビルド | Cloudflare対応ビルド | @cloudflare/next-on-pages未導入 | 高 | 0.5日 |
| **設定ファイル** | next.config重複あり | 統一Edge対応設定 | 設定整理とEdge最適化 | 高 | 0.5日 |
| **ランタイム対応** | 不明確 | Edge Runtime完全対応 | 既存コード検証・修正 | 高 | 1-2日 |
| **環境変数** | ローカル管理のみ | Cloudflare Secrets | 本番環境変数未設定 | 高 | 0.5日 |
| **デプロイフロー** | 手動 | Git連携自動化 | CI/CDパイプライン未構築 | 中 | 1日 |
| **監視設定** | なし | 基本監視・エラー追跡 | 監視システム未導入 | 中 | 0.5日 |
| **セキュリティ** | 基本設定 | セキュリティヘッダー強化 | 追加設定が必要 | 中 | 0.5日 |

**総工数見積もり**: 4-6日間

---

## 3. 技術アーキテクチャ

### 3.1 Cloudflare Pages選定理由

#### **コスト面**
- 静的配信: 無制限・無料
- Functions: 月100,000リクエスト無料
- 帯域幅: 無制限・無料
- SSL証明書: 無料自動更新

#### **パフォーマンス面**
- グローバルCDN標準装備
- Edge Runtime（V8 Isolates）による高速起動
- Early Hints対応
- 自動画像最適化

#### **開発体験**
- Git連携自動デプロイ
- プルリクエスト毎のプレビュー環境
- ゼロダウンタイムデプロイ
- 簡単なロールバック

### 3.2 アーキテクチャ図

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ Cloudflare Pages │───▶│  Global CDN     │
│   (Auto Deploy) │    │   (Build & Host) │    │  (Edge Network) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Pages Functions │ 
                       │  (Edge Runtime)  │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Backend API    │
                       │  (External)      │
                       └──────────────────┘
```

### 3.3 技術制約と対応

#### **Edge Runtime制約**
- Node.js APIの一部利用不可（`fs`, `crypto.randomBytes`等）
- 対応策: Web標準API使用、ポリフィル導入

#### **SSR vs SSG戦略**
- 90%以上をSSG（静的生成）でコスト削減
- 認証が必要な部分のみSSR（Server-Side Rendering）
- ISR（Incremental Static Regeneration）は制限あり

---

## 4. 段階的デプロイ戦略

### 4.1 Phase 1: 基盤構築（1-2週間）

#### **目標**
静的ページのデプロイとビルド環境の確立

#### **対象機能**
- ランディングページ
- About/利用規約等の静的ページ
- ビルド・デプロイパイプライン

#### **作業項目**
1. `@cloudflare/next-on-pages`導入
2. wrangler CLI設定
3. next.config統一・最適化
4. GitHub連携設定
5. 初回デプロイテスト

#### **成功基準**
- 静的ページが正常表示される
- Git pushで自動デプロイが動作する
- ビルドが5分以内で完了する

### 4.2 Phase 2: モックAPI版デプロイ（BE待機期間中）

#### **目標**
MSWモックを使用したベータ版環境の構築

#### **対象機能**
- 認証フロー（モック）
- プロフィール機能（モック）
- 基本的なユーザーフロー

#### **作業項目**
1. MSWの本番環境対応
2. モックデータの充実
3. 環境変数設定（モック用）
4. ユーザビリティテスト環境準備

#### **成功基準**
- 全ユーザーフローがモックで動作する
- UIデモとしてステークホルダーに提示可能
- パフォーマンステストが完了している

### 4.3 Phase 3: 本格運用（BE完成後）

#### **目標**
実際のバックエンドAPIとの統合

#### **作業項目**
1. 本番API URL設定
2. 認証フロー統合テスト
3. エラーハンドリング強化
4. 監視・アラート設定
5. 負荷テスト実施

#### **成功基準**
- 全機能が本番APIで正常動作する
- セキュリティ監査をパスする
- 負荷テストをクリアする

---

## 5. 具体的作業タスク

### 5.1 必須パッケージ導入

```bash
# Cloudflare Pages対応
npm install --save-dev @cloudflare/next-on-pages

# Wrangler CLI（グローバル）
npm install -g wrangler
```

### 5.2 設定ファイル作成・修正

#### **1. next.config.mjs 統一**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポート有効化
  trailingSlash: true,
  images: {
    unoptimized: true, // Cloudflare Images使用時は調整
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

#### **2. wrangler.toml 作成**
```toml
name = "zen-connect"
compatibility_date = "2024-07-01"
pages_build_output_dir = ".vercel/output/static"

[env.production.vars]
NEXT_PUBLIC_APP_ENV = "production"

[env.preview.vars]
NEXT_PUBLIC_APP_ENV = "preview"
```

#### **3. .gitignore 追加**
```
# Cloudflare
.vercel/
.wrangler/
```

### 5.3 package.json スクリプト追加

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:dev": "wrangler pages dev .vercel/output/static --port 3000",
    "pages:deploy": "wrangler pages deploy .vercel/output/static",
    "deploy:production": "npm run build && npm run pages:build && npm run pages:deploy",
    "deploy:preview": "npm run build && npm run pages:build && wrangler pages deploy .vercel/output/static --env preview"
  }
}
```

### 5.4 Edge Runtime対応確認

#### **確認対象ファイル**
- `src/features/authentication/application/auth/AuthService.ts`
- `src/features/profile/infrastructure/ProfileImageApiClient.ts`
- `src/lib/logging/adapters/RemoteLoggerAdapter.ts`

#### **確認項目**
- `fetch()` の使用（OK）
- Node.js専用APIの使用有無
- Edge Runtime互換性

### 5.5 環境変数設定

#### **Cloudflare Dashboard設定**
```
NEXT_PUBLIC_API_URL=https://api.zen-connect.com
NEXT_PUBLIC_APP_ENV=production
AUTH_SECRET=<Cloudflare Secretsで設定>
```

#### **ローカル開発用（.dev.vars）**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_ENV=development
```

---

## 6. リスク・制約事項

### 6.1 技術的リスク

| **リスク** | **影響度** | **対策** |
|-----------|-----------|---------|
| Next.js 15のCloudflare Pages互換性 | 中 | 事前検証、必要に応じてNext.js 14ダウングレード |
| Edge Runtime非対応コード | 高 | 事前コード監査、Web標準API移行 |
| バックエンドAPI遅延 | 中 | モック環境での先行開発継続 |
| 予期しない課金 | 低 | 監視設定、アラート設定 |

### 6.2 運用リスク

| **リスク** | **影響度** | **対策** |
|-----------|-----------|---------|
| 障害時の対応体制不備 | 中 | 基本的な監視・アラート設定 |
| セキュリティインシデント | 高 | セキュリティヘッダー設定、定期監査 |
| パフォーマンス劣化 | 中 | 継続的パフォーマンス監視 |

### 6.3 ビジネスリスク

| **リスク** | **影響度** | **対策** |
|-----------|-----------|---------|
| ユーザー体験の不備 | 高 | ベータ版でのユーザーテスト実施 |
| 競合他社の先行リリース | 中 | 段階的リリースでスピード確保 |

---

## 7. 成功指標とモニタリング

### 7.1 技術指標

- **可用性**: 99.9%以上
- **初期表示**: 2秒以内（LCP）
- **ビルド時間**: 5分以内
- **デプロイ頻度**: 週3回以上

### 7.2 ビジネス指標

- **月間コスト**: $5以下
- **ユーザー満足度**: 8/10以上（ベータ版）
- **機能利用率**: 80%以上

### 7.3 監視設定

#### **Cloudflare Analytics**
- リクエスト数・帯域幅監視
- エラー率監視
- パフォーマンス監視

#### **外部監視**
- アップタイム監視（UptimeRobot等）
- 合成監視（Lighthouse CI）

---

## 8. タイムライン

### Week 1-2: Phase 1（基盤構築）
- Day 1-2: パッケージ導入・設定ファイル作成
- Day 3-4: Edge Runtime対応確認・修正
- Day 5-7: Cloudflare Pages設定・初回デプロイ
- Day 8-10: 静的ページデプロイ・動作確認

### Week 3-4: Phase 2（モック版デプロイ）
- Day 11-14: MSW本番対応・モックデータ充実
- Day 15-17: ベータ版デプロイ・ユーザビリティテスト
- Day 18-21: パフォーマンス最適化・セキュリティ強化

### Week 5-6: Phase 3（本格運用準備）
- Day 22-25: バックエンドAPI統合（BE完成後）
- Day 26-28: 統合テスト・負荷テスト
- Day 29-30: 本格運用開始・監視体制確立

---

## 9. 今後の課題

### 9.1 短期課題（1-3ヶ月）
- カスタムドメイン設定
- パフォーマンス最適化（画像最適化等）
- セキュリティ強化（CSP、セキュリティヘッダー）

### 9.2 中長期課題（3-12ヶ月）
- 国際化対応（i18n）
- A/Bテスト環境構築
- より高度な監視・アラート体制

---

## 10. 参考資料

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Edge Runtime Documentation](https://edge-runtime.vercel.app/)
- [ゼンコネクト CLAUDE.md](./CLAUDE.md)

---

**更新履歴**
- 2025-07-19: 初版作成（ASIS-TOBE分析、段階的デプロイ戦略策定）