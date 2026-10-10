import { bilingual, type LocalizedText, type StandardId } from "./data"

interface StandardOverview {
  pollutants: readonly string[]
  method: LocalizedText
  output: LocalizedText
  pm25Period: LocalizedText
}

const SIX_POLLUTANTS = ["PM2.5", "PM10", "O₃", "NO₂", "SO₂", "CO"]
const FIVE_POLLUTANTS = SIX_POLLUTANTS.slice(0, 5)
const MAX_SUB_INDEX = bilingual("分指数取最大", "Highest sub-index")

export const STANDARD_OVERVIEW: Record<StandardId, StandardOverview> = {
  cn: { pollutants: SIX_POLLUTANTS, method: MAX_SUB_INDEX, output: bilingual("1–500 · 6 级", "1–500 · 6 categories"), pm25Period: bilingual("小时 / 日均", "Hourly / daily") },
  us: { pollutants: SIX_POLLUTANTS, method: MAX_SUB_INDEX, output: bilingual("0–500+ · 6 级", "0–500+ · 6 categories"), pm25Period: bilingual("日均 / NowCast", "Daily / NowCast") },
  eu: { pollutants: FIVE_POLLUTANTS, method: bilingual("取最差等级", "Poorest category"), output: bilingual("6 级", "6 categories"), pm25Period: bilingual("1 小时", "Hourly") },
  uk: { pollutants: FIVE_POLLUTANTS, method: bilingual("取最高等级", "Highest category"), output: bilingual("1–10 · 4 档", "1–10 · 4 bands"), pm25Period: bilingual("24 小时", "24-hour mean") },
  ca: { pollutants: ["PM", "O₃", "NO₂"], method: bilingual("联合健康风险", "Combined health risk"), output: bilingual("1–10+ · 4 档", "1–10+ · 4 bands"), pm25Period: bilingual("联合计算 / 烟雾调整", "Combined / smoke adjustment") },
  in: { pollutants: [...SIX_POLLUTANTS, "NH₃", "Pb"], method: MAX_SUB_INDEX, output: bilingual("0–500 · 6 级", "0–500 · 6 categories"), pm25Period: bilingual("24 小时", "24-hour mean") },
  jp: { pollutants: ["PM2.5"], method: bilingual("独立注意提示", "Separate advisory"), output: bilingual("非综合 AQI", "Not an overall AQI"), pm25Period: bilingual("预计日均", "Predicted daily mean") },
}
