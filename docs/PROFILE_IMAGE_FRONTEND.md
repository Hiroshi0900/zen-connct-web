# プロフィール画像アップロード - フロントエンド実装計画

## 概要

Next.js 15 + TypeScript + React環境でプロフィール画像アップロード機能を実装します。TDD・DDDアプローチを採用し、クリーンアーキテクチャに基づいた設計を行います。

## アーキテクチャ

### Feature-Sliced Design (FSD) 構造

```
src/features/profile-image/
├── domain/
│   ├── entities/
│   │   ├── ProfileImage.ts
│   │   └── ProfileImage.test.ts
│   ├── value-objects/
│   │   ├── ImageFile.ts
│   │   ├── ImageFile.test.ts
│   │   ├── ImageSize.ts
│   │   └── ImageSize.test.ts
│   ├── events/
│   │   ├── ProfileImageUploaded.ts
│   │   └── ProfileImageUploadFailed.ts
│   └── repositories/
│       └── ProfileImageRepository.ts
├── application/
│   ├── use-cases/
│   │   ├── UploadProfileImageUseCase.ts
│   │   ├── UploadProfileImageUseCase.test.ts
│   │   ├── DeleteProfileImageUseCase.ts
│   │   └── DeleteProfileImageUseCase.test.ts
│   └── services/
│       ├── ProfileImageService.ts
│       └── ProfileImageService.test.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── ApiProfileImageRepository.ts
│   │   ├── ApiProfileImageRepository.test.ts
│   │   └── InMemoryProfileImageRepository.ts
│   └── services/
│       ├── FileUploadService.ts
│       └── FileUploadService.test.ts
└── ui/
    ├── components/
    │   ├── ImageUploadDropzone.tsx
    │   ├── ImageUploadDropzone.test.tsx
    │   ├── ImagePreview.tsx
    │   ├── ImagePreview.test.tsx
    │   ├── UploadProgress.tsx
    │   ├── UploadProgress.test.tsx
    │   └── ProfileImageUploader.tsx
    ├── hooks/
    │   ├── useProfileImageUpload.ts
    │   └── useProfileImageUpload.test.ts
    └── pages/
        └── ProfileImageUploadPage.tsx
```

## 実装詳細

### 1. ドメインモデル（Functional Approach）

#### ProfileImage エンティティ
```typescript
// src/features/profile-image/domain/entities/ProfileImage.ts
export type ProfileImage = {
  readonly id: string;
  readonly userId: string;
  readonly originalUrl: string;
  readonly thumbnailUrl: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly uploadedAt: Date;
  readonly updatedAt: Date;
};

export const createProfileImage = (
  userId: string,
  originalUrl: string,
  thumbnailUrl: string,
  fileSize: number,
  mimeType: string
): ProfileImage => ({
  id: crypto.randomUUID(),
  userId,
  originalUrl,
  thumbnailUrl,
  fileSize,
  mimeType,
  uploadedAt: new Date(),
  updatedAt: new Date(),
});

export const getProfileImageUrl = (profileImage: ProfileImage): string => 
  profileImage.originalUrl;

export const getProfileImageThumbnailUrl = (profileImage: ProfileImage): string => 
  profileImage.thumbnailUrl;
```

#### ImageFile Value Object
```typescript
// src/features/profile-image/domain/value-objects/ImageFile.ts
export class ImageFile {
  private constructor(
    private readonly file: File,
    private readonly previewUrl: string
  ) {}

  static create(file: File): ImageFile {
    // ファイル検証
    if (!this.isValidImageFile(file)) {
      throw new Error('Invalid image file');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image file too large. Max size: ${MAX_IMAGE_SIZE} bytes`);
    }

    const previewUrl = URL.createObjectURL(file);
    return new ImageFile(file, previewUrl);
  }

  private static isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  getFile(): File {
    return this.file;
  }

  getPreviewUrl(): string {
    return this.previewUrl;
  }

  getFileName(): string {
    return this.file.name;
  }

  getFileSize(): number {
    return this.file.size;
  }

  getMimeType(): string {
    return this.file.type;
  }

  cleanup(): void {
    URL.revokeObjectURL(this.previewUrl);
  }
}

// 定数
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

### 2. ユースケース実装

