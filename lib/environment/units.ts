import type { ConcentrationScale } from "./data"

// Fixed reference conditions for the educational mass-concentration axis.
export const GAS_REFERENCE = { temperatureC: 25, pressureKpa: 101.325, molarVolume: 24.45 } as const
export const GAS_MOLECULAR_WEIGHTS = { o3: 48, no2: 46.01, so2: 64.07, co: 28.01 } as const
const MICROGRAMS_PER_MILLIGRAM = 1000
const TRUNCATION_TOLERANCE = 1e-9

export function massConversionFactor(scale: ConcentrationScale) {
  if (!scale.nativeUnit) return 1
  const molecularWeight = GAS_MOLECULAR_WEIGHTS[scale.pollutant as keyof typeof GAS_MOLECULAR_WEIGHTS]
  const multiplier = scale.nativeUnit === "ppm" && scale.pollutant !== "co" ? MICROGRAMS_PER_MILLIGRAM : 1
  return molecularWeight / GAS_REFERENCE.molarVolume * multiplier
}

export const toDisplayConcentration = (scale: ConcentrationScale, value: number) => value * massConversionFactor(scale)
export const toNativeConcentration = (scale: ConcentrationScale, value: number) => value / massConversionFactor(scale)

export function nativeConcentrationStep(scale: ConcentrationScale) {
  return scale.nativeStep ?? (scale.pollutant === "pm25" ? 0.1 : 1)
}

export function truncatedNativeConcentration(scale: ConcentrationScale, value: number) {
  const native = toNativeConcentration(scale, value)
  if (scale.rounding !== "epa") return native
  const step = nativeConcentrationStep(scale)
  return Number((Math.floor(native / step + TRUNCATION_TOLERANCE) * step).toFixed(6))
}

export function displayNumber(value: number) {
  return Number.isFinite(value) ? String(Number(value.toFixed(3))) : "∞"
}
