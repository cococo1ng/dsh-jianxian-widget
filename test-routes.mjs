// test-routes.mjs —— 宿主侧新功能的断言测试（零依赖，假 ctx 直接跑）
// 覆盖：① 写栅栏三道（缺标记头 / 伪造 Host / 正常本机写）② 提问与授权挂起的状态机
//       ③ /xjj/about.json 的形状与构建新鲜度 ④ 原有 /xjj/state.json 没被改坏
// 用法：node test-routes.mjs        （不碰真实 ~/.dsh：DSH_HOME 指到临时目录）
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-test-'))
process.env.DSH_HOME = TMP
// 构建新鲜度要双向验：只验"干净时 false"，对 stale 恒为 false 的坏实现是没有门齿的（M5）
const TPL = path.join(TMP, 'client.template.js')
fs.writeFileSync(TPL, '// 测试用模板\n', 'utf8')
const pastAt = new Date(Date.now() - 10 * 60 * 1000)
fs.utimesSync(TPL, pastAt, pastAt)   // 副本刚写出来是"现在"，不推回去的话一开始就判 stale
process.env.XJJ_TEMPLATE_FILE = TPL

const { apply } = await import('./plugin/index.js')

const routes = new Map()
const listeners = new Map()
const ctx = {
  effect(fn) { const d = fn(); return () => { if (typeof d === 'function') d() } },
  on(name, fn) { listeners.set(name, fn); return () => listeners.delete(name) },
  get() { return null },            // credentials / deepseekAccount 都不可用：走“读不到余额”分支
  webServer: { register(route) { routes.set(route.path, route.handler); return () => routes.delete(route.path) } },
}
apply(ctx)

let pass = 0
const fails = []
function ok(cond, label, extra) {
  if (cond) { pass += 1; return }
  fails.push(label + (extra === undefined ? '' : ' → ' + JSON.stringify(extra)))
}

function makeRes() {
  const box = { status: 200, body: null }
  return {
    box,
    writeHead(status) { box.status = status },
    end(text) {
      try { box.body = JSON.parse(text) } catch { box.body = text }
    },
  }
}

function makeReq({ method = 'GET', url = '/', headers = {}, body = null, remote = '127.0.0.1' } = {}) {
  const handlers = {}
  const req = {
    method, url, headers,
    socket: { remoteAddress: remote },
    on(evt, cb) { handlers[evt] = cb; return req },
    destroy() {},
  }
  if (body !== null) {
    // readBody 用的是 data/end 事件：异步发，模拟真实请求
    setImmediate(() => {
      handlers.data && handlers.data(Buffer.from(body, 'utf8'))
      handlers.end && handlers.end()
    })
  }
  return req
}

async function call(pathname, opts) {
  const handler = routes.get(pathname)
  if (!handler) throw new Error('没有注册路由：' + pathname)
  const res = makeRes()
  await handler(makeReq(opts), res)
  // 断言里直接读 body 字段，同时把 HTTP 状态挂成 status
  const out = (res.box.body && typeof res.box.body === 'object') ? Object.assign({}, res.box.body) : { body: res.box.body }
  out.status = res.box.status
  return out
}

const goodCfg = { queue: [{ id: 'present', title: '本座在此', variants: [{ weight: 1, lines: [] }] }] }
const writeHeaders = { host: '127.0.0.1:12824', origin: 'http://127.0.0.1:12824', 'x-xjj-write': '1', 'content-type': 'application/json' }

// ① 写栅栏
{
  const boxes = [
    await call('/xjj/config.json', { method: 'POST', headers: { host: '127.0.0.1:12824' }, body: JSON.stringify(goodCfg) }),
    // Host 与 Origin 都写成恶意站点：这样只剩"Host 必须回环"这一道能拦。
    // 上一版 Origin 仍写 127.0.0.1，是 Origin 校验替 Host 兜住的 —— 断言绿着，M12 变异体一拆 Host 却不红（假绿）。
    await call('/xjj/config.json', { method: 'POST', headers: Object.assign({}, writeHeaders, { host: 'evil.example.com', origin: 'http://evil.example.com' }), body: JSON.stringify(goodCfg) }),
    await call('/xjj/config.json', { method: 'POST', headers: Object.assign({}, writeHeaders, { origin: 'http://evil.example.com' }), body: JSON.stringify(goodCfg) }),
    await call('/xjj/config.json', { method: 'POST', headers: writeHeaders, body: JSON.stringify(goodCfg), remote: '192.168.1.50' }),
  ]
  ok(boxes[0].status === 403 && /x-xjj-write/.test(String(boxes[0].error || '')), '缺标记头必须 403', boxes[0])
  ok(boxes[1].status === 403, '伪造 Host 必须 403', boxes[1])
  ok(boxes[2].status === 403, '跨站 Origin 必须 403', boxes[2])
  ok(boxes[3].status === 403, '非回环来源必须 403', boxes[3])

  const good = await call('/xjj/config.json', { method: 'POST', headers: writeHeaders, body: JSON.stringify(goodCfg) })
  ok(good.status === 200 && good.ok === true, '本机正常写必须 200', good)

  // 桌面壳可能给 Origin: null（file:// 或沙箱）——这时靠自定义头把关，不能拒
  const nullOrigin = await call('/xjj/config.json', {
    method: 'POST',
    headers: Object.assign({}, writeHeaders, { origin: 'null' }),
    body: JSON.stringify(goodCfg),
  })
  ok(nullOrigin.status === 200 && nullOrigin.ok === true, 'Origin: null 但有标记头要放行', nullOrigin)
  const saved = JSON.parse(fs.readFileSync(path.join(TMP, '.xjj-config.json'), 'utf8'))
  ok(Array.isArray(saved.queue) && saved.queue[0].id === 'present', '配置已落盘到 DSH_HOME', saved)
  const read = await call('/xjj/config.json', {})
  ok(read.ok === true && read.config && read.config.queue.length === 1, '读配置仍然可用', read)
}

