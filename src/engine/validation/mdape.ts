/**
 * MDAPE (Median Absolute Performance Error) Calculation
 *
 * Standard metric for evaluating the accuracy of pharmacokinetic models
 * against measured data.  A system is considered acceptable when MDAPE < 20%.
 *
 * Reference:
 *   Varvel JR, Donoho DL, Shafer SL.
 *   Measuring the predictive performance of computer-controlled infusion pumps.
 *   J Pharmacokinet Biopharm. 1992;20:63-94.
 */

/**
 * Calculate the Prediction Error (PE) for a single observation.
 *
 * PE = (C_measured − C_predicted) / C_measured × 100  (%)
 *
 * A positive PE means the model under-predicts; negative means over-predicts.
 */
export function predictionError(measured: number, predicted: number): number {
  if (measured === 0) return 0;
  return ((measured - predicted) / measured) * 100;
}

/**
 * Calculate the Absolute Prediction Error (APE) for a single observation (%).
 */
export function absolutePredictionError(measured: number, predicted: number): number {
  return Math.abs(predictionError(measured, predicted));
}

/**
 * Calculate MDPE — Median Prediction Error (signed, %).
 * Positive: model systematically under-predicts (measured > predicted).
 * Negative: model over-predicts.
 */
export function mdpe(measured: number[], predicted: number[]): number {
  if (measured.length !== predicted.length || measured.length === 0) {
    throw new Error('measured and predicted arrays must be non-empty and equal length');
  }
  const errors = measured.map((m, i) => predictionError(m, predicted[i]));
  return median(errors);
}

/**
 * Calculate MDAPE — Median Absolute Prediction Error (%, unsigned).
 * The standard acceptance threshold for TCI systems is MDAPE < 20 %.
 */
export function mdape(measured: number[], predicted: number[]): number {
  if (measured.length !== predicted.length || measured.length === 0) {
    throw new Error('measured and predicted arrays must be non-empty and equal length');
  }
  const errors = measured.map((m, i) => absolutePredictionError(m, predicted[i]));
  return median(errors);
}

/**
 * Calculate RMSE — Root Mean Square Error.
 */
export function rmse(measured: number[], predicted: number[]): number {
  if (measured.length !== predicted.length || measured.length === 0) {
    throw new Error('measured and predicted arrays must be non-empty and equal length');
  }
  const sumSq = measured.reduce((acc, m, i) => {
    const diff = m - predicted[i];
    return acc + diff * diff;
  }, 0);
  return Math.sqrt(sumSq / measured.length);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