#### UploadProfileImageUseCase
```typescript
// src/features/profile-image/application/use-cases/UploadProfileImageUseCase.ts
import { ProfileImageRepository } from '../domain/repositories/ProfileImageRepository';
import { ImageFile } from '../domain/value-objects/ImageFile';
import { ProfileImage, createProfileImage } from '../domain/entities/ProfileImage';

export type UploadProfileImageRequest = {
  userId: string;
  imageFile: ImageFile;
};

export type UploadProfileImageResponse = {
  success: boolean;
  profileImage?: ProfileImage;
  error?: string;
};

export class UploadProfileImageUseCase {
  constructor(
    private readonly profileImageRepository: ProfileImageRepository,
    private readonly logger: Logger
  ) {}

  async execute(request: UploadProfileImageRequest): Promise<UploadProfileImageResponse> {
    try {
      this.logger.info('Starting profile image upload', {
        userId: request.userId,
        fileName: request.imageFile.getFileName(),
        fileSize: request.imageFile.getFileSize()
      });

      // 1. アップロードURL取得
      const uploadUrl = await this.profileImageRepository.generateUploadUrl(
        request.userId,
        request.imageFile.getFileName(),
        request.imageFile.getMimeType(),
        request.imageFile.getFileSize()
      );

      // 2. 画像アップロード
      const uploadResult = await this.profileImageRepository.uploadImage(
        uploadUrl.uploadUrl,
        request.imageFile.getFile()
      );

      if (!uploadResult.success) {
        throw new Error('Image upload failed');
      }

      // 3. アップロード完了通知
      const completeResult = await this.profileImageRepository.completeUpload(
        request.userId,
        uploadUrl.imagePath
      );

      // 4. ProfileImageエンティティ作成
      const profileImage = createProfileImage(
        request.userId,
        completeResult.imageUrl,
        completeResult.thumbnailUrl,
        request.imageFile.getFileSize(),
        request.imageFile.getMimeType()
      );

      this.logger.info('Profile image upload completed', {
        userId: request.userId,
        imageUrl: completeResult.imageUrl
      });

      return {
        success: true,
        profileImage
      };

    } catch (error) {
      this.logger.error('Profile image upload failed', {
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### 3. インフラストラクチャ層

#### ApiProfileImageRepository
```typescript
// src/features/profile-image/infrastructure/repositories/ApiProfileImageRepository.ts
import { ProfileImageRepository } from '../../domain/repositories/ProfileImageRepository';

export type GenerateUploadUrlResponse = {
  uploadUrl: string;
  imagePath: string;
  expiresAt: string;
};

export type UploadImageResult = {
  success: boolean;
  error?: string;
};

export type CompleteUploadResponse = {
  imageUrl: string;
  thumbnailUrl: string;
  fileSize: number;
};

export class ApiProfileImageRepository implements ProfileImageRepository {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly logger: Logger
  ) {}

  async generateUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
    fileSize: number
  ): Promise<GenerateUploadUrlResponse> {
    const response = await this.apiClient.post('/users/me/profile-image/upload-url', {
      filename,
      mime_type: mimeType,
      file_size: fileSize
    });

    return {
      uploadUrl: response.data.upload_url,
      imagePath: response.data.image_path,
      expiresAt: response.data.expires_at
    };
  }

  async uploadImage(uploadUrl: string, file: File): Promise<UploadImageResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Image upload failed', { error: error.message });
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async completeUpload(userId: string, imagePath: string): Promise<CompleteUploadResponse> {
    const response = await this.apiClient.post('/users/me/profile-image/complete', {
      image_path: imagePath,
      bucket_name: 'profile-images'
    });

    return {
      imageUrl: response.data.image_url,
      thumbnailUrl: response.data.thumbnail_url,
      fileSize: response.data.file_size
    };
  }
}
```

### 4. UIコンポーネント

#### ImageUploadDropzone
```typescript
// src/features/profile-image/ui/components/ImageUploadDropzone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageFile, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '../../domain/value-objects/ImageFile';

interface ImageUploadDropzoneProps {
  onFileSelect: (imageFile: ImageFile) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onFileSelect,
  onError,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const imageFile = ImageFile.create(file);
      onFileSelect(imageFile);
    } catch (error) {
      onError(error.message);
    }
  }, [onFileSelect, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: MAX_IMAGE_SIZE,
    multiple: false,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-300
        ${isDragActive ? 'border-accent-teal bg-accent-teal/10' : 'border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-teal hover:bg-accent-teal/5'}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'ここにドロップしてください' : 'プロフィール画像をアップロード'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            JPEGまたはPNG、WebP形式（最大5MB）
          </p>
        </div>
        
        <button
          type="button"
          className="px-4 py-2 bg-accent-teal text-white rounded-md hover:bg-accent-teal/90 transition-colors disabled:opacity-50"
          disabled={disabled}
        >
          ファイルを選択
        </button>
      </div>
    </div>
  );
};
```

#### ImagePreview
```typescript
// src/features/profile-image/ui/components/ImagePreview.tsx
import React from 'react';
import { ImageFile } from '../../domain/value-objects/ImageFile';

