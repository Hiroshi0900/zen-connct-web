// ゼンコネクト ダッシュボードページ
// 認証済みユーザー向けダッシュボード（認証必須）

'use client';

import { ProtectedRoute } from '@/features/authentication/ui/components/ProtectedRoute';
import { Navigation } from '@/features/authentication/ui/components/Navigation';
import { Dashboard } from '@/features/authentication/ui/components/Dashboard';
import { useAuth } from '@/features/authentication/application/auth/AuthContext';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}

function DashboardPageContent() {
  const { user } = useAuth();

  if (!user) return null; // ProtectedRouteで保護されているため実際には到達しない

  return (
    <div className="min-h-screen bg-primary-dark text-primary-light">
      <Navigation user={user} currentPage="home" />
      <main>
        <Dashboard user={user} />
      </main>
    </div>
  );
}