"use client"

import { useRef, useState } from "react"
import { useLocale } from "@/components/locale-provider"
import { DEFAULT_EXERCISE_CONCENTRATION, DEFAULT_EXERCISE_PERIOD, DEFAULT_EXERCISE_STANDARD, EXERCISE_ACTIVITIES, EXERCISE_PERIODS, EXERCISE_POLLUTANTS, EXERCISE_STANDARDS, SOURCE_URLS } from "@/lib/environment/constants"
import { getPollutant, getStandard, localize, STANDARDS, type Population } from "@/lib/environment/data"
import { assessExercise, exerciseOfficialAdvice, type ExerciseActivity, type ExerciseOutcome, type ExercisePeriod, type ExerciseReadings, type ExerciseStandard } from "@/lib/environment/exercise"
import { exerciseEn, exerciseZh, type ExerciseMessageKey } from "@/lib/environment/exercise-messages"

function ActivityIcon({ activity }: { activity: ExerciseActivity }) {
  return <svg className="env-outdoor-activity-icon" viewBox="0 0 72 92" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {activity === "walking" ? <><circle cx="39" cy="12" r="6" /><path d="m34 22-9 16-7 19 4 3 10-19 4-3 2 21-14 23 5 4 16-25 13 23 6-3-14-28-3-17 12 15 5-3-15-22c-4-6-10-9-14-4Z" /></>
      : activity === "jogging" ? <><circle cx="43" cy="12" r="6" /><path d="m37 22-17 9-6 16 5 2 7-12 9-3-6 23-16 3-7 16 5 3 8-12 18-1 7-19 8 16 12 1 1-6-8-1-7-24 9 9 11-13-4-3-8 8-11-14c-4-3-9-3-13-1Z" /></>
      : <><circle cx="45" cy="13" r="6" /><circle cx="17" cy="68" r="13" /><circle cx="56" cy="68" r="13" /><path d="m17 68 15-25 10 25H17l24-13 15 13-9-30 8-4M34 39l4-13c2-7 8-7 12-3l9 10 7 2M37 28 26 38l3 10 14 9-7 15M31 44h8" /></>}
  </svg>
}

function StatusIcon({ outcome }: { outcome: ExerciseOutcome }) {
  return <svg className={`env-outdoor-status env-outdoor-status-${outcome}`} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    {outcome === "usual" ? <path d="m7 12 3 3 7-7" stroke="var(--env-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      : outcome === "unknown" ? <><circle cx="12" cy="7" r="1.2" fill="var(--env-surface)" /><path d="M12 11v6" stroke="var(--env-surface)" strokeWidth="2" strokeLinecap="round" /></>
      : <path d="M12 6v8m0 3v.1" stroke="var(--env-surface)" strokeWidth="2" strokeLinecap="round" />}
  </svg>
}

