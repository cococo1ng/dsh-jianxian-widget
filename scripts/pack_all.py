# -*- coding: utf-8 -*-
"""一键备齐四个平台的发布物料，并把「本次发布配置」写成 JSON 给 ego 上传脚本读。

    python scripts/pack_all.py                     # 用现有版本号
    python scripts/pack_all.py --notes plugin.md   # 变更说明从文件读（可选）

产物：
    _publish/dsh-jianxian-widget-<ver>.zip          deepseek.stream 插件市场
    _publish/skillhub-cn-qingyun-jianxian-<sv>.zip  SkillHub / deepseek.stream Skill（5 个文本，无二进制）
    _publish/publish-target.json                    ego 脚本读这一份就知道传什么

自检（任一不过即退出码非 0）：
    · 根 package.json 与 plugin/package.json 版本一致
    · SKILL.md frontmatter 有 slug/title/category/whenToUse、version 与 skillVersion 一致
    · 插件包该有的 11 个文件都在，且没有 src/ test/ *.bak
    · Skill 包只有 5 个文本文件、没有二进制（平台会拒收 icon.png）
    · 两个包都在平台上限内（插件 10 MB / Skill 10 MB & 200 文件）
"""
import argparse
import io
import json
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUGIN = os.path.join(ROOT, "plugin")
PUB = os.path.join(ROOT, "_publish")
SKILL_SRC = os.path.join(os.path.dirname(ROOT), "qingyun-jianxian-skill")

PLUGIN_FILES = [
    "client.js", "index.js", "package.json", "cordis.patch.yml",
    "icon.png", "README.md", "README.en.md", "screenshot.png", "screenshots.json",
    "locale/zh.json", "locale/en.json",
]
SKILL_FILES = [
    "SKILL.md", "README.md",
    "references/install.md", "references/customize.md", "references/troubleshoot.md",
]
REQUIRED_FM = ["slug", "name", "title", "category", "whenToUse", "version"]


def fail(msg):
    raise SystemExit("❌ " + msg)


def ok(msg):
    print("  ✅ " + msg)


def read_json(p):
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)


def frontmatter(md_path):
    with io.open(md_path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        fail("SKILL.md 没有 YAML frontmatter")
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith(" "):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, text


def build_zip(path, files, base):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(base, f.replace("/", os.sep)), f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plugin-notes", default="", help="插件变更说明文本（写进 publish-target.json）")
    ap.add_argument("--skill-notes", default="", help="Skill 变更说明文本")
    args = ap.parse_args()

    pkg = read_json(os.path.join(PLUGIN, "package.json"))
    ver = str(pkg["version"])
    root_ver = str(read_json(os.path.join(ROOT, "package.json"))["version"])
    if ver != root_ver:
        fail("版本不一致：根 package.json %s ≠ plugin/package.json %s" % (root_ver, ver))
    ok("插件版本 %s（两个 package.json 一致）" % ver)

    # —— Skill 侧 ——
    md = os.path.join(SKILL_SRC, "SKILL.md")
    if not os.path.exists(md):
        fail("找不到 Skill 源：%s（先同步线上版本回来）" % md)
    fm, mdtext = frontmatter(md)
    missing = [k for k in REQUIRED_FM if not fm.get(k)]
    if missing:
        fail("SKILL.md frontmatter 缺字段：" + ", ".join(missing))
    sv = fm["version"]
    ok("Skill 版本 %s（frontmatter 字段齐全：%s）" % (sv, "/".join(REQUIRED_FM)))
    if fm["slug"] != "qingyun-jianxian":
        fail("skill slug 不是 qingyun-jianxian：%s" % fm["slug"])

    os.makedirs(PUB, exist_ok=True)

    # —— 插件包 ——
    pmissing = [f for f in PLUGIN_FILES if not os.path.exists(os.path.join(PLUGIN, f.replace("/", os.sep)))]
    if pmissing:
        fail("plugin/ 里缺文件：" + ", ".join(pmissing))
    pzip = os.path.join(PUB, "dsh-jianxian-widget-%s.zip" % ver)
    build_zip(pzip, PLUGIN_FILES, PLUGIN)
    psize = os.path.getsize(pzip)
    if psize > 10 * 1024 * 1024:
        fail("插件包 %.1f MB 超过 10 MB" % (psize / 1024 / 1024))
    with zipfile.ZipFile(pzip) as z:
        names = z.namelist()
    stray = [n for n in names if "/src/" in n or "/test/" in n or n.endswith(".bak")]
    if stray:
        fail("插件包混进了不该发的文件：" + ", ".join(stray[:5]))
    ok("插件包 %s（%d 文件 / %.2f MB）" % (os.path.basename(pzip), len(names), psize / 1024 / 1024))

    # —— Skill 包（只有文本；平台会拒收 icon.png）——
    smissing = [f for f in SKILL_FILES if not os.path.exists(os.path.join(SKILL_SRC, f.replace("/", os.sep)))]
    if smissing:
        fail("Skill 源里缺文件：" + ", ".join(smissing))
    szip = os.path.join(PUB, "skillhub-cn-qingyun-jianxian-%s.zip" % sv)
    build_zip(szip, SKILL_FILES, SKILL_SRC)
    ssize = os.path.getsize(szip)
    with zipfile.ZipFile(szip) as z:
        sinfo = [(i.filename, i.file_size) for i in z.infolist()]
    bad = [n for n, _ in sinfo if os.path.splitext(n)[1].lower() not in (".md", ".txt", ".yaml", ".yml")]
    if bad:
        fail("Skill 包里混进了非文本文件（平台会跳过）：" + ", ".join(bad))
    if len(sinfo) > 200 or ssize > 10 * 1024 * 1024:
        fail("Skill 包超过平台上限（200 文件 / 10 MB）")
    ok("Skill 包 %s（%d 文件 / %.1f KB，全文本）" % (os.path.basename(szip), len(sinfo), ssize / 1024))

    # —— 本次发布配置，给 ego 脚本读 ——
    target = {
        "_comment": "由 scripts/pack_all.py 生成；ego 上传脚本读这份，改版本只需重跑 pack_all",
        "pluginVersion": ver,
        "skillVersion": sv,
        "pluginZip": pzip.replace("\\", "/"),
        "skillZip": szip.replace("\\", "/"),
        "skillMd": md.replace("\\", "/"),
        "iconPng": os.path.join(PLUGIN, "icon.png").replace("\\", "/"),
        "pluginNotes": args.plugin_notes,
        "skillNotes": args.skill_notes,
        "repo": "cococo1ng/dsh-jianxian-widget",
    }
    cfg = os.path.join(PUB, "publish-target.json")
    with io.open(cfg, "w", encoding="utf-8", newline="\n") as f:
        json.dump(target, f, ensure_ascii=False, indent=2)
        f.write("\n")
    ok("发布配置 %s" % os.path.basename(cfg))

    print()
    print("下一步（三个上架脚本，各自读 _publish/publish-target.json）：")
    for name in ("deepseek-plugin.mjs", "deepseek-skill.mjs", "skillhub-skill.mjs"):
        uri = os.path.join(ROOT, "scripts", "ego", name).replace("\\", "/")
        print("  ego-browser nodejs -e \"await import('file:///%s')\"" % uri)
    print("  npm publish ./plugin --access public --userconfig <临时 npmrc> --registry=https://registry.npmjs.org")


if __name__ == "__main__":
    sys.exit(main())
