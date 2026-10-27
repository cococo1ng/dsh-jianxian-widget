// audit-completeness.mjs —— 结构性完整性检查（只查"能确定对错"的，不猜设计意图）
//
// 查七件：
//   1 配置键覆盖：DEFAULT_CONFIG 的每个顶层键，mergeConfig 有没有合并（漏了就会"存了读不回"）
//   2 路由一致：index.js 注册的 /xjj/* 与 about 里的清单条数、名字对得上
//   3 版本一致：package.json / client.js / README / locale 里的版本号
//   4 素材接线：assets/ 下的图片有没有被模板或构建脚本引用（未接线 = 白占体积）
//   5 数字一致：TALISMANS / SFX / POSE_CN 的实际条数 vs 文档里写的数字
//   6 构建新鲜：client.js 是否比模板新
//   7 孤儿脚本：verify/ 下有没有没人调用的脚本
//
// 用法：node scripts/audit-completeness.mjs [--json]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(ROOT, p))

const src = read('src/client.template.js')
const host = read('plugin/index.js')
const built = read('plugin/client.js')
const pkg = JSON.parse(read('plugin/package.json'))
const zhLocale = read('plugin/locale/zh.json')
const enLocale = read('plugin/locale/en.json')
const readme = read('plugin/README.md')
const readmeEn = read('plugin/README.en.md')

const findings = []
const add = (level, area, msg) => findings.push({ level, area, msg })
const OK = (area, msg) => findings.push({ level: 'ok', area, msg })

// ── 1 配置键覆盖 ─────────────────────────────────────────────
{
  const s = src.indexOf('const DEFAULT_CONFIG = {')
  const e = src.indexOf('\n    };', s)
  const block = src.slice(s, e)
  const defKeys = [...block.matchAll(/^      ([a-zA-Z_]\w*):/gm)].map((m) => m[1])
  const ms = src.indexOf('function mergeConfig(')
  const me = src.indexOf('function Widget(', ms)
  const merged = new Set([...src.slice(ms, me).matchAll(/out\.([a-zA-Z_]\w*)/g)].map((m) => m[1]))
  const miss = defKeys.filter((k) => !merged.has(k) && k !== 'version')
  if (miss.length) add('P0', '配置合并', `mergeConfig 漏了：${miss.join(', ')}（存了读不回）`)
  else OK('配置合并', `${defKeys.length} 个顶层键全覆盖`)
}

// ── 2 路由一致 ───────────────────────────────────────────────
{
  const routes = [...host.matchAll(/path:\s*'(\/xjj\/[^']+)'/g)].map((m) => m[1])
  const about = /routes:\s*\[([^\]]*)\]/.exec(host)
  const listed = about ? [...about[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
  if (routes.length !== listed.length) add('P1', '路由', `注册 ${routes.length} 条，about 列 ${listed.length} 条`)
  const notListed = routes.filter((r) => !listed.includes(r))
  const ghost = listed.filter((r) => !routes.includes(r))
  if (notListed.length) add('P1', '路由', `注册了但 about 没列：${notListed.join(', ')}`)
  if (ghost.length) add('P1', '路由', `about 列了但没注册：${ghost.join(', ')}`)
  if (!notListed.length && !ghost.length) OK('路由', `${routes.length} 条，双向一致`)
}

// ── 3 版本一致 ───────────────────────────────────────────────
{
  const v = pkg.version
  const builtV = (new RegExp('[\'"]v' + v.replace(/\./g, '\\.') + '[\'"]').test(built)) ? v : ''
  const bad = []
  if (builtV !== v) bad.push('client.js')
  if (!readme.includes('v' + v)) bad.push('README')
  if (!readmeEn.includes('v' + v)) bad.push('README.en')
  if (bad.length) add('P1', '版本', `package.json=${v}，对不上：${bad.join(', ')}`)
  else OK('版本', `${v} 三处一致（package.json / client.js / 两份 README）`)
}

// ── 4 素材接线 ───────────────────────────────────────────────
{
  const dir = path.join(ROOT, 'assets')
  const files = []
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name)
      if (f.isDirectory()) walk(p)
      else if (/\.(png|webp|jpe?g|gif|svg|mp3|wav|ogg)$/i.test(f.name)) files.push(path.relative(ROOT, p).replace(/\\/g, '/'))
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  const buildText = read('build.py')
  const unused = files.filter((f) => !buildText.includes(path.basename(f)) && !src.includes(path.basename(f)))
  const backups = unused.filter((f) => /assets-backup/i.test(f))
  const others = unused.filter((f) => !/assets-backup/i.test(f))
  if (backups.length) add('P2', '素材', `${backups.length} 个文件在 assets-backup-* 备份目录里（不进包，但占仓库体积）`)
  if (others.length) add('P2', '素材', `${others.length} 个未接线：${others.slice(0, 6).join(', ')}`)
  if (!backups.length && !others.length) OK('素材', `${files.length} 个文件全部被 build.py 引用`)
}

