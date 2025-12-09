import React from 'react';
import { Svg, Rect, G, Path, Text as SvgText } from '@react-pdf/renderer';

interface WaterfallItem {
  label: string;
  value: number;
  color?: string;
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  width?: number;
  height?: number;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data = [], width = 520, height = 220 }) => {
  const padding = 40;
  const w = width - padding * 2;
  const h = height - padding * 2;
  let cumulative = 0;
  const min = Math.min(0, ...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value), 1);
  const scale = (v: number) => ((v - min) / (max - min)) * h;
  const barW = w / Math.max(1, data.length);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {data.map((d, i) => {
          const x = padding + i * barW + barW * 0.1;
          const val = d.value;
          const y0 = padding + (h - scale(Math.max(cumulative, 0)));
          const y1 = padding + (h - scale(Math.max(cumulative + val, 0)));

          const y = Math.min(y0, y1);
          const heightRect = Math.abs(y1 - y0) || 4;
          cumulative += val;

          return (
            <Rect key={i} x={x} y={y} width={barW * 0.8} height={heightRect} fill={d.color || '#27ae60'} />
          );
        })}
      </G>
    </Svg>
  );
};

export default WaterfallChart;
