# 发布到 npm

## 发版检查清单（每次发版照着走，漏一项就得再走一轮审核）

| # | 步骤 | 最容易漏的点 |
|---|---|---|
| 0 | `python build.py --target all` → `npm test` → `python scripts/release.py` | 全绿才往下（release.py 会把下面几步再打印一遍） |
| 1 | 改版本号 4 处 + CHANGELOG 中英 + 打两个 zip | README 版本在**表格行**，正文提到旧版号不算错 |
| 2 | `git commit` + `git tag vX.Y.Z` + push main 与 tag | 直连就行，不用代理 |
| 3 | npm：token → 临时 npmrc → publish → **删 token** | 发完 registry 要 **≈6 分钟**才见到新版本，别急着判失败 |
| 4 | deepseek.stream 插件市场：编辑 → 传 zip → **点「确认发布新版本并就地更新 (vX.Y.Z)」** | 按钮会从「保存修改并即时生效」变名字，点旧的等于没点 |
| 5 | skillhub.cn Skill：发布/更新 → 传 zip → **图标切「自定义」传 plugin/icon.png** | ⚠️ **默认是平台预设的紫色方块**，不切就永远显示占位图 —— logo 白设计了 |
| 6 | 更新已有 Skill 时：Skill 文件必填（无新 zip 点「复用当前版本」）、变更说明必填 | 缺任何一项，「更新 Skill」点下去**静默无反应** |
| 7 | 平台状态回报：deepseek.stream「待审核」/ skillhub.cn「安全审核中」 | 图标与版本都要过审才公开 |

