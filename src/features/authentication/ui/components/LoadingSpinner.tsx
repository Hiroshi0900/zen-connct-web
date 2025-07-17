// ゼンコネクト ローディングスピナーコンポーネント
// 認証処理中などに表示するローディング表示

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '読み込み中...',
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6 sm:w-8 sm:h-8',
    medium: 'w-12 h-12 sm:w-16 sm:h-16',
    large: 'w-18 h-18 sm:w-24 sm:h-24'
  };

  return (
    <div className="min-h-screen bg-primary-dark text-primary-light flex items-center justify-center px-4">
      <div className="text-center">
        <div 
          className={`${sizeClasses[size]} border-4 border-accent-teal/20 border-t-accent-teal rounded-full animate-spin mx-auto mb-4 sm:mb-6`}
          role="status"
          aria-label="Loading"
        />
        <p className="text-lg sm:text-xl text-gray-400 font-light">{message}</p>
      </div>
    </div>
  );
};