const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const root = path.resolve(__dirname, "..")
const cache = new Map()

function loadSource(relative) {
  const filename = path.join(root, relative)
  if (cache.has(filename)) return cache.get(filename)
  const module = { exports: {} }
  cache.set(filename, module.exports)
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const localRequire = (name) => name.startsWith("@/") ? loadSource(`${name.slice(2)}.ts`)
    : name.startsWith(".") ? loadSource(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`))) : require(name)
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire }, { filename })
  cache.set(filename, module.exports)
  return module.exports
}

const { CONCENTRATION_SCALES, STANDARDS, POLLUTANTS, COMPARISON_POLLUTANTS } = loadSource("lib/environment/data.ts")
const { compatibleScales, evaluateConcentration, concentrationSegments, sourceRanges, thresholdLabels } = loadSource("lib/environment/calculations.ts")
const { environmentZh, environmentEn } = loadSource("lib/environment/messages.ts")
const { STANDARD_OVERVIEW } = loadSource("lib/environment/standards-overview.ts")
const { assessExercise, activityOutcomes, exerciseOfficialAdvice } = loadSource("lib/environment/exercise.ts")
const { exerciseZh, exerciseEn } = loadSource("lib/environment/exercise-messages.ts")
const { toDisplayConcentration, toNativeConcentration } = loadSource("lib/environment/units.ts")
const { standardCoverage, CANADA_REFERENCES, JAPAN_REFERENCES, STANDARD_REFERENCE_NOTES } = loadSource("lib/environment/reference.ts")
const scale = (standard, pollutant, period = "h24") => CONCENTRATION_SCALES.find((item) => item.standard === standard && item.pollutant === pollutant && item.period === period)

// Source-backed boundary cases distinguish the 2026 Chinese thresholds and EPA truncation rules.
assert.equal(evaluateConcentration(scale("cn", "pm25"), 35).index, 50)
assert.equal(evaluateConcentration(scale("cn", "pm25"), 60).index, 100)
assert.equal(evaluateConcentration(scale("cn", "pm25"), 60.1).index, 101)
assert.equal(evaluateConcentration(scale("cn", "pm10"), 120).index, 100)
assert.equal(evaluateConcentration(scale("cn", "pm25"), 0).index, 1)
assert.equal(sourceRanges(scale("cn", "pm25"))[0].index, "1–50")
assert.equal(sourceRanges(scale("cn", "pm25"))[1].index, "51–100")
assert.equal(evaluateConcentration(scale("us", "pm25"), 9).index, 50)
assert.equal(evaluateConcentration(scale("us", "pm25"), 9.09).index, 50)
assert.equal(evaluateConcentration(scale("us", "pm25"), 9.1).index, 51)
assert.equal(evaluateConcentration(scale("us", "pm25"), 35.49).index, 100)
assert.equal(evaluateConcentration(scale("us", "pm25"), 35.5).index, 101)
assert.equal(evaluateConcentration(scale("us", "pm25"), 125.5).index, 201)
assert.equal(evaluateConcentration(scale("us", "pm25"), 225.5).gradeIndex, 5)
assert.equal(evaluateConcentration(scale("uk", "pm25"), 36).index, 4)
assert.equal(evaluateConcentration(scale("uk", "pm25"), 71).index, 10)
assert.equal(evaluateConcentration(scale("eu", "pm25", "h1"), 5).gradeIndex, 0)
assert.equal(evaluateConcentration(scale("eu", "pm25", "h1"), 6).gradeIndex, 1)
assert.equal(evaluateConcentration(scale("in", "pm25"), 61).gradeIndex, 2)
assert.equal(evaluateConcentration(scale("in", "pm25"), 251).gradeIndex, 5)
assert.equal(evaluateConcentration(scale("cn", "pm25"), 141).index, 188)
assert.equal(evaluateConcentration(scale("us", "pm25"), 141).index, 216)
assert.equal(evaluateConcentration(scale("cn", "so2", "h1"), 1000).index, 200)
assert.equal(evaluateConcentration(scale("cn", "o3", "h8"), 900).index, 300)
for (const value of [-1, NaN, Infinity]) assert.equal(evaluateConcentration(scale("cn", "pm25"), value), null)

// Different time windows and units must never be presented as a direct comparison.
assert(!compatibleScales("pm25", "h24").some((item) => item.standard === "eu"))
assert(!compatibleScales("pm25", "h1").some((item) => item.standard === "us"))
assert(!compatibleScales("so2", "h1").some((item) => item.standard === "uk"))
assert.equal(compatibleScales("so2", "m15")[0].standard, "uk")
assert(!CONCENTRATION_SCALES.some((item) => ["ca", "jp"].includes(item.standard)))
assert.deepEqual(Array.from(compatibleScales("o3", "h8"), (item) => item.standard), ["cn", "us", "uk", "in"])
assert.equal(COMPARISON_POLLUTANTS.length, 8)
for (const pollutant of ["pm25", "pm10", "o3", "no2", "so2", "co", "nh3", "pb"]) assert(CONCENTRATION_SCALES.some((item) => item.standard === "in" && item.pollutant === pollutant))
for (const pollutant of ["pm25", "pm10", "o3", "no2", "so2", "co"]) assert(CONCENTRATION_SCALES.some((item) => item.standard === "us" && item.pollutant === pollutant))

// Verify against EPA's original-unit examples, not a second copy of the conversion formula.
const ozone8 = scale("us", "o3", "h8")
const ozone1 = scale("us", "o3", "h1")
assert(Math.abs(toDisplayConcentration(ozone8, 0.070) - 137.4233128834356) < 1e-8)
assert.equal(evaluateConcentration(ozone8, toDisplayConcentration(ozone8, 0.07853333)).index, 126)
assert.equal(evaluateConcentration(ozone8, toDisplayConcentration(ozone8, 0.054999)).index, 50)
assert.equal(evaluateConcentration(ozone8, toDisplayConcentration(ozone8, 0.055)).index, 51)
assert.equal(evaluateConcentration(ozone8, toDisplayConcentration(ozone8, 0.201)), null)
for (const value of [107, 108, 139, 140, 207, 208, 300]) {
  const result = evaluateConcentration(ozone8, value)
  const band = concentrationSegments(ozone8, 350).find((segment) => value >= segment.from && value < segment.to)
  assert.equal(band.gradeIndex, result?.gradeIndex ?? -1, "EPA band colours must follow truncation, not raw rounded upper bounds")
}
assert.equal(evaluateConcentration(ozone1, toDisplayConcentration(ozone1, 0.124999)), null)
assert.equal(evaluateConcentration(ozone1, toDisplayConcentration(ozone1, 0.125)).index, 101)
assert.equal(evaluateConcentration(ozone1, toDisplayConcentration(ozone1, 0.164)).index, 150)
assert.equal(evaluateConcentration(ozone1, toDisplayConcentration(ozone1, 0.604)).index, 500)
const sulfur1 = scale("us", "so2", "h1")
const sulfur24 = scale("us", "so2", "h24")
assert.equal(evaluateConcentration(sulfur1, toDisplayConcentration(sulfur1, 304)).index, 200)
assert.equal(evaluateConcentration(sulfur1, toDisplayConcentration(sulfur1, 305)), null)
assert.equal(evaluateConcentration(sulfur24, toDisplayConcentration(sulfur24, 304)), null)
assert.equal(evaluateConcentration(sulfur24, toDisplayConcentration(sulfur24, 305)).index, 201)
const carbon8 = scale("us", "co", "h8")
assert.equal(evaluateConcentration(carbon8, toDisplayConcentration(carbon8, 4.4999)).index, 50)
assert.equal(evaluateConcentration(carbon8, toDisplayConcentration(carbon8, 4.5)).index, 51)
assert.equal(evaluateConcentration(scale("in", "o3", "h8"), 120).gradeIndex, 2)
assert.equal(evaluateConcentration(scale("in", "o3", "h8"), 209), null)
assert.equal(evaluateConcentration(scale("in", "o3", "h1"), 208), null)
assert.equal(evaluateConcentration(scale("in", "o3", "h1"), 209).gradeIndex, 4)
assert.equal(evaluateConcentration(scale("in", "o3", "h1"), 749).gradeIndex, 5)
assert.equal(standardCoverage("us", "o3", "h8").kind, "comparable")
assert.equal(standardCoverage("eu", "o3", "h8").kind, "otherPeriod")
assert.equal(standardCoverage("ca", "o3", "h8").kind, "combined")
assert.equal(standardCoverage("jp", "o3", "h8").kind, "reference")
assert.equal(standardCoverage("eu", "co", "h8").kind, "excluded")
assert.equal(CANADA_REFERENCES.length, 8)
assert.equal(JAPAN_REFERENCES.length, 9)
assert(JAPAN_REFERENCES.some((item) => item.value.en.includes("0.07") && item.note.en.includes("2026-04-01")))
for (const item of CONCENTRATION_SCALES) {
  const pollutant = COMPARISON_POLLUTANTS.find((entry) => entry.id === item.pollutant)
  const standard = STANDARDS.find((entry) => entry.id === item.standard)
  const segments = concentrationSegments(item, pollutant.max)
  assert.equal(segments[0].from, 0)
  assert.equal(segments[segments.length - 1].to, pollutant.max)
  segments.forEach((segment, i) => {
    assert(segment.to > segment.from)
    assert(segment.gradeIndex === -1 || standard.grades[segment.gradeIndex])
    if (i) assert.equal(segment.from, segments[i - 1].to)
  })
  for (let value = 0; value <= pollutant.max; value++) {
    const result = evaluateConcentration(item, value)
    if (!result) {
      const native = toNativeConcentration(item, value)
      assert(item.validMin !== undefined && native < item.validMin || item.validMax !== undefined && native >= item.validMax)
      continue
    }
    assert(standard.grades[result.gradeIndex], `${item.standard}/${item.pollutant}/${value}: grade must exist`)
  }
}

// Boundary labels retain the actual values and share an axis; crowded labels wrap.
const narrowLabels = thresholdLabels(scale("us", "pm25"), 300, 288)
assert.deepEqual(Array.from(narrowLabels, (label) => Number(label.value.toFixed(1))), [9.1, 35.5, 55.5, 125.5, 225.5])
assert(narrowLabels.some((label) => label.line > 0), "Close thresholds must occupy separate lines on mobile")
for (const label of narrowLabels) {
  assert.equal(label.position, label.value / 300 * 100)
  assert(label.labelPosition >= 0 && label.labelPosition <= 100)
}
assert.deepEqual(Array.from(thresholdLabels(scale("uk", "pm25"), 300, 900), (label) => label.value), [35, 53, 70], "Show health-band boundaries, not ten indistinguishable blocks")
assert.equal(Object.keys(STANDARD_OVERVIEW).length, 7)
assert.match(STANDARD_OVERVIEW.jp.output.en, /not an overall/i)
assert.equal(STANDARD_OVERVIEW.in.pollutants.length, 8)

// Advice is allowed to be conditional, and an exercise restriction must preserve its original scope.
const country = (id) => STANDARDS.find((item) => item.id === id)
assert.equal(country("cn").grades[4].sensitive.action, "avoid")
assert.equal(country("us").grades[4].sensitive.action, "avoid")
assert.equal(country("eu").grades[3].general.conditional, true)
assert.equal(country("ca").grades[2].general.conditional, true)
assert.equal(country("uk").grades[3].general.action, "adjust", "2026 UK guidance does not impose an invented total exercise ban")
assert.match(country("ca").grades[3].sensitive.text.en, /strenuous/)
assert.match(country("jp").scope.en, /70/)
assert.equal(STANDARDS.length, 7)
assert.equal(POLLUTANTS.length, 6)
assert.deepEqual(Object.keys(environmentZh).sort(), Object.keys(environmentEn).sort())
for (const [key, value] of Object.entries(environmentEn)) assert(value.trim(), `${key}: English content must exist`)
function checkLocalized(value) {
  if (!value || typeof value !== "object") return
  if ("zh-CN" in value) { assert(value["zh-CN"].trim()); assert(value.en.trim()) }
  for (const nested of Object.values(value)) checkLocalized(nested)
}
checkLocalized(STANDARDS)
checkLocalized(POLLUTANTS)
checkLocalized(STANDARD_OVERVIEW)
checkLocalized(STANDARD_REFERENCE_NOTES)
checkLocalized(CANADA_REFERENCES)
checkLocalized(JAPAN_REFERENCES)

// Exercise decisions must keep averaging windows, symptom conditions and restrictions separate.
const assessment = (options = {}) => assessExercise({ standard: "eu", period: "h1", readings: { pm25: "32" }, population: "general", symptoms: false, ...options })
const usual32 = assessment()
assert.equal(usual32.gradeIndex, 2)
assert.equal(usual32.outcomes.vigorous, "usual", "EEA moderate does not restrict usual activity for healthy adults")
assert.equal(assessment({ population: "sensitive" }).outcomes.vigorous, "usual", "EEA moderate's adjustment is conditional on symptoms")
assert.equal(assessment({ population: "sensitive", symptoms: true }).outcomes.vigorous, "adjust")
assert.equal(assessment({ population: "sensitive", symptoms: true }).gradeIndex, 2, "Symptoms must not change the air category")
assert.equal(assessment({ standard: "us" }).status, "periodMismatch")
assert.equal(assessment({ standard: "jp", period: "h24" }).status, "periodMismatch", "A measured 24-hour average is not Japan's expected daily mean")
assert.equal(assessment({ standard: "us", period: "h24" }).outcomes.vigorous, "usual")
assert.equal(assessment({ standard: "us", period: "h24", population: "sensitive" }).outcomes.vigorous, "adjust")
assert.equal(assessment({ standard: "us", period: "h24", readings: { pm25: "35.49" } }).gradeIndex, 1)
assert.equal(assessment({ standard: "us", period: "h24", readings: { pm25: "35.5" } }).gradeIndex, 2)
assert.equal(assessment({ standard: "us", period: "h24", readings: { pm25: "150" } }).outcomes.walking, "monitor", "Avoiding prolonged activity is not a ban on every short walk")
assert.equal(assessment({ standard: "us", period: "h24", readings: { pm25: "150" } }).outcomes.vigorous, "avoid")
assert.match(exerciseOfficialAdvice("us", 4, "general").en, /Avoid prolonged or intense/)
assert.equal(assessment({ standard: "us", period: "h24", readings: { pm25: "300" } }).outcomes.walking, "indoors")
assert.equal(assessment({ standard: "jp", period: "predictedDaily" }).outcomes.walking, "unknown", "Japan's advisory is not exercise clearance")
assert.equal(assessment({ standard: "jp", period: "predictedDaily", readings: { pm25: "70" } }).gradeIndex, 0)
assert.equal(assessment({ standard: "jp", period: "predictedDaily", readings: { pm25: "70.1" } }).gradeIndex, 1)
assert.equal(assessment({ standard: "jp", period: "predictedDaily", readings: { pm25: "80" } }).outcomes.vigorous, "adjust", "Japan recommends reducing, not an invented total ban")
assert.equal(assessment({ readings: { pm25: "32", o3: "181" } }).driver, "o3")
assert.equal(assessment({ readings: { pm25: "32", o3: "181" } }).gradeIndex, 5)
assert.equal(assessment({ readings: { pm25: "32", pm10: "32" } }).gradeIndex, 2, "Do not add PM2.5 and PM10")
assert.equal(assessment({ readings: { pm25: "32", o3: "-1" } }).status, "invalid")
assert.equal(assessment({ readings: { pm25: "" } }).status, "empty")
for (const value of ["-1", "NaN", "Infinity"]) assert.equal(assessment({ readings: { pm25: value } }).status, "invalid")
for (const standard of ["eu", "us", "jp"]) {
  for (let grade = 0; grade < country(standard).grades.length; grade++) {
    for (const population of ["general", "sensitive"]) {
      for (const symptoms of [false, true]) assert.equal(Object.keys(activityOutcomes(standard, grade, population, symptoms)).length, 3)
    }
  }
}
assert.deepEqual(Object.keys(exerciseZh).sort(), Object.keys(exerciseEn).sort())
for (const [key, value] of Object.entries(exerciseEn)) assert(value.trim(), `${key}: English exercise content must exist`)
console.log("PASS: source thresholds, averaging windows, chart boundaries, bilingual content, exercise intensity, conditional symptoms, Japan advisory and multiple-pollutant decisions")
