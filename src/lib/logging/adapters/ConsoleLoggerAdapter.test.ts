import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter';
import { DEFAULT_LOGGER_CONFIG } from '../LoggingPort';
import { logContextManager } from '../LogContext';

describe('ConsoleLoggerAdapter', () => {
  let logger: ConsoleLoggerAdapter;
  let consoleSpy: {
    log: any;
    warn: any;
    error: any;
  };

  beforeEach(() => {
    // コンソールメソッドをモック
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // ログコンテキストをクリア
    logContextManager.clear();
    
    logger = new ConsoleLoggerAdapter(DEFAULT_LOGGER_CONFIG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ログレベル制御', () => {
    it('設定されたレベル以上のログのみ出力する', () => {
      // Given
      const config = { ...DEFAULT_LOGGER_CONFIG, level: 'warn' as const };
      logger = new ConsoleLoggerAdapter(config);

      // When
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // Then
      expect(consoleSpy.log).not.toHaveBeenCalled(); // debug, info は出力されない
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('レベルを動的に変更できる', () => {
      // Given
      logger.setLevel('error');

      // When
      logger.warn('Warning message');
      logger.error('Error message');

      // Then
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('現在のレベルを取得できる', () => {
      // Given
      logger.setLevel('debug');

      // When
      const level = logger.getLevel();

      // Then
      expect(level).toBe('debug');
    });

    it('レベルの有効性を判定できる', () => {
      // Given
      logger.setLevel('warn');

      // When & Then
      expect(logger.isEnabled('debug')).toBe(false);
      expect(logger.isEnabled('info')).toBe(false);
      expect(logger.isEnabled('warn')).toBe(true);
      expect(logger.isEnabled('error')).toBe(true);
    });
  });

  describe('メッセージフォーマット', () => {
    it('基本的なメッセージを正しくフォーマットする', () => {
      // When
      logger.info('Test message');

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage, style, metadata] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('💡 INFO');
      expect(formattedMessage).toContain('Test message');
      expect(formattedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(style).toContain('color: #3B82F6');
    });

    it('コンポーネント情報を含むメッセージをフォーマットする', () => {
      // When
      logger.info('Test message', { component: 'TestComponent' });

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('[TestComponent]');
    });

    it('アクション情報を含むメッセージをフォーマットする', () => {
      // When
      logger.info('Test message', { action: 'testAction' });

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('{testAction}');
    });

    it('コンポーネントとアクションの両方を含むメッセージをフォーマットする', () => {
      // When
      logger.info('Test message', { component: 'TestComponent', action: 'testAction' });

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('[TestComponent]');
      expect(formattedMessage).toContain('{testAction}');
    });
  });

  describe('レベル別のスタイル', () => {
    it('debugログが正しいスタイルで出力される', () => {
      // When
      logger.debug('Debug message');

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage, style] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('🔍 DEBUG');
      expect(style).toContain('color: #6B7280');
    });

    it('infoログが正しいスタイルで出力される', () => {
      // When
      logger.info('Info message');

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage, style] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('💡 INFO');
      expect(style).toContain('color: #3B82F6');
    });

    it('warnログが正しいスタイルで出力される', () => {
      // When
      logger.warn('Warning message');

      // Then
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      const [formattedMessage, style] = consoleSpy.warn.mock.calls[0];
      
      expect(formattedMessage).toContain('⚠️ WARN');
      expect(style).toContain('color: #F59E0B');
      expect(style).toContain('font-weight: bold');
    });

    it('errorログが正しいスタイルで出力される', () => {
      // When
      logger.error('Error message');

      // Then
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      const [formattedMessage, style] = consoleSpy.error.mock.calls[0];
      
      expect(formattedMessage).toContain('❌ ERROR');
      expect(style).toContain('color: #EF4444');
      expect(style).toContain('font-weight: bold');
    });
  });

  describe('メタデータ処理', () => {
    it('メタデータを正しく出力する', () => {
      // Given
      const metadata = { userId: 'user123', action: 'login' };

      // When
      logger.info('Test message', metadata);

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [, , outputMetadata] = consoleSpy.log.mock.calls[0];
      
      expect(outputMetadata).toEqual(expect.objectContaining(metadata));
    });

    it('コンテキストメタデータとマージされる', () => {
      // Given
      logContextManager.setGlobalContext({ sessionId: 'session123' });
      const metadata = { userId: 'user123' };

      // When
      logger.info('Test message', metadata);

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [, , outputMetadata] = consoleSpy.log.mock.calls[0];
      
      expect(outputMetadata).toEqual(expect.objectContaining({
        sessionId: 'session123',
        userId: 'user123',
      }));
    });
  });

  describe('マスキング機能', () => {
    it('マスキングが有効な場合、機密情報をマスクする', () => {
      // Given
      const config = { ...DEFAULT_LOGGER_CONFIG, enableMasking: true };
      logger = new ConsoleLoggerAdapter(config);
      const sensitiveData = { password: 'secret123', email: 'user@example.com' };

      // When
      logger.info('Login attempt', sensitiveData);

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [, , outputMetadata] = consoleSpy.log.mock.calls[0];
      
      expect(outputMetadata.password).toBe('***');
      expect(outputMetadata.email).toBe('use***@example.com');
    });

    it('マスキングが無効な場合、データをそのまま出力する', () => {
      // Given
      const config = { ...DEFAULT_LOGGER_CONFIG, enableMasking: false };
      logger = new ConsoleLoggerAdapter(config);
      const sensitiveData = { password: 'secret123', email: 'user@example.com' };

      // When
      logger.info('Login attempt', sensitiveData);

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [, , outputMetadata] = consoleSpy.log.mock.calls[0];
      
      expect(outputMetadata.password).toBe('secret123');
      expect(outputMetadata.email).toBe('user@example.com');
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーオブジェクトを別途出力する', () => {
      // Given
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      // When
      logger.error('Error occurred', error, { component: 'TestComponent' });

      // Then
      expect(consoleSpy.error).toHaveBeenCalledTimes(2);
      
      // 最初の呼び出し：フォーマットされたメッセージ
      const [firstMessage, firstStyle, firstMetadata] = consoleSpy.error.mock.calls[0];
      expect(firstMessage).toContain('Error occurred');
      expect(firstMetadata).toEqual(expect.objectContaining({ component: 'TestComponent' }));
      
      // 2番目の呼び出し：エラーオブジェクト
      const [secondMessage, secondStyle, errorObj] = consoleSpy.error.mock.calls[1];
      expect(secondMessage).toContain('Error Details:');
      expect(errorObj).toBe(error);
    });

    it('エラーオブジェクトがない場合は1回だけ出力する', () => {
      // When
      logger.error('Error occurred', undefined, { component: 'TestComponent' });

      // Then
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('設定情報', () => {
    it('ロガー名を取得できる', () => {
      // Given
      logger = new ConsoleLoggerAdapter(DEFAULT_LOGGER_CONFIG, 'CustomLogger');

      // When
      const name = logger.getName();

      // Then
      expect(name).toBe('CustomLogger');
    });

    it('デフォルトのロガー名を取得できる', () => {
      // When
      const name = logger.getName();

      // Then
      expect(name).toBe('Console');
    });

    it('設定情報を取得できる', () => {
      // When
      const config = logger.getConfig();

      // Then
      expect(config).toEqual(DEFAULT_LOGGER_CONFIG);
      expect(config).not.toBe(DEFAULT_LOGGER_CONFIG); // コピーされていることを確認
    });
  });

  describe('タイムスタンプ', () => {
    it('ISO形式のタイムスタンプが含まれる', () => {
      // Given
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      vi.setSystemTime(mockDate);

      // When
      logger.info('Test message');

      // Then
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const [formattedMessage] = consoleSpy.log.mock.calls[0];
      
      expect(formattedMessage).toContain('[2023-01-01T12:00:00.000Z]');
    });
  });

  describe('パフォーマンス', () => {
    it('無効なレベルのログは処理をスキップする', () => {
      // Given
      logger.setLevel('error');

      // When
      logger.debug('Debug message');

      // Then
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });
});