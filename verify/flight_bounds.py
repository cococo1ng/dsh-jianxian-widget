# -*- coding: utf-8 -*-
"""御剑飞行不许飞出屏幕：0.7 / 1.0 / 1.6 三种大小各飞一圈，全程采样立绘矩形。

    python -m http.server 8791 --bind 127.0.0.1
    python verify/flight_bounds.py
"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"


def run(scale):
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
        # 从「更多」页触发，避免连点带来的时序噪音
        page.click("#xjj-web-root .xjj-gear", force=True)
        page.wait_for_timeout(400)
        page.get_by_text("更多", exact=True).click()
        page.wait_for_timeout(300)
        page.get_by_text("御剑飞行一圈（约 6 秒）", exact=True).click()
        page.wait_for_timeout(250)

        worst = {"left": 1e9, "top": 1e9, "right": -1e9, "bottom": -1e9}
        for _ in range(60):   # 60 × 120ms ≈ 7.2s
            r = page.evaluate(
                """() => {
                  const el = document.querySelector('#xjj-web-root .xjj-sprite.is-on');
                  if (!el) return null;
                  const b = el.getBoundingClientRect();
                  return [b.left, b.top, b.right, b.bottom];
                }"""
            )
            if r:
                worst["left"] = min(worst["left"], r[0])
                worst["top"] = min(worst["top"], r[1])
                worst["right"] = max(worst["right"], r[2])
                worst["bottom"] = max(worst["bottom"], r[3])
            page.wait_for_timeout(120)
        vp = page.evaluate("() => [window.innerWidth, window.innerHeight]")
        b.close()

    outside = []
    if worst["left"] < -1:
        outside.append("左越界 %.0f" % worst["left"])
    if worst["top"] < -1:
        outside.append("上越界 %.0f" % worst["top"])
    if worst["right"] > vp[0] + 1:
        outside.append("右越界 %.0f" % (worst["right"] - vp[0]))
    # 脚本来就踩在屏幕底边（1.6× 时最多压出 3px 影区），给 6px 容差
    if worst["bottom"] > vp[1] + 6:
        outside.append("下越界 %.0f" % (worst["bottom"] - vp[1]))
    print("scale %.1f  viewport %s  极值 %s" % (scale, vp, json.dumps({k: round(v) for k, v in worst.items()})))
    if outside:
        print("   ❌ " + "，".join(outside))
        return 1
    print("   ✅ 全程在屏幕内")
    return 0


bad = 0
for s in (0.7, 1.0, 1.6):
    bad += run(s)
raise SystemExit(1 if bad else 0)
