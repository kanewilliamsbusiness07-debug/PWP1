/**
 * Chart Generation Utilities
 * Converts financial data into chart images for PDF embedding
 */

export interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

export interface IncomeChartData {
  employment: number;
  rental: number;
  investment: number;
  other: number;
}

export interface ExpenseChartData {
  workRelated: number;
  investment: number;
  rental: number;
  vehicle: number;
  homeOffice: number;
}

export interface AssetChartData {
  home: number;
  investments: number;
  super: number;
  shares: number;
  savings: number;
  vehicle: number;
  other: number;
}

export interface LiabilityChartData {
  homeLoan: number;
  investmentLoans: number;
  creditCard: number;
  personalLoan: number;
  hecs: number;
}

/**
 * Generate a pie chart as base64 image for income breakdown
 */
export async function generateIncomeChart(data: IncomeChartData): Promise<string> {
  try {
    const total = data.employment + data.rental + data.investment + data.other;
    if (total === 0) return '';

    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return '';
    }

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Annual Income Breakdown', canvas.width / 2, 30);

  // Pie chart
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 20;
  const radius = 120;
  let currentAngle = -Math.PI / 2;

  const colors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];
  const items = [
    { label: 'Employment', value: data.employment, color: colors[0] },
    { label: 'Rental', value: data.rental, color: colors[1] },
    { label: 'Investment', value: data.investment, color: colors[2] },
    { label: 'Other', value: data.other, color: colors[3] },
  ].filter(item => item.value > 0);

  // Draw pie slices
  items.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${((item.value / total) * 100).toFixed(0)}%`,
      labelX,
      labelY
    );

    currentAngle += sliceAngle;
  });

  // Legend
  let legendY = centerY + radius + 40;
  items.forEach((item, index) => {
    const x = 50 + (index % 2) * 250;
    const y = legendY + Math.floor(index / 2) * 30;

    // Color box
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y - 10, 15, 15);

    // Label
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${item.label}: $${item.value.toLocaleString()}`,
      x + 20,
      y + 2
    );
  });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating retirement chart:', error);
    return '';
  }
}

/**
 * Generate a bar chart for expenses
 */
export async function generateExpenseChart(data: ExpenseChartData): Promise<string> {
  try {
    const total = data.workRelated + data.investment + data.rental + data.vehicle + data.homeOffice;
    if (total === 0) return '';

    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    // Higher resolution for better quality in PDF
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return '';
    }

  // Scale context for higher resolution
  const scale = 2;
  ctx.scale(scale, scale);
  const baseWidth = canvas.width / scale;
  const baseHeight = canvas.height / scale;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Annual Expenses Breakdown', baseWidth / 2, 30);

  const items = [
    { label: 'Work Related', value: data.workRelated, color: '#3498db' },
    { label: 'Investment', value: data.investment, color: '#2ecc71' },
    { label: 'Rental', value: data.rental, color: '#f39c12' },
    { label: 'Vehicle', value: data.vehicle, color: '#e74c3c' },
    { label: 'Home Office', value: data.homeOffice, color: '#9b59b6' },
  ].filter(item => item.value > 0);

  const maxValue = Math.max(...items.map(item => item.value));
  const barWidth = 80;
  const barSpacing = 20;
  const chartHeight = 250;
  const chartY = 80;
  const chartX = 50;

  // Draw bars
  items.forEach((item, index) => {
    const x = chartX + index * (barWidth + barSpacing);
    const barHeight = (item.value / maxValue) * chartHeight;
    const y = chartY + chartHeight - barHeight;

    // Bar
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Value label on bar
    if (barHeight > 20) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `$${(item.value / 1000).toFixed(0)}k`,
        x + barWidth / 2,
        y + barHeight / 2 + 4
      );
    }

    // Category label
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barWidth / 2, chartY + chartHeight + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(item.label, 0, 0);
    ctx.restore();
  });

  // Y-axis labels
  ctx.fillStyle = '#7f8c8d';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i;
    const y = chartY + chartHeight - (i / 5) * chartHeight;
    ctx.fillText(`$${(value / 1000).toFixed(0)}k`, chartX - 10, y + 4);
  }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating expense chart:', error);
    return '';
  }
}

/**
 * Generate a donut chart for assets vs liabilities
 */
