import { NextResponse } from 'next/server';

const shardData: Record<string, any> = {
    '1': {
        shard: 1,
        name: 'The Observer',
        fragment: 'You see the flow of value...',
        data: Buffer.from('observer_shard_1').toString('hex'),
        level: 'Basic x402 Payment'
    },
    '2': {
        shard: 2,
        name: 'The Sybil',
        fragment: 'Trust is earned, not given...',
        data: Buffer.from('sybil_shard_2').toString('hex'),
        level: 'Trust Score Required'
    },
    '3': {
        shard: 3,
        name: 'The Ghost',
        fragment: 'Bound forever to the chain...',
        data: Buffer.from('ghost_shard_3').toString('hex'),
        level: 'Soulbound Identity'
    },
    '4': {
        shard: 4,
        name: 'The Mirror',
        fragment: 'You found the reflection...',
        data: Buffer.from('mirror_shard_4').toString('hex'),
        level: 'Magic Spell Required'
    },
    '5': {
        shard: 5,
        name: 'The Void',
        fragment: 'The final piece reveals the Genesis...',
        data: Buffer.from('void_shard_5').toString('hex'),
        level: 'High Value Transaction'
    }
};

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const shard = shardData[id];

    if (!shard) {
        return NextResponse.json({ error: 'Shard not found' }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        ...shard,
        timestamp: new Date().toISOString()
    });
}