// ② 提问 / 授权挂起的状态机
{
  const emit = (type, data, sessionId = 's1') => listeners.get('session/event')({ id: sessionId }, { type, data })
  ok(routes.has('/xjj/wait.json'), '/xjj/wait.json 已注册')

  let w = await call('/xjj/wait.json', {})
  ok(w.ok === true && w.pending === null, '初始没有挂起', w)

  emit('session/title', { title: '写周报' })
  emit('tool/call', { name: 'ask_user_question', callId: 'c1' })
  w = await call('/xjj/wait.json', {})
  ok(w.pending && w.pending.kind === 'question' && w.pending.id === 'c1', '提问要挂起并带 callId', w)
  ok(w.sessionName === '写周报', '对话名要跟着事件更新', w)

  // 同一个提问重复请求不应变化（前端靠 id 去重）
  const again = await call('/xjj/wait.json', {})
  ok(again.pending && again.pending.id === 'c1', '重复轮询保持同一 id', again)

  emit('tool/result', { callId: 'c1' })
  w = await call('/xjj/wait.json', {})
  ok(w.pending === null, '回答后要解除', w)

  emit('approval/asked', { id: 'ap1' })
  w = await call('/xjj/wait.json', {})
  ok(w.pending && w.pending.kind === 'approval' && w.pending.id === 'ap1', '授权要挂起', w)
  emit('approval/granted', { id: 'ap1' })
  w = await call('/xjj/wait.json', {})
  ok(w.pending === null, '批准后要解除', w)

  // 兜底：一轮结束时不管怎样都要清空
  emit('approval/asked', { id: 'ap2' })
  emit('turn/end', { turn: 3 })
  w = await call('/xjj/wait.json', {})
  ok(w.pending === null, 'turn/end 必须兜底清空', w)

  // 别的工具调用不许误挂起
  emit('tool/call', { name: 'read_file', callId: 'c9' })
  w = await call('/xjj/wait.json', {})
  ok(w.pending === null, '非 ask_user_question 不挂起', w)
}

// ③ 关于 / 自检
{
  const about = await call('/xjj/about.json', {})
  ok(about.ok === true, '/xjj/about.json 可用', about)
  const pkgVersion = JSON.parse(fs.readFileSync(path.join(HERE, 'plugin', 'package.json'), 'utf8')).version
  ok(about.version === pkgVersion, '版本号来自 package.json', about.version)
  ok(Array.isArray(about.routes) && about.routes.length === 8, '路由清单 8 条', about.routes)
  // 构建新鲜度必须两个方向都验：只验"干净时 false"，把 stale 恒写 false 也是绿的（M5 抓出来的）。
  // 时间基准取**产物自己的 mtime**，不能取 now —— 真实 client.js 可能是十几分钟前构建的。
  const clientAt = Date.parse((about.files && about.files.client && about.files.client.at) || '') || Date.now()
  const setTemplateAt = (offsetMs) => {
    const t = new Date(clientAt + offsetMs)
    fs.utimesSync(TPL, t, t)
  }
  setTemplateAt(-10 * 60 * 1000)
  const clean = await call('/xjj/about.json', {})
  ok(clean.build && clean.build.stale === false, '构建应为最新（模板不比产物新）', clean.build)
  setTemplateAt(+5 * 60 * 1000)
  const dirty = await call('/xjj/about.json', {})
  ok(dirty.build && dirty.build.stale === true, '模板更新时要报 stale', dirty.build)
  setTemplateAt(-10 * 60 * 1000)
  ok(about.files && about.files.client && about.files.client.bytes > 1000000, '产物体积可读', about.files && about.files.client)
  ok(about.ledger && typeof about.ledger.todayUsed === 'number', '账本快照可读', about.ledger)
  ok(about.wait && about.wait.pending === null, '自检里带挂起状态', about.wait)
}

