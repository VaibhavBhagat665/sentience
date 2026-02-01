import { paymentProxy } from "@rvk_rishikesh/next";
import { x402ResourceServer } from "@rvk_rishikesh/core/server";
import { ExactAptosScheme } from "@rvk_rishikesh/aptos/exact/server";
import type { Network } from "@rvk_rishikesh/core/types";
import { HTTPFacilitatorClient } from "@rvk_rishikesh/core/server";
import { NextRequest, NextResponse } from "next/server";

// Payment recipient address (your deployed contract address)
const payTo = "0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c";

// Initialize the facilitator client
const localFacilitator = new HTTPFacilitatorClient({
    url: "https://x402-navy.vercel.app/facilitator/"
});

// Create Aptos scheme for USDC payments
const sentienceAptosScheme = new ExactAptosScheme();

// Register USDC parser (6 decimals)
sentienceAptosScheme.registerMoneyParser(async (amount: number, network: string) => {
    const decimals = 6;
    const atomicAmount = BigInt(Math.round(amount * Math.pow(10, decimals))).toString();

    return {
        amount: atomicAmount,
        asset: "0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832", // Testnet USDC
        extra: { symbol: "USDC" }
    };
});

// Create x402 Resource Server
const sentienceServer = new x402ResourceServer([localFacilitator])
    .register("aptos:2" as Network, sentienceAptosScheme);

// Define paid routes
const paidRoutes = {
    "/api/premium/agents": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.01",
                network: "aptos:2" as Network,
            },
        ],
        description: "Access Sentience Agent Database",
        mimeType: "application/json",
    },
    "/api/premium/shard/1": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.01",
                network: "aptos:2" as Network,
            },
        ],
        description: "Level 1: The Observer - First x402 Payment",
        mimeType: "application/json",
    },
    "/api/premium/shard/2": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.01",
                network: "aptos:2" as Network,
            },
        ],
        description: "Level 2: The Sybil - Trust Score Required",
        mimeType: "application/json",
    },
    "/api/premium/shard/3": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.01",
                network: "aptos:2" as Network,
            },
        ],
        description: "Level 3: The Ghost - Soulbound Identity",
        mimeType: "application/json",
    },
    "/api/premium/shard/4": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.05",
                network: "aptos:2" as Network,
            },
        ],
        description: "Level 4: The Mirror - Magic Spell Required",
        mimeType: "application/json",
    },
    "/api/premium/shard/5": {
        accepts: [
            {
                scheme: "exact" as const,
                payTo: payTo as `0x${string}`,
                price: "$0.10",
                network: "aptos:2" as Network,
            },
        ],
        description: "Level 5: The Void - High Value Transaction",
        mimeType: "application/json",
    },
};

// Create payment proxy
const sentienceProxy = paymentProxy(paidRoutes, sentienceServer, undefined, undefined, false);

// Middleware function
export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Handle premium/paid routes
    if (path.startsWith('/api/premium/')) {
        return await sentienceProxy(request);
    }

    return NextResponse.next();
}

// Configure which paths run through middleware
export const config = {
    matcher: ["/api/premium/:path*"],
};
