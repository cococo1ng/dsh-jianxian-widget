# -*- coding: utf-8 -*-
"""几何不变量矩阵：量 DOM，不看公式。

为什么要有它：2026-10-26 那天连着修了八个 bug（面板压按钮、法宝越飘越远、点空白也冒泡、
飞出屏幕、面板压标题栏、打坐法宝离头顶远），**全是几何/时序，六道守卫一条都拦不住**，
全靠人眼截图。这个守卫把这些「看起来对不对」变成「量出来多少」：

  ① 法宝到头顶   法宝底边 → 可见头顶 = layout.headGap ± 2px（剑舞帧除外，见下）
  ② 立绘越界     立绘矩形不越出视口（±6px）
  ③ 法宝越界     法宝按钮不越出视口（±6px）
  ④ 面板压人     开了面板不许与立绘矩形相交
  ⑤ 面板越界     面板不越出视口（±6px）

期望值来自 src/layout.json + src/hitboxes.json（与渲染层同一份真源），
但**量的是浏览器里的真实矩形** —— 不是把公式再算一遍。

剑舞 16 帧的头顶在图上位置各不相同，按设计不跟姿态（跟了每 80ms 抖一次），
所以那 16 个姿态只查 ②③④⑤，不查 ①。

用法：
    python verify/geometry.py              # 日常集：6 姿态 × 3 倍率
    python verify/geometry.py --fast       # 精简集：变异体验证用（更快）
    python verify/geometry.py --root DIR   # 量另一份副本（test-teeth 改坏的那份）
"""
import argparse
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

# 控制台是 GBK（Windows 默认）时，最后一行那个 ✅ 会 UnicodeEncodeError 崩掉 ——
# 断言其实早就量完了，崩的只是打印，不该让整道闸变红。
# 统一把 stdout/stderr 调成 UTF-8 + 不可编码字符替换：任何入口（npm test / 直接 python）都不再崩。
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
VIEWPORT = {"width": 1280, "height": 900}
GAP_TOL = 2      # 法宝到头顶 ±2px
EDGE_TOL = 6     # 越界容差（屏幕边缘的阴影/光晕）

DAILY_POSES = ["idle", "sleep", "forge", "doze", "dance04", "dance14"]
DAILY_SCALES = [0.7, 1.0, 1.6]
FAST_POSES = ["idle", "sleep", "dance04"]
FAST_SCALES = [1.0, 1.6]


def free_port():
    import socket
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def serve(root, port):
    return subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=str(root), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


SET_SCALE = """
(s) => {
  const raw = localStorage.getItem('xjj.cfg.v1')
  if (!raw) return 'no-cfg'
  const cfg = JSON.parse(raw)
  cfg.ui = Object.assign({}, cfg.ui || {}, { scale: s })
  localStorage.setItem('xjj.cfg.v1', JSON.stringify(cfg))
  return cfg.ui
}
"""

MEASURE = """
([topFrac, vw, vh]) => {
  const root = document.querySelector('#xjj-web-root .xjj-root')
  if (!root) return { err: '挂件没出现（#xjj-web-root .xjj-root）' }
  const img = root.querySelector('.xjj-sprite.is-on')
  const gear = root.querySelector('.xjj-gear')
  if (!img || !gear) return { err: '缺 sprite / gear' }
  const ir = img.getBoundingClientRect()
  const gr = gear.getBoundingClientRect()
  const headTop = ir.top + topFrac * ir.height
  const out = {
    pose: img.getAttribute('data-pose') || '',
    gap: Math.round(headTop - gr.bottom),
    sprite: { l: ir.left, r: ir.right, t: ir.top, b: ir.bottom },
    gear: { l: gr.left, r: gr.right, t: gr.top, b: gr.bottom },
    overflow: {
      sprite: Math.round(Math.max(0, -ir.left, ir.right - vw, -ir.top, ir.bottom - vh)),
      gear: Math.round(Math.max(0, -gr.left, gr.right - vw, -gr.top, gr.bottom - vh)),
    },
  }
  const panel = root.querySelector('.xjj-panel')
  if (panel) {
    const pr = panel.getBoundingClientRect()
    out.panel = { l: pr.left, r: pr.right, t: pr.top, b: pr.bottom }
    out.panelOverlapSprite = !(pr.right <= ir.left || pr.left >= ir.right || pr.bottom <= ir.top || pr.top >= ir.bottom)
    out.panelOverflow = Math.round(Math.max(0, -pr.left, pr.right - vw, -pr.top, pr.bottom - vh))
  }
  return out
}
"""


