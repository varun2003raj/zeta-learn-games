import React, { memo, useId } from "react";

const VIEWBOX_WIDTH = 1400;
const VIEWBOX_HEIGHT = 900;
const WIRE_WIDTH = 8;
const HIGHLIGHT_WIDTH = 2.4;
const OPEN_PAD_RADIUS = 10;
const FILLED_PAD_RADIUS = 8;

const TRACE_PATHS = [
  "M 0 210 H 420 L 600 50 H 840 H 1030",
  "M 700 50 V 110 H 760",
  "M 0 315 H 430 L 560 190 H 735",
  "M 560 190 V 280 H 690 L 740 330",
  "M 0 410 H 600 L 660 470 H 760 H 910",
  "M 0 445 H 520 L 640 570 H 820 H 1030",
  "M 640 570 V 520 H 770",
  "M 0 540 H 120 L 210 620 H 300",
  "M 150 445 L 310 585 H 420",
  "M 0 640 H 210 L 320 745 H 520",
  "M 0 735 H 110 L 220 845 H 420",
  "M 500 745 L 600 650 H 760",
];

const OPEN_PADS = [
  [1030, 50],
  [760, 110],
  [735, 190],
  [1030, 570],
  [300, 620],
  [420, 845],
  [760, 650],
];

const FILLED_PADS = [
  [740, 330],
  [910, 470],
  [770, 520],
  [420, 585],
  [520, 745],
];

const layerStyle = {
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: -1,
  pointerEvents: "none",
  overflow: "hidden",
};

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  filter: "blur(1.2px)",
  transform: "scale(1.01)",
  transformOrigin: "center center",
};

const CircuitBoardBackground = memo(function CircuitBoardBackground({ className = "", style }) {
  const uid = useId().replace(/:/g, "");
  const wireGradId = `wire-grad-${uid}`;
  const flowClass = `wire-flow-${uid}`;
  const wireClass = `wire-main-${uid}`;
  const padOpenClass = `wire-open-pads-${uid}`;
  const padFillClass = `wire-fill-pads-${uid}`;
  const bgClass = `wire-bg-${uid}`;
  const animName = `wireRun-${uid}`;

  return (
    <div className={className} style={{ ...layerStyle, ...style }} aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMinYMid slice"
        style={svgStyle}
      >
        <defs>
          <linearGradient id={wireGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--circuit-wire-0, #fff9d5)" }} />
            <stop offset="22%" style={{ stopColor: "var(--circuit-wire-1, #ffe27a)" }} />
            <stop offset="52%" style={{ stopColor: "var(--circuit-wire-2, #facc15)" }} />
            <stop offset="100%" style={{ stopColor: "var(--circuit-wire-3, #af820a)" }} />
          </linearGradient>
        </defs>

        <rect
          className={bgClass}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          fill="var(--circuit-bg, #000000)"
        />

        <g
          className={wireClass}
          fill="none"
          stroke={`url(#${wireGradId})`}
          strokeWidth={WIRE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
        >
          {TRACE_PATHS.map((d, idx) => (
            <path key={`wire-${idx}`} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        <g
          className={flowClass}
          fill="none"
          stroke="var(--circuit-flow, #fff9d9)"
          strokeWidth={HIGHLIGHT_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
        >
          {TRACE_PATHS.map((d, idx) => (
            <path key={`flow-${idx}`} d={d} vectorEffect="non-scaling-stroke" style={{ animationDelay: `-${idx * 0.52}s` }} />
          ))}
        </g>

        <g
          className={padOpenClass}
          fill="none"
          stroke="var(--circuit-pad, #ffd45d)"
          strokeWidth={WIRE_WIDTH}
          shapeRendering="geometricPrecision"
        >
          {OPEN_PADS.map(([x, y], idx) => (
            <circle key={`open-${idx}`} cx={x} cy={y} r={OPEN_PAD_RADIUS} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        <g className={padFillClass} fill="var(--circuit-pad-fill, #ffd45d)" shapeRendering="geometricPrecision">
          {FILLED_PADS.map(([x, y], idx) => (
            <circle key={`filled-${idx}`} cx={x} cy={y} r={FILLED_PAD_RADIUS} />
          ))}
        </g>
      </svg>

      <style>{`
        .${bgClass},
        .${wireClass} path,
        .${flowClass} path,
        .${padOpenClass} circle,
        .${padFillClass} circle {
          transition:
            fill var(--public-theme-transition-ms, 1200ms) var(--public-theme-transition-ease, cubic-bezier(0.22, 1, 0.36, 1)),
            stroke var(--public-theme-transition-ms, 1200ms) var(--public-theme-transition-ease, cubic-bezier(0.22, 1, 0.36, 1)),
            opacity var(--public-theme-transition-ms, 1200ms) var(--public-theme-transition-ease, cubic-bezier(0.22, 1, 0.36, 1));
        }
        .${flowClass} path {
          stroke-dasharray: 40 260;
          stroke-dashoffset: 0;
          animation: ${animName} 8.2s linear infinite;
        }
        @keyframes ${animName} {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -620; }
        }
      `}</style>
    </div>
  );
});

export default CircuitBoardBackground;