interface ImagePreviewProps {
  imageFile: ImageFile;
  onRemove: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageFile,
  onRemove,
  className = ''
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="aspect-square relative">
        <img
          src={imageFile.getPreviewUrl()}
          alt="プロフィール画像プレビュー"
          className="w-full h-full object-cover"
        />
        
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          aria-label="画像を削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-sm font-medium text-gray-900 truncate">
          {imageFile.getFileName()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(imageFile.getFileSize())} • {imageFile.getMimeType()}
        </p>
      </div>
    </div>
  );
};
```

#### UploadProgress
```typescript
// src/features/profile-image/ui/components/UploadProgress.tsx
import React from 'react';

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status,
  message
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-accent-teal';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'アップロード中...';
      case 'processing':
        return '処理中...';
      case 'completed':
        return 'アップロード完了';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {message && (
        <p className="text-xs text-gray-500 mt-2">
          {message}
        </p>
      )}
    </div>
  );
};
```

### 5. カスタムフック

#### useProfileImageUpload
```typescript
// src/features/profile-image/ui/hooks/useProfileImageUpload.ts
import { useState, useCallback } from 'react';
import { ImageFile } from '../../domain/value-objects/ImageFile';
import { UploadProfileImageUseCase } from '../../application/use-cases/UploadProfileImageUseCase';
import { useAuth } from '../../../authentication/ui/hooks/useAuth';
import { useLogger } from '../../../../lib/logging/LoggerFactory';

export type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export const useProfileImageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const { user } = useAuth();
  const logger = useLogger('ProfileImageUpload');
  const uploadUseCase = new UploadProfileImageUseCase(/* dependencies */);

  const uploadImage = useCallback(async (imageFile: ImageFile) => {
    if (!user) {
      setError('ユーザーが認証されていません');
      return;
    }

    try {
      setUploadState('uploading');
      setError(null);
      setProgress(0);

      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadUseCase.execute({
        userId: user.id,
        imageFile
      });

      clearInterval(progressInterval);

      if (result.success && result.profileImage) {
        setProgress(100);
        setUploadState('completed');
        setUploadedImageUrl(result.profileImage.originalUrl);
        
        // プレビューURLのクリーンアップ
        imageFile.cleanup();
        
        logger.info('Profile image uploaded successfully', {
          userId: user.id,
          imageUrl: result.profileImage.originalUrl
        });
      } else {
        throw new Error(result.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      setUploadState('error');
      setError(err.message);
      setProgress(0);
      
      logger.error('Profile image upload failed', {
        userId: user?.id,
        error: err.message
      });
    }
  }, [user, uploadUseCase, logger]);

  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setProgress(0);
    setError(null);
    setUploadedImageUrl(null);
  }, []);

  return {
    uploadState,
    progress,
    error,
    uploadedImageUrl,
    uploadImage,
    resetUpload
  };
};
```

### 6. 統合コンポーネント

#### ProfileImageUploader
```typescript
// src/features/profile-image/ui/components/ProfileImageUploader.tsx
import React, { useState } from 'react';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { ImagePreview } from './ImagePreview';
import { UploadProgress } from './UploadProgress';
import { useProfileImageUpload } from '../hooks/useProfileImageUpload';
import { ImageFile } from '../../domain/value-objects/ImageFile';

export const ProfileImageUploader: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const { uploadState, progress, error, uploadedImageUrl, uploadImage, resetUpload } = useProfileImageUpload();

  const handleFileSelect = (imageFile: ImageFile) => {
    setSelectedImage(imageFile);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    await uploadImage(selectedImage);
  };

  const handleRemove = () => {
    if (selectedImage) {
      selectedImage.cleanup();
      setSelectedImage(null);
    }
    resetUpload();
  };

  const handleError = (errorMessage: string) => {
    console.error('File selection error:', errorMessage);
    // エラー表示ロジック
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">プロフィール画像</h2>
      
      {uploadState === 'idle' && !selectedImage && (
        <ImageUploadDropzone
          onFileSelect={handleFileSelect}
          onError={handleError}
        />
      )}
      
      {selectedImage && uploadState === 'idle' && (
        <div className="space-y-4">
          <ImagePreview 
            imageFile={selectedImage} 
            onRemove={handleRemove}
          />
          
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              className="flex-1 bg-accent-teal text-white py-2 px-4 rounded-md hover:bg-accent-teal/90 transition-colors"
            >
              アップロード
            </button>
            <button
              onClick={handleRemove}
              className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
      
      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <UploadProgress 
          progress={progress}
          status={uploadState}
        />
      )}
      
      {uploadState === 'completed' && uploadedImageUrl && (
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden">
            <img
              src={uploadedImageUrl}
              alt="アップロードされたプロフィール画像"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-green-600 font-medium">プロフィール画像を更新しました</p>
          <button
            onClick={resetUpload}
            className="bg-accent-teal text-white py-2 px-4 rounded-md hover:bg-accent-teal/90 transition-colors"
          >
            別の画像をアップロード
          </button>
        </div>
      )}
      
      {uploadState === 'error' && error && (
        <div className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 font-medium">エラー</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={resetUpload}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            やり直す
          </button>
        </div>
      )}
    </div>
  );
};
```

## テスト戦略

### 1. Table-Driven Tests
```typescript
// src/features/profile-image/domain/value-objects/ImageFile.test.ts
import { ImageFile, MAX_IMAGE_SIZE } from './ImageFile';

