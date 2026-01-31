import { Router, Request, Response } from 'express';
// Note: Import from aptos-x402 once installed
// import { paymentMiddleware, PaymentConfig } from 'aptos-x402';

const router = Router();

// Shard data for Easter Egg levels
const SHARDS = {
    1: {
        id: 1,
        name: 'The Observer',
        data: '0x4f42534552564552',
        description: 'You have learned to observe the x402 flow'
    },
    2: {
        id: 2,
        name: 'The Sybil',
        data: '0x535942494c',
        description: 'Your reputation proves you are not a Sybil'
    },
    3: {
        id: 3,
        name: 'The Ghost',
        data: '0x47484f5354',
        description: 'You have bound your soul to the chain'
    },
    4: {
        id: 4,
        name: 'The Mirror',
        data: '0x4d4952524f52',
        description: 'You have seen through the Oracle'
    },
    5: {
        id: 5,
        name: 'The Void',
        data: '0x564f4944',
        description: 'You have embraced the void'
    }
};

/**
 * Level 1: The Observer
 * Basic x402 payment flow - just pay and receive
 */
router.get('/level/1',
    // paymentMiddleware({ price: 100000, recipientAddress: process.env.SERVER_WALLET }),
    (req: Request, res: Response) => {
        res.json({
            success: true,
            level: 1,
            shard: SHARDS[1],
            message: 'Welcome, Observer. You have completed the first trial.',
            next_hint: 'Level 2 requires trust. Build your reputation.'
        });
    }
);

/**
 * Level 2: The Sybil
 * Reputation-gated - must have trust score > 10
 */
router.get('/level/2',
    // paymentMiddleware({ price: 200000, recipientAddress: process.env.SERVER_WALLET }),
    // checkReputationMiddleware(10_000_000), // 10.0 score
    (req: Request, res: Response) => {
        const trustScore = req.trustScore || 0;

        // Manual check for now (middleware will be wired)
        if (trustScore < 10_000_000) {
            return res.status(403).json({
                error: 'Trust Score too low',
                required: 10,
                current: trustScore / 1_000_000,
                message: 'Prove you are not a Sybil by building reputation'
            });
        }

        res.json({
            success: true,
            level: 2,
            shard: SHARDS[2],
            message: 'You have proven your worth, non-Sybil.',
            next_hint: 'Level 3 requires a soulbound identity.'
        });
    }
);

/**
 * Level 3: The Ghost
 * Requires a soulbound agent identity
 */
router.get('/level/3',
    // paymentMiddleware({ price: 300000, recipientAddress: process.env.SERVER_WALLET }),
    async (req: Request, res: Response) => {
        const agentAddress = req.headers['x-agent-address'] as string;

        if (!agentAddress) {
            return res.status(400).json({
                error: 'Missing X-Agent-Address header'
            });
        }

        // TODO: Verify soulbound status on-chain
        // const isSoulbound = await checkSoulbound(agentAddress);

        res.json({
            success: true,
            level: 3,
            shard: SHARDS[3],
            message: 'Your soul is now bound to the chain, Ghost.',
            next_hint: 'Level 4 requires the Magic Spell from the Oracle.'
        });
    }
);

/**
 * Level 4: The Mirror (The Oracle)
 * Requires the Magic Spell: 0xf2dbdeb981aca16eb5cb33eab7
 */
router.get('/level/4',
    // paymentMiddleware({ price: 400000, recipientAddress: process.env.SERVER_WALLET }),
    // magicSpellMiddleware(),
    (req: Request, res: Response) => {
        const magicSpell = req.headers['x-magic-spell'] as string;
        const expectedSpell = process.env.MAGIC_SPELL || '0xf2dbdeb981aca16eb5cb33eab7';

        if (!magicSpell || magicSpell.toLowerCase() !== expectedSpell.toLowerCase()) {
            return res.status(403).json({
                error: 'The Oracle requires a Magic Spell',
                hint: 'The spell is hidden in the reputation module...',
                level: 4
            });
        }

        res.json({
            success: true,
            level: 4,
            shard: SHARDS[4],
            message: 'The Oracle sees through you. You have earned the Mirror.',
            magic_spell_confirmed: expectedSpell,
            next_hint: 'Level 5 awaits in the Void. Bring great value.'
        });
    }
);

/**
 * Level 5: The Void
 * High-value transaction - tests facilitator limits
 */
router.get('/level/5',
    // paymentMiddleware({ price: 1_000_000_000, recipientAddress: process.env.SERVER_WALLET }), // 10 APT
    // shardOwnershipMiddleware([1, 2, 3, 4]), // Must have first 4 shards
    (req: Request, res: Response) => {
        res.json({
            success: true,
            level: 5,
            shard: SHARDS[5],
            message: 'You have embraced the Void. All five shards are yours.',
            final_hint: 'Call sentience::genesis::assemble to claim the Genesis Prime NFT!'
        });
    }
);

/**
 * Get current progress
 */
router.get('/progress',
    (req: Request, res: Response) => {
        const agentAddress = req.headers['x-agent-address'] as string;

        // TODO: Query on-chain for actual progress
        res.json({
            agent: agentAddress || 'unknown',
            shards_collected: [],
            total_shards: 5,
            genesis_assembled: false
        });
    }
);

export default router;
