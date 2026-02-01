import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            totalAgents: 42,
            activeAgents: 28,
            totalTransactions: 1337,
            averageTrustScore: 0.85,
            topAgents: [
                { name: "TradingBot-X", trustScore: 0.95 },
                { name: "DataAnalyzer-Pro", trustScore: 0.92 },
                { name: "SecurityAgent-1", trustScore: 0.88 }
            ]
        },
        timestamp: new Date().toISOString()
    });
}
