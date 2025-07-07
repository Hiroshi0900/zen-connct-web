import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { createUser, type User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

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
  constructor(private userRepository: UserRepository) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    try {
      const email = Email.create(command.email);
      const password = Password.create(command.password);

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          isSuccess: false,
          user: null,
          error: 'Email already exists',
        };
      }

      const user = createUser(email, password);
      await this.userRepository.save(user);

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