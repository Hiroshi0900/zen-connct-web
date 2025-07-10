import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUserUseCase } from './LoginUserUseCase';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { createUser, getUserEmail } from '../../domain/entities/User';

// モックインターフェース
interface MockUserRepository {
  findByEmail: ReturnType<typeof vi.fn>;
}

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
    };
    useCase = new LoginUserUseCase(mockUserRepository as MockUserRepository & { findByEmail: jest.Mock });
  });

  describe('execute', () => {
    it('正しい認証情報でログイン成功', async () => {
      // Given
      const email = 'user@example.com';
      const password = 'SecurePassword123!';
      
      const existingUser = createUser(
        Email.create(email),
        Password.create(password)
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(true);
      expect(result.user).toBeDefined();
      expect(getUserEmail(result.user!).getValue()).toBe(email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      );
    });

    it('存在しないメールアドレスでログイン失敗', async () => {
      // Given
      const email = 'nonexistent@example.com';
      const password = 'SecurePassword123!';
      
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // When
      const result = await useCase.execute({ email, password });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.user).toBeNull();
    });

    it('間違ったパスワードでログイン失敗', async () => {
      // Given
      const email = 'user@example.com';
      const correctPassword = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword123!';
      
      const existingUser = createUser(
        Email.create(email),
        Password.create(correctPassword)
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // When
      const result = await useCase.execute({ 
        email, 
        password: wrongPassword 
      });

      // Then
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.user).toBeNull();
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
    });
  });
});