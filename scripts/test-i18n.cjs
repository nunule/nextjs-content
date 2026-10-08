const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

const root = path.resolve(__dirname, "..")
const modules = new Map()
let cookieLocale

function loadSource(relative) {
  const filename = path.join(root, relative)
  if (modules.has(filename)) return modules.get(filename)
  const module = { exports: {} }
  modules.set(filename, module.exports)
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const localRequire = (name) => {
    if (name === "next/headers") return { cookies: () => ({ get: () => ({ value: cookieLocale }) }) }
    if (name === "next/navigation") return { useRouter: () => ({ refresh() {} }) }
    if (name.startsWith("@/")) return loadSource(`${name.slice(2)}.ts`)
    if (name.startsWith(".")) return loadSource(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)))
    return require(name)
  }
  vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, console }, { filename })
  return module.exports
}

const { zh, en, createTranslator, getCatalogMessageKey } = loadSource("lib/i18n/messages.ts")
const { getLocale, getTranslations } = loadSource("lib/i18n/server.ts")
assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort(), "both languages cover the same interface")
for (const key of Object.keys(zh)) {
  const placeholders = (value) => Array.from(value.matchAll(/\{(\w+)\}/g), (match) => match[1]).sort()
  for (const template of typeof en[key] === "string" ? [en[key]] : Object.values(en[key])) {
    assert.deepEqual(placeholders(template), placeholders(zh[key]), `${key}: interpolation values must match`)
    assert(template.trim(), `${key}: translation must not be empty`)
  }
}
for (const value of [undefined, "fr", "", "en-US", "__proto__"]) {
  cookieLocale = value
  assert.equal(getLocale(), "zh-CN", "missing or unsupported cookies fall back to Chinese")
}
cookieLocale = "en"
assert.equal(getLocale(), "en")
assert.equal(getTranslations()("nav.novels"), "Novels")
const t = createTranslator("en")
assert.equal(t("audio.count", { count: 1 }), "1 track")
assert.equal(t("audio.count", { count: 2 }), "2 tracks")
assert.equal(t("novel.chapterCount", { count: 0 }), "0 chapters")
assert.equal(t("audio.minutes", { count: 1 }), "1 minute")
assert.equal(t("novel.chapter", { number: 3, title: "山庄旧事" }), "Chapter 3: 山庄旧事", "original work titles remain unchanged")
assert.equal(t(getCatalogMessageKey(zh["catalog.partial"])), en["catalog.partial"])

const { LocaleProvider, Text } = loadSource("components/locale-provider.tsx")
for (const locale of ["zh-CN", "en"]) {
  const html = renderToStaticMarkup(React.createElement(LocaleProvider, { initialLocale: locale }, React.createElement(Text, { id: "nav.about" })))
  assert.equal(html, createTranslator(locale)("nav.about"), "first server render must use the selected language")
}
console.log("PASS: complete dictionaries, matching placeholders, English plurals, cookie validation, localized notices, unchanged work titles, first-render language")
