// =================================================================
// src/engine/avatarDerivation.ts
// Pure function: PD + physiology + vitals -> avatar visual params
// Called once per tick inside simulationTick.ts
// =================================================================

import type { AirwayDevice } from '../types';
import type {
  AvatarParams, PharmacodynamicState, PhysiologyState, VitalsDisplay
} from '../types/SimulationState';

export function deriveAvatarParams(
  pd: PharmacodynamicState,
  physiology: PhysiologyState,
  vitals: VitalsDisplay,
  airwayDevice: AirwayDevice
): AvatarParams {
  const { spo2, rr, hr } = vitals;
  const { sedationDepth, moass } = pd;
  const resp = physiology.respiratory;
  const cv = physiology.cardiovascular;

  // Cyanosis: SpO2 < 90% -> visible central cyanosis
  const cyanosis = spo2 < 90 ? Math.min(1, (90 - spo2) / 20) : 0;

  // Skin color: HSL model - hue shifts blue with desaturation
  const baseHue = 20; // warm skin tone
  const skinHue = Math.max(0, Math.min(360, baseHue - cyanosis * 200));
  const skinSaturation = Math.max(0, Math.min(1, 0.6 - cyanosis * 0.3));
  const skinLightness = Math.max(0, Math.min(1, 0.7 - (cv.map < 60 ? 0.15 : 0)));

  // Eyes: tracks MOASS
  const eyeOpenness = moass >= 5 ? 1.0 :
    moass === 4 ? 0.7 :
    moass === 3 ? 0.3 :
    moass === 2 ? 0.1 : 0.0;

  // Pupils: opioids -> miosis, ketamine -> mydriasis
  const opioidEffect = pd.drugContributions['fentanyl']?.sedation || 0;
  const ketamineEffect = pd.drugContributions['ketamine']?.sedation || 0;
  const pupilSize = Math.max(1, Math.min(8, 4 - opioidEffect * 2 + ketamineEffect * 2));

  // Consciousness mapping from MOASS
  const consciousness: AvatarParams['consciousness'] =
    moass >= 5 ? 'alert' :
    moass === 4 ? 'drowsy' :
    moass === 3 ? 'responding_to_voice' :
    moass === 2 ? 'responding_to_pain' :
    'unresponsive';

  // Respiratory effort from RR
  const respiratoryEffort: AvatarParams['respiratoryEffort'] =
    rr === 0 ? 'none' :
    rr < 8 ? 'shallow' :
    rr > 24 ? 'labored' :
    'normal';

  return {
    skinHue,
    skinSaturation,
    skinLightness,
    cyanosis,
    diaphoresis: cv.map < 60 ? 0.5 : 0,
    eyeOpenness,
    pupilSize,
    pupilReactivity: moass >= 3,
    nystagmus: ketamineEffect > 0.3,
    chestRiseAmplitude: Math.min(1, resp.tidalVolume / 500),
    chestRiseRate: rr,
    respiratoryEffort,
    accessoryMuscleUse: resp.airwayPatency < 0.5 && rr > 0,
    jawPosition: sedationDepth > 0.7 ? 'slack' : 'normal',
    consciousness,
    isAgitated: false,
    emesisRisk: Math.min(1, opioidEffect * 0.3 + ketamineEffect * 0.1),
    purposefulMovement: moass >= 4,
    tremor: false,
    muscleRigidity: (pd.drugContributions['fentanyl']?.sedation || 0) > 0.8 ? 0.5 : 0,
    visibleAirwayDevice: airwayDevice,
    ivSiteVisible: true,
  };
}
