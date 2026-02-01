'use client';

import React, { useState, useEffect } from 'react';
import { Account } from '@aptos-labs/ts-sdk';
import { x402Client, wrapFetchWithPayment } from '@rvk_rishikesh/fetch';
import { registerExactAptosScheme } from '@rvk_rishikesh/aptos/exact/client';
import { BrowserSigner } from './BrowserSigner';

const MODULE_ADDRESS = '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'register' | 'hunt' | 'x402'>('x402');
    const [showCelebration, setShowCelebration] = useState(false);

    // x402 State
    const [x402Response, setX402Response] = useState<any>(null);
    const [x402Loading, setX402Loading] = useState(false);
    const [fetchWithPayment, setFetchWithPayment] = useState<any>(null);

    // Game State
    const [shards, setShards] = useState<boolean[]>([false, false, false, false, false]);
    const shardNames = ['Observer 👁️', 'Sybil 🎭', 'Ghost 👻', 'Mirror 🪞', 'Void 🌀'];

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        if (typeof window !== 'undefined' && (window as any).aptos) {
            try {
                if (await (window as any).aptos.isConnected()) {
                    await connectWallet();
                }
            } catch (e) {
                console.log('Not connected');
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !(window as any).aptos) {
            setStatus('❌ Please install Petra wallet!');
            window.open('https://petra.app', '_blank');
            return;
        }

        try {
            const aptos = (window as any).aptos;
            const response = await aptos.connect();
            const accountInfo = await aptos.account();

            if (!accountInfo.publicKey) {
                throw new Error("Could not retrieve public key from wallet");
            }

            const address = response.address || accountInfo.address;
            setWalletAddress(address);

            // Initialize x402 with BrowserSigner
            const browserSigner = new BrowserSigner(address, accountInfo.publicKey);

            // We cast to Account because x402 SDK expects Account type but only uses signTransaction
            const mockAccount = browserSigner as unknown as Account;

            const x402client = new x402Client();
            registerExactAptosScheme(x402client, { signer: mockAccount });
            const wrappedFetch = wrapFetchWithPayment(fetch, x402client);

            setFetchWithPayment(() => wrappedFetch);
            setStatus('✅ Wallet Connected & x402 Ready!');
        } catch (e: any) {
            console.error(e);
            setStatus('❌ ' + (e.message || "Connection failed"));
        }
    };

    const disconnectWallet = async () => {
        if ((window as any).aptos) {
            await (window as any).aptos.disconnect();
            setWalletAddress(null);
            setFetchWithPayment(null);
            setStatus('Disconnected');
        }
    };

    // x402 Demo: Call premium API
    const callX402Api = async (endpoint: string) => {
        // If wallet is connected, use wrapped fetch (auto-pay)
        // If not, use regular fetch (show 402)
        const doAutoPay = !!fetchWithPayment;

        setX402Loading(true);
        setX402Response(null);
        setStatus(doAutoPay ? `💳 Calling with auto-pay: ${endpoint}...` : `💳 Calling API: ${endpoint}...`);

        try {
            const fetcher = doAutoPay ? fetchWithPayment : fetch;
            const response = await fetcher(endpoint, { method: 'GET' });

            // Handle success
            if (response.ok) {
                const data = await response.json();
                setX402Response({
                    status: 200,
                    message: doAutoPay ? 'Success with auto-payment!' : 'Success!',
                    data,
                    transactionHash: response.headers.get('payment-response') || (doAutoPay ? 'paid' : null)
                });
                setStatus('✅ Request successful!');
                return true;
            }
            // Handle 402
            else if (response.status === 402) {
                const paymentRequired = response.headers.get('payment-required');
                setX402Response({
                    status: 402,
                    message: 'Payment Required!',
                    paymentInfo: paymentRequired || 'x402 payment needed',
                    headers: Object.fromEntries(response.headers.entries())
                });
                setStatus(doAutoPay ? '❌ Auto-pay failed (check balance)' : '💰 402 Payment Required - Connect Wallet to Auto-Pay!');
            }
            // Handle other errors
            else {
                setX402Response({
                    status: response.status,
                    message: response.statusText
                });
                setStatus(`❌ Error: ${response.status}`);
            }
        } catch (e: any) {
            setStatus('❌ ' + e.message);
            setX402Response({ error: e.message });
        }
        setX402Loading(false);
        return false;
    };

    const collectShard = async (level: number) => {
        if (!walletAddress) {
            setStatus('Connect wallet first!');
            return;
        }

        // Use x402 to "collect" (pay for) the shard
        const success = await callX402Api(`/api/premium/shard/${level}`);

        if (success) {
            const newShards = [...shards];
            newShards[level - 1] = true;
            setShards(newShards);
            setStatus(`✨ Shard ${level} collected via x402!`);
        }
    };

    const assembleGenesis = async () => {
        if (!shards.every(s => s)) {
            setStatus('Collect all 5 shards first!');
            return;
        }
        setLoading(true);
        // Here we would mint the NFT on-chain
        setTimeout(() => {
            setShowCelebration(true);
            setLoading(false);
        }, 2000);
    };

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
                                    ✅ Connected to Wallet
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
                        <button className={`tab-btn ${activeTab === 'x402' ? 'active' : ''}`} onClick={() => setActiveTab('x402')}>
                            💳 x402 Demo
                        </button>
                        <button className={`tab-btn ${activeTab === 'hunt' ? 'active' : ''}`} onClick={() => setActiveTab('hunt')}>
                            🔮 Easter Egg Hunt
                        </button>
                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                            🤖 About
                        </button>
                    </div>

                    {/* x402 Demo Tab */}
                    {activeTab === 'x402' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>
                                💳 x402 Payment Protocol Demo
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
                                {walletAddress
                                    ? "Click below to make auto-paid requests using your wallet signature!"
                                    : "Connect wallet to enable automatic x402 payments."
                                }
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <button
                                    onClick={() => callX402Api('/api/premium/agents')}
                                    disabled={x402Loading}
                                    className="glow-button"
                                    style={{ width: '100%' }}
                                >
                                    {x402Loading ? '⏳ Paid Request in progress...' : (walletAddress ? '🤖 Call Premium Agents API ($0.01)' : '🤖 Call API (Will return 402)')}
                                </button>
                                <button
                                    onClick={() => callX402Api('/api/premium/shard/1')}
                                    disabled={x402Loading}
                                    className="glow-button"
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                >
                                    {x402Loading ? '⏳ Collected...' : '👁️ Call Shard 1 API ($0.01)'}
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
                        </div>
                    )}

                    {/* Easter Egg Hunt Tab */}
                    {activeTab === 'hunt' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>
                                🔮 Collect 5 Shards
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '24px' }}>
                                Each shard requires a real x402 micropayment to collect!
                            </p>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => collectShard(level)}
                                        disabled={loading || shards[level - 1]}
                                        className={`shard-btn ${shards[level - 1] ? 'collected' : ''}`}
                                    >
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

                    {/* About Tab */}
                    {activeTab === 'register' && (
                        <div className="glass" style={{ padding: '32px' }}>
                            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>
                                🤖 Project Sentience
                            </h2>
                            <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                <p style={{ marginBottom: '16px' }}>
                                    <strong>Real x402 Integration:</strong> This app connects to your Petral wallet.
                                    When you call an API, it returns 402 Payment Required.
                                    The app then uses your wallet to sign a payment transaction and resends the request with the proof!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px', color: 'rgba(255,255,255,0.4)' }}>
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
                    }}>
                        <div style={{ textAlign: 'center', zIndex: 1001 }}>
                            <div style={{ fontSize: '6rem', marginBottom: '24px' }}>🏆</div>
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
