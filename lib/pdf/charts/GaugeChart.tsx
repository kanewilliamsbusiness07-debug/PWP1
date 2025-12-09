import React from 'react';
import { Svg, G, Path, Circle, Text as SvgText } from '@react-pdf/renderer';

interface GaugeChartProps {
  value: number; // 0..1
  width?: number;
  height?: number;
  color?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value = 0, width = 320, height = 160, color = '#27ae60' }) => {
  const cx = width / 2;
  const cy = height;
  const radius = Math.min(width / 2 - 10, height - 10);
  const start = Math.PI;
  const end = Math.PI * 2;
  const angle = start + (end - start) * Math.max(0, Math.min(1, value));
  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(angle);
  const y2 = cy + radius * Math.sin(angle);
  const large = value > 0.5 ? 1 : 0;
  const arc = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {/* background arc */}
        <Path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`} stroke="#e0e0e0" strokeWidth={12} fill="none" />
        {/* value arc */}
        <Path d={arc} stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" />
        {/* center label */}
        <SvgText style={{ fontSize: 14, fill: '#333', textAlign: 'center' }} x={cx} y={cy - radius / 2}>
          {(value * 100).toFixed(0)}%
        </SvgText>
      </G>
    </Svg>
  );
};

export default GaugeChart;
