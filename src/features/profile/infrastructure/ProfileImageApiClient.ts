/**
 * ProfileImageApiClient
 * Handles API communication for profile image upload operations
 * Following functional programming approach with pure functions
 */

// New simplified type definitions
export type DirectUploadResponse = {
  readonly image_url: string;
  readonly thumbnail_url: string;
  readonly file_size: number;
};

// Legacy types (kept for backward compatibility during migration)
export type UploadUrlRequest = {
  readonly filename: string;
  readonly mime_type: string;
  readonly file_size: string;
};

export type UploadUrlResponse = {
  readonly upload_url: string;
  readonly image_path: string;
  readonly expires_at: string;
};

export type CompleteUploadRequest = {
  readonly image_path: string;
  readonly bucket_name: string;
};

export type CompleteUploadResponse = {
  readonly image_url: string;
  readonly thumbnail_url: string;
  readonly file_size: number;
};

export type ApiConfig = {
  readonly baseUrl: string;
  readonly credentials: RequestCredentials;
};

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  credentials: 'include'
};

// New simplified API function
export const uploadImageDirect = async (
  file: File,
  config: ApiConfig = DEFAULT_CONFIG
): Promise<DirectUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${config.baseUrl}/users/me/profile-image`, {
    method: 'POST',
    credentials: config.credentials,
    body: formData
  });

  return handleApiResponse(response, '画像のアップロードに失敗しました');
};

// Legacy functions (kept for backward compatibility)
export const createFormDataFromRequest = (request: UploadUrlRequest): FormData => {
  const formData = new FormData();
  formData.append('filename', request.filename);
  formData.append('mime_type', request.mime_type);
  formData.append('file_size', request.file_size);
  return formData;
};

export const handleApiResponse = async <T>(response: Response, errorMessage: string): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorMessage);
  }
  return await response.json();
};

export const getUploadUrl = async (
  request: UploadUrlRequest,
  config: ApiConfig = DEFAULT_CONFIG
): Promise<UploadUrlResponse> => {
  const formData = createFormDataFromRequest(request);
  
  const response = await fetch(`${config.baseUrl}/users/me/profile-image/upload-url`, {
    method: 'POST',
    credentials: config.credentials,
    headers: {
      'Accept': 'application/json',
    },
    body: formData
  });

  return handleApiResponse(response, 'アップロードURLの取得に失敗しました');
};

export const uploadImage = async (uploadUrl: string, file: File): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!response.ok) {
    throw new Error('画像のアップロードに失敗しました');
  }
};

export const completeUpload = async (
  request: CompleteUploadRequest,
  config: ApiConfig = DEFAULT_CONFIG
): Promise<CompleteUploadResponse> => {
  const response = await fetch(`${config.baseUrl}/users/me/profile-image/complete`, {
    method: 'POST',
    credentials: config.credentials,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return handleApiResponse(response, 'アップロード完了処理に失敗しました');
};

export const uploadWithRetry = async (
  uploadUrl: string,
  file: File,
  maxRetries: number = 3
): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await uploadImage(uploadUrl, file);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Updated class with new simplified API
export class ProfileImageApiClient {
  private readonly config: ApiConfig;

  constructor(baseUrl?: string) {
    this.config = {
      baseUrl: baseUrl || DEFAULT_CONFIG.baseUrl,
      credentials: DEFAULT_CONFIG.credentials
    };
  }

  // New simplified method
  async uploadImageDirect(file: File): Promise<DirectUploadResponse> {
    return uploadImageDirect(file, this.config);
  }

  // Legacy methods (kept for backward compatibility during migration)
  async getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse> {
    return getUploadUrl(request, this.config);
  }

  async uploadImage(uploadUrl: string, file: File): Promise<void> {
    return uploadImage(uploadUrl, file);
  }

  async completeUpload(request: CompleteUploadRequest): Promise<CompleteUploadResponse> {
    return completeUpload(request, this.config);
  }

  async uploadWithRetry(uploadUrl: string, file: File, maxRetries: number = 3): Promise<void> {
    return uploadWithRetry(uploadUrl, file, maxRetries);
  }
}