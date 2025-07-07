import * as crypto from 'crypto';

const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  SALT_BYTES: 16,
  HASH_ITERATIONS: 10000,
  HASH_KEY_LENGTH: 64,
  HASH_ALGORITHM: 'sha512',
} as const;

const PASSWORD_PATTERNS = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  DIGIT: /\d/,
  SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/,
} as const;

export class Password {
  private constructor(private readonly value: string) {}

  static create(password: string): Password {
    if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long`);
    }

    if (!PASSWORD_PATTERNS.UPPERCASE.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!PASSWORD_PATTERNS.LOWERCASE.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!PASSWORD_PATTERNS.DIGIT.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!PASSWORD_PATTERNS.SPECIAL_CHAR.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    return new Password(password);
  }

  getValue(): string {
    return this.value;
  }

  hash(): string {
    const salt = crypto.randomBytes(PASSWORD_POLICY.SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(
      this.value, 
      salt, 
      PASSWORD_POLICY.HASH_ITERATIONS, 
      PASSWORD_POLICY.HASH_KEY_LENGTH, 
      PASSWORD_POLICY.HASH_ALGORITHM
    ).toString('hex');
    return `${salt}:${hash}`;
  }

  static verifyHash(password: string, hash: string): boolean {
    const [salt, originalHash] = hash.split(':');
    const verifyHash = crypto.pbkdf2Sync(
      password, 
      salt, 
      PASSWORD_POLICY.HASH_ITERATIONS, 
      PASSWORD_POLICY.HASH_KEY_LENGTH, 
      PASSWORD_POLICY.HASH_ALGORITHM
    ).toString('hex');
    return originalHash === verifyHash;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }
}