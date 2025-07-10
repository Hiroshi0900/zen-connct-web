import { describe, it, expect, beforeEach } from 'vitest';
import { Email } from '../domain/value-objects/Email';
import { Password } from '../domain/value-objects/Password';
import { 
  createUser, 
  verifyEmail, 
  changePassword, 
  verifyPassword,
  getUserId,
  getUserEmail,
  getUserEvents,
  isEmailVerified
} from '../domain/entities/User';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';
import { RegisterUserUseCase } from '../application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../application/use-cases/LoginUserUseCase';

describe('Authentication Integration Tests', () => {
  let userRepository: InMemoryUserRepository;
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    registerUseCase = new RegisterUserUseCase(userRepository);
    loginUseCase = new LoginUserUseCase(userRepository);
  });

  describe('ユーザー登録からログインまでの完全フロー', () => {
    it.each([
      ['user@example.com', 'SecurePassword123!', 'SecurePassword123!', true, '正しいパスワードでログイン成功'],
      ['user@example.com', 'SecurePassword123!', 'WrongPassword123!', false, '間違ったパスワードでログイン失敗'],
    ] as const)('ユーザー登録: %s, 登録パスワード: %s, ログインパスワード: %s -> %s', async (email, registerPassword, loginPassword, shouldSucceed) => {
      // 新規登録
      const registerResult = await registerUseCase.execute({ email, password: registerPassword });
      expect(registerResult.isSuccess).toBe(true);
      expect(registerResult.user).toBeDefined();
      expect(getUserEmail(registerResult.user!).getValue()).toBe(email);
      expect(isEmailVerified(registerResult.user!)).toBe(false);

      // ログイン試行
      const loginResult = await loginUseCase.execute({ email, password: loginPassword });
      
      if (shouldSucceed) {
        expect(loginResult.isSuccess).toBe(true);
        expect(loginResult.user).toBeDefined();
        expect(getUserId(loginResult.user!)).toBe(getUserId(registerResult.user!));
        expect(getUserEmail(loginResult.user!).getValue()).toBe(email);
      } else {
        expect(loginResult.isSuccess).toBe(false);
        expect(loginResult.error).toBe('Invalid email or password');
        expect(loginResult.user).toBeNull();
      }
    });

    it('存在しないユーザーでログインできない', async () => {
      const email = 'nonexistent@example.com';
      const password = 'SecurePassword123!';

      const loginResult = await loginUseCase.execute({ email, password });
      
      expect(loginResult.isSuccess).toBe(false);
      expect(loginResult.error).toBe('Invalid email or password');
      expect(loginResult.user).toBeNull();
    });

    it('重複するメールアドレスで登録できない', async () => {
      const email = 'user@example.com';
      const password = 'SecurePassword123!';

      // 最初の登録
      const firstRegister = await registerUseCase.execute({ email, password });
      expect(firstRegister.isSuccess).toBe(true);

      // 同じメールアドレスで再登録試行
      const secondRegister = await registerUseCase.execute({ email, password });
      expect(secondRegister.isSuccess).toBe(false);
      expect(secondRegister.error).toBe('Email already exists');
      expect(secondRegister.user).toBeNull();
    });
  });

  describe('ドメインモデルの統合', () => {
    it('ユーザー作成時にUserRegisteredイベントが発行される', async () => {
      const email = 'user@example.com';
      const password = 'SecurePassword123!';

      const result = await registerUseCase.execute({ email, password });
      
      expect(result.isSuccess).toBe(true);
      const events = getUserEvents(result.user!);
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('UserRegistered');
      expect(events[0].aggregateId).toBe(getUserId(result.user!));
    });

    it('メール認証完了時にEmailVerifiedイベントが発行される', async () => {
      const email = 'user@example.com';
      const password = 'SecurePassword123!';

      const result = await registerUseCase.execute({ email, password });
      const user = result.user!;

      // メール認証実行
      const verifiedUser = verifyEmail(user);

      const events = getUserEvents(verifiedUser);
      expect(events).toHaveLength(2);
      expect(events[1].eventName).toBe('EmailVerified');
      expect(isEmailVerified(verifiedUser)).toBe(true);
    });

    it('パスワード変更時にPasswordChangedイベントが発行される', async () => {
      const email = 'user@example.com';
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';

      const result = await registerUseCase.execute({ 
        email, 
        password: oldPassword 
      });
      const user = result.user!;

      // パスワード変更
      const newPasswordObj = Password.create(newPassword);
      const updatedUser = changePassword(user, newPasswordObj);

      const events = getUserEvents(updatedUser);
      expect(events).toHaveLength(2);
      expect(events[1].eventName).toBe('PasswordChanged');
      
      // 新しいパスワードで認証可能
      expect(verifyPassword(updatedUser, newPasswordObj)).toBe(true);
      
      // 古いパスワードでは認証不可
      const oldPasswordObj = Password.create(oldPassword);
      expect(verifyPassword(updatedUser, oldPasswordObj)).toBe(false);
    });
  });

  describe('リポジトリの統合', () => {
    it('ユーザー保存後にIDとメールアドレスで検索できる', async () => {
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);

      // ユーザー保存
      await userRepository.save(user);

      // IDで検索
      const foundById = await userRepository.findById(getUserId(user));
      expect(foundById).toBeDefined();
      expect(getUserId(foundById!)).toBe(getUserId(user));

      // メールアドレスで検索
      const foundByEmail = await userRepository.findByEmail(email);
      expect(foundByEmail).toBeDefined();
      expect(getUserId(foundByEmail!)).toBe(getUserId(user));
      expect(getUserEmail(foundByEmail!).getValue()).toBe(email.getValue());
    });

    it('ユーザー削除後は検索できない', async () => {
      const email = Email.create('user@example.com');
      const password = Password.create('SecurePassword123!');
      const user = createUser(email, password);

      // ユーザー保存
      await userRepository.save(user);

      // 削除前は検索可能
      const beforeDelete = await userRepository.findById(getUserId(user));
      expect(beforeDelete).toBeDefined();

      // ユーザー削除
      await userRepository.delete(getUserId(user));

      // 削除後は検索不可
      const afterDelete = await userRepository.findById(getUserId(user));
      expect(afterDelete).toBeNull();
    });
  });
});