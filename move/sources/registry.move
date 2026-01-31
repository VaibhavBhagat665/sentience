/// Simplified Sentience Registry Module
module sentience::registry {
    use std::signer;
    use std::string::String;
    use std::vector;

    /// Registry for agent discovery
    struct AgentRegistry has key {
        agents: vector<address>,
    }

    /// Initialize registry
    public entry fun init_registry(admin: &signer) {
        move_to(admin, AgentRegistry {
            agents: vector::empty(),
        });
    }

    /// Register agent in global registry
    public entry fun register_in_registry(
        agent: &signer,
        _tag: String
    ) acquires AgentRegistry {
        let agent_addr = signer::address_of(agent);
        let registry = borrow_global_mut<AgentRegistry>(@sentience);
        vector::push_back(&mut registry.agents, agent_addr);
    }

    #[view]
    public fun get_agent_count(): u64 acquires AgentRegistry {
        let registry = borrow_global<AgentRegistry>(@sentience);
        vector::length(&registry.agents)
    }
}
