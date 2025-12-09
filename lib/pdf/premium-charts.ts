/**
 * Premium Chart Generation Utilities
 * High-resolution, professional charts for PDF reports
 */

// Premium chart interfaces
export interface ComparisonBarData {
  current: number;
  projected: number;
  label: string;
}

export interface DonutChartData {
  items: Array<{ label: string; value: number; color: string }>;
  centerValue?: string;
  centerLabel?: string;
}

export interface GaugeChartData {
  value: number;
  max: number;
  label: string;
}

export interface WaterfallData {
  income: number;
  expenses: number;
  surplus: number;
}

export interface StackedBarData {
  labels: string[];
  series: Array<{ label: string; values: number[]; color: string }>;
}

/**
 * Generate premium comparison bar chart (side-by-side)
 */
export async function generateComparisonBarChart(data: ComparisonBarData): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 600 * scale;
    canvas.height = 400 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);
    const width = 600;
    const height = 400;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxValue = Math.max(Math.abs(data.current), Math.abs(data.projected)) * 1.15;
    const barWidth = 120;
    const barSpacing = 40;
    const chartHeight = 250;
    const chartY = 80;
    const chartX = 60;

    // Current bar
    const currentHeight = (Math.abs(data.current) / maxValue) * chartHeight;
    const currentY = data.current >= 0 
      ? chartY + chartHeight - currentHeight
      : chartY + chartHeight;
    ctx.fillStyle = data.current >= 0 ? '#3498db' : '#e74c3c';
    ctx.fillRect(chartX, currentY, barWidth, currentHeight);

    // Projected bar
    const projectedHeight = (Math.abs(data.projected) / maxValue) * chartHeight;
    const projectedY = data.projected >= 0
      ? chartY + chartHeight - projectedHeight
      : chartY + chartHeight;
    ctx.fillStyle = data.projected >= 0 ? '#27ae60' : '#e74c3c';
    ctx.fillRect(chartX + barWidth + barSpacing, projectedY, barWidth, projectedHeight);

    // Arrow between bars
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartX + barWidth + 10, chartY + chartHeight / 2);
    ctx.lineTo(chartX + barWidth + barSpacing - 10, chartY + chartHeight / 2);
    ctx.lineTo(chartX + barWidth + barSpacing - 15, chartY + chartHeight / 2 - 5);
    ctx.moveTo(chartX + barWidth + barSpacing - 10, chartY + chartHeight / 2);
    ctx.lineTo(chartX + barWidth + barSpacing - 15, chartY + chartHeight / 2 + 5);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Current', chartX + barWidth / 2, chartY + chartHeight + 30);
    ctx.fillText('Projected', chartX + barWidth + barSpacing + barWidth / 2, chartY + chartHeight + 30);

    // Values
    ctx.font = 'bold 16px Arial';
    ctx.fillText(formatCurrencyShort(data.current), chartX + barWidth / 2, chartY - 10);
    ctx.fillText(formatCurrencyShort(data.projected), chartX + barWidth + barSpacing + barWidth / 2, chartY - 10);

    // Title
    ctx.font = 'bold 18px Arial';
    ctx.fillText(data.label, width / 2, 40);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating comparison bar chart:', error);
    return '';
  }
}

/**
 * Generate premium donut chart
 */
export async function generateDonutChart(data: DonutChartData): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 400 * scale;
    canvas.height = 400 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);
    const size = 400;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 140;
    const innerRadius = 80;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const total = data.items.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return '';

    let currentAngle = -Math.PI / 2;

    // Draw donut segments
    data.items.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = (outerRadius + innerRadius) / 2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${((item.value / total) * 100).toFixed(0)}%`,
        labelX,
        labelY + 5
      );

      currentAngle += sliceAngle;
    });

    // Center text
    if (data.centerValue || data.centerLabel) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      if (data.centerValue) {
        ctx.fillText(data.centerValue, centerX, centerY - 10);
      }
      if (data.centerLabel) {
        ctx.font = '12px Arial';
        ctx.fillText(data.centerLabel, centerX, centerY + 15);
      }
    }

    // Legend
    let legendY = centerY + outerRadius + 50;
    data.items.forEach((item, index) => {
      const x = 50 + (index % 2) * 150;
      const y = legendY + Math.floor(index / 2) * 25;

      ctx.fillStyle = item.color;
      ctx.fillRect(x, y - 8, 16, 16);

      ctx.fillStyle = '#2c3e50';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.label}: ${formatCurrencyShort(item.value)}`, x + 22, y + 5);
    });

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating donut chart:', error);
    return '';
  }
}

/**
 * Generate premium gauge chart (semi-circular)
 */
