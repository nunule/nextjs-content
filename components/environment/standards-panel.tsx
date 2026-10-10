"use client"

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { useLocale } from "@/components/locale-provider"
import { compatibleScales, concentrationSegments, evaluateConcentration, thresholdLabels } from "@/lib/environment/calculations"
import { CHART_ANNOUNCEMENT_DELAY, CHART_INTERVALS, CONCENTRATION_STEPS, DEFAULT_CHART_WIDTH, DEFAULT_COMPARISON_CONCENTRATION, DEFAULT_POLLUTANT, THRESHOLD_LABEL_LINE_HEIGHT } from "@/lib/environment/constants"
import { CONCENTRATION_SCALES, getPollutant, getStandard, gradeRangeLabel, localize, POLLUTANTS, STANDARDS, type ConcentrationScale, type Period, type PollutantId, type StandardId } from "@/lib/environment/data"
import { environmentEn, environmentZh, type EnvironmentMessageKey } from "@/lib/environment/messages"
import { STANDARD_OVERVIEW } from "@/lib/environment/standards-overview"

function useStandardsText() {
  const { locale } = useLocale()
  const messages = locale === "en" ? environmentEn : environmentZh
  return { locale, tr: (key: EnvironmentMessageKey) => messages[key] }
}

function OfficialSource({ href }: { href: string }) {
  const { tr } = useStandardsText()
  return <a className="env-source" href={href} target="_blank" rel="noopener noreferrer">{tr("source")} ↗</a>
}

export function StandardsPanel({ pollutantId, onPollutantChange }: { pollutantId: PollutantId; onPollutantChange: (id: PollutantId) => void }) {
  const { tr } = useStandardsText()
  return <div className="env-standards-panel">
    <ConcentrationComparison pollutantId={pollutantId} onPollutantChange={onPollutantChange} />
    <StandardsOverview />
    <details className="env-reading-details">
      <summary>{tr("methodologyTitle")}</summary>
      <dl>{(["concentration", "index", "time"] as const).map((key) => <div key={key}><dt>{tr(`${key}Definition`)}</dt><dd>{tr(`${key}Meaning`)}</dd></div>)}</dl>
      <p>{tr("comparisonNote")}</p><p>{tr("clipping")}</p>
    </details>
  </div>
}

