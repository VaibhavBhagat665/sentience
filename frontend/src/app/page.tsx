'use client';

import React, { useState, useEffect } from 'react';

const MODULE_ADDRESS = '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';
const APTOS_NODE = 'https://fullnode.testnet.aptoslabs.com/v1';

interface WalletState {
    connected: boolean;
    address: string | null;
    balance: number;
}

export default function Home() {
    const [wallet, setWallet] = useState<WalletState>({ connected: false, address: null, balance: 0 });
    const [status, setStatus] = useState('');
    const [agentName, setAgentName] = useState('');
    const [agentDesc, setAgentDesc] = useState('');
    const [agentEndpoint, setAgentEndpoint] = useState('');
    const [shards, setShards] = useState<boolean[]>([false, false, false, false, false]);
    const [loading, setLoading] = useState(false);

    // Check for Petra wallet
    useEffect(() => {
        checkWallet();
    }, []);

    const checkWallet = async () => {
        if (typeof window !== 'undefined' && (window as any).aptos) {
            try {
                const response = await (window as any).aptos.account();
                const balanceRes = await fetch(`${APTOS_NODE}/accounts/${response.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`);
                const balanceData = await balanceRes.json();
                const balance = parseInt(balanceData.data?.coin?.value || '0') / 100000000;
                setWallet({ connected: true, address: response.address, balance });
            } catch (e) {
                setWallet({ connected: false, address: null, balance: 0 });
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !(window as any).aptos) {
            alert('Please install Petra Wallet extension!');
            window.open('https://petra.app/', '_blank');
            return;
        }
        try {
            await (window as any).aptos.connect();
            await checkWallet();
            setStatus('✅ Wallet connected!');
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
    };

    const registerAgent = async () => {
        if (!wallet.connected) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus('Registering agent on-chain...');

        try {
            const payload = {
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::identity::register_agent`,
                type_arguments: [],
                arguments: [agentName, agentDesc, agentEndpoint, false]
            };

            const response = await (window as any).aptos.signAndSubmitTransaction(payload);
            setStatus(`✅ Agent registered! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    const collectShard = async (level: number) => {
        if (!wallet.connected) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus(`Collecting shard ${level}...`);

        try {
            // Initialize collection if first shard
            if (!shards.some(s => s)) {
                const initPayload = {
                    type: 'entry_function_payload',
                    function: `${MODULE_ADDRESS}::genesis::init_collection`,
                    type_arguments: [],
                    arguments: []
                };
                await (window as any).aptos.signAndSubmitTransaction(initPayload);
            }

            const payload = {
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::genesis::collect_shard`,
                type_arguments: [],
                arguments: [level]
            };

            const response = await (window as any).aptos.signAndSubmitTransaction(payload);
            const newShards = [...shards];
            newShards[level - 1] = true;
            setShards(newShards);
            setStatus(`✅ Shard ${level} collected! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    const assembleGenesis = async () => {
        if (!shards.every(s => s)) {
            setStatus('Collect all 5 shards first!');
            return;
        }
        setLoading(true);
        setStatus('Assembling Genesis Prime NFT...');

        try {
            const payload = {
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::genesis::assemble`,
                type_arguments: [],
                arguments: []
            };

            const response = await (window as any).aptos.signAndSubmitTransaction(payload);
            setStatus(`🏆 GENESIS PRIME NFT MINTED! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '3rem', margin: 0 }}>🧠 Project Sentience</h1>
                <p style={{ color: '#888', fontSize: '1.2rem' }}>Autonomous Identity & Reputation for AI Agents</p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>x402 Hackathon | Aptos Testnet</p>
            </div>

            {/* Wallet Connection */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                maxWidth: '600px',
                margin: '0 auto 30px',
                textAlign: 'center'
            }}>
                {wallet.connected ? (
                    <div>
                        <p style={{ color: '#4ade80' }}>✅ Connected</p>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#888' }}>
                            {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                        </p>
                        <p style={{ color: '#fbbf24' }}>{wallet.balance.toFixed(4)} APT</p>
                    </div>
                ) : (
                    <button
                        onClick={connectWallet}
                        style={{
                            background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                            border: 'none',
                            color: 'white',
                            padding: '15px 40px',
                            fontSize: '1.1rem',
                            borderRadius: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        🔗 Connect Petra Wallet
                    </button>
                )}
            </div>

            {/* Status */}
            {status && (
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '15px',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    margin: '0 auto 30px',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                }}>
                    {status}
                </div>
            )}

            {/* Agent Registration */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '25px',
                maxWidth: '600px',
                margin: '0 auto 30px'
            }}>
                <h2 style={{ marginTop: 0 }}>🤖 Register Agent Identity</h2>
                <input
                    type="text"
                    placeholder="Agent Name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white'
                    }}
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={agentDesc}
                    onChange={(e) => setAgentDesc(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white'
                    }}
                />
                <input
                    type="text"
                    placeholder="Endpoint URL"
                    value={agentEndpoint}
                    onChange={(e) => setAgentEndpoint(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white'
                    }}
                />
                <button
                    onClick={registerAgent}
                    disabled={loading || !wallet.connected}
                    style={{
                        width: '100%',
                        padding: '15px',
                        background: loading ? '#555' : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    {loading ? 'Processing...' : '📝 Register On-Chain'}
                </button>
            </div>

            {/* Easter Egg Hunt */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '25px',
                maxWidth: '600px',
                margin: '0 auto 30px'
            }}>
                <h2 style={{ marginTop: 0 }}>🔮 Easter Egg Hunt</h2>
                <p style={{ color: '#888' }}>Collect all 5 shards to mint the Genesis Prime NFT!</p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <button
                            key={level}
                            onClick={() => collectShard(level)}
                            disabled={loading || shards[level - 1]}
                            style={{
                                flex: 1,
                                minWidth: '100px',
                                padding: '20px 10px',
                                background: shards[level - 1]
                                    ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '12px',
                                cursor: shards[level - 1] ? 'default' : 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            {shards[level - 1] ? '✅' : `Shard ${level}`}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p>Progress: {shards.filter(s => s).length}/5</p>
                    {shards.every(s => s) && (
                        <button
                            onClick={assembleGenesis}
                            disabled={loading}
                            style={{
                                marginTop: '15px',
                                padding: '20px 40px',
                                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}
                        >
                            🏆 ASSEMBLE GENESIS PRIME
                        </button>
                    )}
                </div>
            </div>

            {/* Magic Spell */}
            <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
            }}>
                <p>🔮 Hidden Easter Egg: Find the Magic Spell in the <code style={{ color: '#8b5cf6' }}>reputation.move</code> contract!</p>
                <p style={{ fontSize: '0.8rem' }}>
                    Contract: <a
                        href={`https://explorer.aptoslabs.com/account/${MODULE_ADDRESS}?network=testnet`}
                        target="_blank"
                        style={{ color: '#3b82f6' }}
                    >
                        View on Explorer
                    </a>
                </p>
            </div>
        </div>
    );
}
