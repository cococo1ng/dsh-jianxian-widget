# -*- coding: utf-8 -*-
"""回归：调「人物大小」时，面板不许在鼠标底下移动（否则会误点到别的设置）。

做法：打开面板 → 切到「外观」→ 找到「人物大小」那一行的 ＋ → 用坐标连点 6 次，
      每次量「面板 top」和「＋ 按钮的 y」，两者都不许动。
"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"

FIND_PLUS = """
() => {
  const labels = [...document.querySelectorAll('#xjj-web-root .xjj-lbl')];
  const lbl = labels.find((e) => e.textContent.trim() === '人物大小');
  if (!lbl) return null;
  const row = lbl.closest('.xjj-row') || lbl.parentElement;
  const btns = [...row.querySelectorAll('button')];
  const b = btns[btns.length - 1].getBoundingClientRect();
  return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
}
"""

PANEL_TOP = "() => Math.round(document.querySelector('#xjj-web-root .xjj-panel').getBoundingClientRect().top)"


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page = ctx.new_page()
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1300)
        page.click("#xjj-web-root .xjj-gear", force=True)
        page.wait_for_timeout(500)
        page.get_by_text("外观", exact=True).click()
        page.wait_for_timeout(400)

        plus = page.evaluate(FIND_PLUS)
        if not plus:
            print("找不到「人物大小」行")
            return 1
        tops = [page.evaluate(PANEL_TOP)]
        ys = [plus["y"]]
        for _ in range(6):
            page.mouse.click(plus["x"], plus["y"])
            page.wait_for_timeout(280)
            tops.append(page.evaluate(PANEL_TOP))
            again = page.evaluate(FIND_PLUS)
            ys.append(again["y"] if again else -1)

        scale = page.evaluate("() => { try { return JSON.parse(localStorage.getItem('xjj.cfg.v1')).ui.scale } catch (e) { return null } }")
        b.close()

    panel_drift = max(tops) - min(tops)
    btn_drift = max(ys) - min(ys)
    print(json.dumps({"panelTops": tops, "btnYs": ys, "scale": scale, "panelDrift": panel_drift, "btnDrift": btn_drift}, ensure_ascii=False))
    ok = panel_drift <= 1 and btn_drift <= 1
    print(("  ✅ " if ok else "  ❌ ") + "连点 6 次「人物大小 ＋」：面板位移 %dpx、按钮位移 %dpx" % (panel_drift, btn_drift))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