> 图标不是装饰：`plugin/icon.png`（512×512）就是插件在客户端、市场列表、Skill 详情页的脸。
> 每上传一次带图标的版本，都得在图标区确认显示的是剑仙立绘（不是紫色方块、不是旧版图）。
>
> **当前状态（2026-11-20 22:50）**
>
> - **GitHub**：main `f7ff4ae`、tag **v4.31.2** 已推（直连可用，**不用带代理**）
>   本轮三个提交：`30217b5` locale meta 自动同步 / `f117d40` 白衣补白 / `206cc95` 法宝缩小 / `f7ff4ae` 市场图重出
> - **npm latest**：`dsh-jianxian-widget@4.31.2`（2026-11-20 14:44 UTC 生效）
>   11 个文件 / 5.1 MB tgz / 6.9 MB 解包，shasum `a3f5387c42d850b5cc46dab180b21910e822f392`
>   —— granular token（Bypass 2FA + Read and write + All packages + 7 天）+ 临时 npmrc 发布，
>   **发完已在网页删 token**（列表回到 `Rows 1 to 0 of 0`），本地 token 文件与 npmrc 均已删
> - **npm 延迟实测（2026-11-20，npm 12.2.1）**：`npm publish` 打印 `+ pkg@ver` 之后，
>   `registry.npmjs.org/<pkg>` 的 `dist-tags.latest` 要 **约 4–6 分钟**才翻到新版本；
>   tarball 更慢一层：`/<pkg>/-/<pkg>-<ver>.tgz` 不带查询串仍 **404**，加 `?t=<时间戳>` 立刻 **200**。
>   **不要在这几分钟里判失败、更不要重复发布** —— 判据只有一条：直接读 packument 的 `dist-tags.latest`
> - **SkillHub（skillhub.cn，腾讯）**：skill `qingyun-jianxian` **v1.4.2 安全审核中**（1.4.1 已发布，91 下载）
>   https://skillhub.cn/dashboard （我的 Skills → 青云剑仙卡片 → 更新）
>   - 本轮上传包：`_publish/skillhub-cn-qingyun-jianxian-1.4.2.zip`（5 个文本文件 31.3 KB）
>   - 变更说明、版本号（1.4.2，平台自动 +1）、描述、分类（AI Agent / 工具调用）、图标（自定义·剑仙立绘）均已核对
> - **skillhub.cn 的四个坑（2026-11-20 实测补充）**：
>   1. **图标默认是「预设图标」**（紫色方块占位），不切「自定义」就永远是占位图 —— 首次发布就是这么丢了 logo。
>      要切「自定义」→「点击上传图片」→ 选 png（64×64 ~ 4096×4096，≤5 MB）→ 弹层里再点一次「上传」；
>   2. 更新时 **Skill 文件是必填**：没传新 zip 就点「复用当前版本」，否则点「更新 Skill」静默无反应；
>   3. 更新时**变更说明必填**、版本号平台会自动 +1（1.4.0 → 1.4.1）；只改图标也必须走一次「更新」并重新审核。
>   图标上传后要过合规审核才公开展示，所以刚提交时详情页看到的还是旧图/占位图。
>   4. **zip 里不要放 `icon.png`**（2026-11-20 实测）：平台会弹「部分文件被跳过 · 不支持的文件类型:
>      icon.png（禁止上传二进制文件）」，即 Skill 包只收文本；图标只走「自定义」那个独立上传位。
>      打包命令只打 5 个文本文件（SKILL.md / README.md / 3 个 references）。
> - **SkillHub 的「更新」入口**（实测）：dashboard 卡片上的「更新」是 `<span onclick>` 而不是 button/a，
>   用 `innerText === "更新"` 找 `<button>` 找不到；要点卡片里那个 span。弹窗打开后
>   `input[type=file]` 只在上传前存在，一旦选过文件就消失（改文件要先点「重新上传（清空）」）。
> - **SkillHub 的 Plugin 广场没有提交入口**（2026-11-20 实测）：整页只有 `owner/repo` 索引与本机安装提示，
>   全是 GitHub 收录制，页面底部只有「建议反馈」。要上插件广场只能走反馈申请或等官方索引，
>   **不是漏做，是没门**
> - **deepseek.stream（DeepSeek Harness Hub，另一个站，别和 SkillHub 混）**：
>   插件 `dsh-jianxian-widget` **v4.31.2 待审核**（`_publish/dsh-jianxian-widget-4.31.2.zip` 4.90 MB，
>   在详情页「✏️ 编辑插件」抽屉里「更新上传插件安装包」上传 → 填新版本号 → 按钮会自己改名为
>   **「确认发布新版本并就地更新 (vX.Y.Z)」**，点它才生效）；Skill `qingyun-jianxian` **v1.4.2 待审核**
> - **deepseek.stream 的 Skill 只能传单个 `SKILL.md`**（2026-11-20 实测）：`input[type=file]` 只收
>   `.md/.txt/.yaml/.yml`，不是 zip；`references/*.md` 不会跟着过去（那几个文件只存在于 SkillHub 的包里）。
> - **frontmatter 的 version 必须等于表单里填的版本号**，否则提交被拦，报
>   「frontmatter 的 name/version 必须与 Skill ID 和版本一致」：改版本 = 先改 SKILL.md 里的
>   `version:`，再上传让表单自动回填，别只改表单字段。
> - **两站的版本号机制不一样**：SkillHub 读的是「版本号」输入框（默认 = 上次 +1，所以 1.4.1 的包提交后显示
>   1.4.2）；deepseek.stream 直接用 frontmatter 里的原值。**源 SKILL.md 的 `version` 一律写对外版本**
>   （现在是 1.4.2），两站才不会各说各话。
> - **awesome-dsh-plugin**（DSH 客户端市场索引）：条目已收录，`url` 指向 `main/plugin`，
>   装到的就是最新 main
> - 发布顺序：build → `npm test` → `scripts/release.py` → git commit/tag/push →
>   打两个 zip（`_publish/dsh-jianxian-widget-<v>.zip`、`_publish/skillhub-cn-qingyun-jianxian-<v>.zip`）→
>   传 deepseek.stream 插件 + skillhub.cn 的 Skill → 最后 npm（要 token）
> - **SKILL.md 的三个平台坑（这次踩的）**：
>   1. frontmatter 必须有 `title`，否则平台取 `title || name`，显示名会变成英文 ID；
>   2. 必须有 `whenToUse`，否则「适用场景」那张表空白，模型无法按意图命中；
>   3. `category` 不写会落默认 `dev`（我们是 `tools`）。
> - Repository / homepage / Bugs 三个字段已填
>
> **为什么不用 OIDC（这条仍没走通，别再花时间重推 tag 试）**
>
> `publish to npm` workflow 第 9 步一直是 `error code ENEEDAUTH`。已排除的：
> runner 是 ubuntu-26.04 / node v24.22.2 / npm 11.19.1（版本够）；`id-token: write` 已声明，
> 自检步也确认 runner 注入了 `ACTIONS_ID_TOKEN_REQUEST_URL`；加 `--provenance` 后仍 `ENEEDAUTH`；
> 日志里 `oidc` / `provenance` / `trusted` / `id-token` 关键词各 0 命中 —— npm 根本没进 OIDC 分支。
> 结论：**卡点在 npm 账号侧还没有保存成功的 Trusted Publisher 记录**。网页上四个字段填完点
> 「Set up connection」会跳到「Confirm password to continue」，而账号 2FA 不是 TOTP，
> 密码那一步没有能过的路径。
>
> **现阶段发版流程（唯一可用的）**
>
> 1. `python build.py --target all` → `npm test` → `python scripts/release.py`（全绿）
> 2. 改版本号 4 处（根/plugin 两个 `package.json`、两个 `plugin/README*.md` 的版本表）
> 3. `git add -A && git commit && git tag vX.Y.Z`
> 4. `git -c http.proxy=http://127.0.0.1:57777 -c https.proxy=http://127.0.0.1:57777 push origin main`
>    （本机必须显式带代理，否则 `github.com:443` 直连超时）
> 5. 去 npm 网页 `Settings → Access Tokens → Generate New Token` 建 **granular token**：
>    Bypass 2FA 勾上（会弹一次密码）、权限 **Read and write (publish and stage)**、
>    scope **All packages**、有效期 7 天
> 6. 用它发布（不要写进 `~/.npmrc`，用临时 userconfig）：
>    ```bash
>    $env:NODE_AUTH_TOKEN='npm_xxxxxxxx'
>    # 临时 npmrc 里只写 registry + //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
>    npm publish ./plugin --access public --userconfig "$env:TEMP\xjj-pub.npmrc" \
>      --registry=https://registry.npmjs.org --provenance=false
>    ```
> 7. **发完立刻吊销**（网页 `Delete token ending in xxxx`，或
>    `DELETE https://registry.npmjs.org/-/npm/v1/tokens/token/<key>`），再删临时 npmrc
> 8. 验：`npm view dsh-jianxian-widget dist-tags --registry=https://registry.npmjs.org`
>
> **注意 npm 的缓存坑**：刚发完头几分钟，`https://registry.npmjs.org/<pkg>/-/<pkg>-<ver>.tgz`
> 可能仍 404（元数据已更新、tarball 还没铺开），而 `npm view` 已报新版本。
> 加个查询串（`?t=<时间戳>`）能立刻取到；`npm install` 会在几十秒内自己好。
>
> 后续发版：`git tag v4.27.7 && git push origin v4.27.7`（CI 会跑完测试并停在 publish 那步）

