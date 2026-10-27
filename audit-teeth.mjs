// audit-teeth.mjs —— 守卫"门齿"静态审计（只认能自动查的形态，查不了的不假装）
//
// 背景（抄自 dsh-wallpaper-engine 的 test/tools/audit-guard-teeth.mjs）：
//   守卫失效有两种，第二种**不会变红** —— 守卫还在跑，但已经咬不动：
//     R1 恒真断言      ok(true) / ok(1) / ok('x')：写完就没打算判
//     R2 伪断言        console.log 里带比较运算符：日志里**像**在判，实际不影响退出码
//     R3 没有会红的出口 全文有 ok(，却没有 process.exit(非零) 或 throw
//     R4 零引用判据     声明了判断函数/助手，全文只出现一次（就是声明那行）⇒ 有守卫、没调用方
//
// 不覆盖（写清局限，别让读者以为它穷尽）：
//   · "对照构造了却没被评估"（push 在评估之后）：本仓测试没有这种结构，扫描面为空，未实现
//   · "朴素剥注释吃掉真代码"：本工具按行跳过注释，不做字符串感知剥除，也不审计这一点
//   · "红了但红错了原因"：静态查不出来，交给 test-teeth.mjs 的变异体（它同时校验退出码与标签）
//
// 用法：
//   node audit-teeth.mjs              # 审计默认守卫文件，有发现则退出码 1
//   node audit-teeth.mjs --selftest   # 先证明"写坏必报"：喂 4 个坏样本必须全报、1 个好样本必须零报
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const GUARDS = ['test-routes.mjs', 'test-billing.mjs']
const isCommentLine = (line) => /^\s*(\/\/|\*|\/\*)/.test(line)
const isBlank = (line) => !line.trim()

/** 对一份源码文本跑四条规则，返回 [{rule, line, text, why}] */
export function auditText(src, label) {
  const lines = String(src).split('\n')
  const out = []
  const code = lines.map((l, i) => ({ n: i + 1, text: l, skip: isBlank(l) || isCommentLine(l) }))

  // R1 恒真断言：第一个实参是字面量 true/1/非空字符串
  for (const { n, text, skip } of code) {
    if (skip) continue
    if (/\bok\(\s*(true|1|'[^']*'|"[^"]*")\s*,/.test(text)) {
      out.push({ rule: 'R1', line: n, text: text.trim(), why: '恒真断言：第一个实参是字面量' })
    }
  }

  // R2 伪断言：日志里出现比较/三目，且本文件确实有 ok(（说明它在用断言框架）
  const hasOk = /\bok\(/.test(src)
  if (hasOk) {
    for (const { n, text, skip } of code) {
      if (skip) continue
      if (!/console\.(log|info|warn|error)\s*\(/.test(text)) continue
      if (/(===|!==|>=|<=|==|!=)/.test(text) && !/(PASS|FAIL|✓|✗)/.test(text)) {
        out.push({ rule: 'R2', line: n, text: text.trim(), why: '伪断言：日志里带比较，不影响退出码' })
      }
    }
  }

  // R3 没有会红的出口
  if (hasOk) {
    // 「会红的出口」：字面 exit(1)、三元/变量的 exit（fails ? 1 : 0）、exitCode 赋值、抛错
    const hasExit = /process\.exit\s*\(\s*[^)]*\b1\b/.test(src) || /process\.exitCode\s*=/.test(src) || /throw new Error/.test(src)
    if (!hasExit) out.push({ rule: 'R3', line: 0, text: label || '', why: '有 ok( 但没有任何非零退出/抛错出口' })
  }

  // R4 零引用判据/助手：function X( 、const X = (  /  const X = function
  const decls = []
  code.forEach(({ n, text, skip }) => {
    if (skip) return
    const fn = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/.exec(text)
    if (fn) decls.push({ name: fn[1], line: n })
    const arrow = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(\(|function\b)/.exec(text)
    if (arrow) decls.push({ name: arrow[1], line: n })
  })
  for (const { name, line } of decls) {
    if (name === 'ok' || name === 'main' || name.startsWith('_')) continue
    const refs = (src.match(new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g')) || []).length
    if (refs <= 1) out.push({ rule: 'R4', line, text: name, why: '声明了但全文只出现一次（没有调用方）' })
  }
  return out
}

function runAudit(files) {
  let total = 0
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8')
    const findings = auditText(src, f)
    if (!findings.length) {
      console.log(`  ✅ ${f} 无发现`)
      continue
    }
    total += findings.length
    console.log(`  ❌ ${f} 发现 ${findings.length} 处`)
    for (const f2 of findings) console.log(`     [${f2.rule}] L${f2.line} ${f2.why} → ${f2.text.slice(0, 100)}`)
  }
  return total
}

function selftest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xjj-teeth-audit-'))
  const bad = {
    'true-check.mjs': "ok(true, '恒真');\nprocess.exit(fails ? 1 : 0)\n",
    'pseudo.mjs': "ok(1 === 1, 'x');\nconsole.log('n === 1:', n === 1);\nprocess.exit(fails ? 1 : 0)\n",
    'no-exit.mjs': "ok(a === 1, 'x')\nconsole.log('done')\n",
    'dead-helper.mjs': "function unusedCheck(x) { return x === 1 }\nok(a === 1, 'x')\nprocess.exit(fails ? 1 : 0)\n",
  }
  const good = "function call() { return 1 }\nok(call() === 1, '真判据')\nprocess.exit(fails ? 1 : 0)\n"
  const cases = []
  for (const [name, src] of Object.entries(bad)) {
    const p = path.join(tmp, name)
    fs.writeFileSync(p, src, 'utf8')
    const n = auditText(src, p).length
    cases.push({ name, expect: '报警', got: n > 0 ? '报警' : '没报', ok: n > 0 })
  }
  const gp = path.join(tmp, 'good.mjs')
  fs.writeFileSync(gp, good, 'utf8')
  const gn = auditText(good, gp).length
  cases.push({ name: 'good.mjs', expect: '零报', got: gn === 0 ? '零报' : gn + ' 条', ok: gn === 0 })

  fs.rmSync(tmp, { recursive: true, force: true })
  console.log('  自检：')
  let bad2 = 0
  for (const c of cases) {
    if (!c.ok) bad2 += 1
    console.log(`     ${c.ok ? '✅' : '❌'} ${c.name} 期望「${c.expect}」实际「${c.got}」`)
  }
  return bad2
}

const arg = process.argv[2]
if (arg === '--selftest') {
  const bad = selftest()
  process.exit(bad ? 1 : 0)
}

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''))
const files = GUARDS.map((f) => path.join(root, f)).filter((f) => fs.existsSync(f))
if (!files.length) {
  console.error('❌ 一个守卫文件都没找到（在 ' + root + '）')
  process.exit(1)
}
console.log('门齿静态审计：')
const findings = runAudit(files)
console.log('')
if (findings) {
  console.log(`❌ ${findings} 处「有这个守卫、但它咬不动」的写法`)
  process.exit(1)
}
console.log('✅ 静态审计通过（R1 恒真 / R2 伪断言 / R3 无出口 / R4 零引用）')
