const fs = require("fs");
const path = require("path");
const { SCREENS, designSystem, EXP, INC } = require("./screens");
const { C, FONT } = require("./lib");

const OUT = path.resolve(__dirname, "..");
const GROUPS = ["인증", "내역", "영수증 스캔", "분석", "설정"];

// ---------- gallery ----------
const figure = (s) => `
<figure style="margin:0;display:flex;flex-direction:column;gap:10px">
  <div style="width:390px;height:844px;border-radius:32px;overflow:hidden;box-shadow:0 8px 32px rgba(18,36,31,.18);border:1px solid #CFD9D4;background:#fff" data-shot="${s.file}">${s.fn()}</div>
  <figcaption style="font:700 15px ${FONT};color:${C.ink}">${s.id} · ${s.title}<div style="font:500 13px ${FONT};color:${C.ink3};margin-top:2px">${s.note}</div></figcaption>
</figure>`;

const gallery = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>ZALSSM 모바일 시안</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#E9EEEC;font-family:${FONT};color:${C.ink}} h2{font:800 26px ${FONT};margin:56px 0 20px} .row{display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start}</style></head>
<body><div style="padding:48px 56px 80px">
<h1 style="font:800 36px ${FONT};margin:0">ZALSSM 모바일 시안</h1>
<p style="font:500 15px ${FONT};color:${C.ink2};margin:8px 0 0">기준 화면 390 x 844 · 화면 ID(A1, H1 ...)는 docs/02-features-and-screens.md 와 같습니다 · 목업 데이터는 구현용 시드가 아닙니다</p>
<h2>디자인 시스템</h2>
<div style="width:1280px;box-shadow:0 8px 32px rgba(18,36,31,.12);border:1px solid #CFD9D4;background:#fff" data-shot="DS-design-system">${designSystem()}</div>
${GROUPS.map((g) => `<h2>${g}</h2><div class="row">${SCREENS.filter((s) => s.group === g).map(figure).join("")}</div>`).join("\n")}
</div></body></html>`;
fs.writeFileSync(path.join(OUT, "index.html"), gallery);

// ---------- design canvas artboards ----------
const dc = (title, html, w, h) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
body{margin:0}
a{color:${C.primaryDark}}
</style>
</helmet>
${html}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;

const CV = path.join(OUT, "_canvas", "project");
fs.rmSync(path.join(OUT, "_canvas"), { recursive: true, force: true });
fs.mkdirSync(CV, { recursive: true });

const boards = {}, order = [], notes = {};
let y = 0;
// design system = entry
fs.writeFileSync(path.join(CV, "Main.dc.html"), dc("ZALSSM 디자인 시스템", designSystem(), 1280, 1660));
boards["Main.dc.html"] = { x: 0, y: 0, w: 1280, h: 1660, title: "디자인 시스템" };
order.push("Main.dc.html");
notes["t-ds"] = { x: 0, y: -260, text: "ZALSSM 디자인 시스템", kind: "title1", maxW: 1280 };
y = 1660 + 120 + 260;
let n = 0;
GROUPS.forEach((g, gi) => {
  const list = SCREENS.filter((s) => s.group === g);
  list.forEach((s, i) => {
    const file = `${s.file}.dc.html`;
    fs.writeFileSync(path.join(CV, file), dc(`${s.id} ${s.title}`, s.fn(), 390, 844));
    boards[file] = { x: i * 470, y, w: 390, h: 844, title: `${s.id} · ${s.title}` };
    order.push(file);
  });
  notes["t-" + gi] = { x: 0, y: y - 260, text: g, kind: "title1", maxW: Math.max(390, list.length * 470 - 80) };
  y += 844 + 120 + 260;
});
const canvas = { v: 3, createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, "Z") }, title: "ZALSSM 모바일 UI", launch: { view: "canvas" }, pages: [], boards, order, notes, designSystems: [] };
fs.writeFileSync(path.join(CV, "canvas.json"), JSON.stringify(canvas, null, 1));
console.log("screens:", SCREENS.length, "| month exp/inc:", EXP, INC, "| files:", order.length);
