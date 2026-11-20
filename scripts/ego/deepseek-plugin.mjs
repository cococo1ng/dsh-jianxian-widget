// deepseek.stream 插件市场：就地更新已上架插件（读 _publish/publish-target.json）。
// 用法：ego-browser nodejs -e "await import('file:///<repo>/scripts/ego/deepseek-plugin.mjs')"
const { join } = await import("node:path");
const { readFile } = await import("node:fs/promises");

const HERE = import.meta.dirname;
const ROOT = join(HERE, "..", "..");
const cfg = JSON.parse(await readFile(join(ROOT, "_publish", "publish-target.json"), "utf8"));
const VER = String(cfg.pluginVersion);
const SLUG = cfg.repo.split("/")[1];
console.log("目标插件 v" + VER, cfg.pluginZip);

const task = await taskSpace("jianxian platform upload");
const page = task.page("p1");

await page.goto(`https://deepseek.stream/plugins/${SLUG}`, { timeout: 60000 });
await page.waitForTimeout(2500);

// 1) 打开「✏️ 编辑插件」抽屉
const opened = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const b = [...document.querySelectorAll("button")].find((x) => norm(x.innerText).includes("编辑插件"));
  if (!b) return false;
  b.click();
  return true;
});
console.log("打开编辑抽屉：", opened);
if (!opened) { console.log("❌ 没找到「✏️ 编辑插件」按钮"); process.exit(1); }

await page.waitForSelector('input[type=file][accept=".zip"]', { state: "attached", timeout: 15000 });

// 2) 上传新包
await page.setInputFiles('input[type=file][accept=".zip"]', [cfg.pluginZip]);

// 3) 等平台核对真实版本（会回显「已私有保存…真实版本为 x.y.z」）
let verified = { version: null, uploading: true };
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(2500);
  verified = await page.evaluate(() => {
    const t = (document.body.innerText || "").replace(/\s+/g, " ");
    const m = t.match(/已私有保存[^。]*真实版本为\s*(v?[\d.]+)/);
    const uploading = /正在上传并检查|正在准备安装包/.test(t);
    return { version: m ? m[1] : null, uploading };
  });
  if (verified.version || !verified.uploading) break;
}
console.log("核对结果：", JSON.stringify(verified));
if (!verified.version) { console.log("❌ 平台没回显「真实版本」，检查 zip 或稍后重试"); process.exit(1); }
if (String(verified.version).replace(/^v/, "") !== VER) {
  console.log("❌ 包里版本 %s ≠ 目标 %s（先 build.py 再 pack_all.py）", verified.version, VER);
  process.exit(1);
}

// 4) 填新版本号 → 按钮会自己改名
await page.evaluate((ver) => {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  const inp = [...document.querySelectorAll("input")].find((i) => (i.placeholder || "").includes("新版本号"));
  if (!inp) return;
  set.call(inp, ver);
  inp.dispatchEvent(new Event("input", { bubbles: true }));
  inp.dispatchEvent(new Event("change", { bubbles: true }));
}, VER);
await page.waitForTimeout(900);

const btnLabel = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const b = [...document.querySelectorAll("button")].find((x) => /确认发布新版本|保存修改并即时生效/.test(norm(x.innerText)));
  return b ? norm(b.innerText) : null;
});
console.log("按钮文案：", btnLabel);

// 5) 提交（必须点那个改了名的按钮，点旧的等于没点）
const clicked = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const b = [...document.querySelectorAll("button")].find((x) => /确认发布新版本并就地更新/.test(norm(x.innerText)));
  if (!b) return null;
  const label = norm(b.innerText);
  b.click();
  return label;
});
console.log("点击：", clicked);
if (!clicked) { console.log("❌ 找不到「确认发布新版本并就地更新」——版本号可能没进表单"); process.exit(1); }

await page.waitForTimeout(5000);

const after = await page.evaluate((ver) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const body = norm(document.body.innerText);
  return {
    versionLine: (body.match(/dsh-jianxian-widget\s+v[\d.]+/) || [null])[0],
    status: (body.match(/当前状态：(\S+)/) || [null, null])[1],
    ok: body.includes("v" + ver),
  };
}, VER);
console.log(JSON.stringify(after, null, 2));
if (!after.ok) { console.log("⚠️ 详情页没出现目标版本，去「审核沟通」看是否有拦截"); process.exit(1); }
