import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// n8n風のベジエ接続線 + 流れるデータパケット
// 横方向にも縦方向にも対応 (from/to の差分で自動判定)
type Point = { x: number; y: number };

const buildBezierPath = (from: Point, to: Point): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);

  let cp1: Point;
  let cp2: Point;
  if (horizontal) {
    cp1 = { x: from.x + dx * 0.5, y: from.y };
    cp2 = { x: to.x - dx * 0.5, y: to.y };
  } else {
    cp1 = { x: from.x, y: from.y + dy * 0.5 };
    cp2 = { x: to.x, y: to.y - dy * 0.5 };
  }
  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
};

const bezierPoint = (from: Point, to: Point, t: number): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);

  let cp1: Point;
  let cp2: Point;
  if (horizontal) {
    cp1 = { x: from.x + dx * 0.5, y: from.y };
    cp2 = { x: to.x - dx * 0.5, y: to.y };
  } else {
    cp1 = { x: from.x, y: from.y + dy * 0.5 };
    cp2 = { x: to.x, y: to.y - dy * 0.5 };
  }
  const u = 1 - t;
  const x =
    u * u * u * from.x +
    3 * u * u * t * cp1.x +
    3 * u * t * t * cp2.x +
    t * t * t * to.x;
  const y =
    u * u * u * from.y +
    3 * u * u * t * cp1.y +
    3 * u * t * t * cp2.y +
    t * t * t * to.y;
  return { x, y };
};

export const Connection: React.FC<{
  from: Point;
  to: Point;
  appearFrame?: number;
  activeFrame?: number;
  activeDuration?: number;
  packetCount?: number;
}> = ({
  from,
  to,
  appearFrame = 0,
  activeFrame = -1,
  activeDuration = 25,
  packetCount = 1,
}) => {
  const frame = useCurrentFrame();
  const path = buildBezierPath(from, to);

  const appearProgress = interpolate(frame - appearFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isActive =
    activeFrame >= 0 && frame >= activeFrame && frame < activeFrame + activeDuration + 10;
  const isDone = activeFrame >= 0 && frame >= activeFrame + activeDuration;

  const strokeColor = isActive
    ? "#ff6d5a"
    : isDone
    ? "rgba(74, 222, 128, 0.5)"
    : "rgba(255,255,255,0.18)";
  const strokeWidth = isActive ? 2.5 : 2;

  const packets: { t: number; opacity: number }[] = [];
  if (isActive) {
    for (let i = 0; i < packetCount; i++) {
      const offset = i * (activeDuration / (packetCount + 1));
      const localFrame = frame - activeFrame - offset;
      if (localFrame >= 0 && localFrame <= activeDuration) {
        const t = localFrame / activeDuration;
        const opacity = interpolate(t, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
        packets.push({ t, opacity });
      }
    }
  }

  return (
    <>
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={appearProgress < 1 ? "1500" : "none"}
        strokeDashoffset={appearProgress < 1 ? (1 - appearProgress) * 1500 : 0}
      />

      {isActive && (
        <path
          d={path}
          stroke="#ff6d5a"
          strokeWidth={6}
          fill="none"
          opacity={0.25}
          style={{ filter: "blur(4px)" }}
        />
      )}

      {packets.map((p, i) => {
        const pos = bezierPoint(from, to, p.t);
        return (
          <g key={i}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={12}
              fill="#ff6d5a"
              opacity={p.opacity * 0.3}
              style={{ filter: "blur(8px)" }}
            />
            <circle cx={pos.x} cy={pos.y} r={5} fill="#ff6d5a" opacity={p.opacity} />
            <circle cx={pos.x} cy={pos.y} r={2.5} fill="#fff" opacity={p.opacity} />
          </g>
        );
      })}
    </>
  );
};
