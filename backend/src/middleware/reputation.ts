import { Request, Response, NextFunction } from 'express';

// Extend Request to include reputation data
declare global {
    namespace Express {
        interface Request {
            trustScore?: number;
            trustRank?: number;
            agentAddress?: string;
        }
    }
}

/**
 * Middleware to check if requester meets trust threshold
 * For hackathon demo - uses mock scores (real implementation would query chain)
 */
export function checkReputationMiddleware(minScore: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const agentAddress = req.headers['x-agent-address'] as string;

        if (!agentAddress) {
            return res.status(400).json({
                error: 'Missing X-Agent-Address header',
                message: 'You must provide your agent address to access reputation-gated endpoints'
            });
        }

        // For demo: Mock trust score based on agent address
        // In production, this would query the blockchain
        const mockScore = agentAddress.length > 10 ? 15_000_000 : 5_000_000;

        req.trustScore = mockScore;
        req.trustRank = 1;
        req.agentAddress = agentAddress;

        // Check threshold
        if (mockScore < minScore) {
            return res.status(403).json({
                error: 'Trust Score too low',
                required: minScore / 1_000_000,
                current: mockScore / 1_000_000,
                message: `Your trust score is ${mockScore / 1_000_000}. Required: ${minScore / 1_000_000}. Conduct more peer transactions to boost your score.`
            });
        }

        next();
    };
}

/**
 * Middleware for Easter Egg Level 4: The Oracle
 * Requires the Magic Spell to be provided
 */
export function magicSpellMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
        const providedSpell = req.headers['x-magic-spell'] as string;
        const magicSpell = process.env.MAGIC_SPELL || '0xf2dbdeb981aca16eb5cb33eab7';

        if (!providedSpell) {
            return res.status(403).json({
                error: 'The Oracle requires a Magic Spell',
                hint: 'Seek the spell in the reputation module...',
                level: 4
            });
        }

        if (providedSpell.toLowerCase() !== magicSpell.toLowerCase()) {
            return res.status(403).json({
                error: 'Invalid Magic Spell',
                message: 'The Oracle does not recognize this incantation',
                level: 4
            });
        }

        next();
    };
}

/**
 * Middleware to verify shard ownership (mock for demo)
 */
export function shardOwnershipMiddleware(requiredShards: number[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const agentAddress = req.headers['x-agent-address'] as string;

        if (!agentAddress) {
            return res.status(400).json({
                error: 'Missing X-Agent-Address header'
            });
        }

        // For demo: Mock owned shards
        // In production, this would query the blockchain
        const mockOwnedShards = [1, 2, 3, 4]; // Assume they have first 4

        for (const shardId of requiredShards) {
            if (!mockOwnedShards.includes(shardId)) {
                return res.status(403).json({
                    error: 'Missing required shards',
                    required: requiredShards,
                    owned: mockOwnedShards,
                    message: `You need shard ${shardId} to proceed`
                });
            }
        }

        next();
    };
}