// ④ 原有 state.json 没被改坏
{
  const st = await call('/xjj/state.json', {})
  ok(st.ok === true, 'state.json 仍返回 ok', st && st.ok)
  ok(st.balance === null && typeof st.balanceError === 'string', '没有凭据时走“读不到余额”分支', st && st.balanceError)
  ok(st.peak && typeof st.peak.nextInMs === 'number', '峰谷状态仍完整', st && st.peak)
  ok(Array.isArray(st.history), '近 7 天数组仍在', st && st.history)
  const ping = await call('/xjj/ping.json', {})
  ok(ping.ok === true && ping.ping === 'jianxian', 'ping 仍正常', ping)
}

// ⑤ 用量记录窗口（今日 / 搜索 / 模型占比）
{
  const emit = (type, data) => listeners.get('session/event')({ id: 's2' }, { type, data })
  const turn = (n, usage, model) => {
    emit('assistant/message', { turn: n, usage, message: { source: { model } } })
    emit('turn/end', { turn: n })
  }
  turn(1, { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }, 'deepseek-v4-flash')
  turn(2, { inputTokens: 0, cacheReadTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 0 }, 'deepseek-v4-pro')

  const u = await call('/xjj/usage.json', { url: '/xjj/usage.json?range=today' })
  ok(u.ok === true && u.totals.turns === 2, '今日统计两轮', u.totals)
  ok(u.totals.amount > 0 && u.totals.tokens === 2_000_000, '金额与 token 合计对得上', u.totals)
  ok(Array.isArray(u.byModel) && u.byModel.length === 2, '两个模型各一条占比', u.byModel)
  ok(u.byModel[0].amount >= u.byModel[1].amount, '占比按金额倒序', u.byModel.map((x) => x.model + ':' + x.amount))
  ok(u.items.length === 2 && !!u.items[0].date && !!u.items[0].time, '明细带日期与分钟', u.items)
  ok(u.items[0].ts >= u.items[1].ts, '明细按时间倒序', u.items.map((x) => x.ts))

  const q = await call('/xjj/usage.json', { url: '/xjj/usage.json?range=today&q=pro' })
  ok(q.items.length === 1 && /pro/.test(String(q.items[0].model)), '搜索按模型名过滤', q.items)
  const none = await call('/xjj/usage.json', { url: '/xjj/usage.json?range=today&q=zzz' })
  ok(none.items.length === 0 && none.totals.amount > 0, '搜不到明细时合计不变', none.items)

  const all = await call('/xjj/usage.json', { url: '/xjj/usage.json?range=all' })
  ok(all.totals.amount >= u.totals.amount, '全部口径不小于今日', all.totals)
  ok(all.retention && all.retention.turnsLive === 2 && all.retention.turnsCap === 500, '保留期信息可读', all.retention)
  ok(all.retention.dailyCap === 365, '逐日保留 365 天', all.retention)
}

// ⑥ 过期明细挤进归档，不直接丢
{
  const stateFile = path.join(TMP, '.xjj-state.json')
  const st0 = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  st0.turns.push({ ts: Date.now() - 100 * 86400000, turn: 99, amount: 0.5, tokens: 10, model: 'deepseek-v4-flash' })
  fs.writeFileSync(stateFile, JSON.stringify(st0, null, 2), 'utf8')
  const emit = (type, data) => listeners.get('session/event')({ id: 's3' }, { type, data })
  emit('assistant/message', {
    turn: 7,
    usage: { inputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 },
    message: { source: { model: 'deepseek-v4-flash' } },
  })
  emit('turn/end', { turn: 7 })

  const st1 = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  ok(!st1.turns.some((t) => Number(t.turn) === 99), '超过 90 天的明细从账本移除', st1.turns.length)
  // 归档文件可能压根没生成：用带标签的断言报出来，别让 readFileSync 抛错把"红的原因"吃掉
  let arch = null
  try {
    arch = JSON.parse(fs.readFileSync(path.join(TMP, '.xjj-usage-archive.json'), 'utf8'))
  } catch (err) {
    arch = null
  }
  ok(!!(arch && Array.isArray(arch.turns) && arch.turns.some((t) => Number(t.turn) === 99)), '过期明细进了归档文件', arch ? arch.turns.length : '归档文件不存在')
  ok(st1.todayTokens > 0 && st1.todayByModel && Object.keys(st1.todayByModel).length > 0, '今日 token 与模型分布落盘', st1.todayByModel)
}

fs.rmSync(TMP, { recursive: true, force: true })

if (fails.length) {
  console.error('❌ 失败 ' + fails.length + ' 项（通过 ' + pass + ' 项）')
  for (const f of fails) console.error(' - ' + f)
  process.exit(1)
}
console.log('✅ 全部通过：' + pass + ' 项断言（写栅栏 / 挂起状态机 / 自检 / 原有路由）')
