import { 
  ProfileImageApiClient, 
  UploadUrlRequest, 
  UploadUrlResponse, 
  CompleteUploadRequest, 
  CompleteUploadResponse,
  createFormDataFromRequest,
  getUploadUrl,
  uploadImage,
  completeUpload,
  uploadWithRetry,
  handleApiResponse
} from './ProfileImageApiClient';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ProfileImageApiClient', () => {
  let client: ProfileImageApiClient;

  beforeEach(() => {
    client = new ProfileImageApiClient();
    mockFetch.mockClear();
  });

  describe('getUploadUrl', () => {
    test('Should_ReturnUploadUrl_When_ValidImageDataProvided', async () => {
      // given
      const request: UploadUrlRequest = {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: '1024'
      };
      
      const expectedResponse: UploadUrlResponse = {
        upload_url: 'https://test-upload-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResponse)
      });

      // when
      const actual = await client.getUploadUrl(request);

      // then
      expect(actual).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith('/users/me/profile-image/upload-url', {
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData)
      });
    });

    test('Should_ThrowError_When_ServerReturnsError', async () => {
      // given
      const request: UploadUrlRequest = {
        filename: 'large.jpg',
        mime_type: 'image/jpeg',
        file_size: '6000000' // > 5MB
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'image file is too large (max: 5MB)' })
      });

      // when & then
      await expect(client.getUploadUrl(request)).rejects.toThrow('image file is too large (max: 5MB)');
    });

    test('Should_ThrowError_When_NetworkError', async () => {
      // given
      const request: UploadUrlRequest = {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: '1024'
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      // when & then
      await expect(client.getUploadUrl(request)).rejects.toThrow('Network error');
    });
  });

  describe('uploadImage', () => {
    test('Should_UploadImage_When_ValidUrlAndFileProvided', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      // when
      await client.uploadImage(uploadUrl, file);

      // then
      expect(mockFetch).toHaveBeenCalledWith(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });
    });

    test('Should_ThrowError_When_UploadFails', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403
      });

      // when & then
      await expect(client.uploadImage(uploadUrl, file)).rejects.toThrow('画像のアップロードに失敗しました');
    });
  });

  describe('completeUpload', () => {
    test('Should_ReturnImageUrls_When_ValidRequestProvided', async () => {
      // given
      const request: CompleteUploadRequest = {
        image_path: 'users/user-123/test.jpg',
        bucket_name: 'profile-images'
      };

      const expectedResponse: CompleteUploadResponse = {
        image_url: 'https://cdn.example.com/users/user-123/test.jpg',
        thumbnail_url: 'https://cdn.example.com/users/user-123/test_thumb.jpg',
        file_size: 1024
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResponse)
      });

      // when
      const actual = await client.completeUpload(request);

      // then
      expect(actual).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith('/users/me/profile-image/complete', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
    });

    test('Should_ThrowError_When_CompletionFails', async () => {
      // given
      const request: CompleteUploadRequest = {
        image_path: 'invalid/path',
        bucket_name: 'profile-images'
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'File not found' })
      });

      // when & then
      await expect(client.completeUpload(request)).rejects.toThrow('File not found');
    });
  });

  describe('uploadWithRetry', () => {
    test('Should_RetryUpload_When_NetworkErrorOccurs', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      // when
      await client.uploadWithRetry(uploadUrl, file, 2);

      // then
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('Should_ThrowError_When_MaxRetriesExceeded', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      // when & then
      await expect(client.uploadWithRetry(uploadUrl, file, 2)).rejects.toThrow('Persistent network error');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

// Functional approach tests
describe('ProfileImageApiClient (Functional)', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('createFormDataFromRequest', () => {
    test('Should_CreateFormData_When_ValidRequestProvided', () => {
      // given
      const request: UploadUrlRequest = {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: '1024'
      };

      // when
      const actual = createFormDataFromRequest(request);

      // then
      expect(actual.get('filename')).toBe('test.jpg');
      expect(actual.get('mime_type')).toBe('image/jpeg');
      expect(actual.get('file_size')).toBe('1024');
    });
  });

  describe('handleApiResponse', () => {
    test('Should_ReturnJsonData_When_ResponseIsOk', async () => {
      // given
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      } as Response;

      // when
      const actual = await handleApiResponse(mockResponse, 'Error message');

      // then
      expect(actual).toEqual({ data: 'test' });
    });

    test('Should_ThrowError_When_ResponseIsNotOk', async () => {
      // given
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Custom error' })
      } as Response;

      // when & then
      await expect(handleApiResponse(mockResponse, 'Default error')).rejects.toThrow('Custom error');
    });

    test('Should_UseDefaultError_When_NoErrorInResponse', async () => {
      // given
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({})
      } as Response;

      // when & then
      await expect(handleApiResponse(mockResponse, 'Default error')).rejects.toThrow('Default error');
    });
  });

  describe('getUploadUrl (functional)', () => {
    test('Should_ReturnUploadUrl_When_ValidRequestProvided', async () => {
      // given
      const request: UploadUrlRequest = {
        filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: '1024'
      };

      const expectedResponse: UploadUrlResponse = {
        upload_url: 'https://test-url.com',
        image_path: 'users/user-123/test.jpg',
        expires_at: '2025-07-16T12:00:00Z'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResponse)
      });

      // when
      const actual = await getUploadUrl(request);

      // then
      expect(actual).toEqual(expectedResponse);
    });
  });

  describe('uploadImage (functional)', () => {
    test('Should_UploadSuccessfully_When_ValidUrlAndFileProvided', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      // when
      await uploadImage(uploadUrl, file);

      // then
      expect(mockFetch).toHaveBeenCalledWith(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });
    });
  });

  describe('uploadWithRetry (functional)', () => {
    test('Should_SucceedOnSecondTry_When_FirstAttemptFails', async () => {
      // given
      const uploadUrl = 'https://presigned-url.com';
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        });

      // when
      await uploadWithRetry(uploadUrl, file, 2);

      // then
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});