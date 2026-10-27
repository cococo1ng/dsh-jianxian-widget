# 青云剑仙（dsh-jianxian-widget）

DSH 网页界面右下角的常驻挂件：白发墨金的剑修大师兄。替你盯余额、记消耗、提醒该睡了，也会自己御剑绕屏飞一圈。
一个宿主插件（8 条路由，全在 `webServer` 上）+ 一个纯前端挂件；**不向 agent 注册工具、不占 token**。

<p align="center">
  <img src="https://raw.githubusercontent.com/cococo1ng/dsh-jianxian-widget/main/docs/img/hero-compare.png" alt="白衣（浅色主题）/ 黑衣（深色主题）" width="820">
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/cococo1ng/dsh-jianxian-widget/main/docs/img/panel-compare.png" alt="数据页：中文 / English" width="760">
</p>

> English edition: [README.en.md](README.en.md)。

| 项 | 值 |
|---|---|
| 版本 | **v4.27.2** |
| 姿态 | **23 个常驻** + **24 帧剑舞** |
| 法宝（菜单按钮皮肤） | 14 件 |
| 音效 | 10 路，各带开关 |
| 面板 | 6 个页签（272px 宽） |
| 浮窗 | 气泡编辑器（420px）、关于（420px，入口在标题栏右侧）、自检 |
| 数据 | `~/.dsh/`（宿主端；换端口、清浏览器缓存都不丢） |

---

## 一、界面

### 挂件

右下角一个人物，可缩放 0.70–1.60×。**拖动 = 移动位置**（松手 22px 内自动吸附到边角），坐标写进配置，重启都在原位；贴左时整体水平镜像（可关）。
右键人物，或 hover 后点他头顶的法宝图标，打开面板。

### 面板（6 个页签）

| 页签 | 内容 |
|---|---|
| **数据** | 余额、今日已用、今日轮数（含平均每轮）、最近一笔、告急阈值、立即刷新余额、近 7 天柱状图 |
| **账本** | 今日 / 近 7 天 / 全部；合计（¥·轮·token）、按模型占比条、逐条明细（日期时间·模型·金额）、搜索、保留期一行 |
| **声音** | 总开关、音量滑杆、10 路音效逐项开关 |
| **外观** | 14 件法宝、人物大小、气泡停留 3–30 秒、点击气泡、贴左自动镜像、回到右下角 |
| **提醒** | 余额告急 → 每轮消耗 → 提问提醒 → 授权提醒 → 今日预算 → 温馨提示 → 深夜劝睡 → 提示间隔 → 闲聊间隔 |
| **更多** | 舞一段 → **飞一圈** → 预览动作 → 提醒一句 → **可视化编辑** → 复制路径 → 产物 / 构建 → 版本号（**恢复默认**在编辑器头部） |

### 两个浮窗

- **气泡编辑器**（更多 → 可视化编辑；右上角有**恢复默认**，只重置当前目标并二次确认）：选目标（首次点击泡 / 队列项 / 变体）、行增删与 ↑↓、行内模块（文本/余额/今日/峰谷/随机/图片；每行 ≤6、每泡 ≤6 行）、行样式（字号/颜色/B/I/U）、常用行库（存/插/删）、预览、保存。
- **自检**（更多 → 自检）：版本、前端产物体积、**构建是否落后于模板**、今日账本、当前挂起。数据来自 `/xjj/about.json`。

---

## 二、动作

### 23 个常驻姿态

| # | 名称 | 键 | 素材 |
|---|---|---|---|
| 1 | 静立 | `idle` | v7/idle.webp |
| 2 | 作揖 | `greet` | v12/greet.webp |
| 3 | 擦剑 | `sword` | v7/sword.webp |
| 4 | 御剑 | `fly` | v7/fly.webp |
| 5 | 看玉简 | `ledger` | v7/ledger.webp |
| 6 | 摊手 | `shrug` | v7/shrug.webp |
| 7 | 抬手 | `refuse` | v6/refuse2.webp |
| 8 | 收剑 | `bye` | v7/sheath.webp |
| 9 | 举拳 | `win` | v8/win.webp |
| 10 | 冷怒 | `angry` | v8/angry.webp |
| 11 | 掏钱袋 | `poor` | v8/poor.webp |
| 12 | 数灵石 | `coins` | v8/coins.webp |
| 13 | 守炉 | `forge` | v4b/forge.webp |
| 14 | 打盹 | `doze` | v4b/doze.webp |
| 15 | 打哈欠 | `yawn` | v12/yawn.webp |
| 16 | 递茶 | `tea` | v7/tea.webp |
| 17 | 打坐 | `meditate` | v8/meditate.webp |
| 18 | 负手 | `back` | v7/back.webp |
| 19 | 抬头 | `sky` | v6/sky.webp |
| 20 | 缓步 | `walk` | v6/walk.webp |
| 21 | 小酌 | `sip` | v11/sip.webp |
| 22 | 拔剑 | `wipe` | v11/wipe.webp |
| 23 | 抚颔 | `chin` | v11/chin.webp |

