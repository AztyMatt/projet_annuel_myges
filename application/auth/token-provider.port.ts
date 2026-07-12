import { type User } from "@domain/auth/user.entity";
import { type Role } from "@domain/auth/user.enums";

export interface TokenProvider {
    issue(user: User, role: Role): string;
    verify(token: string): { sub: string; role: Role; email: string };
}
