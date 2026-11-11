const L = require("./lib");
const FONT = L.FONT;
const { C, CAT, EXPENSE_CATS, D, T, Sp, E, I, won, signed, root, iconBtn, header, tabbar, fab, actionBar, btn, field, seg, catIcon, catChip, dayGroup, monthSel, mark, receiptSvg, overlay, sheetHandle } = L;

// ---------- mock data (kept consistent: totals are computed) ----------
const HOME = [
  ["11월 3일 화요일", [
    { cat: "식비", title: "김치찌개", sub: "식비", amt: -9000 },
    { cat: "카페·간식", title: "아메리카노", sub: "카페·간식", amt: -4500 },
    { cat: "교통", title: "버스 요금", sub: "교통", amt: -1500 },
  ]],
  ["11월 2일 월요일", [
    { cat: "문화·여가", title: "영상 구독", sub: "문화·여가", amt: -17000 },
    { cat: "식비", title: "우유 1L", sub: "한빛마트 경산점 · 식비", amt: -2800, receipt: true },
    { cat: "식비", title: "삼각김밥 참치마요", sub: "한빛마트 경산점 · 식비", amt: -3000, receipt: true },
    { cat: "생활", title: "물티슈 80매", sub: "한빛마트 경산점 · 생활", amt: -2500, receipt: true },
    { cat: "생활", title: "샴푸 400ml", sub: "한빛마트 경산점 · 생활", amt: -6900, receipt: true },
    { cat: "생활", title: "행사 할인", sub: "한빛마트 경산점 · 생활", amt: 1000, receipt: true },
  ]],
  ["11월 1일 일요일", [
    { cat: "급여", title: "10월 급여", sub: "급여", amt: 2000000, income: true },
    { cat: "생활", title: "월세", sub: "생활", amt: -300000 },
    { cat: "교통", title: "택시", sub: "교통", amt: -8400 },
  ]],
];
const allRows = HOME.flatMap(([, r]) => r);
const EXP = -allRows.filter((r) => !r.income).reduce((a, r) => a + r.amt, 0);
const INC = allRows.filter((r) => r.income).reduce((a, r) => a + r.amt, 0);

const STATS = [["식비", 412300, 32], ["생활", 338500, 11], ["교통", 96400, 24], ["카페·간식", 87900, 15], ["쇼핑", 76200, 5], ["문화·여가", 58000, 4], ["의료·건강", 31000, 2], ["기타", 18700, 3]];
const STAT_TOTAL = STATS.reduce((a, s) => a + s[1], 0);
const PREV_TOTAL = 1036000;

const BRAND_SMALL = () => D({ display: "flex", alignItems: "center", gap: 8 }, mark(28), T({ fontSize: 20, fontWeight: 800, color: C.primaryDark }, "잘씀"));

