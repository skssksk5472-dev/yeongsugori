// ZALSSM design source: tokens + helpers. All styles are emitted inline (needed for the Design canvas).
const React = require("react");
const RDS = require("react-dom/server");
const lu = require("react-icons/lu");

const C = {
  primary: "#00835F", primaryDark: "#005F45", soft: "#E3F5EE", mint: "#3DDBA9",
  ink: "#12241F", ink2: "#44544E", ink3: "#5F6F69", line: "#DCE5E0", bg: "#F4F7F5", card: "#FFFFFF",
  danger: "#D92D3A", dangerSoft: "#FDECEE", warnText: "#7A4F00", warnSoft: "#FFF1D1", seg: "#E8EEEB", deep: "#0F2E26",
};
const FONT = "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif";

const CAT = {
  "식비": { c: "#FF7A45", d: "#B8420C", i: "LuUtensils" },
  "카페·간식": { c: "#B07A4F", d: "#7A4B22", i: "LuCoffee" },
  "교통": { c: "#3B82F6", d: "#1D5FD1", i: "LuBus" },
  "쇼핑": { c: "#EC4899", d: "#BE1F72", i: "LuShoppingBag" },
  "생활": { c: "#6D7BE8", d: "#4352C4", i: "LuHouse" },
  "의료·건강": { c: "#E5484D", d: "#C42B31", i: "LuHeartPulse" },
  "문화·여가": { c: "#F5B301", d: "#8F6A00", i: "LuTicket" },
  "교육": { c: "#2BB3D6", d: "#0B7C99", i: "LuBookOpen" },
  "기타": { c: "#98A2B3", d: "#5B6678", i: "LuEllipsis" },
  "급여": { c: "#00A67E", d: "#005F45", i: "LuWallet" },
  "용돈": { c: "#00A67E", d: "#005F45", i: "LuWallet" },
  "기타수입": { c: "#00A67E", d: "#005F45", i: "LuWallet" },
};
const EXPENSE_CATS = ["식비", "카페·간식", "교통", "쇼핑", "생활", "의료·건강", "문화·여가", "교육", "기타"];

