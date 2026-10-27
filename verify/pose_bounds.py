# -*- coding: utf-8 -*-
"""宽姿态不许被屏幕边裁掉：1.6× 下逐个姿态检查立绘左右是否在屏内。"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"

CHECK = """() => {
  const el = document.querySelector('#xjj-web-root .xjj-sprite.is-on');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { pose: el.getAttribute('data-pose'), L: Math.round(r.left), R: Math.round(r.right), W: Math.round(r.width) };
}"""


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page = ctx.new_page()
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1100)
        page.evaluate("() => { const c = JSON.parse(localStorage.getItem('xjj.cfg.v1')); c.ui.scale = 1.6; localStorage.setItem('xjj.cfg.v1', JSON.stringify(c)); }")
        page.reload(wait_until="load")
        page.wait_for_timeout(1300)

        # 预览全部动作：把姿态轮一遍
        page.click("#xjj-web-root .xjj-gear", force=True)
        page.wait_for_timeout(400)
        page.get_by_text("更多", exact=True).click()
        page.wait_for_timeout(250)
        page.get_by_text("预览全部动作", exact=True).click()

        seen = {}
        worst = None
        for _ in range(120):
            s = page.evaluate(CHECK)
            if s:
                seen[s["pose"]] = s
                if worst is None or s["R"] > worst["R"]:
                    worst = s
            page.wait_for_timeout(120)
        b.close()

    bad = [s for s in seen.values() if s["L"] < 0 or s["R"] > 1280]
    print("跑过 %d 个姿态，最右 %s" % (len(seen), json.dumps(worst, ensure_ascii=False)))
    if bad:
        print("  ❌ 越界：" + json.dumps(bad[:5], ensure_ascii=False))
        return 1
    print("  ✅ 全部姿态都在屏内")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
