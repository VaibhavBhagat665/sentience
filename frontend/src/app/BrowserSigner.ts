import {
    Account,
    AccountAddress,
    AccountAuthenticator,
    AccountAuthenticatorEd25519,
    AnyRawTransaction,
    Ed25519PublicKey,
    Ed25519Signature
} from '@aptos-labs/ts-sdk';

/**
 * A custom signer that delegates signing to the browser wallet (Petra/Martian)
 * mimicing the Account class interface expected by x402 SDK
 */
export class BrowserSigner {
    readonly accountAddress: AccountAddress;
    readonly publicKey: Ed25519PublicKey;

    constructor(address: string, publicKeyHex: string) {
        this.accountAddress = AccountAddress.fromString(address);
        this.publicKey = new Ed25519PublicKey(publicKeyHex);
    }

    /**
     * Signs a transaction using the browser wallet
     */
    async signTransaction(transaction: AnyRawTransaction): Promise<AccountAuthenticator> {
        if (typeof window === 'undefined' || !(window as any).aptos) {
            throw new Error("Wallet not connected");
        }

        try {
            const aptos = (window as any).aptos;

            // Try the standard signTransaction method
            // Note: Petra and others might return different formats
            const response = await aptos.signTransaction(transaction);

            // Handle response formats
            let signatureHex = '';

            if ('signature' in response && typeof response.signature === 'string') {
                signatureHex = response.signature;
            } else if (response instanceof Uint8Array) {
                signatureHex = Buffer.from(response).toString('hex');
            } else if (response.signature instanceof Uint8Array) {
                signatureHex = Buffer.from(response.signature).toString('hex');
            } else {
                console.warn("Unknown signTransaction response:", response);
                // Fallback attempt?
                throw new Error("Invalid signature format from wallet");
            }

            // Clean hex
            if (signatureHex.startsWith('0x')) signatureHex = signatureHex.slice(2);

            return new AccountAuthenticatorEd25519(
                this.publicKey,
                new Ed25519Signature(signatureHex)
            );
        } catch (error: any) {
            console.error("BrowserSigner sign error:", error);
            throw error;
        }
    }

    // Required by Account interface
    sign(data: any): any {
        throw new Error("BrowserSigner.sign() not implemented - usage restricted to signTransaction");
    }
}
