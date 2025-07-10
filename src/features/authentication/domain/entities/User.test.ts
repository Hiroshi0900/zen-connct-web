import { describe, it, expect } from 'vitest';
import {
  createUser,
  verifyEmail,
  changePassword,
  verifyPassword,
  clearEvents,
  isVerified,
  isUnverified,
  getUserId,
  getUserEmail,
  getUserPasswordHash,
  getUserCreatedAt,
  getUserEvents,
  getVerifiedAt,
  isEmailVerified,
  fromSnapshot
} from './User';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';

describe('User (関数型)', () => {
  describe('createUser', () => {
    it('未認証ユーザーを作成できる', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');

      // When
      const user = createUser(email, password);

      // Then
      expect(user._tag).toBe('UnverifiedUser');
      expect(getUserId(user)).toBeDefined();
      expect(getUserEmail(user)).toBe(email);
      expect(getUserPasswordHash(user)).toBeDefined();
      expect(getUserPasswordHash(user)).not.toBe('SecurePassword123!');
      expect(getUserCreatedAt(user)).toBeDefined();
      expect(getUserEvents(user)).toHaveLength(1);
      expect(getUserEvents(user)[0].eventName).toBe('UserRegistered');
      expect(isUnverified(user)).toBe(true);
      expect(isVerified(user)).toBe(false);
      expect(isEmailVerified(user)).toBe(false);
    });

    it('作成時のイベントが正しく設定される', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');

      // When
      const user = createUser(email, password);
      const events = getUserEvents(user);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('UserRegistered');
      expect(events[0].aggregateId).toBe(getUserId(user));
    });
  });

  describe('verifyEmail', () => {
    it('未認証ユーザーを認証済みに変換できる', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const unverifiedUser = createUser(email, password);

      // When
      const verifiedUser = verifyEmail(unverifiedUser);

      // Then
      expect(verifiedUser._tag).toBe('VerifiedUser');
      expect(getUserId(verifiedUser)).toBe(getUserId(unverifiedUser));
      expect(getUserEmail(verifiedUser)).toBe(getUserEmail(unverifiedUser));
      expect(isVerified(verifiedUser)).toBe(true);
      expect(isUnverified(verifiedUser)).toBe(false);
      expect(isEmailVerified(verifiedUser)).toBe(true);
      expect(getVerifiedAt(verifiedUser)).toBeDefined();
      expect(getUserEvents(verifiedUser)).toHaveLength(2);
      expect(getUserEvents(verifiedUser)[1].eventName).toBe('EmailVerified');
    });

    it('元のユーザーオブジェクトは変更されない（不変性）', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const originalUser = createUser(email, password);
      const originalEventsLength = getUserEvents(originalUser).length;

      // When
      const verifiedUser = verifyEmail(originalUser);

      // Then
      expect(originalUser._tag).toBe('UnverifiedUser');
      expect(getUserEvents(originalUser)).toHaveLength(originalEventsLength);
      expect(verifiedUser).not.toBe(originalUser);
    });
  });

  describe('changePassword', () => {
    it('未認証ユーザーのパスワードを変更できる', () => {
      // Given
      const email = Email.create('user@example.com');
      const oldPassword = Password.create('OldPassword123!');
      const newPassword = Password.create('NewPassword123!');
      const user = createUser(email, oldPassword);

      // When
      const updatedUser = changePassword(user, newPassword);

      // Then
      expect(updatedUser._tag).toBe('UnverifiedUser');
      expect(verifyPassword(updatedUser, newPassword)).toBe(true);
      expect(verifyPassword(updatedUser, oldPassword)).toBe(false);
      expect(getUserEvents(updatedUser)).toHaveLength(2);
      expect(getUserEvents(updatedUser)[1].eventName).toBe('PasswordChanged');
    });

    it('認証済みユーザーのパスワードを変更できる', () => {
      // Given
      const email = Email.create('user@example.com');
      const oldPassword = Password.create('OldPassword123!');
      const newPassword = Password.create('NewPassword123!');
      const unverifiedUser = createUser(email, oldPassword);
      const verifiedUser = verifyEmail(unverifiedUser);

      // When
      const updatedUser = changePassword(verifiedUser, newPassword);

      // Then
      expect(updatedUser._tag).toBe('VerifiedUser');
      expect(verifyPassword(updatedUser, newPassword)).toBe(true);
      expect(verifyPassword(updatedUser, oldPassword)).toBe(false);
      expect(getUserEvents(updatedUser)).toHaveLength(3);
      expect(getUserEvents(updatedUser)[2].eventName).toBe('PasswordChanged');
    });

    it('元のユーザーオブジェクトは変更されない（不変性）', () => {
      // Given
      const email = Email.create('user@example.com');
      const oldPassword = Password.create('OldPassword123!');
      const newPassword = Password.create('NewPassword123!');
      const originalUser = createUser(email, oldPassword);
      const originalPasswordHash = getUserPasswordHash(originalUser);

      // When
      const updatedUser = changePassword(originalUser, newPassword);

      // Then
      expect(getUserPasswordHash(originalUser)).toBe(originalPasswordHash);
      expect(verifyPassword(originalUser, oldPassword)).toBe(true);
      expect(updatedUser).not.toBe(originalUser);
    });
  });

  describe('verifyPassword', () => {
    it.each([
      ['SecurePassword123!', 'SecurePassword123!', true],
      ['SecurePassword123!', 'WrongPassword123!', false],
      ['TestPassword456@', 'TestPassword456@', true],
      ['TestPassword456@', 'DifferentPassword789#', false],
    ] as const)('パスワード "%s" とチェック "%s" -> 結果: %s', (originalPassword, checkPassword, expected) => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create(originalPassword);
      const user = createUser(email, password);
      const checkPasswordObj = Password.create(checkPassword);

      // When
      const actual = verifyPassword(user, checkPasswordObj)

      // Then
      expect(actual).toBe(expected);
    });
  });

  describe('clearEvents', () => {
    it('イベントをクリアできる', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);

      // When
      const clearedUser = clearEvents(user);

      // Then
      expect(getUserEvents(clearedUser)).toHaveLength(0);
      expect(getUserEvents(user)).toHaveLength(1); // 元は変更されない
      expect(clearedUser).not.toBe(user);
    });
  });

  describe('fromSnapshot', () => {
    it.each([
      [false, 'UnverifiedUser', undefined],
      [true, 'VerifiedUser', new Date()],
    ] as const)('emailVerified: %s -> _tag: "%s"', (emailVerified, expectedTag, verifiedAt) => {
      // Given
      const id = 'test-id';
      const email = Email.create('user@example.com');
      const passwordHash = 'hashed-password';
      const createdAt = new Date();

      // When
      const user = fromSnapshot(id, email, passwordHash, emailVerified, createdAt, verifiedAt);

      // Then
      expect(user._tag).toBe(expectedTag);
      expect(getUserId(user)).toBe(id);
      expect(getUserEmail(user)).toBe(email);
      expect(getUserPasswordHash(user)).toBe(passwordHash);
      expect(getUserCreatedAt(user)).toBe(createdAt);
      
      if (expectedTag === 'UnverifiedUser') {
        expect(isUnverified(user)).toBe(true);
        expect(isVerified(user)).toBe(false);
      } else {
        expect(isVerified(user)).toBe(true);
        expect(isUnverified(user)).toBe(false);
        expect(getVerifiedAt(user as VerifiedUser)).toBe(verifiedAt);
      }
    });
  });

  describe('型安全性', () => {
    it('型ガードが正しく動作する', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const unverifiedUser = createUser(email, password);
      const verifiedUser = verifyEmail(unverifiedUser);

      // When & Then
      if (isUnverified(unverifiedUser)) {
        // この分岐では UnverifiedUser として扱える
        expect(unverifiedUser._tag).toBe('UnverifiedUser');
      }

      if (isVerified(verifiedUser)) {
        // この分岐では VerifiedUser として扱える
        expect(verifiedUser._tag).toBe('VerifiedUser');
        expect(getVerifiedAt(verifiedUser)).toBeDefined();
      }
    });

    it('不正な状態遷移はコンパイル時に防がれる', () => {
      // Given
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const unverifiedUser = createUser(email, password);
      const verifiedUser = verifyEmail(unverifiedUser);

      // When & Then
      // verifyEmail は UnverifiedUser のみ受け取れる
      expect(unverifiedUser._tag).toBe('UnverifiedUser');
      
      // 認証済みユーザーは再度認証できない（型レベルで防止）
      expect(verifiedUser._tag).toBe('VerifiedUser');
      
      // この行はコンパイルエラーになる:
      // verifyEmail(verifiedUser); // TS Error: Argument of type 'VerifiedUser' is not assignable to parameter of type 'UnverifiedUser'
    });
  });
});