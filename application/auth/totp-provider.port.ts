export interface TotpProvider {
    generateSecret(email: string): string;
    verify(secret: string, code: string): boolean;
    buildProvisioningUri(email: string, secret: string): string;
}
