import type { Metadata } from 'next';
import { Providers } from './Providers';

export const metadata: Metadata = {
    title: 'Project Sentience | x402 Hackathon',
    description: 'Autonomous Identity & Reputation Protocol for AI Agents on Aptos',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
