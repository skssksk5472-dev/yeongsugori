// 영수증 그림 — 아래가 톱니 모양인 흰 영수증. 로그인(A1), 빈 내역(H1e) 화면에 쓴다. 시안(design/_src/lib.js receiptSvg)과 같은 계산

type Props = {
  width: number;
  height: number;
  stamp?: boolean; // 초록 체크 도장
  rows?: number; // 품목 줄 수
  label: string;
};

// 위쪽 모서리는 둥글게, 아래는 10px 간격 톱니
function outline(width: number, height: number): string {
  const tooth = 10;
  const count = Math.floor(width / tooth);
  const step = width / count;
  let path = `M0 14 Q0 0 14 0 H${width - 14} Q${width} 0 ${width} 14 V${height - tooth}`;
  for (let i = 0; i < count; i++) {
    path += ` L${(width - i * step - step / 2).toFixed(1)} ${height} L${(width - (i + 1) * step).toFixed(1)} ${height - tooth}`;
  }
  return `${path} Z`;
}

export function ReceiptIllustration({ width, height, stamp = true, rows = 6, label }: Props) {
  const gap = (height - 112) / rows;
  const totalY = height - 62;
  const stampX = width * 0.74;
  const stampY = height * 0.5;
  const stampR = width * 0.16;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ display: 'block' }}>
      <path d={outline(width, height)} fill="#fff" stroke="var(--line)" strokeWidth={1.5} />
      <rect x={width * 0.22} y={18} width={width * 0.56} height={9} rx={4.5} fill="var(--ink)" />
      {Array.from({ length: rows }, (_, row) => {
        const y = 44 + row * gap;
        const lineWidth = width * (0.3 + ((row * 37) % 20) / 100);
        return (
          <g key={row}>
            <rect x={width * 0.12} y={y} width={lineWidth} height={6} rx={3} fill="var(--line)" />
            <rect x={width * 0.76} y={y} width={width * 0.12} height={6} rx={3} fill="var(--line)" />
          </g>
        );
      })}
      <line x1={width * 0.12} x2={width * 0.88} y1={totalY} y2={totalY} stroke="var(--line)" strokeWidth={2} strokeDasharray="4 4" />
      <rect x={width * 0.12} y={totalY + 14} width={width * 0.3} height={8} rx={4} fill="var(--ink)" />
      <rect x={width * 0.58} y={totalY + 14} width={width * 0.3} height={8} rx={4} fill="var(--primary)" />
      {stamp && (
        <>
          <circle cx={stampX} cy={stampY} r={stampR} fill="var(--primary)" />
          <path
            d={`M${stampX - stampR * 0.45} ${stampY} L${stampX - stampR * 0.1} ${stampY + stampR * 0.38} L${stampX + stampR * 0.5} ${stampY - stampR * 0.35}`}
            fill="none" stroke="#fff" strokeWidth={stampR * 0.28} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
