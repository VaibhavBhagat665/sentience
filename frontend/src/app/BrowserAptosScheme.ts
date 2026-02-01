import { Aptos, AptosConfig, AccountAddress, AnyRawTransaction, Ed25519PublicKey, AccountAuthenticatorEd25519, Ed25519Signature, Network, Serializer } from "@aptos-labs/ts-sdk";
import { SchemeNetworkClient } from "@rvk_rishikesh/core/types";

const APTOS_ADDRESS_REGEX = /^0x[a-fA-F0-9]{1,64}$/;

interface PaymentPayload {
    x402Version: number;
    payload: {
        transaction: string;
    };
}

interface PaymentRequirements {
    network: string;
    asset?: string;
    payTo?: string;
    amount?: string;
    extra?: {
        sponsored?: boolean;
    };
}

export class BrowserAptosScheme implements SchemeNetworkClient {
    readonly scheme = "exact";

    constructor(
        private readonly address: string,
        private readonly publicKey: string,
        private readonly signTransaction: (args: { transactionOrPayload: AnyRawTransaction }) => Promise<any>
    ) { }

    async createPaymentPayload(
        x402Version: number,
        paymentRequirements: PaymentRequirements
    ): Promise<Pick<PaymentPayload, "x402Version" | "payload">> {
        // Validation
        if (!this.address) throw new Error("Aptos account address is required");
        if (!paymentRequirements.asset) throw new Error("Asset is required");
        if (!paymentRequirements.payTo) throw new Error("Pay-to address is required");
        if (!paymentRequirements.amount) throw new Error("Amount is required");

        // Config
        // Map network string (e.g. "aptos:testnet") to Network enum
        let network = Network.TESTNET;
        if (paymentRequirements.network.includes("mainnet")) network = Network.MAINNET;
        else if (paymentRequirements.network.includes("devnet")) network = Network.DEVNET;

        const aptosConfig = new AptosConfig({ network });
        const aptos = new Aptos(aptosConfig);

        const sponsored = paymentRequirements.extra?.sponsored === true;

        // Check if asset is a Coin Struct (contains '::') or FA Address
        const isCoin = paymentRequirements.asset.includes('::');

        let transactionData: any;

        if (isCoin) {
            if (paymentRequirements.asset === '0x1::aptos_coin::AptosCoin') {
                // Use 0x1::aptos_account::transfer (Handles auto-registration of recipient)
                transactionData = {
                    function: "0x1::aptos_account::transfer",
                    typeArguments: [],
                    functionArguments: [
                        paymentRequirements.payTo,
                        paymentRequirements.amount,
                    ]
                };
            } else {
                // Use Generic 0x1::coin::transfer
                transactionData = {
                    function: "0x1::coin::transfer",
                    typeArguments: [paymentRequirements.asset],
                    functionArguments: [
                        paymentRequirements.payTo,
                        paymentRequirements.amount,
                    ]
                };
            }
        } else {
            // Use FA transfer
            transactionData = {
                function: "0x1::primary_fungible_store::transfer",
                typeArguments: ["0x1::fungible_asset::Metadata"],
                functionArguments: [
                    paymentRequirements.asset,
                    paymentRequirements.payTo,
                    paymentRequirements.amount,
                ]
            };
        }

        const transaction = await aptos.transaction.build.simple({
            sender: this.address,
            data: transactionData,
            withFeePayer: sponsored,
        });

        // Sign Transaction (Async Browser Call)
        // Adapter expects wrapped object
        const response = await this.signTransaction({ transactionOrPayload: transaction });

        // Extract Signature
        let signatureHex = '';
        if (response && typeof response === 'object' && 'signature' in response) {
            // @ts-ignore
            const sig = response.signature;
            if (typeof sig === 'string') signatureHex = sig;
            else if (sig instanceof Uint8Array) signatureHex = Buffer.from(sig).toString('hex');
        } else if (typeof response === 'string') {
            signatureHex = response;
        } else {
            // Try getting from Uint8Array directly if response is array
            if (response instanceof Uint8Array) signatureHex = Buffer.from(response).toString('hex');
            else throw new Error("Unknown signature format");
        }

        if (signatureHex.startsWith('0x')) signatureHex = signatureHex.slice(2);

        // Create Authenticator
        const publicKey = new Ed25519PublicKey(this.publicKey);
        const signature = new Ed25519Signature(signatureHex);
        const authenticator = new AccountAuthenticatorEd25519(publicKey, signature);

        // BCS Serialize
        const transactionBytes = transaction.bcsToBytes();
        const authenticatorBytes = authenticator.bcsToBytes();

        // Encode Payload (Base64 of [TransactionBytes | AuthenticatorBytes])
        const serializer = new Serializer();
        serializer.serializeBytes(transactionBytes);
        serializer.serializeBytes(authenticatorBytes);
        const base64Transaction = Buffer.from(serializer.toUint8Array()).toString('base64');

        return {
            x402Version,
            payload: {
                transaction: base64Transaction
            }
        };
    }
}
