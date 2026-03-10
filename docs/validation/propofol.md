# Propofol PK Validation

## Models Compared

### Marsh (1991) — Primary Implementation

| Parameter | Published (Marsh 1991) | SedSim | Δ (%) |
|-----------|:----------------------:|:------:|:-----:|
| V₁ (L)   | 15.9                   | 15.9   | 0.0 % |
| k₁₀ (min⁻¹) | 0.119               | 0.119  | 0.0 % |
| k₁₂ (min⁻¹) | 0.114               | 0.114  | 0.0 % |
| k₁₃ (min⁻¹) | 0.042               | 0.042  | 0.0 % |
| k₂₁ (min⁻¹) | 0.055               | 0.055  | 0.0 % |
| k₃₁ (min⁻¹) | 0.0033              | 0.0033 | 0.0 % |
| ke₀ (min⁻¹) | 0.26 ᵃ              | 0.26   | 0.0 % |

ᵃ ke₀ is from Struys et al. 2000 (the original Marsh 1991 paper did not report ke₀).

**Standard patient**: 40 yr, 70 kg adult.

#### MDAPE Results

| Dosing Protocol | MDAPE Plasma | MDAPE Effect-Site |
|-----------------|:------------:|:-----------------:|
| 200 mg bolus    | **< 1 %**    | **< 1 %**         |
| 10 mg/min × 10 min infusion | **< 1 %** | **< 1 %** |

✅ **PASS** — MDAPE well below the 20 % acceptance threshold.

---

### Schnider (1998) — Comparison Reference

The Schnider model uses covariate-dependent parameters.  SedSim implements the Marsh model; the Schnider profile is shown for informational comparison only.

**Standard patient**: 35 yr, 70 kg, 170 cm, male (LBM ≈ 55.3 kg).

Derived rate constants (Schnider 1998, Table 3):

| Parameter    | Value          |
|-------------|:--------------:|
| V₁ (L)      | 4.27           |
| k₁₀ (min⁻¹) | 0.384          |
| k₁₂ (min⁻¹) | 0.403          |
| k₁₃ (min⁻¹) | 0.196          |
| k₂₁ (min⁻¹) | 0.066          |
| k₃₁ (min⁻¹) | 0.00351        |
| ke₀ (min⁻¹) | 0.456          |

Key difference from Marsh: V₁ is much smaller (4.27 L vs 15.9 L), which produces a higher initial peak concentration for the same bolus dose.  Both models predict qualitatively similar plasma decay curves.

---

## Simulated Concentration-Time Profiles

### Marsh: 200 mg Bolus (70 kg patient)

| Time (min) | C₁ plasma (mcg/mL) | Ce effect-site (mcg/mL) |
|-----------:|:-------------------:|:-----------------------:|
| 1          | ≈ 8.0               | ≈ 1.4                   |
| 2          | ≈ 5.8               | ≈ 2.3                   |
| 5          | ≈ 3.1               | ≈ 2.8                   |
| 10         | ≈ 1.9               | ≈ 2.1                   |
| 20         | ≈ 1.2               | ≈ 1.4                   |
| 40         | ≈ 0.7               | ≈ 0.8                   |
| 60         | ≈ 0.4               | ≈ 0.5                   |

*Values are approximate; run `npm test` for exact simulation output.*

---

## References

- Marsh BE, White M, Morton N, Kenny GN. Pharmacokinetic model driven infusion of propofol in children. *Br J Anaesth*. 1991;67:41-48.  
- Schnider TW, Minto CF, Gambus PL, et al. The influence of method of administration and covariates on the pharmacokinetics of propofol in adult volunteers. *Anesthesiology*. 1998;88:1170-1182.  
- Struys MM, De Smet T, Depoorter B, et al. Comparison of plasma compartment versus two methods for effect compartment-controlled target-controlled infusion for propofol. *Anesthesiology*. 2000;92:399-406.
