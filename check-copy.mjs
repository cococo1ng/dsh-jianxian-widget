// check-copy.mjs —— 文案与数字一致性闸门（防"改了代码没改说明 / 改了说明改错文件"）
//
// 为什么要有：2026-10-26 一晚上踩了两次同类错——
//   ① 说明书重写了但版本号、已删功能没对账（E-142）
//   ② 插件说明改了 package.json，真源其实在 locale/*.json（E-143）
// 这两条靠记性都防不住，只能靠机器查：把"事实从代码里算出来"，再去四份文案里核对。
//
// 查什么：
//   A. 过时短语（已经删掉的功能还写在文案里）
//   B. 关键数字（常驻姿态数 / 剑舞帧数 / 法宝数 / 音效数）与代码算出来的一致
//   C. 版本号：package.json 与面板版本行、locale 标题旁的版本若出现，必须一致
//
// 用法：node check-copy.mjs     （不通过退出码 1）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const tpl = read('src/client.template.js')
const pkg = JSON.parse(read('plugin/package.json'))
const zh = read('plugin/locale/zh.json')
const en = read('plugin/locale/en.json')
const readme = read('plugin/README.md')

// —— 事实：从代码里现算，不写死 ——
const poseBlock = /const POSES = \{([\s\S]*?)\n    \};/.exec(tpl)[1]
const poseKeys = [...poseBlock.matchAll(/^\s*([A-Za-z0-9_]+):\s*'__POSE/gm)].map((m) => m[1])
// sleep 是“睡着了”的状态别名（图与打盹同一张），不是独立动作，不计入姿态数
const staticPoses = poseKeys.filter((k) => !k.startsWith('dance') && k !== 'sleep').length
const danceFrames = poseKeys.filter((k) => k.startsWith('dance')).length
const talismans = [...(/const TALISMAN_ORDER = \[([\s\S]*?)\]/.exec(tpl)[1].matchAll(/'([a-z]+)'/g))].length
const soundKeys = [...(/sound: \{ on: true([\s\S]*?)\},/.exec(tpl)[1].matchAll(/([a-z]+):\s*true/g))]
  .map((m) => m[1]).length   // on 是总开关，不算一路音效
const panelRaw = /xjj-val', style: \{ color: [^}]+ \} \}, '([^']+)'/.exec(tpl)[1]
// 面板版本行自 v4.14.0 起写占位符 __XJJ_VERSION__，由 build.py 从 package.json 注入 —— 单一真源，不会漂移
const panelVersion = panelRaw.replace('__XJJ_VERSION__', String(pkg.version))

const fails = []
const ok = (cond, msg, detail) => {
  if (cond) return
  fails.push(msg + (detail === undefined ? '' : ' → ' + detail))
}
const has = (text, needle) => text.indexOf(needle) >= 0

// —— A. 过时短语：删掉的功能不许残留在文案里 ——
const STALE = [
  '40 个姿态', '24 个常驻', '12 件法宝', '21 个姿态',
  '长按 0.52', '长按人物', '走火入魔', '连点 5 下就走火',
]
for (const [name, text] of [['locale/zh', zh], ['locale/en', en], ['package.json', pkg.description], ['README', readme]]) {
  for (const s of STALE) ok(!has(text, s), `过时短语「${s}」还在 ${name} 里`)
}

// —— B. 关键数字：文案里的数字必须与代码一致 ——
const zhNums = [
  [`${staticPoses} 个常驻姿态`, 'zh 常驻姿态数'],
  [`${talismans} 件法宝`, 'zh 法宝数'],
  [`${soundKeys} 路音效`, 'zh 音效数'],
]
for (const [needle, label] of zhNums) ok(has(zh, needle), `locale/zh 缺「${needle}」（${label}）`)
const enNums = [
  [`${staticPoses} standing poses`, 'en 常驻姿态数'],
  [`${talismans} talisman`, 'en 法宝数'],
  [`${soundKeys} switchable sounds`, 'en 音效数'],
]
for (const [needle, label] of enNums) ok(has(en, needle), `locale/en 缺「${needle}」（${label}）`)
ok(has(readme, `${staticPoses} 个常驻`), `README 缺「${staticPoses} 个常驻」`)
ok(has(readme, `${danceFrames} 帧剑舞`) || has(readme, `${danceFrames} 帧`), `README 缺「${danceFrames} 帧剑舞」`)
ok(has(readme, `${talismans} 件法宝`), `README 缺「${talismans} 件法宝」`)
ok(has(pkg.description, `${staticPoses} 个常驻`), `package.json 描述缺「${staticPoses} 个常驻」`)

// —— C. 版本号三处一致（面板 / package / README 头部）——
const want = String(pkg.version)
// 根 package.json 只管构建脚本，但版本号必须跟插件包同步（对外发版时两处对不上最丢人）
const rootPkg = JSON.parse(read('package.json'))
ok(String(rootPkg.version) === want, `根 package.json 版本 ${rootPkg.version} ≠ plugin/package.json ${want}`)
ok(panelRaw.indexOf('__XJJ_VERSION__') >= 0, `面板版本行没走 __XJJ_VERSION__ 占位符（现在写死成 ${panelRaw}，会和 package.json 漂移）`)
ok(/^v?\d/.test(panelVersion), '面板版本行格式不对', panelVersion)
ok(panelVersion.replace(/^v/, '').split('.').slice(0, 2).join('.') === want.split('.').slice(0, 2).join('.'),
  `面板版本 ${panelVersion} 与 package.json ${want} 的前两段不一致`)
const readmeVer = /版本 \| \*\*v?([\d.]+)\*\*/.exec(readme)
if (readmeVer) {
  ok(readmeVer[1] === want, `README 版本 ${readmeVer[1]} ≠ package.json ${want}`)
} else {
  fails.push('README 里找不到「| 版本 | **vX.Y.Z** |」这一行（版本对账会失效）')
}

// —— D. 中英同步（2026-10-26 冬冬哥定：中文改哪，英文必须同改）——
let readmeEn = ''
try { readmeEn = read('plugin/README.en.md') } catch { readmeEn = '' }
ok(!!readmeEn, '缺 plugin/README.en.md（中文改了，英文版必须同步）')
if (readmeEn) {
  ok(has(readmeEn, `${staticPoses} standing poses`), `README.en 缺「${staticPoses} standing poses」`)
  ok(has(readmeEn, `${danceFrames}-frame sword dance`) || has(readmeEn, `${danceFrames} frames`),
    `README.en 缺「${danceFrames}-frame sword dance」`)
  ok(has(readmeEn, `${talismans} talismans`) || has(readmeEn, `| ${talismans} |`), `README.en 缺「${talismans} talismans」`)
  const verEn = /Version \| \*\*v?([\d.]+)\*\*/.exec(readmeEn)
  if (verEn) ok(verEn[1] === want, `README.en 版本 ${verEn[1]} ≠ package.json ${want}`)
  else fails.push('README.en 里找不到「| Version | **vX.Y.Z** |」这一行')
  // 姿态表：编号序列必须与中文版逐行一致
  const zhRows = [...readme.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => m[1])
  const enRows = [...readmeEn.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => m[1])
  ok(zhRows.length === enRows.length, `中英姿态表行数不同：中文 ${zhRows.length} 行 / 英文 ${enRows.length} 行`)
  ok(zhRows.join(',') === enRows.join(','), `中英姿态表编号不一致：中文 ${zhRows.join(',')} / 英文 ${enRows.join(',')}`)
  // locale 两份键必须一致
  const zhL = Object.keys(JSON.parse(read('plugin/locale/zh.json'))).sort().join(',')
  const enL = Object.keys(JSON.parse(read('plugin/locale/en.json'))).sort().join(',')
  ok(zhL === enL, `locale/zh 与 locale/en 键不同：${zhL} / ${enL}`)
}

if (fails.length) {
  console.error('❌ 文案与代码不一致 ' + fails.length + ' 处：')
  for (const f of fails) console.error('  - ' + f)
  process.exit(1)
}
console.log(`✅ 文案一致：${staticPoses} 常驻 + ${danceFrames} 帧剑舞 · ${talismans} 法宝 · ${soundKeys} 音效 · v${want}`)