def check_one(page, url, pose, scale, top_frac, tracked, problems):
    page.goto(url, wait_until="load")
    page.wait_for_selector("#xjj-web-root .xjj-sprite.is-on", timeout=20000)
    page.wait_for_timeout(260)
    m = page.evaluate(MEASURE, [top_frac, VIEWPORT["width"], VIEWPORT["height"]])
    if m.get("err"):
        problems.append(f"{pose}@{scale} · 页面异常：{m['err']}")
        return None
    tag = f"{pose}@{scale}"

    # 姿态必须先对上：钩子失效时量到的其实是 idle，而 idle 的间距本来就是 9px ——
    # 不加这一条，整格会「静默通过」，等于打坐/守炉根本没测过（自查发现的假绿口子）。
    if m["pose"] != pose:
        problems.append(f"{tag} · 姿态没切换（实际 {m['pose']}）：自测钩子失效，这一格等于没测")
        return m

    if tracked and abs(m["gap"] - LAYOUT["headGap"]) > GAP_TOL:
        problems.append(f"{tag} · 法宝到头顶 = {m['gap']}px（期望 {LAYOUT['headGap']}±{GAP_TOL}）")

    if m["overflow"]["sprite"] > EDGE_TOL:
        problems.append(f"{tag} · 立绘越界 {m['overflow']['sprite']}px")
    if m["overflow"]["gear"] > EDGE_TOL:
        problems.append(f"{tag} · 法宝越界 {m['overflow']['gear']}px")

    # 开面板：不许压人、不许出屏
    page.click("#xjj-web-root .xjj-gear", force=True)
    page.wait_for_timeout(420)
    pm = page.evaluate(MEASURE, [top_frac, VIEWPORT["width"], VIEWPORT["height"]])
    if pm.get("panel"):
        if pm["panelOverlapSprite"]:
            problems.append(f"{tag} · 面板压住立绘")
        if pm["panelOverflow"] > EDGE_TOL:
            problems.append(f"{tag} · 面板越界 {pm['panelOverflow']}px")
        m["panel"] = "ok"
    else:
        problems.append(f"{tag} · 点法宝没开出面板")
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(ROOT))
    ap.add_argument("--fast", action="store_true")
    args = ap.parse_args()
    root = Path(args.root)

    global LAYOUT
    LAYOUT = json.loads((root / "src" / "layout.json").read_text(encoding="utf-8"))
    hit = json.loads((root / "src" / "hitboxes.json").read_text(encoding="utf-8"))

    poses = FAST_POSES if args.fast else DAILY_POSES
    scales = FAST_SCALES if args.fast else DAILY_SCALES

    port = free_port()
    srv = serve(root, port)
    base = f"http://127.0.0.1:{port}/verify/web.html"
    problems = []
    cells = 0
    try:
        for _ in range(60):
            try:
                urllib.request.urlopen(base, timeout=1)
                break
            except Exception:
                time.sleep(0.15)
        with sync_playwright() as p:
            b = p.chromium.launch()
            page = b.new_page(viewport=VIEWPORT, device_scale_factor=1)
            try:
                page.goto(base, wait_until="load")
                page.wait_for_selector("#xjj-web-root .xjj-sprite.is-on", timeout=20000)
            except Exception as err:   # noqa: BLE001
                print(f"❌ 自测台没跑起来（root={root}）")
                print("   常见原因：缺 verify/web.html、缺 dist/xjj.user.js、或产物没构建")
                print("   底层报错：" + str(err).splitlines()[0])
                return 1
            page.wait_for_timeout(400)
            for scale in scales:
                got = page.evaluate(SET_SCALE, scale)
                if got == "no-cfg":
                    problems.append("配置没写进 localStorage（自测台没跑起来）")
                    break
                for pose in poses:
                    url = f"{base}?xjj_test_pose={pose}"
                    tracked = not pose.startswith("dance")
                    m = check_one(page, url, pose, scale, hit[pose]["box"][1], tracked, problems)
                    cells += 1
                    if m:
                        gap_txt = "" if not tracked else f" gap={m['gap']}px"
                        print(f"  量 {pose:8} @{scale:<4} sprite={m['pose']:8}{gap_txt}")
            b.close()
    finally:
        srv.terminate()

    print()
    if problems:
        print(f"❌ 几何不变量：{len(problems)} 项不合格（量了 {cells} 格）")
        for p in problems:
            print("   · " + p)
        return 1
    print(f"✅ 几何不变量全部通过：{cells} 格（{len(poses)} 姿态 × {len(scales)} 倍率）"
          f" · 法宝到头顶 {LAYOUT['headGap']}±{GAP_TOL}px · 面板不压人 · 全在屏内")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
