import { DomainEvent } from '../../../../lib/DomainEventBus';

export interface UserRegistered extends DomainEvent {
  eventName: 'UserRegistered';
  aggregateId: string;
  email: string;
  registeredAt: Date;
}