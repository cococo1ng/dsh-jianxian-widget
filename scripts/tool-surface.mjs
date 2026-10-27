// tool-surface.mjs —— 模型可见面冻结闸（tool surface lock）
//
// 为什么要有：
//   模型每次对话都要读全部工具/命令/技能的定义，工具一多就是"静默涨 token"。
//   IG5 的做法是把 43 个工具分 Core8 / Full43，并在 CI 里量 token（name+description+parameters
//   的 JSON 字符数 / 4，Core 预算 4000），量完还要跟打包清单和审查过的分类表三方对账。
//   剑仙现在 0 个工具、0 条命令、0 个技能 —— 但"0"不是结论，是要被钉住的事实：
//   哪天有人给插件加了个工具/命令/技能，这里必须红，逼他显式更新冻结清单，
//   而不是让 system prompt 悄悄膨胀、事后没人说得清是哪个版本涨的。
//
// 量什么：
//   name + description + parameters 的 JSON 字符数 / 4。
//   这是保守的跨分词器近似（IG5 同口径），不是某个模型的精确 token 数，别拿它当计费依据。
//
// 用法：
//   node scripts/tool-surface.mjs             # 校验；漂移或超预算 → 退出码 1
//   node scripts/tool-surface.mjs --update    # 更新冻结清单（改完要在回报里说明理由）
//   node scripts/tool-surface.mjs --json      # 机器可读输出
//
// 注意：不碰真实 ~/.dsh（DSH_HOME 指到临时目录），不启 webServer，不读配置、不写用户文件。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const FIXTURE = path.join(ROOT, 'scripts', 'tool-surface.json')
const ENTRY = path.join(ROOT, 'plugin', 'index.js')

const UPDATE = process.argv.includes('--update')
const AS_JSON = process.argv.includes('--json')
// 自检：空清单上的闸很容易变成"恒绿"（永远是 0 个工具，永远一致）。
// 必须能证明它咬得动 —— 塞一个探测工具进去，它得判成漂移。审计-teeth 那套 R1 的教训。
const SELFTEST = process.argv.includes('--selftest')
if (UPDATE && SELFTEST) {
  console.error('❌ --update 与 --selftest 不能同时用（一个是写清单，一个是要它报错）')
  process.exit(1)
}

// —— 假 ctx：只收注册，不执行任何业务 ——
// 形状对齐 test-routes.mjs 的最小 ctx（插件能起来就行）；多给 tools/commands/skills 三个注册口。
const captured = { tools: new Map(), commands: new Map(), skills: new Map(), routes: [], injected: [] }
const forget = (map, name) => () => { map.delete(name) }
const ctx = {
  effect(fn) { const d = fn(); return () => { if (typeof d === 'function') d() } },
  on() { return () => {} },
  get() { return null },                       // credentials / approval 都不可用
  inject(names, callback) {
    captured.injected.push(...names)
    if (typeof callback === 'function') callback({})
    return { dispose() {} }
  },
  webServer: { register(route) { captured.routes.push(String(route && route.path || '')); return () => {} } },
  tools: { register(def) { captured.tools.set(def.name, def); return forget(captured.tools, def.name) } },
  commands: { register(def) { captured.commands.set(def.name, def); return forget(captured.commands, def.name) } },
  skills: { register(def) { captured.skills.set(def.name, def); return forget(captured.skills, def.name) } },
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-surface-'))
process.env.DSH_HOME = TMP

const module = await import(pathToFileURL(ENTRY).href)
await Promise.resolve(module.apply(ctx))

// 自检模式：插件真注册了什么之后，再补一个假工具 —— 下面必须因此报漂移
if (SELFTEST) {
  captured.tools.set('xjj_selftest_probe', {
    name: 'xjj_selftest_probe', description: 'selftest probe', parameters: { type: 'object', properties: {} },
  })
}

// —— 度量 ——
const tokensOf = (def) => {
  const payload = { name: def.name, description: def.description, parameters: def.parameters }
  return Math.ceil(JSON.stringify(payload).length / 4)
}
const rowsOf = (map) => [...map.values()]
  .map((def) => ({ name: String(def.name), tokens: tokensOf(def) }))
  .sort((a, b) => a.name.localeCompare(b.name))

const current = {
  budgetTokens: 4000,
  tools: rowsOf(captured.tools),
  commands: rowsOf(captured.commands),
  skills: rowsOf(captured.skills),
}
const totalTokens = [...current.tools, ...current.commands, ...current.skills]
  .reduce((sum, row) => sum + row.tokens, 0)

// —— 冻结清单 ——
const readFixture = () => {
  if (!fs.existsSync(FIXTURE)) return null
  try { return JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) } catch (error) {
    console.error('❌ 冻结清单不是合法 JSON：' + FIXTURE + ' → ' + error.message)
    process.exit(1)
  }
}
const lockOf = (doc) => ({
  budgetTokens: Number(doc.budgetTokens),
  tools: ready(doc.tools),
  commands: ready(doc.commands),
  skills: ready(doc.skills),
})
const ready = (rows) => (Array.isArray(rows) ? rows.map((row) => ({ name: String(row.name), tokens: Number(row.tokens) })) : [])

