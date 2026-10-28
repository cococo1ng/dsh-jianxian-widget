# 青云剑仙 · 网页版（Tampermonkey / 任意网页）

同一份前端，两个壳：`plugin/` 是 DSH 插件，`dist/xjj.user.js` 是网页版用户脚本。
**核心逻辑共用一个源文件** —— `src/client.template.js` 里 2522 行只有末尾 30 行是 DSH 接入，
网页版把这 30 行换成"挂到 `document.documentElement`"，其余一行不动。

```
src/client.template.js  ──build.py──┬── plugin/client.js     （DSH：ModuleLoader + shell.overlay 插槽）
                                    └── dist/xjj.user.js     （网页：IIFE + #xjj-web-root）
src/host.web.js         ────────────┘  复刻宿主的 6 个 /xjj/*.json（localStorage）
```

## 装

1. 浏览器装 Tampermonkey（或 Violentmonkey）。
2. 新建脚本 → 把 `dist/xjj.user.js` 整个粘进去 → 保存。
   首次运行要联网拉两遍 React 18.3.1（`@require` 里的 jsdelivr），之后走浏览器缓存。
3. 打开任意网页，右下角出现人物。点人物冒泡，点法宝开面板。

想只在自己常去的站点跑，把头部 `@match *://*/*` 改窄，例如：

```
// @match        https://chat.deepseek.com/*
// @match        https://*.example.com/*
```

**界面语言**：跟着浏览器走（`navigator.language` 以 `en` 开头就是英文，否则中文），没有开关。
DSH 版则跟着宿主语言设置。译文表在 `src/i18n/en.json`，`node check-i18n.mjs` 是覆盖率守卫。

## 能用 / 不能用

| 能力 | 网页版 | 说明 |
|---|---|---|
| 23 个常驻姿态、24 帧剑舞、御剑飞行、14 件法宝、10 路音效 | ✅ | 素材全部内联，和 DSH 版一模一样 |
| 气泡（点击序列 / 变体 / 加权随机 / 逐行样式 / 可视化编辑器） | ✅ | 配置存 localStorage |
| 提醒：深夜劝睡、喝水歇眼、闲聊、提示间隔、人物大小、贴边镜像 | ✅ | 纯前端计时，不依赖宿主 |
| 峰谷档位与倒计时 | ✅ | 与宿主同一套口径（工作日 9–12 / 14–18，周末与法定节假日全谷价） |
| 余额 / 今日已用 / 账本 / 每轮消耗 / 提问授权提醒 | ❌ | 这些只有 DSH 宿主有数据源：余额要走凭据服务和 `api.deepseek.com`，轮次来自 `session/event`。网页版如实显示 `—`，不会瞎猜 |

> 想要余额和账本，装 DSH 版；网页版是"人在网页上，剑仙也在"的那一半。
>
> 另外网页版把两处 3 秒轮询（每轮消耗 / 提问挂起）降到 60 秒：DSH 里问的是本地接口无所谓，
> 放到每个网页上就没必要一直问。这一处是构建时改的（`build.py` 里锚点替换，只影响 web 产物）。

## 存在哪

`localStorage`，键名 `xjj.cfg.v1`（配置）与 `xjj.state.v1`（逐日计数）。
**按站点隔离** —— 每个域名一份配置，换站点等于换一套设置（这是浏览器同源策略决定的，不是 bug）。
清站点数据 = 恢复默认。

## 隐私

- 除首次加载 React 的两个 CDN 文件外**不发起任何网络请求**，不上报、不读页面内容、不碰 cookie。
- `@grant none`：不申请任何 Tampermonkey 特权 API，脚本就在页面里跑。

## 已知限制

- **严格 CSP 的站点**可能拦掉内联 `<style>`（挂件的 CSS 是 React 里渲染的一个 `<style>` 节点）。遇到"人出来了但没样式"，就是这一条；目前没有绕过方案，只能换站点或让管理员放行。
- 挂件 `z-index` 被垫片抬到 `2147483000`，仍可能和某些站点的全屏遮罩打架。
- 站点的 SPA 路由切换如果整块重建 `<body>` 不受影响（我们挂在 `<html>` 上），但如果它替换 `document.documentElement`（极少见）会掉。
- 面板里"复制文件路径"在网页版复制的是 `localStorage://xjj.cfg.v1`，不是文件。

## 自己构建 / 验收

```sh
python build.py --target all      # 出两个产物；只出网页版用 --target web
node --check dist/xjj.user.js     # 语法

# 真浏览器冒烟（需要先起静态服务）
python -m http.server 8791 --bind 127.0.0.1
python verify/web_smoke.py        # 8 项断言 + verify/web-shot.png
```

冒烟脚本查：垫片加载、`#xjj-web-root` 挂载、39 张 sprite、z-index、点人物冒泡、点法宝开面板、
配置写入、控制台零报错。
