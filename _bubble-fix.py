# -*- coding: utf-8 -*-
"""4.19.5：修法宝小字/版本行白字 + 气泡明暗两套"""
import re
from pathlib import Path

P = Path(r"C:\Users\Administrator\Documents\deepseek-harness\default-workspace\_tools\jianxian-widget\src\client.template.js")
s = P.read_text(encoding="utf-8")
n = 0

# 1) 法宝名字：纯白 → 主题色（浅色下原本完全看不见）
old = ".xjj-tals-name{font-size:11px;color:#FFFFFF;opacity:.92;"
new = ".xjj-tals-name{font-size:11px;color:var(--xjj-text-2);opacity:1;"
if old in s:
    s = s.replace(old, new); n += 1

# 2) 「更多」页版本行的纯白
old = "style: { color: '#FFFFFF' } }, 'v__XJJ_VERSION__'"
new = "style: { color: 'var(--xjj-text-strong)' } }, 'v__XJJ_VERSION__'"
if old in s:
    s = s.replace(old, new); n += 1

# 3) 气泡本体：去掉深色渐变 + 纸纹，改成主题变量
m = re.search(r"'\.xjj-bubble\{[^\n]*\}',", s)
if m:
    s = s[:m.start()] + (
        "'.xjj-bubble{position:absolute;right:100%;margin-right:12px;bottom:calc(56% + var(--yo, 0px));"
        "width:max-content;min-width:132px;padding:9px 12px;border-radius:13px;padding-top:12px;"
        "box-shadow:var(--xjj-bub-shadow);background:var(--xjj-bub-bg);border:1px solid var(--xjj-bub-border);"
        "font-family:\"KaiTi\",\"STKaiti\",\"楷体\",\"Microsoft YaHei\",serif;letter-spacing:.4px;"
        "animation:xjj-bubble-in .18s ease-out both;pointer-events:auto;cursor:pointer;box-sizing:border-box;line-height:1.5}',"
    ) + s[m.end():]
    n += 1

# 4) 气泡内联色 → 变量（只动 color:'#xxx' / color: '#xxx'）
COLOR_MAP = {
    "#F3E6C8": "var(--xjj-bub-text)",
    "#F6E3C0": "var(--xjj-bub-text)",
    "#FFFCF4": "var(--xjj-bub-text)",
    "#F5C24B": "var(--xjj-bub-gold)",
    "#E8B84B": "var(--xjj-bub-gold)",
    "#FFC247": "var(--xjj-bub-gold)",
    "#FFE9B8": "var(--xjj-bub-gold)",
    "#9FE7F5": "var(--xjj-bub-cyan)",
    "#7BEAFF": "var(--xjj-bub-cyan)",
    "#BFE6F5": "var(--xjj-bub-cyan)",
    "#C9D3E0": "var(--xjj-bub-dim)",
    "#A9B6BE": "var(--xjj-bub-dim)",
    "#C9B98F": "var(--xjj-bub-dim)",
    "#93A3AB": "var(--xjj-bub-dim)",
    "#F8CDBE": "var(--xjj-bub-dim)",
    "#E7A98C": "var(--xjj-bub-warn)",
    "#FFB3A7": "var(--xjj-bub-warn)",
    "#FF9E7A": "var(--xjj-bub-warn)",
}
for hexv, var in COLOR_MAP.items():
    for pat in (f"color:'{hexv}'", f'color:"{hexv}"', f"color: '{hexv}'", f'color: "{hexv}"'):
        if pat in s:
            n += s.count(pat)
            s = s.replace(pat, pat.split(":")[0] + ": " + var if " " in pat else pat.split(":")[0] + ":" + var)

# 5) 两套气泡变量
NIGHT = "'.xjj-root{--xjj-panel-a"
ADD = (
    "'.xjj-root{--xjj-bub-bg:#0d1218;--xjj-bub-border:rgba(217,164,65,.55);"
    "--xjj-bub-text:#F3E6C8;--xjj-bub-gold:#F5C24B;--xjj-bub-cyan:#9FE7F5;"
    "--xjj-bub-dim:#A9B6BE;--xjj-bub-warn:#FFB3A7;"
    "--xjj-bub-shadow:0 12px 30px rgba(4,9,14,.55),0 0 16px rgba(79,179,200,.12)}',\n      "
    "'.xjj-root.is-light{--xjj-bub-bg:#FFFDF7;--xjj-bub-border:#D9C48E;"
    "--xjj-bub-text:#2A2418;--xjj-bub-gold:#8A5F16;--xjj-bub-cyan:#1F6B7A;"
    "--xjj-bub-dim:#5A4E38;--xjj-bub-warn:#A8402E;"
    "--xjj-bub-shadow:0 10px 24px rgba(90,70,30,.16)}',\n      "
)
s = s.replace(NIGHT, ADD + NIGHT, 1)
n += 1

P.write_text(s, encoding="utf-8")
print("改动", n, "处")
