import speakeasy from "speakeasy";
import { type TotpProvider } from "@application/auth/totp-provider.port";

export const totpProvider: TotpProvider = {
    generateSecret(email: string) {
        return speakeasy.generateSecret({ name: `MyGES (${email.toLowerCase()})` }).base32;
    },
    verify(secret: string, code: string) {
        return speakeasy.totp.verify({ secret, token: code, encoding: "base32", window: 1 });
    },
    buildProvisioningUri(email: string, secret: string) {
        return speakeasy.otpauthURL({
            secret,
            label: email,
            issuer: "MyGES",
            encoding: "base32",
        });
    },
};