> `sleep` 是**状态不是第 24 个动作**：深夜「睡了」复用打盹那张（`v4b/doze.webp`），所以常驻图仍是 23 张、动作预览也是 23 项。

> ⚠️ `sword` / `wipe` 两个**键名与画面内容相反**（`sword` 那张是擦剑，`wipe` 那张才是拔剑）。显示名已按画面校正，指针也已对调（「剑来」用 `wipe`、「剑要常擦」用 `sword`）。改配置时不要按字面理解这两个键。

### 剑舞与御剑飞行

- **剑舞**：24 帧（`dance01`–`dance24`），更多 → 看一套剑舞。
- **御剑飞行**：两个入口 —— ① 更多 → 飞一圈；② **3 秒内连点人物 5 下**。
  从当前位置起飞 → 绕屏幕中心 1.35 圈 → 精确飞回原位，约 6 秒；飞行中带青色光晕、±7° 倾角、风声，**按前进方向翻转朝向**；点击人物或按下即落地。落地位移不改挂件真实坐标。

### 触发时机

| 触发 | 姿态 |
|---|---|
| 默认 / 悬浮 | 静立 / 作揖（余额低于阈值时改为掏钱袋） |
| 我在跑任务 | 守炉 |
| 首次点击人物（「道友请留步」） | 作揖 |
| 点击序列里翻到「剑来」 | 拔剑 |
| 3 秒内连点 5 下 | **御剑飞行（绕屏一圈）** |
| 深夜（23:30–06:00）连点 3 下 | 打哈欠 + 「别点了，去睡」 |
| 深夜一次劝睡 | 打哈欠 |
| 余额读不出来 | 摊手 |
| 长时间无操作 | 打盹（深夜钻被窝 = 打坐） |

深夜连点 3 下那支**只在第 3 下触发、不清零计数**——继续点到第 5 下就改起飞出去。

---

## 三、提醒与音效

| 提醒 | 触发 | 开关键 |
|---|---|---|
| 余额告急 | 余额跌破阈值，每天一次 | `notice.lowBalance` |
| 每轮消耗 | 一轮结束，冒「本轮消耗」气泡 | `notice.turnCost` |
| 提问提醒 | DSH 用 `ask_user_question` 等你回答 | `notice.askWait` |
| 授权提醒 | DSH 请求你批准 | `notice.approveWait` |
| 今日预算 | 当日已用达到预算，每天一次 | `budget.daily`（0 = 关） |
| 温馨提示 | 喝水/歇眼/走动/吃饭轮转 | `notice.wellness` + `wellness.everyMin` |
| 深夜劝睡 | 23:30–06:00 每晚一次 | `notice.lateNight` |
| 闲聊 | 每 N 分钟一句，不连说同一句 | `chatter.on` + `chatter.everyMin` |

**提问/授权提醒**的泡泡是定版样式：标题 15px 亮青 `#7BEAFF` 加粗带光晕，正文 14px 金黄 `#FFC247`；同一件挂起只提醒一次（前端 3 秒轮询 `/xjj/wait.json`，按 `kind:id` 去重）。

**音效**：按压 / 松开 / 气泡 / 面板 / 法宝 / 衣料 / 御剑风声 / 晚磬 / 提示 / 结束，各带开关，共用一条音量（0–1，默认 0.5）。

---

## 四、气泡

- 点击序列：第 1 次点 = 首次泡，之后按队列推进，到底再点收起。
- 模块：文本 / 余额 / 今日已用 / 峰谷 / 随机语句（带权重、不连重）/ 图片。
- 样式：**行级**（字号、颜色、粗体、斜体、下划线、字距、行高）。行里写 
oFloor: true 才允许低于 14px（只给次要信息用，如消耗气泡第三行）。
- **可读性底线（渲染时强制）**：字号 ≥ **14px**；颜色亮度 < **0.82** 自动提亮；半透明度 < 0.92 抬到 0.92；气泡宽度下限 **296px**。你存的 11px / 暗灰不会被改，显示按底线兜底。
- 底图：`style.bg`（不写用内置墨底，气泡尾巴跟随底色）。**换浅底要同时把字色调暗**。

