// check-docs.mjs —— 中英文档对账（补 check-i18n / check-copy 管不到的那块）
//
// 背景：2026-10-27 加 test:surface 后，界面文案一个字没动（check-i18n 全绿），
// 但两份 README 的「npm test 跑什么」全过时了，中英都不对。
// 这类改动不走 i18n、不碰 locale，靠人眼对——结果就是靠人提醒。
//
// 这里查两件：
//   D1 中英 README 的可执行命令集合必须一致（python3 归一成 python）
//   D2 README 里写的 `npm run <x>` 必须在 package.json scripts 里（防过时）
//
// 不查代码块数量：中英排版本来就不一一对应，数量对不上是噪音，不是漏译。
//
// 用法：node check-docs.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''))
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const pkg = JSON.parse(read('package.json'))
const scripts = new Set(Object.keys(pkg.scripts || {}))

const PAIRS = [
  ['README.md', 'README.en.md'],
  ['plugin/README.md', 'plugin/README.en.md'],
]
const CMD_PATTERNS = [
  /npm run ([a-z][\w:]*)/gi,
  /node ([\w./-]+\.mjs)/gi,
  /python3? ([\w./-]+\.py)/gi,
]

const norm = (s) => s.replace(/^python3 /, 'python ').replace(/\s+/g, ' ').trim()

function commands(text) {
  const set = new Set()
  for (const re of CMD_PATTERNS) for (const m of text.matchAll(re)) set.add(norm(m[0]))
  return set
}

const problems = []
let checks = 0

for (const [zh, en] of PAIRS) {
  const a = commands(read(zh))
  const b = commands(read(en))
  const onlyZh = [...a].filter((x) => !b.has(x))
  const onlyEn = [...b].filter((x) => !a.has(x))
  checks += 1
  if (onlyZh.length || onlyEn.length) {
    problems.push(
      `${zh} / ${en} 命令不一致：中文独有 [${onlyZh.join(', ') || '—'}]，英文独有 [${onlyEn.join(', ') || '—'}]`
    )
  }
}

// D2：README 引用的 npm script 必须存在
for (const f of ['README.md', 'README.en.md', 'plugin/README.md', 'plugin/README.en.md']) {
  for (const m of read(f).matchAll(/npm run ([a-z][\w:]*)/g)) {
    checks += 1
    if (!scripts.has(m[1])) problems.push(`${f} 写了 npm run ${m[1]}，但 package.json 没这个 script`)
  }
}

// D3：CHANGELOG 中英对齐——最新版必须一致，英文不能有中文没有的版本
{
  const vers = (t) => [...t.matchAll(/^## (\d+\.\d+\.\d+)/gm)].map((m) => m[1])
  const zhV = vers(read('CHANGELOG.md'))
  checks += 1
  if (!fs.existsSync(path.join(ROOT, 'CHANGELOG.en.md'))) {
    problems.push('CHANGELOG.en.md 不存在（既然承诺双语就要维护）')
  } else {
    const enV = vers(read('CHANGELOG.en.md'))
    if (zhV[0] !== enV[0]) problems.push(`CHANGELOG 最新版不一致：zh=${zhV[0] || '?'} en=${enV[0] || '?'}`)
    const extra = enV.filter((v) => !zhV.includes(v))
    if (extra.length) problems.push(`CHANGELOG.en 有中文版没有的版本：${extra.join(', ')}`)
  }
}

// D4：两份 README 的章节数必须一致（中文加了节、英文没加 = 两边读者拿到的信息不同）
for (const [zh, en] of [
  ['README.md', 'README.en.md'],
  ['plugin/README.md', 'plugin/README.en.md'],
]) {
  checks += 1
  const count = (t) => (t.match(/^## /gm) || []).length
  const a = count(read(zh))
  const b = count(read(en))
  if (a !== b) problems.push(`${zh}（${a} 节）与 ${en}（${b} 节）章节数不同`)
}

// D5：对外功能必须在两份 README 里都有说明（防"功能做了、文档没写"）
const FEATURE_WORDS = [
  { name: '衣装/outfit', zh: ['ui.outfit', '衣装'], en: ['ui.outfit', 'outfit'] },
  { name: '背光/backlight', zh: ['ui.glow', '背光'], en: ['ui.glow', 'backlight'] },
]
for (const f of FEATURE_WORDS) {
  checks += 1
  const zhText = read('README.md')
  const enText = read('README.en.md')
  const zhOk = f.zh.some((w) => zhText.includes(w))
  const enOk = f.en.some((w) => enText.includes(w))
  if (!zhOk || !enOk) {
    problems.push(`README 缺功能说明：${f.name}（中文 ${zhOk ? '有' : '无'} / 英文 ${enOk ? '有' : '无'}）`)
  }
}

if (problems.length) {
  console.error(`❌ 文档对账失败（${problems.length} 处 / 共 ${checks} 项）：`)
  for (const p of problems) console.error('  - ' + p)
  process.exit(1)
}
console.log(`✅ 文档对账通过：中英命令一致、npm script 全部存在（${checks} 项）`)
