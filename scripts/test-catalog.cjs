const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")

const root = path.resolve(__dirname, "..")

function createCatalog() {
  const state = {
    now: 1_000_000,
    listCalls: 0,
    active: 0,
    maxActive: 0,
    failed: new Set(),
    failList: false,
    revision: "初稿",
    files: ["/novels/book.mdx", ...Array.from({ length: 9 }, (_, i) => `/novels/book/chapters/${String(i + 1).padStart(3, "0")}_chapter.mdx`)],
  }
  const env = { IMAGEKIT_PRIVATE_KEY: "test-key", IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test", IMAGEKIT_CACHE_SECONDS: "60" }
  class TestDate extends Date { static now() { return state.now } }
  const modules = new Map()
  function load(relative) {
    const filename = path.join(root, relative)
    if (modules.has(filename)) return modules.get(filename)
    const module = { exports: {} }
    modules.set(filename, module.exports)
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require: (name) => name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : require(name),
      process: { env }, Buffer, URL, URLSearchParams, Date: TestDate, TextDecoder, AbortSignal,
      console: { error() {} },
      fetch: async (url, options) => {
        assert(options.signal, "remote requests must have a timeout signal")
        if (String(url).startsWith("https://api.imagekit.io/")) {
          state.listCalls += 1
          await new Promise(setImmediate)
          if (state.failList) throw new Error("offline")
          return { ok: true, json: async () => state.files.map((filePath) => ({ filePath, fileId: filePath, name: path.basename(filePath), type: "file" })) }
        }
        state.active += 1
        state.maxActive = Math.max(state.maxActive, state.active)
        await new Promise(setImmediate)
        state.active -= 1
        const filePath = new URL(url).pathname.replace("/test", "")
        if (state.failed.has(filePath)) throw new Error("temporary download failure")
        const number = Number(path.basename(filePath).slice(0, 3))
        const text = filePath.includes("/chapters/")
          ? `---\ntitle: 章节${number}\nchapterNumber: ${number}\n---\n\n${state.revision}正文${number}`
          : "---\ntitle: 测试小说\nslug: book\n---\n\n简介。"
        return { ok: true, arrayBuffer: async () => Uint8Array.from(Buffer.from(text)).buffer }
      },
    }, { filename })
    return module.exports
  }
  return { state, ...load("lib/novel-source.ts") }
}

async function main() {
  const catalog = createCatalog()
  const { state } = catalog
  const [first, simultaneous] = await Promise.all([catalog.getNovelCatalog(), catalog.getNovelCatalog()])
  assert.equal(state.listCalls, 1, "concurrent page and metadata reads share one refresh")
  assert.equal(first.novels[0].chapters.length, 9)
  assert.equal(simultaneous.novels[0].chapters.length, 9)
  assert(state.maxActive <= 6, "downloads are bounded to avoid saturating the remote service")
  await catalog.getNovelCatalog()
  assert.equal(state.listCalls, 1, "fresh cache avoids downloading the library again")

  state.now += 61_000
  state.failed.add(state.files[3])
  state.revision = "新版"
  const degraded = await catalog.getNovelCatalog()
  assert.match(degraded.warning, /上次成功/)
  assert.equal(degraded.novels[0].chapters.length, 9, "failed chapter cannot disappear from a previously complete directory")
  assert.equal(degraded.novels[0].chapters[2].content, "初稿正文3")
  state.failed.clear()
  const recovered = await catalog.getNovelCatalog()
  assert.equal(recovered.warning, undefined, "retry immediately recovers instead of caching an incomplete result")
  assert.equal(recovered.novels[0].chapters[2].content, "新版正文3")

  state.now += 61_000
  state.failList = true
  assert.match((await catalog.getNovelCatalog()).warning, /上次成功/)
  state.now += 11 * 60_000
  const expired = await catalog.getNovelCatalog()
  assert(expired.error, "old fallback content eventually expires")
  assert.equal(expired.novels.length, 0)

  const cold = createCatalog()
  cold.state.failed.add(cold.state.files[3])
  const partial = await cold.getNovelCatalog()
  assert.match(partial.warning, /不完整/, "a first-load failure must be visible to the reader")
  assert.equal(partial.novels[0].chapters.length, 8)
  cold.state.failed.clear()
  assert.equal((await cold.getNovelCatalog()).novels[0].chapters.length, 9)

  const offline = createCatalog()
  offline.state.files.forEach((file) => offline.state.failed.add(file))
  assert((await offline.getNovelCatalog()).error, "all failed downloads are an error, not an empty library")
  offline.state.failed.clear()
  assert.equal((await offline.getNovelCatalog()).novels[0].chapters.length, 9)

  state.failList = false
  state.files.splice(3, 1)
  const deleted = await catalog.getNovelCatalog()
  assert.equal(deleted.warning, undefined)
  assert.equal(deleted.novels[0].chapters.length, 8, "a confirmed remote deletion still updates the directory")
  console.log("PASS: bounded downloads, shared refresh, fresh cache, failure fallback, partial warnings, immediate recovery, expiry, confirmed deletion")
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
