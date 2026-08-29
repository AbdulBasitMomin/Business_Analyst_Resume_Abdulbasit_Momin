/**
 * Cover artwork for the work cards.
 *
 * The reference fills these with photography. There is no photography to use
 * here, and hotlinking someone else's is how the last version of this page
 * broke, so each cover is drawn instead -- and drawn as the artefact the
 * project actually produced rather than as decoration: a segmentation map, a
 * dashboard, a traceability matrix.
 *
 * Pure SVG, no assets, scales to any card size.
 */

const STROKE = 'rgba(255,255,255,0.22)';
const FILL = 'rgba(255,255,255,0.06)';

function Grid() {
  return (
    <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="300" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} />
      ))}
    </g>
  );
}

/** Personas clustering into segments: the consumer data platform. */
function Segmentation() {
  const clusters = [
    { cx: 110, cy: 150, r: 62, n: 7 },
    { cx: 245, cy: 108, r: 46, n: 5 },
    { cx: 268, cy: 208, r: 38, n: 4 },
  ];
  return (
    <>
      <Grid />
      {clusters.map((c, ci) => (
        <g key={ci}>
          <circle cx={c.cx} cy={c.cy} r={c.r} fill={FILL} stroke={STROKE} strokeDasharray="3 4" />
          {Array.from({ length: c.n }, (_, i) => {
            const a = (i / c.n) * Math.PI * 2 + ci;
            const rr = c.r * 0.58;
            return (
              <circle
                key={i}
                cx={c.cx + Math.cos(a) * rr}
                cy={c.cy + Math.sin(a) * rr}
                r="4.5"
                fill="rgba(255,255,255,0.55)"
              />
            );
          })}
        </g>
      ))}
      <path d="M110 150 L245 108 M245 108 L268 208 M110 150 L268 208" stroke={STROKE} strokeWidth="1" fill="none" />
    </>
  );
}

/** Bars, a trend and three tiles: the leadership reporting suite. */
function Dashboard() {
  const bars = [0.42, 0.68, 0.3, 0.86, 0.55, 0.74, 0.4, 0.62];
  return (
    <>
      <Grid />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={28 + i * 118} y="34" width="106" height="42" rx="2" fill={FILL} stroke={STROKE} />
      ))}
      <line x1="28" y1="252" x2="372" y2="252" stroke={STROKE} />
      {bars.map((v, i) => (
        <rect
          key={i}
          x={34 + i * 42}
          y={252 - v * 138}
          width="26"
          height={v * 138}
          fill="rgba(255,255,255,0.16)"
          stroke={STROKE}
        />
      ))}
      <path
        d={bars.map((v, i) => `${i ? 'L' : 'M'}${47 + i * 42} ${240 - v * 120}`).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
      />
    </>
  );
}

/** Requirements down the side, tests across the top, coverage in the cells. */
function TraceMatrix() {
  const cells = [
    [1, 1, 0, 1, 1],
    [1, 0, 1, 1, 0],
    [1, 1, 1, 0, 1],
    [0, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
  ];
  return (
    <>
      <Grid />
      {cells.map((row, r) =>
        row.map((on, c) => (
          <g key={`${r}-${c}`}>
            <rect x={96 + c * 44} y={62 + r * 34} width="36" height="26" rx="2" fill={on ? 'rgba(255,255,255,0.18)' : 'transparent'} stroke={STROKE} />
            {on ? (
              <path
                d={`M${102 + c * 44} ${75 + r * 34} l5 5 l9 -11`}
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : null}
          </g>
        )),
      )}
      {cells.map((_, r) => (
        <rect key={r} x="28" y={62 + r * 34} width="54" height="26" rx="2" fill={FILL} stroke={STROKE} />
      ))}
      {[0, 1, 2, 3, 4].map((c) => (
        <line key={c} x1={114 + c * 44} y1="42" x2={114 + c * 44} y2="56" stroke={STROKE} strokeWidth="2" />
      ))}
    </>
  );
}

const COVERS = [Segmentation, Dashboard, TraceMatrix];

export function Cover({ index, className = '' }: { index: number; className?: string }) {
  const Art = COVERS[index % COVERS.length];
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <rect width="400" height="300" fill="hsl(var(--surface))" />
      <Art />
    </svg>
  );
}

/** A small mark for a deliverable card: rows of a document, ticked. */
export function DeliverableMark({ seed }: { seed: number }) {
  const rows = 5 + (seed % 3);
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true" role="presentation">
      <rect width="120" height="120" fill="hsl(var(--surface))" />
      <rect x="26" y="18" width="68" height="84" rx="2" fill={FILL} stroke={STROKE} />
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={i}
          x1="36"
          y1={36 + i * 12}
          x2={36 + 48 * (i % 3 === 2 ? 0.6 : 1)}
          y2={36 + i * 12}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="2"
        />
      ))}
      <circle cx="88" cy="94" r="13" fill="hsl(var(--bg))" stroke={STROKE} />
      <path d="M82 94 l4 4 l8 -9" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