---

## 五、数据与接口

| 路由 | 作用 |
|---|---|
| `GET /xjj/state.json[?refresh=1]` | 余额、今日已用、峰谷、忙碌、近 7 天 |
| `GET /xjj/turn.json` | 最近一轮消耗（`seq` 递增，前端据此冒泡） |
| `GET /xjj/usage.json?range=today\|7d\|all&q=` | 账本页数据（合计 / 按模型 / 明细 / 保留期） |
| `GET /xjj/wait.json` | 提问/授权挂起 |
| `GET /xjj/config.json` / `POST` | 读 / 写配置 |
| `GET /xjj/about.json` | 自检 |
| `GET /xjj/ping.json` | 存活探针（给人手查，前端不调用） |

**写栅栏**：`POST /xjj/config.json` 必须同时满足 ① 带 `x-xjj-write: 1` ② Host 是回环 ③ 来源地址是回环、有 Origin 时同源。别的机器要管理：`XJJ_ADMIN_HOSTS=192.168.1.16:12824`。

| 文件（`$DSH_HOME`，默认 `~/.dsh`） | 用途 |
|---|---|
| `.xjj-state.json` | 账本：今日已用/轮数/token/模型分布、逐条明细、逐日汇总、`turnSeq` |
| `.xjj-config.json` | 气泡与外观配置 |
| `.xjj-usage-archive.json` | 被挤出的逐轮明细（上限 2 万条） |
| `.xjj-post.log` | 配置写回诊断日志（>200KB 重开） |

**模型显示名**：deepseek-flash → DeepSeek-V4.1-Flash、deepseek-v4-pro → DeepSeek-V4 Pro（只影响显示，API 与账本仍存 id）。\n\n**计费口径**：按模型真实 usage 累加；缓存写入按未命中价计；reasoning 已含在 output 内不重复计。
价目（元/百万 token，`[谷价, 高峰价]`）：Flash 命中 0.02/0.04、未命中 1/2、输出 4/8；Pro 命中 0.15/0.30、未命中 4.5/9.0、输出 13.5/27.0。
峰谷：工作日 9–12、14–18 为高峰；周末与 `PEAK_HOLIDAYS` 里的法定节假日全天谷价。

---

## 六、配置

`~/.dsh/.xjj-config.json`，首次运行自动写入默认预设，面板调整自动写回。

```jsonc
{
  "version": 10,
  "style":   { "bg": "linear-gradient(180deg,rgba(20,22,25,.985),rgba(7,8,10,.985))",
               "color": "#F3E6C8", "fontSize": 13, "radius": 10, "maxWidth": 276 },
  "sound":   { "on": true, "volume": 0.5, "press": true, "release": true, "turn": true,
               "bubble": true, "panel": true, "pick": true, "alert": true,
               "cloth": true, "wind": true, "bell": true },
  "warn":    { "balanceLow": 10 },
  "budget":  { "daily": 0 },
  "chatter": { "on": true, "everyMin": 10 },
  "wellness":{ "everyMin": 30 },
  "notice":  { "lateNight": true, "lowBalance": true, "turnCost": true,
               "wellness": true, "askWait": true, "approveWait": true },
  "bubbleOn": true,
  "bubbleHoldSec": 3,
  "ui":      { "scale": 1, "anchor": "br", "dx": 6, "dy": 10, "mirror": true,
               "talisman": "seal", "x": null, "y": null },
  "texts": {
    "lowBalance": "灵石不多了（{v}），省着点用。",
    "lateNight": "子时了。剑也该归鞘，你也该睡了。",
    "lateNag": "别点了，去睡。",
    "fly": "御剑去看看。",
    "turnTitle": "本轮消耗",
    "turnCost": "-{cost} · {tokens} tok",
    "busy": "炼丹中……别催。",
    "waitAsk": "东家，{session}在等你答话。",
    "waitApprove": "有件事要你点头（{session}）。",
    "budget": "今天已经用掉 {v}，到预算 {cap} 了。"
  },
  "lineLib": [],
  "idle":  [ { "text": "剑在鞘中，也在心里。", "pose": "idle" } ],
  "first": { "lines": [ /* 行 = { style, modules } */ ] },
  "queue": [ { "id": "present", "title": "本座在此", "pose": "greet",
               "variants": [ { "weight": 2, "lines": [] } ] } ]
}
```

