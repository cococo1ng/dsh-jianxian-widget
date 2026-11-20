// deepseek.stream Skill：更新已有 Skill。这个站只收单个 SKILL.md（不是 zip），
// 且 frontmatter 的 version 必须等于表单里填的版本号 —— 先在本机把头文件校验住，再动浏览器。
// 用法：ego-browser nodejs -e "await import('file:///<repo>/scripts/ego/deepseek-skill.mjs')"
const { join } = await import("node:path");
const { readFile } = await import("node:fs/promises");

const HERE = import.meta.dirname;
const ROOT = join(HERE, "..", "..");
const cfg = JSON.parse(await readFile(join(ROOT, "_publish", "publish-target.json"), "utf8"));
const VER = String(cfg.skillVersion);
console.log("目标 Skill v" + VER, cfg.skillMd);

// 0) 本机先校验 frontmatter（平台会拦，不如提前拦）
const md = await readFile(cfg.skillMd, "utf8");
const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [, ""])[1];
const pick = (k) => ((fm.match(new RegExp("^" + k + ":\\s*(.+)$", "m")) || [, ""])[1] || "").trim();
const state = { version: pick("version"), slug: pick("slug"), title: pick("title"), category: pick("category"), whenToUse: pick("whenToUse") };
console.log("frontmatter:", JSON.stringify(state));
if (!state.title || !state.whenToUse || !state.category) {
  console.log("❌ frontmatter 缺 title / whenToUse / category（平台会显示英文 ID、适用场景空白）");
  process.exit(1);
}
if (state.version !== VER) {
  console.log("❌ SKILL.md 的 version（%s）≠ 目标（%s）；平台会报「必须与 Skill ID 和版本一致」，先改文件", state.version, VER);
  process.exit(1);
}

const NOTE = cfg.skillNotes || `对应插件 v${cfg.pluginVersion}：白衣立绘补顶部留白、法宝图标缩小；SKILL.md 同步版本引用。`;

const task = await taskSpace("jianxian platform upload");
const page = task.page("p1");

await page.goto(`https://deepseek.stream/dashboard?tab=skills&skill=${state.slug}`, { timeout: 60000 });
await page.waitForTimeout(2500);

// 1) 点青云剑仙卡片里的「编辑」
const opened = await page.evaluate((s) => {
  const norm = (x) => (x || "").replace(/\s+/g, " ").trim();
  const cards = [...document.querySelectorAll("div,article,li")].filter((el) => {
    const t = norm(el.innerText);
    return t.includes(s) && t.includes("编辑") && t.length < 600;
  });
  const card = cards.sort((a, b) => norm(a.innerText).length - norm(b.innerText).length)[0];
  const b = card ? [...card.querySelectorAll("button,a")].find((x) => norm(x.innerText) === "编辑") : null;
  if (!b) return false;
  b.click();
  return true;
}, state.slug);
console.log("打开编辑表单：", opened);
if (!opened) { console.log("❌ 没找到编辑入口（先确认 dashboard 里有这个 Skill）"); process.exit(1); }

await page.waitForSelector('input[type=file][accept*=".md"]', { state: "attached", timeout: 15000 });

// 2) 上传 SKILL.md
await page.setInputFiles('input[type=file][accept*=".md"]', [cfg.skillMd]);
await page.waitForTimeout(3000);

// 3) 核对表单回填的版本号
const filled = await page.evaluate(() => {
  const ins = [...document.querySelectorAll("input")];
  const ver = ins.find((i) => i.type === "text" && /^v?\d+\.\d+\.\d+$/.test((i.value || "").trim()));
  const ta = [...document.querySelectorAll("textarea")].sort((a, b) => b.value.length - a.value.length)[0];
  return { version: ver ? ver.value : null, mdLen: ta ? ta.value.length : 0 };
});
console.log("表单回填：", JSON.stringify(filled));
if (String(filled.version).replace(/^v/, "") !== VER) {
  console.log("❌ 表单版本号 %s 与目标 %s 不符，停止", filled.version, VER);
  process.exit(1);
}

// 4) 更新日志
await page.evaluate((note) => {
  const el = [...document.querySelectorAll("input")].find((i) => (i.placeholder || "").includes("说明新增功能或修复内容"));
  if (!el) return;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  set.call(el, note);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}, NOTE);
await page.waitForTimeout(500);

// 5) 提交
const clicked = await page.evaluate(() => {
  const norm = (x) => (x || "").replace(/\s+/g, " ").trim();
  const b = [...document.querySelectorAll("button")].find((x) => norm(x.innerText).includes("保存并提交审核"));
  if (!b) return false;
  b.click();
  return true;
});
console.log("提交：", clicked);

await page.waitForTimeout(5000);

const after = await page.evaluate(() => {
  const norm = (x) => (x || "").replace(/\s+/g, " ").trim();
  const body = norm(document.body.innerText);
  return {
    err: body.includes("必须与") ? "frontmatter 校验报错" : "无",
    versionLine: (body.match(/青云剑仙 · DSH 桌面挂件\s+v[\d.]+/) || [null])[0],
    history: (body.match(/历史版本[:：]\s*\d+/) || [null])[0],
  };
});
console.log(JSON.stringify(after, null, 2));
if (after.err !== "无") process.exit(1);
