// zen-connect ダッシュボードコンポーネント
// 認証済みユーザーのメインダッシュボード

import React from 'react';
import { AuthUser } from '../../application/auth/AuthTypes';
import { useLogger } from '../../../../lib/di/DependencyProvider';

interface DashboardProps {
  user: AuthUser;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: 'teal' | 'coral' | 'sage';
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'teal' | 'coral';
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const logger = useLogger('Dashboard');

  // ダミーデータ - 後でAPIから取得
  const stats: StatCard[] = [
    { title: '今月の瞑想回数', value: 12, icon: '🧘', color: 'teal' },
    { title: '総瞑想時間', value: '240分', icon: '⏰', color: 'coral' },
    { title: '連続記録', value: '7日', icon: '🔥', color: 'sage' },
    { title: 'コミュニティ投稿', value: 5, icon: '📝', color: 'teal' },
  ];

  const quickActions: QuickAction[] = [
    {
      title: '瞑想を記録する',
      description: '今日の瞑想体験を記録しましょう',
      icon: '✏️',
      href: '/meditation/record',
      color: 'teal',
    },
    {
      title: 'コミュニティを見る',
      description: 'みんなの瞑想体験をチェック',
      icon: '👥',
      href: '/community',
      color: 'coral',
    },
  ];

  const recentActivities = [
    { type: 'meditation', content: '朝の瞑想を記録しました', time: '2時間前' },
    { type: 'community', content: 'あきこさんの投稿にいいねしました', time: '5時間前' },
    { type: 'milestone', content: '7日連続瞑想を達成しました！', time: '1日前' },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'teal':
        return 'from-accent-teal to-accent-teal/70';
      case 'coral':
        return 'from-accent-coral to-accent-coral/70';
      case 'sage':
        return 'from-zen-sage to-zen-sage/70';
      default:
        return 'from-accent-teal to-accent-teal/70';
    }
  };

  logger.info('Dashboard rendered for user', { userId: user.id });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
      {/* ウェルカムセクション */}
      <section className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-light mb-2 leading-tight">
          おかえりなさい、{user.displayName || user.email.split('@')[0]}さん
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          今日も素晴らしい一日にしましょう。あなたの瞑想ジャーニーを続けませんか？
        </p>
      </section>

      {/* 統計カード */}
      <section className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-light mb-4 sm:mb-6">今月の統計</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-700/40 p-4 sm:p-6 rounded-xl border border-gray-600/20 hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getColorClasses(stat.color)} rounded-full flex items-center justify-center text-xl sm:text-2xl`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-primary-light">{stat.value}</div>
                </div>
              </div>
              <h3 className="text-gray-400 font-medium text-sm sm:text-base">{stat.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* クイックアクション */}
      <section className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-light mb-4 sm:mb-6">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group bg-gray-700/40 p-6 sm:p-8 rounded-xl border border-gray-600/20 hover:-translate-y-1 hover:border-accent-teal/30 transition-all min-h-[88px]"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${getColorClasses(action.color)} rounded-full flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-primary-light mb-1 sm:mb-2 group-hover:text-accent-teal transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 最近のアクティビティ */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-light mb-4 sm:mb-6">最近のアクティビティ</h2>
        <div className="bg-gray-700/40 rounded-xl border border-gray-600/20">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className={`p-4 sm:p-6 flex items-center gap-3 sm:gap-4 ${
                index !== recentActivities.length - 1 ? 'border-b border-gray-600/10' : ''
              }`}
            >
              <div className="w-10 h-10 bg-accent-teal/20 rounded-full flex items-center justify-center text-lg">
                {activity.type === 'meditation' && '🧘'}
                {activity.type === 'community' && '💙'}
                {activity.type === 'milestone' && '🏆'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary-light text-sm sm:text-base">{activity.content}</p>
              </div>
              <div className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">{activity.time}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};