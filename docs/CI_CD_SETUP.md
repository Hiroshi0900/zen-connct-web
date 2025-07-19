# Cloudflare Pages CI/CD セットアップガイド

このガイドでは、GitHub ActionsからCloudflare Pagesへの自動デプロイを設定する手順を説明します。

## 必要な情報

### 1. Cloudflare Account ID の取得

```bash
# wranglerコマンドで確認
wrangler whoami
```

または、Cloudflareダッシュボード:
1. https://dash.cloudflare.com にログイン
2. 右上のアカウント名をクリック
3. 「Account ID」をコピー

### 2. Cloudflare API Token の作成

1. https://dash.cloudflare.com/profile/api-tokens にアクセス
2. 「Create Token」をクリック
3. 「Custom token」を選択して「Get started」
4. 以下の設定で作成:
   - **Token name**: `GitHub Actions - zen-connect`
   - **Permissions**:
     - Account > Cloudflare Pages:Edit
     - Zone > Zone:Read（もしカスタムドメインを使う場合）
   - **Account resources**: 
     - Include > Your Account
   - **Zone resources**: 
     - Include > All zones（または特定のゾーン）

5. 「Continue to summary」→「Create Token」
6. **トークンをコピー（この画面を離れると二度と見れません！）**

## GitHub Secrets の設定

GitHubリポジトリで以下を設定:

1. リポジトリの「Settings」タブ
2. 左メニューの「Secrets and variables」→「Actions」
3. 「New repository secret」で以下を追加:

| Secret Name | Value |
|------------|-------|
| `CLOUDFLARE_API_TOKEN` | 上記で作成したAPIトークン |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |

## 動作確認

### 自動デプロイのテスト

```bash
# 変更をコミット
git add .
git commit -m "feat: Add CI/CD workflow for Cloudflare Pages"

# mainブランチにプッシュ
git push origin main
```

### GitHub Actionsの確認

1. GitHubリポジトリの「Actions」タブを確認
2. 「Deploy to Cloudflare Pages」ワークフローが実行されているか確認
3. 緑のチェックマークが表示されれば成功

## デプロイの種類

### Production デプロイ
- **トリガー**: リリースタグ作成時 (例: `v1.0.0`)
- **URL**: https://zen-connect.pages.dev
- **実行方法**: 
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

### Preview デプロイ
- **トリガー1**: mainブランチへのプルリクエスト
- **トリガー2**: 手動実行（GitHub Actions → "Manual Preview Deploy"）
- **URL**: https://[hash].zen-connect.pages.dev
- プルリクエストにコメントでURLが自動投稿される

## リリース手順

### 本番リリース
```bash
# 1. バージョンタグ作成
git tag v1.0.0

# 2. タグをプッシュ（自動で本番デプロイ開始）
git push origin v1.0.0

# 3. GitHub Releasesでリリースノート作成（任意）
```

### 開発用プレビュー
```bash
# 方法1: プルリクエスト作成
git checkout -b feature/new-feature
git push origin feature/new-feature
# → PRでプレビュー自動生成

# 方法2: 手動デプロイ
# GitHub → Actions → "Manual Preview Deploy" → Run workflow
```

## トラブルシューティング

### よくあるエラー

**1. Authentication error**
- API Tokenの権限を確認
- Account IDが正しいか確認

**2. Build failed**
- ローカルで `npm run build && npm run pages:build` が成功するか確認
- Node.jsバージョンを確認（20.x推奨）

**3. Deploy failed**
- Cloudflare Pagesのプロジェクト名が一致しているか確認
- ビルド出力ディレクトリが正しいか確認

## セキュリティのベストプラクティス

- API Tokenは必要最小限の権限のみ付与
- トークンは定期的にローテーション
- 不要になったトークンは速やかに削除

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)