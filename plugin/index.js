/**
 * 青云剑仙 —— Host 半身
 * 负责：① 读余额（先 API key，再 DSH 账号登录态）② 按余额差推「今日已用」③ 算峰谷时段与倒计时
 * ④ 存/取泡泡配置（前端编辑器写回这里）
 * 数据落盘：$DSH_HOME/.xjj-state.json（账本）、$DSH_HOME/.xjj-config.json（泡泡配置）
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const STATE_FILE = path.join(DSH_HOME, '.xjj-state.json')
const CONFIG_FILE = path.join(DSH_HOME, '.xjj-config.json')
const ARCHIVE_FILE = path.join(DSH_HOME, '.xjj-usage-archive.json')
const MAX_TURNS = 500          // 账本里留多少条逐轮明细（再多就写盘太频繁）
const TURN_KEEP_DAYS = 90      // 明细保留天数
const ARCHIVE_MAX = 20000      // 归档最多留多少条
const DAILY_KEEP_DAYS = 365    // 逐日汇总保留天数
const BALANCE_URL = 'https://api.deepseek.com/user/balance'

// 官方余额接口只认 DeepSeek 官方平台。有人把 DEEPSEEK_BASE_URL 指到中转/网关，
// 那种情况下余额接口通常不存在——照 URL 请求，失败时给一句能看懂的解释。
function baseUrlOf() {
  return String(process.env.DEEPSEEK_BASE_URL || '').trim()
}

function isGatewayBase() {
  const base = baseUrlOf()
  if (!base) return false
  try { return new URL(base).hostname.toLowerCase().indexOf('api.deepseek.com') < 0 } catch (err) { return true }
}

function balanceUrl() {
  const base = baseUrlOf()
  if (!base) return BALANCE_URL
  try { return new URL(base).origin + '/user/balance' } catch (err) { return BALANCE_URL }
}
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }

// —— 关于 / 自检用：插件真实目录（node_modules 里是 junction，必须 realpath）、版本、产物时间 ——
const PLUGIN_DIR = (() => {
  try { return fs.realpathSync(path.dirname(fileURLToPath(import.meta.url))) } catch (err) { return '' }
})()
let PLUGIN_VERSION = '4.1.0'
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR || '.', 'package.json'), 'utf8'))
  if (pkg && pkg.version) PLUGIN_VERSION = String(pkg.version)
} catch (err) { /* 解析不到就用内置版本号 */ }

// 版本号按需现读：只改客户端时不用重启宿主，自检里也不会显示旧版本
function readPluginVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR || '.', 'package.json'), 'utf8'))
    if (pkg && pkg.version) return String(pkg.version)
  } catch (err) { /* 用启动时读到的 */ }
  return PLUGIN_VERSION
}

const CLIENT_FILE = PLUGIN_DIR ? path.join(PLUGIN_DIR, 'client.js') : ''
// XJJ_TEMPLATE_FILE 只给测试用：让守卫能自己造「模板比产物新」的场景（否则构建闸门只有单向门齿）
const TEMPLATE_FILE = process.env.XJJ_TEMPLATE_FILE || (PLUGIN_DIR ? path.join(path.dirname(PLUGIN_DIR), 'src', 'client.template.js') : '')
const INDEX_FILE = PLUGIN_DIR ? path.join(PLUGIN_DIR, 'index.js') : ''

function fileInfo(file) {
  if (!file) return null
  try {
    const st = fs.statSync(file)
    return { at: new Date(st.mtimeMs).toISOString(), bytes: st.size }
  } catch (err) { return null }
}

// 构建新鲜度：模板比产物新 60 秒以上 = 改了模板忘了跑 build.py（踩过：改了模板没重出，前端一点没变）
function buildState() {
  const client = fileInfo(CLIENT_FILE)
  const template = fileInfo(TEMPLATE_FILE)
  const stale = !!(client && template && Date.parse(template.at) > Date.parse(client.at) + 60000)
  return {
    client: client,
    template: template,
    stale: stale,
    minutes: client && template ? Math.round((Date.parse(template.at) - Date.parse(client.at)) / 60000) : null,
  }
}

