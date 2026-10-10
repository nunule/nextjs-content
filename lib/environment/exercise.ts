import { EXERCISE_ACTIVITIES, EXERCISE_PERIODS, EXERCISE_POLLUTANTS, JAPAN_PM25_ADVISORY } from "./constants"
import { evaluateConcentration } from "./calculations"
import { bilingual, CONCENTRATION_SCALES, getStandard, type PollutantId, type Population } from "./data"

export type ExerciseStandard = keyof typeof EXERCISE_PERIODS
export type ExercisePeriod = typeof EXERCISE_PERIODS[ExerciseStandard]
export type ExerciseActivity = typeof EXERCISE_ACTIVITIES[number]
export type ExerciseOutcome = "usual" | "monitor" | "adjust" | "avoid" | "indoors" | "unknown"
export type ExerciseReadings = Partial<Record<PollutantId, string>>
export interface ExerciseAssessment {
  status: "ready" | "empty" | "invalid" | "periodMismatch"
  gradeIndex?: number
  driver?: PollutantId
  count: number
  outcomes: Record<ExerciseActivity, ExerciseOutcome>
}

const outcomes = (walking: ExerciseOutcome, jogging = walking, vigorous = jogging) => ({ walking, jogging, vigorous })

/** Interpret the scope of the official messages; never invent safe minutes or upgrade an air category for symptoms. */
export function activityOutcomes(standard: ExerciseStandard, grade: number, population: Population, symptoms: boolean) {
  const sensitive = population === "sensitive"
  let result: Record<ExerciseActivity, ExerciseOutcome>
  if (standard === "jp") {
    // Japan's daily PM2.5 advisory is not an exercise clearance below 70.
    result = grade === 0 ? outcomes("unknown") : outcomes("adjust")
  } else if (standard === "eu") {
    if (grade <= 1) result = outcomes("usual")
    else if (grade === 2) result = sensitive && symptoms ? outcomes("monitor", "monitor", "adjust") : outcomes("usual")
    else if (grade <= 4) result = sensitive ? outcomes("adjust") : symptoms ? outcomes("monitor", "monitor", "adjust") : outcomes("usual")
    else result = sensitive ? outcomes("avoid") : outcomes("adjust")
  } else {
    if (grade === 0) result = outcomes("usual")
    else if (grade === 1) result = sensitive ? outcomes("monitor", "monitor", "adjust") : outcomes("usual")
    else if (grade === 2) result = sensitive ? outcomes("adjust") : outcomes("usual")
    else if (grade === 3) result = sensitive ? outcomes("adjust", "adjust", "avoid") : outcomes("monitor", "adjust", "adjust")
    else if (grade === 4) result = sensitive ? outcomes("indoors") : outcomes("monitor", "avoid", "avoid")
    else result = outcomes("indoors")
  }
  if (symptoms) {
    for (const activity of EXERCISE_ACTIVITIES) {
      if (result[activity] === "usual" || result[activity] === "unknown") result[activity] = "monitor"
    }
  }
  return result
}

export function assessExercise({ standard, period, readings, population, symptoms }: {
  standard: ExerciseStandard; period: ExercisePeriod; readings: ExerciseReadings; population: Population; symptoms: boolean
}): ExerciseAssessment {
  const pending = (status: ExerciseAssessment["status"]): ExerciseAssessment => ({ status, count: 0, outcomes: outcomes("unknown") })
  const value = readings.pm25?.trim()
  if (!value) return pending("empty")
  const entries = EXERCISE_POLLUTANTS[standard].flatMap((pollutant) => {
    const input = readings[pollutant]?.trim()
    return input ? [{ pollutant, value: Number(input) }] : []
  })
  if (entries.some((entry) => !Number.isFinite(entry.value) || entry.value < 0)) return pending("invalid")
  if (period !== EXERCISE_PERIODS[standard]) return pending("periodMismatch")
  const evaluated = entries.map((entry) => {
    if (standard === "jp") return { ...entry, gradeIndex: entry.value > JAPAN_PM25_ADVISORY ? 1 : 0 }
    const scale = CONCENTRATION_SCALES.find((item) => item.standard === standard && item.pollutant === entry.pollutant && item.period === period)!
    return { ...entry, gradeIndex: evaluateConcentration(scale, entry.value)!.gradeIndex }
  })
  // PM10 includes fine particles. Use the poorest supplied category, never add concentrations.
  const driver = evaluated.reduce((worst, entry) => entry.gradeIndex > worst.gradeIndex ? entry : worst)
  return { status: "ready", gradeIndex: driver.gradeIndex, driver: driver.pollutant, count: entries.length,
    outcomes: activityOutcomes(standard, driver.gradeIndex, population, symptoms) }
}

export function exerciseOfficialAdvice(standard: ExerciseStandard, gradeIndex: number, population: Population) {
  // Particle guidance distinguishes avoiding long/intense activity from avoiding every outdoor activity.
  if (standard === "us" && gradeIndex === 4 && population === "general") return bilingual(
    "避免长时间或剧烈的户外活动，考虑改期或移到室内。",
    "Avoid prolonged or intense outdoor activities; consider rescheduling or moving indoors.")
  return getStandard(standard).grades[gradeIndex][population].text
}
