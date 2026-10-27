# -*- coding: utf-8 -*-
"""出 README 用的 DSH 版截图（干净背景 + 像真的数字）。

    python -m http.server 8791 --bind 127.0.0.1
    python verify/shot_dsh.py
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/shot-dsh.html"
OUT = Path(__file__).resolve().parent.parent / "docs" / "img" / "panel.png"


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(1800)
        page.click("#xjj-dsh-root .xjj-gear", force=True)
        page.wait_for_timeout(700)
        box = page.eval_on_selector("#xjj-dsh-root .xjj-root", """el => {
          const r = el.getBoundingClientRect()
          const panel = document.querySelector('#xjj-dsh-root .xjj-panel')
          const pr = panel ? panel.getBoundingClientRect() : null
          const left = pr ? Math.min(r.left, pr.left) : r.left
          const top = pr ? Math.min(r.top, pr.top) : r.top
          const right = Math.max(r.right, pr ? pr.right : r.right)
          const bottom = Math.max(r.bottom, pr ? pr.bottom : r.bottom)
          return { x: left - 26, y: top - 26, width: (right - left) + 52, height: (bottom - top) + 52 }
        }""")
        page.screenshot(path=str(OUT), clip=box)
        b.close()
    print("saved", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
