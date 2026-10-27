# 对照清单：IG5 的审批门与工具面分级 → 青云剑仙

> 对照对象：`Minglink/dsh-infinite-gen-5` v1.3.0（CC BY-NC-SA 4.0，**只借鉴设计，不搬代码**）
> 本方：`dsh-jianxian-widget` v4.19.29
> 日期：2026-10-27 · 一次性读完两边源码后整理，行号是当时实测位置

## 0. 一句话结论

**两边根本不是一类插件：IG5 是"43 个模型工具 + 13 道审批门"，剑仙是"0 个工具 + 一道 HTTP 写栅栏"。**
所以能抄的不是代码，是三条纪律：**工具面要分档并量化**、**写操作要一次性审批且失败即拒**、**拒绝也要留证**。
其中第三条、以及"可选服务不进 inject"，剑仙**已经做对了**（`plugin/index.js:96` 注释里就写着"抄 IG5 的 fail-closed 证据纪律"）。

## 1. 基本盘

| | IG5 v1.3.0 | 青云剑仙 v4.19.29 |
|---|---|---|
| 模型侧工具 | 43 个（默认 8 个） | **0 个** |
| 模型侧技能 | 8 个 `skills/*/SKILL.md` | 0 个 |
| 斜杠命令 | `/ig5`（只读白名单） | 无 |
| 写通道 | 只走工具，**HTTP 明令不可写** | 只走 HTTP，三道本机栅栏 |
| 审批 | 13 个工具挂 `tools/pre-execute` | 无（只"感知"审批，供气泡提醒） |
| 审计 | `approvals.jsonl` | `.xjj-audit.jsonl`（放行/拒绝都记） |
| 前端 | 侧栏 tab + 3 条只读路由 | 侧栏面板 + 11 条路由 |

## 2. 逐项对照

| # | 维度 | IG5 怎么做（证据） | 剑仙现状（证据） | 差距 | 建议 |
|---|---|---|---|---|---|
| 1 | 工具面规模 | 43 个，默认只注册 Core 8 | 0 个，模型完全碰不到剑仙 | 不是缺陷，是产品选择 | 不开也行；一开就必须同时上 #2 #3 |
| 2 | 分级注册 | 全局只挂 Core 8；35 个按**调用者 agent 的 scoped registry** 挂（`workflow.js:84-103`），先 `restrict({deny:[]})` 探针证明宿主支持，再 `register`；部分失败逐个回滚（`:125-142`）；快照如实报 `toolsetScope: agent|plugin-instance`、`toolsetPersistent: false` | 无 | 大 | 开工具时照这套；宿主不支持 scoped 就退回"只挂 Core" |
| 3 | 工具面预算 | `tools/ci/tool-surface-size.mjs`：真注册一遍，按 `JSON.stringify(name+description+parameters).length/4` 估 token，Core 预算 4000；再与打包脚本里的 `publicToolCount`、审查过的分类 fixture 三方对账，对不上直接红 | **没有任何度量** | 中 | 即便 0 工具也先建脚本，把"模型可见面"钉住（面板注入文案 + 未来工具） |
| 4 | 写操作审批 | `tools/pre-execute` 拦截 13 个写工具（`source/approval_gate.js:44`）；只有 `allowed-once` 放行；`rejected`/`unavailable`/抛错/无 agent/无 approval 服务**全部 deny**；abort 后返回 cancel，await 之后再查一次 signal（`:63,:76`） | 无 | 大 | 开工具时直接照 `approval_gate.js` 缩编（见 §5） |
| 5 | 审批载荷 | 展示**完整**参数不截断 + 参数 SHA-256；超 131072 字符**直接拒绝**而不是展示一半（`approval_gate.js:15-17,51`）；含凭据的 `capture_control` 只展示脱敏摘要（`:30`） | 无（只有 GUI 气泡告诉你"DSH 在等你批"） | 中 | 抄"看不全就不放行"这条原则，比截断显示安全得多 |
| 6 | 审计留痕 | `approvals.jsonl` 记 tool/args/isError/detail；**审计写失败不能吞**，转 diag 痕迹（`approval_gate.js:98-101`） | `.xjj-audit.jsonl` 已有，放行+拒绝都记（`index.js:99-117`） | 已对齐 | 补一点：剑仙审计失败是静默 `catch(err){}`，IG5 会留 diag |
| 7 | 失败即关闭 | 任一依赖缺失 → deny，不猜 | 三道栅栏缺一即拒（`index.js:145-163`） | 已对齐 | 加变异体：去掉 `x-xjj-write` 必须红（见 test-routes） |
| 8 | 命令面 | `/ig5` 走宿主命令入口，**不过模型**；只放行 6 个只读工具白名单，写工具从命令里根本够不到（`workflow.js:176-185`） | 无 | 中 | 建议加 `/xjj`：`balance`/`mute 30`/`config path`，零 token 开销 |
| 9 | 可选服务 | `ctx.get('approval')`，**不进 inject**，拿不到就 deny（`approval_gate.js:65-67`） | 同一条：credentials/账号服务不进 inject（`index.js:306`） | 已对齐 | 保持 |

## 3. 已经对上、不用再抄的 4 条

1. **可选服务经 `ctx.get`，不进 `inject`** —— 两边一致，剑仙注释里写死了原因（老宿主没有）。
2. **拒绝也要留证** —— 剑仙 `.xjj-audit.jsonl` 放行/拒绝各一行。
3. **写通道要有来源校验** —— 剑仙比 IG5 更细：IG5 干脆不给 HTTP 写口；剑仙给，但用"自定义头 + Host 回环 + 远端回环 + Origin 同 Host"四道。
4. **版本号自查 + 三层验收** —— 剑仙 `audit-teeth / test-routes / test-teeth` + 面板版本行，IG5 对应 `tools/ci` 门禁 + `ig5_profile` 的 revision。