export async function generateGaugeChart(data: GaugeChartData): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 500 * scale;
    canvas.height = 300 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);
    const width = 500;
    const height = 300;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height - 20;
    const radius = 200;
    const startAngle = Math.PI;
    const endAngle = 0;

    const percentage = Math.min(100, (data.value / data.max) * 100);
    const fillAngle = startAngle + (percentage / 100) * (endAngle - startAngle);

    // Background arc
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Value arc
    const color = percentage < 33 ? '#e74c3c' : percentage < 66 ? '#f39c12' : '#27ae60';
    ctx.strokeStyle = color;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, fillAngle);
    ctx.stroke();

    // Value text
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${percentage.toFixed(0)}%`, centerX, centerY - 40);

    // Label
    ctx.font = '14px Arial';
    ctx.fillText(data.label, centerX, centerY - 70);

    // Min/Max labels
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('0%', centerX - radius - 30, centerY);
    ctx.textAlign = 'right';
    ctx.fillText('100%', centerX + radius + 30, centerY);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating gauge chart:', error);
    return '';
  }
}

/**
 * Generate waterfall chart
 */
export async function generateWaterfallChart(data: WaterfallData): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 600 * scale;
    canvas.height = 350 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);
    const width = 600;
    const height = 350;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxValue = Math.max(data.income, data.expenses, data.surplus) * 1.2;
    const barWidth = 140;
    const barSpacing = 80;
    const chartHeight = 220;
    const chartY = 60;
    const baseY = chartY + chartHeight;

    // Income bar (positive)
    const incomeHeight = (data.income / maxValue) * chartHeight;
    const incomeY = baseY - incomeHeight;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(80, incomeY, barWidth, incomeHeight);
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, incomeY, barWidth, incomeHeight);

    // Connecting line
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80 + barWidth, baseY - incomeHeight);
    ctx.lineTo(80 + barWidth + barSpacing, baseY - incomeHeight + (data.expenses / maxValue) * chartHeight);
    ctx.stroke();

    // Expenses bar (negative)
    const expensesHeight = (data.expenses / maxValue) * chartHeight;
    const expensesY = baseY - incomeHeight + expensesHeight;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(80 + barWidth + barSpacing, expensesY, barWidth, expensesHeight);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(80 + barWidth + barSpacing, expensesY, barWidth, expensesHeight);

    // Connecting line to surplus
    const surplusStartY = baseY - incomeHeight + expensesHeight;
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80 + barWidth + barSpacing + barWidth, surplusStartY);
    ctx.lineTo(80 + barWidth + barSpacing * 2 + barWidth, baseY - (data.surplus / maxValue) * chartHeight);
    ctx.stroke();

    // Surplus bar
    const surplusHeight = (data.surplus / maxValue) * chartHeight;
    const surplusY = baseY - surplusHeight;
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(80 + barWidth + barSpacing * 2 + barWidth, surplusY, barWidth, surplusHeight);
    ctx.strokeStyle = '#229954';
    ctx.lineWidth = 2;
    ctx.strokeRect(80 + barWidth + barSpacing * 2 + barWidth, surplusY, barWidth, surplusHeight);

    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Income', 80 + barWidth / 2, baseY + 25);
    ctx.fillText(formatCurrencyShort(data.income), 80 + barWidth / 2, incomeY - 10);
    
    ctx.fillText('Expenses', 80 + barWidth + barSpacing + barWidth / 2, baseY + 25);
    ctx.fillText(formatCurrencyShort(data.expenses), 80 + barWidth + barSpacing + barWidth / 2, expensesY - 10);
    
    ctx.fillText('Surplus', 80 + barWidth + barSpacing * 2 + barWidth + barWidth / 2, baseY + 25);
    ctx.fillText(formatCurrencyShort(data.surplus), 80 + barWidth + barSpacing * 2 + barWidth + barWidth / 2, surplusY - 10);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating waterfall chart:', error);
    return '';
  }
}

/**
 * Generate stacked bar chart
 */
export async function generateStackedBarChart(data: StackedBarData): Promise<string> {
  try {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = 700 * scale;
    canvas.height = 400 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(scale, scale);
    const width = 700;
    const height = 400;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate max total
    const maxTotal = Math.max(...data.labels.map((_, i) => 
      data.series.reduce((sum, s) => sum + s.values[i], 0)
    )) * 1.15;

    const barWidth = 80;
    const barSpacing = 40;
    const chartHeight = 250;
    const chartY = 80;
    const chartX = 80;

    // Draw stacked bars
    data.labels.forEach((label, labelIndex) => {
      const x = chartX + labelIndex * (barWidth + barSpacing);
      let currentY = chartY + chartHeight;

      data.series.forEach((series) => {
        const segmentHeight = (series.values[labelIndex] / maxTotal) * chartHeight;
        currentY -= segmentHeight;

        ctx.fillStyle = series.color;
        ctx.fillRect(x, currentY, barWidth, segmentHeight);

        // Value label if segment is large enough
        if (segmentHeight > 20) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          const percentage = (series.values[labelIndex] / 
            data.series.reduce((sum, s) => sum + s.values[labelIndex], 0)) * 100;
          ctx.fillText(
            `${percentage.toFixed(0)}%`,
            x + barWidth / 2,
            currentY + segmentHeight / 2 + 3
          );
        }
      });

      // Category label
      ctx.fillStyle = '#2c3e50';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, chartY + chartHeight + 20);
    });

    // Legend
    let legendY = chartY + chartHeight + 50;
    data.series.forEach((series, index) => {
      const x = 100 + index * 150;
      ctx.fillStyle = series.color;
      ctx.fillRect(x, legendY, 16, 16);
      ctx.fillStyle = '#2c3e50';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(series.label, x + 22, legendY + 12);
    });

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating stacked bar chart:', error);
    return '';
  }
}

// Helper function
function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
}
