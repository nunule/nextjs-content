import { SOURCE_URLS } from "./constants"
import { bilingual, CONCENTRATION_SCALES, type LocalizedText, type Period, type PollutantId, type StandardId } from "./data"

export type CoverageKind = "comparable" | "otherPeriod" | "combined" | "reference" | "excluded" | "notRecorded"

export function standardCoverage(standard: StandardId, pollutant: PollutantId, period: Period) {
  const scales = CONCENTRATION_SCALES.filter((scale) => scale.standard === standard && scale.pollutant === pollutant)
  if (scales.some((scale) => scale.period === period)) return { kind: "comparable" as CoverageKind, scales }
  if (scales.length) return { kind: "otherPeriod" as CoverageKind, scales }
  if (standard === "ca" && ["pm25", "pm10", "o3", "no2"].includes(pollutant)) return { kind: "combined" as CoverageKind, scales }
  if (standard === "jp" && ["nh3", "pb"].includes(pollutant)) return { kind: "notRecorded" as CoverageKind, scales }
  if (standard === "jp" || standard === "ca" && pollutant === "so2") return { kind: "reference" as CoverageKind, scales }
  return { kind: "excluded" as CoverageKind, scales }
}

export const STANDARD_REFERENCE_NOTES: Record<StandardId, LocalizedText> = {
  cn: bilingual("HJ 633—2026 表 3。日报按自然日；小时气体仅用于实时报。颗粒物小时实时报沿用日均断点。小时 SO₂>800 固定 IAQI 200，8h O₃>800 固定 300。", "HJ 633—2026, Table 3. Daily reports use calendar days; hourly gases are for real-time reports. Hourly particles use the daily breakpoints. Hourly SO₂>800 fixes IAQI at 200; 8h O₃>800 at 300."),
  us: bilingual("EPA May 2026 表 6。原表先截断浓度再计算；O₃ 截断至0.001 ppm，CO至0.1 ppm，NO₂/SO₂至整数ppb。臭氧与SO₂高浓度另有时长规则，灰色区域不生成分指数。", "EPA May 2026, Table 6. Truncate O₃ to 0.001 ppm, CO to 0.1 ppm and NO₂/SO₂ to integer ppb before calculation. Ozone and SO₂ have special high-concentration periods; grey regions do not generate a sub-index."),
  eu: bilingual("EEA 当前公开六档；所有五种污染物使用小时浓度，整体取最差档。此沟通指数不用于判断欧盟环境法规是否达标，CO并未纳入该指数。", "Current published EEA six-band index. All five pollutants use hourly concentrations; overall air quality follows the poorest band. This communication index is not a legal-compliance test and does not include CO."),
  uk: bilingual("Defra DAQI原表保留十个指数点：1–3低、4–6中、7–9高、10很高。颗粒物滚动24h、O₃滚动8h、NO₂小时、SO₂为15分钟；时长和日历窗口不可互换。", "Defra DAQI retains ten index points: 1–3 Low, 4–6 Moderate, 7–9 High, 10 Very high. Particles use rolling 24h, O₃ rolling 8h, NO₂ hourly and SO₂ 15-minute means. Periods and calendar windows are not interchangeable."),
  in: bilingual("CPCB表3.11，含NH₃与Pb。常规气体已补齐；高浓度臭氧脚注采用小时监测，不能混入8h色带。图中只显示单项类别；完整AQI仍要求有效数据及最少污染物数量。", "CPCB Table 3.11 includes NH₃ and Pb. High-concentration ozone has an hourly-monitoring footnote and cannot be mixed into the 8h band. The chart shows pollutant categories; overall AQI still requires valid data and a minimum pollutant count."),
  ca: bilingual("AQHI通常联合O₃、NO₂及颗粒物的滚动3h数据，不由单项浓度决定。野火烟雾另有小时PM2.5调整，魁北克使用Info-Smog。下面另列CAAQS环境目标，统计条件通常跨年，不能当作即时运动许可。", "AQHI normally combines rolling 3h O₃, NO₂ and particle data; one concentration is insufficient. Wildfire smoke has an hourly PM2.5 adjustment; Québec uses Info-Smog. The CAAQS objectives below involve longer-term statistics and are not immediate exercise clearance."),
  jp: bilingual("日本没有在此定义统一六档AQI。2026-04-01起，光化学氧化剂环境标准改为以臭氧计的8h与年度指标；小时注意/警报另行发布。SPM的采样定义不同于PM10。PM2.5环境标准与预计日均注意指引也要分别读取。", "No universal six-band Japanese AQI is defined here. From 2026-04-01, photochemical-oxidant standards use ozone-based 8h and annual measures; hourly advisories/alerts are separate. SPM sampling differs from PM10. PM2.5 environmental criteria and predicted daily-mean advisories are also separate."),
}

export interface NativeReference {
  symbol: string
  period: LocalizedText
  value: LocalizedText
  note: LocalizedText
  source: string
}

const entry = (symbol: string, period: [string, string], value: [string, string], note: [string, string], source: string): NativeReference => ({
  symbol, period: bilingual(...period), value: bilingual(...value), note: bilingual(...note), source,
})

