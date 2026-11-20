// SkillHub（skillhub.cn）更新已有 Skill：读 _publish/publish-target.json，上传 zip → 填版本/变更说明 → 提交审核。
// 用法：ego-browser nodejs -e "await import('file:///<repo>/scripts/ego/skillhub-skill.mjs')"
const { join } = await import("node:path");
const { readFile } = await import("node:fs/promises");

const HERE = import.meta.dirname;
const ROOT = join(HERE, "..", "..");
const cfg = JSON.parse(await readFile(join(ROOT, "_publish", "publish-target.json"), "utf8"));
console.log("目标 Skill v" + cfg.skillVersion, cfg.skillZip);

const NOTE = cfg.skillNotes ||
  `对应插件 v${cfg.pluginVersion}：白衣立绘补顶部留白（黑白衣等高）、法宝图标缩小；SKILL.md 同步版本引用。`;

const task = await taskSpace("jianxian platform upload");
const page = task.page("p1");

await page.goto("https://skillhub.cn/dashboard", { timeout: 60000 });
await page.waitForTimeout(2500);

// 1) 点卡片上的「更新」（是 span onclick，不是 button）
const opened = await page.evaluate((slug) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const spans = [...document.querySelectorAll("span")].filter((el) => norm(el.innerText) === "更新");
  for (const sp of spans) {
    let el = sp;
    for (let i = 0; i < 5 && el; i++) {
      el = el.parentElement;
      if (!el) break;
      const t = norm(el.innerText);
      if (t.includes("slug:") && t.includes(slug)) { sp.click(); return { ok: true }; }
    }
  }
  return { ok: false, spans: spans.length };
}, "qingyun-jianxian");
console.log("打开更新弹窗：", JSON.stringify(opened));
if (!opened.ok) { console.log("❌ 没找到青云剑仙卡片的「更新」"); process.exit(1); }

await page.waitForSelector('input[type=file][accept*="zip"]', { state: "attached", timeout: 15000 });

// 2) 上传 zip（包里只有文本，平台会拒收二进制所以没放 icon）
await page.setInputFiles('input[type=file][accept*="zip"]', [cfg.skillZip]);

// 3) 等解析结束
let done = false;
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(2500);
  done = await page.evaluate(() => {
    const t = document.body.innerText;
    return !t.includes("正在上传并检查") && !t.includes("正在准备安装包");
  });
  if (done) break;
}
console.log("解析完成：", done);

// 4) 版本号 + 变更说明
await page.fill('input[placeholder="1.0.0"]', String(cfg.skillVersion));
await page.fill('textarea[placeholder="描述本次版本的主要变更内容"]', NOTE);
await page.waitForTimeout(500);

// 5) 检查图标区（必须是自定义 + 有图；2026-11-20 踩过默认预设占位图）
const icon = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const btn = [...document.querySelectorAll("button, div, span")].find((el) => norm(el.innerText) === "自定义");
  const imgs = [...document.querySelectorAll("img")].map((i) => i.src).filter((s) => s.includes("skill-icons"));
  return { hasCustomTab: !!btn, iconCount: imgs.length };
});
console.log("图标区：", JSON.stringify(icon));
if (!icon.iconCount) console.log("⚠️ 没看到自定义图标缩略图，提交后请到详情页确认不是预设紫方块");

const before = await page.evaluate(() => {
  const ver = document.querySelector('input[placeholder="1.0.0"]');
  const note = document.querySelector('textarea[placeholder="描述本次版本的主要变更内容"]');
  const files = (document.body.innerText.match(/已选择\s*(\d+)\s*个文件/) || [null, null])[1];
  return { version: ver ? ver.value : null, noteLen: note ? note.value.length : 0, fileCount: files };
});
console.log("提交前：", JSON.stringify(before));
if (!before.version || String(before.version) !== String(cfg.skillVersion)) {
  console.log("❌ 版本号没填对，停止");
  process.exit(1);
}

// 6) 提交
const clicked = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const b = [...document.querySelectorAll("button")].find((x) => norm(x.innerText) === "更新 Skill");
  if (!b) return false;
  b.click();
  return true;
});
console.log("点「更新 Skill」：", clicked);

await page.waitForTimeout(5000);

const after = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const body = norm(document.body.innerText);
  const m = body.match(/V\s*[\d.]+\s*(安全审核中|已发布)/);
  return {
    submitted: body.includes("已提交") || body.includes("提交成功"),
    versionTag: m ? m[0] : null,
    tail: body.slice(-200),
  };
});
console.log(JSON.stringify(after, null, 2));
