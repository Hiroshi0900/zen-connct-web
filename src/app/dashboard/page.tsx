export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-primary-dark text-primary-light">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4 text-accent-teal">
            おかえりなさい！
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            ログインに成功しました
          </p>
          
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">🚧 開発中</h2>
            <p className="text-gray-400 mb-6">
              ダッシュボード機能は今後実装予定です。<br />
              現在は認証機能のデモが完了している状態です。
            </p>
            
            <div className="space-y-4 text-left max-w-md mx-auto">
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ 完了済み</h3>
                <ul className="text-sm text-green-200 space-y-1">
                  <li>• ユーザー認証機能</li>
                  <li>• ログイン・新規登録</li>
                  <li>• DDD アーキテクチャ</li>
                  <li>• 完全なテストカバレッジ</li>
                </ul>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">🔄 次のステップ</h3>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• 瞑想体験記録機能</li>
                  <li>• コミュニティ共有機能</li>
                  <li>• ユーザープロフィール</li>
                  <li>• レスポンシブ対応強化</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}