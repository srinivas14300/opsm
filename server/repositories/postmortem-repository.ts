import { PostMortem } from '../../src/types/incident';

let postMortems: PostMortem[] = [];

export const PostMortemRepository = {
  getAll(): PostMortem[] {
    return postMortems;
  },

  getById(id: string): PostMortem | null {
    return postMortems.find(pm => pm.id === id) || null;
  },

  getByIncidentId(incidentId: string): PostMortem | null {
    return postMortems.find(pm => pm.incidentId === incidentId) || null;
  },

  create(pm: PostMortem): PostMortem {
    postMortems.unshift(pm);
    return pm;
  },

  update(pm: PostMortem): PostMortem {
    const index = postMortems.findIndex(p => p.id === pm.id);
    if (index !== -1) {
      postMortems[index] = { ...pm };
      return postMortems[index];
    }
    // If not found, let's create it
    return this.create(pm);
  },
};