export const CANADA_REFERENCES: NativeReference[] = [
  entry("AQHI", ["滚动3h / 烟雾调整", "Rolling 3h / smoke adjustment"], ["1–3低 · 4–6中 · 7–10高 · >10很高", "1–3 Low · 4–6 Moderate · 7–10 High · >10 Very high"], ["联合O₃、NO₂和颗粒物；不提供单项AQHI换算。", "Combines O₃, NO₂ and particles; no single-pollutant AQHI conversion."], SOURCE_URLS.ca),
  entry("PM2.5", ["24h", "24h"], ["27 µg/m³ · 2020", "27 µg/m³ · 2020"], ["年度第98百分位的3年均值；2030目标23。", "3-year mean of annual 98th percentiles; 2030 objective: 23."], SOURCE_URLS.caStandards),
  entry("PM2.5", ["年均", "Annual"], ["8.8 µg/m³ · 2020", "8.8 µg/m³ · 2020"], ["年均的3年均值；2030目标8.0。", "3-year mean of annual means; 2030 objective: 8.0."], SOURCE_URLS.caStandards),
  entry("O₃", ["8h", "8h"], ["60 ppb · 2025", "60 ppb · 2025"], ["年度第4高日最大8h值的3年均值。", "3-year mean of annual 4th-highest daily maximum 8h values."], SOURCE_URLS.caStandards),
  entry("NO₂", ["1h", "1h"], ["42 ppb · 2025", "42 ppb · 2025"], ["年度第98百分位日最大1h值的3年均值。", "3-year mean of annual 98th percentiles of daily maximum 1h values."], SOURCE_URLS.caStandards),
  entry("NO₂", ["年均", "Annual"], ["12 ppb · 2025", "12 ppb · 2025"], ["单一年份年均。", "Mean over one calendar year."], SOURCE_URLS.caStandards),
  entry("SO₂", ["1h", "1h"], ["65 ppb · 2025", "65 ppb · 2025"], ["年度第99百分位日最大1h值的3年均值。", "3-year mean of annual 99th percentiles of daily maximum 1h values."], SOURCE_URLS.caStandards),
  entry("SO₂", ["年均", "Annual"], ["4 ppb · 2025", "4 ppb · 2025"], ["单一年份年均。", "Mean over one calendar year."], SOURCE_URLS.caStandards),
]

export const JAPAN_REFERENCES: NativeReference[] = [
  entry("PM2.5", ["日均 / 年均", "Daily / annual"], ["≤35 / ≤15 µg/m³", "≤35 / ≤15 µg/m³"], ["环境标准；不是即时运动许可。", "Environmental criteria, not immediate exercise clearance."], SOURCE_URLS.jpStandards),
  entry("PM2.5", ["预计日均", "Predicted daily mean"], [">70 µg/m³", ">70 µg/m³"], ["高浓度注意指引，非AQI 70；以下也非安全保证。", "High-concentration advisory, not AQI 70; lower values are not a safety guarantee."], SOURCE_URLS.jp),
  entry("SPM", ["日均 / 1h", "Daily / 1h"], ["≤0.10 / ≤0.20 mg/m³", "≤0.10 / ≤0.20 mg/m³"], ["环境标准；SPM不直接当作PM10。", "Environmental criteria; SPM is not treated as PM10."], SOURCE_URLS.jpStandards),
  entry("NO₂", ["日均", "Daily"], ["0.04–0.06 ppm范围内或以下", "Within the 0.04–0.06 ppm zone or below"], ["保留原文区间条件，不编造AQI分级。", "Preserves the source's zone condition without inventing AQI bands."], SOURCE_URLS.jpStandards),
  entry("SO₂", ["日均 / 1h", "Daily / 1h"], ["≤0.04 / ≤0.10 ppm", "≤0.04 / ≤0.10 ppm"], ["两项环境条件均需满足。", "Both environmental conditions must be met."], SOURCE_URLS.jpStandards),
  entry("CO", ["日均 / 8h", "Daily / 8h"], ["≤10 / ≤20 ppm", "≤10 / ≤20 ppm"], ["两项环境条件均需满足。", "Both environmental conditions must be met."], SOURCE_URLS.jpStandards),
  entry("Oₓ（O₃）", ["8h / 年度统计", "8h / annual statistic"], ["≤0.07 / ≤0.04 ppm", "≤0.07 / ≤0.04 ppm"], ["2026-04-01施行；第二项为日最大8h值的年均。", "Effective 2026-04-01; the second criterion is the annual mean of daily maximum 8h values."], SOURCE_URLS.jpOzone),
  entry("Oₓ", ["1h注意报", "1h advisory"], ["≥0.12 ppm，且预计持续", "≥0.12 ppm and expected to persist"], ["由地方发布，不是环境标准的达标判定。", "Issued locally, separate from environmental-criteria compliance."], SOURCE_URLS.jpAlerts),
  entry("Oₓ", ["1h警报", "1h alert"], ["一般≥0.24 ppm，且预计持续", "Typically ≥0.24 ppm and expected to persist"], ["各地方阈值可能不同，核对当地预警。", "Local thresholds may differ; check the local alert."], SOURCE_URLS.jpAlerts),
]
