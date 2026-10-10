"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { StandardsPanel } from "./standards-panel"
import { ExercisePanel } from "./exercise-panel"
import { useLocale } from "@/components/locale-provider"
import { DEFAULT_POLLUTANT, ENVIRONMENT_REVIEWED_AT, SOURCE_URLS } from "@/lib/environment/constants"
import { getPollutant, localize, POLLUTANTS, type PollutantId } from "@/lib/environment/data"
import { environmentEn, environmentZh, type EnvironmentMessageKey } from "@/lib/environment/messages"

type Tab = "standards" | "pollutants" | "exercise"
const TABS: Tab[] = ["standards", "pollutants", "exercise"]
function useEnvironmentText() {
  const { locale } = useLocale()
  const dictionary = locale === "en" ? environmentEn : environmentZh
  return { locale, tr: (key: EnvironmentMessageKey) => dictionary[key] }
}

function AirIcon() {
  return <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M8 24h34c12 0 12-16 2-16-5 0-7 3-7 6M8 33h43M8 42h25c11 0 11 15 1 15-4 0-7-3-7-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="54" cy="42" r="2" fill="currentColor"/></svg>
}

export function EnvironmentExplorer() {
  const { tr } = useEnvironmentText()
  const [tab, setTab] = useState<Tab>("standards")
  const [pollutant, setPollutant] = useState<PollutantId>(DEFAULT_POLLUTANT)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    const sync = () => { const hash = window.location.hash.slice(1); if (TABS.includes(hash as Tab)) setTab(hash as Tab) }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])
  function selectTab(next: Tab) {
    setTab(next)
    window.history.replaceState(window.history.state, "", `#${next}`)
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    let next: number | undefined
    if (event.key === "ArrowRight") next = (i + 1) % TABS.length
    if (event.key === "ArrowLeft") next = (i + TABS.length - 1) % TABS.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = TABS.length - 1
    if (next !== undefined) { event.preventDefault(); selectTab(TABS[next]); tabRefs.current[next]?.focus() }
  }
  function comparePollutant(id: PollutantId) { setPollutant(id); selectTab("standards"); tabRefs.current[0]?.focus() }

  return <div className="environment-page" data-active-tab={tab}>
    <header className="env-hero">
      <div className="env-eyebrow">{tr("eyebrow")}</div>
      <div className="env-hero-line"><h1>{tr("title")}</h1><div className="env-air-icon"><AirIcon /></div></div>
      <p>{tr("description")}</p>
      <div className="env-hero-meta"><span>07 <small>{tr("standards")}</small></span><span>06 <small>{tr("pollutants")}</small></span><span className="env-meta-date">{tr("reviewed")} {ENVIRONMENT_REVIEWED_AT}</span></div>
    </header>

    <div className="env-tabs" role="tablist" aria-label={tr("tabsLabel")}>
      {TABS.map((item, i) => <button key={item} ref={(node) => { tabRefs.current[i] = node }} id={`env-tab-${item}`} type="button" role="tab" aria-selected={tab === item} aria-controls={`env-panel-${item}`} tabIndex={tab === item ? 0 : -1} onKeyDown={(event) => onTabKey(event, i)} onClick={() => selectTab(item)}><span className="env-tab-number" aria-hidden="true">0{i + 1}</span>{tr(item)}</button>)}
    </div>

    <section id="env-panel-standards" role="tabpanel" aria-labelledby="env-tab-standards" hidden={tab !== "standards"} tabIndex={0}>
      <StandardsPanel pollutantId={pollutant} onPollutantChange={setPollutant} />
    </section>
    <section id="env-panel-pollutants" role="tabpanel" aria-labelledby="env-tab-pollutants" hidden={tab !== "pollutants"} tabIndex={0}>
      <PollutantsPanel onCompare={comparePollutant} />
    </section>
    <section id="env-panel-exercise" role="tabpanel" aria-labelledby="env-tab-exercise" hidden={tab !== "exercise"} tabIndex={0}>
      <ExercisePanel onStandards={() => { selectTab("standards"); tabRefs.current[0]?.focus() }} />
    </section>
    <footer className="env-reference-note"><span aria-hidden="true">ⓘ</span><p>{tr("referenceNote")}</p></footer>
  </div>
}

function PollutantsPanel({ onCompare }: { onCompare: (id: PollutantId) => void }) {
  const { locale, tr } = useEnvironmentText()
  const [selected, setSelected] = useState<PollutantId>(DEFAULT_POLLUTANT)
  const pollutant = getPollutant(selected)
  return <div className="env-panel-content env-pollutants-panel">
    <div className="env-section-intro"><h2>{tr("pollutantsTitle")}</h2><p>{tr("pollutantsDescription")}</p></div>
    <div className="env-pollutant-picker" role="group" aria-label={tr("pollutant")}>{POLLUTANTS.map((item) => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><strong>{item.symbol}</strong><span>{localize(item.name, locale)}</span></button>)}</div>
    <article className="env-card env-pollutant-detail" aria-labelledby="env-pollutant-title">
      <div className="env-pollutant-heading"><span className="env-pollutant-symbol">{pollutant.symbol}</span><h3 id="env-pollutant-title">{localize(pollutant.name, locale)}</h3><span className="env-pollutant-unit">{pollutant.unit}</span></div>
      <div className="env-pollutant-body">
        <PollutantIllustration id={selected} />
        <dl className="env-pollutant-facts">{(["what", "sources", "health", "activity", "measure"] as const).map((key, i) => <div key={key}><dt><span aria-hidden="true">0{i + 1}</span>{tr(key)}</dt><dd>{localize(pollutant[key], locale)}</dd></div>)}</dl>
      </div>
      <div className="env-pollutant-footer"><button className="env-primary-button" type="button" onClick={() => onCompare(selected)}>{tr("compareThis")} <span aria-hidden="true">↗</span></button><a className="env-source" href={SOURCE_URLS.who} target="_blank" rel="noopener noreferrer">{tr("sourceWho")} ↗</a></div>
    </article>
  </div>
}

function PollutantIllustration({ id }: { id: PollutantId }) {
  const { tr } = useEnvironmentText()
  const particle = id === "pm25" || id === "pm10"
  const ozone = id === "o3"
  return <figure className="env-illustration"><h4>{tr(particle ? "particleTitle" : ozone ? "ozoneTitle" : "gasTitle")}</h4>
    {particle ? <div className="env-particle-comparison" role="img" aria-label={tr("particleNote")}><div><div className="env-particle-dot env-particle-pm25" /><b>PM2.5</b><span>2.5 µm</span></div><div className="env-particle-ratio" aria-hidden="true">1 : 4<small>{tr("size")}</small></div><div><div className="env-particle-dot env-particle-pm10" /><b>PM10</b><span>10 µm</span></div></div>
      : <div className="env-process" role="img" aria-label={tr(ozone ? "ozoneNote" : "gasNote")}><div><span aria-hidden="true">{ozone ? "☀" : "↗"}</span><b>{tr(ozone ? "sunlight" : "combustion")}</b></div><i aria-hidden="true">{ozone ? "+" : "→"}</i><div><span className={ozone ? "env-process-formula" : undefined} aria-hidden="true">{ozone ? "NOₓ / VOC" : "≈"}</span><b>{tr(ozone ? "precursors" : "air")}</b></div><i aria-hidden="true">→</i><div><span aria-hidden="true">{ozone ? "O₃" : "↘"}</span><b>{tr(ozone ? "groundOzone" : "exposure")}</b></div></div>}
    <figcaption>{tr(particle ? "particleNote" : ozone ? "ozoneNote" : "gasNote")}</figcaption>
  </figure>
}

