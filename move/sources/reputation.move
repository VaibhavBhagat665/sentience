/// Simplified Sentience Reputation Module
module sentience::reputation {
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    /// Trust score
    struct TrustScore has key {
        value: u64,
        rank: u64,
        last_update: u64,
    }

    #[event]
    struct TrustUpdatedEvent has drop, store {
        agent: address,
        new_score: u64,
    }

    /// Initialize trust for an account
    public entry fun initialize_trust(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<TrustScore>(addr)) {
            move_to(account, TrustScore {
                value: 0,
                rank: 0,
                last_update: timestamp::now_seconds(),
            });
        };
    }

    /// Update trust score (oracle function)
    public entry fun update_score(
        oracle: &signer,
        agent: address,
        new_score: u64,
        new_rank: u64
    ) acquires TrustScore {
        let _oracle_addr = signer::address_of(oracle);
        let score = borrow_global_mut<TrustScore>(agent);
        score.value = new_score;
        score.rank = new_rank;
        score.last_update = timestamp::now_seconds();
        
        event::emit(TrustUpdatedEvent {
            agent,
            new_score,
        });
    }

    #[view]
    public fun get_trust_score(agent: address): (u64, u64) acquires TrustScore {
        if (!exists<TrustScore>(agent)) {
            return (0, 0)
        };
        let score = borrow_global<TrustScore>(agent);
        (score.value, score.rank)
    }

    #[view]
    public fun meets_threshold(agent: address, threshold: u64): bool acquires TrustScore {
        if (!exists<TrustScore>(agent)) {
            return false
        };
        let score = borrow_global<TrustScore>(agent);
        score.value >= threshold
    }

    /// Magic spell for Easter Egg (Level 4)
    #[view]
    public fun get_magic_spell(): vector<u8> {
        x"a1b2c3d4e5f6789012345678abcd"
    }
}
