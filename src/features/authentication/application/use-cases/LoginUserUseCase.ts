import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { verifyPassword, type User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { ILogger } from '../../../../lib/logging/LoggingPort';
import { withLogContext } from '../../../../lib/logging/LogContext';

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  isSuccess: boolean;
  user: User | null;
  error?: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private logger: ILogger
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'LoginUserUseCase',
        action: 'execute',
        email: command.email // メールアドレスは自動マスクされる
      },
      async () => {
        this.logger.info('User login started', {
          email: command.email,
        });

        try {
          const email = Email.create(command.email);
          const password = Password.create(command.password);

          this.logger.debug('Email and password validated', {
            email: command.email,
          });

          const user = await this.userRepository.findByEmail(email);
          if (!user) {
            const duration = Date.now() - startTime;
            this.logger.warn('User login failed: user not found', {
              email: command.email,
              duration,
            });
            
            return {
              isSuccess: false,
              user: null,
              error: 'Invalid email or password',
            };
          }

          this.logger.debug('User found in repository', {
            email: command.email,
          });

          if (!verifyPassword(user, password)) {
            const duration = Date.now() - startTime;
            this.logger.warn('User login failed: invalid password', {
              email: command.email,
              duration,
            });
            
            return {
              isSuccess: false,
              user: null,
              error: 'Invalid email or password',
            };
          }

          const duration = Date.now() - startTime;
          this.logger.info('User login completed successfully', {
            email: command.email,
            duration,
          });

          return {
            isSuccess: true,
            user,
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.error(
            'User login failed due to error',
            error instanceof Error ? error : new Error('Unknown error'),
            {
              email: command.email,
              duration,
            }
          );

          return {
            isSuccess: false,
            user: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    );
  }
}