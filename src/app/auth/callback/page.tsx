// ゼンコネクト Auth0コールバックページ
// /auth/callback ルートでAuth0からのリダイレクトを処理

import { AuthCallback } from '@/features/authentication/ui/components/AuthCallback';

export default function AuthCallbackPage() {
  return <AuthCallback />;
}