function ConcentrationComparison({ pollutantId, onPollutantChange }: { pollutantId: PollutantId; onPollutantChange: (id: PollutantId) => void }) {
  const { locale, tr } = useStandardsText()
  const pollutant = getPollutant(pollutantId)
  const [period, setPeriod] = useState<Period>("h24")
  const activePeriod = pollutant.periods.includes(period) ? period : pollutant.periods[0]
  const [concentrations, setConcentrations] = useState<Partial<Record<PollutantId, number>>>({})
  const [draft, setDraft] = useState<Partial<Record<PollutantId, string>>>({})
  const value = concentrations[pollutantId] ?? (pollutantId === DEFAULT_POLLUTANT ? DEFAULT_COMPARISON_CONCENTRATION : pollutant.initial)
  const step = CONCENTRATION_STEPS[pollutantId]
  const [selections, setSelections] = useState<Record<string, StandardId[]>>({})
  const available = compatibleScales(pollutantId, activePeriod)
  const selectionKey = `${pollutantId}:${activePeriod}`
  const selected = selections[selectionKey] ?? available.map((scale) => scale.standard)
  const scales = available.filter((scale) => selected.includes(scale.standard))
  const unavailable = STANDARDS.filter((standard) => !available.some((scale) => scale.standard === standard.id))
  const [plotWidth, setPlotWidth] = useState(DEFAULT_CHART_WIDTH)
  const chartRef = useRef<HTMLDivElement>(null)
  const scaleKey = scales.map((scale) => scale.standard).join(":")
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    const plot = chartRef.current?.querySelector(".env-scale-band")
    if (!plot) return
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setPlotWidth(entry.contentRect.width) })
    observer.observe(plot)
    return () => observer.disconnect()
  }, [scaleKey])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnnouncement(`${pollutant.symbol}, ${value} ${pollutant.unit}, ${tr(activePeriod)}. ${scales.map((scale) => {
        const standard = getStandard(scale.standard)
        const result = evaluateConcentration(scale, value)!
        return `${localize(standard.name, locale)}: ${localize(standard.grades[result.gradeIndex].name, locale)}${result.index === undefined ? "" : `, ${result.index}`}`
      }).join(". ")}`)
    }, CHART_ANNOUNCEMENT_DELAY)
    return () => window.clearTimeout(timer)
    // The selected key identifies the scales without rebuilding an effect for every array render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, pollutantId, activePeriod, scaleKey, locale])

  function changeValue(raw: string) {
    if (raw.trim() === "") { setDraft((current) => ({ ...current, [pollutantId]: "" })); return }
    const next = Number(raw)
    if (!Number.isFinite(next)) return
    const clamped = Number((Math.round(Math.min(pollutant.max, Math.max(0, next)) / step) * step).toFixed(1))
    setConcentrations((current) => ({ ...current, [pollutantId]: clamped }))
    setDraft((current) => ({ ...current, [pollutantId]: String(clamped) }))
  }
  function toggleStandard(id: StandardId) {
    if (selected.includes(id) && scales.length === 1) return
    setSelections((current) => ({ ...current, [selectionKey]: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] }))
  }
  function selectPoint(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    if (bounds.width > 0) changeValue(String((event.clientX - bounds.left) / bounds.width * pollutant.max))
  }

  const markerStyle = { "--env-concentration-position": `${value / pollutant.max * 100}%` } as CSSProperties
  return <section className="env-scale-comparison" aria-labelledby="env-scale-heading">
    <div className="env-scale-controls">
      <label><span className="sr-only">{tr("pollutant")}</span><select aria-label={tr("pollutant")} value={pollutantId} onChange={(event) => onPollutantChange(event.target.value as PollutantId)}>{POLLUTANTS.map((item) => <option key={item.id} value={item.id}>{item.symbol} · {localize(item.name, locale)}</option>)}</select></label>
      <label><span className="sr-only">{tr("period")}</span><select aria-label={tr("period")} value={activePeriod} onChange={(event) => setPeriod(event.target.value as Period)}>{pollutant.periods.map((item) => <option key={item} value={item}>{tr(item)}</option>)}</select></label>
      <fieldset className="env-scale-picker"><legend className="sr-only">{tr("compareRegions")}</legend>{available.map((scale) => <button key={scale.standard} type="button" aria-pressed={selected.includes(scale.standard)} aria-disabled={selected.includes(scale.standard) && scales.length === 1} onClick={() => toggleStandard(scale.standard)}>{localize(getStandard(scale.standard).name, locale)}</button>)}</fieldset>
    </div>
    <div className="env-scale-heading"><h2 id="env-scale-heading">{tr("scaleTitle")}</h2><span className="env-demo-label">{tr("illustrative")}</span></div>
    <div className="env-scale-input-heading">
      <span>{tr("slideHint")}</span>
      <label htmlFor="env-concentration"><span className="sr-only">{tr("concentration")}</span><input id="env-concentration" type="number" min={0} max={pollutant.max} step={step} value={draft[pollutantId] ?? value} onChange={(event) => changeValue(event.target.value)} onBlur={() => setDraft((current) => ({ ...current, [pollutantId]: String(value) }))} /><span>{pollutant.unit}</span></label>
    </div>
    <figure className="env-scale-figure" style={markerStyle} aria-label={`${pollutant.symbol} · ${tr(activePeriod)}`}>
      <div className="env-scale-slider"><div className="env-slider-value" aria-hidden="true">{value}</div><input type="range" className="env-scale-range" min={0} max={pollutant.max} step={step} value={value} aria-label={tr("concentration")} aria-valuetext={`${value} ${pollutant.unit}, ${tr(activePeriod)}`} onChange={(event) => changeValue(event.target.value)} /></div>
      <div className="env-scale-chart" ref={chartRef}>
        <div className="env-scale-grid" aria-hidden="true">{Array.from({ length: CHART_INTERVALS + 1 }, (_, i) => <span key={i} style={{ left: `${i / CHART_INTERVALS * 100}%` }} />)}<span className="env-scale-guide" /></div>
        {scales.map((scale) => <ConcentrationRow key={scale.standard} scale={scale} value={value} max={pollutant.max} plotWidth={plotWidth} onValueChange={changeValue} onSelectPoint={selectPoint} />)}
      </div>
      <div className="env-scale-axis" aria-hidden="true">{Array.from({ length: CHART_INTERVALS + 1 }, (_, i) => <span key={i} style={{ left: `${i / CHART_INTERVALS * 100}%` }}>{Number((pollutant.max * i / CHART_INTERVALS).toFixed(1))}</span>)}<small>{pollutant.unit}</small></div>
      <figcaption><span>{tr("singlePollutant")}</span><span>{tr("scaleCaption")}</span></figcaption>
    </figure>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    {unavailable.length > 0 && <aside className="env-other-basis" aria-label={tr("differentBasis")}><span>{tr("differentBasis")}</span>{unavailable.map((standard) => {
      const alternative = CONCENTRATION_SCALES.find((scale) => scale.standard === standard.id && scale.pollutant === pollutantId)
      const reason = standard.id === "ca" ? tr("combinedRisk") : standard.id === "jp" ? tr("predictedDaily") : alternative ? `${tr("needsPeriod")} ${tr(alternative.period)}` : standard.id === "us" ? tr("nativeGasBasis") : tr("noSingleScale")
      return alternative ? <button type="button" key={standard.id} onClick={() => setPeriod(alternative.period)}><strong>{localize(standard.name, locale)}</strong><span>{reason} ↗</span></button> : <span key={standard.id} className="env-basis-description"><strong>{localize(standard.name, locale)}</strong><span>{reason}</span></span>
    })}</aside>}
    <details className="env-reading-details env-threshold-details"><summary>{tr("viewThresholds")}</summary><div className="env-table-scroll"><table><thead><tr><th>{tr("standard")}</th><th>{tr("range")} ({pollutant.unit})</th><th>{tr("grade")}</th><th>{tr("scientificSources")}</th></tr></thead><tbody>{scales.flatMap((scale) => {
      const standard = getStandard(scale.standard)
      return concentrationSegments(scale, Infinity).map((segment, i) => <tr key={`${scale.standard}-${i}`}><td>{localize(standard.name, locale)}</td><td>{formatRange(segment.from, segment.to, scale)}</td><td><span className="env-grade-dot" style={{ backgroundColor: standard.grades[segment.gradeIndex].color }} />{localize(standard.grades[segment.gradeIndex].name, locale)}</td><td><OfficialSource href={scale.source} /></td></tr>)
    })}</tbody></table></div><p>{tr("clipping")}</p></details>
  </section>
}