// —— 本机写栅栏 ——
// 为什么要有：/xjj/config.json 的 POST 以前不看来路，任何网页都能
// fetch(mode:'no-cors', content-type:'text/plain') 打到 127.0.0.1:12824 改掉配置（CSRF），
// 伪造 Host 的 DNS rebinding 同理。三道一起才够：
//   ① 要求自定义头 x-xjj-write: 1 —— 跨站请求带自定义头必然触发 preflight，而本插件不回 CORS 头
//   ② Host 必须是回环（别的机器/域名要显式放行：XJJ_ADMIN_HOSTS=192.168.1.16:12824）
//   ③ 来源地址必须是回环；有 Origin 时 Origin 的 host 必须与 Host 一致（'null' 来源直接拒）
const ADMIN_HOSTS = String(process.env.XJJ_ADMIN_HOSTS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

// 写审计：放行和拒绝都记一行（抄 IG5 的 fail-closed 证据纪律——拒绝也要留证）
const AUDIT_FILE = path.join(DSH_HOME, '.xjj-audit.jsonl')
// 审计落盘失败时的副通道：主流程照常跑，但"这次写操作执行了、审计行没留下"必须留得下证据。
// 对齐 IG5 source/approval_gate.js 的 post-execute：审计失败转 diag，不能静默吞掉。
const DIAG_FILE = path.join(DSH_HOME, '.xjj-diag.log')

function diagAudit(route, err) {
  try {
    const line = JSON.stringify({
      at: new Date().toISOString(),
      where: 'audit-write',
      route: String(route || ''),
      code: String((err && err.code) || ''),
      error: String((err && err.message) || err),
    })
    let big = false
    try { big = fs.statSync(DIAG_FILE).size > 200 * 1024 } catch (e) { big = false }
    if (big) fs.writeFileSync(DIAG_FILE, line + '\n', 'utf8')
    else fs.appendFileSync(DIAG_FILE, line + '\n', 'utf8')
  } catch (e) { /* 诊断本身失败也不能影响主流程 */ }
}

function auditWrite(req, route, result, reason) {
  try {
    const head = (req && req.headers) || {}
    const line = JSON.stringify({
      at: new Date().toISOString(),
      route: route,
      result: result,                              // allow | deny
      reason: reason || '',
      host: String(head.host || ''),
      origin: String(head.origin || ''),
      remote: remoteAddrOf(req),
      ua: String(head['user-agent'] || '').slice(0, 80),
    })
    let big = false
    try { big = fs.statSync(AUDIT_FILE).size > 200 * 1024 } catch (err) { big = false }
    if (big) fs.writeFileSync(AUDIT_FILE, line + '\n', 'utf8')
    else fs.appendFileSync(AUDIT_FILE, line + '\n', 'utf8')
  } catch (err) {
    // 审计失败不影响主流程，但必须留痕（这条写操作已经执行、审计行没落盘）
    diagAudit(route, err)
  }
}

function hostName(value) {
  const v = String(value || '').trim().toLowerCase()
  if (!v) return ''
  if (v[0] === '[') {                       // [::1]:12824
    const end = v.indexOf(']')
    return end > 0 ? v.slice(1, end) : v
  }
  const first = v.indexOf(':')
  if (first > 0 && first === v.lastIndexOf(':')) return v.slice(0, first)   // host:port
  return v
}

function isLoopbackName(h) {
  return h === '127.0.0.1' || h === '::1' || h === 'localhost' || h === '0:0:0:0:0:0:0:1'
}

function isLoopbackAddr(addr) {
  const a = String(addr || '').toLowerCase()
  return a === '' || a === '::1' || a === '127.0.0.1' || a === '::ffff:127.0.0.1'
}

function remoteAddrOf(req) {
  const s = req && req.socket
  return String((s && (s.remoteAddress || (s._peername && s._peername.address))) || '')
}

// 返回 null = 放行；返回字符串 = 拒的原因（写进响应，方便排查“设置保存不了”）
function writeDenied(req) {
  const head = (req && req.headers) || {}
  if (String(head['x-xjj-write'] || '') !== '1') return '缺少本机写标记（x-xjj-write: 1）'
  const rawHost = String(head.host || '').toLowerCase()
  const host = hostName(rawHost)
  const hostOk = isLoopbackName(host) || ADMIN_HOSTS.indexOf(rawHost) >= 0 || ADMIN_HOSTS.indexOf(host) >= 0
  if (!hostOk) return '写操作只接受本机地址（Host 不是回环）'
  if (!isLoopbackAddr(remoteAddrOf(req))) return '写操作只接受本机来源（来源地址不是回环）'
  const origin = String(head.origin || '').trim()
  // Origin 为 'null'（file:// 或沙箱 iframe）时只靠自定义头把关：跨站带不了 x-xjj-write
  // （带自定义头必然 preflight，而本插件不回 CORS 头），所以这不算放水。
  if (origin && origin !== 'null') {
    let oHost = ''
    try { oHost = hostName(new URL(origin).host) } catch (err) { oHost = '' }
    if (!oHost || oHost !== host) return '写操作不接受跨站来源'
  }
  return null
}

// 北京时间的「日」与时段判断：不依赖系统时区
function bjNow(ms) {
  const d = new Date((ms === undefined ? Date.now() : ms) + 8 * 3600 * 1000)
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth() + 1
  const da = d.getUTCDate()
  const pad = (n) => String(n).padStart(2, '0')
  return {
    day: `${y}-${pad(mo)}-${pad(da)}`,
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    dow: d.getUTCDay(), // 0 = 周日
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  }
}

// 峰谷：工作日 9:00–12:00、14:00–18:00 高峰，其余空闲；周末与法定节假日全天谷价
const PEAK_WINDOWS = [[9 * 60, 12 * 60], [14 * 60, 18 * 60]]

// 法定节假日按谷价（官方口径）。写成「区间 + 出处」，补下一年只动这两处。
// 来源：国务院办公厅《关于2026年部分节假日安排的通知》国办发明电〔2025〕7号
// https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm
// 注意：调休上班的那几个周末（1/4、2/14、2/28、5/9、9/20、10/10）官方照样按周末谷价算，
// 所以这里只需要列"放假日期"，不用列上班日。
const HOLIDAY_RANGES = [
  ['2026-01-01', '2026-01-03'], // 元旦
  ['2026-02-15', '2026-02-23'], // 春节
  ['2026-04-04', '2026-04-06'], // 清明节
  ['2026-05-01', '2026-05-05'], // 劳动节
  ['2026-06-19', '2026-06-21'], // 端午节
  ['2026-09-25', '2026-09-27'], // 中秋节
  ['2026-10-01', '2026-10-07'], // 国庆节
]

// 放假表覆盖到的年份（含）。国务院通常在前一年 11 月发次年安排，届时更新上面这张表并把这里 +1。
// 不能靠"表里有没有这一年的某天"判断覆盖：只补一条元旦就会让判定通过，春节国庆还是错。
const HOLIDAY_TABLE_THROUGH_YEAR = 2026

// 把闭区间展开成日期集合。非法日期（如 2027-02-30 会被 Date 滚到 03-02）直接跳过，
// 免得把一个不存在的日子变成"假日"。
function expandHolidayRanges(ranges) {
  const set = new Set()
  const DAY = 24 * 60 * 60 * 1000
  for (const [from, to] of ranges) {
    if (typeof from !== 'string' || typeof to !== 'string') continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) continue
    const start = Date.parse(from + 'T00:00:00Z')
    const end = Date.parse(to + 'T00:00:00Z')
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue
    if (new Date(start).toISOString().slice(0, 10) !== from) continue
    if (new Date(end).toISOString().slice(0, 10) !== to) continue
    for (let t = start; t <= end; t += DAY) set.add(new Date(t).toISOString().slice(0, 10))
  }
  return set
}

const PEAK_HOLIDAYS = expandHolidayRanges(HOLIDAY_RANGES)

// 当前这一刻所在的年份是否已被放假表覆盖（覆盖不到就只能把节假日当工作日算，要告警）
export function hasHolidayCoverage(ms) {
  const year = new Date((ms === undefined ? Date.now() : ms) + 8 * 3600 * 1000).getUTCFullYear()
  return year <= HOLIDAY_TABLE_THROUGH_YEAR
}

function isPeakAt(dow, minutes, day) {
  if (dow === 0 || dow === 6) return false            // 周末全天谷价
  if (day && PEAK_HOLIDAYS.has(day)) return false     // 法定节假日全天谷价
  return PEAK_WINDOWS.some(([a, b]) => minutes >= a && minutes < b)
}

