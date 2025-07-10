import { UserRepository } from '../../domain/repositories/UserRepository';
import { getUserId, getUserEmail, type User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { ILogger } from '../../../../lib/logging/LoggingPort';
import { withLogContext } from '../../../../lib/logging/LogContext';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  constructor(private logger: ILogger) {}

  async findByEmail(email: Email): Promise<User | null> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'InMemoryUserRepository',
        action: 'findByEmail',
        email: email.getValue()
      },
      async () => {
        this.logger.debug('Finding user by email', {
          email: email.getValue(),
        });

        for (const user of this.users.values()) {
          if (getUserEmail(user).equals(email)) {
            const duration = Date.now() - startTime;
            this.logger.debug('User found by email', {
              email: email.getValue(),
              duration,
            });
            return user;
          }
        }

        const duration = Date.now() - startTime;
        this.logger.debug('User not found by email', {
          email: email.getValue(),
          duration,
        });
        return null;
      }
    );
  }

  async findById(id: string): Promise<User | null> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'InMemoryUserRepository',
        action: 'findById',
        userId: id
      },
      async () => {
        this.logger.debug('Finding user by ID', {
          userId: id,
        });

        const user = this.users.get(id) || null;
        const duration = Date.now() - startTime;
        
        if (user) {
          this.logger.debug('User found by ID', {
            userId: id,
            duration,
          });
        } else {
          this.logger.debug('User not found by ID', {
            userId: id,
            duration,
          });
        }

        return user;
      }
    );
  }

  async save(user: User): Promise<void> {
    const startTime = Date.now();
    const userId = getUserId(user);
    const email = getUserEmail(user).getValue();
    
    return withLogContext(
      { 
        component: 'InMemoryUserRepository',
        action: 'save',
        userId,
        email
      },
      async () => {
        const isUpdate = this.users.has(userId);
        
        this.logger.debug(`${isUpdate ? 'Updating' : 'Creating'} user`, {
          userId,
          email,
          operation: isUpdate ? 'update' : 'create',
        });

        this.users.set(userId, user);
        
        const duration = Date.now() - startTime;
        this.logger.info(`User ${isUpdate ? 'updated' : 'created'} successfully`, {
          userId,
          email,
          operation: isUpdate ? 'update' : 'create',
          duration,
        });
      }
    );
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'InMemoryUserRepository',
        action: 'delete',
        userId: id
      },
      async () => {
        const userExists = this.users.has(id);
        
        this.logger.debug('Deleting user', {
          userId: id,
          userExists,
        });

        const deleted = this.users.delete(id);
        const duration = Date.now() - startTime;
        
        if (deleted) {
          this.logger.info('User deleted successfully', {
            userId: id,
            duration,
          });
        } else {
          this.logger.warn('Attempted to delete non-existent user', {
            userId: id,
            duration,
          });
        }
      }
    );
  }

  // 統計情報用のメソッド（開発・デバッグ用）
  getStats(): { totalUsers: number; userIds: string[] } {
    return withLogContext(
      { 
        component: 'InMemoryUserRepository',
        action: 'getStats'
      },
      () => {
        const stats = {
          totalUsers: this.users.size,
          userIds: Array.from(this.users.keys()),
        };
        
        this.logger.debug('Repository stats requested', stats);
        return stats;
      }
    );
  }
}