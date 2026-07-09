import { type Capabilities } from "@domain/auth/authorization-policy";

export type AuthContext = Capabilities & {
    requesterId: string;
};
