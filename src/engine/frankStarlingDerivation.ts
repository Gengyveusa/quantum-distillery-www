// =================================================================
// src/engine/frankStarlingDerivation.ts
// Pure function: cardiovascular state -> Frank-Starling curve data
// Generates the preload-vs-stroke-volume relationship and operating point
// Called once per tick inside simulationTick.ts
// =================================================================

import type { CardiovascularState, FrankStarlingData } from '../types/SimulationState';

// --- Generate a Frank-Starling curve given contractility ---
function generateCurve(
  contractility: number,
  numPoints: number = 20
): Array<{ preload: number; sv: number }> {
  const points: Array<{ preload: number; sv: number }> = [];
  for (let i = 0; i <= numPoints; i++) {
    const preload = i / numPoints; // 0 to 1 normalized
    // Classic Frank-Starling: SV = SVmax * (1 - e^(-k*preload))
    // Contractility shifts the curve up/down
    const svMax = 120 * contractility;
    const k = 4.0; // steepness
    const sv = svMax * (1 - Math.exp(-k * preload));
    points.push({ preload, sv: Math.max(0, sv) });
  }
  return points;
}

// --- Determine curve shift label from contractility ---
function getCurveShift(contractility: number): 'normal' | 'upward' | 'downward' {
  if (contractility > 1.05) return 'upward';
  if (contractility < 0.85) return 'downward';
  return 'normal';
}

function getCurveLabel(contractility: number, rhythmIsLethal: boolean): string {
  if (rhythmIsLethal) return 'Cardiac Arrest';
  if (contractility >= 1.15) return 'Enhanced (Inotrope/Sympathomimetic)';
  if (contractility >= 1.05) return 'Mildly Enhanced';
  if (contractility >= 0.85) return 'Normal';
  if (contractility >= 0.65) return 'Mildly Depressed';
  if (contractility >= 0.45) return 'Moderately Depressed';
  return 'Severely Depressed (Shock)';
}

export function deriveFrankStarling(
  cv: CardiovascularState
): FrankStarlingData {
  const { contractility, preload, sv, rhythmIsLethal } = cv;

  // If lethal rhythm, flat curve at zero
  if (rhythmIsLethal) {
    return {
      curvePoints: generateCurve(0.01),
      operatingPoint: { preload, sv: 0 },
      curveShift: 'downward',
      curveLabel: 'Cardiac Arrest',
    };
  }

  const curvePoints = generateCurve(contractility);
  const curveShift = getCurveShift(contractility);
  const curveLabel = getCurveLabel(contractility, rhythmIsLethal);

  // Operating point: where the patient currently sits on the curve
  const operatingPoint = {
    preload: Math.max(0, Math.min(1, preload)),
    sv: Math.max(0, sv),
  };

  return {
    curvePoints,
    operatingPoint,
    curveShift,
    curveLabel,
  };
}
