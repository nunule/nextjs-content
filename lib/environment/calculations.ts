import type { ConcentrationScale, Period, PollutantId } from "./data"
import { CONCENTRATION_SCALES } from "./data"
import { INDEX_ROUNDING_DECIMALS, THRESHOLD_LABEL_CHARACTER_WIDTH, THRESHOLD_LABEL_GAP } from "./constants"
import { displayNumber, nativeConcentrationStep, toDisplayConcentration, truncatedNativeConcentration } from "./units"

export function compatibleScales(pollutant: PollutantId, period: Period) {
  return CONCENTRATION_SCALES.filter((scale) => scale.pollutant === pollutant && scale.period === period)
}

export function evaluateConcentration(scale: ConcentrationScale, value: number) {
  if (!Number.isFinite(value) || value < 0) return null
  const concentration = truncatedNativeConcentration(scale, value)
  if (scale.validMin !== undefined && concentration < scale.validMin) return null
  if (scale.validMax !== undefined && concentration > scale.validMax) return null
  // China defines fixed upper indices for hourly SO2 and 8-hour ozone above their last breakpoint.
  const capped = scale.definedMax !== undefined && concentration > scale.definedMax
  const evaluated = capped ? scale.definedMax! : concentration
  let segment = scale.upper.findIndex((upper) => evaluated <= upper)
  if (segment < 0) segment = scale.upper.length - 1
  let index: number | undefined
  if (scale.indexBreaks || scale.indexRanges) {
    const upper = scale.upper[segment]
    const previous = segment === 0 ? scale.validMin ?? 0 : scale.upper[segment - 1]
    const lower = scale.rounding === "epa" && segment > 0 ? previous + nativeConcentrationStep(scale) : previous
    const lowerIndex = scale.indexRanges?.[segment][0] ?? scale.indexBreaks![segment] + (scale.rounding === "epa" && segment > 0 ? 1 : 0)
    const upperIndex = scale.indexRanges?.[segment][1] ?? scale.indexBreaks![segment + 1]
    const raw = lowerIndex + (evaluated - lower) / (upper - lower) * (upperIndex - lowerIndex)
    const stableRaw = Number(raw.toFixed(INDEX_ROUNDING_DECIMALS))
    index = scale.rounding === "ceil" ? Math.max(1, Math.min(500, Math.ceil(stableRaw))) : Math.round(stableRaw)
  } else if (scale.standard === "uk") {
    index = segment + 1
  }
  const gradeIndex = scale.gradeIndices?.[segment] ?? (scale.standard === "cn" ? Math.min(segment, 5) : segment)
  return { gradeIndex, index, concentration, capped }
}

export function concentrationSegments(scale: ConcentrationScale, max: number) {
  const segments: { from: number; to: number; gradeIndex: number }[] = []
  let from = 0
  const validMin = toDisplayConcentration(scale, scale.validMin ?? 0)
  const validMax = toDisplayConcentration(scale, scale.validMax ?? Infinity)
  if (validMin > 0) {
    segments.push({ from: 0, to: Math.min(validMin, max), gradeIndex: -1 })
    from = Math.min(validMin, max)
  }
  scale.upper.forEach((upper, i) => {
    // A truncated EPA reading enters the next category one native step above
    // the previous upper breakpoint (for example 0.055, not 0.054 ppm).
    const transition = upper + (scale.rounding === "epa" ? nativeConcentrationStep(scale) : 0)
    const to = Math.min(toDisplayConcentration(scale, transition), max)
    if (to > from) {
      const gradeIndex = scale.gradeIndices?.[i] ?? (scale.standard === "cn" ? Math.min(i, 5) : i)
      const previous = segments[segments.length - 1]
      if (previous?.gradeIndex === gradeIndex) previous.to = to
      else segments.push({ from, to, gradeIndex })
    }
    from = to
  })
  if (from < max && segments.length) {
    if (Number.isFinite(validMax)) segments.push({ from, to: max, gradeIndex: -1 })
    else segments[segments.length - 1].to = max
  }
  return segments
}

/** Original source intervals; never merge away the UK's ten numerical index points. */
export function sourceRanges(scale: ConcentrationScale) {
  return scale.upper.map((to, i) => ({
    from: i === 0 ? scale.validMin ?? 0 : scale.upper[i - 1] + (scale.rounding === "epa" ? nativeConcentrationStep(scale) : 0),
    to,
    gradeIndex: scale.gradeIndices?.[i] ?? (scale.standard === "cn" ? Math.min(i, 5) : i),
    index: scale.standard === "uk" ? String(i + 1) : scale.indexRanges ? scale.indexRanges[i].join("–") : scale.indexBreaks ? `${scale.indexBreaks[i] + (i > 0 || scale.rounding === "ceil" ? 1 : 0)}–${scale.indexBreaks[i + 1]}` : undefined,
  }))
}

// Place close boundaries on separate lines instead of hiding or overlapping values.
export function thresholdLabels(scale: ConcentrationScale, max: number, width: number) {
  const lineEnds: number[] = []
  return concentrationSegments(scale, max).slice(0, -1).map((segment) => {
    const value = segment.to
    const labelWidth = displayNumber(value).length * THRESHOLD_LABEL_CHARACTER_WIDTH
    const center = Math.min(width - labelWidth / 2, Math.max(labelWidth / 2, value / max * width))
    const start = center - labelWidth / 2
    let line = lineEnds.findIndex((end) => start >= end + THRESHOLD_LABEL_GAP)
    if (line < 0) line = lineEnds.length
    lineEnds[line] = center + labelWidth / 2
    return { value, position: value / max * 100, labelPosition: center / width * 100, line }
  })
}
