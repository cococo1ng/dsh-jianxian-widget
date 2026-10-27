# -*- coding: utf-8 -*-
"""网页版冒烟测试：真浏览器里跑产物，截图 + 断言。

用法（先起服务）：
    cd _tools/jianxian-widget
    python -m http.server 8791 --bind 127.0.0.1
    python verify/web_smoke.py                       # 中文版
    python verify/web_smoke.py web-en.html en-shot.png "Balance"   # 英文版
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PAGE = sys.argv[1] if len(sys.argv) > 1 else "web.html"
SHOT = Path(__file__).with_name(sys.argv[2] if len(sys.argv) > 2 else "web-shot.png")
EXPECT = sys.argv[3] if len(sys.argv) > 3 else "数据"   # 面板里必须出现的词（验语言）
LOCALE = sys.argv[4] if len(sys.argv) > 4 else "zh-CN"  # 浏览器语言：zh-CN / en-US
URL = "http://127.0.0.1:8791/verify/" + PAGE


def main() -> int:
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # 语言由浏览器 locale 决定（挂件跟随 navigator.language），所以这里显式指定
        context = browser.new_context(viewport={"width": 1280, "height": 820}, locale=LOCALE)
        page = context.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1800)

        probe = page.inner_text("#probe")
        sprites = page.eval_on_selector_all("#xjj-web-root .xjj-sprite", "els => els.length")
        root = page.eval_on_selector_all("#xjj-web-root .xjj-root", "els => els.length")
        box = page.eval_on_selector("#xjj-web-root .xjj-root", "el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }")
        zindex = page.eval_on_selector("#xjj-web-root .xjj-root", "el => getComputedStyle(el).zIndex")
        # 人物带 5.2 秒浮动动画，Playwright 的"元素稳定"检查永远等不到 —— 用坐标点
        stage = page.eval_on_selector("#xjj-web-root .xjj-stage", "el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }")
        page.mouse.click(stage["x"], stage["y"])
        page.wait_for_timeout(700)
        bubbles = page.eval_on_selector_all("#xjj-web-root .xjj-bubble", "els => els.length")
        # 法宝按钮也能点（开面板）
        page.click("#xjj-web-root .xjj-gear", force=True)
        page.wait_for_timeout(900)
        panel = page.eval_on_selector_all("#xjj-web-root .xjj-panel", "els => els.length")
        panel_text = page.inner_text("#xjj-web-root .xjj-panel") if panel else ""
        cfg = page.evaluate("() => { try { return localStorage.getItem('xjj.cfg.v1') } catch (e) { return null } }")
        page.screenshot(path=str(SHOT))

        browser.close()

    checks = [
        ("host 垫片已加载", "host=4." in probe),
        ("#xjj-web-root 挂上", root == 1),
        ("39 张 sprite 齐全", sprites == 39),
        ("z-index 被抬到顶层", zindex == "2147483000"),
        ("点人物能冒泡", bubbles >= 1),
        ("点法宝能开面板", panel >= 1),
        ("面板文案是「" + EXPECT + "」", EXPECT in panel_text),
        ("配置写进 localStorage", bool(cfg) and len(cfg) > 100),
        ("控制台没有报错", len(errors) == 0),
    ]
    bad = [(name, detail) for name, ok in checks if not ok for detail in [None]]
    print(json.dumps({"probe": probe, "box": box, "zindex": zindex, "panel": panel,
                      "cfgBytes": len(cfg or ""), "errors": errors[:5], "shot": str(SHOT)},
                     ensure_ascii=False, indent=2))
    failed = 0
    for name, ok in checks:
        print(("  ✅ " if ok else "  ❌ ") + name)
        if not ok:
            failed += 1
    if errors:
        print("控制台错误：")
        for e in errors[:10]:
            print("   - " + e)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
