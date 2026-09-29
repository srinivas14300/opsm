import { AgentMemoryEntry, Incident, PostMortem, MemoryStatus } from '../../src/types/incident';
import { MemoryRepository } from '../repositories/memory-repository';

export const MemoryService = {
  createMemoryDraft(incident: Incident, postMortem: PostMortem): AgentMemoryEntry {
    const draft: AgentMemoryEntry = {
      id: `mem-${Date.now()}`,
      incidentId: incident.id,
      incidentTitle: incident.title,
      service: incident.affectedService,
      symptoms: (incident.evidence || []).map(e => e.title),
      rootCause: postMortem.rootCause,
      successfulFix: postMortem.resolution,
      successfulRunbookTitle: incident.runbookUsedTitle || undefined,
      failedApproaches: incident.failedApproaches || [],
      resolutionTimeMinutes: incident.durationMinutes || 15,
      date: new Date().toISOString().split('T')[0],
      timesReferenced: 0,
      lessonsLearned: postMortem.lessonsLearned[0] || 'Draft lessons learned.',
      status: 'DRAFT',
      sourceIncidentId: incident.id,
      sourcePostMortemId: postMortem.id
    };
    
    return MemoryRepository.create(draft);
  },

  verifyMemory(
    id: string,
    verifiedBy: string,
    verificationNote: string
  ): AgentMemoryEntry {
    const mem = MemoryRepository.getById(id);
    if (!mem) {
      throw new Error(`Memory entry with ID ${id} not found.`);
    }
    
    mem.status = 'VERIFIED';
    mem.verifiedBy = verifiedBy;
    mem.verifiedAt = new Date().toISOString();
    mem.verificationNote = verificationNote;
    
    return MemoryRepository.update(mem);
  },

  archiveMemory(id: string): AgentMemoryEntry {
    const mem = MemoryRepository.getById(id);
    if (!mem) {
      throw new Error(`Memory entry with ID ${id} not found.`);
    }
    mem.status = 'ARCHIVED';
    return MemoryRepository.update(mem);
  },

  retrieveVerifiedMemories(): AgentMemoryEntry[] {
    return MemoryRepository.getVerified();
  }
};
