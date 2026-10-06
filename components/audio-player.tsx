"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { AudioGroup, AudioTrack } from "@/lib/media-source"

type RepeatMode = "off" | "list" | "one"

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0, 0.75]
const TIMER_PRESETS = [15, 30, 45, 60]

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
  const tracks = groups.flatMap((group) => group.tracks)
  const [currentId, setCurrentId] = useState(tracks[0]?.id ?? "")
  const [playing, setPlaying] = useState(false)
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
  const [customMinutes, setCustomMinutes] = useState("30")
  const [timerMessage, setTimerMessage] = useState("")
  const [error, setError] = useState("")

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

  // 倒计时计时器
  useEffect(() => {
    if (deadline === null) return
    function tick() {
      const seconds = Math.max(0, (deadline! - Date.now()) / 1000)
      setRemaining(seconds)
      if (seconds === 0) {
        playRequest.current += 1
        audioRef.current?.pause()
        setDeadline(null)
        setTimerMessage("定时已到，音频已停止播放。")
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
        artist: "雪落山庄",
        album: `声音记录 · ${current.date}`,
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
  }, [current, currentIndex, tracks])

  async function playTrack(track: AudioTrack) {
    const audio = audioRef.current
    if (!audio) return
    const request = ++playRequest.current
    setError("")
    setTimerMessage("")
    setCurrentId(track.id)
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
      setError("未能开始播放，请点击播放按钮重试。")
    } finally {
      if (request === playRequest.current) {
        setIsLoading(false)
      }
    }
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      if (deadline !== null && Date.now() >= deadline) {
        setDeadline(null)
        setTimerMessage("定时已到，音频已停止播放。")
        return
      }
      setError("")
      // 若音频当前未加载成功或处于出错状态，直接重新获取最新签名播放
      if (audio.error || !audio.src || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || audio.readyState === 0) {
        void playTrack(current)
        return
      }
      setIsLoading(true)
      try {
        await audio.play()
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return
        // 播放失败可能因为 URL 过期或网络变动，自动刷新直链并重新播放
        try {
          await playTrack(current)
        } catch {
          setError("无法播放音频，请点击播放按钮重试。")
        }
      } finally {
        setIsLoading(false)
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
    setSeekValue(val)
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
    if (deadline !== null && Date.now() >= deadline) {
      setDeadline(null)
      setRemaining(0)
      setTimerMessage("定时已结束，播放已暂停。")
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
    if (!Number.isFinite(mins) || mins < 1 || mins > 360) {
      setTimerMessage("请输入有效分钟数（1–360）。")
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
    setTimerMessage("已取消定时暂停。")
  }

  const progressPercent = duration > 0 ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0
  const activeTimeDisplay = isSeeking ? seekValue : currentTime

  return (
    <div className="space-y-7">
      {/* 隐藏原生音频标签，使用完全自定义现代交互播放器 */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => {
          if (deadline !== null && Date.now() >= deadline) {
            audioRef.current?.pause()
            setDeadline(null)
            setTimerMessage("定时已到，音频已停止播放。")
            return
          }
          setPlaying(true)
          setIsLoading(false)
          setError("")
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setIsLoading(true)}
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
            setDuration(audioRef.current.duration || 0)
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0)
          }
        }}
        onEnded={() => {
          setPlaying(false)
          handleEnded()
        }}
        onError={() => {
          setPlaying(false)
          setIsLoading(false)
          setError("音频加载失败，请重新点击音轨尝试。")
        }}
      />

      {/* 现代流行的播放器主卡片：微质感磨砂玻璃、典雅边框、层次分明 */}
      <section
        aria-label="正在播放"
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all sm:p-6 dark:border-slate-800/90 dark:bg-slate-900/80 dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      >
        {/* 卡片顶部：黑白意境唱片封面 + 曲目信息 + 播放状态 */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* 纯净雪落唱片徽章 / 动态声波 */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-slate-50 text-slate-800 shadow-inner dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
            {/* 黑胶唱片同心圆微纹理 */}
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.04)_70%)] dark:bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.04)_70%)]" />

            {playing ? (
              <div className="relative z-10 flex h-6 items-end gap-1 text-slate-900 dark:text-white" aria-hidden="true">
                <span className="w-1 rounded-full bg-current animate-eq-1" />
                <span className="w-1 rounded-full bg-current animate-eq-2" />
                <span className="w-1 rounded-full bg-current animate-eq-3" />
                <span className="w-1 rounded-full bg-current animate-eq-4" />
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2005/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="relative z-10 h-7 w-7 text-slate-400 dark:text-slate-500"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>

          {/* 标题与日期 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {current.date}
              </span>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                #{String(current.order).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-1.5 truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-slate-50">
              {current.title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
              {current.fileName}
            </p>
          </div>

          {/* 状态胶囊 */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                playing
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  playing
                    ? "bg-emerald-400 animate-pulse dark:bg-emerald-600"
                    : "bg-slate-400 dark:bg-slate-500"
                }`}
              />
              {playing ? "播放中" : "就绪"}
            </span>
          </div>
        </div>

        {/* 现代进度条 (零依赖纯CSS定制，支持平滑滑动与点击跳播) */}
        <div className="mt-6 space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.1}
              value={activeTimeDisplay}
              disabled={duration === 0}
              aria-label="播放进度"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={activeTimeDisplay}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              onMouseUp={(e) => handleSliderCommit(Number(e.currentTarget.value))}
              onTouchEnd={(e) => handleSliderCommit(Number(e.currentTarget.value))}
              className="player-range w-full text-slate-900 dark:text-slate-100"
              style={{ "--slider-progress": `${progressPercent}%` } as CSSProperties}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-slate-400 dark:text-slate-500">
            <span>{formatTime(activeTimeDisplay)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {/* 核心控制区域：上一首、快退10秒、主播放按钮、快进10秒、下一首 */}
        <div className="mt-3 flex items-center justify-center gap-3 sm:gap-5">
          {/* 上一曲 */}
          <button
            type="button"
            onClick={() => void playTrack(tracks[currentIndex - 1])}
            disabled={currentIndex === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="上一段音频"
            title="上一段音频"
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="快退 10 秒"
            title="快退 10 秒"
          >
            <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <text x="12" y="15" fontSize="7" fill="currentColor" textAnchor="middle" stroke="none" fontWeight="bold">10</text>
            </svg>
          </button>

          {/* 流行播放器核心：醒目大圆主按键 */}
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-950 dark:shadow-white/10"
            aria-label={playing ? "暂停" : "播放"}
            title={playing ? "暂停" : "播放"}
          >
            {isLoading ? (
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : playing ? (
              <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Zm10.5 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0v-12a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* 快进 10 秒 */}
          <button
            type="button"
            onClick={() => seekRelative(10)}
            disabled={duration === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="快进 10 秒"
            title="快进 10 秒"
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="下一段音频"
            title="下一段音频"
          >
            <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* 底部次级功能栏：循环方式、自动连播、倍速、定时、音量 */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {/* 循环模式切换按键 */}
            <button
              type="button"
              onClick={cycleRepeat}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition ${
                repeat !== "off"
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
              }`}
              title="切换循环模式"
              aria-label="切换循环模式"
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
                {repeat === "off" ? "顺序" : repeat === "list" ? "列表循环" : "单曲循环"}
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
              aria-label="自动播放下一首开关"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  autoNext ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
              <span>自动连播</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 倍速切换 */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="flex items-center rounded-lg border border-slate-200 px-2 py-1 font-mono text-xs hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
              title="切换播放速度"
              aria-label={`当前速度 ${speed}x，点击切换`}
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
              aria-label="睡眠定时设置"
            >
              <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                {deadline !== null ? `剩余 ${formatCountdown(remaining)}` : "定时"}
              </span>
            </button>

            {/* 音量控制 */}
            <div className="hidden sm:flex items-center gap-1.5 pl-1">
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                aria-label={muted || volume === 0 ? "取消静音" : "静音"}
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
                aria-label="音量大小"
                className="volume-range w-14 text-slate-800 dark:text-slate-200"
                style={{ "--volume-progress": `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* 现代睡眠定时选择面板 (收合式) */}
        {timerOpen && (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>睡眠定时（到时自动停止播放）</span>
              {deadline !== null && (
                <button
                  type="button"
                  onClick={cancelTimer}
                  className="text-red-500 hover:underline dark:text-red-400"
                >
                  取消定时
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
                  {mins} 分钟
                </button>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-mono dark:border-slate-700 dark:bg-slate-900"
                  placeholder="分"
                  aria-label="自定义定时分钟"
                />
                <span>分</span>
                <button
                  type="button"
                  onClick={() => setTimerByMinutes(Number(customMinutes))}
                  className="rounded-lg bg-slate-900 px-2.5 py-1 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {timerMessage && (
          <p role="status" className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            {timerMessage}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </section>

      {/* 音频目录列表：分类分组，清爽现代列表 */}
      <section aria-label="音频目录" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">
            音频目录
          </h2>
          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
            共 {tracks.length} 段音频
          </span>
        </div>

        <div className="space-y-3">
          {groups.map((group, index) => (
            <details
              key={group.date}
              open={index === 0}
              className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 transition-all dark:border-slate-800/80 dark:bg-slate-900/60"
            >
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2005/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-slate-400"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{group.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-normal text-slate-400">
                    {group.tracks.length} 段
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2005/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </summary>

              <ol className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
                {group.tracks.map((track) => {
                  const isCurrent = track.id === current.id
                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        onClick={() => void playTrack(track)}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`group/row flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                          isCurrent
                            ? "bg-slate-100/90 font-medium text-slate-900 dark:bg-slate-800/90 dark:text-white"
                            : "text-slate-700 hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* 序号或实时等宽均衡器动画 */}
                        <div className="flex h-5 w-6 shrink-0 items-center justify-center font-mono text-xs text-slate-400">
                          {isCurrent && playing ? (
                            <div className="flex h-3 items-end gap-0.5 text-slate-900 dark:text-white" aria-hidden="true">
                              <span className="w-0.5 rounded-full bg-current animate-eq-1" />
                              <span className="w-0.5 rounded-full bg-current animate-eq-2" />
                              <span className="w-0.5 rounded-full bg-current animate-eq-3" />
                            </div>
                          ) : (
                            <span>{String(track.order).padStart(2, "0")}</span>
                          )}
                        </div>

                        {/* 标题与文件名 */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{track.title}</p>
                          <p className="truncate text-xs font-normal text-slate-400 dark:text-slate-500">
                            {track.fileName}
                          </p>
                        </div>

                        {/* 悬停与选中状态标志 */}
                        <div className="shrink-0 text-xs">
                          {isCurrent ? (
                            <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {playing ? "播放中" : "已选择"}
                            </span>
                          ) : (
                            <span className="opacity-0 transition-opacity group-hover/row:opacity-100 text-slate-400">
                              <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
