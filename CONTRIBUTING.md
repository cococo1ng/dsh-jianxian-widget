# 贡献指南

先谢谢你有兴趣。这个项目的规矩不多，但有几条是踩出来的，麻烦照着来。

## 环境

- Node ≥ 18（守卫、审计、变异体）
- Python ≥ 3.9（`build.py`，只用标准库）
- 真浏览器冒烟需要 Playwright + Chromium（可选）

```bash
npm run build     # 产物：plugin/client.js + dist/xjj.user.js
npm test          # 六道守卫 + 几何矩阵，提交前必须全绿
```

## 铁律

1. **只改源头**：前端改 `src/client.template.js`，然后 `npm run build`。
   `plugin/client.js` 与 `dist/xjj.user.js` 是**产物**，手改会在下次构建被覆盖，PR 里请连产物一起提交。
2. **改动必升版本号**：`package.json`（根）与 `plugin/package.json` 同步升，写进 `CHANGELOG.md`。
   面板版本行读的是 `__XJJ_VERSION__` 占位符，构建时自动注入，不要手写版本号。
3. **宿主改动 = 重启客户端；纯前端 = Ctrl+F5**。说"改好了"之前，要能说出对方看到的是哪个版本号。
4. **新写一条守卫，必须配一个变异体**：`test-teeth.mjs` 里改坏副本后守卫必须变红且命中期望标签，
   只变红不命中（或者永远红）都不算。
5. **新配置键必须有消费方**：加开关的同一次改动里要有读它的代码，否则就是死配置。
6. **加动画/长动作前先列清单**：目标元素身上有没有 CSS `animation` 在写 `transform`、
   有哪些定时器会写同一个状态。御剑飞行为此连修三次。
7. **一次只动一个视觉维度**（字号 / 颜色 / 间距分开提交），否则没人能判断是哪一项不对。

## 加一个姿态

1. 抠好的图放 `assets/vNN/`（webp，内容高度对齐、贴底、水平居中）。
2. `build.py` 的 `TOKENS` 加一行占位符。
3. `src/client.template.js` 的 `POSES` 加键 + 占位符。
4. `plugin/README.md` 的姿态表加一行；如果常驻姿态数变了，`check-copy.mjs` 会逼你同步
   `locale/zh.json`、`locale/en.json`、根 `README.md` 的数字。
5. `npm run build && npm test`。

## 提交

- 一次提交一件事，标题写清楚做了什么（中文可以）。
- 带截图/录屏更好——视觉改动光看代码看不出来。
- 不要提交：`tools/`、`_review/`、`_orig-download/`、`assets-backup-*`、`plugin/*.bak*`（`.gitignore` 已挡）。

## 提问

开 issue，说清楚：版本号、装的是哪种形态（DSH 插件 / 网页脚本）、浏览器、复现步骤、控制台报错。
