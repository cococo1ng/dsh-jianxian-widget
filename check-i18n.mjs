// check-i18n.mjs —— 译文表覆盖率守卫（跟随语言自动切换的实现基础）
//
// 机制：构建时把源码里带中文的字符串字面量包成 __xjjT('…')，运行时按语言查 src/i18n/en.json。
// 这里查三件事：
//   ① 源码里每一句中文（长度 ≤300 的字面量）都能在译文表里找到 —— 漏一条，英文界面就会冒出中文；
//   ② 译文表里没有中文（防止复制粘贴时把原文塞进 value）；
//   ③ 构建产物里实际调用的 __xjjT key 都能查到译文 —— 源码扫的是"写没写"，这里扫的是"产物真的调了什么"。
// 注释里的中文不算（不参与界面）。
//
// 用法：node check-i18n.mjs
// 测试用环境变量：XJJ_I18N_DICT / XJJ_I18N_CLIENT 可指向副本（变异体测试用）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CJK = /[\u4e00-\u9fff]/
const LIT = /'[^'\n]*'|"[^"\n]*"|`[^`]*`/g

const files = ['src/client.template.js', 'src/host.web.js']
const DICT_PATH = process.env.XJJ_I18N_DICT || path.join(ROOT, 'src/i18n/en.json')
const CLIENT_PATH = process.env.XJJ_I18N_CLIENT || path.join(ROOT, 'plugin/client.js')
const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'))
const keys = new Set(Object.keys(dict).map((k) => k.trim()))

const missing = new Map() // 原文 -> 出现文件数
let seen = 0

for (const rel of files) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  for (const m of src.matchAll(LIT)) {
    const body = m[0].slice(1, -1)
    if (body.length > 300) continue // 大段 CSS，里面只有字体名
    if (!CJK.test(body)) continue
    seen += 1
    const key = body.trim()
    if (!keys.has(key)) missing.set(key, (missing.get(key) || 0) + 1)
  }
}

const badValues = Object.entries(dict).filter(([, v]) => CJK.test(String(v)))

if (badValues.length) {
  console.error('❌ 译文表里有 ' + badValues.length + ' 条译文还含中文：')
  for (const [k, v] of badValues.slice(0, 10)) console.error('  - ' + k + ' → ' + v)
  process.exit(1)
}
if (missing.size) {
  console.error('❌ 有 ' + missing.size + ' 条中文没有译文（补 src/i18n/en.json）：')
  for (const [k, n] of [...missing].slice(0, 25)) console.error('  - ' + k + (n > 1 ? '（' + n + ' 处）' : ''))
  process.exit(1)
}

const unused = [...keys].filter((k) => k && !files.some((rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').includes("'" + k + "'")))
console.log('✅ 译文表覆盖完整：源码 ' + seen + ' 处中文字面量 · 表内 ' + keys.size + ' 条 · 未用到的 ' + unused.length + ' 条')

// ② 构建产物交叉验证：源码扫的是"写没写译文"，这里扫的是"产物真的调了什么"
// 运行时 t() 是 trim 后查表再还原空白，所以这里也必须按 trim 查。
if (!fs.existsSync(CLIENT_PATH)) {
  console.log('⏭  构建产物不存在（还没 build），跳过交叉验证')
} else {
  const built = fs.readFileSync(CLIENT_PATH, 'utf8')
  const calls = [...built.matchAll(/__xjjT\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map((m) => m[1])
  const uniq = [...new Set(calls)]
  const spaced = Object.keys(dict).filter((k) => k !== k.trim())
  const miss = uniq.filter((k) => !(k.trim() in dict))
  const cjk = uniq.filter((k) => k.trim() in dict && CJK.test(String(dict[k.trim()])))
  const empty = uniq.filter((k) => k.trim() in dict && String(dict[k.trim()]).trim() === '')

  const bad = []
  if (spaced.length) bad.push('译文表里有 ' + spaced.length + ' 个键带首尾空格（永远命不中）：' + spaced.slice(0, 3).map((k) => '[' + k + ']').join(' '))
  if (miss.length) bad.push('构建产物里有 ' + miss.length + ' 个 key 查不到译文（英文界面会冒中文）：' + miss.slice(0, 5).join(' / '))
  if (cjk.length) bad.push('有 ' + cjk.length + ' 条译文还含中文：' + cjk.slice(0, 5).map((k) => k + ' → ' + dict[k.trim()]).join(' / '))
  if (empty.length) bad.push('有 ' + empty.length + ' 条译文为空：' + empty.slice(0, 5).join(' / '))

  if (bad.length) {
    console.error('❌ 构建产物交叉验证失败：')
    for (const b of bad) console.error('  - ' + b)
    process.exit(1)
  }
  console.log('✅ 构建产物交叉验证：' + calls.length + ' 处调用 / ' + uniq.length + ' 个唯一 key · 缺译 0 · 中文残留 0 · 空值 0')
}
