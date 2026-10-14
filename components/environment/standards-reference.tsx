"use client"

import { useLocale } from "@/components/locale-provider"
import { sourceRanges } from "@/lib/environment/calculations"
import { SOURCE_URLS } from "@/lib/environment/constants"
import { CONCENTRATION_SCALES, getComparisonPollutant, getStandard, localize, STANDARDS, type Period, type PollutantId, type StandardId } from "@/lib/environment/data"
import { environmentEn, environmentZh, type EnvironmentMessageKey } from "@/lib/environment/messages"
import { CANADA_REFERENCES, JAPAN_REFERENCES, STANDARD_REFERENCE_NOTES, standardCoverage } from "@/lib/environment/reference"
import { displayNumber } from "@/lib/environment/units"

function useReferenceText() {
  const { locale } = useLocale()
  const messages = locale === "en" ? environmentEn : environmentZh
  return { locale, tr: (key: EnvironmentMessageKey) => messages[key] }
}

export function StandardsCoverage({ pollutantId, period, onPeriod, onReference }: {
  pollutantId: PollutantId; period: Period; onPeriod: (period: Period) => void; onReference: (standard: StandardId) => void
}) {
  const { locale, tr } = useReferenceText()
  return <section className="env-coverage" aria-labelledby="env-coverage-heading">
    <div className="env-systems-heading"><h3 id="env-coverage-heading">{tr("coverageTitle")}</h3><span>{tr("coverageHint")}</span></div>
    <div className="env-table-scroll" role="region" aria-label={tr("coverageTitle")} tabIndex={0}>
      <table><thead><tr><th scope="col">{tr("standard")}</th><th scope="col">{tr("coverageStatus")}</th><th scope="col">{tr("coverageBasis")}</th><th scope="col"><span className="sr-only">{tr("viewReference")}</span></th></tr></thead><tbody>{STANDARDS.map((standard) => {
        const coverage = standardCoverage(standard.id, pollutantId, period)
        const basis = coverage.kind === "comparable" || coverage.kind === "otherPeriod" ? coverage.scales.map((scale) => tr(scale.period)).join(" / ")
          : coverage.kind === "combined" ? tr("canadaCombinedNote")
          : standard.id === "jp" && pollutantId === "pm10" ? tr("japanSpmNote")
          : standard.id === "jp" && ["nh3", "pb"].includes(pollutantId) ? tr("japanExtrasNote")
          : coverage.kind === "reference" ? tr("referenceOnly") : tr("excludedNote")
        return <tr key={standard.id}><th scope="row">{localize(standard.name, locale)}</th><td><span className="env-coverage-status" data-kind={coverage.kind}>{tr(coverage.kind)}</span></td><td>{basis}{coverage.kind === "comparable" && coverage.scales.some((scale) => scale.period === period && scale.nativeUnit) && <small className="env-converted-label">{tr("converted")} · 25°C</small>}</td><td className="env-coverage-actions">{coverage.kind === "otherPeriod" && coverage.scales.map((scale) => <button key={scale.period} type="button" onClick={() => onPeriod(scale.period)}>{tr(scale.period)} ↗</button>)}<button type="button" onClick={() => onReference(standard.id)}>{tr("viewReference")} ↓</button></td></tr>
      })}</tbody></table>
    </div>
    <p className="env-table-hint">{tr("tableScroll")} ↔</p>
  </section>
}

