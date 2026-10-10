import type { ConcentrationScale, Period, PollutantId } from "./data"
import { CONCENTRATION_SCALES } from "./data"
import { THRESHOLD_LABEL_CHARACTER_WIDTH, THRESHOLD_LABEL_GAP } from "./constants"

export function compatibleScales(pollutant: PollutantId, period: Period) {
  return CONCENTRATION_SCALES.filter((scale) => scale.pollutant === pollutant && scale.period === period)
}

export function evaluateConcentration(scale: ConcentrationScale, value: number) {
  if (!Number.isFinite(value) || value < 0) return null
  const concentration = scale.rounding === "epa"
    ? Math.floor(value * (scale.pollutant === "pm25" ? 10 : 1)) / (scale.pollutant === "pm25" ? 10 : 1)
    : value
  // China defines fixed upper indices for hourly SO2 and 8-hour ozone above their last breakpoint.
  const capped = scale.definedMax !== undefined && concentration > scale.definedMax
  const evaluated = capped ? scale.definedMax! : concentration
  let segment = scale.upper.findIndex((upper) => evaluated <= upper)
  if (segment < 0) segment = scale.upper.length - 1
  let index: number | undefined
  if (scale.indexBreaks) {
    const upper = scale.upper[segment]
    const previous = segment === 0 ? 0 : scale.upper[segment - 1]
    const lower = scale.rounding === "epa" && segment > 0 ? previous + (scale.pollutant === "pm25" ? 0.1 : 1) : previous
    const lowerIndex = scale.indexBreaks[segment] + (scale.rounding === "epa" && segment > 0 ? 1 : 0)
    const raw = lowerIndex + (evaluated - lower) / (upper - lower) * (scale.indexBreaks[segment + 1] - lowerIndex)
    index = scale.rounding === "ceil" ? Math.max(1, Math.min(500, Math.ceil(raw))) : Math.round(raw)
  } else if (scale.standard === "uk") {
    index = segment + 1
  }
  const gradeIndex = scale.gradeIndices?.[segment] ?? (scale.standard === "cn" ? Math.min(segment, 5) : segment)
  return { gradeIndex, index, concentration, capped }
}

export function concentrationSegments(scale: ConcentrationScale, max: number) {
  const segments: { from: number; to: number; gradeIndex: number }[] = []
  let from = 0
  scale.upper.forEach((upper, i) => {
    const to = Math.min(upper, max)
    if (to > from) {
      const gradeIndex = scale.gradeIndices?.[i] ?? (scale.standard === "cn" ? Math.min(i, 5) : i)
      const previous = segments[segments.length - 1]
      if (previous?.gradeIndex === gradeIndex) previous.to = to
      else segments.push({ from, to, gradeIndex })
    }
    from = to
  })
  if (from < max && segments.length) segments[segments.length - 1].to = max
  return segments
}

// Place close boundaries on separate lines instead of hiding or overlapping values.
export function thresholdLabels(scale: ConcentrationScale, max: number, width: number) {
  const lineEnds: number[] = []
  return concentrationSegments(scale, max).slice(0, -1).map((segment) => {
    const value = segment.to
    const labelWidth = String(value).length * THRESHOLD_LABEL_CHARACTER_WIDTH
    const center = Math.min(width - labelWidth / 2, Math.max(labelWidth / 2, value / max * width))
    const start = center - labelWidth / 2
    let line = lineEnds.findIndex((end) => start >= end + THRESHOLD_LABEL_GAP)
    if (line < 0) line = lineEnds.length
    lineEnds[line] = center + labelWidth / 2
    return { value, position: value / max * 100, labelPosition: center / width * 100, line }
  })
}
