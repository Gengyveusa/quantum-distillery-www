/**
 * src/engine/questionBank.ts
 * Validated MCQ question bank for the A/B study pre/post tests.
 * 15+ questions across 3 difficulty tiers, 5 per arm rotation.
 */

export interface MCQuestion {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Rotation 1 — Basic / Airway & Oxygenation
// ---------------------------------------------------------------------------

const rotation1: MCQuestion[] = [
  {
    id: 'R1Q1',
    stem: 'Which Mallampati class is associated with the HIGHEST likelihood of difficult intubation?',
    options: ['Class I', 'Class II', 'Class III', 'Class IV'],
    correctIndex: 3,
    difficulty: 'basic',
    topic: 'Airway Anatomy',
    explanation:
      'Mallampati Class IV (only hard palate visible) predicts difficult airway management. Higher classes indicate less visible oropharyngeal structures.',
  },
  {
    id: 'R1Q2',
    stem: 'A healthy patient on room air has a PaO2 of 100 mmHg. According to the oxygen-hemoglobin dissociation curve, what is the approximate SpO2?',
    options: ['85%', '90%', '95%', '98%'],
    correctIndex: 3,
    difficulty: 'basic',
    topic: 'Oxygen-Hemoglobin Dissociation',
    explanation:
      'At PaO2 of 100 mmHg, hemoglobin is nearly fully saturated (~98%). The sigmoidal O2-Hb curve plateaus above PaO2 of ~80 mmHg.',
  },
  {
    id: 'R1Q3',
    stem: 'Which ASA Physical Status classification describes a patient with severe systemic disease that is a constant threat to life?',
    options: ['ASA II', 'ASA III', 'ASA IV', 'ASA V'],
    correctIndex: 2,
    difficulty: 'basic',
    topic: 'ASA Classification',
    explanation:
      'ASA IV = severe systemic disease that is a constant threat to life. ASA III is severe but not an immediate threat.',
  },
  {
    id: 'R1Q4',
    stem: "During procedural sedation, a patient's SpO2 drops to 88%. Which intervention should be performed FIRST?",
    options: [
      'Administer flumazenil',
      'Open airway with jaw thrust and increase FiO2',
      'Intubate the patient',
      'Administer naloxone',
    ],
    correctIndex: 1,
    difficulty: 'intermediate',
    topic: 'Airway Management',
    explanation:
      'The initial response to desaturation is basic airway management: jaw thrust/chin lift to open the airway and supplemental oxygen.',
  },
  {
    id: 'R1Q5',
    stem: 'A right shift of the oxygen-hemoglobin dissociation curve is caused by which of the following?',
    options: [
      'Decreased temperature',
      'Alkalosis',
      'Increased 2,3-DPG',
      'Carbon monoxide poisoning',
    ],
    correctIndex: 2,
    difficulty: 'intermediate',
    topic: 'Oxygen-Hemoglobin Dissociation',
    explanation:
      'Increased 2,3-DPG, acidosis, increased temperature, and increased PaCO2 shift the curve right (decreased O2 affinity, easier O2 unloading). This is the Bohr effect.',
  },
];

// ---------------------------------------------------------------------------
// Rotation 2 — Intermediate / PK-PD & Drug Interactions
// ---------------------------------------------------------------------------

const rotation2: MCQuestion[] = [
  {
    id: 'R2Q1',
    stem: 'In a 3-compartment PK model for propofol, the effect-site equilibration rate constant (ke0) determines:',
    options: [
      'The volume of the central compartment',
      'The speed at which drug reaches peak brain effect',
      'The hepatic clearance rate',
      'The total duration of drug action',
    ],
    correctIndex: 1,
    difficulty: 'intermediate',
    topic: 'PK/PD Principles',
    explanation:
      'ke0 governs the rate of drug transfer from plasma to the effect site (brain). A higher ke0 means faster equilibration and quicker onset of clinical effect.',
  },
  {
    id: 'R2Q2',
    stem: 'When midazolam and fentanyl are administered together for procedural sedation, their combined effect on respiratory depression is best described as:',
    options: [
      'Additive',
      'Antagonistic',
      'Synergistic (supra-additive)',
      'Independent',
    ],
    correctIndex: 2,
    difficulty: 'intermediate',
    topic: 'Drug Interactions',
    explanation:
      'Benzodiazepines and opioids have a well-documented synergistic interaction for respiratory depression. The combined effect is greater than the sum of individual effects.',
  },
  {
    id: 'R2Q3',
    stem: "The EC50 of propofol for loss of consciousness is approximately 3.4 mcg/mL. If the current Ce is 1.7 mcg/mL, what fractional effect does the Hill equation predict (gamma = 2)?",
    options: ['25%', '20%', '33%', '50%'],
    correctIndex: 1,
    difficulty: 'advanced',
    topic: 'PK/PD Principles',
    explanation:
      'E = Ce^g / (EC50^g + Ce^g) = 1.7^2 / (3.4^2 + 1.7^2) = 2.89 / 14.45 = 0.20 (20%). At half EC50 with Hill coefficient 2, effect is 20%.',
  },
  {
    id: 'R2Q4',
    stem: 'Which reversal agent is specific for benzodiazepine-induced sedation?',
    options: ['Naloxone', 'Flumazenil', 'Sugammadex', 'Neostigmine'],
    correctIndex: 1,
    difficulty: 'basic',
    topic: 'Reversal Agents',
    explanation:
      'Flumazenil is a competitive GABA-A antagonist that specifically reverses benzodiazepine effects. Naloxone reverses opioids.',
  },
  {
    id: 'R2Q5',
    stem: 'An elderly patient (80 years, 60 kg) requires propofol for sedation. Compared to a young adult, the induction dose should be:',
    options: [
      'Increased by 50% due to larger volume of distribution',
      'Reduced by 30-50% due to decreased clearance and increased sensitivity',
      'Unchanged — age does not affect propofol pharmacokinetics',
      'Increased due to higher fat:lean body mass ratio',
    ],
    correctIndex: 1,
    difficulty: 'intermediate',
    topic: 'PK/PD Principles',
    explanation:
      'Elderly patients have decreased cardiac output, decreased hepatic clearance, and increased brain sensitivity to propofol. Doses should be reduced by 30-50%.',
  },
];

// ---------------------------------------------------------------------------
// Rotation 3 — Advanced / Crisis Management & BIS
// ---------------------------------------------------------------------------

const rotation3: MCQuestion[] = [
  {
    id: 'R3Q1',
    stem: 'During procedural sedation, a patient develops a BIS of 35 with hemodynamic instability (BP 70/40). The MOST appropriate immediate action is:',
    options: [
      'Increase propofol infusion to deepen anesthesia',
      'Stop sedative infusion, support airway and hemodynamics',
      'Administer a bolus of midazolam',
      'Wait 5 minutes and re-assess',
    ],
    correctIndex: 1,
    difficulty: 'advanced',
    topic: 'Crisis Management',
    explanation:
      'BIS 35 with hypotension indicates over-sedation with cardiovascular compromise. Immediate: stop sedatives, airway support, IV fluids, vasopressors if needed.',
  },
  {
    id: 'R3Q2',
    stem: 'A BIS value of 60-70 during procedural sedation typically corresponds to:',
    options: [
      'Deep general anesthesia',
      'Moderate sedation with amnesia likely',
      'Fully awake patient',
      'Burst suppression pattern',
    ],
    correctIndex: 1,
    difficulty: 'intermediate',
    topic: 'BIS Interpretation',
    explanation:
      'BIS 60-70 correlates with moderate sedation/light anesthesia where amnesia is likely. BIS 40-60 = general anesthesia, BIS <20 = burst suppression, BIS 80-100 = awake.',
  },
  {
    id: 'R3Q3',
    stem: 'A patient receiving propofol sedation develops wide-complex tachycardia at 180 bpm with a pulse. After stopping the infusion, the NEXT step per ACLS is:',
    options: [
      'Defibrillation at 200J',
      'Synchronized cardioversion',
      'Amiodarone 150 mg IV',
      'Adenosine 6 mg rapid IV push',
    ],
    correctIndex: 2,
    difficulty: 'advanced',
    topic: 'Crisis Management',
    explanation:
      'Stable wide-complex tachycardia with a pulse: amiodarone 150 mg IV over 10 min is first-line per ACLS. Cardioversion is for unstable patients.',
  },
  {
    id: 'R3Q4',
    stem: 'Which patient factor MOST increases the risk of adverse events during procedural sedation?',
    options: [
      'Male sex',
      'BMI of 22',
      'Obstructive sleep apnea with Mallampati IV',
      'Age 30 years',
    ],
    correctIndex: 2,
    difficulty: 'intermediate',
    topic: 'Patient Sensitivity',
    explanation:
      'OSA + high Mallampati score is the highest-risk combination: predisposition to airway obstruction, increased sensitivity to sedatives, and difficult rescue airway.',
  },
  {
    id: 'R3Q5',
    stem: 'During ketamine sedation, a patient develops laryngospasm. The recommended treatment includes:',
    options: [
      'Increase ketamine dose to deepen sedation',
      'Positive pressure ventilation; if persistent, succinylcholine 0.5-1 mg/kg IV',
      'Immediate surgical cricothyroidotomy',
      'Administer flumazenil',
    ],
    correctIndex: 1,
    difficulty: 'advanced',
    topic: 'Crisis Management',
    explanation:
      'Laryngospasm: jaw thrust + continuous positive pressure ventilation. If not breaking, succinylcholine 0.5-1 mg/kg IV to relax vocal cords.',
  },
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** All questions organized by rotation (1, 2, 3). */
export const QUESTION_BANK: Record<number, MCQuestion[]> = {
  1: rotation1,
  2: rotation2,
  3: rotation3,
};

/** Flat array of all questions. */
export const ALL_QUESTIONS: MCQuestion[] = [
  ...rotation1,
  ...rotation2,
  ...rotation3,
];

/** Get questions for a specific rotation (1-indexed). */
export function getQuestionsForRotation(rotation: number): MCQuestion[] {
  return QUESTION_BANK[rotation] ?? [];
}
