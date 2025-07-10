// zen-connect ナビゲーションコンポーネント
// 認証済みユーザー向けのメインナビゲーション

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthUser } from '../../application/auth/AuthTypes';
import { useAuth } from '../../application/auth/AuthContext';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

interface NavigationProps {
  user: AuthUser;
  currentPage?: 'home' | 'profile' | 'community' | 'settings';
}

export const Navigation: React.FC<NavigationProps> = ({ user, currentPage = 'home' }) => {
  const { logout } = useAuth();
  const logger = useLogger('Navigation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoutClick = async () => {
    await withLogContext(
      { 
        component: 'Navigation',
        action: 'handleLogoutClick'
      },
      async () => {
        logger.info('Logout initiated from navigation', { userId: user.id });
        await logout();
      }
    );
  };

  const navItems = [
    { key: 'home', label: 'ホーム', href: '/', icon: '🏠' },
    { key: 'community', label: 'コミュニティ', href: '/community', icon: '👥' },
    { key: 'profile', label: 'プロフィール', href: '/profile', icon: '👤' },
    { key: 'settings', label: '設定', href: '/settings', icon: '⚙️' },
  ];

  return (
    <header className="bg-primary-dark/95 backdrop-blur-sm border-b border-accent-teal/20 sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link href="/" className="text-xl sm:text-2xl font-semibold text-accent-teal hover:text-accent-teal/80 transition-colors">
            zen-connect
          </Link>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === item.key
                    ? 'bg-accent-teal/20 text-accent-teal'
                    : 'text-gray-300 hover:text-accent-teal hover:bg-accent-teal/10'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          {/* ユーザーメニュー */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-gray-300">
              <span className="text-accent-teal font-medium">{user.displayName || user.email}</span>
            </span>
            <button 
              onClick={handleLogoutClick}
              className="border border-accent-teal/60 text-accent-teal px-4 py-2 rounded-lg font-medium hover:bg-accent-teal hover:text-primary-dark transition-all"
            >
              ログアウト
            </button>
          </div>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden text-accent-teal p-2 min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニューを開く"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-600/20">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation ${
                    currentPage === item.key
                      ? 'bg-accent-teal/20 text-accent-teal'
                      : 'text-gray-300 hover:text-accent-teal hover:bg-accent-teal/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              ))}
              <div className="border-t border-gray-600/20 mt-2 pt-4">
                <div className="text-gray-300 px-3 py-2">
                  <span className="text-accent-teal font-medium text-sm">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={handleLogoutClick}
                  className="w-full text-left px-3 py-3 text-gray-300 hover:text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};