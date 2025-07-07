import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node.js環境（テスト実行時）用のMSWサーバー
export const server = setupServer(...handlers);