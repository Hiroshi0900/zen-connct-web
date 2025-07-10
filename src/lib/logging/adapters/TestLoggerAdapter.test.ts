import { describe, it, expect, beforeEach } from 'vitest';
import { TestLoggerAdapter } from './TestLoggerAdapter';
import { DEFAULT_LOGGER_CONFIG } from '../LoggingPort';

describe('TestLoggerAdapter', () => {
  let logger: TestLoggerAdapter;

  beforeEach(() => {
    logger = new TestLoggerAdapter(DEFAULT_LOGGER_CONFIG);
  });

  describe('ログの記録', () => {
    it('debugログを記録できる', () => {
      // When
      logger.debug('Debug message', { component: 'TestComponent' });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].metadata?.component).toBe('TestComponent');
    });

    it('infoログを記録できる', () => {
      // When
      logger.info('Info message', { action: 'test' });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Info message');
      expect(logs[0].metadata?.action).toBe('test');
    });

    it('warnログを記録できる', () => {
      // When
      logger.warn('Warning message', { userId: 'user123' });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
      expect(logs[0].metadata?.userId).toBe('user123');
    });

    it('errorログを記録できる', () => {
      // Given
      const error = new Error('Test error');

      // When
      logger.error('Error message', error, { component: 'ErrorComponent' });

      // Then
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Error message');
      expect(logs[0].error).toBe(error);
      expect(logs[0].metadata?.component).toBe('ErrorComponent');
    });

    it('タイムスタンプが自動的に設定される', () => {
      // Given
      const beforeTime = new Date();

      // When
      logger.info('Test message');

      // Then
      const logs = logger.getLogs();
      const afterTime = new Date();
      
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('ログの検索と取得', () => {
    beforeEach(() => {
      logger.debug('Debug message', { component: 'DebugComponent' });
      logger.info('Info message', { component: 'InfoComponent' });
      logger.warn('Warning message', { component: 'WarnComponent' });
      logger.error('Error message', new Error('Test error'), { component: 'ErrorComponent' });
    });

    it('レベル別にログを取得できる', () => {
      // When & Then
      expect(logger.getLogsByLevel('debug')).toHaveLength(1);
      expect(logger.getLogsByLevel('info')).toHaveLength(1);
      expect(logger.getLogsByLevel('warn')).toHaveLength(1);
      expect(logger.getLogsByLevel('error')).toHaveLength(1);
    });

    it('メッセージでログを検索できる', () => {
      // When
      const infoLogs = logger.getLogsByMessage('Info message');
      const debugLogs = logger.getLogsByMessage('Debug');

      // Then
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].level).toBe('info');
      expect(debugLogs).toHaveLength(1);
      expect(debugLogs[0].level).toBe('debug');
    });

    it('メタデータでログを検索できる', () => {
      // When
      const componentLogs = logger.getLogsByMetadata('component', 'InfoComponent');

      // Then
      expect(componentLogs).toHaveLength(1);
      expect(componentLogs[0].level).toBe('info');
    });

    it('最新のログを取得できる', () => {
      // When
      const lastLog = logger.getLastLog();

      // Then
      expect(lastLog).toBeDefined();
      expect(lastLog!.level).toBe('error');
      expect(lastLog!.message).toBe('Error message');
    });

    it('ログの総数を取得できる', () => {
      // When & Then
      expect(logger.getLogCount()).toBe(4);
    });

    it('レベル別のログ数を取得できる', () => {
      // When & Then
      expect(logger.getLogCountByLevel('debug')).toBe(1);
      expect(logger.getLogCountByLevel('info')).toBe(1);
      expect(logger.getLogCountByLevel('warn')).toBe(1);
      expect(logger.getLogCountByLevel('error')).toBe(1);
    });

    it('メッセージの存在を確認できる', () => {
      // When & Then
      expect(logger.hasLogWithMessage('Info message')).toBe(true);
      expect(logger.hasLogWithMessage('Nonexistent message')).toBe(false);
    });

    it('メタデータの存在を確認できる', () => {
      // When & Then
      expect(logger.hasLogWithMetadata('component', 'InfoComponent')).toBe(true);
      expect(logger.hasLogWithMetadata('component', 'NonexistentComponent')).toBe(false);
    });

    it('エラーオブジェクトの存在を確認できる', () => {
      // Given
      const error = new Error('Test error');
      logger.error('Another error', error);

      // When & Then
      expect(logger.hasLogWithError(error)).toBe(true);
      expect(logger.hasLogWithError(new Error('Different error'))).toBe(false);
    });
  });

  describe('ログのクリア', () => {
    it('すべてのログをクリアできる', () => {
      // Given
      logger.info('Test message 1');
      logger.info('Test message 2');
      expect(logger.getLogCount()).toBe(2);

      // When
      logger.clear();

      // Then
      expect(logger.getLogCount()).toBe(0);
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('アサーション', () => {
    it('ログの存在をアサートできる', () => {
      // Given
      logger.info('Test message', { component: 'TestComponent' });

      // When & Then
      expect(() => {
        logger.assertLogExists('info', 'Test message', { component: 'TestComponent' });
      }).not.toThrow();
    });

    it('存在しないログでアサートが失敗する', () => {
      // When & Then
      expect(() => {
        logger.assertLogExists('info', 'Nonexistent message');
      }).toThrow('Expected log not found');
    });

    it('ログの非存在をアサートできる', () => {
      // When & Then
      expect(() => {
        logger.assertLogDoesNotExist('info', 'Nonexistent message');
      }).not.toThrow();
    });

    it('存在するログで非存在アサートが失敗する', () => {
      // Given
      logger.info('Test message');

      // When & Then
      expect(() => {
        logger.assertLogDoesNotExist('info', 'Test message');
      }).toThrow('Unexpected log found');
    });

    it('ログ数をアサートできる', () => {
      // Given
      logger.info('Message 1');
      logger.info('Message 2');

      // When & Then
      expect(() => {
        logger.assertLogCount(2);
      }).not.toThrow();

      expect(() => {
        logger.assertLogCount(3);
      }).toThrow('Expected 3 logs, but got 2');
    });

    it('レベル別ログ数をアサートできる', () => {
      // Given
      logger.info('Info message');
      logger.warn('Warning message');

      // When & Then
      expect(() => {
        logger.assertLogCountByLevel('info', 1);
      }).not.toThrow();

      expect(() => {
        logger.assertLogCountByLevel('info', 2);
      }).toThrow('Expected 2 logs with level info, but got 1');
    });
  });

  describe('ログの要約', () => {
    it('ログの要約を取得できる', () => {
      // Given
      logger.debug('Debug message');
      logger.info('Info message 1');
      logger.info('Info message 2');
      logger.warn('Warning message');
      logger.error('Error message', new Error('Test error'));

      // When
      const summary = logger.getSummary();

      // Then
      expect(summary.total).toBe(5);
      expect(summary.byLevel.debug).toBe(1);
      expect(summary.byLevel.info).toBe(2);
      expect(summary.byLevel.warn).toBe(1);
      expect(summary.byLevel.error).toBe(1);
      expect(summary.recentLogs).toHaveLength(5);
    });

    it('最新5件のログのみを要約に含める', () => {
      // Given
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      // When
      const summary = logger.getSummary();

      // Then
      expect(summary.total).toBe(10);
      expect(summary.recentLogs).toHaveLength(5);
      expect(summary.recentLogs[0].message).toBe('Message 5');
      expect(summary.recentLogs[4].message).toBe('Message 9');
    });
  });

  describe('JSON出力', () => {
    it('ログをJSON形式で出力できる', () => {
      // Given
      logger.info('Test message', { component: 'TestComponent' });

      // When
      const json = logger.toJSON();

      // Then
      expect(json).toBeTypeOf('string');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
      expect(parsed[0].metadata.component).toBe('TestComponent');
    });
  });

  describe('設定情報', () => {
    it('ロガー名を取得できる', () => {
      // When & Then
      expect(logger.getName()).toBe('Test');
    });

    it('設定を取得できる', () => {
      // When
      const config = logger.getConfig();

      // Then
      expect(config).toEqual(DEFAULT_LOGGER_CONFIG);
    });
  });
});