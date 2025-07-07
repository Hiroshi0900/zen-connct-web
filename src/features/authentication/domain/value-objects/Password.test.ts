import { describe, it, expect } from 'vitest';
import { Password } from './Password';

describe('Password', () => {
  describe('作成', () => {
    it.each([
      ['SecurePassword123!', true, null],
      ['MyPass@word456', true, null],
      ['Test#Password789', true, null],
      ['ComplexP@ssw0rd', true, null],
      ['', false, 'Password must be at least 8 characters long'],
      ['1', false, 'Password must be at least 8 characters long'],
      ['short', false, 'Password must be at least 8 characters long'],
      ['1234567', false, 'Password must be at least 8 characters long'],
      ['lowercase123!', false, 'Password must contain at least one uppercase letter'],
      ['nouppercasehere456@', false, 'Password must contain at least one uppercase letter'],
      ['UPPERCASE123!', false, 'Password must contain at least one lowercase letter'],
      ['NOLOWERCASEHERE456@', false, 'Password must contain at least one lowercase letter'],
      ['NoNumbersHere!', false, 'Password must contain at least one number'],
      ['OnlyLetters@', false, 'Password must contain at least one number'],
      ['NoSpecialChars123', false, 'Password must contain at least one special character'],
      ['OnlyAlphaNum456', false, 'Password must contain at least one special character'],
    ] as const)('パスワード "%s" -> 成功: %s, エラー: %s', (passwordStr, shouldSucceed, expectedError) => {
      if (shouldSucceed) {
        const password = Password.create(passwordStr);
        expect(password.getValue()).toBe(passwordStr);
      } else {
        expect(() => Password.create(passwordStr)).toThrow(expectedError);
      }
    });
  });

  describe('ハッシュ化', () => {
    it('パスワードをハッシュ化できる', () => {
      // Given
      const password = Password.create('SecurePassword123!');

      // When
      const hash = password.hash();

      // Then
      expect(hash).toBeDefined();
      expect(hash).not.toBe('SecurePassword123!');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('同じパスワードでも異なるハッシュが生成される（ソルト付き）', () => {
      // Given
      const password1 = Password.create('SecurePassword123!');
      const password2 = Password.create('SecurePassword123!');

      // When
      const hash1 = password1.hash();
      const hash2 = password2.hash();

      // Then
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('検証', () => {
    it('正しいパスワードでハッシュ検証成功', () => {
      // Given
      const passwordStr = 'SecurePassword123!';
      const password = Password.create(passwordStr);
      const hash = password.hash();

      // When
      const isValid = Password.verifyHash(passwordStr, hash);

      // Then
      expect(isValid).toBe(true);
    });

    it('間違ったパスワードでハッシュ検証失敗', () => {
      // Given
      const password = Password.create('SecurePassword123!');
      const hash = password.hash();
      const wrongPassword = 'WrongPassword123!';

      // When
      const isValid = Password.verifyHash(wrongPassword, hash);

      // Then
      expect(isValid).toBe(false);
    });
  });

  describe('等価性', () => {
    it('同じパスワード文字列は等価', () => {
      // Given
      const password1 = Password.create('SecurePassword123!');
      const password2 = Password.create('SecurePassword123!');

      // When & Then
      expect(password1.equals(password2)).toBe(true);
    });

    it('異なるパスワード文字列は非等価', () => {
      // Given
      const password1 = Password.create('SecurePassword123!');
      const password2 = Password.create('DifferentPassword456@');

      // When & Then
      expect(password1.equals(password2)).toBe(false);
    });
  });
});