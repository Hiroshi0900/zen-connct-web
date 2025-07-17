'use client';

import React, { useState } from 'react';

export const SessionDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSessionSequence = async () => {
    setTestResults([]);
    
    try {
      // Test 1: Multiple /auth/me calls in sequence
      addResult('🔄 Starting sequential /auth/me tests...');
      
      for (let i = 1; i <= 3; i++) {
        const response = await fetch('http://localhost:8080/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          addResult(`✅ Test ${i}: Success - User: ${data.email}`);
        } else {
          const error = await response.text();
          addResult(`❌ Test ${i}: Failed (${response.status}) - ${error}`);
        }
        
        // Wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Test 2: Try /auth/me right before profile-image
      addResult('🔄 Testing /auth/me → /profile-image sequence...');
      
      const authResponse = await fetch('http://localhost:8080/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        addResult(`✅ Pre-test auth: Success - User: ${authData.email}`);
        
        // Immediately try profile-image endpoint
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

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          addResult(`✅ Profile image: Success - ${JSON.stringify(profileData)}`);
        } else {
          const profileError = await profileResponse.text();
          addResult(`❌ Profile image: Failed (${profileResponse.status}) - ${profileError}`);
        }
      } else {
        addResult(`❌ Pre-test auth failed: ${authResponse.status}`);
      }

    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDifferentEndpoints = async () => {
    setTestResults([]);
    addResult('🔄 Testing different endpoints...');

    const endpoints = [
      { name: 'auth/me', url: 'http://localhost:8080/auth/me', method: 'GET' },
      { name: 'users/me/profile', url: 'http://localhost:8080/users/me/profile', method: 'GET' },
      // Add other endpoints that might exist
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          addResult(`✅ ${endpoint.name}: Success (${response.status})`);
        } else {
          const error = await response.text();
          addResult(`❌ ${endpoint.name}: Failed (${response.status}) - ${error}`);
        }
      } catch (error) {
        addResult(`❌ ${endpoint.name}: Network error - ${error}`);
      }
    }
  };

  const getCookieValue = (name: string): string | null => {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1];
    return value || null;
  };

  const testCookieExtraction = () => {
    setTestResults([]);
    addResult('🍪 Cookie情報を抽出中...');
    
    const allCookies = document.cookie;
    const zenSession = getCookieValue('zen_session');
    
    addResult(`📋 全Cookie: ${allCookies || 'なし'}`);
    addResult(`🔑 zen_session: ${zenSession ? `${zenSession.substring(0, 50)}...` : 'なし'}`);
    addResult(`📏 zen_session length: ${zenSession?.length || 0} characters`);
    
    if (zenSession) {
      addResult(`🧪 zen_session (完全): ${zenSession}`);
    } else {
      addResult('');
      addResult('⚠️  zen_sessionが見つかりません！');
      addResult('');
      addResult('📋 確認手順:');
      addResult('1. F12で開発者ツールを開く');
      addResult('2. Applicationタブ → Storage → Cookies → http://localhost:3000');
      addResult('3. zen_sessionが存在するか確認');
      addResult('4. HttpOnlyフラグが設定されているか確認');
      addResult('');
      addResult('💡 HttpOnlyの場合、JavaScriptからアクセスできません');
      addResult('   → Networkタブでリクエストヘッダーを確認してください');
    }
  };

  const testProfileImageAPI = async () => {
    setTestResults([]);
    addResult('🖼️ プロフィール画像APIを直接テスト中...');
    
    try {
      // Get current timestamp
      const timestamp = new Date().toISOString();
      addResult(`⏰ Request Time: ${timestamp}`);
      addResult('');

      // Create FormData
      const formData = new FormData();
      formData.append('filename', 'test.jpg');
      formData.append('mime_type', 'image/jpeg');
      formData.append('file_size', '102400');

      addResult('📝 FormData内容:');
      for (const [key, value] of formData.entries()) {
        addResult(`  ${key}: ${value}`);
      }
      addResult('');

      // Log request details
      const requestUrl = 'http://localhost:8080/users/me/profile-image/upload-url';
      const requestMethod = 'POST';
      const requestCredentials = 'include';

      addResult('🚀 Request Details:');
      addResult(`  URL: ${requestUrl}`);
      addResult(`  Method: ${requestMethod}`);
      addResult(`  Credentials: ${requestCredentials}`);
      addResult(`  Content-Type: multipart/form-data (auto-generated)`);
      addResult('');

      // Get and log current cookies
      const allCookies = document.cookie;
      const zenSession = getCookieValue('zen_session');
      
      addResult('🍪 Cookie Details:');
      addResult(`  All Cookies: ${allCookies || 'なし'}`);
      addResult(`  zen_session: ${zenSession ? `${zenSession.substring(0, 50)}...` : 'なし'}`);
      addResult(`  zen_session length: ${zenSession?.length || 0} characters`);
      addResult('');

      // Log browser info
      addResult('🌐 Browser Info:');
      addResult(`  User Agent: ${navigator.userAgent}`);
      addResult(`  Current Domain: ${window.location.hostname}`);
      addResult(`  Current Port: ${window.location.port}`);
      addResult(`  Current Protocol: ${window.location.protocol}`);
      addResult('');

      addResult('📡 Sending Request...');
      
      const response = await fetch(requestUrl, {
        method: requestMethod,
        credentials: requestCredentials,
        body: formData
      });

      const responseTimestamp = new Date().toISOString();
      addResult(`📥 Response Received: ${responseTimestamp}`);
      addResult('');

      // Log response details
      addResult('📊 Response Details:');
      addResult(`  Status: ${response.status} ${response.statusText}`);
      addResult(`  URL: ${response.url}`);
      addResult(`  Type: ${response.type}`);
      addResult(`  Redirected: ${response.redirected}`);
      addResult('');

      addResult('📋 Response Headers:');
      const responseHeaders = Object.fromEntries(response.headers.entries());
      for (const [key, value] of Object.entries(responseHeaders)) {
        addResult(`  ${key}: ${value}`);
      }
      addResult('');

      if (response.ok) {
        const data = await response.json();
        addResult('✅ SUCCESS RESPONSE:');
        addResult(JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        addResult('❌ ERROR RESPONSE:');
        addResult(`Raw Response: ${errorText}`);
        addResult('');
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          addResult('Parsed Error JSON:');
          addResult(JSON.stringify(errorJson, null, 2));
        } catch (e) {
          addResult('(Response is not valid JSON)');
        }
      }

      addResult('');
      addResult('🔍 バックエンドチームへ: 上記のタイムスタンプでログを確認してください');
      
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      addResult(`💥 Network Error at ${errorTimestamp}:`);
      addResult(`Error Type: ${error.constructor.name}`);
      addResult(`Error Message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addResult(`Error Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    }
  };

  const generateCurlCommand = () => {
    setTestResults([]);
    addResult('📋 cURL コマンドを生成中...');
    
    const zenSession = getCookieValue('zen_session');
    
    if (!zenSession) {
      addResult('❌ zen_sessionがJavaScriptからアクセスできません');
      addResult('');
      addResult('🔧 代替手順:');
      addResult('1. F12 → Networkタブを開く');
      addResult('2. 「🖼️ 画像API直接テスト」ボタンをクリック');
      addResult('3. "profile-image/upload-url" リクエストを右クリック');
      addResult('4. "Copy" → "Copy as cURL" を選択');
      addResult('5. ターミナルでペースト実行');
      return;
    }

    const curlCommand = `curl -X POST http://localhost:8080/users/me/profile-image/upload-url \\
  -H "Cookie: zen_session=${zenSession}" \\
  -F "filename=test.jpg" \\
  -F "mime_type=image/jpeg" \\
  -F "file_size=102400"`;

    addResult('🚀 以下のcURLコマンドをコピーしてターミナルで実行してください:');
    addResult('');
    addResult(curlCommand);
    addResult('');
    addResult('💡 このコマンドは正確なCookieを使用しています');
  };

  const checkNetworkTab = () => {
    setTestResults([]);
    addResult('🌐 NetworkタブでのCookie確認手順:');
    addResult('');
    addResult('1. F12で開発者ツールを開く');
    addResult('2. Networkタブに移動');
    addResult('3. 「/auth/me をテスト」ボタンをクリック');
    addResult('4. auth/me リクエストをクリック');
    addResult('5. Request Headers セクションで Cookie を確認');
    addResult('');
    addResult('⚡ zen_session=... が表示されれば HttpOnly Cookie です');
    addResult('');
    addResult('📋 手順実行後、以下をテストしてください:');
    addResult('- 「🖼️ 画像API直接テスト」で profile-image リクエストを生成');
    addResult('- Networkタブで Cookie ヘッダーを比較');
  };

  const testCorsIssue = async () => {
    setTestResults([]);
    addResult('🌐 CORS診断テストを実行中...');
    addResult('');

    try {
      // First, test getting the upload URL to get a real MinIO URL
      addResult('📋 Step 1: Pre-signed URL取得...');
      const formData = new FormData();
      formData.append('filename', 'cors-test.txt');
      formData.append('mime_type', 'text/plain');
      formData.append('file_size', '13');

      const uploadUrlResponse = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!uploadUrlResponse.ok) {
        addResult('❌ Pre-signed URL取得失敗 - CORS以前の問題');
        return;
      }

      const uploadData = await uploadUrlResponse.json();
      const minioUrl = uploadData.upload_url;
      addResult(`✅ Pre-signed URL取得成功`);
      addResult(`   MinIO URL: ${minioUrl}`);
      addResult('');

      // Parse the MinIO server URL
      const url = new URL(minioUrl);
      const minioBaseUrl = `${url.protocol}//${url.host}`;
      addResult(`🔍 MinIO サーバー分析:`);
      addResult(`   Protocol: ${url.protocol}`);
      addResult(`   Host: ${url.host}`);
      addResult(`   Base URL: ${minioBaseUrl}`);
      addResult('');

      // Test 1: Simple GET request to MinIO base (should fail with CORS if misconfigured)
      addResult('🧪 Test 1: MinIO基底URLにGETリクエスト...');
      try {
        const getResponse = await fetch(minioBaseUrl, {
          method: 'GET',
          mode: 'cors',
        });
        addResult(`   GET Response: ${getResponse.status} ${getResponse.statusText}`);
      } catch (getError) {
        addResult(`   GET Error: ${getError instanceof Error ? getError.message : 'Unknown'}`);
      }
      addResult('');

      // Test 2: OPTIONS preflight to the pre-signed URL
      addResult('🧪 Test 2: OPTIONSプリフライト（手動）...');
      try {
        const optionsResponse = await fetch(minioUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'content-type',
          }
        });
        addResult(`   OPTIONS Response: ${optionsResponse.status} ${optionsResponse.statusText}`);
        addResult(`   CORS Headers:`);
        Object.entries(Object.fromEntries(optionsResponse.headers.entries())).forEach(([key, value]) => {
          if (key.toLowerCase().startsWith('access-control')) {
            addResult(`     ${key}: ${value}`);
          }
        });
      } catch (optionsError) {
        addResult(`   OPTIONS Error: ${optionsError instanceof Error ? optionsError.message : 'Unknown'}`);
      }
      addResult('');

      // Test 3: Attempt the actual PUT with detailed error capturing
      addResult('🧪 Test 3: 実際のPUTリクエスト（小さなテキストファイル）...');
      const testContent = 'Hello MinIO!';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      
      try {
        const putResponse = await fetch(minioUrl, {
          method: 'PUT',
          body: testBlob,
          headers: {
            'Content-Type': 'text/plain'
          }
        });
        addResult(`   PUT Response: ${putResponse.status} ${putResponse.statusText}`);
        if (putResponse.ok) {
          addResult(`   ✅ PUT成功 - CORSは正常に動作しています！`);
        } else {
          const errorText = await putResponse.text();
          addResult(`   PUT Error Body: ${errorText}`);
        }
      } catch (putError) {
        addResult(`   PUT Error: ${putError instanceof Error ? putError.message : 'Unknown'}`);
        addResult(`   PUT Error Type: ${putError instanceof Error ? putError.constructor.name : 'Unknown'}`);
        
        // Analyze the error
        const errorMessage = putError instanceof Error ? putError.message : '';
        if (errorMessage.includes('Failed to fetch')) {
          addResult('');
          addResult('🚨 診断結果: CORS設定問題');
          addResult('   MinIOサーバーのCORS設定を確認してください');
          addResult('');
          addResult('💡 解決方法:');
          addResult('   1. MinIOコンソールにアクセス: http://localhost:9001');
          addResult('   2. Buckets → profile-images → Access Rules');
          addResult('   3. CORS設定を追加:');
          addResult('      - Origin: http://localhost:3000');
          addResult('      - Methods: GET, PUT, POST, DELETE');
          addResult('      - Headers: *');
          addResult('');
          addResult('📋 または、MinIO CLIで設定:');
          addResult('   mc cors set profile-images --config-file cors.json');
          addResult('');
          addResult('🔧 cors.json例:');
          addResult(`   {`);
          addResult(`     "CORSRules": [`);
          addResult(`       {`);
          addResult(`         "AllowedOrigins": ["http://localhost:3000"],`);
          addResult(`         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],`);
          addResult(`         "AllowedHeaders": ["*"]`);
          addResult(`       }`);
          addResult(`     ]`);
          addResult(`   }`);
        }
      }

      addResult('');
      addResult('🎯 CORS診断完了');
      
    } catch (error) {
      addResult(`💥 診断エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testNewDirectUpload = async () => {
    setTestResults([]);
    addResult('🆕 新しい直接アップロードAPIをテスト中...');
    addResult('');

    try {
      // Create a small test image file (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          addResult('❌ テスト画像の作成に失敗');
          return;
        }
        
        const file = new File([blob], 'test-direct-upload.png', { type: 'image/png' });
        addResult(`✅ テスト画像作成: ${file.name} (${file.size} bytes)`);
        addResult('');
        
        // New Direct Upload: Single step
        addResult('📋 新API: 直接アップロード実行中...');
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('http://localhost:8080/users/me/profile-image', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.text();
          addResult(`❌ 直接アップロード失敗: ${uploadResponse.status} ${uploadResponse.statusText}`);
          addResult(`   Error: ${error}`);
          return;
        }

        const result = await uploadResponse.json();
        addResult(`✅ 直接アップロード成功! (${uploadResponse.status})`);
        addResult(`   画像URL: ${result.image_url}`);
        addResult(`   サムネイル: ${result.thumbnail_url || 'なし'}`);
        addResult(`   ファイルサイズ: ${result.file_size || 'なし'} bytes`);
        addResult('');
        addResult('🎉 新しいAPIは正常に動作しています！');
        addResult('💡 CORSの問題も解決されました！');
        
      }, 'image/png');
      
    } catch (error) {
      addResult(`💥 新API テストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testCompleteFlow = async () => {
    setTestResults([]);
    addResult('🔄 レガシー: 完全なアップロードフローをテスト中...');
    addResult('⚠️  このテストは新APIがリリースされたため非推奨です');
    addResult('');
    
    try {
      // Create a small test image file (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          addResult('❌ テスト画像の作成に失敗');
          return;
        }
        
        const file = new File([blob], 'test-image.png', { type: 'image/png' });
        addResult(`✅ テスト画像作成: ${file.name} (${file.size} bytes)`);
        addResult('');
        
        // Step 1: Get upload URL
        addResult('📋 Step 1: Pre-signed URL取得中...');
        const formData = new FormData();
        formData.append('filename', file.name);
        formData.append('mime_type', file.type);
        formData.append('file_size', file.size.toString());

        const uploadUrlResponse = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!uploadUrlResponse.ok) {
          const error = await uploadUrlResponse.text();
          addResult(`❌ Step 1 Failed: ${error}`);
          return;
        }

        const uploadData = await uploadUrlResponse.json();
        addResult(`✅ Step 1 Success: Pre-signed URL取得`);
        addResult(`   URL: ${uploadData.upload_url.substring(0, 100)}...`);
        addResult(`   Path: ${uploadData.image_path}`);
        addResult('');

        // Step 2: Upload to MinIO
        addResult('📋 Step 2: MinIOへ直接アップロード中...');
        addResult(`   Target URL: ${uploadData.upload_url}`);
        addResult(`   File Type: ${file.type}`);
        addResult(`   File Size: ${file.size} bytes`);
        addResult('');

        try {
          const uploadResponse = await fetch(uploadData.upload_url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (!uploadResponse.ok) {
            addResult(`❌ Step 2 Failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            addResult(`   Response Headers:`);
            Object.entries(Object.fromEntries(uploadResponse.headers.entries())).forEach(([key, value]) => {
              addResult(`     ${key}: ${value}`);
            });
            const errorText = await uploadResponse.text();
            addResult(`   Error Body: ${errorText}`);
            return;
          }
        } catch (uploadError) {
          addResult(`❌ Step 2 Network Error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          addResult(`   Error Type: ${uploadError instanceof Error ? uploadError.constructor.name : 'Unknown'}`);
          addResult(`   Stack: ${uploadError instanceof Error ? uploadError.stack : 'No stack'}`);
          addResult('');
          addResult('🔍 CORS Analysis:');
          addResult('   This error typically indicates a CORS (Cross-Origin Resource Sharing) issue.');
          addResult('   The browser is blocking the request to MinIO because:');
          addResult('   1. Different domain/port (frontend: localhost:3000, MinIO: localhost:9000)');
          addResult('   2. MinIO CORS settings may not allow requests from localhost:3000');
          addResult('   3. Preflight OPTIONS request might be failing');
          addResult('');
          addResult('🛠️ Suggested Solutions:');
          addResult('   1. Check MinIO CORS configuration');
          addResult('   2. Add localhost:3000 to allowed origins in MinIO');
          addResult('   3. Check if MinIO is accessible directly in browser');
          addResult(`   4. Try accessing: ${uploadData.upload_url} (should show XML error)`);
          return;
        }

        addResult(`✅ Step 2 Success: MinIOアップロード完了 (${uploadResponse.status})`);
        addResult('');

        // Step 3: Complete notification
        addResult('📋 Step 3: 完了通知API呼び出し中...');
        const completeResponse = await fetch('http://localhost:8080/users/me/profile-image/complete', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            image_path: uploadData.image_path,
            bucket_name: 'profile-images'
          })
        });

        if (!completeResponse.ok) {
          const error = await completeResponse.text();
          addResult(`❌ Step 3 Failed (${completeResponse.status}): ${error}`);
          addResult(`   Complete Response Headers:`);
          Object.entries(Object.fromEntries(completeResponse.headers.entries())).forEach(([key, value]) => {
            addResult(`     ${key}: ${value}`);
          });
          return;
        }

        const completeData = await completeResponse.json();
        addResult(`✅ Step 3 Success: 完了通知完了`);
        addResult(`   Response Status: ${completeResponse.status}`);
        addResult(`   画像URL: ${completeData.image_url}`);
        addResult(`   サムネイル: ${completeData.thumbnail_url || 'なし'}`);
        addResult(`   ファイルサイズ: ${completeData.file_size || 'なし'} bytes`);
        addResult('');
        addResult('🎉 完全なアップロードフロー成功！');
        
      }, 'image/png');
      
    } catch (error) {
      addResult(`💥 フローテストエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-2 text-red-400">🚨 セッション詳細デバッグ</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testSessionSequence}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            連続セッションテスト
          </button>
          <button
            onClick={testDifferentEndpoints}
            className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700"
          >
            エンドポイント比較
          </button>
          <button
            onClick={testCookieExtraction}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Cookie抽出
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testProfileImageAPI}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
          >
            🖼️ 画像API直接テスト
          </button>
          <button
            onClick={generateCurlCommand}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
          >
            📋 cURL生成
          </button>
          <button
            onClick={checkNetworkTab}
            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
          >
            🌐 Network確認手順
          </button>
          <button
            onClick={testNewDirectUpload}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
          >
            🆕 新API直接テスト
          </button>
          <button
            onClick={testCompleteFlow}
            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700"
          >
            📜 レガシーテスト
          </button>
          <button
            onClick={testCorsIssue}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            🌐 CORS診断
          </button>
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
          >
            クリア
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="bg-black/30 p-3 rounded max-h-60 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' : 
                result.includes('❌') ? 'text-red-400' : 
                'text-yellow-400'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};