'use client';

import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const MODULE_ADDRESS = '0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c';

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export default function Home() {
    const { account, connected, connect, disconnect, signAndSubmitTransaction, wallets } = useWallet();
    const [status, setStatus] = useState('');
    const [agentName, setAgentName] = useState('');
    const [agentDesc, setAgentDesc] = useState('');
    const [agentEndpoint, setAgentEndpoint] = useState('');
    const [shards, setShards] = useState<boolean[]>([false, false, false, false, false]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'register' | 'hunt'>('register');
    const [showWalletList, setShowWalletList] = useState(false);

    const connectWallet = async (walletName: string) => {
        try {
            await connect(walletName);
            setStatus('✅ Wallet connected!');
            setShowWalletList(false);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
    };

    const registerAgent = async () => {
        if (!connected || !account) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus('🔄 Registering agent on-chain...');

        try {
            const response = await signAndSubmitTransaction({
                sender: account.address,
                data: {
                    function: `${MODULE_ADDRESS}::identity::register_agent`,
                    functionArguments: [agentName, agentDesc, agentEndpoint, false]
                }
            });

            await aptos.waitForTransaction({ transactionHash: response.hash });
            setStatus(`✅ Agent registered! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
    };

    const collectShard = async (level: number) => {
        if (!connected || !account) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus(`🔮 Collecting shard ${level}...`);

        try {
            if (!shards.some(s => s)) {
                const initResponse = await signAndSubmitTransaction({
                    sender: account.address,
                    data: {
                        function: `${MODULE_ADDRESS}::genesis::init_collection`,
                        functionArguments: []
                    }
                });
                await aptos.waitForTransaction({ transactionHash: initResponse.hash });
            }

            const response = await signAndSubmitTransaction({
                sender: account.address,
                data: {
                    function: `${MODULE_ADDRESS}::genesis::collect_shard`,
                    functionArguments: [level]
                }
            });

            await aptos.waitForTransaction({ transactionHash: response.hash });
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
        if (!connected || !account) {
            setStatus('Connect wallet first!');
            return;
        }
        setLoading(true);
        setStatus('🌟 Assembling Genesis Prime NFT...');

        try {
            const response = await signAndSubmitTransaction({
                sender: account.address,
                data: {
                    function: `${MODULE_ADDRESS}::genesis::assemble`,
                    functionArguments: []
                }
            });

            await aptos.waitForTransaction({ transactionHash: response.hash });
            setStatus(`🏆 GENESIS PRIME NFT MINTED! TX: ${response.hash.slice(0, 10)}...`);
        } catch (e: any) {
            setStatus('❌ ' + e.message);
        }
        setLoading(false);
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
                
                .wallet-option {
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .wallet-option:hover { background: rgba(255, 255, 255, 0.1); border-color: #667eea; }
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
                        {connected && account ? (
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
                                    {account.address.slice(0, 10)}...{account.address.slice(-8)}
                                </p>
                                <button
                                    onClick={disconnect}
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
                        ) : showWalletList ? (
                            <div>
                                <p style={{ marginBottom: '16px', fontFamily: 'Fredoka, sans-serif' }}>Select a Wallet:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {wallets?.filter(w => w.readyState === 'Installed').map((wallet) => (
                                        <button
                                            key={wallet.name}
                                            className="wallet-option"
                                            onClick={() => connectWallet(wallet.name)}
                                        >
                                            {wallet.icon && <img src={wallet.icon} alt="" style={{ width: 24, height: 24 }} />}
                                            {wallet.name}
                                        </button>
                                    ))}
                                    {wallets?.filter(w => w.readyState === 'Installed').length === 0 && (
                                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                                            No wallets installed. <a href="https://petra.app" target="_blank" style={{ color: '#667eea' }}>Install Petra</a>
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowWalletList(false)}
                                    style={{ marginTop: '12px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowWalletList(true)} className="glow-button" style={{ width: '100%' }}>
                                🔗 Connect Wallet
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
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                        <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                            🤖 Register Agent
                        </button>
                        <button className={`tab-btn ${activeTab === 'hunt' ? 'active' : ''}`} onClick={() => setActiveTab('hunt')}>
                            🔮 Easter Egg Hunt
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
                                <button onClick={registerAgent} disabled={loading || !connected} className="glow-button" style={{ marginTop: '8px' }}>
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
            </div>
        </>
    );
}
