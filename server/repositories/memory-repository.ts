import { AgentMemoryEntry } from '../../src/types/incident';
import { SEED_AGENT_MEMORY } from '../../src/data/seedData';

let memories: AgentMemoryEntry[] = [];
let isInitialized = false;

export const MemoryRepository = {
  initialize() {
    if (isInitialized) return;
    
    // Seed initial memories as VERIFIED
    memories = SEED_AGENT_MEMORY.map(mem => ({
      ...mem,
      status: 'VERIFIED',
      verifiedBy: 'System Migrator',
      verifiedAt: new Date(mem.date).toISOString(),
      verificationNote: 'Imported from verified historical data corpus.'
    }));
    
    isInitialized = true;
    console.log(`[MemoryRepository] Seeded ${memories.length} memories.`);
  },

  getAll(): AgentMemoryEntry[] {
    this.ensureInitialized();
    return memories;
  },

  getVerified(): AgentMemoryEntry[] {
    this.ensureInitialized();
    return memories.filter(mem => mem.status === 'VERIFIED');
  },

  getById(id: string): AgentMemoryEntry | null {
    this.ensureInitialized();
    return memories.find(mem => mem.id === id) || null;
  },

  create(entry: AgentMemoryEntry): AgentMemoryEntry {
    this.ensureInitialized();
    memories.unshift(entry);
    return entry;
  },

  update(entry: AgentMemoryEntry): AgentMemoryEntry {
    this.ensureInitialized();
    const index = memories.findIndex(mem => mem.id === entry.id);
    if (index !== -1) {
      memories[index] = { ...entry };
      return memories[index];
    }
    throw new Error(`Memory entry with ID ${entry.id} not found.`);
  },

  ensureInitialized() {
    if (!isInitialized) {
      this.initialize();
    }
  }
};
