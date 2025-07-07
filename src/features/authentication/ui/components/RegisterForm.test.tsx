import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

const mockOnRegister = vi.fn();
const mockOnLoginClick = vi.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    mockOnRegister.mockClear();
    mockOnLoginClick.mockClear();
  });

  describe('レンダリング', () => {
    it('新規登録フォームが正しく表示される', () => {
      render(
        <RegisterForm 
          onRegister={mockOnRegister} 
          onLoginClick={mockOnLoginClick} 
        />
      );

      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
      expect(screen.getByText('既にアカウントをお持ちの方')).toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('有効な情報で新規登録が実行される', async () => {
      const user = userEvent.setup();
      render(
        <RegisterForm 
          onRegister={mockOnRegister} 
          onLoginClick={mockOnLoginClick} 
        />
      );

      await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'SecurePassword123!');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'SecurePassword123!');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      expect(mockOnRegister).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'SecurePassword123!'
      });
    });

    it('パスワードが一致しない場合エラーが表示される', async () => {
      const user = userEvent.setup();
      render(
        <RegisterForm 
          onRegister={mockOnRegister} 
          onLoginClick={mockOnLoginClick} 
        />
      );

      await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'SecurePassword123!');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'DifferentPassword123!');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
      expect(mockOnRegister).not.toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はボタンが無効化される', () => {
      render(
        <RegisterForm 
          onRegister={mockOnRegister} 
          onLoginClick={mockOnLoginClick} 
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: '新規登録...' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('サーバーエラーが表示される', () => {
      render(
        <RegisterForm 
          onRegister={mockOnRegister} 
          onLoginClick={mockOnLoginClick} 
          error="登録に失敗しました"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('登録に失敗しました');
    });
  });
});