import { describe, it, expect } from 'vitest';
import { Email } from './Email';

describe('Email', () => {
  describe('作成', () => {
    it.each([
      ['user@example.com', true, 'user@example.com'],
      ['test.email+tag@domain.co.jp', true, 'test.email+tag@domain.co.jp'],
      ['user_name@sub.domain.org', true, 'user_name@sub.domain.org'],
      ['a@b.co', true, 'a@b.co'],
      ['USER@EXAMPLE.COM', true, 'user@example.com'],
      ['', false, 'Email cannot be empty'],
      ['   ', false, 'Email cannot be empty'],
      ['invalid', false, 'Invalid email format'],
      ['@domain.com', false, 'Invalid email format'],
      ['user@', false, 'Invalid email format'],
      ['user@@domain.com', false, 'Invalid email format'],
      ['user..name@domain.com', false, 'Invalid email format'],
      ['user@domain', false, 'Invalid email format'],
      ['user@.com', false, 'Invalid email format'],
      ['user@domain..com', false, 'Invalid email format'],
    ] as const)('メール "%s" -> 成功: %s, 期待値: %s', (emailStr, shouldSucceed, expected) => {
      if (shouldSucceed) {
        const email = Email.create(emailStr);
        expect(email.getValue()).toBe(expected);
      } else {
        expect(() => Email.create(emailStr)).toThrow(expected);
      }
    });
  });

  describe('等価性', () => {
    it('同じメールアドレスは等価', () => {
      // Given
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');

      // When & Then
      expect(email1.equals(email2)).toBe(true);
    });

    it('大文字小文字の違いは等価', () => {
      // Given
      const email1 = Email.create('User@Example.COM');
      const email2 = Email.create('user@example.com');

      // When & Then
      expect(email1.equals(email2)).toBe(true);
    });

    it('異なるメールアドレスは非等価', () => {
      // Given
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');

      // When & Then
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('文字列表現', () => {
    it('toString()でメールアドレスを取得できる', () => {
      // Given
      const emailStr = 'user@example.com';
      const email = Email.create(emailStr);

      // When
      const result = email.toString();

      // Then
      expect(result).toBe(emailStr);
    });
  });
});