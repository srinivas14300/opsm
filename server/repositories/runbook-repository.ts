import { Runbook } from '../../src/types/incident';
import { SEED_RUNBOOKS } from '../../src/data/seedData';

let runbooks: Runbook[] = [];
let isInitialized = false;

export const RunbookRepository = {
  initialize() {
    if (isInitialized) return;
    
    runbooks = [...SEED_RUNBOOKS];
    isInitialized = true;
    console.log(`[RunbookRepository] Seeded ${runbooks.length} runbooks.`);
  },

  getAll(): Runbook[] {
    this.ensureInitialized();
    return runbooks;
  },

  getById(id: string): Runbook | null {
    this.ensureInitialized();
    return runbooks.find(rb => rb.id === id) || null;
  },

  create(runbook: Runbook): Runbook {
    this.ensureInitialized();
    runbooks.unshift(runbook);
    return runbook;
  },

  update(runbook: Runbook): Runbook {
    this.ensureInitialized();
    const index = runbooks.findIndex(rb => rb.id === runbook.id);
    if (index !== -1) {
      runbooks[index] = { ...runbook };
      return runbooks[index];
    }
    throw new Error(`Runbook with ID ${runbook.id} not found.`);
  },

  ensureInitialized() {
    if (!isInitialized) {
      this.initialize();
    }
  }
};