function formatRange(from: number, to: number, scale: ConcentrationScale) {
  const lower = scale.rounding === "epa" && from > 0 ? Number((from + CONCENTRATION_STEPS[scale.pollutant]).toFixed(1)) : from
  return `${from > 0 && scale.rounding !== "epa" ? ">" : ""}${lower} – ${Number.isFinite(to) ? to : "∞"}`
}

function ConcentrationRow({ scale, value, max, plotWidth, onValueChange, onSelectPoint }: { scale: ConcentrationScale; value: number; max: number; plotWidth: number; onValueChange: (raw: string) => void; onSelectPoint: (event: PointerEvent<HTMLDivElement>) => void }) {
  const { locale, tr } = useStandardsText()
  const standard = getStandard(scale.standard)
  const result = evaluateConcentration(scale, value)!
  const grade = standard.grades[result.gradeIndex]
  const segments = concentrationSegments(scale, max)
  const fullSegments = concentrationSegments(scale, Infinity)
  const active = fullSegments.find((segment) => segment.gradeIndex === result.gradeIndex)!
  const labels = thresholdLabels(scale, max, plotWidth)
  const labelLines = Math.max(1, ...labels.map((label) => label.line + 1))
  const unit = getPollutant(scale.pollutant).unit
  return <div className="env-scale-row" data-standard={scale.standard}>
    <div className="env-scale-country"><strong>{localize(standard.name, locale)}</strong><span><i className="env-grade-dot" style={{ backgroundColor: grade.color }} />{localize(grade.name, locale)}{result.index !== undefined && <b> · {scale.standard === "uk" ? "DAQI" : tr("subindex")} {result.index}</b>}</span></div>
    <div className="env-scale-plot">
      <div className="env-scale-band" onPointerDown={(event) => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); onSelectPoint(event) }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) onSelectPoint(event) }} onPointerUp={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}>
        {segments.map((segment, i) => <button key={i} type="button" className="env-scale-segment" aria-label={`${tr("selectConcentration")}: ${localize(standard.grades[segment.gradeIndex].name, locale)}, ${formatRange(segment.from, fullSegments[i]?.to ?? segment.to, scale)} ${unit}`} title={`${localize(standard.grades[segment.gradeIndex].name, locale)} · ${formatRange(segment.from, fullSegments[i]?.to ?? segment.to, scale)} ${unit}`} style={{ width: `${(segment.to - segment.from) / max * 100}%`, backgroundColor: standard.grades[segment.gradeIndex].color }} onClick={(event) => { if (event.detail === 0) onValueChange(String((segment.from + segment.to) / 2)) }} />)}
        <span className="env-scale-marker" aria-hidden="true" />
      </div>
      <div className="env-scale-boundaries" style={{ height: `${labelLines * THRESHOLD_LABEL_LINE_HEIGHT}px` }} aria-label={`${tr("thresholdUnit")}: ${unit}`}>{labels.map((label) => <button type="button" key={label.value} style={{ left: `${label.labelPosition}%`, top: `${label.line * THRESHOLD_LABEL_LINE_HEIGHT}px` }} onClick={() => onValueChange(String(label.value))} aria-label={`${localize(standard.name, locale)}: ${tr("boundary")} ${label.value} ${unit}`}><span>{label.value}</span></button>)}</div>
      <span className="sr-only">{tr("categoryRange")}: {formatRange(active.from, active.to, scale)} {unit}</span>
      {result.capped && <p className="env-small-note">{tr("sourceLimit")}</p>}
    </div>
  </div>
}

