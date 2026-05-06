export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  initialBalance?: number;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;
