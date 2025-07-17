'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../authentication/application/auth/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const getCookieValue = (name: string): string | null => {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value || null;
  };

  const testAuthEndpoint = async () => {
    try {
      const timestamp = new Date().toISOString();
      
      // Create detailed result array
      const results = [];
      results.push('🔐 /auth/me 詳細テスト実行中...');
      results.push('');
      results.push(`⏰ Request Time: ${timestamp}`);
      results.push('');

      // Log request details
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      results.push('🚀 Request Details:');
      results.push(`  URL: http://localhost:8080/auth/me`);
      results.push(`  Method: GET`);
      results.push(`  Credentials: include`);
      results.push(`  Content-Type: application/json`);
      results.push('');

      // Get and log current cookies
      const allCookies = document.cookie;
      const zenSession = getCookieValue('zen_session');
      
      results.push('🍪 Cookie Details:');
      results.push(`  All Cookies: ${allCookies || 'なし'}`);
      results.push(`  zen_session: ${zenSession ? `${zenSession.substring(0, 50)}...` : 'なし'}`);
      results.push(`  zen_session length: ${zenSession?.length || 0} characters`);
      results.push('');

      // Log browser info
      results.push('🌐 Browser Info:');
      results.push(`  User Agent: ${navigator.userAgent}`);
      results.push(`  Current Domain: ${window.location.hostname}`);
      results.push(`  Current Port: ${window.location.port}`);
      results.push(`  Current Protocol: ${window.location.protocol}`);
      results.push('');

      results.push('📡 Sending Request...');
      
      // Update result display
      setTestResult(results.join('\n'));
      
      console.log('🔍 /auth/me Request Details:');
      console.log('Timestamp:', timestamp);
      console.log('URL:', 'http://localhost:8080/auth/me');
      console.log('Method:', 'GET');
      console.log('Headers:', requestHeaders);
      console.log('Credentials:', 'include');
      console.log('Current cookies:', document.cookie);
      console.log('User Agent:', navigator.userAgent);
      
      const response = await fetch('http://localhost:8080/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: requestHeaders
      });

      const responseTimestamp = new Date().toISOString();
      results.push(`📥 Response Received: ${responseTimestamp}`);
      results.push('');

      // Log response details
      results.push('📊 Response Details:');
      results.push(`  Status: ${response.status} ${response.statusText}`);
      results.push(`  URL: ${response.url}`);
      results.push(`  Type: ${response.type}`);
      results.push(`  Redirected: ${response.redirected}`);
      results.push('');

      results.push('📋 Response Headers:');
      const responseHeaders = Object.fromEntries(response.headers.entries());
      for (const [key, value] of Object.entries(responseHeaders)) {
        results.push(`  ${key}: ${value}`);
      }
      results.push('');

      console.log('📥 /auth/me Response Details:');
      console.log('Response Timestamp:', responseTimestamp);
      console.log('Status:', response.status, response.statusText);
      console.log('URL:', response.url);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        results.push('✅ SUCCESS RESPONSE:');
        results.push(JSON.stringify(data, null, 2));
        results.push('');
        results.push('🔍 バックエンドチームへ: 上記のタイムスタンプでログを確認してください');
      } else {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData, null, 2);
        } catch {
          errorText = await response.text();
        }
        results.push('❌ ERROR RESPONSE:');
        results.push(`Raw Response: ${errorText}`);
        results.push('');
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          results.push('Parsed Error JSON:');
          results.push(JSON.stringify(errorJson, null, 2));
        } catch (e) {
          results.push('(Response is not valid JSON)');
        }
        results.push('');
        results.push('🔍 バックエンドチームへ: 上記のタイムスタンプでログを確認してください');
      }

      setTestResult(results.join('\n'));
      
    } catch (error) {
      console.error('Auth test error:', error);
      const errorTimestamp = new Date().toISOString();
      setTestResult(`💥 Network Error at ${errorTimestamp}:
Error Type: ${error.constructor.name}
Error Message: ${error instanceof Error ? error.message : 'Unknown error'}
Error Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    }
  };

  const testProfileImageEndpoint = async () => {
    try {
      setTestResult('Testing /users/me/profile-image/upload-url...');
      
      // Create test FormData
      const formData = new FormData();
      formData.append('filename', 'test.jpg');
      formData.append('mime_type', 'image/jpeg');
      formData.append('file_size', '1024');

      const requestHeaders = {
        'Accept': 'application/json',
      };

      console.log('🔍 /users/me/profile-image/upload-url Request Details:');
      console.log('URL:', 'http://localhost:8080/users/me/profile-image/upload-url');
      console.log('Method:', 'POST');
      console.log('Headers:', requestHeaders);
      console.log('Credentials:', 'include');
      console.log('Current cookies:', document.cookie);
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const response = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: requestHeaders,
        body: formData
      });

      console.log('📥 /users/me/profile-image/upload-url Response Details:');
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Profile Image OK (${response.status}): ${JSON.stringify(data, null, 2)}`);
      } else {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData, null, 2);
        } catch {
          errorText = await response.text();
        }
        setTestResult(`❌ Profile Image Failed (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Profile image test error:', error);
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBothEndpoints = async () => {
    try {
      setTestResult('Testing both endpoints...\n\n');
      
      // Test 1: /auth/me
      const authResponse = await fetch('http://localhost:8080/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const authResult = authResponse.ok ? await authResponse.json() : await authResponse.text();
      
      // Test 2: /users/me/profile-image/upload-url
      const formData = new FormData();
      formData.append('filename', 'test.jpg');
      formData.append('mime_type', 'image/jpeg');
      formData.append('file_size', '1024');

      const profileResponse = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      const profileResult = profileResponse.ok ? await profileResponse.json() : await profileResponse.text();

      setTestResult(`🔍 両エンドポイント比較結果:

📍 /auth/me (${authResponse.status}):
${JSON.stringify(authResult, null, 2)}

📍 /users/me/profile-image/upload-url (${profileResponse.status}):
${JSON.stringify(profileResult, null, 2)}

🍪 送信されたCookie: ${document.cookie || 'なし'}

🌐 リクエスト詳細:
- auth/me: GET, Content-Type: application/json
- profile: POST, Content-Type: multipart/form-data
`);
    } catch (error) {
      console.error('Both endpoints test error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-2 text-white">🔍 認証デバッグ情報</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>認証状態:</strong> {isLoading ? '読み込み中...' : isAuthenticated ? '✅ 認証済み' : '❌ 未認証'}
        </div>
        
        {user && (
          <div>
            <strong>ユーザー情報:</strong>
            <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified
              }, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <strong>APIテスト:</strong>
          <button
            onClick={testAuthEndpoint}
            className="ml-2 bg-accent-teal text-primary-dark px-3 py-1 rounded text-xs hover:bg-accent-teal/80"
          >
            /auth/me
          </button>
          <button
            onClick={testProfileImageEndpoint}
            className="ml-2 bg-accent-coral text-primary-dark px-3 py-1 rounded text-xs hover:bg-accent-coral/80"
          >
            /profile-image
          </button>
          <button
            onClick={testBothEndpoints}
            className="ml-2 bg-zen-sage text-primary-dark px-3 py-1 rounded text-xs hover:bg-zen-sage/80"
          >
            両方比較
          </button>
        </div>

        <div>
          <strong>ヘッダー検証:</strong>
          <button
            onClick={async () => {
              try {
                // Test without explicit headers
                const formData = new FormData();
                formData.append('filename', 'test.jpg');
                formData.append('mime_type', 'image/jpeg');
                formData.append('file_size', '1024');

                const response = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
                  method: 'POST',
                  credentials: 'include',
                  // No headers - let browser set Content-Type automatically
                  body: formData
                });

                const result = response.ok ? await response.json() : await response.text();
                setTestResult(`🧪 ヘッダー無し (${response.status}): ${JSON.stringify(result, null, 2)}`);
              } catch (error) {
                setTestResult(`❌ Error: ${error}`);
              }
            }}
            className="ml-2 bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
          >
            ヘッダー無し
          </button>
        </div>

        {testResult && (
          <div>
            <strong>テスト結果:</strong>
            <pre className="bg-gray-900 p-2 rounded mt-1 text-xs overflow-auto max-h-40">
              {testResult}
            </pre>
          </div>
        )}

        <div>
          <strong>ブラウザCookie確認:</strong>
          <button
            onClick={() => {
              const cookies = document.cookie;
              const cookieArray = cookies.split(';').map(c => c.trim()).filter(c => c);
              setTestResult(`Browser Cookies (${cookieArray.length} found):\n${cookieArray.join('\n') || 'なし'}`);
            }}
            className="ml-2 bg-accent-coral text-primary-dark px-3 py-1 rounded text-xs hover:bg-accent-coral/80"
          >
            Cookie詳細
          </button>
        </div>

        <div>
          <strong>認証情報確認:</strong>
          <button
            onClick={() => {
              const authServiceUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
              setTestResult(`Auth Service URL: ${authServiceUrl}\nCurrent Domain: ${window.location.hostname}\nCurrent Protocol: ${window.location.protocol}`);
            }}
            className="ml-2 bg-zen-sage text-primary-dark px-3 py-1 rounded text-xs hover:bg-zen-sage/80"
          >
            環境情報
          </button>
        </div>
      </div>
    </div>
  );
};