import { describe, it, expect } from 'vitest';
import { maskSecrets, __testing__ } from './LogMasking';

const { maskEmail, isSensitiveField } = __testing__;

describe('LogMasking', () => {
  describe('maskEmail', () => {
    it.each([
      ['user@example.com', 'use***@example.com'],
      ['test@domain.org', 'tes***@domain.org'],
      ['a@b.com', 'a***@b.com'],
      ['ab@c.com', 'ab***@c.com'],
      ['long.email.name@example.com', 'lon***@example.com'],
    ] as const)('メールアドレス "%s" を "%s" にマスキング', (input, expected) => {
      // When
      const result = maskEmail(input);
      
      // Then
      expect(result).toBe(expected);
    });

    it('不正なメールアドレスはそのまま返す', () => {
      // Given
      const invalidEmail = 'not-an-email';
      
      // When
      const result = maskEmail(invalidEmail);
      
      // Then
      expect(result).toBe(invalidEmail);
    });
  });

  describe('isSensitiveField', () => {
    it.each([
      ['password', true],
      ['userPassword', true],
      ['PASSWORD', true],
      ['token', true],
      ['accessToken', true],
      ['authToken', true],
      ['secret', true],
      ['apiSecret', true],
      ['jwt', true],
      ['authorization', true],
      ['session', true],
      ['cookie', true],
      ['ssn', true],
      ['creditCard', true],
      ['cardNumber', true],
      ['cvv', true],
      ['pin', true],
      ['username', false],
      ['email', false],
      ['name', false],
      ['id', false],
      ['title', false],
    ] as const)('フィールド "%s" の機密性判定: %s', (fieldName, expected) => {
      // When
      const result = isSensitiveField(fieldName);
      
      // Then
      expect(result).toBe(expected);
    });
  });

  describe('maskSecrets', () => {
    it('機密フィールドをマスキングする', () => {
      // Given
      const data = {
        username: 'john_doe',
        password: 'secret123',
        email: 'john@example.com',
        token: 'abc123def456',
        metadata: {
          sessionId: 'session123',
          userAgent: 'Mozilla/5.0'
        }
      };

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toEqual({
        username: 'john_doe',
        password: '***',
        email: 'joh***@example.com',
        token: '***',
        metadata: {
          sessionId: '***',
          userAgent: 'Mozilla/5.0'
        }
      });
    });

    it('配列内のオブジェクトもマスキングする', () => {
      // Given
      const data = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' }
        ]
      };

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toEqual({
        users: [
          { name: 'John', password: '***' },
          { name: 'Jane', password: '***' }
        ]
      });
    });

    it('エラーオブジェクトを安全にマスキングする', () => {
      // Given
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      const data = {
        error,
        message: 'Something went wrong'
      };

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toEqual({
        error: {
          name: 'Error',
          message: 'Test error',
          stack: '[Stack Trace]'
        },
        message: 'Something went wrong'
      });
    });

    it('プリミティブ値をそのまま返す', () => {
      // Given & When & Then
      expect(maskSecrets('string')).toBe('string');
      expect(maskSecrets(123)).toBe(123);
      expect(maskSecrets(true)).toBe(true);
      expect(maskSecrets(null)).toBe(null);
      expect(maskSecrets(undefined)).toBe(undefined);
    });

    it('Date オブジェクトをそのまま返す', () => {
      // Given
      const date = new Date('2023-01-01');
      
      // When
      const result = maskSecrets(date);
      
      // Then
      expect(result).toBe(date);
    });

    it('Base64形式のトークンをマスキングする', () => {
      // Given
      const data = {
        regularString: 'hello world',
        base64Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      };

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toEqual({
        regularString: 'hello world',
        base64Token: '***'
      });
    });

    it('Bearer トークンをマスキングする', () => {
      // Given
      const data = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9',
        normalValue: 'Bearer of good news'
      };

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toEqual({
        authorization: '***',
        normalValue: '***' // この場合もマスキングされる（Bearer で始まるため）
      });
    });

    it('深いネストでも循環参照を防ぐ', () => {
      // Given
      const data: any = { level: 0 };
      let current = data;
      
      // 11レベルの深いネストを作成
      for (let i = 1; i <= 11; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      // When
      const result = maskSecrets(data);

      // Then
      expect(result).toBeDefined();
      // 10レベルまでは処理される
      expect(result.nested.nested.nested.nested.nested.nested.nested.nested.nested.nested).toBe('[Max Depth Reached]');
    });

    it('マスキング処理でエラーが発生した場合は安全な値を返す', () => {
      // Given
      const problematicData = {
        get problem() {
          throw new Error('Property access error');
        }
      };

      // When
      const result = maskSecrets(problematicData);

      // Then
      expect(result).toBe('[Masking Error]');
    });
  });
});