function StandardsOverview() {
  const { locale, tr } = useStandardsText()
  const [selected, setSelected] = useState<StandardId | null>(null)
  const [selectedGrade, setSelectedGrade] = useState(0)
  const standard = selected ? getStandard(selected) : null
  const grade = standard?.grades[selectedGrade]
  return <section className="env-systems" aria-labelledby="env-systems-heading">
    <div className="env-systems-heading"><h2 id="env-systems-heading">{tr("sevenSystems")}</h2><span>{tr("overviewHint")}</span></div>
    <div className="env-table-scroll env-systems-table" role="region" aria-label={tr("overviewCaption")} tabIndex={0}>
      <table><caption className="sr-only">{tr("overviewCaption")}</caption><colgroup>{[16, 29, 20, 17, 18].map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}</colgroup><thead><tr>{["standard", "coverage", "overallMethod", "output", "pm25Basis"].map((key) => <th scope="col" key={key}>{tr(key as EnvironmentMessageKey)}</th>)}</tr></thead><tbody>{STANDARDS.map((item) => {
        const overview = STANDARD_OVERVIEW[item.id]
        return <tr key={item.id} data-selected={selected === item.id}><th scope="row"><button type="button" onClick={() => { setSelected(selected === item.id ? null : item.id); setSelectedGrade(0) }} aria-expanded={selected === item.id} aria-controls="env-system-explanation" aria-label={`${localize(item.name, locale)} · ${tr("selectSystem")}`}><strong>{localize(item.name, locale)}</strong><span>{item.index}</span><i aria-hidden="true">{selected === item.id ? "−" : "+"}</i></button></th><td className="env-system-pollutants">{overview.pollutants.join(" · ")}</td><td>{localize(overview.method, locale)}</td><td>{localize(overview.output, locale)}</td><td>{localize(overview.pm25Period, locale)}</td></tr>
      })}</tbody></table>
    </div>
    <p className="env-table-hint">{tr("tableScroll")} ↔</p>
    <div id="env-system-explanation" hidden={!standard} className="env-system-explanation">
      {standard && grade && <>
        <div className="env-system-explanation-heading"><strong>{localize(standard.name, locale)} · {standard.index}</strong><OfficialSource href={standard.source} /><button type="button" onClick={() => setSelected(null)} aria-label={tr("closeDefinition")}>×</button></div>
        <p>{localize(standard.method, locale)} {localize(standard.scope, locale)}</p>
        {standard.id === "jp" ? <p>{tr("japanScope")}</p> : <div className="env-system-categories" role="group" aria-label={tr("categoryBoundaries")}>{standard.grades.map((item, i) => <button type="button" key={i} aria-pressed={i === selectedGrade} onClick={() => setSelectedGrade(i)}><span className="env-grade-dot" style={{ backgroundColor: item.color }} />{localize(item.name, locale)}<small>{gradeRangeLabel(item, locale)}</small></button>)}</div>}
        <small>{localize(standard.version, locale)}</small>
      </>}
    </div>
    <p className="env-systems-note">{tr("overviewExplanation")}</p>
  </section>
}