const UNITLESS = new Set(["fontWeight", "flex", "flexGrow", "flexShrink", "opacity", "lineHeight", "zIndex", "order"]);
const kebab = (k) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const S = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${kebab(k)}:${typeof v === "number" && !UNITLESS.has(k) && v !== 0 ? v + "px" : v}`)
    .join(";");
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const E = (tag, style = {}, attrs = {}, kids = []) => {
  const a = Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join("");
  return `<${tag} style="${S(style)}"${a}>${[].concat(kids).join("")}</${tag}>`;
};
const D = (style, ...kids) => E("div", style, {}, kids);
const T = (style, text) => E("div", style, {}, [text]);
const Sp = (style, text) => E("span", style, {}, [text]);

const I = (name, size = 24, color = C.ink, sw = 2) => {
  const Comp = lu[name];
  if (!Comp) throw new Error("icon missing " + name);
  return RDS.renderToStaticMarkup(
    React.createElement(Comp, { size, color, strokeWidth: sw, "aria-hidden": "true", style: { display: "block", flexShrink: 0 } })
  );
};

const won = (n) => Math.abs(n).toLocaleString("ko-KR");
const signed = (n) => (n < 0 ? "-" : "+") + won(n);

// ---------- layout ----------
const root = (kids, { bg = C.bg } = {}) =>
  D({ position: "relative", width: 390, height: 844, overflow: "hidden", background: bg, fontFamily: FONT, color: C.ink, boxSizing: "border-box" }, ...[].concat(kids));

const iconBtn = (icon, label, { size = 44, color = C.ink } = {}) =>
  E("button", { width: size, height: size, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: 12 }, { type: "button", "aria-label": label }, [I(icon, 24, color)]);

const header = (title, { back = true, right = "", big = false } = {}) =>
  D({ height: 56, padding: "0 8px", display: "flex", alignItems: "center", gap: 4, boxSizing: "border-box" },
    back ? iconBtn("LuChevronLeft", "뒤로", {}) : D({ width: 12 }),
    T({ flex: 1, fontSize: big ? 24 : 18, fontWeight: big ? 800 : 700, color: C.ink }, title),
    right);

const tabbar = (active) => {
  const items = [["내역", "LuList"], ["분석", "LuChartPie"], ["설정", "LuSettings"]];
  return D({ position: "absolute", left: 0, right: 0, bottom: 0, height: 72, background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex" },
    ...items.map(([label, ic]) => {
      const on = label === active;
      return E("button", { flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: on ? C.primary : C.ink3, fontFamily: FONT, fontSize: 12, fontWeight: 700 }, { type: "button" }, [I(ic, 24, on ? C.primary : C.ink3, on ? 2.4 : 2), label]);
    }));
};

const fab = () =>
  E("button", { position: "absolute", right: 20, bottom: 88, width: 56, height: 56, borderRadius: "50%", border: "none", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,131,95,.35)" }, { type: "button", "aria-label": "내역 추가" }, [I("LuPlus", 28, "#fff", 2.4)]);

const actionBar = (...kids) =>
  D({ position: "absolute", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: `1px solid ${C.line}`, padding: "16px 20px 24px", boxSizing: "border-box" }, ...kids);

const btn = (label, { variant = "primary", icon = "", h = 54, grow = false } = {}) => {
  const v = {
    primary: { background: C.primary, color: "#fff", border: "none" },
    soft: { background: C.soft, color: C.primaryDark, border: "none" },
    outline: { background: "#fff", color: C.ink, border: `1.5px solid ${C.line}` },
    danger: { background: C.danger, color: "#fff", border: "none" },
    dangerOutline: { background: "#fff", color: C.danger, border: `1.5px solid ${C.line}` },
    disabled: { background: "#E4EAE7", color: "#5F6F69", border: "none" },
  }[variant];
  const fg = v.color;
  return E("button", { height: h, width: grow ? undefined : "100%", flex: grow ? 1 : undefined, borderRadius: 16, fontFamily: FONT, fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box", ...v }, { type: "button" }, [icon ? I(icon, 22, fg) : "", label]);
};

let _id = 0;
const field = ({ label, value = "", placeholder = "", type = "text", error = "", helper = "", right = "", suffix = "", id = "f" + ++_id }) =>
  D({ display: "flex", flexDirection: "column", gap: 8 },
    E("label", { fontSize: 13, fontWeight: 700, color: C.ink2 }, { for: id }, [label]),
    D({ position: "relative" },
      `<input id="${id}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" style="${S({ width: "100%", height: 52, boxSizing: "border-box", border: `1.5px solid ${error ? C.danger : C.line}`, borderRadius: 14, padding: suffix ? "0 44px 0 16px" : right ? "0 48px 0 16px" : "0 16px", fontSize: 16, fontWeight: 500, color: C.ink, background: "#fff", fontFamily: FONT, outline: "none" })}">`,
      right ? D({ position: "absolute", right: 12, top: 14 }, right) : "",
      suffix ? D({ position: "absolute", right: 16, top: 15, fontSize: 16, color: C.ink2, fontWeight: 600 }, suffix) : ""),
    error ? T({ fontSize: 13, fontWeight: 600, color: C.danger }, error) : "",
    helper ? T({ fontSize: 13, color: C.ink3 }, helper) : "");

const seg = (items, active) =>
  D({ display: "flex", background: C.seg, borderRadius: 12, padding: 4, gap: 2 },
    ...items.map((t, i) => E("button", { flex: 1, height: 36, border: "none", borderRadius: 9, fontFamily: FONT, fontSize: 14, fontWeight: 700, background: i === active ? "#fff" : "transparent", color: i === active ? C.ink : C.ink2, boxShadow: i === active ? "0 1px 3px rgba(18,36,31,.12)" : undefined }, { type: "button" }, [t])));

