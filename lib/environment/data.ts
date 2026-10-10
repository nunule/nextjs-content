import type { Locale } from "@/lib/i18n/constants"
import { FOUR_GRADE_COLORS, GRADE_COLORS, SOURCE_URLS } from "./constants"

export type LocalizedText = Record<Locale, string>
export type StandardId = "cn" | "us" | "eu" | "uk" | "ca" | "in" | "jp"
export type PollutantId = "pm25" | "pm10" | "o3" | "no2" | "so2" | "co"
export type Period = "h24" | "h8" | "h1" | "m15"
export type Population = "general" | "sensitive"
export type Action = "usual" | "adjust" | "reschedule" | "avoid"

export const bilingual = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en })
export const localize = (value: LocalizedText, locale: Locale) => value[locale]

export interface Advice {
  action: Action
  label: LocalizedText
  text: LocalizedText
  conditional?: boolean
}
export interface Grade {
  name: LocalizedText
  range: string
  color: string
  general: Advice
  sensitive: Advice
}
export interface Standard {
  id: StandardId
  name: LocalizedText
  index: string
  version: LocalizedText
  method: LocalizedText
  scope: LocalizedText
  sensitiveGroups: LocalizedText
  source: string
  healthSource?: string
  grades: Grade[]
}

const advice = (action: Action, zhLabel: string, enLabel: string, zh: string, en: string, conditional = false): Advice => ({
  action, label: bilingual(zhLabel, enLabel), text: bilingual(zh, en), conditional,
})
const normal = advice("usual", "正常活动", "Usual activity", "可进行通常的户外活动。", "Continue your usual outdoor activities.")
const shorten = advice("adjust", "缩短 / 降低强度", "Shorter / less intense", "减少长时间、高强度的户外锻炼。", "Reduce prolonged or intense outdoor exercise.")
const avoidLong = advice("avoid", "避免长时间 / 高强度", "Avoid prolonged / intense", "避免长时间、高强度的户外锻炼。", "Avoid prolonged or intense outdoor exercise.")
const reduce = advice("adjust", "减少户外运动", "Reduce outdoor activity", "减少户外运动。", "Reduce outdoor physical activity.")
const avoidAll = advice("avoid", "停止户外运动", "Avoid all outdoor exercise", "留在室内，停止户外体力活动。", "Stay indoors and avoid all outdoor physical activity.")
const symptomsReduce = advice("adjust", "有症状时减少", "Reduce if symptomatic", "出现咳嗽、眼部或咽喉刺激等症状时，考虑减少剧烈户外活动。", "Consider reducing intense outdoor activity if you have coughing, eye or throat irritation.", true)
const moveInside = advice("reschedule", "考虑改期 / 移到室内", "Consider rescheduling / indoors", "考虑将活动改期或移到室内；出现症状时进入室内。", "Consider rescheduling or moving activities indoors; go indoors if symptoms occur.")

function grades(names: [string, string][], ranges: string[], general: Advice[], sensitive: Advice[], colors: readonly string[] = GRADE_COLORS): Grade[] {
  return names.map(([zh, en], i) => ({ name: bilingual(zh, en), range: ranges[i], color: colors[i], general: general[i], sensitive: sensitive[i] }))
}

