import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// モック関数
const mockOnLogin = vi.fn();
const mockOnRegisterClick = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    mockOnLogin.mockClear();
    mockOnRegisterClick.mockClear();
  });

  describe('レンダリング', () => {
    it('ログインフォームが正しく表示される', () => {
      // When
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      // Then
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByText('新規登録はこちら')).toBeInTheDocument();
    });

    it('初期状態ではエラーメッセージが表示されない', () => {
      // When
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      // Then
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('フォーム入力', () => {
    it('メールアドレスを入力できる', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const emailInput = screen.getByLabelText('メールアドレス');

      // When
      await user.type(emailInput, 'user@example.com');

      // Then
      expect(emailInput).toHaveValue('user@example.com');
    });

    it('パスワードを入力できる', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const passwordInput = screen.getByLabelText('パスワード');

      // When
      await user.type(passwordInput, 'SecurePassword123!');

      // Then
      expect(passwordInput).toHaveValue('SecurePassword123!');
    });
  });

  describe('フォーム送信', () => {
    it('有効な情報でログインが実行される', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      // When
      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.click(submitButton);

      // Then
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'SecurePassword123!'
      });
    });

    it('空のメールアドレスでバリデーションエラーが表示される', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      // When
      await user.type(passwordInput, 'SecurePassword123!');
      await user.click(submitButton);

      // Then
      expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('空のパスワードでバリデーションエラーが表示される', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const emailInput = screen.getByLabelText('メールアドレス');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      // When
      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      // Then
      expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('無効なメールアドレスでバリデーションエラーが表示される', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      const emailInput = screen.getByLabelText('メールアドレス');
      const passwordInput = screen.getByLabelText('パスワード');
      const submitButton = screen.getByRole('button', { name: 'ログイン' });

      // When
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.click(submitButton);

      // Then
      await waitFor(() => {
        expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
      });
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はボタンが無効化される', () => {
      // When
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
          loading={true}
        />
      );

      // Then
      const submitButton = screen.getByRole('button', { name: 'ログイン...' });
      expect(submitButton).toBeDisabled();
    });

    it('ローディング中は入力フィールドが無効化される', () => {
      // When
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
          loading={true}
        />
      );

      // Then
      expect(screen.getByLabelText('メールアドレス')).toBeDisabled();
      expect(screen.getByLabelText('パスワード')).toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('サーバーエラーが表示される', () => {
      // When
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
          error="ログインに失敗しました"
        />
      );

      // Then
      expect(screen.getByRole('alert')).toHaveTextContent('ログインに失敗しました');
    });
  });

  describe('新規登録リンク', () => {
    it('新規登録リンクをクリックできる', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <LoginForm 
          onLogin={mockOnLogin} 
          onRegisterClick={mockOnRegisterClick} 
        />
      );

      // When
      await user.click(screen.getByText('新規登録はこちら'));

      // Then
      expect(mockOnRegisterClick).toHaveBeenCalled();
    });
  });
});