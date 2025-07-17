/**
 * ProfileImageUploadService
 * Use case for profile image upload operations
 * Following functional programming approach in application layer
 */

import { ImageFile, getFileName, getMimeType, getSizeInBytes } from '../domain/ImageFile';
import { 
  DirectUploadResponse,
  UploadUrlRequest, 
  UploadUrlResponse, 
  CompleteUploadRequest, 
  CompleteUploadResponse 
} from '../infrastructure/ProfileImageApiClient';

// Type definitions
export type UploadResult = {
  readonly isSuccess: boolean;
  readonly result: DirectUploadResponse | null;
  readonly error: string | null;
};

// Legacy type for backward compatibility
export type LegacyUploadResult = {
  readonly isSuccess: boolean;
  readonly result: CompleteUploadResponse | null;
  readonly error: string | null;
};

export type UploadProgress = 'preparing' | 'uploading' | 'completing' | 'success' | 'error';

export type ProgressCallback = (progress: UploadProgress) => void;

export type ApiClient = {
  // New simplified method
  uploadImageDirect(file: File): Promise<DirectUploadResponse>;
  // Legacy methods (kept for backward compatibility)
  getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse>;
  uploadWithRetry(uploadUrl: string, file: File, maxRetries?: number): Promise<void>;
  completeUpload(request: CompleteUploadRequest): Promise<CompleteUploadResponse>;
};

// Pure functions for request creation
export const createUploadRequest = (imageFile: ImageFile): UploadUrlRequest => ({
  filename: getFileName(imageFile),
  mime_type: getMimeType(imageFile),
  file_size: getSizeInBytes(imageFile).toString()
});

export const createCompleteRequest = (imagePath: string): CompleteUploadRequest => ({
  image_path: imagePath,
  bucket_name: 'profile-images'
});

// New simplified upload logic
export const uploadImage = async (
  imageFile: ImageFile,
  apiClient: ApiClient
): Promise<UploadResult> => {
  try {
    // Single step: Direct upload to backend
    const result = await apiClient.uploadImageDirect(imageFile.file);

    return {
      isSuccess: true,
      result,
      error: null
    };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Legacy 3-step upload logic (kept for backward compatibility)
export const uploadImageLegacy = async (
  imageFile: ImageFile,
  apiClient: ApiClient
): Promise<LegacyUploadResult> => {
  try {
    // Step 1: Get upload URL
    const uploadRequest = createUploadRequest(imageFile);
    const uploadUrlResponse = await apiClient.getUploadUrl(uploadRequest);

    // Step 2: Upload image to storage
    await apiClient.uploadWithRetry(uploadUrlResponse.upload_url, imageFile.file, 3);

    // Step 3: Complete upload notification
    const completeRequest = createCompleteRequest(uploadUrlResponse.image_path);
    const completeResponse = await apiClient.completeUpload(completeRequest);

    return {
      isSuccess: true,
      result: completeResponse,
      error: null
    };
  } catch (error) {
    return {
      isSuccess: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// New simplified upload with progress tracking
export const uploadImageWithProgress = async (
  imageFile: ImageFile,
  apiClient: ApiClient,
  progressCallback: ProgressCallback
): Promise<UploadResult> => {
  try {
    progressCallback('preparing');
    progressCallback('uploading');
    
    // Single step: Direct upload to backend
    const result = await apiClient.uploadImageDirect(imageFile.file);

    progressCallback('success');
    return {
      isSuccess: true,
      result,
      error: null
    };
  } catch (error) {
    progressCallback('error');
    return {
      isSuccess: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Legacy upload with progress tracking
export const uploadImageWithProgressLegacy = async (
  imageFile: ImageFile,
  apiClient: ApiClient,
  progressCallback: ProgressCallback
): Promise<LegacyUploadResult> => {
  try {
    progressCallback('preparing');
    const uploadRequest = createUploadRequest(imageFile);
    const uploadUrlResponse = await apiClient.getUploadUrl(uploadRequest);

    progressCallback('uploading');
    await apiClient.uploadWithRetry(uploadUrlResponse.upload_url, imageFile.file, 3);

    progressCallback('completing');
    const completeRequest = createCompleteRequest(uploadUrlResponse.image_path);
    const completeResponse = await apiClient.completeUpload(completeRequest);

    progressCallback('success');
    return {
      isSuccess: true,
      result: completeResponse,
      error: null
    };
  } catch (error) {
    progressCallback('error');
    return {
      isSuccess: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Legacy class wrapper for backward compatibility
export class ProfileImageUploadService {
  constructor(private readonly apiClient: ApiClient) {}

  async uploadImage(imageFile: ImageFile): Promise<UploadResult> {
    return uploadImage(imageFile, this.apiClient);
  }

  async uploadImageWithProgress(
    imageFile: ImageFile,
    progressCallback: ProgressCallback
  ): Promise<UploadResult> {
    return uploadImageWithProgress(imageFile, this.apiClient, progressCallback);
  }

  createUploadRequest(imageFile: ImageFile): UploadUrlRequest {
    return createUploadRequest(imageFile);
  }

  createCompleteRequest(imagePath: string): CompleteUploadRequest {
    return createCompleteRequest(imagePath);
  }
}