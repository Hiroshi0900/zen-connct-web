import { 
  ProfileImageUploadService, 
  UploadResult, 
  uploadImage,
  uploadImageWithProgress,
  createUploadRequest,
  createCompleteRequest 
} from './ProfileImageUploadService';
import { createImageFile, ImageFile } from '../domain/ImageFile';
import { UploadUrlRequest, UploadUrlResponse, CompleteUploadRequest, CompleteUploadResponse } from '../infrastructure/ProfileImageApiClient';

// Mock the API client
const mockApiClient = {
  getUploadUrl: jest.fn(),
  uploadImage: jest.fn(),
  completeUpload: jest.fn(),
  uploadWithRetry: jest.fn()
};

describe('ProfileImageUploadService', () => {
  let service: ProfileImageUploadService;
  
  beforeEach(() => {
    service = new ProfileImageUploadService(mockApiClient);
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('Should_ReturnSuccessResult_When_ValidImageFileProvided', async () => {
      // given
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };
      
      const completeUploadResponse: CompleteUploadResponse = {
        image_url: 'https://cdn.example.com/users/user-123/test.jpg',
        thumbnail_url: 'https://cdn.example.com/users/user-123/test_thumb.jpg',
        file_size: 12
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockResolvedValue(undefined);
      mockApiClient.completeUpload.mockResolvedValue(completeUploadResponse);

      // when
      const actual = await service.uploadImage(imageFile);

      // then
      expect(actual.isSuccess).toBe(true);
      expect(actual.result).toEqual(completeUploadResponse);
      expect(actual.error).toBeNull();
      
      expect(mockApiClient.getUploadUrl).toHaveBeenCalledWith({
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: '12'
      });
      expect(mockApiClient.uploadWithRetry).toHaveBeenCalledWith(uploadUrlResponse.upload_url, file, 3);
      expect(mockApiClient.completeUpload).toHaveBeenCalledWith({
        image_path: uploadUrlResponse.image_path,
        bucket_name: 'profile-images'
      });
    });

    test('Should_ReturnFailureResult_When_GetUploadUrlFails', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      mockApiClient.getUploadUrl.mockRejectedValue(new Error('Upload URL generation failed'));

      // when
      const actual = await service.uploadImage(imageFile);

      // then
      expect(actual.isSuccess).toBe(false);
      expect(actual.result).toBeNull();
      expect(actual.error).toBe('Upload URL generation failed');
      expect(mockApiClient.uploadWithRetry).not.toHaveBeenCalled();
      expect(mockApiClient.completeUpload).not.toHaveBeenCalled();
    });

    test('Should_ReturnFailureResult_When_ImageUploadFails', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockRejectedValue(new Error('Image upload failed'));

      // when
      const actual = await service.uploadImage(imageFile);

      // then
      expect(actual.isSuccess).toBe(false);
      expect(actual.result).toBeNull();
      expect(actual.error).toBe('Image upload failed');
      expect(mockApiClient.completeUpload).not.toHaveBeenCalled();
    });

    test('Should_ReturnFailureResult_When_CompleteUploadFails', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockResolvedValue(undefined);
      mockApiClient.completeUpload.mockRejectedValue(new Error('Complete upload failed'));

      // when
      const actual = await service.uploadImage(imageFile);

      // then
      expect(actual.isSuccess).toBe(false);
      expect(actual.result).toBeNull();
      expect(actual.error).toBe('Complete upload failed');
    });
  });

  describe('uploadImageWithProgress', () => {
    test('Should_CallProgressCallback_During_Upload', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      const progressCallback = jest.fn();
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };
      
      const completeUploadResponse: CompleteUploadResponse = {
        image_url: 'https://cdn.example.com/users/user-123/test.jpg',
        thumbnail_url: 'https://cdn.example.com/users/user-123/test_thumb.jpg',
        file_size: 4
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockResolvedValue(undefined);
      mockApiClient.completeUpload.mockResolvedValue(completeUploadResponse);

      // when
      const actual = await service.uploadImageWithProgress(imageFile, progressCallback);

      // then
      expect(actual.isSuccess).toBe(true);
      expect(progressCallback).toHaveBeenCalledWith('preparing');
      expect(progressCallback).toHaveBeenCalledWith('uploading');
      expect(progressCallback).toHaveBeenCalledWith('completing');
      expect(progressCallback).toHaveBeenCalledWith('success');
    });

    test('Should_CallProgressCallback_With_Error_When_UploadFails', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      const progressCallback = jest.fn();

      mockApiClient.getUploadUrl.mockRejectedValue(new Error('Network error'));

      // when
      const actual = await service.uploadImageWithProgress(imageFile, progressCallback);

      // then
      expect(actual.isSuccess).toBe(false);
      expect(progressCallback).toHaveBeenCalledWith('preparing');
      expect(progressCallback).toHaveBeenCalledWith('error');
    });
  });
});

