import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Note: Uncomment after npm install
// import { paymentMiddleware, PaymentConfig } from 'aptos-x402';

import shardRoutes from './routes/shards';
import { checkReputationMiddleware, magicSpellMiddleware } from './middleware/reputation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// x402 Payment Configuration
// ============================================

const x402Config = {
    recipientAddress: process.env.SERVER_WALLET || '',
    price: 500000, // 0.005 APT (500000 octas)
    network: (process.env.APTOS_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'devnet',
    allowUnconfirmed: process.env.X402_ALLOW_UNCONFIRMED === 'true'
};

// ============================================
// PUBLIC ROUTES (No Payment Required)
// ============================================

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        network: process.env.APTOS_NETWORK || 'testnet'
    });
});

/**
 * Agent discovery endpoint (meta info)
 */
app.get('/meta', (req: Request, res: Response) => {
    res.json({
        name: 'Sentience Node 01',
        version: '1.0.0',
        type: 'Oracle',
        payment_address: process.env.SERVER_WALLET,
        network: process.env.APTOS_NETWORK || 'testnet',
        capabilities: ['reputation', 'shards', 'genesis'],
        endpoints: {
            public: ['/health', '/meta', '/agents'],
            paid: ['/service/data', '/shard/*'],
            reputation_gated: ['/shard/2']
        },
        x402: {
            supported: true,
            min_payment: 500000,
            currency: 'APT'
        }
    });
});

/**
 * List registered agents (from on-chain registry)
 */
app.get('/agents', async (req: Request, res: Response) => {
    const tag = req.query.tag as string;

    // TODO: Query on-chain registry
    res.json({
        tag: tag || 'all',
        agents: [],
        message: 'Query the on-chain registry for live data'
    });
});

// ============================================
// PAID ROUTES (x402 Payment Required)
// ============================================

/**
 * Primary service endpoint - returns data after payment
 * This demonstrates the basic x402 flow
 */
app.get('/service/data',
    // Uncomment after SDK install:
    // paymentMiddleware(x402Config),
    simulatePaymentRequired(),
    (req: Request, res: Response) => {
        res.json({
            success: true,
            secret_data: 'Welcome to the Sentience Network!',
            timestamp: Date.now(),
            message: 'You have successfully completed an x402 payment'
        });
    }
);

/**
 * Reputation-gated service
 * Requires trust score > 10 AND payment
 */
app.get('/service/premium',
    // paymentMiddleware({ ...x402Config, price: 1000000 }),
    simulatePaymentRequired(),
    checkReputationMiddleware(10_000_000),
    (req: Request, res: Response) => {
        res.json({
            success: true,
            premium_data: 'This is premium content for trusted agents',
            your_trust_score: req.trustScore,
            your_rank: req.trustRank
        });
    }
);

// ============================================
// EASTER EGG HUNT ROUTES
// ============================================

app.use('/shard', shardRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} does not exist`,
        available_endpoints: ['/health', '/meta', '/service/data', '/shard/level/1']
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simulates x402 402 response for testing without SDK
 * Remove this once aptos-x402 is installed
 */
function simulatePaymentRequired() {
    return (req: Request, res: Response, next: NextFunction) => {
        const paymentHeader = req.headers['x-payment'] as string;

        if (!paymentHeader) {
            // Return 402 Payment Required
            res.setHeader('WWW-Authenticate',
                `x402 chain="aptos" address="${process.env.SERVER_WALLET}" amount="${x402Config.price}"`
            );
            return res.status(402).json({
                error: 'Payment Required',
                payment_details: {
                    chain: 'aptos',
                    network: process.env.APTOS_NETWORK || 'testnet',
                    recipient: process.env.SERVER_WALLET,
                    amount: x402Config.price,
                    currency: 'octas (APT * 10^8)'
                },
                instructions: [
                    '1. Send payment to the recipient address',
                    '2. Retry request with X-Payment header containing tx hash',
                    '3. Include X-Payment-Chain: aptos header'
                ]
            });
        }

        // Payment provided - verify (in real SDK this would check on-chain)
        console.log(`Payment received: ${paymentHeader}`);
        next();
    };
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧠 SENTIENCE NODE ONLINE                               ║
║                                                           ║
║   Network:  ${(process.env.APTOS_NETWORK || 'testnet').padEnd(42)}║
║   Port:     ${String(PORT).padEnd(42)}║
║   Wallet:   ${(process.env.SERVER_WALLET || 'Not configured').substring(0, 20)}...${' '.repeat(18)}║
║                                                           ║
║   x402 Payments:  ENABLED                                ║
║   Reputation:     ENABLED                                ║
║   Easter Eggs:    5 SHARDS HIDDEN                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    console.log('Available endpoints:');
    console.log('  GET /health          - Health check');
    console.log('  GET /meta            - Node metadata');
    console.log('  GET /service/data    - Paid service (x402)');
    console.log('  GET /shard/level/1-5 - Easter egg hunt');
    console.log('');
});

export default app;
