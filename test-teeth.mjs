// test-teeth.mjs —— 守卫"门齿"验收：变异体 + 静态审计 + 自检，一次跑完
//
// 为什么要有它：断言绿，只证明"当前代码符合断言"；它不证明**断言本身会红**。
// 今晚真踩过的两种假绿：
//   ① 守卫红了，但红的原因跟改动无关（test-billing 只按周末判单价，夜里跑就假红）
//   ② 变异体等于原版（锚点没命中），却当成"守卫没抓住"或"守卫抓住了"
// 所以这里对每个变异体同时校验两件事：**退出码非零** + **命中期望的断言标签**。
//
// 流程：静态审计（含自检）→ 基线两套测试必须全绿 → 逐个变异体改坏副本 → 守卫必须按预期变红
// 用法：node test-teeth.mjs        （不改真实插件：全部在临时目录的副本里做）
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const NODE = process.execPath

const MUTANTS = [
  {
    id: 'M1 拆掉写栅栏',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: "if (String(head['x-xjj-write'] || '') !== '1') return",
    replace: "if (false && String(head['x-xjj-write'] || '') !== '1') return",
    expect: '缺标记头必须 403',
  },
  {
    id: 'M2 turn/end 不清挂起',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: "if (type === 'turn/start' || type === 'turn/end') { waitState.pending = null; return }",
    replace: "if (type === 'turn/start') { waitState.pending = null; return }",
    expect: 'turn/end 必须兜底清空',
  },
  {
    id: 'M3 过期明细不进归档',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: 'if (dropped.length) pushArchive(dropped)',
    replace: 'if (false) pushArchive(dropped)',
    expect: '过期明细进了归档文件',
  },
  {
    id: 'M4 漏计缓存写入',
    file: 'plugin/index.js',
    guard: 'test-billing.mjs',
    find: '+ ((input + cacheWrite) / 1e6) * price.miss[off]',
    replace: '+ (input / 1e6) * price.miss[off]',
    expect: '含缓存写入',
  },
  {
    id: 'M5 构建闸门恒 false',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: 'const stale = !!(client && template && Date.parse(template.at) > Date.parse(client.at) + 60000)',
    replace: 'const stale = false',
    expect: '模板更新时要报 stale',
  },
  {
    id: 'M6 路由清单少一条',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: "'/xjj/wait.json', '/xjj/usage.json', '/xjj/about.json'",
    replace: "'/xjj/wait.json', '/xjj/about.json'",
    expect: '路由清单 8 条',
  },
  {
    id: 'M7 提问不再挂起',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: "if (type === 'tool/call' && String(d.name || d.toolName || '') === 'ask_user_question') {",
    replace: "if (false && type === 'tool/call') {",
    expect: '提问要挂起并带 callId',
  },
  {
    id: 'M8 价格闸门不看路由',
    file: 'plugin/index.js',
    guard: 'test-billing.mjs',
    find: "if (provider && OFFICIAL_PROVIDERS.indexOf(String(provider).toLowerCase()) < 0) return null",
    replace: "if (false && provider) return null",
    expect: '第三方路由上的同名模型不按官方价算',
  },
  // M12 / M13：写栅栏除"标记头"之外的另两道。M1 只证明缺头会拒，
  // 不证明"伪造 Host"和"非回环来源"这两道还在 —— 它们各自独立，得各配一个变异体。
  {
    id: 'M12 放行伪造 Host',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: 'if (!hostOk) return',
    replace: 'if (false && !hostOk) return',
    expect: '伪造 Host 必须 403',
  },
  {
    id: 'M13 放行非回环来源',
    file: 'plugin/index.js',
    guard: 'test-routes.mjs',
    find: 'if (!isLoopbackAddr(remoteAddrOf(req))) return',
    replace: 'if (false && !isLoopbackAddr(remoteAddrOf(req))) return',
    expect: '非回环来源必须 403',
  },
]

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, Object.assign({ encoding: 'utf8', timeout: 180000 }, opts))
  return { code: r.status, out: String(r.stdout || ''), err: String(r.stderr || ''), text: String(r.stdout || '') + String(r.stderr || '') }
}

