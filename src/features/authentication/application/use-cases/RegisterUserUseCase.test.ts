import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { createUser, getUserEmail, type User } from '../../domain/entities/User';

// モックインターフェース
interface MockUserRepository {
  findByEmail: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };
    useCase = new RegisterUserUseCase(mockUserRepository as any);
  });

  describe('execute', () => {
    it('新規ユーザー登録が成功する', async () => {
      // Given
      const email = 'user@example.com';
      const password = 'SecurePassword123!';
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.user).toBeDefined();
      expect(getUserEmail(result.user!).getValue()).toBe(email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ _tag: expect.any(String) })
      );
    });

    it('既に存在するメールアドレスでエラーが発生する', async () => {
      // Given
      const email = 'existing@example.com';
      const password = 'SecurePassword123!';
      
      const existingUser = createUser(
        Email.create(email),
        Password.create(password)
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Email already exists');
      expect(result.user).toBeNull();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('無効なメールアドレスでエラーが発生する', async () => {
      // Given
      const email = 'invalid-email';
      const password = 'SecurePassword123!';

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Invalid email format');
      expect(result.user).toBeNull();
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('無効なパスワードでエラーが発生する', async () => {
      // Given
      const email = 'user@example.com';
      const password = 'weak';

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
      expect(result.user).toBeNull();
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('リポジトリエラーが適切に処理される', async () => {
      // Given
      const email = 'user@example.com';
      const password = 'SecurePassword123!';
      
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.user).toBeNull();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});