'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createImageFile, disposeImageFile, ImageFile } from '../../domain/ImageFile';
import { UploadProgress, UploadResult, ApiClient } from '../../application/ProfileImageUploadService';
import { CompleteUploadResponse } from '../../infrastructure/ProfileImageApiClient';

// Type definitions
export type ProfileImageUploadProps = {
  onUploadSuccess: (result: CompleteUploadResponse) => void;
  onUploadError: (error: string) => void;
  uploadService?: {
    uploadImageWithProgress: (
      imageFile: ImageFile,
      progressCallback: (progress: UploadProgress) => void
    ) => Promise<UploadResult>;
  };
  className?: string;
  disabled?: boolean;
};

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  uploadService,
  className = '',
  disabled = false
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection handler
  const handleFileSelect = useCallback((file: File) => {
    try {
      setError(null);
      const imageFile = createImageFile(file);
      setSelectedImage(imageFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ファイルの選択に失敗しました';
      setError(errorMessage);
      onUploadError(errorMessage);
    }
  }, [onUploadError]);

  // File input change handler
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Upload handler
  const handleUpload = useCallback(async () => {
    if (!selectedImage || !uploadService) return;

    try {
      setError(null);
      const result = await uploadService.uploadImageWithProgress(
        selectedImage,
        setUploadProgress
      );

      if (result.isSuccess && result.result) {
        onUploadSuccess(result.result);
        // Clean up after successful upload
        disposeImageFile(selectedImage);
        setSelectedImage(null);
        setUploadProgress(null);
      } else {
        const errorMessage = result.error || 'アップロードに失敗しました';
        setError(errorMessage);
        onUploadError(errorMessage);
        setUploadProgress(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      setError(errorMessage);
      onUploadError(errorMessage);
      setUploadProgress(null);
    }
  }, [selectedImage, uploadService, onUploadSuccess, onUploadError]);

  // Remove image handler
  const handleRemoveImage = useCallback(() => {
    if (selectedImage) {
      disposeImageFile(selectedImage);
      setSelectedImage(null);
      setError(null);
      setUploadProgress(null);
    }
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedImage]);

  // Click handler for file input
  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isUploading = uploadProgress !== null && uploadProgress !== 'success' && uploadProgress !== 'error';
  const isUploadDisabled = disabled || !selectedImage || isUploading;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-accent-teal bg-accent-teal/10' : 'border-zen-charcoal'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-teal'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileInputClick}
        role="button"
        tabIndex={0}
        aria-label="画像を選択"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="画像を選択"
        />
        
        {selectedImage ? (
          <div className="space-y-2">
            <img
              src={selectedImage.previewUrl}
              alt="プレビュー"
              className="mx-auto max-w-xs max-h-48 rounded-lg object-cover"
            />
            <p className="text-sm text-primary-light">{selectedImage.file.name}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="text-accent-coral hover:text-accent-coral/80 text-sm"
              aria-label="画像を削除"
            >
              削除
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-zen-charcoal text-4xl">📷</div>
            <p className="text-primary-light">
              ドラッグ&ドロップまたはクリックして画像を選択
            </p>
            <p className="text-sm text-zen-charcoal">
              JPEG, PNG, WebP (最大5MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-accent-coral/10 border border-accent-coral rounded-lg">
          <p className="text-accent-coral text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button and Progress */}
      {selectedImage && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploadDisabled}
            className={`
              w-full py-2 px-4 rounded-lg font-medium transition-colors
              ${isUploadDisabled
                ? 'bg-zen-charcoal text-zen-charcoal cursor-not-allowed'
                : 'bg-accent-teal text-primary-dark hover:bg-accent-teal/90'
              }
            `}
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>

          {/* Progress Indicator */}
          {uploadProgress && (
            <div className="text-center">
              <p className="text-sm text-primary-light">
                {uploadProgress === 'preparing' && '準備中...'}
                {uploadProgress === 'uploading' && 'アップロード中...'}
                {uploadProgress === 'completing' && '完了処理中...'}
                {uploadProgress === 'success' && '✅ アップロード完了'}
                {uploadProgress === 'error' && '❌ アップロード失敗'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};