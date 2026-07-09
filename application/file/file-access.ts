import { type File } from "@domain/file/file.entity";
import { type AuthContext } from "@application/types/auth-context";

export const isFileOwner = (file: File | undefined, auth: AuthContext): boolean =>
    file !== undefined && file.uploadedBy === auth.requesterId;
