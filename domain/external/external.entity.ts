import { type ExternalType } from "@domain/external/external.enums";

export type External = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    type: ExternalType;
};
