import {
    AccountAddress,
    AccountAuthenticator,
    AccountAuthenticatorEd25519,
    AnyRawTransaction,
    Ed25519PublicKey,
    Ed25519Signature
} from '@aptos-labs/ts-sdk';

/**
 * A custom signer that delegates signing to the Wallet Adapter
 * mimicking the Account class interface expected by x402 SDK
 */
export class BrowserSigner {
    readonly accountAddress: AccountAddress;
    readonly publicKey: Ed25519PublicKey;
    readonly signFn: (args: any) => Promise<any>;

    constructor(
        address: string,
        publicKeyHex: string,
        signFn: (args: any) => Promise<any>
    ) {
        this.accountAddress = AccountAddress.fromString(address);
        this.publicKey = new Ed25519PublicKey(publicKeyHex);
        this.signFn = signFn;
    }

    /**
     * Signs a transaction using the injected signing function
     */
    async signTransaction(transaction: AnyRawTransaction): Promise<AccountAuthenticator> {
        try {
            // Use the injected signing function (wrapped for Adapter V2)
            const response = await this.signFn({ transactionOrPayload: transaction });

            // Handle response formats
            let signatureHex = '';

            if (response && typeof response === 'object' && 'signature' in response) {
                // Adapter format: { signature: "0x..." }
                // @ts-ignore
                const sig = response.signature;
                if (typeof sig === 'string') {
                    signatureHex = sig;
                } else if (sig instanceof Uint8Array) {
                    signatureHex = Buffer.from(sig).toString('hex');
                }
            } else if (typeof response === 'string') {
                signatureHex = response;
            } else if (response instanceof Uint8Array) {
                signatureHex = Buffer.from(response).toString('hex');
            } else {
                console.warn("Unknown signTransaction response:", response);
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