const summaryCard = (monthLabel, exp, inc) =>
  D({ margin: "0 16px 12px", background: C.deep, borderRadius: 24, padding: "20px 20px 18px", color: "#fff" },
    T({ fontSize: 13, fontWeight: 600, color: "#C9D8D2" }, `${monthLabel} 지출`),
    D({ display: "flex", alignItems: "baseline", gap: 4, margin: "4px 0 16px" }, T({ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums" }, won(exp)), T({ fontSize: 18, fontWeight: 700 }, "원")),
    D({ display: "flex", gap: 24 },
      D({}, T({ fontSize: 12, fontWeight: 600, color: "#C9D8D2" }, "수입"), T({ fontSize: 16, fontWeight: 700, color: C.mint, fontVariantNumeric: "tabular-nums", marginTop: 2 }, won(inc))),
      D({}, T({ fontSize: 12, fontWeight: 600, color: "#C9D8D2" }, "잔액"), T({ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginTop: 2 }, won(inc - exp)))));

// ---------- A1 login ----------
const A1 = () =>
  root([
    D({ position: "absolute", left: 0, top: 0, right: 0, height: 300, background: C.primary }),
    D({ position: "absolute", left: 28, top: 72 },
      mark(52, "#fff", C.primary),
      T({ fontSize: 40, fontWeight: 800, color: "#fff", marginTop: 16 }, "잘씀"),
      T({ fontSize: 13, fontWeight: 800, color: C.mint, letterSpacing: "4px", marginTop: 2 }, "ZALSSM"),
      T({ fontSize: 15, fontWeight: 500, color: "#fff", marginTop: 14 }, "영수증으로 기록하는 가계부")),
    D({ position: "absolute", right: 28, top: 70, transform: "rotate(7deg)" }, receiptSvg(124, 168, { rows: 5, label: "영수증 일러스트" })),
    D({ position: "absolute", left: 0, right: 0, top: 268, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "32px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 },
      T({ fontSize: 22, fontWeight: 800 }, "로그인"),
      field({ label: "이메일", placeholder: "example@email.com", type: "email", id: "login-email" }),
      field({ label: "비밀번호", value: "password1", type: "password", id: "login-pw", right: I("LuEye", 22, C.ink3) }),
      D({ height: 4 }),
      btn("로그인"),
      D({ display: "flex", justifyContent: "center", gap: 8, fontSize: 14, marginTop: 4 }, Sp({ color: C.ink2 }, "계정이 없으신가요?"), E("a", { color: C.primaryDark, fontWeight: 800, textDecoration: "underline" }, { href: "#" }, ["회원가입"]))),
  ], { bg: "#fff" });

// ---------- A2 signup ----------
const A2 = () =>
  root([
    header("회원가입"),
    D({ padding: "8px 24px", display: "flex", flexDirection: "column", gap: 18 },
      field({ label: "이메일", value: "zalssm@example.com", type: "email", id: "su-email" }),
      field({ label: "닉네임", value: "잘쓰는사람", id: "su-nick" }),
      field({ label: "비밀번호", value: "password1", type: "password", id: "su-pw", helper: "8자 이상, 영문과 숫자 포함" }),
      field({ label: "비밀번호 확인", value: "password2", type: "password", id: "su-pw2", error: "비밀번호가 일치하지 않습니다" })),
    actionBar(btn("가입하기"), D({ display: "flex", justifyContent: "center", gap: 8, fontSize: 14, marginTop: 14 }, Sp({ color: C.ink2 }, "이미 계정이 있으신가요?"), E("a", { color: C.primaryDark, fontWeight: 800, textDecoration: "underline" }, { href: "#" }, ["로그인"]))),
  ], { bg: "#fff" });

// ---------- H1 home ----------
const homeBody = () => [
  D({ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 20px" }, BRAND_SMALL()),
  monthSel("2026년 11월", { nextOff: true }),
  summaryCard("11월", EXP, INC),
  D({ margin: "0 16px 12px" }, seg(["전체", "지출", "수입"], 0)),
  ...HOME.map(([label, rows]) => dayGroup(label, rows)),
];
const H1 = () => root([...homeBody(), fab(), tabbar("내역")]);

// ---------- H1e empty ----------
const H1e = () =>
  root([
    D({ display: "flex", alignItems: "center", height: 56, padding: "0 20px" }, BRAND_SMALL()),
    monthSel("2026년 11월", { nextOff: true }),
    summaryCard("11월", 0, 0),
    D({ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 0" },
      receiptSvg(104, 136, { stamp: false, rows: 4, label: "빈 영수증 일러스트" }),
      T({ fontSize: 18, fontWeight: 800, marginTop: 20 }, "아직 내역이 없습니다"),
      T({ fontSize: 14, color: C.ink3, marginTop: 6 }, "영수증을 촬영하거나 직접 입력하세요"),
      D({ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }, btn("영수증 촬영", { icon: "LuCamera" }), btn("직접 입력", { variant: "soft", icon: "LuPencilLine" }))),
    tabbar("내역"),
  ]);

// ---------- H2 add sheet ----------
const opt = (icon, title, sub) =>
  E("button", { flex: 1, background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 20, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, fontFamily: FONT, textAlign: "left" }, { type: "button" }, [
    D({ width: 48, height: 48, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center" }, I(icon, 24, C.primary)),
    D({}, T({ fontSize: 16, fontWeight: 800, color: C.ink }, title), T({ fontSize: 13, color: C.ink3, marginTop: 2 }, sub))]);
const H2 = () =>
  root([
    ...homeBody(), tabbar("내역"), overlay(),
    D({ position: "absolute", left: 0, right: 0, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "12px 20px 32px", boxSizing: "border-box" },
      sheetHandle(),
      T({ fontSize: 18, fontWeight: 800, marginBottom: 16 }, "내역 추가"),
      D({ display: "flex", gap: 12 }, opt("LuCamera", "영수증 촬영", "자동으로 인식"), opt("LuPencilLine", "직접 입력", "금액과 항목 입력"))),
  ]);

// ---------- H3 / H4 form ----------
const catGrid = (selected) =>
  D({ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 },
    ...EXPENSE_CATS.map((c) => {
      const on = c === selected;
      return E("button", { height: 64, borderRadius: 14, border: on ? `2px solid ${C.primary}` : `1.5px solid ${C.line}`, background: on ? C.soft : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink, boxSizing: "border-box" }, { type: "button", "aria-pressed": on ? "true" : "false" }, [I(CAT[c].i, 22, CAT[c].d), c]);
    }));
const listField = (label, inner) =>
  D({ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: 56, borderBottom: `1px solid ${C.line}` }, E("label", { width: 48, fontSize: 14, fontWeight: 700, color: C.ink2 }, {}, [label]), inner);
const plainInput = (id, value, placeholder = "") =>
  `<input id="${id}" value="${value}" placeholder="${placeholder}" style="flex:1;border:none;outline:none;font-size:16px;font-weight:500;color:${C.ink};background:transparent;font-family:${L.FONT};height:40px;min-width:0">`;
const formBody = ({ title, selected, value, memo = "", dateText = "2026.11.03 (화)", content, trash = false, receiptBanner = false }) => [
  header(title, { right: trash ? iconBtn("LuTrash2", "삭제", { color: C.danger }) : "" }),
  D({ padding: "4px 20px 0" },
    receiptBanner ? D({ display: "flex", alignItems: "center", gap: 8, background: C.soft, borderRadius: 14, padding: "10px 14px", marginBottom: 12, fontSize: 14, fontWeight: 600, color: C.primaryDark }, I("LuReceiptText", 18, C.primaryDark), Sp({ flex: 1 }, "영수증으로 등록된 내역"), E("a", { fontWeight: 800, textDecoration: "underline" }, { href: "#" }, ["영수증 보기"])) : "",
    seg(["지출", "수입"], 0),
    D({ margin: "16px 0 8px" },
      E("label", { fontSize: 13, fontWeight: 700, color: C.ink2 }, { for: "amt" }, ["금액"]),
      D({ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4, borderBottom: `2px solid ${C.primary}`, paddingBottom: 6 },
        `<input id="amt" value="${value}" inputmode="numeric" style="flex:1;border:none;outline:none;font-size:40px;font-weight:800;color:${C.ink};background:transparent;font-family:${L.FONT};min-width:0;width:100%">`,
        T({ fontSize: 22, fontWeight: 700 }, "원"))),
    T({ fontSize: 13, fontWeight: 700, color: C.ink2, margin: "16px 0 8px" }, "카테고리"),
    catGrid(selected),
    D({ marginTop: 12, background: "#fff", borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden" },
      listField("날짜", D({ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 500 }, Sp({}, dateText), I("LuCalendar", 20, C.ink3))),
      listField("내용", plainInput("memo-title", content, "내용 입력")),
      D({ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: 56 }, E("label", { width: 48, fontSize: 14, fontWeight: 700, color: C.ink2 }, {}, ["메모"]), plainInput("memo-note", memo, "선택 입력")))),
  actionBar(btn("저장")),
];
const H3 = () => root(formBody({ title: "내역 추가", selected: "식비", value: "9,000", content: "김치찌개" }), { bg: C.bg });
const H4 = () => root(formBody({ title: "내역 수정", selected: "생활", value: "6,900", content: "샴푸 400ml", dateText: "2026.11.02 (월)", trash: true, receiptBanner: true }), { bg: C.bg });

// ---------- O1 scan guide ----------
const corner = (pos) => {
  const b = `4px solid ${C.primary}`;
  const m = { tl: { top: 0, left: 0, borderTop: b, borderLeft: b, borderTopLeftRadius: 14 }, tr: { top: 0, right: 0, borderTop: b, borderRight: b, borderTopRightRadius: 14 }, bl: { bottom: 0, left: 0, borderBottom: b, borderLeft: b, borderBottomLeftRadius: 14 }, br: { bottom: 0, right: 0, borderBottom: b, borderRight: b, borderBottomRightRadius: 14 } }[pos];
  return D({ position: "absolute", width: 36, height: 36, ...m });
};
const tip = (icon, text) => D({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.ink2 }, D({ width: 44, height: 44, borderRadius: "50%", background: C.soft, display: "flex", alignItems: "center", justifyContent: "center" }, I(icon, 22, C.primary)), text);
const O1 = () =>
  root([
    header("영수증 촬영"),
    D({ margin: "12px 40px 0", height: 360, position: "relative", background: "#fff", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" },
      corner("tl"), corner("tr"), corner("bl"), corner("br"), receiptSvg(150, 280, { stamp: false, rows: 8, label: "촬영 안내용 영수증 일러스트" })),
    D({ display: "flex", gap: 8, padding: "28px 20px 0" }, tip("LuMaximize", "평평하게 펼치기"), tip("LuScanLine", "전체가 보이게"), tip("LuSun", "밝은 곳에서")),
    actionBar(D({ display: "flex", flexDirection: "column", gap: 10 }, btn("촬영하기", { icon: "LuCamera" }), btn("앨범에서 선택", { variant: "outline", icon: "LuImage" }))),
  ], { bg: C.bg });

// ---------- O2 progress ----------
const stepRow = (state, label, right) => {
  const dot = state === "done"
    ? D({ width: 28, height: 28, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }, I("LuCheck", 16, "#fff", 3))
    : state === "active"
      ? D({ width: 28, height: 28, boxSizing: "border-box", borderRadius: "50%", border: `3px solid ${C.soft}`, borderTopColor: C.primary })
      : D({ width: 28, height: 28, boxSizing: "border-box", borderRadius: "50%", border: `2px solid ${C.line}` });
  return D({ display: "flex", alignItems: "center", gap: 14, height: 48 }, dot, T({ flex: 1, fontSize: 16, fontWeight: state === "pending" ? 600 : 700, color: state === "pending" ? C.ink3 : C.ink }, label), T({ fontSize: 13, fontWeight: 600, color: state === "active" ? C.primaryDark : C.ink3 }, right));
};
const O2 = () =>
  root([
    D({ height: 56, display: "flex", padding: "0 8px", alignItems: "center", justifyContent: "flex-end" }, iconBtn("LuX", "닫기")),
    D({ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 },
      D({ position: "relative", width: 168, height: 220 }, receiptSvg(168, 220, { stamp: false, rows: 6, label: "분석 중인 영수증 일러스트" }),
        D({ position: "absolute", left: 0, right: 0, top: 70, height: 56, background: "rgba(61,219,169,.2)" }),
        D({ position: "absolute", left: -8, right: -8, top: 125, height: 3, background: C.mint, borderRadius: 2, boxShadow: "0 0 14px 3px rgba(61,219,169,.6)" })),
      T({ fontSize: 22, fontWeight: 800, marginTop: 32 }, "영수증을 분석하고 있습니다"),
      T({ fontSize: 14, color: C.ink3, marginTop: 6 }, "약 10초 소요됩니다")),
    D({ margin: "28px 24px 0", background: "#fff", borderRadius: 20, padding: "8px 20px" }, stepRow("done", "업로드", "완료"), stepRow("active", "품목 인식", "진행 중"), stepRow("pending", "카테고리 분류", "대기")),
    D({ position: "absolute", left: 0, right: 0, bottom: 32, display: "flex", justifyContent: "center" }, E("button", { border: "none", background: "transparent", fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.ink2, padding: "12px 20px" }, { type: "button" }, ["취소"])),
  ], { bg: C.bg });

// ---------- O3 / O3b result ----------
const ITEMS = [
  { name: "우유 1L", amt: 2800, cat: "식비" },
  { name: "삼각김밥 참치마요", qty: 2, amt: 3000, cat: "식비" },
  { name: "물티슈 80매", amt: 2500, cat: "생활" },
  { name: "샴푸 400ml", amt: 6900, cat: "생활" },
  { name: "행사 할인", amt: -1000, cat: "생활", discount: true },
];
const itemRow = (it, last) =>
  D({ padding: "7px 16px", borderBottom: last ? "none" : `1px solid ${C.line}`, display: "flex", flexDirection: "column", gap: 5, boxSizing: "border-box" },
    D({ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
      D({ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }, T({ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, it.name), it.qty ? Sp({ fontSize: 12, fontWeight: 700, color: C.ink2, background: C.seg, borderRadius: 6, padding: "1px 6px" }, "x" + it.qty) : ""),
      T({ fontSize: 16, fontWeight: 700, color: it.discount ? C.primary : C.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }, it.discount ? "-" + won(it.amt) : won(it.amt))),
    D({ display: "flex", justifyContent: "space-between", alignItems: "center" }, catChip(it.cat), iconBtn("LuTrash2", "품목 삭제", { size: 32, color: C.ink3 })));
const resultScreen = ({ mismatch = false, sheet = false }) => {
  const items = ITEMS.map((x) => ({ ...x }));
  if (mismatch) items[3].amt = 8100;
  const sum = items.reduce((a, x) => a + x.amt, 0), receiptTotal = 14200;
  const diff = sum - receiptTotal;
  return root([
    header("인식 결과"),
    D({ margin: "4px 16px 10px", background: "#fff", borderRadius: 20, padding: 16, display: "flex", gap: 14, alignItems: "center" },
      D({ width: 52, height: 68, borderRadius: 10, background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, I("LuReceiptText", 26, C.primary)),
      D({ flex: 1, display: "flex", flexDirection: "column", gap: 6 },
        D({ display: "flex", alignItems: "center", justifyContent: "space-between" }, T({ fontSize: 17, fontWeight: 800 }, "한빛마트 경산점"), I("LuPencilLine", 18, C.ink3)),
        D({ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: C.ink2 }, Sp({}, "2026.11.02 (월)"), I("LuCalendar", 18, C.ink3)))),
    mismatch
      ? D({ margin: "0 16px 10px", display: "flex", alignItems: "center", gap: 8, background: C.warnSoft, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.warnText }, I("LuTriangleAlert", 18, C.warnText), `품목 합계와 영수증 합계가 다릅니다 (차액 ${won(diff)}원)`)
      : D({ margin: "0 16px 10px", display: "flex", alignItems: "center", gap: 8, background: C.soft, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.primaryDark }, I("LuCheck", 18, C.primaryDark, 3), "품목 합계가 영수증 합계와 일치합니다"),
    T({ margin: "0 20px 8px", fontSize: 14, fontWeight: 800, color: C.ink2 }, `품목 ${items.length}개`),
    D({ margin: "0 16px", background: "#fff", borderRadius: 20, overflow: "hidden" }, ...items.map((it, i) => itemRow(it, i === items.length - 1))),
    E("button", { margin: "10px 16px 0", width: 358, height: 44, borderRadius: 14, border: `1.5px dashed ${C.primary}`, background: "transparent", color: C.primaryDark, fontFamily: FONT, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, { type: "button" }, [I("LuPlus", 18, C.primaryDark, 2.4), "품목 추가"]),
    actionBar(
      mismatch
        ? D({ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 },
          D({ display: "flex", flexDirection: "column", gap: 2 }, Sp({ fontSize: 12, fontWeight: 600, color: C.ink3 }, "영수증 합계"), Sp({ fontSize: 16, fontWeight: 700, color: C.ink2, fontVariantNumeric: "tabular-nums" }, won(receiptTotal) + "원")),
          D({ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }, Sp({ fontSize: 12, fontWeight: 700, color: C.warnText }, "품목 합계"), Sp({ fontSize: 22, fontWeight: 800, color: C.warnText, fontVariantNumeric: "tabular-nums" }, won(sum) + "원")))
        : D({ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }, Sp({ fontSize: 14, fontWeight: 600, color: C.ink2 }, "합계"), Sp({ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }, won(sum) + "원")),
      btn(`${items.length}건 저장`)),
    sheet ? overlay() : "",
    sheet ? itemSheet() : "",
  ]);
};
const itemSheet = () =>
  D({ position: "absolute", left: 0, right: 0, bottom: 0, background: "#fff", borderRadius: "28px 28px 0 0", padding: "12px 20px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 },
    sheetHandle(),
    D({ display: "flex", justifyContent: "space-between", alignItems: "center" }, T({ fontSize: 18, fontWeight: 800 }, "품목 수정"), iconBtn("LuX", "닫기", { size: 36 })),
    field({ label: "품목명", value: "샴푸 400ml", id: "it-name" }),
    field({ label: "금액", value: "6,900", id: "it-amt", suffix: "원" }),
    T({ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: -6 }, "카테고리"),
    D({ display: "flex", flexWrap: "wrap", gap: 8 }, ...EXPENSE_CATS.map((c) => {
      const on = c === "생활";
      return E("button", { height: 36, padding: "0 12px", borderRadius: 999, border: on ? `2px solid ${C.primary}` : `1.5px solid ${C.line}`, background: on ? C.soft : "#fff", fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink, boxSizing: "border-box" }, { type: "button", "aria-pressed": on ? "true" : "false" }, [c]);
    })),
    D({ display: "flex", gap: 10, marginTop: 4 }, D({ flex: 1 }, btn("삭제", { variant: "dangerOutline" })), D({ flex: 2 }, btn("확인"))));
const O3 = () => resultScreen({});
const O3b = () => resultScreen({ mismatch: true });
const O4 = () => resultScreen({ sheet: true });

// ---------- O5 failed ----------
const O5 = () =>
  root([
    header("영수증 촬영"),
    D({ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 96, textAlign: "center" },
      D({ width: 96, height: 96, borderRadius: "50%", background: C.warnSoft, display: "flex", alignItems: "center", justifyContent: "center" }, I("LuTriangleAlert", 44, C.warnText, 2)),
      T({ fontSize: 22, fontWeight: 800, marginTop: 28 }, "영수증을 인식하지 못했습니다"),
      T({ fontSize: 14, color: C.ink3, marginTop: 8, lineHeight: 1.5 }, "다시 촬영하거나 직접 입력하세요")),
    actionBar(D({ display: "flex", flexDirection: "column", gap: 10 }, btn("다시 촬영", { icon: "LuCamera" }), btn("직접 입력", { variant: "outline", icon: "LuPencilLine" }))),
  ], { bg: C.bg });

// ---------- N1 stats ----------
function donut() {
  const r = 76, sw = 30, circ = 2 * Math.PI * r;
  let off = 0, segs = "";
  STATS.forEach(([cat, amt]) => {
    const len = (amt / STAT_TOTAL) * circ;
    segs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${CAT[cat].c}" stroke-width="${sw}" stroke-dasharray="${(len - 2).toFixed(2)} ${(circ - len + 2).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 100 100)"/>`;
    off += len;
  });
  return D({ position: "relative", width: 200, height: 200, margin: "0 auto" },
    `<svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="카테고리별 지출 비율 도넛 차트">${segs}</svg>`,
    D({ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, T({ fontSize: 13, fontWeight: 600, color: C.ink3 }, "총 지출"), T({ fontSize: 19, fontWeight: 800, fontVariantNumeric: "tabular-nums" }, won(STAT_TOTAL) + "원")));
}
const statRow = ([cat, amt, n]) => {
  const pct = (amt / STAT_TOTAL) * 100;
  return D({ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px" }, catIcon(cat, 40),
    D({ flex: 1, display: "flex", flexDirection: "column", gap: 6 },
      D({ display: "flex", justifyContent: "space-between", alignItems: "baseline" }, Sp({ fontSize: 15, fontWeight: 700 }, cat), Sp({ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }, won(amt) + "원")),
      D({ display: "flex", alignItems: "center", gap: 8 }, D({ flex: 1, height: 6, borderRadius: 3, background: C.seg }, D({ width: pct.toFixed(1) + "%", height: 6, borderRadius: 3, background: CAT[cat].c })), Sp({ fontSize: 12, fontWeight: 700, color: C.ink3, minWidth: 78, textAlign: "right" }, `${pct.toFixed(1)}% · ${n}건`))));
};
const N1 = () =>
  root([
    header("분석", { back: false, big: true }),
    monthSel("2026년 10월"),
    D({ padding: "12px 0 10px" }, donut()),
    D({ display: "flex", justifyContent: "center", marginBottom: 12 }, D({ display: "flex", alignItems: "center", gap: 6, background: C.warnSoft, color: C.warnText, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 700 }, I("LuTrendingUp", 16, C.warnText), `전월 대비 +${won(STAT_TOTAL - PREV_TOTAL)}원`)),
    D({ background: "#fff", borderRadius: 20, margin: "0 16px", padding: "6px 0" }, ...STATS.map(statRow)),
    tabbar("분석"),
  ]);

// ---------- N2 category detail ----------
const N2DATA = [
  ["10월 31일 토요일", [{ cat: "식비", title: "저녁 치킨", sub: "식비", amt: -18000 }, { cat: "식비", title: "점심 비빔밥", sub: "식비", amt: -9000 }]],
  ["10월 30일 금요일", [{ cat: "식비", title: "점심 순두부", sub: "식비", amt: -8500 }, { cat: "식비", title: "샌드위치", sub: "식비", amt: -4200 }]],
  ["10월 29일 목요일", [{ cat: "식비", title: "마트 장보기", sub: "한빛마트 경산점 · 식비", amt: -32400, receipt: true }]],
];
const N2 = () =>
  root([
    header("식비"),
    D({ background: "#fff", borderRadius: 20, margin: "4px 16px 12px", padding: 20 },
      T({ fontSize: 13, fontWeight: 600, color: C.ink3 }, "2026년 10월"),
      D({ display: "flex", alignItems: "baseline", gap: 4, margin: "4px 0 10px" }, T({ fontSize: 32, fontWeight: 800, fontVariantNumeric: "tabular-nums" }, won(412300)), T({ fontSize: 18, fontWeight: 700 }, "원")),
      D({ display: "flex", gap: 8, fontSize: 13, fontWeight: 700, color: C.ink2 }, Sp({ background: C.seg, borderRadius: 8, padding: "4px 8px" }, "전체 지출의 36.8%"), Sp({ background: C.seg, borderRadius: 8, padding: "4px 8px" }, "32건"))),
    ...N2DATA.map(([l, r]) => dayGroup(l, r)),
  ]);

// ---------- S1 settings ----------
const setRow = (label, { value = "", danger = false, icon = "", chevron = true } = {}) =>
  D({ display: "flex", alignItems: "center", gap: 10, height: 56, padding: "0 16px", borderBottom: `1px solid ${C.line}` },
    icon ? I(icon, 20, danger ? C.danger : C.ink2) : "",
    T({ flex: 1, fontSize: 16, fontWeight: 600, color: danger ? C.danger : C.ink }, label),
    value ? Sp({ fontSize: 15, color: C.ink3 }, value) : "", chevron ? I("LuChevronRight", 20, C.ink3) : "");
const group = (title, rows) => D({ margin: "0 16px 16px" }, T({ fontSize: 13, fontWeight: 800, color: C.ink2, margin: "0 4px 8px" }, title), D({ background: "#fff", borderRadius: 20, overflow: "hidden" }, ...rows));
const settingsBody = () => [
  header("설정", { back: false, big: true }),
  D({ margin: "4px 16px 16px", background: "#fff", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16 },
    D({ width: 56, height: 56, borderRadius: "50%", background: C.soft, color: C.primaryDark, fontSize: 22, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }, "잘"),
    D({ display: "flex", flexDirection: "column", gap: 2 }, T({ fontSize: 18, fontWeight: 800 }, "잘쓰는사람"), T({ fontSize: 14, color: C.ink3 }, "zalssm@example.com"))),
  group("계정", [setRow("닉네임 변경", { value: "잘쓰는사람" }), setRow("비밀번호 변경")]),
  group("정보", [setRow("앱 버전", { value: "1.0.0", chevron: false })]),
  group("계정 관리", [setRow("로그아웃", { icon: "LuLogOut", chevron: false }), setRow("회원 탈퇴", { icon: "LuTrash2", danger: true, chevron: false })]),
];
const S1 = () => root([...settingsBody(), tabbar("설정")]);

// ---------- S2 password ----------
const S2 = () =>
  root([
    header("비밀번호 변경"),
    D({ padding: "8px 24px", display: "flex", flexDirection: "column", gap: 18 },
      field({ label: "현재 비밀번호", value: "password1", type: "password", id: "pw-now" }),
      field({ label: "새 비밀번호", value: "newpass123", type: "password", id: "pw-new", helper: "8자 이상, 영문과 숫자 포함" }),
      field({ label: "새 비밀번호 확인", value: "newpass123", type: "password", id: "pw-new2" })),
    actionBar(btn("변경")),
  ], { bg: "#fff" });

// ---------- S3 dialogs ----------
const dialog = (kids) => D({ position: "absolute", left: 32, right: 32, top: 250, background: "#fff", borderRadius: 24, padding: 24, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 40px rgba(18,36,31,.25)" }, ...kids);
const S3a = () => root([...settingsBody(), tabbar("설정"), overlay(), dialog([
  T({ fontSize: 20, fontWeight: 800 }, "로그아웃하시겠습니까?"),
  D({ display: "flex", gap: 10, marginTop: 8 }, D({ flex: 1 }, btn("취소", { variant: "outline", h: 50 })), D({ flex: 1 }, btn("로그아웃", { h: 50 }))),
])]);
const S3b = () => root([...settingsBody(), tabbar("설정"), overlay(), dialog([
  T({ fontSize: 20, fontWeight: 800 }, "회원 탈퇴"),
  T({ fontSize: 14, color: C.ink2, lineHeight: 1.5 }, "모든 내역과 영수증 이미지가 삭제되며 복구할 수 없습니다."),
  field({ label: "비밀번호 확인", value: "", type: "password", id: "wd-pw" }),
  D({ display: "flex", gap: 10, marginTop: 8 }, D({ flex: 1 }, btn("취소", { variant: "outline", h: 50 })), D({ flex: 1 }, btn("탈퇴", { variant: "danger", h: 50 }))),
])]);

const SCREENS = [
  { id: "A1", file: "A1-login", title: "로그인", group: "인증", fn: A1, note: "회원가입 링크, 비밀번호 표시 토글" },
  { id: "A2", file: "A2-signup", title: "회원가입", group: "인증", fn: A2, note: "입력 오류 상태(비밀번호 불일치) 포함" },
  { id: "H1", file: "H1-home", title: "내역 (홈)", group: "내역", fn: H1, note: "월 요약, 날짜별 내역, 영수증 연결 아이콘" },
  { id: "H1e", file: "H1e-home-empty", title: "내역 (빈 상태)", group: "내역", fn: H1e, note: "첫 사용 상태" },
  { id: "H2", file: "H2-add-sheet", title: "내역 추가 시트", group: "내역", fn: H2, note: "+ 버튼으로 열림" },
  { id: "H3", file: "H3-add-form", title: "직접 입력", group: "내역", fn: H3, note: "지출/수입 전환, 카테고리 선택" },
  { id: "H4", file: "H4-edit-form", title: "내역 수정", group: "내역", fn: H4, note: "영수증 연결 내역: 영수증 보기, 삭제" },
  { id: "O1", file: "O1-scan-guide", title: "영수증 촬영 안내", group: "영수증 스캔", fn: O1, note: "촬영하기는 OS 카메라 호출(파일 입력)" },
  { id: "O2", file: "O2-scan-progress", title: "분석 중", group: "영수증 스캔", fn: O2, note: "3단계 진행 표시, 취소 가능" },
  { id: "O3", file: "O3-scan-result", title: "인식 결과 (일치)", group: "영수증 스캔", fn: O3, note: "수정 후 일괄 저장" },
  { id: "O3b", file: "O3b-scan-result-mismatch", title: "인식 결과 (합계 불일치)", group: "영수증 스캔", fn: O3b, note: "경고만 표시, 저장은 허용" },
  { id: "O4", file: "O4-item-edit-sheet", title: "품목 수정 시트", group: "영수증 스캔", fn: O4, note: "품목명·금액·카테고리 수정, 삭제" },
  { id: "O5", file: "O5-scan-failed", title: "인식 실패", group: "영수증 스캔", fn: O5, note: "다시 촬영 또는 직접 입력" },
  { id: "N1", file: "N1-stats", title: "분석", group: "분석", fn: N1, note: "월별 카테고리 비율, 전월 대비" },
  { id: "N2", file: "N2-stats-category", title: "카테고리 상세", group: "분석", fn: N2, note: "분석 행을 눌러 진입" },
  { id: "S1", file: "S1-settings", title: "설정", group: "설정", fn: S1, note: "계정 관리" },
  { id: "S2", file: "S2-password", title: "비밀번호 변경", group: "설정", fn: S2, note: "닉네임 변경도 같은 패턴" },
  { id: "S3a", file: "S3a-logout-dialog", title: "로그아웃 확인", group: "설정", fn: S3a, note: "" },
  { id: "S3b", file: "S3b-withdraw-dialog", title: "회원 탈퇴 확인", group: "설정", fn: S3b, note: "비밀번호 재확인" },
];

// ---------- design system board ----------
function designSystem() {
  const sw = (name, hex, fg = "#fff", note = "") => D({ width: 150, display: "flex", flexDirection: "column", gap: 6 }, D({ height: 64, borderRadius: 14, background: hex, border: `1px solid ${C.line}`, color: fg, padding: 10, boxSizing: "border-box", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "flex-end" }, hex), T({ fontSize: 13, fontWeight: 700 }, name), note ? T({ fontSize: 12, color: C.ink3, marginTop: -4 }, note) : "");
  const sec = (title, ...kids) => D({ display: "flex", flexDirection: "column", gap: 14 }, T({ fontSize: 20, fontWeight: 800 }, title), ...kids);
  const row = (...k) => D({ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }, ...k);
  return D({ width: 1280, height: 1660, boxSizing: "border-box", background: "#fff", padding: 56, fontFamily: L.FONT, color: C.ink, display: "flex", flexDirection: "column", gap: 40 },
    D({ display: "flex", alignItems: "center", gap: 20 }, mark(72, C.primary, "#fff"), D({}, T({ fontSize: 40, fontWeight: 800 }, "잘씀 ZALSSM"), T({ fontSize: 16, color: C.ink2, marginTop: 4 }, "모바일 디자인 시스템 v1 · 영수증으로 기록하는 가계부"))),
    sec("색상", row(sw("Primary", C.primary, "#fff", "버튼, 활성 탭, 링크"), sw("Primary Dark", C.primaryDark, "#fff", "눌림, 강조 텍스트"), sw("Primary Soft", C.soft, C.ink, "선택 배경, 안내"), sw("Mint", C.mint, C.ink, "어두운 카드 위 강조"), sw("Deep", C.deep, "#fff", "요약 카드"), sw("Danger", C.danger, "#fff", "삭제, 오류"), sw("Warn", C.warnSoft, C.warnText, "경고 배경 / 글자 " + C.warnText)),
      row(sw("Ink", C.ink, "#fff", "본문"), sw("Ink 2", C.ink2, "#fff", "보조 본문"), sw("Ink 3", C.ink3, "#fff", "설명, 비활성"), sw("Line", C.line, C.ink, "구분선, 테두리"), sw("Background", C.bg, C.ink, "화면 배경"), sw("Card", "#FFFFFF", C.ink, "카드"))),
    sec("카테고리 (아이콘색 / 배경 14%)", row(...EXPENSE_CATS.map((c) => D({ width: 112, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0", border: `1px solid ${C.line}`, borderRadius: 16 }, catIcon(c, 48), T({ fontSize: 14, fontWeight: 700 }, c), T({ fontSize: 12, color: C.ink3 }, CAT[c].c)))), row(...["급여", "용돈", "기타수입"].map((c) => D({ width: 128, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0", border: `1px solid ${C.line}`, borderRadius: 16 }, catIcon(c, 48), T({ fontSize: 14, fontWeight: 700 }, c), T({ fontSize: 12, color: C.ink3 }, "수입 공통"))))),
    sec("타이포그래피 (Pretendard, 대체: Noto Sans KR, 맑은 고딕)", row(
      D({ width: 260 }, T({ fontSize: 34, fontWeight: 800 }, "1,284,500원"), T({ fontSize: 12, color: C.ink3 }, "금액 강조 34 / 800, 숫자 폭 고정")),
      D({ width: 260 }, T({ fontSize: 24, fontWeight: 800 }, "화면 제목"), T({ fontSize: 12, color: C.ink3 }, "제목 24 / 800 (탭 화면), 18 / 700 (서브 화면)")),
      D({ width: 260 }, T({ fontSize: 15, fontWeight: 600 }, "내역 항목 이름"), T({ fontSize: 12, color: C.ink3 }, "본문 15 / 600, 보조 13 / 500")),
      D({ width: 260 }, T({ fontSize: 13, fontWeight: 700, color: C.ink2 }, "입력 라벨"), T({ fontSize: 12, color: C.ink3 }, "라벨·캡션 13 / 700, 최소 12")))),
    sec("컴포넌트", row(D({ width: 220 }, btn("기본 버튼")), D({ width: 220 }, btn("보조 버튼", { variant: "soft" })), D({ width: 220 }, btn("외곽 버튼", { variant: "outline" })), D({ width: 220 }, btn("삭제", { variant: "danger" })), D({ width: 220 }, btn("비활성", { variant: "disabled" }))),
      row(D({ width: 300 }, field({ label: "기본", value: "zalssm@example.com", id: "ds1" })), D({ width: 300 }, field({ label: "오류", value: "password2", type: "password", id: "ds2", error: "비밀번호가 일치하지 않습니다" })), D({ width: 300 }, seg(["전체", "지출", "수입"], 1)), D({}, catChip("식비"))),
      row(D({ width: 360, background: C.bg, padding: 12, borderRadius: 20 }, dayGroup("11월 3일 화요일", HOME[0][1].slice(0, 2))))),
    sec("규칙", T({ fontSize: 15, lineHeight: 1.7, color: C.ink2 }, "모서리: 카드 20, 버튼 16, 입력 14, 칩 완전 원형 · 간격: 8 단위(화면 좌우 20, 카드 사이 12) · 최소 터치 영역 44 · 아이콘: Lucide 선형 2px · 금액: 지출은 ink, 수입은 primary, 할인(지출 감소)은 + 표시 · 문구: 합니다체 또는 명사형, 짧게. 설명은 글보다 시각 요소로.")));
}

module.exports = { SCREENS, designSystem, EXP, INC };
