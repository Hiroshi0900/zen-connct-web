import { UserRepository } from '../../domain/repositories/UserRepository';
import { getUserId, getUserEmail, type User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (getUserEmail(user).equals(email)) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(getUserId(user), user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}