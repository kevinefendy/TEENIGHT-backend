
export type UserRole = "admin" | "cashier" | "customer";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
