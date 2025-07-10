// zen-connect 認証済みホームページコンポーネント
// 認証済みユーザー向けのメインダッシュボード

import React from 'react';
import { AuthUser } from '../../application/auth/AuthTypes';
import { useAuth } from '../../application/auth/AuthContext';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

interface AuthenticatedHomeProps {
  user: AuthUser;
}

export const AuthenticatedHome: React.FC<AuthenticatedHomeProps> = ({ user }) => {
  const { logout } = useAuth();
  const logger = useLogger('AuthenticatedHome');

  const handleLogoutClick = async () => {
    await withLogContext(
      { 
        component: 'AuthenticatedHome',
        action: 'handleLogoutClick'
      },
      async () => {
        logger.info('Logout button clicked', { userId: user.id });
        await logout();
      }
    );
  };

  return (
    <div className="min-h-screen bg-primary-dark text-primary-light">
      {/* ヘッダー */}
      <header className="bg-primary-dark/95 backdrop-blur-sm border-b border-accent-teal/20 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="text-2xl font-semibold text-accent-teal">
            zen-connect
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-300">
              おかえりなさい、<span className="text-accent-teal font-medium">{user.name}</span>
            </span>
            <button 
              onClick={handleLogoutClick}
              className="border border-accent-teal/60 text-accent-teal px-4 py-2 rounded-lg font-medium hover:bg-accent-teal hover:text-primary-dark transition-all"
            >
              ログアウト
            </button>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* ウェルカムセクション */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-accent-teal/10 via-accent-coral/8 to-accent-teal/10 rounded-2xl p-8 border border-accent-teal/20">
            <h1 className="text-3xl font-bold mb-3">
              今日も瞑想を始めましょう
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              あなたの瞑想ジャーニーを記録し、コミュニティと共有しませんか？
            </p>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-accent-teal text-primary-dark px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-accent-teal/30 hover:-translate-y-0.5 transition-all">
                瞑想を記録する
              </button>
              <button className="border-2 border-accent-coral text-accent-coral px-6 py-3 rounded-xl font-medium hover:bg-accent-coral hover:text-primary-dark hover:-translate-y-0.5 transition-all">
                みんなの投稿を見る
              </button>
            </div>
          </div>
        </section>

        {/* 統計情報 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">あなたの瞑想統計</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20 text-center">
              <div className="text-3xl font-bold text-accent-teal mb-2">12</div>
              <div className="text-gray-400">今月の瞑想回数</div>
            </div>
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20 text-center">
              <div className="text-3xl font-bold text-accent-teal mb-2">240</div>
              <div className="text-gray-400">総瞑想時間（分）</div>
            </div>
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20 text-center">
              <div className="text-3xl font-bold text-accent-teal mb-2">7</div>
              <div className="text-gray-400">連続記録（日）</div>
            </div>
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20 text-center">
              <div className="text-3xl font-bold text-accent-teal mb-2">85%</div>
              <div className="text-gray-400">目標達成率</div>
            </div>
          </div>
        </section>

        {/* 最近の投稿 */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">最近の瞑想記録</h2>
            <button className="text-accent-teal hover:text-accent-teal/80 font-medium">
              すべて見る →
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">マインドフルネス</span>
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">朝活</span>
                </div>
                <span className="text-gray-400 text-sm">今日</span>
              </div>
              <p className="text-gray-200 leading-relaxed mb-4">
                今朝の瞑想で新しい気づきがありました。雑念に気づいたとき、それを拒絶するのではなく、優しく手放すことの大切さを実感。
              </p>
              <div className="text-gray-400 text-sm">
                📍 自宅のベランダ | ⏰ 06:00-06:20
              </div>
            </div>
            
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">ヴィパッサナー</span>
                  <span className="bg-accent-teal/20 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">夜</span>
                </div>
                <span className="text-gray-400 text-sm">昨日</span>
              </div>
              <p className="text-gray-200 leading-relaxed mb-4">
                30分間の座禅。呼吸に集中しながら、今この瞬間への感謝の気持ちが自然と湧き上がってきました。
              </p>
              <div className="text-gray-400 text-sm">
                📍 和室 | ⏰ 21:00-21:30
              </div>
            </div>
          </div>
        </section>

        {/* コミュニティフィード */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">コミュニティの最新投稿</h2>
            <button className="text-accent-teal hover:text-accent-teal/80 font-medium">
              コミュニティページへ →
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                  A
                </div>
                <div>
                  <div className="font-medium">あきこ</div>
                  <div className="text-gray-400 text-sm">2時間前</div>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                初めての歩行瞑想に挑戦しました。一歩一歩を意識することで、普段見過ごしていた小さな美しさに気づけました。
              </p>
            </div>

            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                  T
                </div>
                <div>
                  <div className="font-medium">たかし</div>
                  <div className="text-gray-400 text-sm">4時間前</div>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                瞑想を始めて3ヶ月。集中力の向上を実感しています。継続することの大切さを改めて感じました。
              </p>
            </div>

            <div className="bg-gray-700/40 p-6 rounded-xl border border-gray-600/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center font-semibold text-primary-dark">
                  M
                </div>
                <div>
                  <div className="font-medium">みほ</div>
                  <div className="text-gray-400 text-sm">6時間前</div>
                </div>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed">
                今日は瞑想会に参加。皆さんと一緒に座ることで、いつもより深い静寂を体験できました。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};