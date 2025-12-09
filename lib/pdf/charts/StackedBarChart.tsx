import React from 'react';
import { Svg, Rect, G, Text as SvgText } from '@react-pdf/renderer';

interface Series {
  label: string;
  value: number;
  color?: string;
}

interface StackedBarChartProps {
  data: Series[];
  width?: number;
  height?: number;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data = [], width = 520, height = 80 }) => {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  let offset = 0;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {data.map((d, i) => {
          const w = (Math.max(0, d.value) / total) * width;
          const rect = (
            <Rect key={i} x={offset} y={0} width={w} height={height} fill={d.color || '#3498db'} />
          );
          offset += w;
          return rect;
        })}
      </G>
    </Svg>
  );
};

export default StackedBarChart;
