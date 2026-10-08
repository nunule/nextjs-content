"use client"

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react"
import { useLocale } from "@/components/locale-provider"
import type { MessageKey } from "@/lib/i18n/messages"
import { Disclosure } from "@/components/disclosure"
import { PLAYER_LOAD_TIMEOUT_MS, SPEED_OPTIONS, TIMER_MINUTES, TIMER_PRESETS } from "@/components/audio.constants"
import { formatAudioDate } from "@/lib/audio-date"
import type { AudioGroup, AudioTrack } from "@/lib/media-source"

type RepeatMode = "off" | "list" | "one"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00"
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

function formatCountdown(seconds: number) {
  const total = Math.max(0, Math.ceil(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

export function AudioPlayer({ groups }: { groups: AudioGroup[] }) {
  const { t } = useLocale()
  const tracks = useMemo(() => groups.flatMap((group) => group.tracks), [groups])
  const [currentId, setCurrentId] = useState(tracks[0]?.id ?? "")
  const [playing, setPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [autoNext, setAutoNext] = useState(true)
  const [repeat, setRepeat] = useState<RepeatMode>("off")
  const [deadline, setDeadline] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [timerOpen, setTimerOpen] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(String(TIMER_MINUTES.DEFAULT))
  const [timerMessage, setTimerMessage] = useState<MessageKey | "">("")
  const [error, setError] = useState<MessageKey | "">("")
  const [controlsOpen, setControlsOpen] = useState(false)
  const [hasSelectedTrack, setHasSelectedTrack] = useState(false)
  const controlsId = useId()
  const controlsToggleRef = useRef<HTMLButtonElement>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const playRequest = useRef(0)

  const currentIndex = Math.max(0, tracks.findIndex((track) => track.id === currentId))
  const current = tracks[currentIndex] ?? tracks[0]
  const initialPath = useRef(current?.playbackPath ?? "")

  // 初始化音轨路径
  useEffect(() => {
    if (audioRef.current && initialPath.current) {
      audioRef.current.src = initialPath.current
    }
  }, [])

  useEffect(() => {
    if (!isLoading) return
    const timeout = window.setTimeout(() => {
      playRequest.current += 1
      audioRef.current?.pause()
      setPlaying(false)
      setIsLoading(false)
      setError("audio.loadSlow")
    }, PLAYER_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [isLoading, currentId])

  // 倒计时计时器
  useEffect(() => {
    if (deadline === null) return
    function tick() {
      const seconds = Math.max(0, (deadline! - Date.now()) / 1000)
      setRemaining(seconds)
      if (seconds === 0) {
        playRequest.current += 1
        audioRef.current?.pause()
        setIsLoading(false)
        setPlaying(false)
        setDeadline(null)
        setTimerMessage("audio.timerStopped")
      }
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [deadline])

  const togglePlayRef = useRef(togglePlay)
  togglePlayRef.current = togglePlay
  const playTrackRef = useRef(playTrack)
  playTrackRef.current = playTrack

  // 同步锁屏与系统媒体中心（MediaSession API，现代浏览器标配）
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !current) return
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: t("site.name"),
        album: t("audio.album", { date: current.date }),
      })
      navigator.mediaSession.setActionHandler("play", () => {
        void togglePlayRef.current()
      })
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause()
      })
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (currentIndex > 0) void playTrackRef.current(tracks[currentIndex - 1])
      })
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (currentIndex + 1 < tracks.length) void playTrackRef.current(tracks[currentIndex + 1])
      })
    } catch {
      // 忽略不支持的环境
    }
  }, [current, currentIndex, tracks, t])

  async function playTrack(track: AudioTrack) {
    const audio = audioRef.current
    if (!audio || !track) return
    const request = ++playRequest.current
    setError("")
    setTimerMessage("")
    setCurrentId(track.id)
    setHasSelectedTrack(true)
    setCurrentTime(0)
    setDuration(0)
    setSeekValue(0)
    setIsSeeking(false)
    setHasStarted(false)
    setHasEnded(false)
    setPlaying(false)
    setIsLoading(true)
    audio.pause()
    audio.src = `${track.playbackPath}?play=${Date.now()}`
    audio.playbackRate = speed
    audio.load()
    try {
      await audio.play()
      if (request !== playRequest.current) return
    } catch (reason) {
      if (request !== playRequest.current) return
      if (reason instanceof DOMException && reason.name === "AbortError") return
      setError("audio.startFailed")
    } finally {
      if (request === playRequest.current) {
        setIsLoading(false)
      }
    }
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing || isLoading) {
      playRequest.current += 1
      audio.pause()
      setIsLoading(false)
      setPlaying(false)
    } else {
      if (deadline !== null && Date.now() >= deadline) {
        setDeadline(null)
        setTimerMessage("audio.timerStopped")
        return
      }
      setError("")
      // 若音频当前未加载成功或处于出错状态，直接重新获取最新签名播放
      if (audio.error || !audio.src || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || audio.readyState === 0) {
        void playTrack(current)
        return
      }
      setIsLoading(true)
      const request = ++playRequest.current
      try {
        await audio.play()
      } catch (reason) {
        if (request !== playRequest.current) return
        if (reason instanceof DOMException && reason.name === "AbortError") return
        // 播放失败可能因为 URL 过期或网络变动，自动刷新直链并重新播放
        try {
          await playTrack(current)
        } catch {
          setError("audio.playFailed")
        }
      } finally {
        if (request === playRequest.current) setIsLoading(false)
      }
    }
  }

  function seekRelative(deltaSeconds: number) {
    const audio = audioRef.current
    if (!audio) return
    const target = Math.max(0, Math.min(duration || 0, audio.currentTime + deltaSeconds))
    audio.currentTime = target
    setCurrentTime(target)
  }

  function handleSliderChange(val: number) {
    if (isSeeking) setSeekValue(val)
    else handleSliderCommit(val)
  }

  function handleSliderCommit(val: number) {
    setIsSeeking(false)
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = val
      setCurrentTime(val)
    }
  }

  function handleVolumeChange(val: number) {
    setVolume(val)
    if (audioRef.current) {
      audioRef.current.volume = val
      if (val === 0) {
        setMuted(true)
        audioRef.current.muted = true
      } else if (muted) {
        setMuted(false)
        audioRef.current.muted = false
      }
    }
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    audio.muted = next
  }

  function cycleSpeed() {
    const nextIndex = (SPEED_OPTIONS.indexOf(speed) + 1) % SPEED_OPTIONS.length
    const nextSpeed = SPEED_OPTIONS[nextIndex]
    setSpeed(nextSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  function cycleRepeat() {
    if (repeat === "off") {
      setRepeat("list")
      setAutoNext(true)
    } else if (repeat === "list") {
      setRepeat("one")
    } else {
      setRepeat("off")
    }
  }

  function handleEnded() {
    setHasEnded(true)
    if (deadline !== null && Date.now() >= deadline) {
      setDeadline(null)
      setRemaining(0)
      setTimerMessage("audio.timerPaused")
      return
    }
    if (repeat === "one") {
      void playTrack(current)
    } else if (autoNext && currentIndex + 1 < tracks.length) {
      void playTrack(tracks[currentIndex + 1])
    } else if (repeat === "list" && autoNext) {
      void playTrack(tracks[0])
    }
  }

  function setTimerByMinutes(mins: number) {
    if (!Number.isFinite(mins) || mins < TIMER_MINUTES.MIN || mins > TIMER_MINUTES.MAX) {
      setTimerMessage("audio.timerInvalid")
      return
    }
    setRemaining(mins * 60)
    setDeadline(Date.now() + mins * 60 * 1000)
    setTimerMessage("")
    setTimerOpen(false)
  }

  function cancelTimer() {
    setDeadline(null)
    setRemaining(0)
    setTimerMessage("audio.timerCancelled")
  }

  const progressPercent = duration > 0 ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0
  const activeTimeDisplay = isSeeking ? seekValue : currentTime
  const activelyPlaying = playing && !isLoading && !error
  const status = t(error ? "audio.statusFailed" : isLoading ? (playing ? "audio.statusBuffering" : "audio.statusLoading") : playing ? "audio.statusPlaying" : hasEnded ? "audio.statusEnded" : hasStarted ? "audio.statusPaused" : "audio.statusReady")

  function renderTracks(group: AudioGroup) {
    return (
      <ol className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {group.tracks.map((track) => {
          const isCurrent = hasSelectedTrack && track.id === current.id
          const title = track.title.replace(/_+/g, " · ")
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => {
                  if (isCurrent) void togglePlay()
                  else void playTrack(track)
                }}
                aria-label={`${t(isCurrent && playing ? "audio.pause" : "audio.play")} ${title}`}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex w-full items-center gap-3 px-4 py-5 text-left transition-colors sm:px-5 ${
                  isCurrent
                    ? "bg-slate-100/80 text-slate-950 dark:bg-slate-800/70 dark:text-white"
                    : "text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40"
                }`}
              >
                <span className="w-6 shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                  {String(track.order).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 break-words text-[15px] font-medium leading-6">
                  {title}
                </span>
                {isCurrent && (
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                    {status}
                  </span>
                )}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300" aria-hidden="true">
                  {isCurrent && isLoading ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 animate-spin"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="42 15" /></svg>
                  ) : isCurrent && activelyPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3.5 w-3.5"><path d="m8 5 11 7-11 7V5Z" /></svg>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className={hasSelectedTrack ? "pb-44" : ""}>
      <audio
        ref={audioRef}
        hidden
        preload="none"
        onPlay={() => {
          if (deadline !== null && Date.now() >= deadline) {
            audioRef.current?.pause()
            setIsLoading(false)
            setPlaying(false)
            setDeadline(null)
            setTimerMessage("audio.timerStopped")
            return
          }
          setPlaying(true)
          setHasStarted(true)
          setHasEnded(false)
          setError("")
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => { if (!audioRef.current?.paused) setIsLoading(true) }}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsLoading(false)
          setPlaying(true)
        }}
        onTimeUpdate={() => {
          if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0)
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0)
          }
        }}
        onEnded={() => {
          setPlaying(false)
          setIsLoading(false)
          handleEnded()
        }}
        onError={() => {
          setPlaying(false)
          setIsLoading(false)
          setError("audio.loadFailed")
        }}
      />

      <section aria-label={t("audio.catalog")} className="space-y-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("audio.latestTitle")}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("audio.total", { count: tracks.length })}</span>
        </div>
        <article className="site-surface overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/60">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <h3 className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">{formatAudioDate(groups[0].date)}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t("audio.latest")}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("audio.count", { count: groups[0].tracks.length })}</span>
          </header>
          {renderTracks(groups[0])}
        </article>
        {groups.length > 1 && (
          <div className="space-y-3">
            <h2 className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t("audio.archive")}</h2>
            {groups.slice(1).map((group) => (
              <Disclosure
                key={group.date}
                className="site-surface overflow-hidden rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800/70 dark:bg-slate-900/40"
                buttonClassName="px-4 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:px-5 dark:text-slate-300 dark:hover:bg-slate-800/40"
                title={<span className="flex items-center justify-between gap-3"><span className="font-mono">{formatAudioDate(group.date)}</span><span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t("audio.count", { count: group.tracks.length })}</span></span>}
              >
                <div className="border-t border-slate-100 dark:border-slate-800/60">{renderTracks(group)}</div>
              </Disclosure>
            ))}
          </div>
        )}
      </section>

      {hasSelectedTrack && (
        <div className="audio-player-dock fixed inset-x-0 z-40 px-3 sm:px-6">
          <section
            aria-label={t("audio.controls")}
            onKeyDown={(event) => {
              if (event.key === "Escape" && controlsOpen) {
                setControlsOpen(false)
                controlsToggleRef.current?.focus()
              }
            }}
            className="site-surface mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-700/80 dark:bg-slate-900"
          >
            <div className="px-3 py-3 sm:px-4">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" title={current.title.replace(/_+/g, " · ")}>{current.title.replace(/_+/g, " · ")}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                    <span role="status" aria-live="polite">{status}</span>
                    <span>{formatAudioDate(current.date)} · {t("audio.track", { number: current.order })}</span>
                    {deadline !== null && <span>{t("audio.remaining", { time: formatCountdown(remaining) })}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  aria-label={t(isLoading ? "audio.cancelLoading" : playing ? "audio.pause" : "audio.play")}
                  title={t(isLoading ? "audio.cancelLoading" : playing ? "audio.pause" : "audio.play")}
                >
                  {isLoading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : playing ? (
                    <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm10.5 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>


                <button
                  ref={controlsToggleRef}
                  type="button"
                  aria-label={t(controlsOpen ? "audio.collapseSettings" : "audio.expandSettings")}
                  aria-expanded={controlsOpen}
                  aria-controls={controlsId}
                  onClick={() => setControlsOpen(!controlsOpen)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><path d="M4 7h6m4 0h6M4 17h10m4 0h2" /><circle cx="12" cy="7" r="2" /><circle cx="16" cy="17" r="2" /></svg>
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration > 0 ? duration : 100}
                    step={0.1}
                    value={activeTimeDisplay}
                    disabled={duration === 0}
                    aria-label={t("audio.progress")}
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={activeTimeDisplay}
                    aria-valuetext={`${formatTime(activeTimeDisplay)} / ${formatTime(duration)}`}
                    onPointerDown={() => { setSeekValue(currentTime); setIsSeeking(true) }}
                    onChange={(e) => handleSliderChange(Number(e.target.value))}
                    onPointerUp={(e) => handleSliderCommit(Number(e.currentTarget.value))}
                    onPointerCancel={() => setIsSeeking(false)}
                    onBlur={(e) => { if (isSeeking) handleSliderCommit(Number(e.currentTarget.value)) }}
                    className="player-range w-full text-slate-900 dark:text-slate-100"
                    style={{ "--slider-progress": `${progressPercent}%` } as CSSProperties}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{formatTime(activeTimeDisplay)}</span>
                  <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
                </div>
              </div>


              {timerMessage && <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t(timerMessage, { min: TIMER_MINUTES.MIN, max: TIMER_MINUTES.MAX })}</p>}
              {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{t(error)}</p>}
            </div>
            <div
              id={controlsId}
              hidden={!controlsOpen}
              aria-hidden={!controlsOpen}
              {...(!controlsOpen ? { inert: "" } : {})}
              className="audio-player-options order-first max-h-[min(55dvh,24rem)] overflow-y-auto border-b border-slate-200 px-4 pb-4 dark:border-slate-800"
            >
              <h3 className="pt-4 text-sm font-medium text-slate-800 dark:text-slate-200">{t("audio.settings")}</h3>
              <div className="mt-3 flex items-center justify-center gap-2 sm:gap-5">
                {/* 上一曲 */}
                <button
                  type="button"
                  onClick={() => void playTrack(tracks[currentIndex - 1])}
                  disabled={currentIndex === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={t("audio.previous")}
                  title={t("audio.previous")}
                >
                  <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* 快退 10 秒 */}
                <button
                  type="button"
                  onClick={() => seekRelative(-10)}
                  disabled={duration === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={t("audio.rewind")}
                  title={t("audio.rewind")}
                >
                  <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <text x="12" y="15" fontSize="7" fill="currentColor" textAnchor="middle" stroke="none" fontWeight="bold">10</text>
                  </svg>
                </button>

                {/* 快进 10 秒 */}
                <button
                  type="button"
                  onClick={() => seekRelative(10)}
                  disabled={duration === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={t("audio.forward")}
                  title={t("audio.forward")}
                >
                  <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <text x="12" y="15" fontSize="7" fill="currentColor" textAnchor="middle" stroke="none" fontWeight="bold">10</text>
                  </svg>
                </button>

                {/* 下一曲 */}
                <button
                  type="button"
                  onClick={() => void playTrack(tracks[currentIndex + 1])}
                  disabled={currentIndex === tracks.length - 1}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={t("audio.next")}
                  title={t("audio.next")}
                >
                  <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* 底部次级功能栏：循环方式、自动连播、倍速、定时、音量 */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 循环模式切换按键 */}
                  <button
                    type="button"
                    onClick={cycleRepeat}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition ${
                      repeat !== "off"
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                        : "border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                    title={t("audio.repeatToggle")}
                    aria-label={t("audio.repeatToggle")}
                  >
                    {repeat === "one" ? (
                      <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                      </svg>
                    )}
                    <span>
                      {t(repeat === "off" ? "audio.sequential" : repeat === "list" ? "audio.repeatList" : "audio.repeatOne")}
                    </span>
                  </button>

                  {/* 自动连播开关 */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoNext
                      setAutoNext(next)
                      if (!next && repeat === "list") setRepeat("off")
                    }}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition ${
                      autoNext
                        ? "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        : "border-slate-200 text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                    aria-label={t("audio.autoNextToggle")}
                    aria-pressed={autoNext}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        autoNext ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />
                    <span>{t("audio.autoNext")}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 倍速切换 */}
                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="flex items-center rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                    title={t("audio.speedToggle")}
                    aria-label={t("audio.speed", { speed })}
                  >
                    {speed}x
                  </button>

                  {/* 定时停止面板切换 */}
                  <button
                    type="button"
                    onClick={() => setTimerOpen(!timerOpen)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition ${
                      deadline !== null
                        ? "border-amber-500/80 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200"
                        : "border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                    aria-label={t("audio.timerSettings")}
                    aria-expanded={timerOpen}
                    aria-controls="sleep-timer-panel"
                  >
                    <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      {deadline !== null ? t("audio.remaining", { time: formatCountdown(remaining) }) : t("audio.timer")}
                    </span>
                  </button>

                  {/* 音量控制 */}
                  <div className="flex items-center gap-1.5 pl-1">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                      aria-label={t(muted || volume === 0 ? "audio.unmute" : "audio.mute")}
                    >
                      {muted || volume === 0 ? (
                        <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <line x1="1" y1="1" x2="23" y2="23" />
                          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label={t("audio.volume")}
                      className="volume-range w-14 text-slate-800 dark:text-slate-200"
                      style={{ "--volume-progress": `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* 现代睡眠定时选择面板 (收合式) */}
              <div id="sleep-timer-panel" className="disclosure-content" data-open={timerOpen} aria-hidden={!timerOpen} {...(!timerOpen ? { inert: "" } : {})}>
                <div className="min-h-0 overflow-hidden">
                  <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span>{t("audio.sleepTimer")}</span>
                      {deadline !== null && (
                        <button
                          type="button"
                          onClick={cancelTimer}
                          className="text-red-500 hover:underline dark:text-red-400"
                        >
                          {t("audio.cancelTimer")}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {TIMER_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setTimerByMinutes(mins)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          {t("audio.minutes", { count: mins })}
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <input
                          type="number"
                          min={TIMER_MINUTES.MIN}
                          max={TIMER_MINUTES.MAX}
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(e.target.value)}
                          className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-mono dark:border-slate-700 dark:bg-slate-900"
                          placeholder={t("audio.minuteShort")}
                          aria-label={t("audio.customMinutes")}
                        />
                        <span>{t("audio.minuteShort")}</span>
                        <button
                          type="button"
                          onClick={() => setTimerByMinutes(Number(customMinutes))}
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                        >
                          {t("common.confirm")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </section>
        </div>
      )}
    </div>
  )
}
