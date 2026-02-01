/**
 * AI Agent x402 Client Demo
 * Shows how AI agents sign transactions AUTOMATICALLY
 */

console.log('\n🤖 AI AGENT x402 DEMO');
console.log('='.repeat(50));
console.log('This agent makes payments AUTOMATICALLY - no human approval!\n');

// Simulate agent wallet generation
const agentAddress = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
console.log('🔑 Agent Wallet Address:', agentAddress);
console.log('   (No Petra popup needed - agent has its own keys)\n');

// Step 1: Simulate calling x402 endpoint
console.log('📡 Step 1: Calling x402 endpoint...');
console.log('💰 Response: 402 PAYMENT REQUIRED');
console.log('   Server says: "Pay 0.01 USDC first!"\n');

// Step 2: Agent signs AUTOMATICALLY
console.log('🤖 Step 2: Agent signing payment AUTOMATICALLY...');
console.log('   ⚡ No human approval needed!');
console.log('   ⚡ No wallet popup!');
console.log('   ⚡ Agent uses its own private key!');
const paymentSig = 'aG9zdC1zaWduZWQtcGF5bWVudC0' + Date.now();
console.log('   ✅ Signed:', paymentSig.slice(0, 30) + '...\n');

// Step 3: Retry with payment
console.log('📡 Step 3: Retrying with X-Payment header...');
console.log('   Headers: { "X-Payment": "' + paymentSig.slice(0, 20) + '..." }');
console.log('   Response: 200 OK');
console.log('   ✅ Got protected data!\n');

console.log('='.repeat(50));
console.log('🎯 KEY POINT:');
console.log('');
console.log('   👤 Human wallets (Petra)  → Need popup approval');
console.log('   🤖 AI Agent wallets       → Sign AUTOMATICALLY!');
console.log('');
console.log('   This is how x402 enables M2M payments.');
console.log('='.repeat(50) + '\n');
