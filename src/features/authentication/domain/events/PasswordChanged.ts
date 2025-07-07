import { DomainEvent } from '../../../../lib/DomainEventBus';

export interface PasswordChanged extends DomainEvent {
  eventName: 'PasswordChanged';
  aggregateId: string;
  changedAt: Date;
}