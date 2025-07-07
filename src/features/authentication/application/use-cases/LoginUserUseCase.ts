import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { verifyPassword, type User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

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
  constructor(private userRepository: UserRepository) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    try {
      const email = Email.create(command.email);
      const password = Password.create(command.password);

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          isSuccess: false,
          user: null,
          error: 'Invalid email or password',
        };
      }

      if (!verifyPassword(user, password)) {
        return {
          isSuccess: false,
          user: null,
          error: 'Invalid email or password',
        };
      }

      return {
        isSuccess: true,
        user,
      };
    } catch (error) {
      return {
        isSuccess: false,
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}