# -*- coding: utf-8 -*-
"""面板不许盖住人物 / 法宝按钮：多种缩放 × 多种窗口，做二维矩形相交判断。"""
import json

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8791/verify/web.html"

MEASURE = """
() => {
  const rect = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
  const panel = document.querySelector('#xjj-web-root .xjj-panel');
  const gear = document.querySelector('#xjj-web-root .xjj-gear');
  const img = document.querySelector('#xjj-web-root .xjj-sprite.is-on');
  if (!panel || !img) return null;
  const p = rect(panel);
  const g = rect(gear);
  const s = rect(img);
  const hit = (a, b) => !(a[2] <= b[0] || a[0] >= b[2] || a[3] <= b[1] || a[1] >= b[3]);
  return {
    panel: p.map(Math.round), gear: g.map(Math.round), sprite: s.map(Math.round),
    overSprite: hit(p, s), overGear: hit(p, g),
  };
}
"""

WINDOWS = [(1280, 900), (1024, 768), (900, 700), (420, 820)]
SCALES = [0.7, 1.0, 1.3, 1.6]
bad = []

with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in WINDOWS:
        for scale in SCALES:
            ctx = b.new_context(viewport={"width": vw, "height": vh}, locale="zh-CN")
            pg = ctx.new_page()
            pg.goto(URL, wait_until="load")
            pg.wait_for_timeout(1000)
            pg.evaluate(
                """(s) => { const c = JSON.parse(localStorage.getItem('xjj.cfg.v1')); c.ui.scale = s; localStorage.setItem('xjj.cfg.v1', JSON.stringify(c)); }""",
                scale,
            )
            pg.reload(wait_until="load")
            pg.wait_for_timeout(1200)
            pg.click("#xjj-web-root .xjj-gear", force=True)
            pg.wait_for_timeout(500)
            m = pg.evaluate(MEASURE)
            ctx.close()
            flag = ""
            if m and (m["overSprite"] or m["overGear"]):
                flag = "  ❌"
                bad.append({"win": [vw, vh], "scale": scale, **m})
            print("%dx%d scale %.1f  panel=%s sprite=%s%s" % (vw, vh, scale, m["panel"], m["sprite"], flag))
    b.close()

print("相交组合:", len(bad))
if bad:
    print(json.dumps(bad[:3], ensure_ascii=False))
raise SystemExit(1 if bad else 0)
