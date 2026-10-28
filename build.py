# -*- coding: utf-8 -*-
"""青云剑仙构建：一套前端，两个壳。

  python build.py                 → 只出 DSH 版（plugin/client.js，默认，与旧版行为一致）
  python build.py --target web    → 只出网页版（dist/xjj.user.js，Tampermonkey 等）
  python build.py --target all    → 两个都出

两个产物共用 src/client.template.js（2522 行里只有末尾 30 行是 DSH 接入），
网页版做的事：① 换掉那 30 行的外壳；② 把 fetch 接到 src/host.web.js 的垫片上。
核心逻辑一行不改 —— 所以以后改人物、改气泡，两边同时生效。
"""
import base64
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(ROOT, "assets")
SRC = os.path.join(ROOT, "src", "client.template.js")
HOST_WEB = os.path.join(ROOT, "src", "host.web.js")
I18N_DIR = os.path.join(ROOT, "src", "i18n")
PKG = os.path.join(ROOT, "plugin", "package.json")
OUT_DSH = os.path.join(ROOT, "plugin", "client.js")
OUT_WEB = os.path.join(ROOT, "dist", "xjj.user.js")

CJK = re.compile(r"[\u4e00-\u9fff]")
# 只匹配不含换行的字符串字面量：单引号 / 双引号 / 反引号
LITERAL = re.compile(r"'[^'\n]*'|\"[^\"\n]*\"|`[^`]*`")

