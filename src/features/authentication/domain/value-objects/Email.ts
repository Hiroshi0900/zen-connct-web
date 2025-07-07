export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email || email.trim() === '') {
      throw new Error('Email cannot be empty');
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    return new Email(normalizedEmail);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    if (email.includes('..')) {
      return false;
    }

    const [localPart, domainPart] = email.split('@');
    
    if (!localPart || !domainPart) {
      return false;
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.includes('..')) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}