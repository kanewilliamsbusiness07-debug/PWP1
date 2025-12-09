import React from 'react';
import { Svg, G, Path, Rect, Circle, Text as SvgText } from '@react-pdf/renderer';

interface LineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  padding?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data = [], width = 520, height = 300, color = '#3498db', padding = 40 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * w;
    const y = padding + (1 - (d - min) / Math.max(1, max - min)) * h;
    return [x, y];
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `${acc} L ${p[0]} ${p[1]}`), '');

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      <G>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
          <Path key={idx} d={`M ${padding} ${padding + t * h} L ${padding + w} ${padding + t * h}`} stroke="#e0e0e0" strokeWidth={1} />
        ))}

        {/* line */}
        <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" />

        {/* points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p[0]} cy={p[1]} r={3} fill={color} />
        ))}
      </G>
    </Svg>
  );
};

export default LineChart;
