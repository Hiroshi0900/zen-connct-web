import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/render';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('ボタンのテキストが正しく表示される', () => {
    // Given
    render(<Button>テストボタン</Button>);

    // Then
    expect(screen.getByRole('button', { name: 'テストボタン' })).toBeInTheDocument();
  });

  it('クリック時にイベントハンドラが呼ばれる', async () => {
    // Given
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    // When
    const button = screen.getByRole('button', { name: 'クリック' });
    await user.click(button);

    // Then
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled状態の時はクリックできない', async () => {
    // Given
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        無効ボタン
      </Button>
    );

    // When
    const button = screen.getByRole('button', { name: '無効ボタン' });
    await user.click(button);

    // Then
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('プライマリバリアントのスタイルが適用される', () => {
    // Given
    render(<Button variant="primary">プライマリ</Button>);

    // Then
    const button = screen.getByRole('button', { name: 'プライマリ' });
    expect(button).toHaveClass('bg-accent-teal');
  });

  it('セカンダリバリアントのスタイルが適用される', () => {
    // Given
    render(<Button variant="secondary">セカンダリ</Button>);

    // Then
    const button = screen.getByRole('button', { name: 'セカンダリ' });
    expect(button).toHaveClass('border-accent-teal', 'text-accent-teal');
  });

  it('loading状態の時は適切な表示がされる', () => {
    // Given
    render(<Button loading>読み込み中</Button>);

    // Then
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    // Given
    render(<Button className="custom-class">カスタム</Button>);

    // Then
    const button = screen.getByRole('button', { name: 'カスタム' });
    expect(button).toHaveClass('custom-class');
  });
});