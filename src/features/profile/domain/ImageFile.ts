/**
 * ImageFile Value Object
 * Represents an image file with validation rules
 * Following functional programming approach with immutable data structures
 */

// Type definitions
export type ImageFile = {
  readonly file: File;
  readonly previewUrl: string;
};

// Constants
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Validation functions
const validateFileSize = (file: File): void => {
  if (file.size > MAX_SIZE) {
    throw new Error('ファイルサイズは5MB以下にしてください');
  }
};

const validateFileType = (file: File): void => {
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    throw new Error('JPEG、PNG、WebP形式の画像を選択してください');
  }
};

// Factory function
export const createImageFile = (file: File): ImageFile => {
  validateFileSize(file);
  validateFileType(file);
  
  const previewUrl = URL.createObjectURL(file);
  return {
    file,
    previewUrl,
  };
};

// Accessor functions
export const getFileName = (imageFile: ImageFile): string => imageFile.file.name;
export const getMimeType = (imageFile: ImageFile): string => imageFile.file.type;
export const getSizeInBytes = (imageFile: ImageFile): number => imageFile.file.size;

// Resource management
export const disposeImageFile = (imageFile: ImageFile): void => {
  URL.revokeObjectURL(imageFile.previewUrl);
};

// Legacy class wrapper for backward compatibility (remove after full migration)
export class ImageFile {
  constructor(
    public readonly file: File,
    public readonly previewUrl: string
  ) {}

  get fileName(): string {
    return this.file.name;
  }

  get mimeType(): string {
    return this.file.type;
  }

  get sizeInBytes(): number {
    return this.file.size;
  }

  static fromFile(file: File): ImageFile {
    const functionalImageFile = createImageFile(file);
    return new ImageFile(functionalImageFile.file, functionalImageFile.previewUrl);
  }

  dispose(): void {
    disposeImageFile(this);
  }
}