export function ExercisePanel({ onStandards }: { onStandards: () => void }) {
  const { locale } = useLocale()
  const dictionary = locale === "en" ? exerciseEn : exerciseZh
  const tr = (key: ExerciseMessageKey) => dictionary[key]
  const [location, setLocation] = useState("cn")
  const [standard, setStandard] = useState<ExerciseStandard>(DEFAULT_EXERCISE_STANDARD)
  const [period, setPeriod] = useState<ExercisePeriod>(DEFAULT_EXERCISE_PERIOD)
  const [population, setPopulation] = useState<Population>("general")
  const [symptoms, setSymptoms] = useState(false)
  const [readings, setReadings] = useState<ExerciseReadings>({ pm25: String(DEFAULT_EXERCISE_CONCENTRATION) })
  const [showExtras, setShowExtras] = useState(false)
  const [showBasis, setShowBasis] = useState(false)
  const [isExample, setIsExample] = useState(true)
  const [periodReset, setPeriodReset] = useState(false)
  const concentrationRef = useRef<HTMLInputElement>(null)
  const assessment = assessExercise({ standard, period, readings, population, symptoms })
  const ready = assessment.status === "ready"
  const currentStandard = getStandard(standard)
  const grade = ready ? currentStandard.grades[assessment.gradeIndex!] : undefined
  const requiredPeriod = EXERCISE_PERIODS[standard]
  const extras = EXERCISE_POLLUTANTS[standard].filter((item) => item !== "pm25")
  const groupLabel = tr(population === "general" ? "generalGroup" : "sensitiveGroup")
  const currentSource = standard === "us" ? SOURCE_URLS.usParticles : currentStandard.source
  const separator = locale === "en" ? ": " : "："
  const pendingKey = `${assessment.status === "periodMismatch" ? "mismatch" : assessment.status === "invalid" ? "invalid" : "empty"}Title` as ExerciseMessageKey
  let summaryKey: ExerciseMessageKey = "usualSummary"
  if (standard === "jp") summaryKey = assessment.gradeIndex === 0 ? "jpBelowSummary" : "jpAboveSummary"
  else if (Object.values(assessment.outcomes).includes("indoors")) summaryKey = "indoorsSummary"
  else if (EXERCISE_ACTIVITIES.every((activity) => assessment.outcomes[activity] === "avoid")) summaryKey = "indoorsSummary"
  else if (assessment.outcomes.vigorous === "avoid") summaryKey = "vigorousSummary"
  else if (assessment.outcomes.walking === "adjust") summaryKey = "adjustSummary"
  else if (symptoms) summaryKey = "symptomsSummary"
  else if (assessment.outcomes.vigorous !== "usual") summaryKey = "cautionSummary"

  function changePeriod(next: ExercisePeriod) {
    setPeriod(next)
    setReadings({ pm25: "" })
    setIsExample(false)
    setPeriodReset(true)
    concentrationRef.current?.focus()
  }
  function changeStandard(next: ExerciseStandard) {
    if (next === standard) return
    setStandard(next)
    // Additional readings may have a different time window under a different reference.
    setReadings((previous) => ({ pm25: previous.pm25 }))
    setShowExtras(false)
  }
  function outcomeLabel(outcome: ExerciseOutcome, activity: ExerciseActivity) {
    if (!ready) return tr("pending")
    if (outcome === "usual" && activity === "vigorous") return tr("usualVigorous")
    if (outcome === "monitor" && symptoms) return tr("monitorSymptoms")
    if (outcome === "avoid" && assessment.outcomes.walking !== "avoid") return tr("avoidVigorous")
    return tr(outcome)
  }
  const comparisonValue = readings.pm25?.trim()
  const canCompare = !!comparisonValue && Number.isFinite(Number(comparisonValue)) && Number(comparisonValue) >= 0

  return <div className="env-outdoor-panel">
    <div className="env-outdoor-heading"><div><h2>{tr("title")}</h2><p>{tr("description")}</p></div><span>{tr(isExample ? "example" : "manual")}</span></div>

    <div className="env-outdoor-inputs">
      <div className="env-outdoor-measurements">
        <label htmlFor="outdoor-location"><span>{tr("location")}</span><select id="outdoor-location" value={location} onChange={(event) => setLocation(event.target.value)} aria-describedby="outdoor-location-note">{STANDARDS.map((item) => <option key={item.id} value={item.id}>{localize(item.name, locale)}</option>)}<option value="other">{tr("otherLocation")}</option></select></label>
        <label htmlFor="outdoor-pm25"><span>{tr("concentration")}</span><input ref={concentrationRef} id="outdoor-pm25" type="number" min="0" step="0.1" inputMode="decimal" value={readings.pm25 ?? ""} aria-invalid={assessment.status === "invalid" || undefined} onChange={(event) => { setReadings((previous) => ({ ...previous, pm25: event.target.value })); setIsExample(false); setPeriodReset(false) }} /><span className="env-outdoor-unit">µg/m³</span></label>
        <label htmlFor="outdoor-period"><span>{tr("period")}</span><select id="outdoor-period" value={period} onChange={(event) => changePeriod(event.target.value as ExercisePeriod)}>{(["h1", "h24", "predictedDaily"] as const).map((item) => <option key={item} value={item}>{tr(item)}</option>)}</select></label>
      </div>
      <div className="env-outdoor-preferences">
        <fieldset className="env-outdoor-population"><legend className="sr-only">{tr("population")}</legend><span aria-hidden="true">{tr("population")}</span>{(["general", "sensitive"] as const).map((item) => <label key={item}><input type="radio" name="outdoor-population" value={item} checked={population === item} onChange={() => setPopulation(item)} />{tr(item)}</label>)}</fieldset>
        <label className="env-outdoor-symptoms"><input type="checkbox" checked={!symptoms} onChange={(event) => setSymptoms(!event.target.checked)} />{tr("noSymptoms")}</label>
        <div className="env-outdoor-reference" role="group" aria-label={tr("standard")}><span>{tr("standard")}</span>{EXERCISE_STANDARDS.map((item) => <button key={item} type="button" aria-pressed={standard === item} onClick={() => changeStandard(item)}>{tr(item)}</button>)}</div>
        {extras.length > 0 && <button className="env-outdoor-extras-toggle" type="button" aria-expanded={showExtras} aria-controls="outdoor-extra-inputs" onClick={() => setShowExtras(!showExtras)}><span aria-hidden="true">{showExtras ? "−" : "+"}</span>{tr(showExtras ? "hidePollutants" : "addPollutants")}</button>}
      </div>
      <p id="outdoor-location-note" className="sr-only">{tr("locationNote")}</p>
      <div className="env-outdoor-extras" id="outdoor-extra-inputs" hidden={!showExtras || extras.length === 0}>
        <p>{tr("additionalNote")} {standard === "us" && tr("usCoverage")}</p>
        <div>{extras.map((item) => <label key={item}>{getPollutant(item).symbol} <small>µg/m³ · {tr(period)}</small><input type="number" min="0" step="0.1" inputMode="decimal" placeholder={tr("optional")} value={readings[item] ?? ""} onChange={(event) => { setReadings((previous) => ({ ...previous, [item]: event.target.value })); setIsExample(false) }} /></label>)}</div>
        <button type="button" onClick={() => setReadings((previous) => ({ pm25: previous.pm25 }))}>{tr("clear")}</button>
      </div>
      {periodReset && <p className="env-outdoor-reset-note" role="status">{tr("periodReset")}</p>}
    </div>

    <article className="env-outdoor-result" aria-labelledby="outdoor-result-title">
      <div className="env-outdoor-result-top"><strong>{tr("accordingTo")} {tr(standard)} · {groupLabel}</strong>{grade && <span className="env-outdoor-grade"><i aria-hidden="true" style={{ background: grade.color }} />{tr(assessment.count > 1 ? "supplied" : "single")}{separator}{localize(grade.name, locale)}</span>}</div>
      <div className="env-outdoor-result-summary" aria-live="polite" aria-atomic="true"><h3 id="outdoor-result-title">{tr(ready ? summaryKey : pendingKey)}</h3>
        {ready ? <p>{tr("basis")}{separator}PM2.5 · {tr(period)} {readings.pm25} µg/m³{assessment.count > 1 && <> · {tr("driver")} {getPollutant(assessment.driver!).symbol} {readings[assessment.driver!]} µg/m³</>}</p>
          : <p>{tr(assessment.status === "periodMismatch" ? "mismatchNote" : assessment.status === "invalid" ? "invalidNote" : "emptyNote")}</p>}
      </div>
      {assessment.status === "periodMismatch" && <div className="env-outdoor-mismatch"><span>{tr("needs")} {tr(requiredPeriod)}</span><button type="button" onClick={() => changePeriod(requiredPeriod)}>{tr("enterRequired")} <span aria-hidden="true">→</span></button></div>}
      <div className="env-outdoor-activities">{EXERCISE_ACTIVITIES.map((activity) => <section key={activity} className="env-outdoor-activity" data-outcome={ready ? assessment.outcomes[activity] : "unknown"}>
        <ActivityIcon activity={activity} /><div><h4>{tr(activity)}</h4><div className="env-outdoor-verdict"><StatusIcon outcome={ready ? assessment.outcomes[activity] : "unknown"} /><strong>{outcomeLabel(assessment.outcomes[activity], activity)}</strong></div><p>{tr(`${activity}Detail` as ExerciseMessageKey)}</p></div>
      </section>)}</div>
      <div className="env-outdoor-result-footer"><p><span aria-hidden="true">ⓘ</span>{tr("resultNote")}</p><button type="button" aria-expanded={showBasis} aria-controls="outdoor-basis" onClick={() => setShowBasis(!showBasis)}>{tr("basisLink")} <span aria-hidden="true">{showBasis ? "−" : "↗"}</span></button></div>
      <section className="env-outdoor-basis" id="outdoor-basis" hidden={!showBasis}>
        <h4>{tr("official")}</h4><p>{ready ? localize(exerciseOfficialAdvice(standard, assessment.gradeIndex!, population), locale) : tr("mismatchNote")}</p>
        <h4>{tr("sensitiveDefinition")}</h4><p>{localize(currentStandard.sensitiveGroups, locale)}</p>
        <p>{tr(standard === "us" ? "usCoverage" : standard === "jp" ? "jpCoverage" : "singleNote")}</p><p>{tr("notMinutes")}</p>
        <a className="env-source" href={currentSource} target="_blank" rel="noopener noreferrer">{tr("official")} ↗</a>
      </section>
    </article>

    {canCompare && <section className="env-outdoor-comparison" aria-labelledby="outdoor-comparison-title">
      <h3 id="outdoor-comparison-title">{tr("comparePrefix")} {comparisonValue}{tr("compareSuffix")}</h3><p>{tr("hypothetical")}</p>
      <div className="env-outdoor-table-scroll" tabIndex={0} role="region" aria-label={tr("comparisonCaption")}><table><caption className="sr-only">{tr("comparisonCaption")}</caption><thead><tr><th scope="col">{tr("reference")}</th><th scope="col">{tr("inputCondition")}</th><th scope="col">{tr("adviceForGroup")}</th></tr></thead><tbody>{EXERCISE_STANDARDS.map((item) => {
        const comparison = assessExercise({ standard: item, period: EXERCISE_PERIODS[item], readings: { pm25: comparisonValue }, population, symptoms })
        const allUsual = EXERCISE_ACTIVITIES.every((activity) => comparison.outcomes[activity] === "usual")
        const outcome: ExerciseOutcome = item === "jp" ? "unknown" : allUsual ? "usual" : comparison.outcomes.vigorous
        const comparisonAdvice = item === "jp" && comparison.gradeIndex === 0 && population === "general" ? tr("compareJapan")
          : item === "us" && comparison.gradeIndex === 1 ? tr("compareSensitive")
          : allUsual ? tr("compareUsual") : localize(exerciseOfficialAdvice(item, comparison.gradeIndex!, population), locale)
        return <tr key={item}><th scope="row"><a href={item === "us" ? SOURCE_URLS.usParticles : getStandard(item).source} target="_blank" rel="noopener noreferrer">{tr(item)} <span aria-hidden="true">↗</span></a></th><td>{tr(item === "eu" ? "hourlyMean" : item === "us" ? "ifDaily" : "ifPredicted")} {comparisonValue}</td><td><div><StatusIcon outcome={outcome} /><span>{comparisonAdvice}</span></div></td></tr>
      })}</tbody></table></div>
      <div className="env-outdoor-comparison-footer"><p><span aria-hidden="true">ⓘ</span>{tr("actualNote")}</p><button type="button" onClick={onStandards}>{tr("standardsLink")} <span aria-hidden="true">→</span></button></div>
    </section>}
  </div>
}
