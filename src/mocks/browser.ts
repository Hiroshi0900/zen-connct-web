import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ブラウザ環境（開発時）用のMSWワーカー
export const worker = setupWorker(...handlers);