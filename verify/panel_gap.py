# -*- coding: utf-8 -*-
"""面板/法宝按钮间距回归：人物放大（0.7/1.0/1.3/1.6）后，面板不许压住法宝按钮。

    python -m http.server 8791 --bind 127.0.0.1
    python verify/panel_gap.py          # 四种缩放各打一张 verify/scale-*.png

2026-10-26 的真实 bug：按钮在缩放容器里会往上跑，面板按 root 顶部 fixed 定位 → 放大后压住按钮。
现在的做法是量按钮矩形当锚点，面板排在按钮上方 10px。
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
        page.wait_for_timeout(1200)
        # 写一份只改 scale 的配置，然后刷新
        page.evaluate(
            """(scale) => {
              const raw = localStorage.getItem('xjj.cfg.v1');
              const cfg = raw ? JSON.parse(raw) : null;
              if (!cfg) return 'no-cfg';
              cfg.ui = Object.assign({}, cfg.ui, { scale: scale });
              localStorage.setItem('xjj.cfg.v1', JSON.stringify(cfg));
              return 'ok';
            }""",
            scale,
        )
        page.reload(wait_until="load")
        page.wait_for_timeout(1200)
        page.click("#xjj-web-root .xjj-gear", force=True)
        page.wait_for_timeout(700)
        m = page.evaluate(
            """() => {
              const g = document.querySelector('#xjj-web-root .xjj-gear').getBoundingClientRect();
              const p = document.querySelector('#xjj-web-root .xjj-panel').getBoundingClientRect();
              const r = document.querySelector('#xjj-web-root .xjj-root').getBoundingClientRect();
              const ov = !(g.right < p.left || g.left > p.right || g.bottom < p.top || g.top > p.bottom);
              return {
                gear: [Math.round(g.left), Math.round(g.top), Math.round(g.right), Math.round(g.bottom)],
                panel: [Math.round(p.left), Math.round(p.top), Math.round(p.right), Math.round(p.bottom)],
                root: [Math.round(r.width), Math.round(r.height)],
                overlap: ov,
              };
            }"""
        )
        page.screenshot(path="verify/scale-%s.png" % scale)
        b.close()
        return m


for s in (0.7, 1.0, 1.3, 1.6):
    print(s, json.dumps(run(s), ensure_ascii=False))