const catIcon = (cat, size = 40) =>
  D({ width: size, height: size, borderRadius: "50%", background: CAT[cat].c + "24", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, I(CAT[cat].i, Math.round(size * 0.5), CAT[cat].d, 2));

const catChip = (cat) =>
  E("button", { height: 32, padding: "0 10px 0 8px", borderRadius: 999, border: "none", background: CAT[cat].c + "24", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink }, { type: "button" }, [I(CAT[cat].i, 16, CAT[cat].d), cat, I("LuChevronDown", 14, C.ink2)]);

const txRow = ({ cat, title, sub, amt, receipt }) =>
  D({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", minHeight: 64, boxSizing: "border-box" },
    catIcon(cat, 40),
    D({ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
      T({ fontSize: 15, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, title),
      D({ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.ink3 }, receipt ? I("LuReceiptText", 14, C.ink3) : "", Sp({ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, sub))),
    T({ fontSize: 16, fontWeight: 700, color: amt > 0 ? C.primary : C.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }, signed(amt)));

const dayGroup = (label, rows) => {
  const total = rows.reduce((a, r) => a + r.amt, 0);
  return D({ background: "#fff", borderRadius: 20, margin: "0 16px 12px", overflow: "hidden" },
    D({ display: "flex", justifyContent: "space-between", padding: "14px 16px 4px", fontSize: 13, fontWeight: 700, color: C.ink2 }, Sp({}, label), Sp({ color: C.ink3, fontVariantNumeric: "tabular-nums" }, (total <= 0 ? "-" : "+") + won(total))),
    ...rows.map(txRow));
};

const monthSel = (label, { nextOff = false } = {}) =>
  D({ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 48 },
    iconBtn("LuChevronLeft", "이전 달"),
    T({ fontSize: 18, fontWeight: 800, minWidth: 110, textAlign: "center" }, label),
    iconBtn("LuChevronRight", "다음 달", { color: nextOff ? "#B7C3BD" : C.ink }));

const mark = (size = 40, bg = C.primary, fg = "#fff") =>
  D({ width: size, height: size, borderRadius: Math.round(size * 0.3), background: bg, display: "flex", alignItems: "center", justifyContent: "center" }, I("LuReceiptText", Math.round(size * 0.58), fg, 2.2));

function receiptSvg(w, h, { stamp = true, rows = 6, label = "영수증 일러스트" } = {}) {
  const z = 10, n = Math.floor(w / z), step = w / n;
  let p = `M0 14 Q0 0 14 0 H${w - 14} Q${w} 0 ${w} 14 V${h - z}`;
  for (let i = 0; i < n; i++) p += ` L${(w - i * step - step / 2).toFixed(1)} ${h} L${(w - (i + 1) * step).toFixed(1)} ${h - z}`;
  p += " Z";
  const top = 26, gap = (h - 112) / rows;
  let body = `<rect x="${w * 0.22}" y="18" width="${w * 0.56}" height="9" rx="4.5" fill="${C.ink}"/>`;
  for (let r = 0; r < rows; r++) {
    const y = top + 18 + r * gap, lw = w * (0.3 + ((r * 37) % 20) / 100);
    body += `<rect x="${w * 0.12}" y="${y}" width="${lw}" height="6" rx="3" fill="${C.line}"/><rect x="${w * 0.76}" y="${y}" width="${w * 0.12}" height="6" rx="3" fill="${C.line}"/>`;
  }
  const ty = h - 62;
  body += `<line x1="${w * 0.12}" x2="${w * 0.88}" y1="${ty}" y2="${ty}" stroke="${C.line}" stroke-width="2" stroke-dasharray="4 4"/>`;
  body += `<rect x="${w * 0.12}" y="${ty + 14}" width="${w * 0.3}" height="8" rx="4" fill="${C.ink}"/><rect x="${w * 0.58}" y="${ty + 14}" width="${w * 0.3}" height="8" rx="4" fill="${C.primary}"/>`;
  if (stamp) {
    const cx = w * 0.74, cy = h * 0.5, r = w * 0.16;
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.primary}"/><path d="M${cx - r * 0.45} ${cy} L${cx - r * 0.1} ${cy + r * 0.38} L${cx + r * 0.5} ${cy - r * 0.35}" fill="none" stroke="#fff" stroke-width="${r * 0.28}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" style="display:block"><path d="${p}" fill="#fff" stroke="${C.line}" stroke-width="1.5"/>${body}</svg>`;
}

const overlay = () => D({ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(18,36,31,.55)" });
const sheetHandle = () => D({ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" });

module.exports = { C, FONT, CAT, EXPENSE_CATS, S, E, D, T, Sp, I, won, signed, root, iconBtn, header, tabbar, fab, actionBar, btn, field, seg, catIcon, catChip, txRow, dayGroup, monthSel, mark, receiptSvg, overlay, sheetHandle };
