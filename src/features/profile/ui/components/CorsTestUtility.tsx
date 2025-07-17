'use client';

import React, { useState } from 'react';

export const CorsTestUtility: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testMinIOCors = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('🌐 MinIO CORS テスト開始...');
    addResult('');

    try {
      // Test different MinIO endpoints that are commonly available
      const testUrls = [
        'http://localhost:9000',
        'http://localhost:9000/minio/health/live',
        'http://profile-images.localhost:9000', // Custom domain if used
      ];

      for (const testUrl of testUrls) {
        addResult(`🧪 Testing: ${testUrl}`);
        
        try {
          const response = await fetch(testUrl, {
            method: 'GET',
            mode: 'cors',
          });
          
          addResult(`   ✅ Status: ${response.status} ${response.statusText}`);
          
          // Check CORS headers
          const corsHeaders = {};
          response.headers.forEach((value, key) => {
            if (key.toLowerCase().startsWith('access-control')) {
              corsHeaders[key] = value;
            }
          });
          
          if (Object.keys(corsHeaders).length > 0) {
            addResult(`   🔧 CORS Headers found:`);
            Object.entries(corsHeaders).forEach(([key, value]) => {
              addResult(`     ${key}: ${value}`);
            });
          } else {
            addResult(`   ⚠️  No CORS headers found`);
          }
          
        } catch (error) {
          addResult(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
          
          // Provide specific guidance based on error type
          const errorMessage = error instanceof Error ? error.message : '';
          if (errorMessage.includes('Failed to fetch')) {
            addResult(`   🔍 Likely CORS issue - server may not be configured for cross-origin requests`);
          } else if (errorMessage.includes('network')) {
            addResult(`   🔍 Network issue - server may not be running`);
          }
        }
        
        addResult('');
      }

      // Provide diagnostic information
      addResult('📋 Diagnostic Information:');
      addResult(`   Current Origin: ${window.location.origin}`);
      addResult(`   User Agent: ${navigator.userAgent.substring(0, 50)}...`);
      addResult(`   Timestamp: ${new Date().toISOString()}`);
      addResult('');

      addResult('💡 CORS Configuration Guide:');
      addResult('');
      addResult('1. MinIO Console Method:');
      addResult('   • Access: http://localhost:9001');
      addResult('   • Username/Password: minioadmin/minioadmin (default)');
      addResult('   • Navigate: Buckets → profile-images → Access Rules');
      addResult('   • Add CORS rule with:');
      addResult('     - Origin: http://localhost:3000');
      addResult('     - Methods: GET, PUT, POST, DELETE, HEAD');
      addResult('     - Headers: *');
      addResult('');
      
      addResult('2. MinIO Client (mc) Method:');
      addResult('   # Install mc: https://docs.min.io/docs/minio-client-quickstart-guide');
      addResult('   mc alias set local http://localhost:9000 minioadmin minioadmin');
      addResult('   mc cors set local/profile-images cors-config.json');
      addResult('');
      
      addResult('3. Sample cors-config.json:');
      addResult(`   {`);
      addResult(`     "CORSRules": [`);
      addResult(`       {`);
      addResult(`         "AllowedOrigins": ["http://localhost:3000"],`);
      addResult(`         "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],`);
      addResult(`         "AllowedHeaders": ["*"],`);
      addResult(`         "ExposeHeaders": ["ETag"]`);
      addResult(`       }`);
      addResult(`     ]`);
      addResult(`   }`);
      addResult('');
      
      addResult('4. Docker Compose Method (if using docker):');
      addResult('   Add to MinIO environment variables:');
      addResult('   - MINIO_CORS_ALLOW_ORIGIN=http://localhost:3000');
      addResult('');
      
      addResult('🎯 Test completed. If errors persist, check:');
      addResult('   • MinIO is running on correct port (9000)');
      addResult('   • Bucket "profile-images" exists');
      addResult('   • CORS configuration is applied correctly');
      addResult('   • No firewall blocking the connection');

    } catch (error) {
      addResult(`💥 Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsRunning(false);
  };

  const testPreSignedUrlUpload = async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('🔗 Pre-signed URL Upload テスト開始...');
    addResult('');

    try {
      // Step 1: Get pre-signed URL
      addResult('📋 Step 1: Pre-signed URL取得...');
      const formData = new FormData();
      formData.append('filename', 'cors-upload-test.txt');
      formData.append('mime_type', 'text/plain');
      formData.append('file_size', '25');

      const uploadUrlResponse = await fetch('http://localhost:8080/users/me/profile-image/upload-url', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!uploadUrlResponse.ok) {
        const error = await uploadUrlResponse.text();
        addResult(`❌ Pre-signed URL取得失敗: ${error}`);
        setIsRunning(false);
        return;
      }

      const uploadData = await uploadUrlResponse.json();
      addResult(`✅ Pre-signed URL取得成功`);
      addResult(`   URL: ${uploadData.upload_url}`);
      addResult('');

      // Step 2: Test upload
      addResult('📤 Step 2: ファイルアップロードテスト...');
      const testContent = 'MinIO CORS upload test!';
      const testBlob = new Blob([testContent], { type: 'text/plain' });

      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: testBlob,
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      if (uploadResponse.ok) {
        addResult(`✅ アップロード成功! (${uploadResponse.status})`);
        addResult('   🎉 CORS設定は正常に動作しています!');
      } else {
        addResult(`❌ アップロード失敗: ${uploadResponse.status} ${uploadResponse.statusText}`);
        const errorText = await uploadResponse.text();
        addResult(`   Error: ${errorText}`);
      }

    } catch (error) {
      addResult(`💥 Upload Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Failed to fetch')) {
        addResult('');
        addResult('🚨 CORS設定が必要です！');
        addResult('   上記の「MinIO CORS テスト」を実行して設定ガイドを確認してください。');
      }
    }
    
    setIsRunning(false);
  };

  return (
    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-2 text-red-400">🌐 CORS テストユーティリティ</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testMinIOCors}
            disabled={isRunning}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isRunning ? '実行中...' : '🌐 MinIO CORS テスト'}
          </button>
          <button
            onClick={testPreSignedUrlUpload}
            disabled={isRunning}
            className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            {isRunning ? '実行中...' : '🔗 Pre-signed URL テスト'}
          </button>
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            クリア
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="bg-black/30 p-3 rounded max-h-96 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={
                  result.includes('✅') ? 'text-green-400' : 
                  result.includes('❌') || result.includes('🚨') ? 'text-red-400' : 
                  result.includes('⚠️') ? 'text-yellow-400' :
                  result.includes('🔧') || result.includes('💡') ? 'text-blue-400' :
                  'text-gray-300'
                }
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-400">
        💡 このツールはMinIOのCORS設定をテストし、設定方法を提供します。<br/>
        問題が解決しない場合は、バックエンドチームにMinIOのCORS設定確認を依頼してください。
      </div>
    </div>
  );
};