// —— 0a. 文案一致性：数字/过时短语/版本号必须与代码对得上（E-142 / E-143 的机械防线）——
const copyCheck = run(NODE, ['check-copy.mjs'], { cwd: ROOT })
if (copyCheck.code !== 0) {
  console.error('❌ 文案与代码不一致：')
  console.error(copyCheck.text)
  process.exit(1)
}
console.log('✅ 文案一致性通过')

// —— 0. 静态审计 + 自检（审计自己也要证明"写坏必报"）——
const auditSelf = run(NODE, ['audit-teeth.mjs', '--selftest'], { cwd: ROOT })
if (auditSelf.code !== 0) {
  console.error('❌ 静态审计没通过自检（它自己咬不动）：')
  console.error(auditSelf.text)
  process.exit(1)
}
const audit = run(NODE, ['audit-teeth.mjs'], { cwd: ROOT })
if (audit.code !== 0) {
  console.error('❌ 静态审计有发现：')
  console.error(audit.text)
  process.exit(1)
}
console.log('✅ 静态审计 + 自检通过')

// —— 1. 在临时目录搭一份副本（不碰真实插件）——
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-teeth-'))
const copy = (from, to) => fs.cpSync(path.join(ROOT, from), path.join(TMP, to), { recursive: true })
copy('plugin', 'plugin')
fs.mkdirSync(path.join(TMP, 'src'), { recursive: true })
copy('src/client.template.js', 'src/client.template.js')
for (const g of ['test-routes.mjs', 'test-billing.mjs']) copy(g, g)
// 副本里的时间戳必须自己钉死：产物比模板新，否则"构建是最新的"这条断言会假红
// （cpSync 保留源 mtime 与否随平台/版本不同 —— 今晚就踩到过一次，别靠默认行为）
const now = Date.now()
fs.utimesSync(path.join(TMP, 'plugin', 'client.js'), new Date(now - 60 * 1000), new Date(now - 60 * 1000))
fs.utimesSync(path.join(TMP, 'src', 'client.template.js'), new Date(now - 10 * 60 * 1000), new Date(now - 10 * 60 * 1000))

const target = path.join(TMP, 'plugin', 'index.js')
const pristine = fs.readFileSync(target, 'utf8')
const write = (text) => fs.writeFileSync(target, text, 'utf8')

// —— 2. 基线：原版必须全绿，否则"变异后变红"说明不了任何事 ——
let bad = 0
console.log('\n基线（原版副本）：')
for (const g of ['test-routes.mjs', 'test-billing.mjs']) {
  const r = run(NODE, [g], { cwd: TMP })
  const okBaseline = r.code === 0
  if (!okBaseline) bad += 1
  console.log(`  ${okBaseline ? '✅' : '❌'} ${g} exit=${r.code}`)
  if (!okBaseline) console.log(r.text.split('\n').slice(-12).join('\n'))
}
if (bad) {
  console.error('\n❌ 基线不绿，无法判断门齿（问题在守卫本身，不在变异体）')
  console.error('   副本保留在：' + TMP)
  process.exit(1)
}

// —— 3. 逐个变异体 ——
console.log('\n变异体（改坏副本 ⇒ 守卫必须按预期变红）：')
const rows = []
for (const m of MUTANTS) {
  const hits = pristine.split(m.find).length - 1
  if (hits !== 1) {
    rows.push({ id: m.id, verdict: '锚点异常', detail: `锚点命中 ${hits} 次（必须 1 次）= 变异体等于原版，假绿` })
    bad += 1
    continue
  }
  write(pristine.split(m.find).join(m.replace))
  const r = run(NODE, [m.guard], { cwd: TMP })
  write(pristine)
  const red = r.code !== 0
  const rightReason = r.text.includes(m.expect)
  let verdict
  if (red && rightReason) verdict = '✅ 有门齿'
  else if (!red) verdict = '❌ 没变红'
  else verdict = '❌ 红了但原因不对'
  if (verdict !== '✅ 有门齿') bad += 1
  rows.push({ id: m.id, verdict, detail: `exit=${r.code} · 期望标签「${m.expect}」${rightReason ? '命中' : '未命中'}` })
}

