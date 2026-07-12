import { useState } from 'react';
import { money, formatDate } from '../lib/format';

const WIDTH = 900;
const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 24, left: 56 };

// rounds a max value up to a "clean" gridline value (1/2/5 x 10^n)
function niceCeil(value) {
  if (value <= 0) return 10;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}

function roundedTopRectPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, Math.max(h, 0));
  if (h <= 0) return '';
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export default function RevenueTrendChart({ data, unitLabel = 'order' }) {
  const [hover, setHover] = useState(null); // index into data

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const max = niceCeil(Math.max(...data.map((d) => d.revenue), 0));
  const colW = plotW / data.length;
  const barW = Math.max(2, Math.min(24, colW - 2));

  const yFor = (v) => PAD.top + plotH - (v / max) * plotH;
  const gridValues = [0, max / 2, max];

  const hovered = hover != null ? data[hover] : null;
  const hoveredX = hover != null ? PAD.left + hover * colW + colW / 2 : 0;
  // clamp so the (roughly fixed-width) tooltip never spills past the chart edges
  const tooltipPct = Math.min(88, Math.max(12, (hoveredX / WIDTH) * 100));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto block" preserveAspectRatio="xMidYMid meet">
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(v)} y2={yFor(v)}
              stroke="#e1e0d9" strokeWidth="1"
            />
            <text x={PAD.left - 8} y={yFor(v)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#898781">
              {v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : Math.round(v)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + i * colW + (colW - barW) / 2;
          const h = (d.revenue / max) * plotH;
          const y = PAD.top + plotH - h;
          const isHover = hover === i;
          return (
            <g key={d.day}>
              {/* full-column hit target, wider than the visible bar */}
              <rect
                x={PAD.left + i * colW} y={PAD.top} width={colW} height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
              />
              <path
                d={roundedTopRectPath(x, y, barW, h, 3)}
                fill={isHover ? '#d4b878' : '#b8933e'}
                pointerEvents="none"
              />
            </g>
          );
        })}

        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="#c3c2b7" strokeWidth="1" />

        {/* a handful of date ticks so the axis stays readable */}
        {data.map((d, i) => (
          i % 5 === 0 ? (
            <text
              key={d.day}
              x={PAD.left + i * colW + colW / 2}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#898781"
            >
              {formatDate(d.day).replace(/^(\d+)\w{2} /, '$1 ')}
            </text>
          ) : null
        ))}
      </svg>

      {hovered && (
        <div
          className="absolute top-1 -translate-x-1/2 bg-ink text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg whitespace-nowrap"
          style={{ left: `${tooltipPct}%` }}
        >
          <p className="font-semibold">GHS {money(hovered.revenue)}</p>
          <p className="text-white/60">{formatDate(hovered.day)} · {hovered.orders} {unitLabel}{hovered.orders === 1 ? '' : 's'}</p>
        </div>
      )}
    </div>
  );
}