const drift = []
const fixture = readFixture()
if (UPDATE) {
  const next = {
    note: '模型可见面冻结清单。改动必须跑 node scripts/tool-surface.mjs --update，并在回报里写明理由。',
    ...current,
  }
  fs.writeFileSync(FIXTURE, JSON.stringify(next, null, 2) + '\n', 'utf8')
  console.log(`✏️  已更新冻结清单：${path.relative(ROOT, FIXTURE)}`)
} else if (!fixture) {
  drift.push('冻结清单不存在（先跑 --update 生成，并确认这次变更是有意的）')
} else {
  const lock = lockOf(fixture)
  if (lock.budgetTokens !== current.budgetTokens) {
    drift.push(`预算被改过：清单 ${lock.budgetTokens} / 代码 ${current.budgetTokens}（改预算要写进 CHANGELOG，不是改个数字）`)
  }
  for (const kind of ['tools', 'commands', 'skills']) {
    const want = new Map(lock[kind].map((row) => [row.name, row.tokens]))
    const got = new Map(current[kind].map((row) => [row.name, row.tokens]))
    for (const [name, tokens] of got) {
      if (!want.has(name)) drift.push(`新增 ${kind}: ${name}（${tokens} token）`)
      else if (want.get(name) !== tokens) drift.push(`${kind} 描述体积变了: ${name} ${want.get(name)} → ${tokens} token`)
    }
    for (const name of want.keys()) if (!got.has(name)) drift.push(`删除 ${kind}: ${name}`)
  }
}

// —— 输出 ——
if (AS_JSON) {
  console.log(JSON.stringify({ current, totalTokens, drift, routes: captured.routes.length }, null, 2))
} else {
  console.log(`模型可见面：工具 ${current.tools.length} · 命令 ${current.commands.length} · 技能 ${current.skills.length} · 估算 ${totalTokens} token（预算 ${current.budgetTokens}）`)
  if (current.tools.length || current.commands.length || current.skills.length) {
    for (const row of [...current.tools, ...current.commands, ...current.skills]) {
      console.log(`  · ${row.name}  ${row.tokens} token`)
    }
  } else {
    console.log('  （当前一个都没有：模型完全碰不到剑仙，这条闸就是为"哪天加了"准备的）')
  }
  console.log(`HTTP 路由 ${captured.routes.length} 条 —— 不算模型面，只报不判（路由数由 test-routes 与 about 清单对账）`)
  if (module && typeof module.inject !== 'undefined') {
    console.log(`插件声明 inject：${[].concat(module.inject || []).join(', ') || '（无）'}`)
  }
}

const overBudget = totalTokens > current.budgetTokens

// 自检：只认"探测工具被抓住"这一件事，顺带证明漂移判断真的在跑
if (SELFTEST) {
  const caught = drift.some((line) => line.includes('xjj_selftest_probe'))
  fs.rmSync(TMP, { recursive: true, force: true })
  if (!caught) {
    console.error('❌ 自检失败：塞进去的探测工具没被判成漂移 —— 这条闸恒绿，等于没有')
    console.error('   漂移条目：' + (drift.length ? drift.join(' / ') : '（空）'))
    process.exit(1)
  }
  console.log('✅ 自检通过：塞入探测工具后确实报漂移（闸咬得动）')
  process.exit(0)
}

if (overBudget) console.error(`❌ 模型可见面超预算：${totalTokens} > ${current.budgetTokens} token`)
if (!UPDATE && drift.length) {
  console.error(`❌ 模型可见面与冻结清单不一致（${drift.length} 处）：`)
  for (const line of drift) console.error('  - ' + line)
  console.error('   确认是有意改动后跑：node scripts/tool-surface.mjs --update')
}
if (!UPDATE && !drift.length && !overBudget && !AS_JSON) console.log('✅ 与冻结清单一致')

fs.rmSync(TMP, { recursive: true, force: true })
process.exit(UPDATE || (!drift.length && !overBudget) ? 0 : 1)
