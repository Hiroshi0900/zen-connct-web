import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileImageUpload } from './ProfileImageUpload';

// Mock the upload service
const mockUploadService = {
  uploadImageWithProgress: jest.fn()
};

// Mock the API client
const mockApiClient = {
  getUploadUrl: jest.fn(),
  uploadWithRetry: jest.fn(),
  completeUpload: jest.fn()
};

// Mock createImageFile
jest.mock('../../domain/ImageFile', () => ({
  createImageFile: jest.fn(),
  disposeImageFile: jest.fn()
}));

import { createImageFile, disposeImageFile } from '../../domain/ImageFile';

describe('ProfileImageUpload', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createImageFile as jest.Mock).mockImplementation((file: File) => ({
      file,
      previewUrl: `blob:${file.name}`
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('File Selection', () => {
    test('Should_DisplayFileInput_When_ComponentRendered', () => {
      // given & when
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);

      // then
      expect(screen.getByLabelText(/画像を選択/)).toBeInTheDocument();
      expect(screen.getByText(/ドラッグ&ドロップまたはクリックして画像を選択/)).toBeInTheDocument();
    });

    test('Should_DisplayPreview_When_ValidImageSelected', async () => {
      // given
      const user = userEvent.setup();
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, file);

      // then
      await waitFor(() => {
        expect(screen.getByAltText('プレビュー')).toBeInTheDocument();
        expect(screen.getByAltText('プレビュー')).toHaveAttribute('src', 'blob:test.jpg');
      });
    });

    test('Should_ShowError_When_InvalidFileSelected', async () => {
      // given
      const user = userEvent.setup();
      (createImageFile as jest.Mock).mockImplementation(() => {
        throw new Error('JPEG、PNG、WebP形式の画像を選択してください');
      });
      
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, invalidFile);

      // then
      await waitFor(() => {
        expect(screen.getByText(/JPEG、PNG、WebP形式の画像を選択してください/)).toBeInTheDocument();
      });
      expect(mockOnUploadError).toHaveBeenCalledWith('JPEG、PNG、WebP形式の画像を選択してください');
    });

    test('Should_ShowError_When_FileSizeExceedsLimit', async () => {
      // given
      const user = userEvent.setup();
      (createImageFile as jest.Mock).mockImplementation(() => {
        throw new Error('ファイルサイズは5MB以下にしてください');
      });
      
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, largeFile);

      // then
      await waitFor(() => {
        expect(screen.getByText(/ファイルサイズは5MB以下にしてください/)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    test('Should_HandleDragEnter_When_DraggedOver', () => {
      // given
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      const dropZone = screen.getByText(/ドラッグ&ドロップまたはクリックして画像を選択/).parentElement;

      // when
      fireEvent.dragEnter(dropZone!);

      // then
      expect(dropZone).toHaveClass('border-accent-teal');
    });

    test('Should_HandleDrop_When_ValidFileDropped', async () => {
      // given
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      const dropZone = screen.getByText(/ドラッグ&ドロップまたはクリックして画像を選択/).parentElement;
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      });

      // when
      fireEvent(dropZone!, dropEvent);

      // then
      await waitFor(() => {
        expect(createImageFile).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('Upload Process', () => {
    test('Should_ShowProgressIndicator_During_Upload', async () => {
      // given
      const user = userEvent.setup();
      mockUploadService.uploadImageWithProgress.mockImplementation(
        (imageFile: any, progressCallback: (progress: string) => void) => {
          progressCallback('uploading');
          return Promise.resolve({ isSuccess: true, result: { image_url: 'http://example.com/image.jpg' } });
        }
      );

      render(
        <ProfileImageUpload 
          onUploadSuccess={mockOnUploadSuccess} 
          onUploadError={mockOnUploadError}
          uploadService={mockUploadService}
        />
      );
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, file);
      const uploadButton = screen.getByText('アップロード');
      await user.click(uploadButton);

      // then
      await waitFor(() => {
        expect(screen.getByText(/アップロード中/)).toBeInTheDocument();
      });
    });

    test('Should_CallOnUploadSuccess_When_UploadCompletes', async () => {
      // given
      const user = userEvent.setup();
      const successResult = {
        isSuccess: true,
        result: {
          image_url: 'https://cdn.example.com/test.jpg',
          thumbnail_url: 'https://cdn.example.com/test_thumb.jpg',
          file_size: 1024
        },
        error: null
      };

      mockUploadService.uploadImageWithProgress.mockResolvedValue(successResult);

      render(
        <ProfileImageUpload 
          onUploadSuccess={mockOnUploadSuccess} 
          onUploadError={mockOnUploadError}
          uploadService={mockUploadService}
        />
      );
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, file);
      const uploadButton = screen.getByText('アップロード');
      await user.click(uploadButton);

      // then
      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith(successResult.result);
      });
    });

    test('Should_CallOnUploadError_When_UploadFails', async () => {
      // given
      const user = userEvent.setup();
      const errorResult = {
        isSuccess: false,
        result: null,
        error: 'Network error'
      };

      mockUploadService.uploadImageWithProgress.mockResolvedValue(errorResult);

      render(
        <ProfileImageUpload 
          onUploadSuccess={mockOnUploadSuccess} 
          onUploadError={mockOnUploadError}
          uploadService={mockUploadService}
        />
      );
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      // when
      await user.upload(input, file);
      const uploadButton = screen.getByText('アップロード');
      await user.click(uploadButton);

      // then
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Remove Image', () => {
    test('Should_RemovePreview_When_RemoveButtonClicked', async () => {
      // given
      const user = userEvent.setup();
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/画像を選択/) as HTMLInputElement;

      await user.upload(input, file);
      await waitFor(() => expect(screen.getByAltText('プレビュー')).toBeInTheDocument());

      // when
      const removeButton = screen.getByLabelText('画像を削除');
      await user.click(removeButton);

      // then
      await waitFor(() => {
        expect(screen.queryByAltText('プレビュー')).not.toBeInTheDocument();
      });
      expect(disposeImageFile).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('Should_HaveProperAriaLabels_When_Rendered', () => {
      // given & when
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);

      // then
      expect(screen.getByLabelText('画像を選択')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /画像を選択/ })).toBeInTheDocument();
    });

    test('Should_SupportKeyboardNavigation_When_Focused', async () => {
      // given
      const user = userEvent.setup();
      render(<ProfileImageUpload onUploadSuccess={mockOnUploadSuccess} onUploadError={mockOnUploadError} />);
      
      const fileInput = screen.getByLabelText('画像を選択');

      // when
      await user.tab();

      // then
      expect(fileInput).toHaveFocus();
    });
  });
});