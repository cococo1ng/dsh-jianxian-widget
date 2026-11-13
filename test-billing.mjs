/**
 * 青云剑仙 B 档改造验收：计费口径 / 节假日 / 跨天归档 / turnSeq 保留
 * 跑法：node test-billing.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-test-'))
process.env.DSH_HOME = home
const STATE = path.join(home, '.xjj-state.json')
const MOD = new URL('./plugin/index.js', import.meta.url).href

let fails = 0
const ok = (cond, label, extra) => {
  if (cond) console.log('  PASS  ' + label + (extra ? '  ' + extra : ''))
  else { fails++; console.log('  FAIL  ' + label + '  ' + (extra || '')) }
}

const mod = await import(MOD)

const handlers = {}
const routes = {}
const ctx = {
  get: () => null,
  effect: (fn) => { try { fn() } catch (e) {} },
  on: (name, h) => { handlers[name] = h; return () => {} },
  webServer: { register: (r) => { routes[r.path] = r.handler; return () => {} } },
}
mod.apply(ctx)

const SID = { id: 'S1' }
const sendMsg = (turn, usage, model, provider) => handlers['session/event'](SID, {
  type: 'assistant/message',
  data: { turn, usage, message: { source: provider ? { model, provider } : { model } } },
})
const endTurn = () => handlers['session/event'](SID, { type: 'turn/end', data: {} })
const readState = () => JSON.parse(fs.readFileSync(STATE, 'utf8'))
const getState = async () => {
  let out = null
  await routes['/xjj/state.json']({ url: '/xjj/state.json?refresh=1', method: 'GET' },
    { writeHead() {}, end: (b) => { out = JSON.parse(b) } })
  return out
}

console.log('DSH_HOME =', home)
console.log('今天 =', new Date().toString())

// 现价档：旧版只按“周末/工作日”猜单价，工作日的夜里（谷价）跑就会误判成高峰价 → 假红。
// 改成直接读宿主自己的峰谷判断（同一套 peakState），测试才不依赖跑的时间。
const peakNow = !!(await getState()).peak.peak
const MISS = peakNow ? 2 : 1        // flash 未命中价：谷 1 / 峰 2（元/百万）
const HIT = peakNow ? 0.04 : 0.02   // flash 命中价
console.log('现价档 =', peakNow ? '高峰' : '谷价', '· 未命中', MISS, '/M · 命中', HIT, '/M')

// ---------- 1. cacheWrite 必须计入 ----------
console.log('\n[1] 缓存写入计费')
// 1M 未命中输入 + 1M 缓存写入，flash 价；周末/谷价 miss=1
sendMsg(1, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 1_000_000, outputTokens: 0 }, 'deepseek-v4-flash')
endTurn()
let st = readState()
const expect1 = 2 * MISS   // 1M 未命中 + 1M 缓存写入，都按未命中价
ok(Math.abs(st.todayUsed - expect1) < 1e-6, 'todayUsed = ' + expect1 + ' 元（含缓存写入）', '实际 ' + st.todayUsed)
ok(st.todayTurns === 1, 'todayTurns = 1', '实际 ' + st.todayTurns)
ok(Array.isArray(st.turns) && st.turns.length === 1, '明细 turns 落了一条', '实际 ' + (st.turns || []).length)
ok(st.todayUsedByBalance === 0, '余额差口径不再混进今日已用', '实际 ' + st.todayUsedByBalance)

// ---------- 2. 纯命中必须按 hit 价 ----------
console.log('\n[2] 缓存命中按 hit 价')
sendMsg(2, { inputTokens: 0, cacheReadTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 0 }, 'deepseek-v4-flash')
endTurn()
st = readState()
const expect2 = expect1 + HIT
ok(Math.abs(st.todayUsed - expect2) < 1e-6, '命中 1M 只加 0.02/0.04 元', '实际总计 ' + st.todayUsed)

// ---------- 3. 今日已用累加，不再被余额差改写 ----------
console.log('\n[3] 今日已用改成真实累加')
ok(Math.abs(st.todayUsed - expect2) < 1e-6, '两轮累加值保持不变', '实际 ' + st.todayUsed)

// ---------- 4. turnSeq 不能被写回抹掉 ----------
console.log('\n[4] turnSeq 保留')
const seqBefore = readState().turnSeq
await getState()   // 触发 computeState 写回
ok(readState().turnSeq === seqBefore && seqBefore > 0, 'computeState 写回后 turnSeq 不丢', '写前 ' + seqBefore + ' / 写后 ' + readState().turnSeq)

// ---------- 5. 节假日按谷价 ----------
console.log('\n[5] 法定节假日按谷价')
const realNow = Date.now
Date.now = () => Date.parse('2026-10-01T12:00:00+08:00')   // 国庆中午
let hol = await getState()
ok(hol.peak && hol.peak.peak === false, '2026-10-01 12:00 判为谷价', 'label=' + (hol.peak && hol.peak.label))
Date.now = () => Date.parse('2026-09-30T10:00:00+08:00')   // 前一天工作日的高峰时段
let work = await getState()
ok(work.peak && work.peak.peak === true, '2026-09-30 10:00 判为高峰', 'label=' + (work.peak && work.peak.label))
Date.now = realNow

// ---------- 6. 跨天归档 ----------
console.log('\n[6] 跨天归档进 history')
const led = readState()
led.date = '2026-10-24'
led.todayUsed = 5.5
led.todayTurns = 3
fs.writeFileSync(STATE, JSON.stringify(led, null, 2), 'utf8')
const after = await getState()
const archived = (after.history || []).find((h) => h.date === '2026-10-24')
ok(!!archived, 'history 里有 2026-10-24', JSON.stringify(after.history))
ok(archived && Math.abs(archived.used - 5.5) < 1e-6, '归档金额 = 5.5', archived && String(archived.used))
ok(readState().date !== '2026-10-24', '账本日期已翻到今天', readState().date)
ok(readState().todayUsed === 0, '新的一天从 0 起算', '实际 ' + readState().todayUsed)

// ---------- 7. 价格表与路由：表外模型不猜价，第三方路由照官方价记 ----------
console.log('\n[7] 未计价只留给表外模型；第三方路由也记账')
const P = mod.priceFor
ok(!!P('deepseek-flash'), 'deepseek-flash 在价表里')
ok(P('deepseek-v4-flash') === P('deepseek-flash'), '旧名 deepseek-v4-flash 走别名，同价')
ok(P('deepseek-flash', 'deepseek-account') === P('deepseek-flash'), '官方账号路由照常计价')
// 2026-11-14 改口径：白名单只用于标注，不再是计价闸门。
// 挡掉的后果是账本比 DSH 的「总消费」少一截（实测 566.30 vs 624.87，其中 45.11 就在这条上）。
ok(P('deepseek-flash', 'workbuddy') === P('deepseek-flash'), '第三方路由上的同名模型按同一张价表计价')
ok(P('deepseek-chat') === null, '表里没有的模型不给价（不猜）')

const usedBefore7 = readState().todayUsed
sendMsg(3, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, 'qwen-max')
endTurn()
st = readState()
ok(Math.abs(st.todayUsed - usedBefore7) < 1e-9, '未计价的轮次不加钱', '今日已用 ' + st.todayUsed)
ok(Number(st.todayUnpriced) === 1, '今日未计价计数 +1', '实际 ' + st.todayUnpriced)
const lastRow = st.turns[st.turns.length - 1]
ok(lastRow && lastRow.unpriced === 1 && lastRow.amount === 0, '明细行标了 unpriced（金额 0）', JSON.stringify(lastRow))
const s7 = await getState()
ok(s7.lastTurn && s7.lastTurn.amount === null, 'state.lastTurn.amount = null（界面显示"未计价"而不是 ¥0.00）', JSON.stringify(s7.lastTurn))
ok(Number(s7.todayUnpriced) === 1, 'state.todayUnpriced = 1', String(s7.todayUnpriced))

// 第三方路由 + 官方同名模型：现在必须按官方价记账，并且分组名带 @路由
const usedBefore7b = readState().todayUsed
sendMsg(4, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, 'deepseek-flash', 'workbuddy')
endTurn()
st = readState()
ok(Math.abs(st.todayUsed - (usedBefore7b + MISS)) < 1e-6, '第三方路由那轮按官方价记了 ' + MISS + ' 元', '今日已用 ' + st.todayUsed)
ok(Number(st.todayUnpriced) === 1, '未计价仍然只有 qwen-max 那 1 轮', '实际 ' + st.todayUnpriced)
const modelKeys = Object.keys(st.todayByModel || {})
ok(modelKeys.some((k) => k.indexOf('deepseek-flash @workbuddy') === 0), '按模型分组带上了 @workbuddy', JSON.stringify(modelKeys))

// ---------- 8. 放假表覆盖年份 ----------
console.log('\n[8] 放假表覆盖与告警')
ok(mod.hasHolidayCoverage(Date.parse('2026-06-01T00:00:00+08:00')) === true, '2026 年被覆盖')
ok(mod.hasHolidayCoverage(Date.parse('2027-06-01T00:00:00+08:00')) === false, '2027 年未覆盖（要告警、要补表）')
const s8 = await getState()
ok(s8.peak && s8.peak.holidayOk === true && s8.peak.holidayThrough === 2026, 'state.peak 带覆盖信息', JSON.stringify(s8.peak))

// ---------- 9. 压缩摘要那笔也要记账 ----------
// compaction/summary 是压缩时真发的一次摘要调用，真扣钱；以前只认 assistant/message，
// 这块（实测 16 次、¥1.07）一分没进账。
console.log('\n[9] 压缩摘要（compaction/summary）入账')
const OUT = peakNow ? 8 : 4   // flash 输出价：谷 4 / 峰 8（元/百万）
const usedBefore9 = readState().todayUsed
handlers['session/event'](SID, {
  type: 'compaction/summary',
  data: {
    compactionId: 'c1',
    model: 'deepseek-flash',
    provider: 'deepseek-account',
    usage: { inputTokens: 500000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 100000 },
  },
})
endTurn()
st = readState()
const expect9 = usedBefore9 + 0.5 * MISS + 0.1 * OUT
ok(Math.abs(st.todayUsed - expect9) < 1e-6, '压缩摘要的 token 计进今日已用（' + expect9.toFixed(2) + ' 元）', '实际 ' + st.todayUsed)
ok(Number(st.todayUnpriced) === 1, '压缩摘要不该被算成未计价', '实际 ' + st.todayUnpriced)

console.log('\n' + (fails ? '结果：' + fails + ' 项失败' : '结果：全部通过'))
process.exit(fails ? 1 : 0)
