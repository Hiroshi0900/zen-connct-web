# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zen-connect** is a meditation experience sharing app (瞑想版「サウナイキタイ」) built with Next.js 15, TypeScript, and Tailwind CSS v4. The project follows Test-Driven Development (TDD) and Domain-Driven Design (DDD) principles with a functional programming approach.

## Essential Commands

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build            # Production build
npm run start            # Start production server
```

### Testing (TDD-First Approach)
```bash
npm test                 # Run all tests once
npm run test:watch       # TDD watch mode (primary development mode)
npm run test:ui          # Visual test interface
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests
```

### Quality Checks
```bash
npm run lint             # ESLint check
npm run lint -- --fix   # ESLint auto-fix
```

### Running Single Tests
```bash
npx vitest src/path/to/specific.test.ts          # Single test file
npx vitest src/features/authentication           # Directory pattern
npx vitest --run --reporter=verbose UserTest     # Pattern matching
```

## Architecture Overview

### Core Architectural Patterns

**1. Feature-Sliced Design (FSD)**
```
src/features/[feature-name]/
├── domain/           # Business logic, entities, value objects
├── application/      # Use cases, application services
├── infrastructure/   # External adapters (repositories, APIs)
└── ui/              # React components, pages
```

**2. Domain-Driven Design with Functional Programming**
- **Entities**: Functional approach using Tagged Union Types instead of classes
- **Value Objects**: Immutable objects with validation
- **Events**: Domain events dispatched through DomainEventBus
- **Use Cases**: Pure functions orchestrating domain logic

**3. Test-Driven Development (5-Layer Strategy)**
- Level 1: Static analysis (ESLint, TypeScript)
- Level 2: Unit tests (90%+ coverage target)
- Level 3: Integration tests (80%+ coverage target)
- Level 4: Component catalog (Storybook)
- Level 5: E2E tests (main flows)

### Key Implementation Patterns

**Functional User Entity Example:**
```typescript
// Tagged Union Types for type-safe state transitions
export type User = UnverifiedUser | VerifiedUser;

export type UnverifiedUser = {
  readonly _tag: 'UnverifiedUser';
  readonly id: string;
  readonly email: Email;
  // ... other fields
};

// Pure functions instead of methods
export const verifyEmail = (user: UnverifiedUser): VerifiedUser => {
  // Returns new state, original unchanged
};
```

**Table-Driven Tests Pattern:**
```typescript
it.each([
  ['valid@email.com', true, 'valid@email.com'],
  ['UPPER@EMAIL.COM', true, 'upper@email.com'],
  ['invalid-email', false, 'Invalid email format'],
] as const)('email "%s" -> success: %s, result: %s', (input, shouldSucceed, expected) => {
  // Test logic
});
```

### Domain Event System

The codebase uses a custom DomainEventBus for decoupled event handling:

```typescript
// Events are emitted from domain entities
const userRegisteredEvent: UserRegistered = {
  eventName: 'UserRegistered',
  aggregateId: user.id,
  occurredAt: new Date(),
  // ... event data
};

// Consumed by application layer
domainEventBus.subscribe('UserRegistered', async (event) => {
  // Handle side effects
});
```

## Testing Philosophy

**TDD Red-Green-Refactor Cycle:**
1. Write failing test first
2. Implement minimal code to pass
3. Refactor while keeping tests green

**Test Structure (Given-When-Then):**
```typescript
it('should handle user registration flow', async () => {
  // Given: Setup test conditions
  const email = 'user@example.com';
  const password = 'SecurePassword123!';
  
  // When: Execute the action
  const result = await registerUseCase.execute({ email, password });
  
  // Then: Verify outcomes
  expect(result.isSuccess).toBe(true);
  expect(getUserEmail(result.user!).getValue()).toBe(email);
});
```

## Key Code Patterns

### Value Objects (Functional Approach)
```typescript
export class Email {
  private constructor(private readonly value: string) {}
  
  static create(email: string): Email {
    // Validation logic
    return new Email(email.toLowerCase().trim());
  }
  
  getValue(): string { return this.value; }
  equals(other: Email): boolean { return this.value === other.value; }
}
```

### Use Cases (Pure Functions)
```typescript
export class RegisterUserUseCase {
  async execute(request: RegisterUserRequest): Promise<RegisterUserResult> {
    try {
      // 1. Validate inputs (throws on invalid)
      const email = Email.create(request.email);
      const password = Password.create(request.password);
      
      // 2. Check business rules
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return { isSuccess: false, error: 'Email already exists', user: null };
      }
      
      // 3. Create domain entity
      const user = createUser(email, password);
      
      // 4. Persist
      await this.userRepository.save(user);
      
      return { isSuccess: true, user, error: null };
    } catch (error) {
      return { isSuccess: false, error: error.message, user: null };
    }
  }
}
```

## Design System

### Color Palette (Tailwind v4)
```css
--primary-dark: #1c222e     /* Main background */
--accent-teal: #3fc0c7      /* CTAs, links */
--accent-coral: #fd9074     /* Important elements */
```

### Component Patterns
- Dark mode by default (inspired by Simple Habit design)
- Rounded corners (8px, 12px for cards)
- Consistent spacing using Tailwind scale
- Micro-animations (300ms or less)

## File Organization

```
src/
├── app/                    # Next.js App Router
├── features/               # Feature-sliced modules
│   └── authentication/     # Current: auth domain
├── lib/                    # Shared utilities
│   └── DomainEventBus.ts  # Event system
└── test-utils/            # Testing helpers
```

## Development Workflow

1. **Start with TDD**: `npm run test:watch`
2. **Write failing test** for new feature
3. **Implement minimal code** to pass test
4. **Refactor** while keeping tests green
5. **Check coverage**: `npm run test:coverage`
6. **Lint before commit**: `npm run lint`

## Important Notes

- **Always use functional User API**: `createUser()`, `getUserEmail()`, etc. instead of class methods
- **Table-driven tests preferred** for multiple similar test cases
- **MSW v2** for API mocking in tests
- **Vitest** over Jest for faster test execution
- **Type-safe state transitions** using Tagged Union Types
- **Pure functions** for domain operations (no side effects)
- **Immutable data structures** - always return new objects

## Current Status

- ✅ Authentication domain implemented with functional approach
- ✅ TDD environment fully configured
- ✅ Table-driven tests converted
- 🔄 Phase 1: Authentication UI components (in progress)
- ⏳ Phase 2: Experience sharing features (planned)