# 🧠 Project Sentience

> **The Autonomous Identity & Reputation Protocol for the Agentic Economy**

Built for the **Aptos x402 Hackathon** - a decentralized protocol enabling autonomous AI agents to establish persistent identity, build verifiable reputation, and execute frictionless micropayments.

## 🔗 Live Demo

| Component | URL |
|-----------|-----|
| **Frontend** | https://sentience-eight.vercel.app |
| **Backend (x402)** | https://sentience-m4pz.onrender.com |
| **Smart Contracts** | [View on Explorer](https://explorer.aptoslabs.com/account/0x0d0b4c628d57f3ffafa1259f1403595c1c07d0e7a0995018fd59e72d1aebfc8c?network=testnet) |

---

## 🎯 Problem Statement

The "Agentic Economy" lacks infrastructure for AI agents to:
- **Maintain persistent identity** independent of private keys
- **Build verifiable reputation** across peer-to-peer interactions  
- **Execute frictionless micropayments** for machine-to-machine transactions

## 🛠️ Solution Architecture

| Pillar | Technology | Purpose |
|--------|------------|---------|
| **Identity** | Aptos Move Objects | Persistent, recoverable agent identities |
| **Reputation** | EigenTrust Algorithm | Mathematical consensus-based trust scoring |
| **Exchange** | x402 Payment Protocol | HTTP 402 machine-to-machine micropayments |

---

## 📁 Project Structure

```
x402/
├── move/                    # Smart Contracts
│   ├── sources/
│   │   ├── identity.move    # Agent Object identities
│   │   ├── reputation.move  # EigenTrust scoring
│   │   ├── registry.move    # Agent discovery
│   │   └── genesis.move     # Easter egg NFT
│   └── Move.toml
├── backend/                 # x402 Server
│   ├── src/
│   │   ├── server.ts        # Express app
│   │   ├── middleware/      # Reputation gates
│   │   └── routes/          # Shard endpoints
│   └── package.json
└── frontend/                # React UI
    └── src/components/      # Wallet + payments
```

---

## 🚀 Quick Start

### 1. Deploy Smart Contracts

```bash
cd move

# Initialize Aptos profile
aptos init --profile sentience-admin

# Compile contracts
aptos move compile --named-addresses sentience=sentience-admin

# Deploy to testnet
aptos move publish --named-addresses sentience=sentience-admin --profile sentience-admin
```

### 2. Start Backend Server

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your wallet address and module address

# Start development server
npm run dev
```

### 3. Start Frontend

```bash
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev
```

---

## 🔮 Easter Egg Hunt

Collect 5 shards to assemble the **Genesis Prime NFT**:

| Level | Shard | Challenge |
|-------|-------|-----------|
| 1 | The Observer | Basic x402 payment |
| 2 | The Sybil | Trust score > 10 |
| 3 | The Ghost | Soulbound identity |
| 4 | The Mirror | Find the hidden spell in `reputation.move` |
| 5 | The Void | High-value transaction |

---

## 🔑 Key Contracts

### Identity Module
```move
public entry fun register_agent(
    creator: &signer,
    name: String,
    description: String,
    endpoint_url: String,
    soulbound: bool
);
```

### Reputation Module  
```move
public entry fun submit_review(
    reviewer: &signer,
    target: address,
    tx_hash: vector<u8>,
    rating: u8  // 1-5
);
```

---

## 📡 API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | None | Health check |
| `GET /meta` | None | Node metadata |
| `GET /service/data` | x402 | Paid service |
| `GET /shard/level/:id` | x402 + varies | Easter egg levels |

---

## 🧪 Testing

```bash
# Move unit tests
cd move && aptos move test --named-addresses sentience=0xCAFE

# Backend tests
cd backend && npm test
```

---

## 📜 License

MIT License - Built for the Aptos x402 Hackathon

---

**Build the Agent. Trust the Code. Pay the Price.** 🚀