// 峰谷状态 + 下一次切换：逐日扫描状态变化点，不靠边界数组猜
function peakState(ms) {
  const base = ms === undefined ? Date.now() : ms
  const t = bjNow(base)
  const nowMin = t.minutes
  const peak = isPeakAt(t.dow, nowMin, t.day)

  // 候选边界：每天 00:00 / 9:00 / 12:00 / 14:00 / 18:00，往后扫 8 天足够跨周
  const BOUNDS = [0, 9 * 60, 12 * 60, 14 * 60, 18 * 60]
  let nextAt = null
  let nextPeak = !peak
  for (let d = 0; d <= 8 && nextAt === null; d++) {
    const dow = (t.dow + d) % 7
    const day = bjNow(base + d * 86400000).day
    for (const b of BOUNDS) {
      const abs = d * 1440 + b
      if (abs <= nowMin) continue
      // 该时刻"之后"的状态
      const after = isPeakAt(dow, b, day)
      if (after !== peak) {
        nextAt = abs
        nextPeak = after
        break
      }
    }
  }
  if (nextAt === null) nextAt = nowMin + 1440      // 兜底：一天后
  const leftMs = (nextAt - nowMin) * 60000

  return {
    peak: peak,
    label: peak ? '高峰价' : '谷价',
    next: nextPeak ? '高峰价' : '谷价',
    nextInMs: leftMs,
    window: (t.dow === 0 || t.dow === 6)
      ? '周末全天谷价'
      : (peak ? '工作日高峰 9–12 / 14–18' : '工作日空闲'),
  }
}

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch (err) { /* 文件不存在或坏：用默认值 */ }
  return fallback
}

function writeJson(file, value) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8')
    fs.renameSync(tmp, file)
    return true
  } catch (err) {
    return false
  }
}

function readConfig() {
  const cfg = readJson(CONFIG_FILE, null)
  return cfg && typeof cfg === 'object' ? cfg : null
}

