# 发布到 npm

> **当前状态（2026-11-14 01:30）**
>
> - **线上 latest**：`dsh-jianxian-widget@4.27.8`（4.27.6 之前的历史见下）
>   https://www.npmjs.com/package/dsh-jianxian-widget
> - **本次待发**：`4.28.0` —— 代码已 commit `5ba9199` + tag `v4.28.0` 推上 GitHub；
>   `python scripts/release.py` 全绿（tgz 5.20 MB / 11 个文件）；
>   **只剩 npm 发布这一步**（`publish to npm` workflow 仍卡 OIDC，必须按下面第 5–8 步用 granular token 手动发）
> - 仓库：https://github.com/cococo1ng/dsh-jianxian-widget （public，默认分支 main）
> - Repository / homepage / Bugs 三个字段已填
> - **4.27.6 / 4.27.8 都是本机用 granular token（Bypass 2FA）发的**，token 发完立刻吊销，`.npmrc` 已清干净
> - 同一个版本号还要同步到 **SkillHub skill `qingyun-jianxian`**（本次 1.2.0 → 1.3.0，文件在
>   `_publish/skillhub-publish/SKILL.md`，网页「开发者上架中心」上传）
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
