export const ENVIRONMENT_REVIEWED_AT = "2026-10-09"
export const DEFAULT_POLLUTANT = "pm25" as const
export const DEFAULT_STANDARD = "cn" as const
export const DEFAULT_COMPARISON_CONCENTRATION = 141
export const CHART_INTERVALS = 6
export const CONCENTRATION_STEPS = { pm25: 0.1, pm10: 1, o3: 1, no2: 1, so2: 1, co: 0.1 } as const
export const THRESHOLD_LABEL_CHARACTER_WIDTH = 7
export const THRESHOLD_LABEL_GAP = 12
export const THRESHOLD_LABEL_LINE_HEIGHT = 21
export const DEFAULT_CHART_WIDTH = 640
export const CHART_ANNOUNCEMENT_DELAY = 250
export const JAPAN_PM25_ADVISORY = 70
export const DEFAULT_EXERCISE_CONCENTRATION = 32
export const DEFAULT_EXERCISE_STANDARD = "eu" as const
export const DEFAULT_EXERCISE_PERIOD = "h1" as const
export const EXERCISE_STANDARDS = ["eu", "us", "jp"] as const
export const EXERCISE_ACTIVITIES = ["walking", "jogging", "vigorous"] as const
export const EXERCISE_PERIODS = { eu: "h1", us: "h24", jp: "predictedDaily" } as const
export const EXERCISE_POLLUTANTS = { eu: ["pm25", "pm10", "o3", "no2", "so2"], us: ["pm25", "pm10"], jp: ["pm25"] } as const

export const GRADE_COLORS = ["#059669", "#ca8a04", "#ea580c", "#dc2626", "#9333ea", "#881337"] as const
export const FOUR_GRADE_COLORS = [GRADE_COLORS[0], GRADE_COLORS[1], GRADE_COLORS[3], GRADE_COLORS[5]]
export const GRADE_DARK_TEXT_COLORS: readonly string[] = [GRADE_COLORS[0], GRADE_COLORS[1], GRADE_COLORS[2], "#64748b"]
export const ACTION_SYMBOLS = { usual: "○", adjust: "◐", reschedule: "△", avoid: "■" } as const

export const SOURCE_URLS = {
  cn: "https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/jcffbz/202602/W020260225366493492011.pdf",
  cnTransition: "https://www.mee.gov.cn/ywdt/zbft/202602/t20260225_1144479.shtml",
  us: "https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf",
  usParticles: "https://www.airnow.gov/publications/air-quality-index/air-quality-guide-for-particle-pollution/",
  eu: "https://airindex.eea.europa.eu/AQI/?webgl=0",
  uk: "https://uk-air.defra.gov.uk/air-pollution/daqi?view=more-info",
  ukHealth: "https://www.gov.uk/government/publications/health-effects-of-air-pollution/health-advice-for-the-daily-air-quality-index-daqi",
  ca: "https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index/about.html",
  in: "https://airquality.cpcb.gov.in/ccr_docs/FINAL-REPORT_AQI_.pdf",
  inHealth: "https://www.ncdc.mohfw.gov.in/wp-content/uploads/2024/07/Enclosure-Air-Pollution-Health-Advisory-Oct-2023.pdf",
  jp: "https://www.env.go.jp/air/osen/pm/info.html",
  who: "https://www.who.int/teams/environment-climate-change-and-health/air-quality-and-health/health-impacts/types-of-pollutants",
} as const
