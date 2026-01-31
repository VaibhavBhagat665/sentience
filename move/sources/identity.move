/// Simplified Sentience Identity Module for Hackathon Demo
module sentience::identity {
    use std::string::String;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    /// Agent Profile
    struct AgentProfile has key {
        name: String,
        description: String,
        endpoint_url: String,
        creation_time: u64,
        soulbound: bool,
    }

    #[event]
    struct AgentRegisteredEvent has drop, store {
        agent_address: address,
        name: String,
        soulbound: bool,
    }

    /// Register a new agent
    public entry fun register_agent(
        creator: &signer,
        name: String,
        description: String,
        endpoint_url: String,
        soulbound: bool
    ) {
        let addr = signer::address_of(creator);
        
        move_to(creator, AgentProfile {
            name,
            description,
            endpoint_url,
            creation_time: timestamp::now_seconds(),
            soulbound,
        });
        
        event::emit(AgentRegisteredEvent {
            agent_address: addr,
            name,
            soulbound,
        });
    }

    #[view]
    public fun get_agent_info(agent: address): (String, String, String, bool) acquires AgentProfile {
        let profile = borrow_global<AgentProfile>(agent);
        (profile.name, profile.description, profile.endpoint_url, profile.soulbound)
    }

    #[view]
    public fun is_soulbound(agent: address): bool acquires AgentProfile {
        let profile = borrow_global<AgentProfile>(agent);
        profile.soulbound
    }
}
