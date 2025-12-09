/**
 * SVG Chart Generation Utilities
 * Creates professional, high-resolution charts for PDF reports
 * All charts return SVG strings for embedding in @react-pdf/renderer
 */

// Chart configuration matching design spec
const CHART_CONFIG = {
  colors: {
    primary: '#2c3e50',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#3498db',
    purple: '#9b59b6',
    teal: '#1abc9c',
    orange: '#e67e22',
    gray: '#95a5a6',
    lightGray: '#ecf0f1',
    white: '#ffffff',
    text: '#333333',
    textLight: '#777777',
    grid: '#e0e0e0',
  },
  dimensions: {
    minWidth: 500,
    minHeight: 250,
    padding: { top: 40, right: 30, bottom: 50, left: 70 },
  },
  line: {
    width: 2.5,
    pointRadius: 4,
  },
  grid: {
    width: 1,
    color: '#e0e0e0',
  },
  font: {
    axis: '11px Arial',
    title: '14px Arial',
    legend: '11px Arial',
    label: '10px Arial',
  },
};

interface ChartPoint {
  x: number;
  y: number;
  label: string;
}

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

/**
 * Create SVG line chart with grid, axis labels, and data points
 */
export function createLineChart(
  title: string,
  labels: string[],
  values: number[],
  color: string = CHART_CONFIG.colors.info,
  width: number = 600,
  height: number = 300,
  yAxisLabel: string = 'Value',
  xAxisLabel: string = 'Time'
): string {
  const padding = CHART_CONFIG.dimensions.padding;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate scale
  const maxValue = Math.max(...values.filter(v => !isNaN(v)), 0);
  const minValue = 0;
  const range = maxValue === 0 ? 1 : maxValue;
  const yScale = plotHeight / range;
  const xScale = plotWidth / (values.length - 1 || 1);

  // Create SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${CHART_CONFIG.colors.white}"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${title}
  </text>
  
  <!-- Grid lines -->`;

  // Horizontal grid lines and labels
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (plotHeight * i) / gridLines;
    const value = maxValue - (maxValue * i) / gridLines;
    
    svg += `
  <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${CHART_CONFIG.grid.color}" stroke-width="${CHART_CONFIG.grid.width}"/>
  <text x="${padding.left - 10}" y="${y + 5}" font-size="10" text-anchor="end" fill="${CHART_CONFIG.colors.textLight}">
    $${Math.round(value).toLocaleString()}
  </text>`;
  }

  // Y-axis label
  svg += `
  <text x="15" y="${height / 2}" font-size="11" text-anchor="middle" fill="${CHART_CONFIG.colors.textLight}" transform="rotate(-90, 15, ${height / 2})">
    ${yAxisLabel}
  </text>`;

  // Axes
  svg += `
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="${CHART_CONFIG.colors.text}" stroke-width="1.5"/>
  <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${CHART_CONFIG.colors.text}" stroke-width="1.5"/>`;

  // Plot data points and line
  if (values.length > 0) {
    let pathData = 'M ';
    const validPoints = values.map((v, i) => ({ x: i, y: v })).filter(p => !isNaN(p.y));

    // Line path
    validPoints.forEach((point, idx) => {
      const x = padding.left + point.x * xScale;
      const y = height - padding.bottom - (point.y / range) * plotHeight;
      pathData += `${x},${y} `;
    });

    svg += `
  <polyline points="${pathData}" fill="none" stroke="${color}" stroke-width="${CHART_CONFIG.line.width}" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Data points
    validPoints.forEach((point, idx) => {
      const x = padding.left + point.x * xScale;
      const y = height - padding.bottom - (point.y / range) * plotHeight;
      svg += `
  <circle cx="${x}" cy="${y}" r="${CHART_CONFIG.line.pointRadius}" fill="${color}"/>`;

      // X-axis labels
      if (idx % Math.ceil(labels.length / 5) === 0 || idx === labels.length - 1) {
        svg += `
  <text x="${x}" y="${height - padding.bottom + 20}" font-size="10" text-anchor="middle" fill="${CHART_CONFIG.colors.text}">
    ${labels[point.x]}
  </text>`;
      }
    });
  }

  // X-axis label
  svg += `
  <text x="${width / 2}" y="${height - 10}" font-size="11" text-anchor="middle" fill="${CHART_CONFIG.colors.textLight}">
    ${xAxisLabel}
  </text>
</svg>`;

  return svg;
}

/**
 * Create SVG horizontal bar chart
 */
export function createHorizontalBarChart(
  title: string,
  data: BarChartData[],
  width: number = 500,
  height: number = 250,
  showValues: boolean = true
): string {
  const padding = { top: 40, right: 30, bottom: 30, left: 150 };
  const plotHeight = height - padding.top - padding.bottom;
  const barHeight = plotHeight / (data.length || 1);
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const plotWidth = width - padding.left - padding.right;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${CHART_CONFIG.colors.white}"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${title}
  </text>`;

  // Bars and labels
  data.forEach((item, idx) => {
    const y = padding.top + idx * barHeight;
    const barWidth = (item.value / maxValue) * plotWidth;

    // Bar
    svg += `
  <rect x="${padding.left}" y="${y}" width="${barWidth}" height="${barHeight * 0.7}" fill="${item.color}" rx="4"/>`;

    // Label
    svg += `
  <text x="${padding.left - 10}" y="${y + barHeight * 0.45}" font-size="11" text-anchor="end" fill="${CHART_CONFIG.colors.text}">
    ${item.label}
  </text>`;

    // Value
    if (showValues) {
      svg += `
  <text x="${padding.left + barWidth + 8}" y="${y + barHeight * 0.45}" font-size="11" fill="${CHART_CONFIG.colors.text}" font-weight="bold">
    $${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  </text>`;
    }
  });

  svg += `
</svg>`;

  return svg;
}

/**
 * Create SVG pie chart
 */
export function createPieChart(
  title: string,
  labels: string[],
  values: number[],
  colors: string[] = [
    CHART_CONFIG.colors.info,
    CHART_CONFIG.colors.success,
    CHART_CONFIG.colors.warning,
    CHART_CONFIG.colors.danger,
    CHART_CONFIG.colors.purple,
    CHART_CONFIG.colors.teal,
  ],
  width: number = 500,
  height: number = 300,
  donut: boolean = false
): string {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${CHART_CONFIG.colors.textLight}">No data</text>
    </svg>`;
  }

  const centerX = width / 2.5;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.25;
  const innerRadius = donut ? radius * 0.5 : 0;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${CHART_CONFIG.colors.white}"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${title}
  </text>`;

  let currentAngle = -Math.PI / 2;

  // Pie slices
  values.forEach((value, idx) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const innerX1 = centerX + innerRadius * Math.cos(startAngle);
    const innerY1 = centerY + innerRadius * Math.sin(startAngle);
    const innerX2 = centerX + innerRadius * Math.cos(endAngle);
    const innerY2 = centerY + innerRadius * Math.sin(endAngle);

    let pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    if (donut) {
      pathData += ` L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`;
    } else {
      pathData += ` L ${centerX} ${centerY} Z`;
    }

    svg += `
  <path d="${pathData}" fill="${colors[idx % colors.length]}" stroke="${CHART_CONFIG.colors.white}" stroke-width="2"/>`;

    // Percentage label
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * (donut ? 0.7 : 0.65);
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);
    const percentage = ((value / total) * 100).toFixed(0);

    svg += `
  <text x="${labelX}" y="${labelY}" font-size="11" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.white}">
    ${percentage}%
  </text>`;

    currentAngle = endAngle;
  });

  // Legend
  const legendX = centerX * 1.8;
  const legendY = centerY - (labels.length * 20) / 2;

  labels.forEach((label, idx) => {
    const value = values[idx];
    const percentage = ((value / total) * 100).toFixed(1);
    const y = legendY + idx * 25;

    svg += `
  <rect x="${legendX}" y="${y}" width="12" height="12" fill="${colors[idx % colors.length]}"/>
  <text x="${legendX + 20}" y="${y + 10}" font-size="10" fill="${CHART_CONFIG.colors.text}">
    ${label}: ${percentage}%
  </text>`;
  });

  svg += `
</svg>`;

  return svg;
}