## 4. 建议动作（分级，不越权）

**A · 现在就能做（低风险，不碰运行逻辑）**
- A1 建 `tools/tool-surface.mjs`：把"模型可见面"量出来（当前 = 0 工具，主要为将来设闸）。
- A2 给 `test-routes.mjs` 补一条变异体：拿掉 `x-xjj-write` 必须红；再补"Host 非回环必须红"。
- A3 剑仙审计失败时留一行 diag（对齐 `approval_gate.js:98-101`）。

**B · 真要开工具时才做**
- B1 `XJJ_WRITE_TOOLS` 白名单 + `tools/pre-execute` 审批门（§5 骨架）。
- B2 Core/Full 两档：默认只挂 1–2 个只读工具（`xjj_status`），写工具按需展开。
- B3 审批载荷 ≥ 阈值直接 deny，不截断。

**C · 明确不抄**
- 43 工具那种规模、1 GiB 随包运行时、agent-scoped `restrict` 探针 —— 我们没有多引擎子进程，抄来只是负担。
- 它的 evidence L1–L4 分层文档体系：剑仙是产品线，不是研究线，用现有三层验收就够。

## 5. 若开工具：可直接照用的骨架

```js
// src/approval-gate.js —— 剑仙写工具的一次性审批门
// 照 IG5 source/approval_gate.js 缩编：只认 allowed-once，其余一律 deny
export const XJJ_WRITE_TOOLS = new Set(['xjj_set_config', 'xjj_set_volume'])

export function installApprovalGate(ctx) {
  ctx.effect(() => ctx.on('tools/pre-execute', async (exec, next) => {
    if (!XJJ_WRITE_TOOLS.has(exec?.name)) return next()
    if (exec?.signal?.aborted) return { kind: 'cancel' }

    // 可选服务：绝不写进 inject，老宿主没有 approval 就 deny
    let approval
    try { approval = ctx.get('approval') } catch (err) { approval = null }
    if (!exec?.agent || typeof approval?.request !== 'function')
      return { kind: 'deny', reason: `剑仙 ${exec.name} 需要活跃 agent 与审批服务，未派发。` }

    const detail = JSON.stringify(exec.arguments ?? {}, null, 2)
    let outcome
    try {
      outcome = await approval.request({
        agent: exec.agent, toolName: exec.name, callId: exec.callId, signal: exec.signal,
        reason: `青云剑仙要改东西：${exec.name}\n--- 将执行的参数 ---\n${detail}`,
      })
    } catch (err) {
      if (exec?.signal?.aborted) return { kind: 'cancel' }
      return { kind: 'deny', reason: '审批服务异常，未派发。' }
    }
    if (exec?.signal?.aborted || outcome === 'cancelled') return { kind: 'cancel' }
    if (outcome !== 'allowed-once')
      return { kind: 'deny', reason: `审批结果 ${outcome}，未派发。` }
    return next()
  }))
}
```

配套（照 IG5 `workflow.js:125-142` 的回滚写法，别只写 happy path）：

```js
function changeTools(owned, service, names) {
  const wanted = new Set(names), additions = []
  try {
    for (const name of wanted) {
      if (owned.has(name)) continue
      const dispose = service.register(CATALOG.get(name))
      if (typeof dispose !== 'function') throw new Error('registry 必须返回 disposer')
      owned.set(name, dispose); additions.push(name)
    }
  } catch (err) {
    for (const n of additions.reverse()) { owned.get(n)(); owned.delete(n) }
    throw err
  }
  for (const [n, dispose] of owned) if (!wanted.has(n)) { dispose(); owned.delete(n) }
}
```

## 6. 记一笔

IG5 真正值得学的不是工具数量，是它把"**看得见的代价**"写进了工程：
- 工具一多就量 token，量完还要和打包清单对账；
- 审批看不全就不放行，不放行也要留证；
- 做不到的能力写进 `LIMITATIONS.md`，而不是留在 README 里当卖点。

前两条能搬，第三条看我们自己要不要脸面那么硬。

## 7. 落地记录（2026-10-27，v4.19.31）

A 档三项已落地，B/C 档按原判断不动：

| 项 | 落点 | 验收 |
|---|---|---|
| A1 工具面冻结闸 | `scripts/tool-surface.mjs` + `scripts/tool-surface.json`，`npm run test:tokens` | 校验/`--selftest`/`--update` 三态；selftest 塞探测工具后必须报漂移 |
| A2 写栅栏变异体 | `test-teeth.mjs` M12（伪造 Host）、M13（非回环来源） | 10 个 node 变异体 + 3 个几何变异体全红且命中期望标签 |
| A3 审计失败留痕 | `plugin/index.js` → `~/.dsh/.xjj-diag.log`（where/route/code/error） | 探针：把 `.xjj-audit.jsonl` 做成目录 → 响应仍 `ok:true`，diag 落一行 `EISDIR` |

**过程中的一条教训**（写进这里免得下次再犯）：
M12 第一次跑**没红**。原因不是变异体写错，是 `test-routes.mjs` 里"伪造 Host"那条用例的 Origin 还写着
`127.0.0.1` —— 真正拦住它的是 Origin 校验，Host 校验根本没参与。断言绿着，但绿得不对。
把用例改成 Host 与 Origin 同为恶意站点后，M12 才按标签变红。**变异体的价值就在这儿：它逼你说清是哪一道门在拦。**

另：`plugin/package.json` 与根 `package.json` 的 description 里仍写着"16 帧剑舞"（4.19.30 改成 24 帧时漏改，
`check-copy` 只核常驻姿态数与 README，没核 description 里的剑舞帧数）。不在本次范围，未动。