TOKENS = {
    # 站姿族（新剑设定：剑佩左腰；v6 = 1296×1728 原图重切，统一缩放、脚底对齐）
    "__DONATE_QR__": ("about/donate-qr.webp", "image/webp"),
    "__POSE_DANCE16_01__": ("v10/dance01.webp", "image/webp"),
    "__POSE_DANCE16_02__": ("v10/dance02.webp", "image/webp"),
    "__POSE_DANCE16_03__": ("v10/dance03.webp", "image/webp"),
    "__POSE_DANCE16_04__": ("v10/dance04.webp", "image/webp"),
    "__POSE_DANCE16_05__": ("v10/dance05.webp", "image/webp"),
    "__POSE_DANCE16_06__": ("v10/dance06.webp", "image/webp"),
    "__POSE_DANCE16_07__": ("v10/dance07.webp", "image/webp"),
    "__POSE_DANCE16_08__": ("v10/dance08.webp", "image/webp"),
    "__POSE_DANCE16_09__": ("v10/dance09.webp", "image/webp"),
    "__POSE_DANCE16_10__": ("v10/dance10.webp", "image/webp"),
    "__POSE_DANCE16_11__": ("v10/dance11.webp", "image/webp"),
    "__POSE_DANCE16_12__": ("v10/dance12.webp", "image/webp"),
    "__POSE_DANCE16_13__": ("v10/dance13.webp", "image/webp"),
    "__POSE_DANCE16_14__": ("v10/dance14.webp", "image/webp"),
    "__POSE_DANCE16_15__": ("v10/dance15.webp", "image/webp"),
    "__POSE_DANCE16_16__": ("v10/dance16.webp", "image/webp"),
    "__POSE_DANCE16_17__": ("v10/dance17.webp", "image/webp"),
    "__POSE_DANCE16_18__": ("v10/dance18.webp", "image/webp"),
    "__POSE_DANCE16_19__": ("v10/dance19.webp", "image/webp"),
    "__POSE_DANCE16_20__": ("v10/dance20.webp", "image/webp"),
    "__POSE_DANCE16_21__": ("v10/dance21.webp", "image/webp"),
    "__POSE_DANCE16_22__": ("v10/dance22.webp", "image/webp"),
    "__POSE_DANCE16_23__": ("v10/dance23.webp", "image/webp"),
    "__POSE_DANCE16_24__": ("v10/dance24.webp", "image/webp"),
    "__POSE_V4_IDLE__": ("v7/idle.webp", "image/webp"),
    "__POSE_V4_SWORD__": ("v7/sword.webp", "image/webp"),
    "__POSE_V4_FLY__": ("v7/fly.webp", "image/webp"),
    "__POSE_V5_GREET__": ("v12/greet.webp", "image/webp"),
    "__POSE_V5_REFUSE__": ("v6/refuse2.webp", "image/webp"),
    "__POSE_V5_SHRUG__": ("v7/shrug.webp", "image/webp"),
    "__POSE_V5_LEDGER__": ("v7/ledger.webp", "image/webp"),
    "__POSE_V5_SHEATH__": ("v7/sheath.webp", "image/webp"),
    "__POSE_V5_MEDITATE__": ("v8/meditate.webp", "image/webp"),
    "__POSE_V6_BACK__": ("v7/back.webp", "image/webp"),
    "__POSE_V6_SKY__": ("v6/sky.webp", "image/webp"),
    "__POSE_V6_WALK__": ("v6/walk.webp", "image/webp"),
    # v11：半身近景四式（2×2 一张生成后切）
    "__POSE_V11_SIP__": ("v11/sip.webp", "image/webp"),
    "__POSE_V11_WIPE__": ("v11/wipe.webp", "image/webp"),
    "__POSE_V11_CHIN__": ("v11/chin.webp", "image/webp"),
    # 生活/情绪族
    "__POSE_V4B_WIN__": ("v8/win.webp", "image/webp"),
    "__POSE_V4B_ANGRY__": ("v8/angry.webp", "image/webp"),
    "__POSE_V4B_POOR__": ("v8/poor.webp", "image/webp"),
    "__POSE_V4B_COINS__": ("v8/coins.webp", "image/webp"),
    "__POSE_V4B_FORGE__": ("v4b/forge.webp", "image/webp"),
    "__POSE_V4B_DOZE__": ("v4b/doze.webp", "image/webp"),
    "__POSE_V4B_YAWN__": ("v12/yawn.webp", "image/webp"),
    "__POSE_V4B_TEA__": ("v7/tea.webp", "image/webp"),
    "__POSE_WHITE_IDLE__": ("white/idle.webp", "image/webp"),
    "__POSE_WHITE_GREET__": ("white/greet.webp", "image/webp"),
    "__POSE_WHITE_SWORD__": ("white/sword.webp", "image/webp"),
    "__POSE_WHITE_FLY__": ("white/fly.webp", "image/webp"),
    "__POSE_WHITE_LEDGER__": ("white/ledger.webp", "image/webp"),
    "__POSE_WHITE_SHRUG__": ("white/shrug.webp", "image/webp"),
    "__POSE_WHITE_REFUSE__": ("white/refuse.webp", "image/webp"),
    "__POSE_WHITE_BYE__": ("white/bye.webp", "image/webp"),
    "__POSE_WHITE_WIN__": ("white/win.webp", "image/webp"),
    "__POSE_WHITE_ANGRY__": ("white/angry.webp", "image/webp"),
    "__POSE_WHITE_POOR__": ("white/poor.webp", "image/webp"),
    "__POSE_WHITE_COINS__": ("white/coins.webp", "image/webp"),
    "__POSE_WHITE_FORGE__": ("white/forge.webp", "image/webp"),
    "__POSE_WHITE_DOZE__": ("white/doze.webp", "image/webp"),
    "__POSE_WHITE_YAWN__": ("white/yawn.webp", "image/webp"),
    "__POSE_WHITE_TEA__": ("white/tea.webp", "image/webp"),
    "__POSE_WHITE_MEDITATE__": ("white/meditate.webp", "image/webp"),
    "__POSE_WHITE_BACK__": ("white/back.webp", "image/webp"),
    "__POSE_WHITE_SKY__": ("white/sky.webp", "image/webp"),
    "__POSE_WHITE_WALK__": ("white/walk.webp", "image/webp"),
    "__POSE_WHITE_SIP__": ("white/sip.webp", "image/webp"),
    "__POSE_WHITE_WIPE__": ("white/wipe.webp", "image/webp"),
    "__POSE_WHITE_CHIN__": ("white/chin.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_01__": ("white/dance01.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_02__": ("white/dance02.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_03__": ("white/dance03.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_04__": ("white/dance04.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_05__": ("white/dance05.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_06__": ("white/dance06.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_07__": ("white/dance07.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_08__": ("white/dance08.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_09__": ("white/dance09.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_10__": ("white/dance10.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_11__": ("white/dance11.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_12__": ("white/dance12.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_13__": ("white/dance13.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_14__": ("white/dance14.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_15__": ("white/dance15.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_16__": ("white/dance16.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_17__": ("white/dance17.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_18__": ("white/dance18.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_19__": ("white/dance19.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_20__": ("white/dance20.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_21__": ("white/dance21.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_22__": ("white/dance22.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_23__": ("white/dance23.webp", "image/webp"),
    "__POSE_WHITE_DANCE16_24__": ("white/dance24.webp", "image/webp"),
    # 法宝图标（菜单按钮可选皮肤）— 2026-10-25 全部重做，14 件
    "__TALISMAN_SEAL__": ("talisman9/seal.webp", "image/webp"),
    "__TALISMAN_MIRROR__": ("talisman9/mirror.webp", "image/webp"),
    "__TALISMAN_BELL__": ("talisman9/bell.webp", "image/webp"),
    "__TALISMAN_GOURD__": ("talisman9/gourd.webp", "image/webp"),
    "__TALISMAN_RUYI__": ("talisman9/ruyi.webp", "image/webp"),
    "__TALISMAN_POUCH__": ("talisman9/pouch.webp", "image/webp"),
    "__TALISMAN_VASE__": ("talisman9/vase.webp", "image/webp"),
    "__TALISMAN_COMPASS__": ("talisman9/compass.webp", "image/webp"),
    "__TALISMAN_FLUTE__": ("talisman9/flute.webp", "image/webp"),
    "__TALISMAN_BANNER__": ("talisman9/banner.webp", "image/webp"),
    "__TALISMAN_FUCHEN__": ("talisman9/fuchen.webp", "image/webp"),
    "__TALISMAN_FAN__": ("talisman9/fan.webp", "image/webp"),
    "__TALISMAN_TALLY__": ("talisman9/tally.webp", "image/webp"),
    "__TALISMAN_LAMP__": ("talisman9/lamp.webp", "image/webp"),
    "__SFX_BUBBLE__": ("bubble.wav", "audio/wav"),
    "__SFX_PANEL__": ("panel.wav", "audio/wav"),
    "__SFX_PICK__": ("pick.wav", "audio/wav"),
    "__SFX_ALERT__": ("alert.wav", "audio/wav"),
    "__SFX_CLOTH__": ("cloth.wav", "audio/wav"),
    "__SFX_WIND__": ("wind.wav", "audio/wav"),
    "__SFX_BELL__": ("bell.wav", "audio/wav"),
    # 音效
    "__SFX_PRESS__": ("press.wav", "audio/wav"),
    "__SFX_RELEASE__": ("release.wav", "audio/wav"),
    "__SFX_TURN__": ("turn.wav", "audio/wav"),
}

# —— 外壳切换的锚点：模板里必须各出现一次，否则直接报错（不做"尽力而为"的模糊替换）——
HEAD_OLD = (
    "window.__ModuleLoader__.load({\n"
    "  id: 'dsh-jianxian-widget',\n"
    "  factory(require) {\n"
    "    const React = require('react');\n"
)
HEAD_NEW = (
    "(function () {\n"
    "  'use strict';\n"
    "  var __host = window.__XJJ_HOST__;\n"
    "  var __def = (function (require) {\n"
    "    const React = require('react');\n"
    "    const fetch = __host.fetch;   // 网页版：/xjj/*.json 由垫片应答\n"
)
TAIL_OLD = "    };\n  },\n});\n"
TAIL_NEW = "    };\n  });\n  __host.boot(__def);\n})();\n"


def fail(msg):
    raise SystemExit("❌ " + msg)


def read_version():
    try:
        pkg = json.load(open(PKG, encoding="utf-8"))
    except Exception as err:  # noqa: BLE001
        fail("读不到 plugin/package.json：" + str(err))
    version = str(pkg.get("version") or "").strip()
    if not re.match(r"^\d+\.\d+\.\d+$", version):
        fail("package.json 的 version 不是 x.y.z：" + version)
    return version


def load_template():
    template = open(SRC, encoding="utf-8").read()
    # 姿态清单要在素材内联之前抽：内联后 'idle': '__POSE_…__' 已经变成 data URI
    poses = re.findall(r"^\s*(\w+):\s*'__POSE_[A-Z0-9_]+__'", template, re.M)
    sizes = {}
    for token, (name, mime) in TOKENS.items():
        path = os.path.join(ASSETS, name)
        if not os.path.exists(path):
            fail("缺素材文件：" + name)
        raw = open(path, "rb").read()
        if not raw:
            fail("素材是空文件：" + name)
        uri = "data:" + mime + ";base64," + base64.b64encode(raw).decode("ascii")
        if token not in template:
            fail("模板里找不到占位符 " + token)
        template = template.replace(token, uri)
        sizes[name] = len(raw)

    left = re.findall(r"__(?:POSE|SFX)_[A-Z0-9]+__", template)
    if left:
        fail("还有没替换的占位符: " + ", ".join(left))

    template = inject_hitboxes(template, poses)
    template = inject_layout(template, poses)
    return template, sizes


def inject_hitboxes(template, poses):
    """把 src/hitboxes.json 注入模板（每个姿态的可点击轮廓）。缺一个姿态就报错，别让点击区静默变回整块。"""
    path = os.path.join(ROOT, "src", "hitboxes.json")
    if not os.path.exists(path):
        fail("缺 src/hitboxes.json —— 先跑 python tools/make_hitboxes.py")
    with open(path, encoding="utf-8") as f:
        boxes = json.load(f)
    missing = [p for p in poses if p not in boxes]
    if missing:
        fail("这些姿态没有点击轮廓（重跑 tools/make_hitboxes.py）：" + ", ".join(missing))
    if "__HIT_BOXES__" not in template:
        fail("模板里找不到 __HIT_BOXES__ 占位符")
    return template.replace("__HIT_BOXES__", json.dumps(boxes, ensure_ascii=False))


def inject_layout(template, poses):
    """把 src/layout.json 注入模板（立绘几何常量）。

    为什么单独抽一份 JSON：--yo / 法宝底边 / 缩放原点这些数散在 CSS、JS、verify 脚本里，
    改一处漏一处就是 bug（2026-10-26 的「打坐法宝离头顶远」就是这么来的）。
    现在渲染层与几何守卫读同一份常量，守卫量的是 DOM，不是复述公式。
    """
    path = os.path.join(ROOT, "src", "layout.json")
    if not os.path.exists(path):
        fail("缺 src/layout.json —— 几何常量的唯一真源没了")
    with open(path, encoding="utf-8") as f:
        layout = json.load(f)
    for key in ("rootW", "rootH", "originY", "headGap", "gearBase", "gearMargin", "poseFit"):
        if key not in layout:
            fail("src/layout.json 缺字段：" + key)
    # 下划线开头的是给人看的注释：注入前剔掉，否则会被 i18n 插桩当成待翻译字面量
    layout = {k: v for k, v in layout.items() if not str(k).startswith("_")}
    unknown = [p for p in (layout.get("poseFit") or {}) if p not in poses]
    if unknown:
        fail("src/layout.json 的 poseFit 里有不存在的姿态：" + ", ".join(unknown))
    for name, fit in (layout.get("poseFit") or {}).items():
        if not isinstance(fit, (int, float)) or not (0 < float(fit) <= 1):
            fail("src/layout.json 的 poseFit.%s 必须是 0~1 之间的系数（现在 %r）" % (name, fit))
    if "__LAYOUT__" not in template:
        fail("模板里找不到 __LAYOUT__ 占位符")
    return template.replace("__LAYOUT__", json.dumps(layout, ensure_ascii=False))


def stamp_version(text, version):
    if "__XJJ_VERSION__" not in text:
        fail("模板里没有 __XJJ_VERSION__（版本号必须从 package.json 来，别硬编码）")
    out = text.replace("__XJJ_VERSION__", version)
    if "__XJJ_VERSION__" in out:
        fail("版本号替换没做完")
    return out


def load_lang(lang):
    path = os.path.join(I18N_DIR, lang + ".json")
    if not os.path.exists(path):
        fail("没有这份语言包：" + path)
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    if not isinstance(raw, dict) or not raw:
        fail("语言包不是 {中文: English} 的对象：" + path)
    # 键一律去首尾空格：字面量那一侧的空白由 localize 还原，表里不用管对齐
    table = {}
    for k, v in raw.items():
        key = k.strip()
        if key in table and table[key] != v:
            fail("语言包里「%s」有两条不一样的译文：%r / %r" % (key, table[key], v))
        table[key] = v
    return table


def instrument(text, table):
    """把带中文的字符串字面量包成 __xjjT('…')。

    只在构建产物里包，源码一行不动；运行时 __xjjT 按当前语言查表（zh 原样返回）。
    长的字面量（>300 字符）是 CSS 大块，里面只有字体名，跳过。
    返回 (新文本, 缺译的原文列表)。"""
    missing = []

    def sub(m):
        raw = m.group(0)
        body = raw[1:-1]
        if len(body) > 300:
            return raw
        if not CJK.search(body):
            return raw
        key = body.strip()
        if key not in table:
            missing.append(body)
            return raw
        return "__xjjT(" + raw + ")"

    return LITERAL.sub(sub, text), missing


def i18n_prelude(table):
    body = json.dumps(table, ensure_ascii=False)
    return (
        ";/* i18n：中文原文当 key；__xjjT 按当前语言查表，zh 直接原样返回 */\n"
        "(function () {\n"
        "  var DICT = " + body + ";\n"
        "  var state = { lang: 'zh' };\n"
        "  // 查表按去掉首尾空格匹配，命中后把空白还原（' 轮' → ' turns'），和译文表的写法对齐\n"
        "  function t(s) {\n"
        "    if (state.lang !== 'en') return s;\n"
        "    var str = String(s);\n"
        "    var v = DICT[str.trim()];\n"
        "    if (v === undefined) return s;\n"
        "    var lead = str.slice(0, str.length - str.replace(/^\\s+/, '').length);\n"
        "    var trail = str.slice(str.replace(/\\s+$/, '').length);\n"
        "    return lead + v + trail;\n"
        "  }\n"
        "  window.__XJJ_I18N = {\n"
        "    state: state,\n"
        "    t: t,\n"
        "    dict: DICT,\n"
        "    setLang: function (l) { state.lang = String(l || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh'; },\n"
        "  };\n"
        "  window.__xjjT = t;\n"
        "})();\n"
    )


def build_dsh(template, version, table=None):
    if table is None:
        table = load_lang("en")
    text, missing = instrument(stamp_version(template, version), table)
    if missing:
        fail("有 %d 条中文没有译文（补 src/i18n/en.json）：\n  - %s" % (len(missing), "\n  - ".join(missing[:25])))
    # 预置脚本必须放在 ModuleLoader 之前：它定义 window.__xjjT
    out = i18n_prelude(table) + text
    open(OUT_DSH, "w", encoding="utf-8", newline="\n").write(out)
    return {"out": OUT_DSH, "bytes": os.path.getsize(OUT_DSH)}


def build_web(template, version, repo_url="", table=None):
    if template.count(HEAD_OLD) != 1:
        fail("网页版锚点 HEAD 在模板里出现 %d 次（应为 1）——模板结构变了，先改 build.py 的锚点" % template.count(HEAD_OLD))
    text = template.replace(HEAD_OLD, HEAD_NEW)
    try:
        cut = text.rindex(TAIL_OLD)
    except ValueError:
        fail("网页版锚点 TAIL 在模板里找不到——模板结构变了，先改 build.py 的锚点")
    if text[cut + len(TAIL_OLD):].strip():
        fail("网页版锚点 TAIL 之后还有代码（模板结尾结构变了），不敢截断")
    text = text[:cut] + TAIL_NEW
    # 网页版没有"每轮消耗 / 提问挂起"的数据源，这两处 3 秒轮询改成 60 秒：
    # 在 DSH 里是本地接口无所谓，放到每个网页上就没必要一直问
    if text.count("setInterval(load, 3000);") != 2:
        fail("网页版轮询降频锚点数量不对（期望 2 处 setInterval(load, 3000)）——模板改过了，先核 build.py")
    text = text.replace("setInterval(load, 3000);", "setInterval(load, 60000);")
    text = stamp_version(text, version)

    host = open(HOST_WEB, encoding="utf-8").read()
    host = stamp_version(host, version)

    if table is None:
        table = load_lang("en")
    text, miss1 = instrument(text, table)
    host, miss2 = instrument(host, table)
    missing = sorted(set(miss1) | set(miss2))
    if missing:
        fail("有 %d 条中文没有译文（补 src/i18n/en.json）：\n  - %s" % (len(missing), "\n  - ".join(missing[:25])))

    banner = USCRIPT_BANNER.replace("__XJJ_VERSION__", version)
    repo_lines = ""
    out_path = OUT_WEB
    if repo_url:
        base = repo_url.rstrip("/")
        raw = base.replace("github.com", "raw.githubusercontent.com") + "/main/dist/xjj.user.js"
        repo_lines = (
            "// @homepageURL  " + base + "\n"
            "// @supportURL   " + base + "/issues\n"
            "// @updateURL    " + raw + "\n"
            "// @downloadURL  " + raw + "\n"
        )
    banner = banner.replace("__XJJ_REPO_LINES__", repo_lines)
    # 段与段之间必须留分号：host 结尾是 })()、模板开头是 (function(){…，
    # 少了分号会被解析成 "调用返回值"，报 "… is not a function"（踩过）
    out = banner + i18n_prelude(table) + host + "\n;\n" + text
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8", newline="\n").write(out)
    return {"out": out_path, "bytes": os.path.getsize(out_path)}


USCRIPT_BANNER = """// ==UserScript==
// @name         青云剑仙 · Azure Cloud Sword Immortal
// @namespace    xjj-widget
// @version      __XJJ_VERSION__
// @description  网页右下角的青云剑仙：白发墨金的大师兄，23 姿态 + 24 帧剑舞 + 14 件法宝 + 10 路音效，会催你喝水、劝你早睡、闲了剑舞御剑。全部素材内联，不联网、不上报、不占 token。
// @author       Azure Cloud Sword Immortal
// @match        *://*/*
// @run-at       document-idle
// @noframes
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js
// @require      https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js
// @license      MIT
__XJJ_REPO_LINES__// ==/UserScript==
"""

def main(argv):
    target = "dsh"
    repo_url = ""
    if "--target" in argv:
        i = argv.index("--target")
        if i + 1 >= len(argv):
            fail("--target 后面要跟 dsh / web / all")
        target = argv[i + 1]
    if "--repo-url" in argv:
        i = argv.index("--repo-url")
        if i + 1 >= len(argv):
            fail("--repo-url 后面要跟仓库地址，例如 https://github.com/you/dsh-jianxian-widget")
        repo_url = argv[i + 1]
    if target not in ("dsh", "web", "all"):
        fail("不认识的 target：" + target)

    version = read_version()
    table = load_lang("en")
    template, sizes = load_template()
    report = {"version": version, "count": len(sizes), "target": target, "dict": len(table)}
    if target in ("dsh", "all"):
        report.update(build_dsh(template, version, table))
    if target in ("web", "all"):
        web = build_web(template, version, repo_url, table)
        report["web"] = web
        if repo_url:
            report["repo"] = repo_url
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1:])
