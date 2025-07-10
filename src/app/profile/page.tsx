// zen-connect プロフィールページ
// ユーザープロフィール表示・編集ページ（認証必須）

'use client';

import { ProtectedRoute } from '@/features/authentication/ui/components/ProtectedRoute';
import { Navigation } from '@/features/authentication/ui/components/Navigation';
import { UserProfile } from '@/features/authentication/ui/components/UserProfile';
import { useAuth } from '@/features/authentication/application/auth/AuthContext';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const { user } = useAuth();

  if (!user) return null; // ProtectedRouteで保護されているため実際には到達しない

  return (
    <div className="min-h-screen bg-primary-dark text-primary-light">
      <Navigation user={user} currentPage="profile" />
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="text-3xl font-bold mb-8">プロフィール</h1>
          <UserProfile 
            user={user}
            onProfileUpdate={async (updatedData) => {
              // TODO: プロフィール更新API呼び出し
              console.log('Profile update:', updatedData);
            }}
          />
        </div>
      </main>
    </div>
  );
}