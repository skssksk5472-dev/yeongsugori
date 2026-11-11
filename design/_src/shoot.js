const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
(async () => {
  const OUT = path.resolve(__dirname, "..");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 3000, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto("file://" + path.join(OUT, "index.html"));
  await page.waitForTimeout(500);
  fs.mkdirSync(path.join(OUT, "png"), { recursive: true });
  const els = await page.$$("[data-shot]");
  for (const el of els) {
    const name = await el.getAttribute("data-shot");
    // screenshot the inner root (rectangular, no frame radius)
    const inner = name.startsWith("DS-") ? el : await el.$("div");
    await inner.screenshot({ path: path.join(OUT, "png", name + ".png") });
  }
  await browser.close();
  console.log("shots:", els.length);
})();
