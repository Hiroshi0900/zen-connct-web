import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { createUser, type User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { ILogger } from '../../../../lib/logging/LoggingPort';
import { withLogContext } from '../../../../lib/logging/LogContext';

export interface RegisterUserCommand {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  isSuccess: boolean;
  user: User | null;
  error?: string;
}

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private logger: ILogger
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const startTime = Date.now();
    
    return withLogContext(
      { 
        component: 'RegisterUserUseCase',
        action: 'execute',
        email: command.email // メールアドレスは自動マスクされる
      },
      async () => {
        this.logger.info('User registration started', {
          email: command.email,
        });

        try {
          const email = Email.create(command.email);
          const password = Password.create(command.password);

          this.logger.debug('Email and password validated', {
            email: command.email,
          });

          const existingUser = await this.userRepository.findByEmail(email);
          if (existingUser) {
            const duration = Date.now() - startTime;
            this.logger.warn('User registration failed: email already exists', {
              email: command.email,
              duration,
            });
            
            return {
              isSuccess: false,
              user: null,
              error: 'Email already exists',
            };
          }

          this.logger.debug('Email availability verified', {
            email: command.email,
          });

          const user = createUser(email, password);
          await this.userRepository.save(user);

          const duration = Date.now() - startTime;
          this.logger.info('User registration completed successfully', {
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
            'User registration failed due to error',
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