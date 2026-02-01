/**
 * Project Sentience - x402 Payment-Gated Server
 * 
 * Implements the x402 protocol for Aptos:
 * - Returns 402 with PAYMENT-REQUIRED header for paid endpoints
 * - Verifies and settles payments via facilitator
 * - Integrates with Sentience identity/reputation contracts
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const PAYMENT_RECIPIENT = process.env.PAYMENT_RECIPIENT_ADDRESS || '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402-navy.vercel.app/facilitator';
const MODULE_ADDRESS = process.env.MODULE_ADDRESS || '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';

// Testnet APT (0xa) - Using native APT ensures users can pay via Faucet
const USDC_ASSET = '0xa';

// Price tiers (in USDC units, 6 decimals)
// Price tiers (in Octas, 8 decimals) - kept very low for testing
const PRICES = {
    basic: '100',        // 100 Octas (tiny amount)
    premium: '500',      // 500 Octas
    high: '1000'         // 1000 Octas
};

/**
 * Create x402 payment requirement payload
 */
function createPaymentRequired(price: string, description: string) {
    const payload = {
        version: '1',
        network: 'aptos:2', // 2 = testnet
        asset: USDC_ASSET,
        payee: PAYMENT_RECIPIENT,
        maxAmount: price,
        description,
        resource: '',
        scheme: 'exact',
        mimeType: 'application/json',
        outputSchema: null,
        extra: {
            name: 'Project Sentience',
            sponsored: true  // Facilitator pays gas
        }
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify and settle payment via facilitator
 */
async function processPayment(paymentSignature: string, paymentRequired: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        // Decode the payment signature
        const payload = JSON.parse(Buffer.from(paymentSignature, 'base64').toString());
        console.log(`[x402] Verifying payment from ${payload.sender || 'unknown'}...`);

        // Call facilitator /verify
        const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentPayload: paymentSignature,
                paymentRequirements: paymentRequired
            })
        });

        if (!verifyRes.ok) {
            const error = await verifyRes.text();
            return { success: false, error: `Verify failed: ${error}` };
        }

        // Call facilitator /settle
        const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentPayload: paymentSignature,
                paymentRequirements: paymentRequired
            })
        });

        if (!settleRes.ok) {
            const error = await settleRes.text();
            return { success: false, error: `Settle failed: ${error}` };
        }

        const result = await settleRes.json() as { txHash?: string; hash?: string };
        const tx = result.txHash || result.hash || 'completed';
        console.log(`[x402] Payment SETTLED via Facilitator. Tx: ${tx}`);
        return { success: true, txHash: tx };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * x402 Middleware - Checks for payment on protected routes
 */
function x402Middleware(price: string, description: string) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const paymentSignature = req.headers['x-payment'] as string || req.headers['payment-signature'] as string;

        if (!paymentSignature) {
            // No payment - return 402 with payment requirements
            const paymentRequired = createPaymentRequired(price, description);
            res.setHeader('X-Payment-Required', paymentRequired);
            res.setHeader('Payment-Required', paymentRequired);
            return res.status(402).json({
                error: 'Payment Required',
                message: description,
                price: `${parseInt(price) / 1000000} USDC`,
                network: 'aptos:testnet',
                paymentRequired
            });
        }

        // Payment provided - verify and settle
        const paymentRequired = createPaymentRequired(price, description);
        const result = await processPayment(paymentSignature, paymentRequired);

        if (!result.success) {
            return res.status(402).json({
                error: 'Payment Failed',
                message: result.error
            });
        }

        // Payment successful - add tx hash to response header
        res.setHeader('X-Payment-Response', JSON.stringify({ txHash: result.txHash }));
        res.setHeader('Payment-Response', JSON.stringify({ txHash: result.txHash }));

        // Attach payment info to request
        (req as any).payment = { txHash: result.txHash };
        console.log(`[Server] Access Granted: ${description}`);
        next();
    };
}

