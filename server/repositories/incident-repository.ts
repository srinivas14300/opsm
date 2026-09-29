import { Incident } from '../../src/types/incident';
import { INITIAL_ACTIVE_INCIDENTS, SEED_HISTORICAL_INCIDENTS } from '../../src/data/seedData';

let incidents: Incident[] = [];
let isInitialized = false;

export const IncidentRepository = {
  initialize() {
    if (isInitialized) return;
    
    // Seed initial incidents
    const seeded = [...INITIAL_ACTIVE_INCIDENTS, ...SEED_HISTORICAL_INCIDENTS];
    incidents = seeded.map(inc => {
      // Clean up or add required structures (evidence, hypotheses)
      return {
        ...inc,
        evidence: inc.evidence || [],
        hypotheses: inc.hypotheses || []
      };
    });
    
    isInitialized = true;
    console.log(`[IncidentRepository] Seeded ${incidents.length} incidents.`);
  },

  getAll(): Incident[] {
    this.ensureInitialized();
    return incidents;
  },

  getById(id: string): Incident | null {
    this.ensureInitialized();
    return incidents.find(inc => inc.id === id) || null;
  },

  create(incident: Incident): Incident {
    this.ensureInitialized();
    incidents.unshift(incident);
    return incident;
  },

  update(incident: Incident): Incident {
    this.ensureInitialized();
    const index = incidents.findIndex(inc => inc.id === incident.id);
    if (index !== -1) {
      incidents[index] = {
        ...incident,
        updatedAt: new Date().toISOString()
      };
      return incidents[index];
    }
    throw new Error(`Incident with ID ${incident.id} not found.`);
  },

  ensureInitialized() {
    if (!isInitialized) {
      this.initialize();
    }
  }
};