function numOrNull(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// webServer 必须进 inject；credentials / deepseekAccount 是可选服务，用 ctx.get 读，绝不能进 inject
export const inject = ['webServer']

// 价目（元 / 百万 token），数组是 [谷价, 高峰价]，口径同 DeepSeek 2026 峰谷价。
// 只收"表里明确有价"的模型：查不到就记 token、不记钱（宁可显示未计价，也不猜一个价）。
const PRICE_TABLE = {
  'deepseek-flash': { hit: [0.02, 0.04], miss: [1, 2], out: [4, 8] },
  'deepseek-v4-pro': { hit: [0.15, 0.3], miss: [4.5, 9.0], out: [13.5, 27.0] },
}

// 旧模型名 → 现模型名：官方改名后旧名仍可调用，且按现模型计费
const MODEL_ALIASES = {
  'deepseek-v4-flash': 'deepseek-flash',
  'deepseek-v4-flash-vision-exp': 'deepseek-flash',
}

// DeepSeek 官方路由的 provider id。第三方网关（中转、Workbuddy、Qwen token-plan…）上
// 也可能挂着同名的 deepseek-flash，但按各自合同计费，用官方价表算出来的数字没有意义。
const OFFICIAL_PROVIDERS = ['deepseek-official', 'deepseek-account']

function canonicalModel(model) {
  const id = String(model || '').trim().toLowerCase()
  return MODEL_ALIASES[id] || id
}

// 返回 null = 这个模型不该按官方价表算（不在表里，或不是官方路由）
export function priceFor(model, provider) {
  if (provider && OFFICIAL_PROVIDERS.indexOf(String(provider).toLowerCase()) < 0) return null
  return PRICE_TABLE[canonicalModel(model)] || null
}

// 报错话术：错误码 → 一句"能照着做"的中文。上游原文只进宿主日志，不进界面
// （"fetch failed" 这种字用户看了也不知道该干嘛）。
const MESSAGES = {
  NO_CREDS: '宿主没有凭据服务，装不了余额（DSH 版本太旧？）',
  CRED_ERROR: '读凭据失败，可能凭据文件坏了',
  NO_KEY: '没配 DEEPSEEK_API_KEY —— 在「设置 → 模型」里填，或设环境变量后重启',
  BAD_KEY: 'DEEPSEEK_API_KEY 里有换行或空格（复制时常带上），重新复制一次',
  HTTP: (status) => '余额接口返回 HTTP ' + status + (status === 401 ? '（key 无效或已撤销）' : ''),
  TIMEOUT: '余额接口超时（8 秒没回），点「立即刷新余额」重试',
  NETWORK: '余额接口连不上，检查网络或代理',
  SHAPE: '余额接口返回了看不懂的内容（可能是第三方网关）',
  EMPTY: '余额接口没给余额字段',
  UNAVAILABLE: '账户当前不可用（is_available = false）',
  GATEWAY: 'DEEPSEEK_BASE_URL 指向第三方网关，官方余额接口在那边通常不存在（余额只能去网关后台看）',
  NO_ACCOUNT: '既没有 API key，宿主也没登录 DeepSeek 账号',
  ACCOUNT_NOT_READY: '账号余额还没准备好，稍等再刷新',
  ACCOUNT_ERR: '账号余额读取失败',
  ACCOUNT_EMPTY: '账号下没有可读的钱包',
  BOTH_FAILED: '余额读不出来：{a}；{b}',
}

function msg(code, extra) {
  const m = MESSAGES[code]
  if (typeof m === 'function') return m(extra)
  return m || String(extra || '余额读不出来')
}

// API key 只允许可打印 ASCII：带换行/空格的 key 会被 fetch 当成非法 header 直接抛错
function isUsableKey(value) {
  return typeof value === 'string' && value.length >= 8 && /^[\x21-\x7e]+$/.test(value)
}


// 放假表覆盖不到当前年份时，每天告警一次（每年 11 月国务院发次年安排，看到了就来补表）
let holidayWarnedDay = ''
function warnHolidayCoverage(ctx) {
  try {
    if (hasHolidayCoverage()) return
    const day = bjNow().day
    if (day === holidayWarnedDay) return
    holidayWarnedDay = day
    const year = new Date(Date.now() + 8 * 3600 * 1000).getUTCFullYear()
    const text = '青云剑仙：内置放假日期表只覆盖到 ' + HOLIDAY_TABLE_THROUGH_YEAR + ' 年，'
      + year + ' 年的法定节假日会被按工作日（高峰价）计算。'
      + '请更新 plugin/index.js 的 HOLIDAY_RANGES 与 HOLIDAY_TABLE_THROUGH_YEAR。'
    if (ctx && ctx.logger && typeof ctx.logger.warn === 'function') ctx.logger.warn(text)
    else console.warn(text)
  } catch (err) { /* 告警失败不影响插件 */ }
}

export function apply(ctx) {
  warnHolidayCoverage(ctx)
  const CACHE_MS = 55000
  let cache = null // { at, payload }
  let inflight = null
  let runningAgents = 0
  let busySince = 0          // 第一次进入 running 的时刻
  let lastActivityAt = Date.now()   // 最近一次会话事件
  const BUSY_STALE_MS = 5 * 60 * 1000

  // 忙碌状态可能因为重复的 running 事件而卡住：超过 5 分钟没有任何会话动静就强制归零
  function pruneBusy() {
    if (runningAgents > 0 && busySince && Date.now() - Math.max(busySince, lastActivityAt) > BUSY_STALE_MS) {
      runningAgents = 0
      busySince = 0
    }
    return runningAgents > 0
  }

  // —— 每轮消耗：按 (session, turn) 聚合 assistant/message 上的真实 usage ——
  const turnAggs = new Map() // sessionId -> { turn, tokens, cost, model, startedAt }
  let lastTurn = { seq: 0, turn: null, amount: null, tokens: null, model: null, ts: null }
  const bestKey = 'xjj:lastTurnSeq'
  {
    const saved = readJson(STATE_FILE, {})
    if (saved && Number.isFinite(Number(saved.turnSeq))) lastTurn.seq = Number(saved.turnSeq)
  }

  function addMoney(a, b) {
    return Math.round((a + b) * 1e8) / 1e8
  }

  function finalizeTurn(sessionId) {
    const agg = turnAggs.get(sessionId)
    if (!agg) return
    turnAggs.delete(sessionId)
    if (!agg.tokens && !agg.cost) return
    const unpriced = Number(agg.unpriced) || 0
    lastTurn = {
      seq: lastTurn.seq + 1,
      turn: agg.turn,
      // 未计价的轮次给 null，界面上显示"未计价"而不是 ¥0.00（0 容易被当成"这轮免费"）
      amount: agg.cost > 0 ? agg.cost : (unpriced ? null : 0),
      unpriced: unpriced,
      tokens: agg.tokens,
      model: agg.model || null,
      ts: Date.now(),
    }
    const led = readLedger()
    led.todayUsed = addMoney(Number(led.todayUsed) || 0, agg.cost)   // 真实累加，不再靠余额差
    led.todayTurns = Number(led.todayTurns || 0) + 1
    led.todayTokens = Number(led.todayTokens || 0) + Number(agg.tokens || 0)
    if (unpriced) led.todayUnpriced = Number(led.todayUnpriced || 0) + unpriced
    // 今日按模型的累计：跨天时整份搬进 daily，所以「全部 / 模型占比」不用回读历史明细
    const mkey = agg.model || '未知模型'
    const mrow = (led.todayByModel && led.todayByModel[mkey]) || { amount: 0, turns: 0, tokens: 0 }
    led.todayByModel = led.todayByModel || {}
    led.todayByModel[mkey] = {
      amount: addMoney(Number(mrow.amount) || 0, agg.cost),
      turns: Number(mrow.turns || 0) + 1,
      tokens: Number(mrow.tokens || 0) + Number(agg.tokens || 0),
    }
    led.turns.push({
      ts: lastTurn.ts,
      turn: agg.turn,
      amount: agg.cost,
      tokens: agg.tokens,
      model: agg.model || null,
      ...(unpriced ? { unpriced: unpriced } : {}),
    })
    // 明细保留：只留 90 天、最多 MAX_TURNS 条；被挤出去的进归档（自己留一份，别直接丢）
    const cutoff = Date.now() - TURN_KEEP_DAYS * 86400000
    const keep = []
    const dropped = []
    for (const t of led.turns) {
      if (!t || !Number.isFinite(Number(t.ts)) || Number(t.ts) < cutoff) dropped.push(t)
      else keep.push(t)
    }
    let over = keep.length - MAX_TURNS
    if (over > 0) { dropped.push(...keep.splice(0, over)) }
    if (dropped.length) pushArchive(dropped)
    led.turns = keep
    led.turnSeq = lastTurn.seq
    writeJson(STATE_FILE, led)
  }

  // —— 归档：被挤出的逐轮明细写到这里，上限 ARCHIVE_MAX 条，别让主账本无限长 ——
  function pushArchive(list) {
    try {
      const cur = readJson(ARCHIVE_FILE, null)
      const turns = cur && Array.isArray(cur.turns) ? cur.turns : []
      for (const t of list) if (t && Number.isFinite(Number(t.ts))) turns.push(t)
      turns.sort((a, b) => Number(a.ts) - Number(b.ts))
      const cut = turns.length > ARCHIVE_MAX ? turns.length - ARCHIVE_MAX : 0
      const kept = cut ? turns.slice(cut) : turns
      writeJson(ARCHIVE_FILE, { version: 1, turns: kept, updatedAt: new Date().toISOString() })
    } catch (err) { /* 归档失败不影响记账 */ }
  }

  function archiveCount() {
    const cur = readJson(ARCHIVE_FILE, null)
    return cur && Array.isArray(cur.turns) ? cur.turns.length : 0
  }

  // —— 提问 / 授权挂起：DSH 在等你答话时，前端要能一句话提醒 ——
  // 事件形状按 DSH Host Event 契约：提问 = tool/call(name=ask_user_question)，tool/result 解除；
  // 授权 = approval/asked，之后任何 approval/* 解除；turn/start、turn/end 兜底清空
  // （兜底很重要：挂起期间那一轮正卡着，不会有别的 tool/result，但异常中断时不能把气泡挂死）。
  const waitState = { pending: null, sessionName: '' }

  function callIdOf(d) {
    if (!d) return ''
    const pick = (v) => (v === undefined || v === null ? '' : String(v))
    const direct = pick(d.callId || d.toolCallId || d.tool_call_id || d.id)
    if (direct) return direct
    const msg = d.message
    if (msg && typeof msg === 'object') return pick(msg.callId || msg.toolCallId || msg.tool_call_id)
    return ''
  }

  function noteWaitEvent(sid, type, d) {
    try {
      if (type === 'session/title') {
        const t = String(d.title === undefined ? '' : d.title).trim()
        if (t) waitState.sessionName = t.slice(0, 80)
        return
      }
      if (type === 'turn/start' || type === 'turn/end') { waitState.pending = null; return }
      if (type === 'tool/call' && String(d.name || d.toolName || '') === 'ask_user_question') {
        waitState.pending = { kind: 'question', id: callIdOf(d) || ('q' + Date.now()), ts: Date.now(), session: sid }
        return
      }
      if (type === 'tool/result') {
        if (waitState.pending && waitState.pending.kind === 'question') {
          const cid = callIdOf(d)
          if (!cid || cid === waitState.pending.id) waitState.pending = null
        }
        return
      }
      if (type === 'approval/asked') {
        waitState.pending = { kind: 'approval', id: String(d.id || ('a' + Date.now())), ts: Date.now(), session: sid }
        return
      }
      if (type.indexOf('approval/') === 0) {
        if (waitState.pending && waitState.pending.kind === 'approval') {
          const id2 = String(d.id || '')
          if (!id2 || id2 === waitState.pending.id) waitState.pending = null
        }
      }
    } catch (err) { /* 提醒失败绝不能影响宿主 */ }
  }

  function handleSessionEvent(session, event) {
    try {
      lastActivityAt = Date.now()
      const sid = session && session.id ? String(session.id) : 'default'
      const type = String((event && event.type) || '')
      const d = event && event.data
      if (!d || typeof d !== 'object') return
      noteWaitEvent(sid, type, d)
      if (type === 'turn/end') { finalizeTurn(sid); return }
      if (type !== 'assistant/message') return
      const turn = Number(d.turn)
      const usage = d.usage
      if (!usage || typeof usage !== 'object' || !Number.isFinite(turn)) return
      let agg = turnAggs.get(sid)
      if (!agg || agg.turn !== turn) {
        if (agg) finalizeTurn(sid)
        agg = { turn, tokens: 0, cost: 0, model: '', startedAt: Date.now() }
        turnAggs.set(sid, agg)
      }
      const input = Number(usage.inputTokens) || 0
      const cached = Number(usage.cacheReadTokens) || 0
      const cacheWrite = Number(usage.cacheWriteTokens) || 0   // 缓存写入，之前漏算
      const output = Number(usage.outputTokens) || 0 // 已包含 reasoning
      const toks = input + cached + cacheWrite + output
      const source = (d.message && d.message.source) || {}
      const model = source.model || ''
      const provider = source.provider || source.route || currentProvider()
      const price = priceFor(model, provider)
      const off = peakState(Date.now()).peak ? 1 : 0
      agg.tokens += toks
      if (model) agg.model = model
      // 价格表里没有 / 不是官方路由：只记 token，不猜钱。账本里这一轮标成"未计价"
      if (!price) { agg.unpriced = (agg.unpriced || 0) + 1; return }
      // 缓存写入按「未命中输入」价计（DeepSeek 口径）；命中单独按 hit 价
      const cost = (cached / 1e6) * price.hit[off]
        + ((input + cacheWrite) / 1e6) * price.miss[off]
        + (output / 1e6) * price.out[off]
      agg.cost = addMoney(agg.cost, cost)
    } catch (err) { /* 账目出问题不能影响宿主 */ }
  }

  ctx.effect(() => ctx.on('session/event', handleSessionEvent))
  ctx.effect(() => ctx.on('session/disposed', (session) => {
    if (session && session.id) turnAggs.delete(String(session.id))
  }))
  ctx.effect(() => ctx.on('agent/status', (payload) => {
    const status = payload && payload.status
    if (status === 'running') {
      runningAgents += 1
      if (!busySince) busySince = Date.now()
    } else if (status === 'idle') {
      runningAgents = Math.max(0, runningAgents - 1)
      if (!runningAgents) busySince = 0
    }
  }))


  function getService(name) {
    try { return typeof ctx.get === 'function' ? ctx.get(name) : null } catch (err) { return null }
  }

  // 当前默认模型走哪条路由（用于判断"该不该按官方价表算"）。
  // 拿不到就返回 ''，此时只看模型 id —— 不猜、也不因此丢功能。
  function currentProvider() {
    try {
      const svc = getService('agentDefaultModel')
      if (!svc) return ''
      const v = typeof svc.get === 'function' ? svc.get() : (svc.value || svc.current || svc.state)
      const p = v && (v.provider || (v.model && v.model.provider))
      return typeof p === 'string' ? p : ''
    } catch (err) { return '' }
  }

  async function balanceFromApiKey() {
    const creds = getService('credentials')
    if (!creds || typeof creds.resolve !== 'function') {
      return { ok: false, code: 'NO_CREDS', error: '凭据服务不可用' }
    }
    let cred = null
    try {
      cred = await creds.resolve('DEEPSEEK_API_KEY')
    } catch (err) {
      return { ok: false, code: 'CRED_ERROR', error: msg('CRED_ERROR') }
    }
    if (!cred || !cred.value) return { ok: false, code: 'NO_KEY', error: msg('NO_KEY') }
    if (!isUsableKey(String(cred.value))) return { ok: false, code: 'BAD_KEY', error: msg('BAD_KEY') }
    try {
      const res = await fetch(balanceUrl(), {
        headers: { Authorization: 'Bearer ' + cred.value },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        if (isGatewayBase() && (res.status === 404 || res.status === 405 || res.status === 401)) {
          return { ok: false, code: 'GATEWAY', error: msg('GATEWAY'), status: res.status }
        }
        return { ok: false, code: 'HTTP', error: msg('HTTP', res.status), status: res.status }
      }
      const data = await res.json()
      // 官方会明确说账户是否可用；不可用时余额数字没有意义
      if (data && data.is_available === false) return { ok: false, code: 'UNAVAILABLE', error: msg('UNAVAILABLE') }
      const infos = Array.isArray(data && data.balance_infos) ? data.balance_infos : []
      const info = infos.find((i) => String(i && i.currency).toUpperCase() === 'CNY') || infos[0]
      if (!info) return { ok: false, code: 'EMPTY', error: msg('EMPTY') }
      const total = numOrNull(info.total_balance)
      if (total === null) return { ok: false, code: 'SHAPE', error: msg('SHAPE') }
      return {
        ok: true,
        balance: total,
        recharge: numOrNull(info.topped_up_balance),
        bonus: numOrNull(info.granted_balance),
        currency: String(info.currency || 'CNY').toUpperCase(),
        source: 'api-key',
      }
    } catch (err) {
      const timedOut = !!(err && (err.name === 'TimeoutError' || err.name === 'AbortError' || /timeout/i.test(String(err.message || ''))))
      if (!timedOut && isGatewayBase()) return { ok: false, code: 'GATEWAY', error: msg('GATEWAY') }
      return { ok: false, code: timedOut ? 'TIMEOUT' : 'NETWORK', error: msg(timedOut ? 'TIMEOUT' : 'NETWORK') }
    }
  }

  async function balanceFromAccount() {
    // 账号服务是可选服务：老宿主没有它，所以绝不能写进 inject
    const account = getService('deepseekAccount')
    if (!account || typeof account.getBalance !== 'function') {
      return { ok: false, code: 'NO_ACCOUNT', error: msg('NO_ACCOUNT') }
    }
    let result = null
    try {
      result = await account.getBalance({
        version: String(process.env.DSH_CLIENT_VERSION || process.env.DSH_VERSION || 'unknown'),
        locale: String(process.env.DSH_LOCALE || 'zh_CN'),
        timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
      })
    } catch (err) {
      return { ok: false, code: 'ACCOUNT_ERR', error: msg('ACCOUNT_ERR') }
    }
    if (!result) return { ok: false, code: 'NO_ACCOUNT', error: msg('NO_ACCOUNT') }
    if (result.status !== 'ready') return { ok: false, code: 'ACCOUNT_NOT_READY', error: msg('ACCOUNT_NOT_READY') }
    const wallets = []
    for (const list of [result.value, result.bonusWallets]) {
      if (Array.isArray(list)) for (const w of list) if (w && numOrNull(w.balance) !== null) wallets.push(w)
    }
    if (!wallets.length) return { ok: false, code: 'ACCOUNT_EMPTY', error: msg('ACCOUNT_EMPTY') }
    const curOf = (w) => String((w && w.currency) || 'CNY').toUpperCase()
    const cny = wallets.filter((w) => curOf(w) === 'CNY')
    const use = cny.length ? cny : wallets
    const currency = curOf(use[0])
    const sum = (list) => list.filter((w) => curOf(w) === currency).reduce((s, w) => s + Number(w.balance), 0)
    const recharge = sum(Array.isArray(result.value) ? result.value : [])
    const bonus = sum(Array.isArray(result.bonusWallets) ? result.bonusWallets : [])
    return {
      ok: true,
      balance: Number((recharge + bonus).toFixed(6)),
      recharge: Number(recharge.toFixed(6)),
      bonus: Number(bonus.toFixed(6)),
      currency,
      source: 'account',
    }
  }

  // 账本：todayUsed 按真实 usage 累加（准）；todayUsedByBalance 是余额差推算（对照用）。
  // 跨天时把上一天收进 daily（带 tokens 与按模型累计，图表/占比不用回读明细）；
  // turns 只保留最近 90 天 / MAX_TURNS 条，被挤出去的进 ARCHIVE_FILE。
  function readLedger() {
    const today = bjNow().day
    const raw = readJson(STATE_FILE, null) || {}
    const daily = (raw.daily && typeof raw.daily === 'object') ? raw.daily : {}
    const out = {
      date: today,
      startBalance: null,
      lastBalance: null,
      todayUsed: 0,
      todayUsedByBalance: 0,
      todayTurns: 0,
      todayTokens: 0,
      todayUnpriced: 0,   // 价格表里没有的模型/第三方路由：记 token 不记钱，这里计数
      todayByModel: {},
      turns: [],
      turnSeq: numOrNull(raw.turnSeq) || 0,
      daily,
    }
    if (raw.date === today) {
      out.startBalance = numOrNull(raw.startBalance)
      out.lastBalance = numOrNull(raw.lastBalance)
      out.todayUsed = numOrNull(raw.todayUsed) || 0
      // 老账本没有对照字段时，退回旧口径（余额差），保证升级后数字不断档
      out.todayUsedByBalance = numOrNull(raw.todayUsedByBalance) ?? (numOrNull(raw.todayUsed) || 0)
      out.todayTurns = numOrNull(raw.todayTurns) || 0
      out.todayTokens = numOrNull(raw.todayTokens) || 0
      out.todayUnpriced = numOrNull(raw.todayUnpriced) || 0
      out.todayByModel = (raw.todayByModel && typeof raw.todayByModel === 'object') ? raw.todayByModel : {}
      out.turns = Array.isArray(raw.turns) ? raw.turns : []
    } else if (raw.date) {
      // 跨天：把上一天的结果归档进 daily（含 tokens / 模型分布），并立刻落盘（别等余额接口可用）
      daily[raw.date] = {
        used: numOrNull(raw.todayUsed) || 0,
        turns: numOrNull(raw.todayTurns) || 0,
        tokens: numOrNull(raw.todayTokens) || 0,
        byModel: (raw.todayByModel && typeof raw.todayByModel === 'object') ? raw.todayByModel : {},
      }
      // daily 只留最近 DAILY_KEEP_DAYS 天，免得账本无限长
      const keys = Object.keys(daily).sort()
      if (keys.length > DAILY_KEEP_DAYS) for (const k of keys.slice(0, keys.length - DAILY_KEEP_DAYS)) delete daily[k]
      writeJson(STATE_FILE, out)
    }
    return out
  }

  // —— 用量记录窗口：今日 / 近 7 天 / 全部；按模型占比 + 逐条明细 + 搜索 ——
  // 合计与「今日已用」同源（真实 usage 累加）；历史日来自 daily 的逐日汇总（带模型分布）。
  function dayOfTs(ts) {
    const t = Number(ts)
    return Number.isFinite(t) ? bjNow(t).day : ''
  }

  function usageView(range, q, limit) {
    const led = readLedger()
    const daily = led.daily || {}
    const today = led.date
    let dates
    if (range === 'today') dates = [today]
    else {
      dates = Object.keys(daily).filter((d) => d !== today).sort()
      if (range === '7d') dates = dates.slice(-6)
      dates.push(today)
    }
    const set = new Set(dates)
    const byModel = new Map()
    let amount = 0
    let turns = 0
    let tokens = 0
    const add = (model, a, t, tok) => {
      const key = String(model || '未知模型') || '未知模型'
      const cur = byModel.get(key) || { model: key, amount: 0, turns: 0, tokens: 0 }
      cur.amount = addMoney(cur.amount, Number(a) || 0)
      cur.turns += Number(t) || 0
      cur.tokens += Number(tok) || 0
      byModel.set(key, cur)
    }
    for (const d of dates) {
      if (d === today) continue
      const row = daily[d] || {}
      amount = addMoney(amount, Number(row.used) || 0)
      turns += Number(row.turns) || 0
      tokens += Number(row.tokens) || 0
      const bm = row.byModel && typeof row.byModel === 'object' ? row.byModel : null
      if (bm && Object.keys(bm).length) {
        for (const k of Object.keys(bm)) {
          const v = bm[k] || {}
          add(k, v.amount, v.turns, v.tokens)
        }
      } else if (Number(row.used)) {
        add('未分模型（升级前）', Number(row.used) || 0, Number(row.turns) || 0, Number(row.tokens) || 0)
      }
    }
    amount = addMoney(amount, Number(led.todayUsed) || 0)
    turns += Number(led.todayTurns) || 0
    let todayTokens = Number(led.todayTokens) || 0
    let tbm = (led.todayByModel && typeof led.todayByModel === 'object') ? led.todayByModel : {}
    if (!Object.keys(tbm).length && Number(led.todayUsed)) {
      // 升级前的老账本没有 todayByModel / todayTokens：用今天的逐条明细倒推一次
      // （同口径只统计今天，不会和 daily 重复；明细若被挤掉过，占比合计会小于 100%，如实显示）
      const tt = (led.turns || []).filter((t) => t && dayOfTs(t.ts) === today)
      if (tt.length) {
        const derived = {}
        let sumTok = 0
        for (const t of tt) {
          const k = String(t.model || '未知模型')
          const cur = derived[k] || { amount: 0, turns: 0, tokens: 0 }
          cur.amount = addMoney(cur.amount, Number(t.amount) || 0)
          cur.turns += 1
          cur.tokens += Number(t.tokens) || 0
          derived[k] = cur
          sumTok += Number(t.tokens) || 0
        }
        tbm = derived
        if (!todayTokens && sumTok) todayTokens = sumTok
      }
    }
    tokens += todayTokens
    const tkeys = Object.keys(tbm)
    if (tkeys.length) {
      for (const k of tkeys) {
        const v = tbm[k] || {}
        add(k, v.amount, v.turns, v.tokens)
      }
    } else if (Number(led.todayUsed)) {
      add('未分模型', Number(led.todayUsed) || 0, Number(led.todayTurns) || 0, Number(led.todayTokens) || 0)
    }

    // 逐条明细只来自账本里现存的记录（90 天 / MAX_TURNS 条以内），倒序
    let items = (led.turns || [])
      .filter((t) => t && set.has(dayOfTs(t.ts)))
      .map((t) => ({
        ts: Number(t.ts),
        date: dayOfTs(t.ts),
        time: new Date(Number(t.ts) + 8 * 3600 * 1000).toISOString().slice(11, 16),
        amount: Number(t.amount) || 0,
        tokens: Number(t.tokens) || 0,
        model: String(t.model || ''),
        turn: Number(t.turn) || 0,
      }))
      .sort((a, b) => b.ts - a.ts)
    if (q) {
      items = items.filter((t) => (t.model + ' ' + t.date + ' ' + t.time + ' ' + t.amount.toFixed(2)).toLowerCase().indexOf(q) >= 0)
    }

    return {
      ok: true,
      range,
      q,
      totals: { amount, turns, tokens },
      byModel: Array.from(byModel.values()).sort((a, b) => b.amount - a.amount),
      days: dates.map((d) => {
        const row = d === today ? { used: led.todayUsed, turns: led.todayTurns } : (daily[d] || {})
        return { date: d, used: Number(row.used) || 0, turns: Number(row.turns) || 0 }
      }),
      items: items.slice(0, limit),
      itemCount: items.length,
      retention: {
        turnsLive: (led.turns || []).length,
        turnsCap: MAX_TURNS,
        turnDays: TURN_KEEP_DAYS,
        dailyDays: Object.keys(daily).length,
        dailyCap: DAILY_KEEP_DAYS,
        archived: archiveCount(),
        archiveCap: ARCHIVE_MAX,
      },
      now: new Date().toISOString(),
    }
  }

  // 余额差只作对照，不再当作「今日已用」的真相（它会串别的客户端、也会漏窗口）
  function applyBalanceToLedger(led, balance) {
    if (typeof balance !== 'number') return led
    if (typeof led.startBalance !== 'number') led.startBalance = balance
    if (typeof led.lastBalance === 'number' && balance < led.lastBalance) {
      led.todayUsedByBalance = Number(((led.todayUsedByBalance || 0) + (led.lastBalance - balance)).toFixed(8))
    }
    led.lastBalance = balance
    return led
  }

  async function computeState() {
    const now = Date.now()
    if (cache && now - cache.at < CACHE_MS) return cache.payload

    let bal = await balanceFromApiKey()
    if (!bal.ok) {
      const acc = await balanceFromAccount()
      if (acc.ok) bal = acc
      else bal = { ok: false, code: 'BOTH_FAILED', balanceErrorCode: bal.code, error: msg('BOTH_FAILED', null).split('{a}').join(bal.error || 'API key 失败').split('{b}').join(acc.error || '账号失败') }
    }

    const led = readLedger()
    if (bal.ok) {
      applyBalanceToLedger(led, bal.balance)
      writeJson(STATE_FILE, led)
    }
    const peak = peakState(now)
    // 近 7 天：历史日（归档）+ 今天（实时）。今天只从实时值取，避免和 daily 重复。
    const dailyMap = led.daily || {}
    const history = Object.keys(dailyMap)
      .filter((d) => d !== led.date)
      .sort()
      .slice(-6)
      .map((d) => ({
        date: d,
        used: Number(dailyMap[d] && dailyMap[d].used) || 0,
        turns: Number(dailyMap[d] && dailyMap[d].turns) || 0,
      }))
    history.push({ date: led.date, used: led.todayUsed, turns: Number(led.todayTurns || 0) })

    const payload = {
      ok: true,
      balance: bal.ok ? bal.balance : null,
      recharge: bal.ok ? (bal.recharge === undefined ? null : bal.recharge) : null,
      bonus: bal.ok ? (bal.bonus === undefined ? null : bal.bonus) : null,
      currency: bal.ok ? bal.currency : 'CNY',
      source: bal.ok ? bal.source : null,
      balanceError: bal.ok ? null : String(bal.error || msg('BOTH_FAILED').split('{a}').join('读不到').split('{b}').join('读不到')),
      balanceErrorCode: bal.ok ? null : String(bal.code || 'UNKNOWN'),
      todayUsed: led.todayUsed,
      todayUsedByBalance: led.todayUsedByBalance,
      todayTurns: Number(led.todayTurns || 0),
      todayUnpriced: Number(led.todayUnpriced || 0),
      history,
      lastTurn: lastTurn && lastTurn.ts
        ? { amount: lastTurn.amount, unpriced: Number(lastTurn.unpriced) || 0, tokens: lastTurn.tokens, model: lastTurn.model, ts: lastTurn.ts }
        : null,
      todayStart: led.startBalance,
      day: led.date,
      busy: pruneBusy(),
      peak: {
        peak: peak.peak, label: peak.label, next: peak.next, window: peak.window, nextInMs: peak.nextInMs,
        // 放假表覆盖到哪一年：覆盖不到当前年时，节假日会被当工作日算（界面上要说一声）
        holidayThrough: HOLIDAY_TABLE_THROUGH_YEAR,
        holidayOk: hasHolidayCoverage(now),
      },
      updatedAt: new Date(now).toISOString(),
    }
    cache = { at: now, payload }
    return payload
  }

  function sendJson(res, body, status) {
    try {
      res.writeHead(status || 200, JSON_HEADERS)
      res.end(JSON.stringify(body))
    } catch (err) { /* 客户端已断开 */ }
  }

  function readBody(req, limit) {
    return new Promise((resolve) => {
      let size = 0
      const chunks = []
      req.on('data', (c) => {
        size += c.length
        if (size > (limit || 256 * 1024)) { resolve(null); req.destroy(); return }
        chunks.push(c)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', () => resolve(null))
    })
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/state.json',
    handler: async (req, res) => {
      try {
        const refresh = new URL(req.url || '/', 'http://localhost').searchParams.get('refresh') === '1'
        if (refresh) cache = null
        sendJson(res, await computeState())
      } catch (err) {
        sendJson(res, { ok: false, error: String((err && err.message) || err).slice(0, 200) })
      }
    },
  }))

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/config.json',
    handler: async (req, res) => {
      const method = String(req.method || 'GET').toUpperCase()
      if (method === 'GET') {
        const cfg = readConfig()
        sendJson(res, cfg ? { ok: true, config: cfg, path: CONFIG_FILE } : { ok: true, config: null, path: CONFIG_FILE })
        return
      }
      if (method === 'POST' || method === 'PUT') {
        const denied = writeDenied(req)
        if (denied) { auditWrite(req, '/xjj/config.json', 'deny', denied); sendJson(res, { ok: false, error: denied }, 403); return }
        const raw = await readBody(req)
        if (!raw) { sendJson(res, { ok: false, error: '请求体为空或过大' }, 400); return }
        let next = null
        try { next = JSON.parse(raw) } catch (err) { sendJson(res, { ok: false, error: '不是合法 JSON' }, 400); return }
        if (!next || typeof next !== 'object' || !Array.isArray(next.queue)) {
          sendJson(res, { ok: false, error: '配置结构不对：需要 { queue: [...] }' }, 400)
          return
        }
        next.version = Number.isFinite(Number(next.version)) ? Number(next.version) : 8   // 保留客户端送来的版本号，缺省按当前默认版本
        // 诊断：记录客户端写回的关键字段，用于排查"设置不生效"类问题
    try {
      const prev = readConfig() || {}
      const changed = JSON.stringify(prev) !== JSON.stringify(next)
      // 只在真的有变化时记一行；文件超过 200KB 就重开，避免长年累月无限增长
      if (changed) {
        const logFile = path.join(DSH_HOME, '.xjj-post.log')
        const line = JSON.stringify({
          at: new Date().toISOString(),
          bubbleHoldSec: next.bubbleHoldSec, prevHold: prev.bubbleHoldSec,
          wellness: next.wellness, scale: (next.ui || {}).scale,
          version: next.version,
        })
        let big = false
        try { big = fs.statSync(logFile).size > 200 * 1024 } catch (err) { big = false }
        if (big) fs.writeFileSync(logFile, line + '\n', 'utf8')
        else fs.appendFileSync(logFile, line + '\n', 'utf8')
      }
    } catch (err) { /* 日志失败不影响主流程 */ }
    next.updatedAt = new Date().toISOString()
        if (!writeJson(CONFIG_FILE, next)) { auditWrite(req, '/xjj/config.json', 'deny', '写配置失败'); sendJson(res, { ok: false, error: '写配置失败' }, 500); return }
        auditWrite(req, '/xjj/config.json', 'allow', '')
        sendJson(res, { ok: true, config: next, path: CONFIG_FILE })
        return
      }
      sendJson(res, { ok: false, error: '只支持 GET/POST' }, 405)
    },
  }))

  // 写审计流水：放行/拒绝都在这里，最近 20 条（只读）
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/audit.json',
    handler: async (req, res) => {
      const method = String(req.method || 'GET').toUpperCase()
      if (method !== 'GET') { sendJson(res, { ok: false, error: '只支持 GET' }, 405); return }
      let items = []
      try {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf8').trim()
        items = raw.split('\n').filter(Boolean).slice(-20).map((l) => {
          try { return JSON.parse(l) } catch (err) { return { raw: l } }
        })
      } catch (err) { items = [] }
      sendJson(res, { ok: true, count: items.length, items: items, path: AUDIT_FILE })
    },
  }))

  // 自检用：让「关于」能确认路由活着
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/ping.json',
    handler: (req, res) => sendJson(res, { ok: true, ping: 'jianxian', at: new Date().toISOString() }),
  }))

  // 最近一轮消耗：前端轮询这个，seq 变大就冒一次泡泡
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/turn.json',
    handler: (req, res) => {
      sendJson(res, {
        ok: true,
        seq: lastTurn.seq,
        turn: lastTurn.turn,
        amount: lastTurn.amount,
        tokens: lastTurn.tokens,
        model: lastTurn.model,
        ts: lastTurn.ts,
        busy: pruneBusy(),
      })
    },
  }))

  // 提问 / 授权挂起：前端 3 秒轮询，id 变了才冒一次（同一件挂起不重复吵）
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/wait.json',
    handler: (req, res) => {
      sendJson(res, {
        ok: true,
        pending: waitState.pending,
        sessionName: waitState.sessionName,
        at: new Date().toISOString(),
      })
    },
  }))

  // 用量记录窗口：range=today|7d|all，q=模型/日期/金额的模糊词
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/usage.json',
    handler: (req, res) => {
      try {
        const u = new URL(req.url || '/', 'http://localhost')
        const raw = String(u.searchParams.get('range') || 'today')
        const range = ['today', '7d', 'all'].indexOf(raw) >= 0 ? raw : 'today'
        const q = String(u.searchParams.get('q') || '').trim().toLowerCase().slice(0, 40)
        const limit = Math.min(500, Math.max(20, Number(u.searchParams.get('limit')) || 200))
        sendJson(res, usageView(range, q, limit))
      } catch (err) {
        sendJson(res, { ok: false, error: String((err && err.message) || err).slice(0, 200) })
      }
    },
  }))

  // 关于 / 自检：版本、真实目录、产物与数据文件的时间大小、账本快照、构建是否新鲜
  // （只读、不联网、不碰账本写入；前端点开才请求）
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: '/xjj/about.json',
    handler: (req, res) => {
      try {
        const raw = readJson(STATE_FILE, {}) || {}
        const build = buildState()
        sendJson(res, {
          ok: true,
          version: readPluginVersion(),
          pluginDir: PLUGIN_DIR || null,
          files: {
            index: fileInfo(INDEX_FILE),
            client: build.client,
            template: build.template,
            config: fileInfo(CONFIG_FILE),
            state: fileInfo(STATE_FILE),
            archive: fileInfo(ARCHIVE_FILE),
          },
          build: { stale: build.stale, minutes: build.minutes },
          ledger: {
            day: raw.date || null,
            todayUsed: Number(raw.todayUsed) || 0,
            turns: Number(raw.todayTurns) || 0,
            unpriced: Number(raw.todayUnpriced) || 0,
            days: raw.daily && typeof raw.daily === 'object' ? Object.keys(raw.daily).length : 0,
          },
          holiday: { through: HOLIDAY_TABLE_THROUGH_YEAR, ok: hasHolidayCoverage() },
          wait: { pending: waitState.pending, sessionName: waitState.sessionName || '' },
          adminHosts: ADMIN_HOSTS.length,
          routes: ['/xjj/state.json', '/xjj/turn.json', '/xjj/config.json', '/xjj/ping.json', '/xjj/wait.json', '/xjj/usage.json', '/xjj/about.json', '/xjj/audit.json'],
          now: new Date().toISOString(),
        })
      } catch (err) {
        sendJson(res, { ok: false, error: String((err && err.message) || err).slice(0, 200) })
      }
    },
  }))
}


