// zen-connect ユーザープロフィールコンポーネント
// ユーザーの詳細情報表示・編集

import React, { useState } from 'react';
import { AuthUser } from '../../application/auth/AuthTypes';
import { useLogger } from '../../../../lib/di/DependencyProvider';
import { withLogContext } from '../../../../lib/logging/LogContext';

interface UserProfileProps {
  user: AuthUser;
  onProfileUpdate?: (updatedUser: Partial<AuthUser>) => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onProfileUpdate }) => {
  const logger = useLogger('UserProfile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
  });

  const handleSave = async () => {
    if (!onProfileUpdate) return;

    await withLogContext(
      { 
        component: 'UserProfile',
        action: 'handleSave'
      },
      async () => {
        logger.info('Saving profile changes', { userId: user.id });
        
        try {
          setIsLoading(true);
          await onProfileUpdate(formData);
          setIsEditing(false);
          logger.info('Profile updated successfully', { userId: user.id });
        } catch (error) {
          logger.error('Profile update failed', error as Error);
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="bg-gray-700/40 rounded-2xl border border-gray-600/20 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-accent-teal/20 to-accent-coral/20 p-4 sm:p-6 md:p-8 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-accent-teal to-zen-sage rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold text-primary-dark">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-light mb-2 leading-tight">
            {user.displayName || 'プロフィール未設定'}
          </h1>
          <p className="text-gray-400 text-sm sm:text-base break-all">{user.email}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            <span className="text-xs sm:text-sm text-gray-400">
              {user.emailVerified ? 'メール認証済み' : 'メール未認証'}
            </span>
          </div>
        </div>

        {/* プロフィール情報 */}
        <div className="p-4 sm:p-6 md:p-8">
          {!isEditing ? (
            // 表示モード
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">表示名</label>
                <p className="text-primary-light bg-gray-600/30 px-3 py-3 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base">
                  {user.displayName || '未設定'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">自己紹介</label>
                <p className="text-primary-light bg-gray-600/30 px-3 py-3 sm:px-4 sm:py-3 rounded-lg min-h-[80px] whitespace-pre-wrap text-sm sm:text-base">
                  {user.bio || '自己紹介が設定されていません。'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">登録日</label>
                  <p className="text-primary-light bg-gray-600/30 px-3 py-3 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base">
                    {user.createdAt.toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">最終更新</label>
                  <p className="text-primary-light bg-gray-600/30 px-3 py-3 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base">
                    {user.updatedAt.toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors min-h-[44px] touch-manipulation"
                >
                  プロフィールを編集
                </button>
              </div>
            </div>
          ) : (
            // 編集モード
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-2">
                  表示名
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-gray-600/30 border border-gray-500/30 text-primary-light px-3 py-3 sm:px-4 sm:py-3 rounded-lg focus:border-accent-teal focus:outline-none transition-colors text-base min-h-[44px] touch-manipulation"
                  placeholder="表示名を入力してください"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-2">
                  自己紹介
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-600/30 border border-gray-500/30 text-primary-light px-3 py-3 sm:px-4 sm:py-3 rounded-lg focus:border-accent-teal focus:outline-none transition-colors resize-none text-base touch-manipulation"
                  placeholder="自己紹介を入力してください"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-accent-teal text-primary-dark px-6 py-3 rounded-lg font-medium hover:bg-accent-teal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                >
                  {isLoading ? '保存中...' : '保存する'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="border border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};