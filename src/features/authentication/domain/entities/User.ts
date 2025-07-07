import { DomainEvent } from '../../../../lib/DomainEventBus';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';
import { UserRegistered } from '../events/UserRegistered';
import { EmailVerified } from '../events/EmailVerified';
import { PasswordChanged } from '../events/PasswordChanged';
import * as crypto from 'crypto';

export type UnverifiedUser = {
  readonly _tag: 'UnverifiedUser';
  readonly id: string;
  readonly email: Email;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly events: readonly DomainEvent[];
};

export type VerifiedUser = {
  readonly _tag: 'VerifiedUser';
  readonly id: string;
  readonly email: Email;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly verifiedAt: Date;
  readonly events: readonly DomainEvent[];
};

export type User = UnverifiedUser | VerifiedUser;

export const isUnverified = (user: User): user is UnverifiedUser =>
  user._tag === 'UnverifiedUser';

export const isVerified = (user: User): user is VerifiedUser =>
  user._tag === 'VerifiedUser';

export const createUser = (email: Email, password: Password): UnverifiedUser => {
  const id = crypto.randomUUID();
  const passwordHash = password.hash();
  const createdAt = new Date();

  const userRegisteredEvent: UserRegistered = {
    eventName: 'UserRegistered',
    aggregateId: id,
    occurredAt: createdAt,
    email: email.getValue(),
    registeredAt: createdAt,
  };

  return {
    _tag: 'UnverifiedUser',
    id,
    email,
    passwordHash,
    createdAt,
    events: [userRegisteredEvent],
  };
};

export const fromSnapshot = (
  id: string,
  email: Email,
  passwordHash: string,
  emailVerified: boolean,
  createdAt: Date,
  verifiedAt?: Date
): User => {
  const baseUser = {
    id,
    email,
    passwordHash,
    createdAt,
    events: [] as readonly DomainEvent[],
  };

  return emailVerified
    ? {
        ...baseUser,
        _tag: 'VerifiedUser' as const,
        verifiedAt: verifiedAt || createdAt,
      }
    : {
        ...baseUser,
        _tag: 'UnverifiedUser' as const,
      };
};

export const verifyEmail = (user: UnverifiedUser): VerifiedUser => {
  const verifiedAt = new Date();
  
  const emailVerifiedEvent: EmailVerified = {
    eventName: 'EmailVerified',
    aggregateId: user.id,
    occurredAt: verifiedAt,
    email: user.email.getValue(),
    verifiedAt,
  };

  return {
    ...user,
    _tag: 'VerifiedUser',
    verifiedAt,
    events: [...user.events, emailVerifiedEvent],
  };
};

export const changePassword = <T extends User>(
  user: T,
  newPassword: Password
): T => {
  const changedAt = new Date();
  
  const passwordChangedEvent: PasswordChanged = {
    eventName: 'PasswordChanged',
    aggregateId: user.id,
    occurredAt: changedAt,
    changedAt,
  };

  return {
    ...user,
    passwordHash: newPassword.hash(),
    events: [...user.events, passwordChangedEvent],
  } as T;
};

export const verifyPassword = (user: User, password: Password): boolean =>
  Password.verifyHash(password.getValue(), user.passwordHash);

export const clearEvents = <T extends User>(user: T): T => ({
  ...user,
  events: [],
});

export const getUserId = (user: User): string => user.id;
export const getUserEmail = (user: User): Email => user.email;
export const getUserPasswordHash = (user: User): string => user.passwordHash;
export const getUserCreatedAt = (user: User): Date => user.createdAt;
export const getUserEvents = (user: User): readonly DomainEvent[] => user.events;

export const getVerifiedAt = (user: VerifiedUser): Date => user.verifiedAt;

export const isEmailVerified = (user: User): user is VerifiedUser =>
  isVerified(user);