包名 `dsh-jianxian-widget`（npm 上未被占用）。发布方式两条，**推荐 A**。

---

## A. CI + OIDC 可信发布（推荐，仓库里不放任何 token）

前提：GitHub 仓库已经建好。

1. **推代码到 GitHub**（仓库地址决定 `repository` 字段，先推再填也行）：
   ```bash
   git remote add origin https://github.com/<你>/<仓库>.git
   git push -u origin main
   ```

2. **在 npmjs 配 trusted publisher**（关键是这一步的四个字段）：
   打开 `https://www.npmjs.com/package/dsh-jianxian-widget/access` → Trusted Publisher → GitHub Actions：

   | 字段 | 填什么 |
   |---|---|
   | Organization or user | 你的 GitHub 用户名（大小写不敏感） |
   | Repository | 仓库名 |
   | Workflow filename | `publish-to-npm.yml`（大小写敏感，必须和 `.github/workflows/` 里的文件名一致） |
   | Environment | 留空（workflow 里没声明 environment） |

   > 这个配置只能在包已经存在**或者**首发时通过 "Trusted Publisher" 入口建立。首发时 npm 页面会提示
   > "Publish a new package with a trusted publisher"，按它填同样四个字段即可。
   > 2026-09-03 起，新配置默认只允许 **stage**（暂存），首次发布会报
   > `403 OIDC permission denied for this action` —— 在配置里把 **Allow publish** 打开。

3. **打 tag 触发**：
   ```bash
   git tag v4.16.0
   git push origin v4.16.0
   ```
   workflow 会重建产物、跑五道守卫、再 `npm publish ./plugin`。带 provenance，签名绑定这次 run 和 commit。

4. **验**：
   ```bash
   npm view dsh-jianxian-widget version --registry https://registry.npmjs.org
   dsh plugin --profile desktop add dsh-jianxian-widget
   ```

---

## B. 本机直接发（token）—— 2026-10-26 实测：**这条路被 npm 封了**