// Functional approach tests
describe('ProfileImageUploadService (Functional)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUploadRequest', () => {
    test('Should_CreateCorrectRequest_When_ValidImageFileProvided', () => {
      // given
      const file = new File(['content'], 'profile.png', { type: 'image/png' });
      const imageFile = createImageFile(file);

      // when
      const actual = createUploadRequest(imageFile);

      // then
      expect(actual.filename).toBe('profile.png');
      expect(actual.mime_type).toBe('image/png');
      expect(actual.file_size).toBe('7');
    });
  });

  describe('createCompleteRequest', () => {
    test('Should_CreateCorrectRequest_When_ValidImagePathProvided', () => {
      // given
      const imagePath = 'users/user-123/profile.jpg';

      // when
      const actual = createCompleteRequest(imagePath);

      // then
      expect(actual.image_path).toBe(imagePath);
      expect(actual.bucket_name).toBe('profile-images');
    });
  });

  describe('uploadImage (functional)', () => {
    test('Should_ReturnSuccessResult_When_ValidImageFileProvided', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };
      
      const completeUploadResponse: CompleteUploadResponse = {
        image_url: 'https://cdn.example.com/users/user-123/test.jpg',
        thumbnail_url: 'https://cdn.example.com/users/user-123/test_thumb.jpg',
        file_size: 4
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockResolvedValue(undefined);
      mockApiClient.completeUpload.mockResolvedValue(completeUploadResponse);

      // when
      const actual = await uploadImage(imageFile, mockApiClient);

      // then
      expect(actual.isSuccess).toBe(true);
      expect(actual.result).toEqual(completeUploadResponse);
      expect(actual.error).toBeNull();
    });
  });

  describe('uploadImageWithProgress (functional)', () => {
    test('Should_CallProgressCallback_During_Upload', async () => {
      // given
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      const progressCallback = jest.fn();
      
      const uploadUrlResponse: UploadUrlResponse = {
        upload_url: 'https://presigned-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };
      
      const completeUploadResponse: CompleteUploadResponse = {
        image_url: 'https://cdn.example.com/users/user-123/test.jpg',
        thumbnail_url: 'https://cdn.example.com/users/user-123/test_thumb.jpg',
        file_size: 4
      };

      mockApiClient.getUploadUrl.mockResolvedValue(uploadUrlResponse);
      mockApiClient.uploadWithRetry.mockResolvedValue(undefined);
      mockApiClient.completeUpload.mockResolvedValue(completeUploadResponse);

      // when
      const actual = await uploadImageWithProgress(imageFile, mockApiClient, progressCallback);

      // then
      expect(actual.isSuccess).toBe(true);
      expect(progressCallback).toHaveBeenCalledWith('preparing');
      expect(progressCallback).toHaveBeenCalledWith('uploading');
      expect(progressCallback).toHaveBeenCalledWith('completing');
      expect(progressCallback).toHaveBeenCalledWith('success');
    });
  });
});