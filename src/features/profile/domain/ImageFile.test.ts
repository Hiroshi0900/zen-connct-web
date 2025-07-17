import { ImageFile, createImageFile, getFileName, getMimeType, getSizeInBytes, disposeImageFile } from './ImageFile';

describe('ImageFile', () => {
  describe('fromFile', () => {
    test('Should_CreateImageFile_When_ValidJpegFileProvided', () => {
      // given
      const validFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // when
      const actual = ImageFile.fromFile(validFile);
      
      // then
      expect(actual.fileName).toBe('test.jpg');
      expect(actual.mimeType).toBe('image/jpeg');
      expect(actual.sizeInBytes).toBe(12); // 'test content'.length
      expect(actual.previewUrl).toMatch(/^blob:/);
    });

    test('Should_CreateImageFile_When_ValidPngFileProvided', () => {
      // given
      const validFile = new File(['png content'], 'test.png', { type: 'image/png' });
      
      // when
      const actual = ImageFile.fromFile(validFile);
      
      // then
      expect(actual.fileName).toBe('test.png');
      expect(actual.mimeType).toBe('image/png');
    });

    test('Should_CreateImageFile_When_ValidWebpFileProvided', () => {
      // given
      const validFile = new File(['webp content'], 'test.webp', { type: 'image/webp' });
      
      // when
      const actual = ImageFile.fromFile(validFile);
      
      // then
      expect(actual.fileName).toBe('test.webp');
      expect(actual.mimeType).toBe('image/webp');
    });

    test('Should_ThrowError_When_FileSizeExceeds5MB', () => {
      // given
      const largeContent = 'x'.repeat(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      // when & then
      expect(() => ImageFile.fromFile(largeFile)).toThrow('ファイルサイズは5MB以下にしてください');
    });

    test('Should_ThrowError_When_UnsupportedImageType', () => {
      // given
      const unsupportedFile = new File(['gif content'], 'test.gif', { type: 'image/gif' });
      
      // when & then
      expect(() => ImageFile.fromFile(unsupportedFile)).toThrow('JPEG、PNG、WebP形式の画像を選択してください');
    });

    test('Should_ThrowError_When_NonImageFileProvided', () => {
      // given
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      // when & then
      expect(() => ImageFile.fromFile(textFile)).toThrow('JPEG、PNG、WebP形式の画像を選択してください');
    });
  });

  describe('dispose', () => {
    test('Should_RevokeObjectUrl_When_DisposeCalled', () => {
      // given
      const originalRevoke = URL.revokeObjectURL;
      const mockRevoke = jest.fn();
      URL.revokeObjectURL = mockRevoke;
      
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = ImageFile.fromFile(validFile);
      
      // when
      imageFile.dispose();
      
      // then
      expect(mockRevoke).toHaveBeenCalledWith(imageFile.previewUrl);
      
      // cleanup
      URL.revokeObjectURL = originalRevoke;
    });
  });
});

// Functional approach tests
describe('ImageFile (Functional)', () => {
  describe('createImageFile', () => {
    test('Should_CreateImageFile_When_ValidJpegFileProvided', () => {
      // given
      const validFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // when
      const actual = createImageFile(validFile);
      
      // then
      expect(getFileName(actual)).toBe('test.jpg');
      expect(getMimeType(actual)).toBe('image/jpeg');
      expect(getSizeInBytes(actual)).toBe(12);
      expect(actual.previewUrl).toMatch(/^blob:/);
    });

    test('Should_ThrowError_When_FileSizeExceeds5MB', () => {
      // given
      const largeContent = 'x'.repeat(5 * 1024 * 1024 + 1);
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      // when & then
      expect(() => createImageFile(largeFile)).toThrow('ファイルサイズは5MB以下にしてください');
    });

    test('Should_ThrowError_When_UnsupportedImageType', () => {
      // given
      const unsupportedFile = new File(['gif content'], 'test.gif', { type: 'image/gif' });
      
      // when & then
      expect(() => createImageFile(unsupportedFile)).toThrow('JPEG、PNG、WebP形式の画像を選択してください');
    });
  });

  describe('accessor functions', () => {
    test('Should_ReturnCorrectValues_When_CalledWithValidImageFile', () => {
      // given
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const imageFile = createImageFile(file);
      
      // when & then
      expect(getFileName(imageFile)).toBe('test.png');
      expect(getMimeType(imageFile)).toBe('image/png');
      expect(getSizeInBytes(imageFile)).toBe(7);
    });
  });

  describe('disposeImageFile', () => {
    test('Should_RevokeObjectUrl_When_Called', () => {
      // given
      const originalRevoke = URL.revokeObjectURL;
      const mockRevoke = jest.fn();
      URL.revokeObjectURL = mockRevoke;
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const imageFile = createImageFile(file);
      
      // when
      disposeImageFile(imageFile);
      
      // then
      expect(mockRevoke).toHaveBeenCalledWith(imageFile.previewUrl);
      
      // cleanup
      URL.revokeObjectURL = originalRevoke;
    });
  });
});