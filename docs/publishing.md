# 发布到 npm

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