export async function generateAssetLiabilityChart(
  assets: AssetChartData,
  liabilities: LiabilityChartData
): Promise<string> {
  try {
    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    
    if (totalAssets === 0 && totalLiabilities === 0) return '';

    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    // Higher resolution for better quality in PDF
    canvas.width = 1200;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return '';
    }

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Assets vs Liabilities', canvas.width / 2, 30);

  // Assets donut chart
  const centerX1 = canvas.width / 4;
  const centerY = canvas.height / 2 + 30;
  const radius = 100;
  const innerRadius = 60;

  const assetColors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'];
  const assetItems = [
    { label: 'Home', value: assets.home, color: assetColors[0] },
    { label: 'Investments', value: assets.investments, color: assetColors[1] },
    { label: 'Super', value: assets.super, color: assetColors[2] },
    { label: 'Shares', value: assets.shares, color: assetColors[3] },
    { label: 'Savings', value: assets.savings, color: assetColors[4] },
    { label: 'Vehicle', value: assets.vehicle, color: assetColors[5] },
    { label: 'Other', value: assets.other, color: assetColors[6] },
  ].filter(item => item.value > 0);

  let currentAngle = -Math.PI / 2;
  assetItems.forEach((item) => {
    const sliceAngle = (item.value / totalAssets) * 2 * Math.PI;
    
    // Outer arc
    ctx.beginPath();
    ctx.arc(centerX1, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX1, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center text for assets
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Assets', centerX1, centerY - 5);
  ctx.font = '12px Arial';
  ctx.fillText(`$${totalAssets.toLocaleString()}`, centerX1, centerY + 12);

  // Liabilities donut chart
  const centerX2 = (canvas.width * 3) / 4;
  const liabilityColors = ['#e74c3c', '#c0392b', '#d35400', '#8e44ad', '#7f8c8d'];
  const liabilityItems = [
    { label: 'Home Loan', value: liabilities.homeLoan, color: liabilityColors[0] },
    { label: 'Investment Loans', value: liabilities.investmentLoans, color: liabilityColors[1] },
    { label: 'Credit Card', value: liabilities.creditCard, color: liabilityColors[2] },
    { label: 'Personal Loan', value: liabilities.personalLoan, color: liabilityColors[3] },
    { label: 'HECS', value: liabilities.hecs, color: liabilityColors[4] },
  ].filter(item => item.value > 0);

  currentAngle = -Math.PI / 2;
  liabilityItems.forEach((item) => {
    const sliceAngle = (item.value / totalLiabilities) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.arc(centerX2, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX2, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center text for liabilities
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Liabilities', centerX2, centerY - 5);
  ctx.font = '12px Arial';
  ctx.fillText(`$${totalLiabilities.toLocaleString()}`, centerX2, centerY + 12);

    // Net worth display
    const netWorth = totalAssets - totalLiabilities;
    ctx.fillStyle = netWorth >= 0 ? '#27ae60' : '#e74c3c';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Net Worth', canvas.width / 2, centerY + radius + 40);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${netWorth.toLocaleString()}`, canvas.width / 2, centerY + radius + 65);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating asset/liability chart:', error);
    return '';
  }
}

/**
 * Generate a cash flow comparison chart
 */
export async function generateCashFlowChart(income: number, expenses: number): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    // Higher resolution for better quality in PDF
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return '';
    }

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Monthly Cash Flow Analysis', canvas.width / 2, 40);

  const maxValue = Math.max(income, expenses) * 1.2;
  const barWidth = 150;
  const chartHeight = 250;
  const chartY = 80;
  const chartX = (canvas.width - barWidth * 2 - 50) / 2;

  // Income bar
  const incomeHeight = (income / maxValue) * chartHeight;
  const incomeY = chartY + chartHeight - incomeHeight;
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(chartX, incomeY, barWidth, incomeHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Income', chartX + barWidth / 2, chartY + chartHeight + 20);
  ctx.fillText(`$${income.toLocaleString()}`, chartX + barWidth / 2, incomeY + incomeHeight / 2 + 5);

  // Expenses bar
  const expenseHeight = (expenses / maxValue) * chartHeight;
  const expenseY = chartY + chartHeight - expenseHeight;
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(chartX + barWidth + 50, expenseY, barWidth, expenseHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Expenses', chartX + barWidth + 50 + barWidth / 2, chartY + chartHeight + 20);
  ctx.fillText(`$${expenses.toLocaleString()}`, chartX + barWidth + 50 + barWidth / 2, expenseY + expenseHeight / 2 + 5);

  // Net cash flow
  const cashFlow = income - expenses;
  const cashFlowColor = cashFlow >= 0 ? '#27ae60' : '#e74c3c';
  ctx.fillStyle = cashFlowColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Net Cash Flow', canvas.width / 2, chartY + chartHeight + 60);
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`$${cashFlow.toLocaleString()}`, canvas.width / 2, chartY + chartHeight + 85);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating cash flow chart:', error);
    return '';
  }
}

/**
 * Generate a retirement projection chart
 */
export async function generateRetirementChart(
  currentAge: number,
  retirementAge: number,
  currentSuper: number,
  projectedSuper: number
): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return '';
    }

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Retirement Projection', canvas.width / 2, 30);

  const yearsToRetirement = retirementAge - currentAge;
  const chartHeight = 250;
  const chartY = 80;
  const chartX = 80;
  const chartWidth = canvas.width - chartX * 2;

  // Draw line chart
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartHeight);
  
  // Projected growth line
  const points = 10;
  for (let i = 0; i <= points; i++) {
    const year = (yearsToRetirement / points) * i;
    const value = currentSuper * Math.pow(1.07, year); // 7% growth
    const x = chartX + (i / points) * chartWidth;
    const y = chartY + chartHeight - (value / projectedSuper) * chartHeight;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Current value point
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.arc(chartX, chartY + chartHeight, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#2c3e50';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Current: $${currentSuper.toLocaleString()}`, chartX + 10, chartY + chartHeight + 5);

  // Projected value point
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.arc(chartX + chartWidth, chartY + chartHeight - chartHeight, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#2c3e50';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Projected: $${projectedSuper.toLocaleString()}`, chartX + chartWidth - 10, chartY - 10);

  // X-axis labels
  ctx.fillStyle = '#7f8c8d';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${currentAge} years`, chartX, chartY + chartHeight + 20);
  ctx.fillText(`${retirementAge} years`, chartX + chartWidth, chartY + chartHeight + 20);

  // Y-axis labels
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = (projectedSuper / 5) * i;
    const y = chartY + chartHeight - (i / 5) * chartHeight;
    ctx.fillText(`$${(value / 1000).toFixed(0)}k`, chartX - 10, y + 4);
  }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating retirement chart:', error);
    return '';
  }
}