describe('ImageFile', () => {
  describe('create', () => {
    it.each([
      ['valid JPEG', 'image/jpeg', 1024, true],
      ['valid PNG', 'image/png', 2048, true],
      ['valid WebP', 'image/webp', 3072, true],
      ['invalid type', 'image/gif', 1024, false],
      ['too large', 'image/jpeg', MAX_IMAGE_SIZE + 1, false],
      ['invalid extension', 'text/plain', 1024, false],
    ] as const)('should handle %s file', (_, mimeType, size, shouldSucceed) => {
      const file = new File([''], 'test.jpg', { type: mimeType });
      Object.defineProperty(file, 'size', { value: size });

      if (shouldSucceed) {
        expect(() => ImageFile.create(file)).not.toThrow();
      } else {
        expect(() => ImageFile.create(file)).toThrow();
      }
    });
  });
});
```

### 2. コンポーネントテスト
```typescript
// src/features/profile-image/ui/components/ImageUploadDropzone.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploadDropzone } from './ImageUploadDropzone';

describe('ImageUploadDropzone', () => {
  const mockOnFileSelect = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockOnError.mockClear();
  });

  it('should render upload area', () => {
    render(
      <ImageUploadDropzone 
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('プロフィール画像をアップロード')).toBeInTheDocument();
    expect(screen.getByText('JPEGまたはPNG、WebP形式（最大5MB）')).toBeInTheDocument();
  });

  it('should handle valid file selection', async () => {
    render(
      <ImageUploadDropzone 
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    );

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/プロフィール画像をアップロード/i);
    
    await fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(expect.any(Object));
    expect(mockOnError).not.toHaveBeenCalled();
  });
});
```

### 3. Integration Tests
```typescript
// src/features/profile-image/integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileImageUploader } from './ui/components/ProfileImageUploader';
import { TestProviders } from '../../test-utils/TestProviders';

describe('Profile Image Upload Integration', () => {
  it('should complete full upload flow', async () => {
    render(
      <TestProviders>
        <ProfileImageUploader />
      </TestProviders>
    );

    // 1. ファイル選択
    const file = new File([''], 'profile.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/プロフィール画像をアップロード/i);
    
    await fireEvent.change(input, { target: { files: [file] } });
    
    // 2. プレビュー表示確認
    expect(screen.getByText('profile.jpg')).toBeInTheDocument();
    
    // 3. アップロード実行
    const uploadButton = screen.getByText('アップロード');
    fireEvent.click(uploadButton);
    
    // 4. 完了確認
    await waitFor(() => {
      expect(screen.getByText('プロフィール画像を更新しました')).toBeInTheDocument();
    });
  });
});
```

## 環境設定

### 環境変数
```env
# .env.local
NEXT_PUBLIC_MAX_IMAGE_SIZE=5242880
NEXT_PUBLIC_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
NEXT_PUBLIC_CDN_BASE_URL=http://localhost:8080
```

### 依存関係
```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3"
  }
}
```

## パフォーマンス最適化

### 1. 画像最適化
- WebP形式の優先使用
- 適切なサイズ制限
- プログレッシブJPEG

### 2. メモリ管理
- Preview URLのクリーンアップ
- 大きな画像ファイルの効率的な処理

### 3. UXの改善
- プログレス表示
- エラーハンドリング
- レスポンシブデザイン

## セキュリティ対策

### 1. クライアントサイド検証
- ファイル形式チェック
- サイズ制限
- MIMEタイプ検証

### 2. CSP設定
```typescript
// next.config.js での Content Security Policy
const ContentSecurityPolicy = `
  img-src 'self' data: blob: https://*.r2.cloudflarestorage.com;
  connect-src 'self' https://*.r2.cloudflarestorage.com;
`;
```

### 3. エラーハンドリング
- 適切なエラーメッセージ
- センシティブ情報の隠蔽
- ログ記録

## 今後の拡張

### 1. 画像編集機能
- トリミング
- フィルター
- 明度・彩度調整

### 2. 複数画像対応
- ギャラリー機能
- 画像順序変更
- 一括アップロード

### 3. 高度な最適化
- 自動リサイズ
- 形式変換
- 圧縮率調整