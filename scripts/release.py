# -*- coding: utf-8 -*-
"""发版脚本：构建两个产物 → 校验版本 → 打插件包 → 出 SHA-256。

    python scripts/release.py
    python scripts/release.py --repo-url https://github.com/<you>/dsh-jianxian-widget

产物在 release/：
    dsh-jianxian-widget-<ver>.tgz   给 DSH 装（dsh plugin add ...）
    xjj.user.js                     网页版（同时留在 dist/）
    SHA256SUMS.txt                  校验和
    RELEASE-NOTES.md                取自 CHANGELOG 最新一节
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RELEASE = os.path.join(ROOT, "release")


def fail(msg):
    raise SystemExit("❌ " + msg)


def run(cmd, cwd=ROOT):
    # Windows 上 npm 是 npm.cmd，CreateProcess 不能直接拉起，要经 cmd /c
    if os.name == "nt" and cmd and cmd[0] in ("npm", "npx"):
        cmd = ["cmd", "/c"] + cmd
    print("$ " + " ".join(cmd))
    r = subprocess.run(cmd, cwd=cwd, shell=False, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(r.stdout)
        print(r.stderr)
        fail("命令失败：" + " ".join(cmd))
    return r.stdout.strip()


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def changelog_head():
    """取 CHANGELOG 最新一节（到下一个 ## 为止）。"""
    text = open(os.path.join(ROOT, "CHANGELOG.md"), encoding="utf-8").read()
    lines = text.splitlines()
    out = []
    started = False
    for line in lines:
        if line.startswith("## "):
            if started:
                break
            started = True
        if started:
            out.append(line)
    return "\n".join(out).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-url", default="", help="仓库地址，写进用户脚本的 updateURL/downloadURL")
    args = ap.parse_args()

    version = str(read_json(os.path.join(ROOT, "plugin", "package.json"))["version"])
    root_version = str(read_json(os.path.join(ROOT, "package.json"))["version"])
    if version != root_version:
        fail("版本不一致：根 package.json %s ≠ plugin/package.json %s" % (root_version, version))

    # 1. 构建
    cmd = [sys.executable, "build.py", "--target", "all"]
    if args.repo_url:
        cmd += ["--repo-url", args.repo_url]
    out = run(cmd)
    report = json.loads(out)
    if report.get("version") != version:
        fail("构建出来的版本 %s 与包版本 %s 不一致" % (report.get("version"), version))

    # 2. 产物自检：版本横幅、占位符残留
    web = os.path.join(ROOT, "dist", "xjj.user.js")
    head = open(web, encoding="utf-8").read(400)
    if ("@version      " + version) not in head:
        fail("用户脚本横幅里的版本号不是 " + version)
    for path in (web, os.path.join(ROOT, "plugin", "client.js")):
        body = open(path, encoding="utf-8").read()
        if "__XJJ_VERSION__" in body or re.search(r"__POSE_[A-Z0-9]+__", body):
            fail("产物里还有未替换的占位符：" + os.path.basename(path))

    # 3. 打包插件
    pkg = read_json(os.path.join(ROOT, "plugin", "package.json"))
    if pkg.get("private"):
        fail("plugin/package.json 里还有 private:true —— npm 会拒绝发布，先去掉")
    if not (pkg.get("publishConfig") or {}).get("access"):
        fail("plugin/package.json 缺 publishConfig.access（应设为 public）")

    if os.path.isdir(RELEASE):
        shutil.rmtree(RELEASE)
    os.makedirs(RELEASE, exist_ok=True)
    pack_out = run(["npm", "pack", "--json"], cwd=os.path.join(ROOT, "plugin"))
    info = json.loads(pack_out)[0]
    tgz_name = info["filename"]
    tgz = os.path.join(ROOT, "plugin", tgz_name)
    if not os.path.exists(tgz):
        fail("npm pack 没产出文件：" + tgz)
    target = os.path.join(RELEASE, "dsh-jianxian-widget-%s.tgz" % version)
    shutil.move(tgz, target)

    # 3b. 包内容自检：该有的都在，不该带的别带
    import tarfile
    required = {
        "package/index.js", "package/client.js", "package/package.json", "package/cordis.patch.yml",
        "package/icon.png", "package/README.md", "package/screenshot.png", "package/screenshots.json",
        "package/locale/zh.json", "package/locale/en.json",
    }
    with tarfile.open(target, "r:gz") as tar:
        names = set(tar.getnames())
    missing = sorted(required - names)
    if missing:
        fail("插件包里缺文件：" + ", ".join(missing))
    stray = [n for n in names if n.startswith("package/") and ("/src/" in n or "/test/" in n or n.endswith(".bak"))]
    if stray:
        fail("插件包里混进了不该发布的文件：" + ", ".join(sorted(stray)[:5]))

    # 3c. npm 侧最后一道：dry-run（不联网、不上传，只做名字/版本/内容校验）
    dry = run(["npm", "publish", "--dry-run", "--json"], cwd=os.path.join(ROOT, "plugin"))
    try:
        dry_info = json.loads(dry)
        print("  npm dry-run ok:", dry_info.get("name"), dry_info.get("version"),
              "files=" + str(dry_info.get("files", [{}]).__len__()))
    except Exception:
        print("  npm dry-run 输出不是 JSON（不影响，已通过 pack 自检）")

    # 4. 网页版也放一份进 release（中英同一份产物，跟随语言自动切换）
    shutil.copy2(web, os.path.join(RELEASE, "xjj.user.js"))

    # 5. 校验和
    sums = []
    for name in sorted(os.listdir(RELEASE)):
        p = os.path.join(RELEASE, name)
        if os.path.isfile(p) and not name.endswith(".md") and name != "SHA256SUMS.txt":
            sums.append("%s  %s" % (sha256(p), name))
    with open(os.path.join(RELEASE, "SHA256SUMS.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(sums) + "\n")

    # 6. 发版说明
    notes = "# 青云剑仙 v%s\n\n%s\n\n## 文件\n\n" % (version, changelog_head())
    notes += "- `dsh-jianxian-widget-%s.tgz` — DSH 插件包（`dsh plugin --profile desktop add <路径>`）\n" % version
    notes += "- `xjj.user.js` — 网页版用户脚本（Tampermonkey 新建脚本后粘贴，或从 raw 地址安装）\n"
    notes += "- `SHA256SUMS.txt` — 校验和\n"
    with open(os.path.join(RELEASE, "RELEASE-NOTES.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write(notes)

    print(json.dumps({
        "version": version,
        "files": sorted(os.listdir(RELEASE)),
        "tgzBytes": os.path.getsize(target),
        "webBytes": os.path.getsize(web),
        "repo": args.repo_url or None,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