for (const r of rows) console.log(`  ${r.verdict}  ${r.id}  ${r.detail}`)

// —— 3b. 几何守卫（verify/geometry.py）的门齿：改坏产物 ⇒ 量 DOM 的断言必须红 ——
// 为什么单独一组：几何断言量的是浏览器里的真实矩形，属于"慢门齿"，不进上面那套 node 变异体。
const GEO_MUTANTS = [
  {
    id: 'M9 抬升不看姿态',
    find: 'const fit = dancing ? 1 : ((LAYOUT.poseFit || {})[poseName] || 1);',
    replace: 'const fit = 1;',
    expect: '法宝到头顶',
  },
  {
    // 2026-10-27：立绘补偿改写法后（shift 按 倍率×镜像方向 换算、由未位移边直接解），
    // 这条变异体的锚点跟着换到新代码行 —— 改了被锚定的代码就必须同轮改锚点，
    // 否则变异体等于原版，靠「锚点命中 0 次」才发现（那次就是这么被抓住的）。
    id: 'M10 关掉右缘夹取',
    find: 'if (uR > W - 6) wantVis = (W - 6) - uR;',
    replace: 'if (false && uR > W - 6) wantVis = (W - 6) - uR;',
    expect: '立绘越界',
  },
  {
    // 这一条专门守「假绿」：钩子一坏，每格量的其实都是 idle，而 idle 的间距本来就是 9px，
    // 不自查「姿态对不对」的话整张矩阵会全绿但什么都没测到。
    id: 'M11 姿态钩子失效',
    find: "get('xjj_test_pose')",
    replace: "get('xjj_test_pose_disabled')",
    expect: '姿态没切换',
  },
]
const PY = process.env.PYTHON || 'python'
const GEO = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-geo-'))
for (const d of ['dist', 'vendor', 'verify', 'src']) {
  fs.cpSync(path.join(ROOT, d), path.join(GEO, d), { recursive: true })
}
const geoFile = path.join(GEO, 'dist', 'xjj.user.js')
const geoPristine = fs.readFileSync(geoFile, 'utf8')
const geoRun = (args) => run(PY, ['verify/geometry.py', ...args], {
  cwd: GEO,
  env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' }),
})

console.log('\n几何守卫（副本里量 DOM）：')
const geoBase = geoRun(['--fast'])
if (geoBase.code !== 0) {
  console.error('  ❌ 基线不绿，几何守卫本身有问题（不是变异体的事）：')
  console.error(geoBase.text.split('\n').slice(-15).join('\n'))
  bad += 1
} else {
  console.log('  ✅ 基线（--fast）exit=0')
}
for (const m of GEO_MUTANTS) {
  const hits = geoPristine.split(m.find).length - 1
  if (hits !== 1) {
    console.log(`  ❌ 锚点异常  ${m.id}  锚点命中 ${hits} 次（必须 1 次）= 变异体等于原版，假绿`)
    bad += 1
    continue
  }
  fs.writeFileSync(geoFile, geoPristine.split(m.find).join(m.replace), 'utf8')
  const r = geoRun(['--fast'])
  fs.writeFileSync(geoFile, geoPristine, 'utf8')
  const red = r.code !== 0
  const rightReason = r.text.includes(m.expect)
  let verdict
  if (red && rightReason) verdict = '✅ 有门齿'
  else if (!red) verdict = '❌ 没变红'
  else verdict = '❌ 红了但原因不对'
  if (verdict !== '✅ 有门齿') bad += 1
  console.log(`  ${verdict}  ${m.id}  exit=${r.code} · 期望标签「${m.expect}」${rightReason ? '命中' : '未命中'}`)
}

// —— 4. 收尾 ——
if (bad) {
  console.error(`\n❌ ${bad} 项不合格：守卫没有牙齿，或者红了但没红在对的地方`)
  console.error('   副本保留在：' + TMP + ' / ' + GEO)
  process.exit(1)
}
fs.rmSync(TMP, { recursive: true, force: true })
fs.rmSync(GEO, { recursive: true, force: true })
console.log(`\n✅ ${MUTANTS.length} 个变异体 + ${GEO_MUTANTS.length} 个几何变异体全部被抓住，且失败原因都与改动对应`)
