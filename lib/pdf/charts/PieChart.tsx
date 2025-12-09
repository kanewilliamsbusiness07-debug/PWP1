import React from 'react';
import { Svg, G, Path, Text as SvgText } from '@react-pdf/renderer';

interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieSlice[];
  width?: number;
  height?: number;
  innerRadius?: number; // for donut
}

export const PieChart: React.FC<PieChartProps> = ({ data = [], width = 320, height = 240, innerRadius = 60 }) => {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;

  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const portion = d.value / total;
    const next = angle + portion * Math.PI * 2;
    const x1 = cx + radius * Math.cos(angle);
    const y1 = cy + radius * Math.sin(angle);
    const x2 = cx + radius * Math.cos(next);
    const y2 = cy + radius * Math.sin(next);
    const large = portion > 0.5 ? 1 : 0;
    const dAttr = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} z`;
    angle = next;
    return { path: dAttr, color: d.color || '#3498db', label: d.label, value: d.value };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} stroke="#ffffff" strokeWidth={1} />
        ))}

        {/* inner circle for donut */}
        {innerRadius > 0 && (
          <Path d={`M ${cx} ${cy} m -${innerRadius},0 a ${innerRadius},${innerRadius} 0 1,0 ${innerRadius * 2},0 a ${innerRadius},${innerRadius} 0 1,0 -${innerRadius * 2},0`} fill="#ffffff" />
        )}
      </G>
    </Svg>
  );
};

export default PieChart;