占位符：`{v}` `{bal}` `{today}` `{todayRaw}` `{turns}` `{avg}` `{last}` `{label}` `{next}` `{window}` `{cd}` `{day}` `{cost}` `{tokens}` `{session}` `{cap}`。

---

## 七、验收（三层）

```sh
cd _tools/jianxian-widget
npm test        # 文案 → 译文 → 配置 → 结构 → 审计 → 两套守卫 → 几何 → 11 个变异体，约 1 分钟
```

| 层 | 命令 | 证明什么 |
|---|---|---|
| 前置检查 | `npm run test:copy` / `test:i18n` / `test:config` / `test:surface` | 文案对账、译文覆盖（源码 + 构建产物）、配置合并、结构完整性；这一层不过，后面不必跑 |
| 静态审计 | `node audit-teeth.mjs` / `--selftest` | 守卫没失去牙齿（无恒真断言 / 日志伪断言 / 无红出口 / 零引用判据） |
| 逻辑守卫 | `node test-routes.mjs`（45 项）、`node test-billing.mjs`（28 项） | 写栅栏、挂起状态机、账本、归档、计费、构建新鲜度 |
| 门齿验收 | `node test-teeth.mjs` | 11 个变异体改坏副本后，守卫必须**变红且命中期望标签** |

前端改动生效方式：`python build.py` → **Ctrl+F5** → 看「更多」页版本号。版本没变 = 还没拿到新包。

---

## 八、开发约定

1. **只改源头**：`src/client.template.js` → `build.py` 生成 `plugin/client.js`（素材以 data URI 内联）。**永不手改产物。**
2. **宿主改动要重启客户端**（`plugin/index.js`）；纯前端改动刷新页面即可。
3. **每次改动升版本号**（`plugin/package.json` + 面板版本行）；回报以版本号为准。
4. **姿态只能走 `setPose`**：它外面包了一层硬守卫 —— **飞行期间只放行 `'fly'`，其它一律拦下**。新增任何"到点改姿势"的定时器，必须先判 `flyingRef.current`，别指望调用方自觉。
5. 测试钩子：`XJJ_TEMPLATE_FILE` 覆盖模板路径，仅供守卫造「模板比产物新」的场景。
6. 素材：姿态图与音效都是本机生成后入 `assets/`；生成脚本属于开发工具（`tools/`），不随仓库发布。

---

## 九、已知限制

- **界面语言跟随 DSH 的语言设置**（中文 / English），不另设开关；译文表在 `src/i18n/en.json`。
- **御剑飞行时长（6 秒）写死**；连点窗口固定 3 秒（另有深夜连点 3 下催睡）。
- 气泡样式是**行级**的，不是逐模块；模块换位置要靠删除后重加。
- 编辑器不支持拖拽排序（用 ↑↓ 按钮）；随机模块权重固定按 1 存，要加权改 JSON。
- `sword` / `wipe` 键名与画面内容相反（见第二节）。
- 浅色气泡底会让文字看不清——渲染层按深底调过色，需要手动改 `style.color`。
- 余额取数优先 `DEEPSEEK_API_KEY`，读不到才用 DSH 账号登录态；两者账本口径不同，切来源当天数字会重新起算。

---

## 九·五、网页版（同一套前端，另一个壳）

DSH 之外也能用：`python build.py --target web` 会从**同一个模板**出 `dist/xjj.user.js`，
装进 Tampermonkey 即可在普通网页右下角挂这个人物。

- 共用：23 姿态 / 16 剑舞 / 14 法宝 / 10 音效 / 气泡 / 面板 / 提醒 / 峰谷；
- 降级：余额、今日已用、账本、每轮消耗、提问授权提醒（这些只有 DSH 宿主有数据源，网页版显示 `—`）；
- 配置落 `localStorage`（按站点隔离），`src/host.web.js` 负责复刻 6 个 `/xjj/*.json`。

细节与限制见 [`../docs/userscript.md`](../docs/userscript.md)。

---

## 十、许可

代码 **MIT**；姿态图 / 法宝图标 / 音效**不在 MIT 内**，随插件原样使用可以，单独提取再分发不行。
两份许可见仓库根目录的 `LICENSE` 与 `LICENSE-ASSETS`，来源说明见 `NOTICE.md`。






