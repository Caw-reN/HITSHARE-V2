import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

export default function AdminRevenueChart({ trendLast7Days = [], trendLast30Days = [] }) {
  const [timeframe, setTimeframe] = useState('30d'); // '7d' | '30d'
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  const activeData = useMemo(() => {
    if (timeframe === '7d') {
      return trendLast7Days && trendLast7Days.length > 0 ? trendLast7Days : [];
    }
    return trendLast30Days && trendLast30Days.length > 0 ? trendLast30Days : [];
  }, [timeframe, trendLast7Days, trendLast30Days]);

  // Aggregate stats for chosen timeframe
  const summary = useMemo(() => {
    if (!activeData || activeData.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, maxDayRevenue: 0, avgDailyRevenue: 0 };
    }
    const totalRev = activeData.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
    const totalOrd = activeData.reduce((sum, d) => sum + Number(d.count || 0), 0);
    const maxRev = Math.max(...activeData.map((d) => Number(d.revenue || 0)), 0);
    const avgRev = Math.round(totalRev / activeData.length);
    return {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      maxDayRevenue: maxRev,
      avgDailyRevenue: avgRev,
    };
  }, [activeData]);

  // Chart coordinate calculation
  const svgWidth = 800;
  const svgHeight = 220;
  const padTop = 25;
  const padBottom = 30;
  const padLeft = 10;
  const padRight = 10;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartWidth = svgWidth - padLeft - padRight;

  const maxVal = useMemo(() => {
    const rawMax = Math.max(...(activeData.map((d) => Number(d.revenue || 0))), 100000);
    // Add 15% headroom
    return Math.ceil(rawMax * 1.15);
  }, [activeData]);

  const points = useMemo(() => {
    if (activeData.length === 0) return [];
    const len = activeData.length;
    return activeData.map((d, i) => {
      const x = padLeft + (len === 1 ? chartWidth / 2 : (i / (len - 1)) * chartWidth);
      const val = Number(d.revenue || 0);
      const y = padTop + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, data: d, index: i };
    });
  }, [activeData, maxVal, chartWidth, chartHeight, padLeft, padTop]);

  // Generate smooth cubic bezier SVG path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y}`,
        areaPath: `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y} L ${p.x + 10} ${svgHeight - padBottom} L ${p.x - 10} ${svgHeight - padBottom} Z`,
      };
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const baselineY = svgHeight - padBottom;
    const area = `${d} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return { linePath: d, areaPath: area };
  }, [points, svgHeight, padBottom]);

  // Handle mouse move for interactive tooltip
  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const rawIndex = Math.round(pct * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, rawIndex)));
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E8DF] shadow-bone space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                Tren Pendapatan & Penjualan
              </h3>
              <p className="text-xs text-neutral-400 font-medium">
                Grafik omset harian pesanan sukses dengan filter waktu
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center bg-[#F2F2EC] p-1 rounded-2xl self-start sm:self-auto border border-[#E4E4DC]">
          <button
            type="button"
            onClick={() => {
              setTimeframe('7d');
              setHoverIndex(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeframe === '7d'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => {
              setTimeframe('30d');
              setHoverIndex(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeframe === '30d'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#EFEFE8]">
        <div>
          <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Total Omset Periode
          </span>
          <div className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Rp {summary.totalRevenue.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Transaksi Sukses
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-600 tracking-tight">
            {summary.totalOrders} <span className="text-xs font-medium text-neutral-400">order</span>
          </div>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Rata-rata Harian
          </span>
          <div className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Rp {summary.avgDailyRevenue.toLocaleString('id-ID')}
          </div>
        </div>
        <div>
          <span className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Puncak Tertinggi
          </span>
          <div className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Rp {summary.maxDayRevenue.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className="relative pt-2">
        {/* Floating Tooltip when hovering */}
        {activePoint && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 ease-out -top-2"
            style={{
              left: `${Math.max(12, Math.min(88, (activePoint.index / (points.length - 1 || 1)) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-neutral-900 text-white rounded-2xl p-2.5 shadow-xl border border-neutral-700 min-w-[150px] text-center space-y-0.5">
              <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                {activePoint.data.date ? new Date(activePoint.data.date).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : activePoint.data.label}
              </div>
              <div className="text-sm font-black text-emerald-400">
                Rp {Number(activePoint.data.revenue || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-neutral-300 font-medium">
                {activePoint.data.count || 0} transaksi berhasil
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          className="relative w-full overflow-hidden select-none cursor-crosshair touch-pan-x"
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-48 sm:h-64 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Smooth Green/Neutral Gradient for Area Fill */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>

              {/* Line subtle drop shadow */}
              <filter id="lineShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#059669" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((pct, idx) => {
              const y = padTop + chartHeight * (1 - pct);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#EFEFE8"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft + 4}
                    y={y - 4}
                    fill="#A3A39A"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    Rp {Math.round((maxVal * pct) / 1000).toLocaleString('id-ID')}k
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                className="transition-all duration-300"
              />
            )}

            {/* Curved Stroke Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#lineShadow)"
                className="transition-all duration-300"
              />
            )}

            {/* Hover Crosshair & Indicator Point */}
            {activePoint && (
              <g className="transition-all duration-100">
                {/* Vertical dashed line */}
                <line
                  x1={activePoint.x}
                  y1={padTop}
                  x2={activePoint.x}
                  y2={svgHeight - padBottom}
                  stroke="#171717"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />

                {/* Outer Glow Ring */}
                <circle
                  cx={activePoint.x}
                  y={activePoint.y}
                  r="7"
                  fill="#10B981"
                  opacity="0.3"
                  className="animate-ping"
                />
                {/* Middle Ring */}
                <circle
                  cx={activePoint.x}
                  y={activePoint.y}
                  r="5"
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
                {/* Center Core */}
                <circle
                  cx={activePoint.x}
                  y={activePoint.y}
                  r="2"
                  fill="#065F46"
                />
              </g>
            )}
          </svg>
        </div>

        {/* X-Axis Date Labels */}
        <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 pt-2 px-1 border-t border-[#F0F0E8]">
          {timeframe === '7d' ? (
            activeData.map((d, i) => (
              <span
                key={d.date || i}
                className={i === activeData.length - 1 ? 'text-neutral-900 font-extrabold' : ''}
              >
                {i === activeData.length - 1 ? 'Hari Ini' : d.label}
              </span>
            ))
          ) : (
            // For 30 days: show 6 evenly spaced date markers
            [0, 6, 12, 18, 24, 29].map((idx) => {
              const item = activeData[idx];
              if (!item) return null;
              const isLast = idx === activeData.length - 1;
              return (
                <span
                  key={item.date || idx}
                  className={isLast ? 'text-neutral-900 font-extrabold' : ''}
                >
                  {isLast ? 'Hari Ini' : item.label}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
