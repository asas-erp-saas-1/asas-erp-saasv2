export interface VectorClock {
  [regionId: string]: number;
}

export class VectorClockCoordinator {
  /**
   * Merges two vector clocks, strictly taking the maximum sequence per region.
   * Critical for Multi-Region Active/Active eventual consistency.
   */
  static merge(clockA: VectorClock, clockB: VectorClock): VectorClock {
    const merged: VectorClock = { ...clockA };
    for (const [region, version] of Object.entries(clockB)) {
      if (!merged[region] || version > merged[region]) {
        merged[region] = version;
      }
    }
    return merged;
  }

  /**
   * Identifies if clockA casually dominates clockB.
   */
  static dominates(clockA: VectorClock, clockB: VectorClock): boolean {
    let hasStrictlyGreater = false;
    for (const region of new Set([...Object.keys(clockA), ...Object.keys(clockB)])) {
      const vA = clockA[region] || 0;
      const vB = clockB[region] || 0;
      
      if (vA < vB) return false; // Contains an older part, cannot strictly dominate
      if (vA > vB) hasStrictlyGreater = true;
    }
    return hasStrictlyGreater;
  }
}