export function StandardsReference({ selected, onSelect, pollutantId, onCompare }: {
  selected: StandardId; onSelect: (standard: StandardId) => void; pollutantId: PollutantId; onCompare: (pollutant: PollutantId, period: Period) => void
}) {
  const { locale, tr } = useReferenceText()
  const standard = getStandard(selected)
  const scales = CONCENTRATION_SCALES.filter((scale) => scale.standard === selected)
  const references = selected === "ca" ? CANADA_REFERENCES : selected === "jp" ? JAPAN_REFERENCES : []
  const source = selected === "jp" ? SOURCE_URLS.jpStandards : standard.source
  return <section className="env-reference-library env-card" aria-labelledby="env-library-heading">
    <div className="env-systems-heading"><h2 id="env-library-heading" tabIndex={-1}>{tr("libraryTitle")}</h2><span>{tr("libraryHint")}</span></div>
    <div className="env-library-picker" role="group" aria-label={tr("libraryPicker")}>{STANDARDS.map((item) => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}>{localize(item.name, locale)}</button>)}</div>
    <div className="env-library-heading"><h3>{localize(standard.name, locale)}{selected === "ca" ? " · AQHI / CAAQS" : selected === "jp" ? " · MOE" : ` · ${standard.index}`}</h3><a className="env-source" href={source} target="_blank" rel="noopener noreferrer">{tr("source")} ↗</a></div>
    <p className="env-library-note">{localize(STANDARD_REFERENCE_NOTES[selected], locale)}</p>
    {selected !== "jp" && <div className="env-library-grades">{standard.grades.map((grade, i) => <span key={i}><i className="env-grade-dot" style={{ background: grade.color }} />{localize(grade.name, locale)}<small>{grade.range}</small></span>)}</div>}
    {scales.length > 0 ? <>
      <div className="env-table-scroll" role="region" aria-label={tr("sourceThresholds")} tabIndex={0}>
        <table className="env-native-table"><thead><tr><th scope="col">{tr("pollutant")}</th><th scope="col">{tr("period")}</th><th scope="col">{tr("sourceUnit")}</th><th scope="col">{tr("sourceThresholds")}</th><th scope="col"><span className="sr-only">{tr("comparePeriod")}</span></th></tr></thead><tbody>{scales.map((scale) => {
          const pollutant = getComparisonPollutant(scale.pollutant)
          const ranges = sourceRanges(scale)
          return <tr key={`${scale.pollutant}:${scale.period}`} data-current={scale.pollutant === pollutantId}><th scope="row">{pollutant.symbol}</th><td>{tr(scale.period)}</td><td>{scale.nativeUnit ?? pollutant.unit}</td><td>
            <details className="env-native-detail" open={scale.pollutant === pollutantId}><summary><span className="env-native-breaks">{scale.upper.map(displayNumber).join(" · ")}</span><span className="sr-only">{tr("sourceDetail")} {pollutant.symbol} · {tr(scale.period)}</span></summary>
              <table aria-label={`${pollutant.symbol} ${tr(scale.period)} · ${tr("sourceRangesCaption")}`}><thead><tr><th scope="col">{tr("grade")}</th><th scope="col">{tr("range")} ({scale.nativeUnit ?? pollutant.unit})</th><th scope="col">{tr("sourceIndex")}</th></tr></thead><tbody>{ranges.map((range, i) => <tr key={i}><td><i className="env-grade-dot" style={{ background: standard.grades[range.gradeIndex].color }} />{localize(standard.grades[range.gradeIndex].name, locale)}</td><td>{range.from > 0 && !(i === 0 && scale.validMin !== undefined) && scale.rounding !== "epa" ? ">" : ""}{displayNumber(range.from)} – {displayNumber(range.to)}</td><td>{range.index ?? "—"}</td></tr>)}</tbody></table>
              {scale.note && <p>{localize(scale.note, locale)}</p>}
            </details>
          </td><td><button type="button" className="env-library-compare" onClick={() => onCompare(scale.pollutant, scale.period)} aria-label={`${tr("comparePeriod")} ${pollutant.symbol} · ${tr(scale.period)}`}>↗</button></td></tr>
        })}</tbody></table>
      </div><p className="env-library-note">{tr("libraryNativeNote")}</p><small className="env-library-version">{localize(standard.version, locale)}</small>
    </> : <>
      <div className="env-table-scroll" role="region" aria-label={tr("referenceValue")} tabIndex={0}><table className="env-native-table env-criteria-table"><thead><tr><th scope="col">{tr("pollutant")}</th><th scope="col">{tr("period")}</th><th scope="col">{tr("referenceValue")}</th><th scope="col">{tr("notes")}</th><th scope="col"><span className="sr-only">{tr("source")}</span></th></tr></thead><tbody>{references.map((entry, i) => <tr key={i}><th scope="row">{entry.symbol}</th><td>{localize(entry.period, locale)}</td><td>{localize(entry.value, locale)}</td><td>{localize(entry.note, locale)}</td><td><a href={entry.source} target="_blank" rel="noopener noreferrer" className="env-source" aria-label={`${tr("source")} · ${entry.symbol} · ${localize(entry.period, locale)}`}>↗</a></td></tr>)}</tbody></table></div>
      <p className="env-library-note">{tr("libraryReferenceNote")}</p>
    </>}
  </section>
}
