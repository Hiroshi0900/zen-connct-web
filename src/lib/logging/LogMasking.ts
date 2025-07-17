// ゼンコネクト ログマスキング機能
// 機密情報の自動マスキング（GPTの提案をベースに実装）

// マスキング対象のフィールド名パターン
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /auth/i,
  /bearer/i,
  /jwt/i,
  /session/i,
  /cookie/i,
  /ssn/i,
  /creditcard/i,
  /cardnumber/i,
  /cvv/i,
  /pin/i,
];

// マスキング対象の値パターン
const SENSITIVE_VALUE_PATTERNS = [
  /^[A-Za-z0-9+/]{40,}={0,2}$/, // Base64形式のトークン
  /^[A-Za-z0-9_-]{20,}$/, // JWT・APIキー形式
  /^Bearer\s+.+/i, // Bearer token
  /^Basic\s+.+/i, // Basic auth
];

// メールアドレスの部分マスキング
const maskEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;
  
  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex);
  
  if (localPart.length <= 3) {
    return `${localPart[0]}***${domainPart}`;
  }
  
  return `${localPart.substring(0, 3)}***${domainPart}`;
};

// 値のマスキング
const maskValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // メールアドレスの場合は部分マスキング
    if (value.includes('@') && value.includes('.')) {
      return maskEmail(value);
    }
    
    // その他の機密情報は完全マスキング
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        return '***';
      }
    }
    
    return value;
  }
  
  return value;
};

// フィールド名によるマスキング判定
const isSensitiveField = (fieldName: string): boolean => {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
};

// 再帰的なオブジェクトマスキング
const maskObjectRecursive = (obj: any, depth = 0): any => {
  // 循環参照対策として深度制限
  if (depth > 10) return '[Max Depth Reached]';
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack ? '[Stack Trace]' : undefined
    };
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskObjectRecursive(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const maskedObj: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveField(key)) {
        maskedObj[key] = '***';
      } else {
        maskedObj[key] = maskObjectRecursive(maskValue(value), depth + 1);
      }
    }
    
    return maskedObj;
  }
  
  return obj;
};

// パブリックAPIのマスキング関数
export const maskSecrets = (data: any): any => {
  if (!data) return data;
  
  try {
    return maskObjectRecursive(data);
  } catch (error) {
    // マスキング処理でエラーが発生した場合は安全側に倒す
    return '[Masking Error]';
  }
};

// テスト用の露出関数
export const __testing__ = {
  maskEmail,
  isSensitiveField,
  SENSITIVE_FIELD_PATTERNS,
  SENSITIVE_VALUE_PATTERNS,
};