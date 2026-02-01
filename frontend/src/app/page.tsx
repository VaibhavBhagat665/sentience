'use client';

import React, { useState, useEffect } from 'react';

const MODULE_ADDRESS = '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [agentName, setAgentName] = useState('');
    const [agentDesc, setAgentDesc] = useState('');
    const [agentEndpoint, setAgentEndpoint] = useState('');
    const [shards, setShards] = useState<boolean[]>([false, false, false, false, false]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'register' | 'hunt' | 'x402'>('register');
    const [showCelebration, setShowCelebration] = useState(false);
    const [x402Response, setX402Response] = useState<any>(null);
    const [x402Loading, setX402Loading] = useState(false);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        if (typeof window !== 'undefined' && window.aptos) {
            try {
                const isConnected = await window.aptos.isConnected();
                if (isConnected) {
                    const account = await window.aptos.account();
                    setWalletAddress(account.address);
                }
            } catch (e) {
                console.log('Not connected');
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.aptos) {
            setStatus('❌ Please install Petra wallet!');
            window.open('https://petra.app', '_blank');
            return;
        }
        try {
            const response = await window.aptos.connect();
            setWalletAddress(response.address);
            setStatus('✅ Wallet connected!');
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
    };

    const disconnectWallet = async () => {
        if (window.aptos) {
            await window.aptos.disconnect();
            setWalletAddress(null);
            setStatus('Disconnected');
        }
    };

    const registerAgent = async () => {
        if (!walletAddress || !window.aptos) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus('🔄 Registering agent on-chain...');

        try {
            const response = await window.aptos.signAndSubmitTransaction({
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::identity::register_agent`,
                type_arguments: [],
                arguments: [agentName, agentDesc, agentEndpoint, false]
            });
            setStatus(`✅ Agent registered! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    const collectShard = async (level: number) => {
        if (!walletAddress || !window.aptos) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus(`🔮 Collecting shard ${level}...`);

        try {
            if (!shards.some(s => s)) {
                await window.aptos.signAndSubmitTransaction({
                    type: 'entry_function_payload',
                    function: `${MODULE_ADDRESS}::genesis::init_collection`,
                    type_arguments: [],
                    arguments: []
                });
            }

            const response = await window.aptos.signAndSubmitTransaction({
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::genesis::collect_shard`,
                type_arguments: [],
                arguments: [level]
            });

            const newShards = [...shards];
            newShards[level - 1] = true;
            setShards(newShards);
            setStatus(`✨ Shard ${level} collected! TX: ${response.hash.slice(0, 10)}...`);
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
        if (!walletAddress || !window.aptos) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus('🌟 Assembling Genesis Prime NFT...');

        try {
            const response = await window.aptos.signAndSubmitTransaction({
                type: 'entry_function_payload',
                function: `${MODULE_ADDRESS}::genesis::assemble`,
                type_arguments: [],
                arguments: []
            });
            setStatus(`🏆 GENESIS PRIME NFT MINTED! TX: ${response.hash.slice(0, 10)}...`);
            setShowCelebration(true);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    // x402 Demo: Call premium API
    const callX402Api = async (endpoint: string) => {
        setX402Loading(true);
        setX402Response(null);
        setStatus(`💳 Calling x402 API: ${endpoint}...`);

        try {
            const response = await fetch(endpoint);

            if (response.status === 402) {
                const paymentRequired = response.headers.get('x-payment');
                const paymentRequiredAlt = response.headers.get('payment-required');
                setX402Response({
                    status: 402,
                    message: 'Payment Required!',
                    paymentInfo: paymentRequired || paymentRequiredAlt || 'x402 payment needed',
                    headers: Object.fromEntries(response.headers.entries())
                });
                setStatus('💰 402 Payment Required - x402 protocol working!');
            } else if (response.ok) {
                const data = await response.json();
                setX402Response({
                    status: 200,
                    message: 'Success!',
                    data
                });
                setStatus('✅ API call successful!');
            } else {
                setX402Response({
                    status: response.status,
                    message: response.statusText
                });
            }
        } catch (e: any) {
            setStatus('❌ ' + e.message);
            setX402Response({ error: e.message });
        }
        setX402Loading(false);
    };

    const shardNames = ['Observer 👁️', 'Sybil 🎭', 'Ghost 👻', 'Mirror 🪞', 'Void 🌀'];

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Space Grotesk', sans-serif;
                    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                
                .bg-blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.5;
                    animation: float 8s ease-in-out infinite;
                    z-index: 0;
                }
                
                .blob1 { width: 400px; height: 400px; background: #ff6b6b; top: -100px; left: -100px; }
                .blob2 { width: 500px; height: 500px; background: #4ecdc4; bottom: -150px; right: -150px; animation-delay: -4s; }
                .blob3 { width: 300px; height: 300px; background: #a855f7; top: 50%; left: 50%; animation-delay: -2s; }
                
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(30px, 30px) scale(1.1); }
                }
                
                .glass {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                }
                
                .glow-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    padding: 16px 32px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    font-family: 'Fredoka', sans-serif;
                }
                
                .glow-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6); }
                .glow-button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                
                .input-field {
                    width: 100%;
                    padding: 16px 20px;
                    border-radius: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    font-size: 1rem;
                    font-family: 'Space Grotesk', sans-serif;
                    transition: all 0.3s ease;
                }
                
                .input-field:focus { outline: none; border-color: #667eea; box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
                .input-field::placeholder { color: rgba(255, 255, 255, 0.4); }
                
                .shard-btn {
                    flex: 1;
                    min-width: 100px;
                    padding: 24px 12px;
                    border-radius: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Fredoka', sans-serif;
                }
                
                .shard-btn:hover:not(:disabled) { transform: translateY(-4px); border-color: #667eea; }
                .shard-btn.collected { background: linear-gradient(135deg, #10b981, #059669); border-color: #10b981; }
                
                .tab-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'Fredoka', sans-serif;
                }
                
                .tab-btn.active { background: rgba(255, 255, 255, 0.1); color: white; }
            `}</style>

            <div style={{ minHeight: '100vh', color: 'white', position: 'relative', padding: '20px' }}>
                <div className="bg-blob blob1"></div>
                <div className="bg-blob blob2"></div>
                <div className="bg-blob blob3"></div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '40px' }}>
                        <h1 style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #fff, #a855f7, #ec4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '12px'
                        }}>
                            🧠 Sentience
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'Fredoka, sans-serif' }}>
                            AI Agent Identity Protocol ✨
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                            x402 Hackathon • Aptos Testnet
                        </p>
                    </div>

                    {/* Wallet Card */}
                    <div className="glass" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
                        {walletAddress ? (
                            <div>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    borderRadius: '100px',
                                    color: '#10b981',
                                    fontWeight: 600,
                                    marginBottom: '12px'
                                }}>
                                    ✅ Connected
                                </div>
                                <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                                </p>
                                <button
                                    onClick={disconnectWallet}
                                    style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button onClick={connectWallet} className="glow-button" style={{ width: '100%' }}>
                                🔗 Connect Petra Wallet
                            </button>
                        )}
                    </div>

                    {/* Status */}
                    {status && (
                        <div className="glass" style={{ padding: '16px', marginBottom: '24px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                            {status}
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                            🤖 Register Agent
                        </button>
                        <button className={`tab-btn ${activeTab === 'hunt' ? 'active' : ''}`} onClick={() => setActiveTab('hunt')}>
                            🔮 Easter Egg Hunt
                        </button>
                        <button className={`tab-btn ${activeTab === 'x402' ? 'active' : ''}`} onClick={() => setActiveTab('x402')}>
                            💳 x402 Demo
                        </button>
                    </div>

                    {/* Register Agent Tab */}
                    {activeTab === 'register' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>
                                🤖 Create Your AI Agent
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <input type="text" placeholder="Agent Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="input-field" />
                                <input type="text" placeholder="Description" value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} className="input-field" />
                                <input type="text" placeholder="Endpoint URL" value={agentEndpoint} onChange={(e) => setAgentEndpoint(e.target.value)} className="input-field" />
                                <button onClick={registerAgent} disabled={loading || !walletAddress} className="glow-button" style={{ marginTop: '8px' }}>
                                    {loading ? '⏳ Processing...' : '📝 Register On-Chain'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Easter Egg Hunt Tab */}
                    {activeTab === 'hunt' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>
                                🔮 Collect 5 Shards
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '24px' }}>
                                Complete all levels to mint the Genesis Prime NFT!
                            </p>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button key={level} onClick={() => collectShard(level)} disabled={loading || shards[level - 1]} className={`shard-btn ${shards[level - 1] ? 'collected' : ''}`}>
                                        {shards[level - 1] ? '✅' : shardNames[level - 1]}
                                    </button>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'Fredoka, sans-serif' }}>
                                    <span>Progress</span>
                                    <span>{shards.filter(s => s).length}/5</span>
                                </div>
                                <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(shards.filter(s => s).length / 5) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2, #ec4899)', borderRadius: '100px', transition: 'width 0.5s ease' }}></div>
                                </div>
                            </div>

                            {shards.every(s => s) && (
                                <div style={{ textAlign: 'center' }}>
                                    <button onClick={assembleGenesis} disabled={loading} className="glow-button" style={{ padding: '24px 48px', fontSize: '1.4rem', background: 'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)' }}>
                                        🏆 MINT GENESIS PRIME
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* x402 Demo Tab */}
                    {activeTab === 'x402' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>
                                💳 x402 Payment Protocol Demo
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
                                Watch APIs return 402 Payment Required before granting access
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <button
                                    onClick={() => callX402Api('/api/premium/agents')}
                                    disabled={x402Loading}
                                    className="glow-button"
                                    style={{ width: '100%' }}
                                >
                                    {x402Loading ? '⏳ Loading...' : '🤖 Call Premium Agents API ($0.01)'}
                                </button>
                                <button
                                    onClick={() => callX402Api('/api/premium/shard/1')}
                                    disabled={x402Loading}
                                    className="glow-button"
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                >
                                    {x402Loading ? '⏳ Loading...' : '👁️ Call Shard 1 API ($0.01)'}
                                </button>
                                <button
                                    onClick={() => callX402Api('/api/premium/shard/5')}
                                    disabled={x402Loading}
                                    className="glow-button"
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                >
                                    {x402Loading ? '⏳ Loading...' : '🌀 Call Shard 5 API ($0.10)'}
                                </button>
                            </div>

                            {x402Response && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '12px',
                                        color: x402Response.status === 402 ? '#fbbf24' : x402Response.status === 200 ? '#10b981' : '#ef4444'
                                    }}>
                                        <span style={{ fontSize: '1.5rem' }}>
                                            {x402Response.status === 402 ? '💰' : x402Response.status === 200 ? '✅' : '❌'}
                                        </span>
                                        <span style={{ fontWeight: 'bold' }}>
                                            HTTP {x402Response.status} - {x402Response.message}
                                        </span>
                                    </div>
                                    <pre style={{
                                        overflow: 'auto',
                                        maxHeight: '200px',
                                        color: 'rgba(255,255,255,0.7)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all'
                                    }}>
                                        {JSON.stringify(x402Response, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                                    🔮 <strong>How it works:</strong> APIs return 402 Payment Required.
                                    The x402 client automatically signs payment and retries!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px', color: 'rgba(255,255,255,0.4)' }}>
                        <p style={{ marginBottom: '8px' }}>
                            🔮 <span style={{ color: '#a855f7' }}>Easter Egg:</span> Find the Magic Spell in{' '}
                            <code style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '4px 8px', borderRadius: '6px', color: '#a855f7' }}>reputation.move</code>
                        </p>
                        <a href={`https://explorer.aptoslabs.com/account/${MODULE_ADDRESS}?network=testnet`} target="_blank" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.9rem' }}>
                            View Smart Contracts on Explorer →
                        </a>
                    </div>
                </div>

                {/* Celebration Overlay */}
                {showCelebration && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <style>{`
                            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes bounce {
                                0%, 100% { transform: scale(1); }
                                50% { transform: scale(1.1); }
                            }
                        `}</style>

                        <div style={{ textAlign: 'center', zIndex: 1001 }}>
                            <div style={{ fontSize: '6rem', marginBottom: '24px', animation: 'bounce 1s infinite' }}>
                                🏆
                            </div>
                            <h1 style={{
                                fontFamily: 'Fredoka, sans-serif',
                                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                                background: 'linear-gradient(135deg, #fbbf24, #ec4899, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '16px'
                            }}>
                                GENESIS PRIME UNLOCKED!
                            </h1>
                            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                                You found all 5 shards and assembled the Genesis NFT!
                            </p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
                                🧠 Welcome to Project Sentience
                            </p>
                            <button
                                onClick={() => setShowCelebration(false)}
                                className="glow-button"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                            >
                                ✨ Continue
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
