/* 青云剑仙 · 网页版宿主垫片（v5）
 * 作用：在普通网页里复刻 DSH 宿主的 /xjj/*.json 接口，让同一份前端逻辑不用改就能跑。
 * 数据落点：localStorage（配置、微量账本），不联网、不上报。
 * 余额 / 账本 / 提问提醒在网页版里没有数据源 —— 状态里如实留空，界面显示「—」。
 *
 * 由 build.py 注入 __XJJ_VERSION__ 后拼进 dist/xjj.user.js；DSH 版不使用本文件。
 */
window.__XJJ_HOST__ = (function () {
  'use strict'

  var VERSION = '__XJJ_VERSION__'
  var KEY_CFG = 'xjj.cfg.v1'
  var KEY_STATE = 'xjj.state.v1'

  // —— 北京时间 / 峰谷：与宿主 index.js 同一套口径（工作日 9–12、14–18 高峰，周末与法定节假日全天谷价）
  var PEAK_WINDOWS = [[9 * 60, 12 * 60], [14 * 60, 18 * 60]]
  // 来源：国办发明电〔2025〕7号；调休上班的周末官方也按周末谷价，所以只列放假日
  var HOLIDAY_RANGES = [
    ['2026-01-01', '2026-01-03'],
    ['2026-02-15', '2026-02-23'],
    ['2026-04-04', '2026-04-06'],
    ['2026-05-01', '2026-05-05'],
    ['2026-06-19', '2026-06-21'],
    ['2026-09-25', '2026-09-27'],
    ['2026-10-01', '2026-10-07'],
  ]
  var HOLIDAY_TABLE_THROUGH_YEAR = 2026

  function expandHolidayRanges(ranges) {
    var set = {}
    var DAY = 24 * 60 * 60 * 1000
    for (var i = 0; i < ranges.length; i++) {
      var from = ranges[i][0]
      var to = ranges[i][1]
      var start = Date.parse(from + 'T00:00:00Z')
      var end = Date.parse(to + 'T00:00:00Z')
      if (!isFinite(start) || !isFinite(end) || end < start) continue
      if (new Date(start).toISOString().slice(0, 10) !== from) continue
      if (new Date(end).toISOString().slice(0, 10) !== to) continue
      for (var t = start; t <= end; t += DAY) set[new Date(t).toISOString().slice(0, 10)] = 1
    }
    return set
  }
  var PEAK_HOLIDAYS = expandHolidayRanges(HOLIDAY_RANGES)

  function hasHolidayCoverage(ms) {
    var y = new Date((ms === undefined ? Date.now() : ms) + 8 * 3600 * 1000).getUTCFullYear()
    return y <= HOLIDAY_TABLE_THROUGH_YEAR
  }

  function bjNow(ms) {
    var d = new Date((ms === undefined ? Date.now() : ms) + 8 * 3600 * 1000)
    var y = d.getUTCFullYear()
    var mo = d.getUTCMonth() + 1
    var da = d.getUTCDate()
    var pad = function (n) { return String(n).padStart(2, '0') }
    return {
      day: y + '-' + pad(mo) + '-' + pad(da),
      dow: d.getUTCDay(),
      minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    }
  }

  function isPeakAt(dow, minutes, day) {
    if (dow === 0 || dow === 6) return false
    if (day && PEAK_HOLIDAYS[day]) return false
    return PEAK_WINDOWS.some(function (w) { return minutes >= w[0] && minutes < w[1] })
  }

  function peakState(ms) {
    var base = ms === undefined ? Date.now() : ms
    var t = bjNow(base)
    var peak = isPeakAt(t.dow, t.minutes, t.day)
    var BOUNDS = [0, 9 * 60, 12 * 60, 14 * 60, 18 * 60]
    var nextAt = null
    var nextPeak = !peak
    for (var d = 0; d <= 8 && nextAt === null; d++) {
      var dow = (t.dow + d) % 7
      var day = bjNow(base + d * 86400000).day
      for (var i = 0; i < BOUNDS.length; i++) {
        var abs = d * 1440 + BOUNDS[i]
        if (abs <= t.minutes) continue
        var after = isPeakAt(dow, BOUNDS[i], day)
        if (after !== peak) { nextAt = abs; nextPeak = after; break }
      }
    }
    if (nextAt === null) nextAt = t.minutes + 1440
    return {
      peak: peak,
      label: peak ? '高峰价' : '谷价',
      next: nextPeak ? '高峰价' : '谷价',
      nextInMs: (nextAt - t.minutes) * 60000,
      window: (t.dow === 0 || t.dow === 6) ? '周末全天谷价' : (peak ? '工作日高峰 9–12 / 14–18' : '工作日空闲'),
    }
  }

  // —— 存储
  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key)
      if (!raw) return fallback
      var v = JSON.parse(raw)
      return v === null || v === undefined ? fallback : v
    } catch (err) { return fallback }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (err) { return false }
  }

  function ledger() {
    var led = readJson(KEY_STATE, null)
    var today = bjNow().day
    if (!led || typeof led !== 'object') led = {}
    if (!led.date || led.date !== today) {
      // 跨天：把昨天收进 daily（网页版没有逐轮 usage，只有计数，够画「近 7 天」的轮廓）
      var daily = (led.daily && typeof led.daily === 'object') ? led.daily : {}
      if (led.date && (Number(led.todayUsed) || Number(led.todayTurns))) {
        daily[led.date] = { used: Number(led.todayUsed) || 0, turns: Number(led.todayTurns) || 0 }
      }
      var keys = Object.keys(daily).sort()
      while (keys.length > 365) { delete daily[keys.shift()] }
      led = { date: today, todayUsed: 0, todayTurns: 0, daily: daily }
      writeJson(KEY_STATE, led)
    }
    if (!led.daily) led.daily = {}
    return led
  }

  function history7(led) {
    var out = []
    var keys = Object.keys(led.daily || {}).filter(function (k) { return k !== led.date }).sort().slice(-6)
    for (var i = 0; i < keys.length; i++) {
      var row = led.daily[keys[i]] || {}
      out.push({ date: keys[i], used: Number(row.used) || 0, turns: Number(row.turns) || 0 })
    }
    out.push({ date: led.date, used: Number(led.todayUsed) || 0, turns: Number(led.todayTurns) || 0 })
    return out
  }

  // —— 应答：优先真 Response，老环境退回最小桩
  function reply(obj, status) {
    var body = JSON.stringify(obj)
    try {
      return new Response(body, {
        status: status || 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    } catch (err) {
      return {
        ok: (status || 200) < 400,
        status: status || 200,
        json: function () { return Promise.resolve(JSON.parse(body)) },
        text: function () { return Promise.resolve(body) },
      }
    }
  }

  function statePayload() {
    var led = ledger()
    var peak = peakState()
    return {
      ok: true,
      balance: null,
      recharge: null,
      bonus: null,
      currency: 'CNY',
      source: null,
      balanceError: null,
      todayUsed: Number(led.todayUsed) || 0,
      todayUsedByBalance: 0,
      todayTurns: Number(led.todayTurns) || 0,
      todayUnpriced: 0,   // 网页版不记账，也不计价
      history: history7(led),
      lastTurn: null,
      todayStart: null,
      day: led.date,
      busy: false,
      peak: { peak: peak.peak, label: peak.label, next: peak.next, window: peak.window, nextInMs: peak.nextInMs, holidayThrough: HOLIDAY_TABLE_THROUGH_YEAR, holidayOk: hasHolidayCoverage() },
      updatedAt: new Date().toISOString(),
    }
  }

  // —— 路由（与宿主同路径、同形状）
  function handle(url, init) {
    init = init || {}
    var path = '/'
    var search = ''
    try {
      var u = new URL(String(url), window.location.href)
      path = u.pathname
      search = u.search
    } catch (err) { path = String(url) }
    var method = String(init.method || 'GET').toUpperCase()

    if (path === '/xjj/state.json') return reply(statePayload())

    if (path === '/xjj/config.json') {
      if (method === 'GET') {
        var cfg = readJson(KEY_CFG, null)
        return reply({ ok: true, config: cfg, path: 'localStorage://' + KEY_CFG })
      }
      if (method === 'POST' || method === 'PUT') {
        var next = null
        try { next = JSON.parse(String(init.body || '{}')) } catch (err) { return reply({ ok: false, error: '不是合法 JSON' }, 400) }
        if (!next || typeof next !== 'object' || !Array.isArray(next.queue)) {
          return reply({ ok: false, error: '配置结构不对：需要 { queue: [...] }' }, 400)
        }
        next.updatedAt = new Date().toISOString()
        if (!writeJson(KEY_CFG, next)) return reply({ ok: false, error: '写 localStorage 失败（隐私模式？）' }, 500)
        return reply({ ok: true, config: next, path: 'localStorage://' + KEY_CFG })
      }
      return reply({ ok: false, error: '只支持 GET/POST' }, 405)
    }

    if (path === '/xjj/turn.json') return reply({ ok: true, seq: 0, turn: 0, amount: null, tokens: null, model: null, ts: null, busy: false })
    if (path === '/xjj/wait.json') return reply({ ok: true, pending: null, sessionName: '', at: new Date().toISOString() })
    if (path === '/xjj/ping.json') return reply({ ok: true, ping: 'jianxian-web', at: new Date().toISOString() })

    if (path === '/xjj/usage.json') {
      var u2 = new URL(String(url), window.location.href)
      var range = String(u2.searchParams.get('range') || 'today')
      if (['today', '7d', 'all'].indexOf(range) < 0) range = 'today'
      var led = ledger()
      var days = range === 'today' ? [{ date: led.date, used: Number(led.todayUsed) || 0, turns: Number(led.todayTurns) || 0 }]
        : history7(led).slice(range === '7d' ? -7 : 0)
      return reply({
        ok: true,
        range: range,
        q: String(u2.searchParams.get('q') || ''),
        totals: { amount: 0, turns: 0, tokens: 0 },
        byModel: [],
        days: days,
        items: [],
        itemCount: 0,
        retention: { turnsLive: 0, turnsCap: 500, turnDays: 90, dailyDays: Object.keys(led.daily || {}).length, dailyCap: 365, archived: 0, archiveCap: 20000 },
        now: new Date().toISOString(),
      })
    }

    if (path === '/xjj/about.json') {
      var led2 = ledger()
      return reply({
        ok: true,
        version: VERSION,
        pluginDir: null,
        files: {},
        build: { stale: false, minutes: null },
        ledger: { day: led2.date, todayUsed: Number(led2.todayUsed) || 0, turns: Number(led2.todayTurns) || 0, unpriced: 0, days: Object.keys(led2.daily || {}).length },
        holiday: { through: HOLIDAY_TABLE_THROUGH_YEAR, ok: hasHolidayCoverage() },
        wait: { pending: null, sessionName: '' },
        adminHosts: 0,
        routes: ['/xjj/state.json', '/xjj/turn.json', '/xjj/config.json', '/xjj/ping.json', '/xjj/wait.json', '/xjj/usage.json', '/xjj/about.json'],
        mode: 'web',
        now: new Date().toISOString(),
      })
    }

    return reply({ ok: false, error: '网页版没有这个接口：' + path }, 404)
  }

  function installStyle() {
    try {
      if (document.getElementById('xjj-web-style')) return
      var s = document.createElement('style')
      s.id = 'xjj-web-style'
      // 普通网页的层级比 DSH 复杂，抬到最高一层；只动 z-index，不碰视觉参数
      s.textContent = '#xjj-web-root .xjj-root{z-index:2147483000!important}'
      ;(document.head || document.documentElement).appendChild(s)
    } catch (err) { /* 样式注入失败不致命 */ }
  }

  function mount(Comp) {
    var host = document.getElementById('xjj-web-root')
    if (!host) {
      host = document.createElement('div')
      host.id = 'xjj-web-root'
      // 挂到 <html> 而不是 <body>：SPA 路由切换常整块清空 body
      document.documentElement.appendChild(host)
    }
    installStyle()
    window.ReactDOM.createRoot(host).render(window.React.createElement(Comp))
  }

  function start(factory) {
    var mod = factory(function (name) {
      if (name === 'react') return window.React
      if (name === 'react-dom' || name === 'react-dom/client') return window.ReactDOM
      return null
    })
    var mounted = false
    var ctx = {
      effect: function (fn) {
        try {
          var dispose = fn()
          return typeof dispose === 'function' ? dispose : function () {}
        } catch (err) { return function () {} }
      },
      locale: {
        register: function () {},
        bind: function () { return function (key) { return key } },
        getLocale: function () { return { id: String(navigator.language || 'zh').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh' } },
      },
      slots: {
        inject: function (name, cb) { return cb() },
        register: function (spec, Comp) {
          if (!mounted) { mounted = true; mount(Comp) }
          return function () {}
        },
      },
    }
    mod.apply(ctx)
  }

  function boot(factory) {
    if (window.__XJJ_BOOTED__) return
    window.__XJJ_BOOTED__ = true
    // 语言：网页版看浏览器语言（DSH 版由宿主 locale 决定，见 client.template.js 的 apply）
    try {
      var nav = String((navigator && (navigator.language || (navigator.languages && navigator.languages[0]))) || 'zh')
      if (window.__XJJ_I18N && typeof window.__XJJ_I18N.setLang === 'function') window.__XJJ_I18N.setLang(nav)
    } catch (err) { /* 拿不到就用默认中文 */ }
    var tries = 0
    ;(function attempt() {
      if (window.React && window.ReactDOM) { start(factory); return }
      if (++tries > 60) {
        console.warn('[青云剑仙] 没等到 React / ReactDOM，挂件没装上（检查 @require 是否被拦截）')
        return
      }
      setTimeout(attempt, 200)
    })()
  }

  return {
    version: VERSION,
    // 必须返回 Promise：前端有 fetch(url).then(...) 的写法，直接给 Response 会报
    // "fetch(...).then is not a function"（冒烟测试抓到的）
    fetch: function (url, init) {
      try {
        return Promise.resolve(handle(url, init))
      } catch (err) {
        return Promise.resolve(reply({ ok: false, error: String((err && err.message) || err) }, 500))
      }
    },
    boot: boot,
    // 给守卫和自检用
    _internal: { peakState: peakState, bjNow: bjNow, ledger: ledger },
  }
})()