/**
 * Create SVG stacked bar chart for cash flow
 */
export function createStackedBarChart(
  title: string,
  categories: string[],
  series: { name: string; values: number[]; color: string }[],
  width: number = 500,
  height: number = 300
): string {
  const padding = { top: 40, right: 30, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barWidth = Math.min(plotWidth / categories.length * 0.6, 60);
  const barSpacing = plotWidth / categories.length;

  // Calculate max for scaling
  const categoryTotals = categories.map((_, catIdx) =>
    series.reduce((sum, s) => sum + s.values[catIdx], 0)
  );
  const maxValue = Math.max(...categoryTotals, 1);
  const yScale = plotHeight / maxValue;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${CHART_CONFIG.colors.white}"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${title}
  </text>`;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (plotHeight * i) / 5;
    const value = maxValue - (maxValue * i) / 5;

    svg += `
  <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${CHART_CONFIG.grid.color}" stroke-width="${CHART_CONFIG.grid.width}"/>
  <text x="${padding.left - 10}" y="${y + 5}" font-size="9" text-anchor="end" fill="${CHART_CONFIG.colors.textLight}">
    $${Math.round(value / 1000)}k
  </text>`;
  }

  // Axes
  svg += `
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="${CHART_CONFIG.colors.text}" stroke-width="1.5"/>
  <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="${CHART_CONFIG.colors.text}" stroke-width="1.5"/>`;

  // Bars
  categories.forEach((category, catIdx) => {
    const x = padding.left + catIdx * barSpacing + (barSpacing - barWidth) / 2;
    let currentY = height - padding.bottom;

    series.forEach((s) => {
      const value = s.values[catIdx];
      const barHeight = value * yScale;
      const barY = currentY - barHeight;

      svg += `
  <rect x="${x}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${s.color}" stroke="${CHART_CONFIG.colors.white}" stroke-width="1"/>`;

      currentY = barY;
    });

    // Category label
    svg += `
  <text x="${x + barWidth / 2}" y="${height - padding.bottom + 20}" font-size="10" text-anchor="middle" fill="${CHART_CONFIG.colors.text}">
    ${category}
  </text>`;
  });

  // Legend
  const legendY = padding.top + 10;
  let legendX = width - padding.right - 120;
  series.forEach((s, idx) => {
    svg += `
  <rect x="${legendX}" y="${legendY + idx * 20}" width="12" height="12" fill="${s.color}"/>
  <text x="${legendX + 18}" y="${legendY + idx * 20 + 10}" font-size="9" fill="${CHART_CONFIG.colors.text}">
    ${s.name}
  </text>`;
  });

  svg += `
</svg>`;

  return svg;
}

/**
 * Create SVG progress/gauge chart
 */
export function createGaugeChart(
  title: string,
  value: number,
  maxValue: number,
  unit: string = '%',
  width: number = 300,
  height: number = 200,
  color: string = CHART_CONFIG.colors.success
): string {
  const percentage = Math.min(value / maxValue, 1) * 100;
  const centerX = width / 2;
  const centerY = height * 0.65;
  const radius = width * 0.35;

  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const currentAngle = startAngle + (percentage / 100) * (endAngle - startAngle);

  const x1 = centerX + radius * Math.cos(startAngle);
  const y1 = centerY + radius * Math.sin(startAngle);
  const x2 = centerX + radius * Math.cos(currentAngle);
  const y2 = centerY + radius * Math.sin(currentAngle);
  const xe = centerX + radius * Math.cos(endAngle);
  const ye = centerY + radius * Math.sin(endAngle);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${CHART_CONFIG.colors.white}"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="25" font-size="12" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${title}
  </text>
  
  <!-- Gauge background -->
  <path d="M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${xe} ${ye}" stroke="${CHART_CONFIG.colors.lightGray}" stroke-width="20" fill="none" stroke-linecap="round"/>
  
  <!-- Gauge fill -->
  <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${percentage > 50 ? 1 : 0} 1 ${x2} ${y2}" stroke="${color}" stroke-width="20" fill="none" stroke-linecap="round"/>
  
  <!-- Center circle -->
  <circle cx="${centerX}" cy="${centerY}" r="15" fill="${CHART_CONFIG.colors.white}" stroke="${color}" stroke-width="2"/>
  
  <!-- Value text -->
  <text x="${centerX}" y="${centerY + 50}" font-size="24" font-weight="bold" text-anchor="middle" fill="${CHART_CONFIG.colors.primary}">
    ${value.toLocaleString()}${unit}
  </text>
</svg>`;

  return svg;
}

/**
 * Convert SVG string to Data URL for embedding in PDF
 */
export function svgToDataUrl(svgString: string): string {
  // Ensure SVG is properly formatted
  const sanitized = svgString
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const encoded = encodeURIComponent(sanitized);
  return `data:image/svg+xml;utf8,${encoded}`;
}
