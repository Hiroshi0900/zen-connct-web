import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from './InMemoryUserRepository';
import { createUser, verifyEmail, getUserId, getUserEmail, isEmailVerified } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('save', () => {
    it('ユーザーを保存できる', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);

      // When
      await repository.save(user);

      // Then
      const savedUser = await repository.findById(getUserId(user));
      expect(savedUser).toBeDefined();
      expect(getUserId(savedUser!)).toBe(getUserId(user));
      expect(getUserEmail(savedUser!).getValue()).toBe(email.getValue());
    });

    it('既存ユーザーを上書きできる', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      let user = createUser(email, password);
      
      await repository.save(user);
      
      // メール認証を実行
      user = verifyEmail(user);

      // When
      await repository.save(user);

      // Then
      const savedUser = await repository.findById(getUserId(user));
      expect(isEmailVerified(savedUser!)).toBe(true);
    });
  });

  describe('findById', () => {
    it('IDでユーザーを見つけることができる', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);
      await repository.save(user);

      // When
      const foundUser = await repository.findById(getUserId(user));

      // Then
      expect(foundUser).toBeDefined();
      expect(getUserId(foundUser!)).toBe(getUserId(user));
      expect(getUserEmail(foundUser!).getValue()).toBe(email.getValue());
    });

    it('存在しないIDの場合nullを返す', async () => {
      // Given
      const nonExistentId = 'non-existent-id';

      // When
      const foundUser = await repository.findById(nonExistentId);

      // Then
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('メールアドレスでユーザーを見つけることができる', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);
      await repository.save(user);

      // When
      const foundUser = await repository.findByEmail(email);

      // Then
      expect(foundUser).toBeDefined();
      expect(getUserId(foundUser!)).toBe(getUserId(user));
      expect(getUserEmail(foundUser!).getValue()).toBe(email.getValue());
    });

    it('存在しないメールアドレスの場合nullを返す', async () => {
      // Given
      const email = Email.create('nonexistent@example.com');

      // When
      const foundUser = await repository.findByEmail(email);

      // Then
      expect(foundUser).toBeNull();
    });

    it('大文字小文字を区別しない', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);
      await repository.save(user);

      const searchEmail = Email.create('USER@EXAMPLE.COM');

      // When
      const foundUser = await repository.findByEmail(searchEmail);

      // Then
      expect(foundUser).toBeDefined();
      expect(getUserId(foundUser!)).toBe(getUserId(user));
    });
  });

  describe('delete', () => {
    it('ユーザーを削除できる', async () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);
      await repository.save(user);

      // When
      await repository.delete(getUserId(user));

      // Then
      const deletedUser = await repository.findById(getUserId(user));
      expect(deletedUser).toBeNull();
    });

    it('存在しないIDの削除はエラーにならない', async () => {
      // Given
      const nonExistentId = 'non-existent-id';

      // When & Then
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
  });

  describe('複数ユーザー', () => {
    it('複数のユーザーを管理できる', async () => {
      // Given
      const user1 = createUser(
        Email.create('user1@example.com'),
        Password.create('SecurePassword123!')
      );
      const user2 = createUser(
        Email.create('user2@example.com'),
        Password.create('SecurePassword123!')
      );

      // When
      await repository.save(user1);
      await repository.save(user2);

      // Then
      const foundUser1 = await repository.findById(getUserId(user1));
      const foundUser2 = await repository.findById(getUserId(user2));

      expect(foundUser1).toBeDefined();
      expect(foundUser2).toBeDefined();
      expect(getUserId(foundUser1!)).toBe(getUserId(user1));
      expect(getUserId(foundUser2!)).toBe(getUserId(user2));
    });
  });
});