import { DomainEvent } from '../../../../lib/DomainEventBus';

export interface EmailVerified extends DomainEvent {
  eventName: 'EmailVerified';
  aggregateId: string;
  email: string;
  verifiedAt: Date;
}