# -*- coding: utf-8 -*-
"""命中区回归：点人物身上要冒泡，点旁边的空白不许冒泡（1.0 / 1.6 各验一次）。

    python -m http.server 8791 --bind 127.0.0.1
    python verify/hit_area.py

2026-10-26 的真实 bug：可点区域是整个 176×270 的 stage 盒子（还跟着缩放放大），
点在人物旁边的空白也会冒泡。现在用 src/hitboxes.json（逐张量 alpha 轮廓）当命中区。
"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"


def probe(scale, label):
    print("scale", scale, label)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page = ctx.new_page()
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1100)
        page.evaluate(
            """(s) => {
              const cfg = JSON.parse(localStorage.getItem('xjj.cfg.v1'));
              cfg.ui = Object.assign({}, cfg.ui, { scale: s });
              localStorage.setItem('xjj.cfg.v1', JSON.stringify(cfg));
            }""",
            scale,
        )
        page.reload(wait_until="load")
        page.wait_for_timeout(1300)
        g = page.eval_on_selector(
            """#xjj-web-root .xjj-hit""",
            "el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }",
        )
        pts = {
            "身上(中心)": (g["x"] + g["w"] / 2, g["y"] + g["h"] * 0.45),
            "左边 24px": (g["x"] - 24, g["y"] + g["h"] * 0.45),
            "头顶上方 40px": (g["x"] + g["w"] / 2, g["y"] - 40),
            "页面中间": (640, 400),
        }
        out = {}
        for name, (x, y) in pts.items():
            page.reload(wait_until="load")
            page.wait_for_timeout(1200)
            page.mouse.click(x, y)
            page.wait_for_timeout(700)
            n = page.eval_on_selector_all("#xjj-web-root .xjj-bubble", "els => els.length")
            out[name] = n
            print("   %-14s (%4d,%4d)  气泡=%d" % (name, x, y, n))
        b.close()
        return out


for s in (1.0, 1.6):
    probe(s, "")
