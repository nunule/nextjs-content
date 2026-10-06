const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const crypto = require("node:crypto")
const ts = require("typescript")

const root = path.resolve(__dirname, "..")
const env = {
  IMAGEKIT_PRIVATE_KEY: "test-private-key",
  IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
  IMAGEKIT_CACHE_SECONDS: "0",
}
const requests = []
const files = [
  "/media/202601006/10_尾声.mp3",
  "/media/202601006/2_故事.wav",
  "/media/202601006/3_片段.WAV",
  "/media/202601006/1_开篇.mp3",
  "/media/20250101/1_旧日.MP3",
  "/media/202601006/无编号.mp3",
  "/media/202601006/3_图片.jpg",
  "/media/202601006/subfolder/4_隐藏.mp3",
  "/other/202601006/1_其他.mp3",
].map((filePath) => ({ filePath, name: path.basename(filePath), type: "file" }))

function loadSource(relative, modules = new Map()) {
  const filename = path.join(root, relative)
  if (modules.has(filename)) return modules.get(filename)
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  modules.set(filename, module.exports)
  const localRequire = (name) => name.startsWith("@/")
    ? loadSource(`${name.slice(2)}.ts`, modules)
    : require(name)
  vm.runInNewContext(output, {
    exports: module.exports, module, require: localRequire,
    process: { env }, Buffer, URL, URLSearchParams, Date, console, TextDecoder,
    fetch: async (url) => {
      requests.push(String(url))
      const query = new URL(url).searchParams.get("searchQuery") || ""
      if (String(url).startsWith("https://api.imagekit.io/")) {
        return { ok: true, json: async () => query.includes("/media/") ? files : [
          { filePath: "/novels/book.mdx", name: "book.mdx", url: "https://ik.imagekit.io/test/novels/book.mdx" },
          { filePath: "/novels/book/chapters/001_test.mdx", name: "001_test.mdx", url: "https://ik.imagekit.io/test/novels/book/chapters/001_test.mdx" },
        ] }
      }
      const text = String(url).includes("/chapters/")
        ? "---\ntitle: 第一章\nchapterNumber: 1\n---\n\n章节正文。"
        : "---\ntitle: 测试小说\nstatus: 连载中\n---\n\n真正的简介内容。"
      return { ok: true, arrayBuffer: async () => Uint8Array.from(Buffer.from(text)).buffer }
    },
  }, { filename })
  return module.exports
}

async function main() {
  const { getAudioCatalog, getAudioAsset } = loadSource("lib/media-source.ts")
  const { getImageKitConfig, signImageKitUrl } = loadSource("lib/imagekit.ts")
  const catalog = await getAudioCatalog()
  assert.equal(catalog.configured, true)
  assert.equal(catalog.error, undefined)
  assert.deepEqual(Array.from(catalog.groups, (group) => group.date), ["202601006", "20250101"])
  assert.deepEqual(Array.from(catalog.groups[0].tracks, (track) => track.order), [1, 2, 3, 10])
  assert.equal(catalog.groups[0].tracks[1].fileName, "2_故事.wav")
  assert.equal(catalog.groups[0].tracks[1].title, "故事")
  assert.equal(catalog.groups[0].tracks[2].fileName, "3_片段.WAV")
  assert.equal(catalog.groups[0].tracks[0].title, "开篇")
  assert.equal(requests.length, 1, "listing must not download audio")
  assert(!JSON.stringify(catalog).includes(env.IMAGEKIT_PRIVATE_KEY))
  const track = catalog.groups[0].tracks[0]
  assert.equal((await getAudioAsset(track.id, getImageKitConfig())).filePath, "/media/202601006/1_开篇.mp3")
  assert.equal(await getAudioAsset("unknown", getImageKitConfig()), undefined)
  const url = new URL(signImageKitUrl("https://ik.imagekit.io/test/media/202601006/1_开篇.mp3", getImageKitConfig(), 86400))
  const toSign = `${url.pathname.slice("/test/".length)}${url.searchParams.get("ik-t")}`
  assert.equal(url.searchParams.get("ik-s"), crypto.createHmac("sha1", env.IMAGEKIT_PRIVATE_KEY).update(toSign).digest("hex"))
  assert.throws(() => signImageKitUrl("https://example.com/test.mp3", getImageKitConfig()))
  const { getNovelCatalog } = loadSource("lib/novel-source.ts")
  const novels = await getNovelCatalog()
  assert.equal(novels.novels[0].summary, "真正的简介内容。")
  assert.equal(novels.novels[0].chapters.length, 1)
  assert.equal(novels.novels[0].chapters[0].content, "章节正文。")
  const { GET } = loadSource("app/api/media/[trackId]/route.ts")
  const playback = await GET(new Request("http://localhost/api/media/test"), { params: { trackId: track.id } })
  assert.equal(playback.status, 307)
  assert.equal(playback.headers.get("cache-control"), "private, no-store")
  assert(new URL(playback.headers.get("location")).searchParams.has("ik-s"))
  const wavPlayback = await GET(new Request("http://localhost/api/media/test"), { params: { trackId: catalog.groups[0].tracks[1].id } })
  assert.equal(wavPlayback.status, 307)
  assert(new URL(wavPlayback.headers.get("location")).pathname.endsWith(".wav"))
  assert(new URL(wavPlayback.headers.get("location")).searchParams.has("ik-s"))
  assert.equal((await GET(new Request("http://localhost/api/media/unknown"), { params: { trackId: "unknown" } })).status, 404)
  delete env.IMAGEKIT_PRIVATE_KEY
  assert.equal((await getAudioCatalog()).configured, false)
  assert.equal((await GET(new Request("http://localhost/api/media/test"), { params: { trackId: track.id } })).status, 503)
  console.log("PASS: mixed MP3/WAV ordering, case-insensitive extensions, folder filtering, lazy audio, private URL signing, redirect/404/503, novel summary regression")
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
