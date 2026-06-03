import jwt from "jsonwebtoken";
import { type TokenProvider } from "@application/auth/token-provider.port";
import { type User } from "@domain/auth/user.entity";
import { type Role } from "@domain/auth/user.enums";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = "8h";

export const tokenProvider: TokenProvider = {
    issue(user: User, role: Role) {
        return jwt.sign({ sub: user.id, role, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
    },
    verify(token: string) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === "string") throw new Error("Invalid token format");
        return decoded as { sub: string; role: Role; email: string };
    },
};