export const STANDARDS: Standard[] = [
  {
    id: "cn", name: bilingual("中国大陆", "Mainland China"), index: "AQI",
    version: bilingual("HJ 633—2026 · 2026-03-01 生效", "HJ 633—2026 · Effective 2026-03-01"),
    method: bilingual("将六项污染物浓度换算为分指数，取最大值；计算结果向上进位取整数。", "Convert six pollutants to sub-indices, take the maximum, and round upward to an integer."),
    scope: bilingual("区分日报与实时报；2026 版颗粒物实时报使用小时平均。", "Daily and real-time reports differ; the 2026 real-time particle calculation uses hourly means."),
    sensitiveGroups: bilingual("青少年儿童、老年人及心血管、呼吸系统疾病患者；具体敏感人群还与首要污染物有关。", "Children and adolescents, older people and people with cardiovascular or respiratory disease; pollutant-specific definitions also apply."),
    source: SOURCE_URLS.cn,
    grades: grades([["优", "Good"], ["良", "Fair"], ["轻度污染", "Light pollution"], ["中度污染", "Moderate pollution"], ["重度污染", "Heavy pollution"], ["严重污染", "Severe pollution"]], ["1–50", "51–100", "101–150", "151–200", "201–300", ">300"],
      [normal, normal, normal, reduce, reduce, advice("avoid", "避免户外活动", "Avoid outdoor activity", "避免户外活动。", "Avoid outdoor activities.")],
      [normal, advice("adjust", "异常敏感者减少", "Exceptionally sensitive: reduce", "极少数异常敏感人群应减少户外活动。", "Exceptionally sensitive people should reduce outdoor activities."), shorten, avoidLong, avoidAll, advice("avoid", "留在室内 / 减少体力消耗", "Indoors / keep exertion low", "留在室内，避免体力消耗。", "Stay indoors and avoid physical exertion.")]),
  },
  {
    id: "us", name: bilingual("美国", "United States"), index: "US AQI",
    version: bilingual("EPA 技术指引 · 2026-05", "EPA technical guidance · May 2026"),
    method: bilingual("分指数取最大值；颗粒物先按规定截断浓度，再计算并四舍五入指数。", "Take the largest sub-index. Particle concentrations are truncated before calculation; the index is rounded."),
    scope: bilingual("本页运动矩阵采用颗粒物指引。日报颗粒物为 24 小时平均；实时 NowCast 为加权指标。", "Activity advice here follows particle guidance. Daily particles use 24-hour means; real-time NowCast uses weighting."),
    sensitiveGroups: bilingual("颗粒物敏感人群包括心肺疾病患者、儿童和青少年、老年人；不同污染物的定义不同。", "For particles: people with heart or lung disease, children and teenagers, and older adults. Definitions differ by pollutant."),
    source: SOURCE_URLS.us,
    grades: grades([["良好", "Good"], ["中等", "Moderate"], ["敏感人群不健康", "Unhealthy for sensitive groups"], ["不健康", "Unhealthy"], ["非常不健康", "Very unhealthy"], ["危险", "Hazardous"]], ["0–50", "51–100", "101–150", "151–200", "201–300", "301+"],
      [normal, normal, normal, shorten, reduce, advice("avoid", "避免所有户外体力活动", "Avoid all outdoor exertion", "避免所有户外体力活动。", "Avoid all physical activity outdoors.")],
      [normal, advice("adjust", "异常敏感者调整", "Unusually sensitive: adjust", "对颗粒物异常敏感的人考虑缩短活动、降低强度。", "People unusually sensitive to particles should consider shorter, less intense activity."), advice("adjust", "缩短 / 多休息", "Shorter / more breaks", "缩短活动时间、降低强度，多休息并留意症状。", "Make activities shorter and less intense; take more breaks and watch for symptoms."), moveInside, avoidAll, advice("avoid", "留在室内 / 轻度活动", "Indoors / light activity", "留在室内，保持轻度活动，并尽量降低室内颗粒物。", "Stay indoors, keep activity light, and reduce indoor particle levels.")]),
  },
  {
    id: "eu", name: bilingual("欧洲 · EEA", "Europe · EEA"), index: "European AQI",
    version: bilingual("EEA 当前公开分级", "Current published EEA bands"),
    method: bilingual("采用最多五种污染物的小时浓度，取其中最差等级。", "Use hourly concentrations of up to five pollutants and report the poorest category."),
    scope: bilingual("欧洲通用沟通指标；不等同于各国法规达标评价，也不是 0–500 的中美 AQI。", "A European public-information index, separate from legal compliance and the Chinese or US 0–500 scales."),
    sensitiveGroups: bilingual("有呼吸问题的成人与儿童，以及有心脏疾病的成人。", "Adults and children with respiratory problems, and adults with heart conditions."),
    source: SOURCE_URLS.eu,
    grades: grades([["好", "Good"], ["尚可", "Fair"], ["中等", "Moderate"], ["差", "Poor"], ["很差", "Very poor"], ["极差", "Extremely poor"]], ["Good", "Fair", "Moderate", "Poor", "Very poor", "Extremely poor"],
      [normal, normal, normal, symptomsReduce, symptomsReduce, reduce],
      [normal, normal, symptomsReduce, advice("adjust", "考虑减少户外体力活动", "Consider reducing activity", "考虑减少体力活动，尤其户外活动及出现症状时。", "Consider reducing physical activity, particularly outdoors, especially with symptoms.", true), advice("adjust", "减少户外体力活动", "Reduce outdoor activity", "减少体力活动，尤其户外活动及出现症状时。", "Reduce physical activity, particularly outdoors, especially with symptoms."), advice("avoid", "避免户外体力活动", "Avoid outdoor exertion", "避免户外体力活动。", "Avoid physical activities outdoors.")]),
  },
  {
    id: "uk", name: bilingual("英国", "United Kingdom"), index: "DAQI",
    version: bilingual("Defra DAQI · 健康建议 2026-04-13", "Defra DAQI · Health advice 2026-04-13"),
    method: bilingual("五种污染物分别分级，采用最高等级；指数 1–10，分四档。", "Use the highest category among five pollutants, on a 1–10 index grouped into four bands."),
    scope: bilingual("颗粒物采用日均或滚动 24 小时；O₃ 为滚动 8 小时、NO₂ 为 1 小时、SO₂ 为 15 分钟。", "Particles: daily or rolling 24-hour mean. O₃: rolling 8-hour; NO₂: hourly; SO₂: 15-minute mean."),
    sensitiveGroups: bilingual("心肺疾病成人和儿童；高及很高污染时还特别包含老年人。", "Adults and children with heart or lung conditions; older people are also highlighted at high and very high pollution."),
    source: SOURCE_URLS.uk, healthSource: SOURCE_URLS.ukHealth,
    grades: grades([["低", "Low"], ["中", "Moderate"], ["高", "High"], ["很高", "Very high"]], ["1–3", "4–6", "7–9", "10"],
      [normal, advice("adjust", "有症状时减少暴露", "Reduce exposure if symptomatic", "多数人可正常活动；有症状时尽量减少污染暴露。", "Most people can continue usual activity; reduce exposure if you have symptoms.", true), advice("adjust", "减少污染暴露", "Reduce pollution exposure", "尽量减少污染暴露，尤其出现症状时。", "Try to reduce pollution exposure, especially with symptoms."), advice("adjust", "减少污染暴露", "Reduce pollution exposure", "尽量减少污染暴露，尤其出现症状时。", "Try to reduce pollution exposure, especially with symptoms.")],
      [normal, advice("adjust", "调整费力的户外活动", "Adapt demanding activity", "心肺疾病患者尝试调整体力消耗较大的户外活动，尤其症状加重时。", "People with heart or lung conditions should try to adapt physically demanding outdoor activities, especially if symptoms worsen."), advice("adjust", "调整费力的户外活动", "Adapt demanding activity", "心肺疾病患者和老年人应调整体力消耗较大的户外活动，尤其症状加重时。", "People with heart or lung conditions and older people should adapt demanding outdoor activity, especially if symptoms worsen."), advice("adjust", "调整费力的户外活动", "Adapt demanding activity", "心肺疾病患者和老年人应调整体力消耗较大的户外活动，尤其症状加重时。", "People with heart or lung conditions and older people should adapt demanding outdoor activity, especially if symptoms worsen.")], FOUR_GRADE_COLORS),
  },
  {
    id: "ca", name: bilingual("加拿大", "Canada"), index: "AQHI",
    version: bilingual("ECCC 当前公开健康指引", "Current published ECCC health guidance"),
    method: bilingual("综合 O₃、NO₂ 和颗粒物的健康风险；不是单项污染物分指数的最大值。", "Combine health risks from ozone, NO₂ and particles rather than taking the largest pollutant sub-index."),
    scope: bilingual("1–10+ 健康风险尺度；野火烟雾可调整计算方式。魁北克使用 Info-Smog。", "A 1–10+ health-risk scale; calculation can adjust for wildfire smoke. Québec uses Info-Smog."),
    sensitiveGroups: bilingual("儿童、65 岁以上人群和有相关健康问题的人。", "Children, people over 65, and people with relevant health conditions."),
    source: SOURCE_URLS.ca,
    grades: grades([["低风险", "Low risk"], ["中风险", "Moderate risk"], ["高风险", "High risk"], ["很高风险", "Very high risk"]], ["1–3", "4–6", "7–10", ">10 (10+)"],
      [normal, advice("adjust", "有症状时调整", "Adjust if symptomatic", "无咳嗽、咽喉刺激等症状时可维持通常活动。", "Continue usual activities unless you have coughing or throat irritation.", true), advice("adjust", "有症状时减少 / 改期", "Reduce / reschedule if symptomatic", "有症状时考虑减少剧烈户外活动或改期。", "Consider reducing or rescheduling strenuous outdoor activities if you have symptoms.", true), advice("reschedule", "减少剧烈活动 / 改期", "Reduce strenuous activity / reschedule", "减少剧烈户外活动或改期，尤其有症状时。", "Reduce or reschedule strenuous outdoor activities, especially with symptoms.")],
      [normal, advice("adjust", "有症状时减少 / 改期", "Reduce / reschedule if symptomatic", "有症状时考虑减少剧烈户外活动或改期。", "Consider reducing or rescheduling strenuous outdoor activities if you have symptoms.", true), advice("reschedule", "减少剧烈活动 / 改期", "Reduce strenuous activity / reschedule", "减少剧烈户外活动或改期。", "Reduce or reschedule strenuous outdoor activities."), advice("avoid", "避免剧烈户外活动", "Avoid strenuous outdoor activity", "避免剧烈户外活动。", "Avoid strenuous outdoor activities.")], FOUR_GRADE_COLORS),
  },
  {
    id: "in", name: bilingual("印度", "India"), index: "National AQI",
    version: bilingual("CPCB AQI · NCDC 健康指引 2023", "CPCB AQI · NCDC health guidance 2023"),
    method: bilingual("将最多八种污染物换算为分指数，取最高值。", "Convert up to eight pollutants to sub-indices and report the highest value."),
    scope: bilingual("颗粒物采用 24 小时平均；气体时长和高污染计算需参照 CPCB 原表。", "Particles use 24-hour means. Gas averaging periods and high-pollution calculations follow the CPCB tables."),
    sensitiveGroups: bilingual("儿童、老年人、孕妇及心肺疾病等基础疾病患者；官方还列出其他高暴露群体。", "Children, older people, pregnant women and people with underlying conditions, including heart or lung disease; official guidance lists other high-exposure groups."),
    source: SOURCE_URLS.in, healthSource: SOURCE_URLS.inHealth,
    grades: grades([["好", "Good"], ["尚可", "Satisfactory"], ["中等", "Moderate"], ["差", "Poor"], ["很差", "Very poor"], ["严重", "Severe"]], ["0–50", "51–100", "101–200", "201–300", "301–400", "401–500"],
      [normal, normal, shorten, advice("avoid", "避免户外体力消耗", "Avoid outdoor exertion", "避免户外体力消耗性活动。", "Avoid outdoor physical exertion."), advice("avoid", "避免户外体力活动", "Avoid outdoor physical activity", "避免户外体力活动，尤其早晨和傍晚。", "Avoid outdoor physical activities, especially in the morning and late evening."), avoidAll],
      [normal, shorten, avoidLong, advice("avoid", "避免户外体力活动", "Avoid outdoor exertion", "避免户外体力活动。", "Avoid outdoor physical activities."), advice("avoid", "留在室内 / 轻度活动", "Indoors / low activity", "留在室内，保持较低活动水平。", "Remain indoors and keep activity levels low."), avoidAll]),
  },
  {
    id: "jp", name: bilingual("日本", "Japan"), index: "PM2.5",
    version: bilingual("环境省 PM2.5 暂定注意指引", "MOE provisional PM2.5 advisory"),
    method: bilingual("这里展示日均浓度注意指引，不是综合 AQI，也不是两档空气质量评级。", "This is a daily concentration advisory, not an overall AQI or a two-category air-quality rating."),
    scope: bilingual("预计 PM2.5 日均超过 70 µg/m³ 时发布高浓度注意提示。日均环境标准 35 µg/m³ 与注意指引作用不同。", "A predicted PM2.5 daily mean above 70 µg/m³ prompts high-concentration advice. The daily environmental standard of 35 µg/m³ serves a different purpose."),
    sensitiveGroups: bilingual("儿童、老年人及呼吸、循环系统疾病患者。低于注意指引也可能需要谨慎。", "Children, older people and people with respiratory or circulatory disease may need caution even below the advisory level."),
    source: SOURCE_URLS.jp,
    grades: grades([["注意指引以下", "Below advisory level"], ["高浓度注意指引", "High-concentration advisory"]], ["≤70 µg/m³", ">70 µg/m³"],
      [advice("usual", "结合当地提示判断", "Check local guidance", "未达到高浓度注意指引不代表运动安全，仍需查看当地监测和身体状况。", "Being below the advisory level does not establish exercise safety. Check local measurements and your condition."), advice("adjust", "减少长时间剧烈运动", "Reduce prolonged vigorous exercise", "尽量减少非必要外出，以及长时间、剧烈的户外运动。", "Minimize unnecessary outings and prolonged vigorous outdoor exercise.")],
      [advice("adjust", "按身体状况谨慎安排", "Use extra caution", "即使低于注意指引，也应结合身体状况谨慎安排活动。", "Use caution according to your condition even below the advisory level."), advice("adjust", "更加谨慎 / 减少暴露", "Extra caution / less exposure", "减少非必要外出及长时间剧烈运动，并按身体状况更加谨慎。", "Reduce unnecessary outings and prolonged vigorous exercise; take extra care according to your condition.")], ["#64748b", GRADE_COLORS[2]]),
  },
]