// ============================================
// PUBLIC ENDPOINTS (No payment required)
// ============================================

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/meta', (req, res) => {
    res.json({
        name: 'Project Sentience',
        description: 'Autonomous Identity & Reputation Protocol for AI Agents',
        version: '1.0.0',
        network: 'aptos:testnet',
        moduleAddress: MODULE_ADDRESS,
        capabilities: ['identity', 'reputation', 'x402-payments', 'easter-eggs'],
        paymentAsset: USDC_ASSET,
        payee: PAYMENT_RECIPIENT
    });
});

// ============================================
// PAID ENDPOINTS (x402 Protected)
// ============================================

// Basic paid service
app.get('/service/data', x402Middleware(PRICES.basic, 'Access Sentience Agent Database'), (req, res) => {
    res.json({
        success: true,
        data: {
            agents: 42,
            totalTransactions: 1337,
            averageTrustScore: 0.85
        },
        payment: (req as any).payment
    });
});

// ============================================
// EASTER EGG SHARD ENDPOINTS (x402 + Conditions)
// ============================================

// Level 1: The Observer - Basic x402 payment
app.get('/shard/level/1', x402Middleware(PRICES.basic, 'Level 1: The Observer - First x402 Payment'), (req, res) => {
    res.json({
        shard: 1,
        name: 'The Observer',
        fragment: 'You see the flow of value...',
        data: Buffer.from('observer_shard_1').toString('hex'),
        payment: (req as any).payment
    });
});

// Level 2: The Sybil - Requires trust score (simulated check)
app.get('/shard/level/2', x402Middleware(PRICES.basic, 'Level 2: The Sybil - Trust Score Required'), (req, res) => {
    // In production: verify trust score on-chain
    const trustScore = 15; // Simulated - would call contract

    if (trustScore < 10) {
        return res.status(403).json({
            error: 'Insufficient Trust',
            required: 10,
            current: trustScore
        });
    }

    res.json({
        shard: 2,
        name: 'The Sybil',
        fragment: 'Trust is earned, not given...',
        data: Buffer.from('sybil_shard_2').toString('hex'),
        trustScore,
        payment: (req as any).payment
    });
});

// Level 3: The Ghost - Requires soulbound identity
app.get('/shard/level/3', x402Middleware(PRICES.basic, 'Level 3: The Ghost - Soulbound Identity Required'), (req, res) => {
    // In production: verify soulbound status on-chain
    const isSoulbound = true; // Simulated

    res.json({
        shard: 3,
        name: 'The Ghost',
        fragment: 'Bound forever to the chain...',
        data: Buffer.from('ghost_shard_3').toString('hex'),
        soulbound: isSoulbound,
        payment: (req as any).payment
    });
});

// Level 4: The Mirror - Requires the Magic Spell
app.get('/shard/level/4', x402Middleware(PRICES.premium, 'Level 4: The Mirror - Magic Spell Required'), (req, res) => {
    const spellHeader = req.headers['x-magic-spell'] as string;
    const MAGIC_SPELL = '0xa1b2c3d4e5f6789012345678abcd'; // Hidden in reputation.move

    if (spellHeader !== MAGIC_SPELL) {
        return res.status(403).json({
            error: 'Magic Spell Required',
            hint: 'Find the spell in reputation.move contract'
        });
    }

    res.json({
        shard: 4,
        name: 'The Mirror',
        fragment: 'You found the reflection...',
        data: Buffer.from('mirror_shard_4').toString('hex'),
        spell: 'verified',
        payment: (req as any).payment
    });
});

// Level 5: The Void - High value transaction
app.get('/shard/level/5', x402Middleware(PRICES.high, 'Level 5: The Void - High Value Transaction'), (req, res) => {
    res.json({
        shard: 5,
        name: 'The Void',
        fragment: 'The final piece reveals the Genesis...',
        data: Buffer.from('void_shard_5').toString('hex'),
        complete: true,
        payment: (req as any).payment
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
🧠 Project Sentience - x402 Server
==================================
Port: ${PORT}
Network: Aptos Testnet
Facilitator: ${FACILITATOR_URL}
Recipient: ${PAYMENT_RECIPIENT}
Module: ${MODULE_ADDRESS}

Endpoints:
  GET /health          - Health check (free)
  GET /meta            - Node metadata (free)
  GET /service/data    - Paid service (0.01 USDC)
  GET /shard/level/1-5 - Easter egg hunt (paid)
    `);
});

export default app;
