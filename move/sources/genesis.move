/// Simplified Genesis Module for Easter Egg Hunt
module sentience::genesis {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    /// Shard fragment
    struct Shard has key, store, drop, copy {
        id: u8,
        collected_at: u64,
    }

    /// Shard collection
    struct ShardCollection has key {
        shards: vector<Shard>,
    }

    /// Genesis Prime NFT
    struct GenesisPrime has key {
        assembled_at: u64,
        holder: address,
    }

    #[event]
    struct ShardCollectedEvent has drop, store {
        collector: address,
        shard_id: u8,
    }

    #[event]
    struct GenesisAssembledEvent has drop, store {
        holder: address,
    }

    /// Initialize shard collection
    public entry fun init_collection(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<ShardCollection>(addr)) {
            move_to(account, ShardCollection {
                shards: vector::empty(),
            });
        };
    }

    /// Collect a shard
    public entry fun collect_shard(
        collector: &signer,
        shard_id: u8
    ) acquires ShardCollection {
        let addr = signer::address_of(collector);
        let collection = borrow_global_mut<ShardCollection>(addr);
        
        let shard = Shard {
            id: shard_id,
            collected_at: timestamp::now_seconds(),
        };
        vector::push_back(&mut collection.shards, shard);
        
        event::emit(ShardCollectedEvent {
            collector: addr,
            shard_id,
        });
    }

    /// Assemble Genesis Prime from 5 shards
    public entry fun assemble(collector: &signer) acquires ShardCollection {
        let addr = signer::address_of(collector);
        let collection = borrow_global<ShardCollection>(addr);
        
        // Require 5 shards
        assert!(vector::length(&collection.shards) >= 5, 1);
        
        move_to(collector, GenesisPrime {
            assembled_at: timestamp::now_seconds(),
            holder: addr,
        });
        
        event::emit(GenesisAssembledEvent {
            holder: addr,
        });
    }

    #[view]
    public fun get_shard_count(collector: address): u64 acquires ShardCollection {
        if (!exists<ShardCollection>(collector)) {
            return 0
        };
        let collection = borrow_global<ShardCollection>(collector);
        vector::length(&collection.shards)
    }

    #[view]
    public fun has_genesis(addr: address): bool {
        exists<GenesisPrime>(addr)
    }
}