export const getStandard = (id: StandardId) => STANDARDS.find((standard) => standard.id === id)!
export const gradeRangeLabel = (grade: Grade, locale: Locale) => grade.range === localize(grade.name, locale) ? "" : grade.range

export interface Pollutant {
  id: PollutantId
  symbol: string
  name: LocalizedText
  unit: string
  max: number
  initial: number
  periods: Period[]
  what: LocalizedText
  sources: LocalizedText
  health: LocalizedText
  activity: LocalizedText
  measure: LocalizedText
}

export const POLLUTANTS: Pollutant[] = [
  { id: "pm25", symbol: "PM2.5", name: bilingual("细颗粒物", "Fine particles"), unit: "µg/m³", max: 300, initial: 35, periods: ["h24", "h1"],
    what: bilingual("空气动力学直径不大于 2.5 µm 的颗粒物。", "Particles with aerodynamic diameter up to 2.5 µm."),
    sources: bilingual("燃烧排放，以及空气中形成的二次颗粒物。", "Combustion and secondary particles formed in air."),
    health: bilingual("可深入肺部；与呼吸和心血管健康风险有关。", "Can reach deep into lungs; linked to respiratory and cardiovascular risks."),
    activity: bilingual("查看当地颗粒物提示，按人群调整运动。", "Follow local particle advisories for your population."),
    measure: bilingual("区分小时、日均和实时加权浓度；不要混用。", "Distinguish hourly, daily and weighted real-time concentrations."),
  },
  { id: "pm10", symbol: "PM10", name: bilingual("可吸入颗粒物", "Inhalable particles"), unit: "µg/m³", max: 650, initial: 80, periods: ["h24", "h1"],
    what: bilingual("直径不大于 10 µm 的可吸入颗粒，包括 PM2.5。", "Inhalable particles up to 10 µm, including PM2.5."),
    sources: bilingual("道路扬尘、建筑活动、工业排放等。", "Road dust, construction and industrial emissions."),
    health: bilingual("可影响呼吸道，增加呼吸健康风险。", "Can affect airways and respiratory health."),
    activity: bilingual("扬尘天气查看颗粒物等级与当地提示。", "Check particle levels and guidance during dusty conditions."),
    measure: bilingual("PM10 与 PM2.5 存在包含关系，不将浓度简单相加。", "PM10 includes PM2.5; do not simply add their concentrations."),
  },
  { id: "o3", symbol: "O₃", name: bilingual("地面臭氧", "Ground-level ozone"), unit: "µg/m³", max: 350, initial: 120, periods: ["h8", "h1"],
    what: bilingual("地面空气中的臭氧，与高空臭氧层作用不同。", "Ozone at ground level, distinct from the protective ozone layer."),
    sources: bilingual("前体污染物在阳光作用下发生反应形成。", "Sunlight-driven reactions between precursor pollutants."),
    health: bilingual("可刺激呼吸系统、加重哮喘并影响肺功能。", "Can irritate breathing, aggravate asthma and impair lung function."),
    activity: bilingual("天气晴朗并不保证臭氧低，留意当地时段预报。", "Clear weather does not guarantee low ozone; check local forecasts."),
    measure: bilingual("1 小时与 8 小时标准分别读取；美国原表使用 ppm。", "Read 1-hour and 8-hour limits separately; US tables use ppm."),
  },
  { id: "no2", symbol: "NO₂", name: bilingual("二氧化氮", "Nitrogen dioxide"), unit: "µg/m³", max: 700, initial: 100, periods: ["h1", "h24"],
    what: bilingual("燃烧过程产生的一种反应性气体。", "A reactive gas from combustion."),
    sources: bilingual("交通、供暖、发电和工业燃烧。", "Traffic, heating, power generation and industry."),
    health: bilingual("刺激气道，可能加重呼吸系统疾病。", "Irritates airways and can aggravate respiratory disease."),
    activity: bilingual("查看当地监测，注意繁忙道路附近的暴露。", "Check monitoring and exposure near busy roads."),
    measure: bilingual("小时与日均阈值不同；ppb 不直接当作 µg/m³。", "Hourly and daily thresholds differ; ppb is not µg/m³."),
  },
  { id: "so2", symbol: "SO₂", name: bilingual("二氧化硫", "Sulfur dioxide"), unit: "µg/m³", max: 1100, initial: 150, periods: ["h1", "h24", "m15"],
    what: bilingual("与含硫燃料燃烧等过程有关的气体。", "A gas associated with burning sulfur-containing fuels."),
    sources: bilingual("煤、油燃烧及部分矿物冶炼。", "Coal and oil combustion and some mineral smelting."),
    health: bilingual("影响呼吸系统，哮喘患者尤其需要关注。", "Affects breathing; people with asthma need particular attention."),
    activity: bilingual("按首要污染物提示和敏感人群建议安排。", "Follow pollutant-specific and sensitive-group advice."),
    measure: bilingual("英国采用 15 分钟均值，不能直接套用小时标准。", "The UK uses 15-minute means, which are not hourly means."),
  },
  { id: "co", symbol: "CO", name: bilingual("一氧化碳", "Carbon monoxide"), unit: "mg/m³", max: 65, initial: 4, periods: ["h24", "h1"],
    what: bilingual("无色无味、由不完全燃烧产生的气体。", "A colourless, odourless gas from incomplete combustion."),
    sources: bilingual("车辆及其他不完全燃烧排放。", "Vehicles and other incomplete combustion."),
    health: bilingual("影响血液输送氧气的能力。", "Interferes with oxygen transport in blood."),
    activity: bilingual("不能用气味判断浓度；留意交通及燃烧暴露。", "Smell cannot reveal its level; consider traffic and combustion exposure."),
    measure: bilingual("中国采用 mg/m³，美国采用 ppm，量纲需区分。", "China uses mg/m³ and the US uses ppm; distinguish the units."),
  },
]
export const getPollutant = (id: PollutantId) => POLLUTANTS.find((pollutant) => pollutant.id === id)!

