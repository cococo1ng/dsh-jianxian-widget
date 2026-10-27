# -*- coding: utf-8 -*-
"""DSH 产物回归：改了模板 / 版本号注入以后，plugin/client.js 必须照样挂得上。

    cd _tools/jianxian-widget
    python -m http.server 8791 --bind 127.0.0.1
    python verify/dsh_smoke.py
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/dsh.html"
SHOT = Path(__file__).with_name("dsh-shot.png")
LANG = "en" if "--lang=en" in sys.argv else "zh"
EXPECT = "Balance" if LANG == "en" else "余额"
PATH_Q = "" if LANG == "zh" else "?lang=en"


def main() -> int:
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 820})
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        page.goto(URL + PATH_Q, wait_until="load")
        page.wait_for_timeout(1500)

        sprites = page.eval_on_selector_all("#xjj-dsh-root .xjj-sprite", "els => els.length")
        stage = page.eval_on_selector("#xjj-dsh-root .xjj-stage", "el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }")
        page.mouse.click(stage["x"], stage["y"])
        page.wait_for_timeout(800)
        # 开面板 → 数据页应显示真实余额（假宿主给了 12.34）
        page.click("#xjj-dsh-root .xjj-gear", force=True)
        page.wait_for_timeout(900)
        text = page.inner_text("#xjj-dsh-root .xjj-panel")
        # --live：不刷新页面，直接切宿主语言，看界面是否立刻跟着变
        live_ok = True
        if "--live" in sys.argv:
            page.evaluate("() => window.__setLang('en')")
            page.wait_for_timeout(600)
            live_text = page.inner_text("#xjj-dsh-root .xjj-panel")
            live_ok = ("Balance" in live_text) and ("余额" not in live_text)
            page.screenshot(path=str(SHOT))
            if not live_ok:
                print("live 切换后仍是：" + live_text[:120])
        page.screenshot(path=str(SHOT))
        browser.close()

    checks = [
        ("39 张 sprite 齐全", sprites == 39),
        ("数据页拿到余额 ¥12.34", "12.34" in text),
        ("今日已用 ¥5.67", "5.67" in text),
        ("面板语言是「" + EXPECT + "」", EXPECT in text),
        ("控制台没有报错", len(errors) == 0),
    ]
    if "--live" in sys.argv:
        checks.append(("切语言立即生效（不刷新）", live_ok))
    print(json.dumps({"sprites": sprites, "panelText": text[:200], "errors": errors[:5], "shot": str(SHOT)}, ensure_ascii=False, indent=2))
    failed = 0
    for name, ok in checks:
        print(("  ✅ " if ok else "  ❌ ") + name)
        if not ok:
            failed += 1
    if errors:
        for e in errors[:10]:
            print("   ! " + e)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
