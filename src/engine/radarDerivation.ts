// src/engine/radarDerivation.ts
// Pure function: PD state -> 6-axis radar chart values (0-1 normalized)

import type { RadarAxes, PharmacodynamicState } from '../types/SimulationState';

export function deriveRadarAxes(pd: PharmacodynamicState): RadarAxes {
  return {
    sedation: pd.sedationDepth,
    analgesia: pd.analgesiaLevel,
    anxiolysis: pd.anxiolysisLevel,
    amnesia: pd.amnesiaLevel,
    respiratoryDepression: Math.min(1,
      Object.values(pd.drugContributions)
        .reduce((sum, d) => sum + d.respiratoryDepression, 0)),
    cardiovascularDepression: Math.min(1,
      Object.values(pd.drugContributions)
        .reduce((sum, d) => sum + Math.abs(d.cardiovascularDepression), 0)),
  };
}
