'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { PropsWithChildren } from 'react';

// Initialize wallet plugins
const wallets = [new PetraWallet()];

export const Providers = ({ children }: PropsWithChildren) => {
    return (
        <AptosWalletAdapterProvider {...({ plugins: wallets, autoConnect: true } as any)}>
            {children}
        </AptosWalletAdapterProvider>
    );
};
