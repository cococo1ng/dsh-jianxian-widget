# -*- coding: utf-8 -*-
"""连点验收：连点 6 下，第 5 下起飞的那一圈不能被第 6 下打断；起飞 900ms 后再点才落地。"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page = ctx.new_page()
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1300)
        g = page.eval_on_selector("#xjj-web-root .xjj-hit", "el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height*0.45 } }")

        # 连点 6 下（每下 80ms）
        for _ in range(6):
            page.mouse.click(g["x"], g["y"])
            page.wait_for_timeout(80)
        page.wait_for_timeout(350)
        flying_now = page.evaluate("() => !!document.querySelector('#xjj-web-root .xjj-stage.is-flying')")
        page.wait_for_timeout(1200)
        flying_later = page.evaluate("() => !!document.querySelector('#xjj-web-root .xjj-stage.is-flying')")

        # 过 900ms 之后再点一下（点在人物当前位置 —— 飞行中他跑到别处了），应该落地
        page.wait_for_timeout(400)
        now_at = page.eval_on_selector("#xjj-web-root .xjj-stage", "el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height*0.45 } }")
        page.mouse.click(now_at["x"], now_at["y"])
        page.wait_for_timeout(300)
        flying_after_click = page.evaluate("() => !!document.querySelector('#xjj-web-root .xjj-stage.is-flying')")

        b.close()

    checks = [
        ("连点 6 下之后仍在飞", flying_now),
        ("1.2 秒后还在飞（没被第 6 下打断）", flying_later),
        ("起飞 1.5 秒后点一下能落地", not flying_after_click),
    ]
    print(json.dumps({"flying_now": flying_now, "flying_later": flying_later, "flying_after_click": flying_after_click}, ensure_ascii=False))
    bad = 0
    for name, ok in checks:
        print(("  ✅ " if ok else "  ❌ ") + name)
        if not ok:
            bad += 1
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