本机用账号 `cococo1ng` 的 **Publish token** 试过一次真发布：

```
npm notice Publishing to https://registry.npmjs.org with tag latest and public access
npm error code E403
npm error 403 Forbidden - PUT https://registry.npmjs.org/dsh-jianxian-widget
npm error You may not perform that action with these credentials.
```

- token 本身有效：`npm token list` 能列出来（id `a8952e`，类型 **Publish token**），`npm whoami` 返回 `cococo1ng`；
- 但 `PUT` 被拒，连 `GET /-/npm/v1/user` 也是 403；
- CLI 自己打了两遍提示：**"npm tokens that bypass 2FA are being restricted for account changes and direct publishing"**
  （策略变更 2026-09-03 起，见 [GitHub Changelog](https://github.blog/changelog/2026-09-03-multiple-trusted-publishing-configurations-for-npm/)）。

**结论：绕过 2FA 的 token（Publish / Automation）不能再直接发布。** 要用 token 只能：
换成普通 token + 发布时提供 6 位 OTP（`npm publish --otp=123456`，未实测），或者干脆走 A（OIDC）。

本机还有两个坑（跟 403 无关，但会挡路）：

| 项 | 现状 | 影响 |
|---|---|---|
| npm 版本 | 10.9.4 | 用 token 发布够用；OIDC 可信发布要 ≥ 11.5.1（CI 用 Node 24 自带 npm 11，不受影响） |
| registry | `http://registry.npm.taobao.org/`（废弃 + http） | 任何发布命令都要显式 `--registry=https://registry.npmjs.org`，否则连不上 |
| 本机 shell | 无 TTY | `npm login --auth-type=web` 会退回到问 `Username:`，没人回答就退出 —— 所以登录必须在你自己的终端里做 |

---

## 发之前必查（脚本已代做）

`python scripts/release.py` 会依次把住：

1. 根 `package.json` 与 `plugin/package.json` 版本一致；
2. 产物里没有未替换的占位符（`__XJJ_VERSION__` / `__POSE_*`）；
3. `plugin/package.json` 里 **没有 `private: true`**（有就发不出去）；
4. `publishConfig.access = public`；
5. `npm pack` 出来的包里**这 10 个文件都在**：`index.js`、`client.js`、`package.json`、`cordis.patch.yml`、
   `icon.png`、`README.md`、`screenshot.png`、`screenshots.json`、`locale/zh.json`、`locale/en.json`；
   混进 `src/`、`test/`、`*.bak` 也直接报错；
6. `npm publish --dry-run` 预演（不联网、不上传）。

## 回头要补的

- `repository` / `homepage` / `bugs` 三个字段等仓库地址定了再加（npm 页面会显示源码链接）。
- 首发之后：版本号只能往上走。同一个版本重复发布会 403，改 `package.json` 再打 tag。
- 撤销：发布 72 小时内可 `npm unpublish dsh-jianxian-widget@x.y.z`，超过就只能发新版本覆盖。

---

## 现在（2026-10-26）离"能发"还差什么

已经就绪的：

- [x] 包名 `dsh-jianxian-widget` —— npm 上没人占（2026-10-26 查过 404）
- [x] `private` 已去掉、`publishConfig.access = public`
- [x] `files` 白名单 10 个文件，`screenshot.png` / `screenshots.json` 已加
- [x] `npm pack` + `npm publish --dry-run` 都通过（`files=10`）
- [x] CI workflow `publish-to-npm.yml` 写好（OIDC、Node 24、发布前重建 + 跑守卫）
- [x] `scripts/release.py` 六道预检（版本一致、占位符、private、access、包内容、dry-run）

还缺的（都不需要我动手，需要你/仓库）：

- [ ] **GitHub 仓库地址** —— 有了它才能填 `repository` 字段、才能配 trusted publisher、才能打 tag
- [ ] npm 上的 **trusted publisher** 三字段：owner / repo / `publish-to-npm.yml`
- [ ] 首次发布会遇到 `403 OIDC permission denied`，因为新配置默认只允许 stage，
      要在 npm 的 trusted publisher 设置里把 **Allow publish** 打开

**将来的发布就是三步**（仓库就绪后）：

```bash
git push                                   # 代码在位
npm version patch --no-git-tag-version -w . # 或手动改两处 version
git tag v4.16.1 && git push origin v4.16.1 # CI 自动发
```
