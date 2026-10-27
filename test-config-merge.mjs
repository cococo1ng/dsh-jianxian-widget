// test-config-merge.mjs —— 守住「存得进去、读得回来」
//
// 2026-10-27 的 bug：今日预算点好几次，重开还是「关」。
// 原因不是保存失败（config 文件里 daily=10 明明写进去了），是 mergeConfig 没合并 budget，
// 下次加载被 DEFAULT_CONFIG 的 0 盖回去。lineLib 同样中招。
//
// 做法：把 DEFAULT_CONFIG / STALE_TEXTS / mergeConfig 从模板里抽出来，在 vm 里跑真函数，
// 断言「写进 saved 的字段能活着出来」。
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const SRC = fs.readFileSync(process.env.XJJ_TEMPLATE || 'src/client.template.js', 'utf8')

function sliceBetween(startMark, endMark, includeEnd) {
  const a = SRC.indexOf(startMark)
  if (a < 0) throw new Error('模板里找不到：' + startMark)
  const b = SRC.indexOf(endMark, a)
  if (b < 0) throw new Error('模板里找不到结束标记：' + endMark)
  return SRC.slice(a, b) + (includeEnd || '')
}

const defSrc = sliceBetween('const DEFAULT_CONFIG = {', '\n    };', '\n    };')
const staleSrc = 'const STALE_TEXTS = {};'
const mergeSrc = sliceBetween('function mergeConfig(', 'function Widget(')

const sandbox = {}
vm.createContext(sandbox)
vm.runInContext(defSrc + '\n' + staleSrc + '\n' + mergeSrc + '\n', sandbox)
const mergeConfig = sandbox.mergeConfig
assert.equal(typeof mergeConfig, 'function', '没抽到 mergeConfig')

const base = (extra) =>
  Object.assign(
    {
      version: 10,
      queue: [],
      texts: {},
      notice: {},
      sound: {},
      ui: {},
      wellness: {},
      warn: {},
      chatter: {},
    },
    extra
  )

test('budget.daily 存得住（这次的 bug）', () => {
  const out = mergeConfig(base({ budget: { daily: 25 } }))
  assert.equal(out.budget.daily, 25)
})

test('budget 缺省时回 0，不炸', () => {
  assert.equal(mergeConfig(base({})).budget.daily, 0)
  assert.equal(mergeConfig(null).budget.daily, 0)
})

test('lineLib 存得住', () => {
  const out = mergeConfig(base({ lineLib: [{ style: {}, modules: [] }] }))
  assert.equal(out.lineLib.length, 1)
})

test('ui.theme 存得住（插件自己的主题偏好）', () => {
  const out = mergeConfig(base({ ui: { theme: 'light' } }))
  assert.equal(out.ui.theme, 'light')
  // 没设过时回默认 auto（跟 DSH），不该变 undefined
  assert.equal(mergeConfig(base({})).ui.theme, 'auto')
})

test('旧版本（legacy 分支）也认 budget', () => {
  const out = mergeConfig({ version: 3, budget: { daily: 50 }, texts: {} })
  assert.equal(out.budget.daily, 50)
})

test('其他键没有被这次改动带坏', () => {
  const out = mergeConfig(base({ notice: { lateNight: false }, sound: { on: false } }))
  assert.equal(out.notice.lateNight, false)
  assert.equal(out.sound.on, false)
})

// 这一条是总闸：以后新增 DEFAULT_CONFIG 顶层字段，忘了在 mergeConfig 里合并就红。
// 比逐字段写用例更省事，也不会漏。
test('DEFAULT_CONFIG 的每个顶层键都被 mergeConfig 合并', () => {
  const keys = [...defSrc.matchAll(/^      ([a-zA-Z_]\w*):/gm)].map((m) => m[1])
  const merged = new Set([...mergeSrc.matchAll(/out\.([a-zA-Z_]\w*)/g)].map((m) => m[1]))
  const miss = keys.filter((k) => k !== 'version' && !merged.has(k))
  assert.deepEqual(miss, [], '这些键存进去会被默认值盖回来（去 mergeConfig 补合并）：' + miss.join(', '))
  assert.ok(keys.length >= 10, '只抽到 ' + keys.length + ' 个键，抽取规则可能失效了')
})
