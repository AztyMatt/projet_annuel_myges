import { type ExternalType } from "@domain/external/external.enums";

export type External = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: ExternalType;
};
