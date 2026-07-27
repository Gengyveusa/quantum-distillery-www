/**
 * The twelve concepts of the Quantum Distillery.
 *
 * These were previously inlined in LandingPage.tsx as click-to-expand tabs,
 * which meant twelve distinct ideas competed for ranking on a single URL and
 * none could be cited independently. They now live here so both the landing
 * page and the per-concept routes render from one source.
 *
 * Slugs are permanent URLs — changing one breaks inbound links and resets any
 * authority the page has accumulated. Add concepts freely; do not rename slugs.
 */

export type Discipline = 'Mathematics' | 'Physics' | 'Biology';

export type Concept = {
  /** Permanent URL segment. Never change once shipped. */
  slug: string;
  /** Short label, used as the tag chip on the landing page. */
  name: string;
  /** Full heading. */
  title: string;
  body: string;
  insight: string;
  discipline: Discipline;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "information-theory",
    name: "Information Theory",
    title: "Information Theory",
    discipline: "Mathematics",
    body: "Claude Shannon's information theory provides the mathematical backbone for understanding how biological systems encode, transmit, and decode signals. Every heartbeat is a message. Every action potential is a bit. The entropy of a cardiac rhythm tells us whether the heart is healthy or failing — high entropy signals adaptability, while pathological regularity precedes arrest. In DNA, four nucleotides encode the entire operating system of life using a quaternary code that rivals any engineered compression algorithm. Shannon entropy quantifies the information content of genetic sequences and reveals the redundancy evolution has built in for error correction.",
    insight: "The deepest insight: consciousness itself may be an information-processing phenomenon — integrated information theory (IIT) proposes that the degree to which a system integrates information determines its level of awareness.",
  },
  {
    slug: "topology",
    name: "Topology",
    title: "Topology",
    discipline: "Mathematics",
    body: "Topology studies the properties of spaces that remain invariant under continuous deformation — stretching, bending, but never tearing. In biology, protein folding is fundamentally a topological problem: a linear chain of amino acids must navigate an astronomically large conformational space to find its functional three-dimensional shape. Topological data analysis (TDA) now reveals hidden structures in high-dimensional clinical datasets that traditional statistics cannot detect. The persistent homology of neural connectivity maps shows how the brain organizes information across scales.",
    insight: "Knot theory, a branch of topology, explains how DNA supercoiling regulates gene expression — topoisomerase enzymes literally change the topology of DNA to allow replication and transcription.",
  },
  {
    slug: "stochastic-modeling",
    name: "Stochastic Modeling",
    title: "Stochastic Modeling",
    discipline: "Mathematics",
    body: "Biological systems are inherently noisy. Stochastic models capture this randomness mathematically, describing everything from ion channel flickering to pharmacokinetic drug distribution. Markov chains model the probabilistic transitions between cardiac rhythm states — from normal sinus rhythm to atrial fibrillation to ventricular tachycardia. The Gillespie algorithm simulates the stochastic biochemistry inside individual cells, revealing that gene expression is not deterministic but fundamentally random, with consequences that ripple up to organism-level phenotypes.",
    insight: "In anesthesia, stochastic models of drug effect-site concentrations are what make target-controlled infusion possible — predicting the probability of consciousness loss rather than guaranteeing it.",
  },
  {
    slug: "bayesian-inference",
    name: "Bayesian Inference",
    title: "Bayesian Inference",
    discipline: "Mathematics",
    body: "Bayesian inference is how rational agents update beliefs in light of new evidence. It is arguably the mathematics of learning itself. In clinical medicine, every diagnostic test result shifts our prior probability of disease toward a posterior probability via likelihood ratios. The brain itself appears to be a Bayesian inference engine — the predictive processing framework proposes that perception is not passive reception but active prediction, with sensory data serving as evidence that updates an internal generative model of the world.",
    insight: "Bayesian methods underpin modern AI clinical decision support — and may explain why experienced clinicians develop superior intuition: they have accumulated better priors through thousands of patient encounters.",
  },
  {
    slug: "quantum-tunneling",
    name: "Quantum Tunneling",
    title: "Quantum Tunneling",
    discipline: "Physics",
    body: "Quantum tunneling occurs when a particle traverses an energy barrier that classical physics says it cannot cross. This is not a theoretical curiosity — it is essential to life. Enzyme catalysis, the engine of all metabolism, depends on hydrogen atoms tunneling through energy barriers to accelerate reaction rates by factors of thousands. Without tunneling, the biochemistry of life would be too slow to sustain it. In mitochondrial Complex I, electron tunneling across chains of iron-sulfur clusters drives the proton pumping that generates ATP.",
    insight: "Tunneling may also play a role in olfaction (the vibrational theory of smell), in photosynthesis (exciton transport), and potentially in the mechanism of general anesthesia itself — a quantum distillery problem if ever there was one.",
  },
  {
    slug: "thermodynamics",
    name: "Thermodynamics",
    title: "Thermodynamics",
    discipline: "Physics",
    body: "The second law of thermodynamics states that the entropy of an isolated system tends to increase. Living organisms appear to defy this law, maintaining exquisite internal order — but they do so by exporting entropy to their surroundings. Erwin Schrödinger recognized this in 1944: life feeds on negative entropy. Every metabolic pathway, every ion pump, every muscle contraction is a thermodynamic transaction — free energy is consumed to maintain the far-from-equilibrium state that defines being alive.",
    insight: "Death is not a biological event. It is a thermodynamic one — the point at which a system can no longer maintain its entropy gradient against the environment. This is the deepest definition of what it means to be alive.",
  },
  {
    slug: "electrodynamics",
    name: "Electrodynamics",
    title: "Electrodynamics",
    discipline: "Physics",
    body: "Maxwell's equations govern every electrical signal in the body. The electrochemical gradients across cell membranes are electromagnetic phenomena. The cardiac conduction system generates electric fields detectable on the body surface as the ECG — a direct readout of Maxwell's equations applied to living tissue. Neural signaling, from the cortex to the peripheral nerves, is fundamentally an electromagnetic phenomenon governed by the cable equation, a simplification of Maxwell's framework for cylindrical conductors.",
    insight: "The electromagnetic field generated by the heart is the strongest in the body — detectable several feet away. Some researchers propose that endogenous bioelectric fields play instructive roles in development, wound healing, and even cancer suppression.",
  },
  {
    slug: "negative-entropy",
    name: "Negative Entropy",
    title: "Negative Entropy",
    discipline: "Physics",
    body: "Schrödinger's concept of negative entropy (negentropy) describes how living systems import order from their environment to maintain and increase their internal organization. This is not a violation of thermodynamics but its most elegant expression: life is a local entropy-reducing process sustained by global entropy production. ATP hydrolysis, the universal energy currency, couples exergonic reactions to endergonic ones — using the free energy released by breaking phosphate bonds to drive the molecular machines that build and repair the organism.",
    insight: "The Quantum Distillery's Epoch #4 framework proposes that the emergence of consciousness represents a new regime of negentropy — where information itself becomes the substrate that is organized against the thermodynamic gradient.",
  },
  {
    slug: "molecular-biology",
    name: "Molecular Biology",
    title: "Molecular Biology",
    discipline: "Biology",
    body: "At the molecular scale, biology is an information-processing system of staggering complexity. DNA stores the genome — roughly 3.2 billion base pairs encoding approximately 20,000 protein-coding genes, plus vast regulatory networks in the non-coding regions. Transcription, translation, and post-translational modification form a cascade of information transformation from digital code to three-dimensional molecular machines. Epigenetics adds another layer: chemical modifications to DNA and histones that alter gene expression without changing the sequence itself.",
    insight: "The central dogma (DNA → RNA → Protein) is actually a simplification. Reverse transcriptase, RNA editing, prions, and epigenetic inheritance all demonstrate that information flows in multiple directions through biological systems.",
  },
  {
    slug: "quantum-biology",
    name: "Quantum Biology",
    title: "Quantum Biology",
    discipline: "Biology",
    body: "Quantum biology investigates whether non-trivial quantum mechanical effects play functional roles in living systems. The evidence is mounting. Photosynthetic complexes in plants and bacteria achieve near-perfect energy transfer efficiency through quantum coherence — excitons exploring multiple pathways simultaneously. Magnetoreception in migratory birds appears to rely on radical pair mechanisms that are sensitive to quantum spin dynamics. Enzyme catalysis exploits tunneling. Even mutations in DNA may involve quantum superposition of proton positions in hydrogen bonds.",
    insight: "The question is no longer whether quantum effects occur in biology — they do. The question is whether evolution has learned to harness them. If so, life is not merely classical chemistry. It is quantum engineering, refined over four billion years.",
  },
  {
    slug: "consciousness",
    name: "Consciousness",
    title: "Consciousness",
    discipline: "Biology",
    body: "Consciousness remains the hardest problem in science. How does subjective experience arise from objective matter? Integrated Information Theory (IIT) proposes that consciousness corresponds to integrated information (Φ) — the degree to which a system is both differentiated and unified. The Global Workspace Theory suggests consciousness emerges when information is broadcast widely across cortical networks. Orchestrated Objective Reduction (Orch OR) goes further, proposing that quantum computations in microtubules within neurons give rise to conscious moments.",
    insight: "For anesthesiologists, consciousness is not philosophy — it is the primary clinical variable. General anesthesia reversibly eliminates consciousness, and understanding its mechanism may be the key to understanding consciousness itself. This is where the Quantum Distillery's work converges.",
  },
  {
    slug: "epoch-4",
    name: "Epoch #4",
    title: "Epoch #4: Information Becomes Aware",
    discipline: "Biology",
    body: "The Epoch framework traces the emergence of complexity through four phase transitions. Epoch #1: Energy — the Big Bang creates matter and energy. Epoch #2: Chemistry — atoms combine into molecules, governed by quantum mechanics. Epoch #3: Biology — self-replicating molecular systems emerge, exploiting thermodynamic gradients to sustain negative entropy. Epoch #4: Consciousness — biological information processing reaches a threshold where the system becomes aware of itself. Each epoch does not replace the previous one but builds upon it.",
    insight: "Epoch #4 is the framework that unifies everything in the Quantum Distillery. Mathematics provides the language, physics provides the mechanism, and biology provides the expression — but consciousness is what makes the universe able to ask questions about itself.",
  },
];

/** Lookup by the landing page's tag label. */
export const conceptByName: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.name, c])
);

/** Lookup by URL slug. */
export const conceptBySlug: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.slug, c])
);

export const CONCEPT_SLUGS: string[] = CONCEPTS.map((c) => c.slug);