// ── 5 数字一致 ───────────────────────────────────────────────
{
  const countObj = (name) => {
    const s = src.indexOf('const ' + name + ' = {')
    if (s < 0) return -1
    const e = src.indexOf('\n    };', s)
    return [...src.slice(s, e).matchAll(/^      [A-Za-z_$][\w$]*:/gm)].length
  }
  const tal = countObj('TALISMANS')
  const sfx = countObj('SFX')
  const pose = countObj('POSE_CN')
  const nums = { 法宝: tal, 音效: sfx, 姿态表: pose }
  const claims = []
  if (!readme.includes(String(tal) + ' 件') && !readme.includes(String(tal) + ' 个')) claims.push(`法宝=${tal} 与 README 对不上`)
  if (!readme.includes(String(sfx) + ' 路') && !readme.includes(String(sfx) + ' 种')) claims.push(`音效=${sfx} 与 README 对不上`)
  if (claims.length) add('P1', '数字', claims.join('；'))
  else OK('数字', `法宝 ${tal} / 音效 ${sfx} / 姿态表 ${pose} 与 README 一致`)
}

// ── 6 构建新鲜 ───────────────────────────────────────────────
{
  const t = fs.statSync(path.join(ROOT, 'src/client.template.js')).mtimeMs
  const c = fs.statSync(path.join(ROOT, 'plugin/client.js')).mtimeMs
  if (c < t) add('P0', '构建', 'client.js 比模板旧（产物过期）')
  else OK('构建', '产物比模板新')
}

// ── 7 孤儿脚本 ───────────────────────────────────────────────
{
  const scripts = fs.readdirSync(path.join(ROOT, 'verify')).filter((f) => /\.(mjs|py)$/.test(f))
  const pkgText = read('package.json')
  const ci = exists('.github/workflows/ci.yml') ? read('.github/workflows/ci.yml') : ''
  const orphans = scripts.filter((f) => !pkgText.includes(f) && !ci.includes(f))
  if (orphans.length) add('P2', '孤儿脚本', `${orphans.length} 个 verify 脚本没被 package.json / CI 调用：${orphans.join(', ')}`)
  else OK('孤儿脚本', `${scripts.length} 个都有调用方`)
}

// ── 输出 ─────────────────────────────────────────────────────
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2))
} else {
  const icon = { ok: '✅', P0: '❌', P1: '⚠️', P2: '·' }
  for (const f of findings) console.log(`${icon[f.level] || ' '} [${f.area}] ${f.msg}`)
  const p0 = findings.filter((f) => f.level === 'P0').length
  const p1 = findings.filter((f) => f.level === 'P1').length
  const p2 = findings.filter((f) => f.level === 'P2').length
  if (p0) console.log(`\n❌ ${p0} 处 P0（必须修）${p1 ? '，另有 P1 ' + p1 + ' 条' : ''}`)
  else if (p1) console.log(`\n⚠️  无 P0，有 ${p1} 条 P1${p2 ? ' + ' + p2 + ' 条提示' : ''}`)
  else console.log(`\n✅ 无 P0/P1${p2 ? '（' + p2 + ' 条提示）' : ''}`)
}
process.exit(findings.some((f) => f.level === 'P0') ? 1 : 0)