export interface ConcentrationScale {
  standard: StandardId
  pollutant: PollutantId
  period: Period
  upper: number[]
  // UK index has ten points, which are grouped into four health bands.
  gradeIndices?: number[]
  indexBreaks?: number[]
  rounding?: "ceil" | "epa"
  definedMax?: number
  source: string
}

const cnBreaks = [0, 50, 100, 150, 200, 300, 400, 500]
const cn = (pollutant: PollutantId, period: Period, upper: number[], definedMax?: number): ConcentrationScale => ({
  standard: "cn", pollutant, period, upper, indexBreaks: cnBreaks.slice(0, upper.length + 1), rounding: "ceil", definedMax, source: SOURCE_URLS.cn,
})
const uk = (pollutant: PollutantId, period: Period, upper: number[], urlPollutant: string): ConcentrationScale => ({
  standard: "uk", pollutant, period, upper: [...upper, Infinity], gradeIndices: [0, 0, 0, 1, 1, 1, 2, 2, 2, 3],
  source: `https://uk-air.defra.gov.uk/air-pollution/daqi?pollutant=${urlPollutant}&view=more-info`,
})
const eu = (pollutant: PollutantId, upper: number[]): ConcentrationScale => ({ standard: "eu", pollutant, period: "h1", upper: [...upper, Infinity], source: SOURCE_URLS.eu })

// Source tables preserve their original periods and units. No gas-unit conversion or averaging conversion is performed.
export const CONCENTRATION_SCALES: ConcentrationScale[] = [
  cn("pm25", "h24", [35, 60, 115, 150, 250, 350, 500]),
  cn("pm25", "h1", [35, 60, 115, 150, 250, 350, 500]),
  cn("pm10", "h24", [50, 120, 250, 350, 420, 500, 600]),
  cn("pm10", "h1", [50, 120, 250, 350, 420, 500, 600]),
  cn("o3", "h8", [100, 160, 215, 265, 800], 800),
  cn("o3", "h1", [160, 200, 300, 400, 800, 1000, 1200]),
  cn("no2", "h24", [40, 80, 180, 280, 565, 750, 940]),
  cn("no2", "h1", [100, 200, 700, 1200, 2340, 3090, 3840]),
  cn("so2", "h24", [50, 150, 475, 800, 1600, 2100, 2620]),
  cn("so2", "h1", [150, 500, 650, 800], 800),
  cn("co", "h24", [2, 4, 14, 24, 36, 48, 60]),
  cn("co", "h1", [5, 10, 35, 60, 90, 120, 150]),
  { standard: "us", pollutant: "pm25", period: "h24", upper: [9, 35.4, 55.4, 125.4, 225.4, 325.4], indexBreaks: [0, 50, 100, 150, 200, 300, 500], rounding: "epa", source: SOURCE_URLS.us },
  { standard: "us", pollutant: "pm10", period: "h24", upper: [54, 154, 254, 354, 424, 604], indexBreaks: [0, 50, 100, 150, 200, 300, 500], rounding: "epa", source: SOURCE_URLS.us },
  uk("pm25", "h24", [11, 23, 35, 41, 47, 53, 58, 64, 70], "pm25"),
  uk("pm10", "h24", [16, 33, 50, 58, 66, 75, 83, 91, 100], "pm10"),
  uk("o3", "h8", [33, 66, 100, 120, 140, 160, 187, 213, 240], "ozone"),
  uk("no2", "h1", [67, 134, 200, 267, 334, 400, 467, 534, 600], "no2"),
  uk("so2", "m15", [88, 177, 266, 354, 443, 532, 710, 887, 1064], "so2"),
  eu("pm25", [5, 15, 50, 90, 140]), eu("pm10", [15, 45, 120, 195, 270]),
  eu("o3", [60, 100, 120, 160, 180]), eu("no2", [10, 25, 60, 100, 150]), eu("so2", [20, 40, 125, 190, 275]),
  { standard: "in", pollutant: "pm25", period: "h24", upper: [30, 60, 90, 120, 250, Infinity], source: SOURCE_URLS.in },
  { standard: "in", pollutant: "pm10", period: "h24", upper: [50, 100, 250, 350, 430, Infinity], source: SOURCE_URLS.in },
]
