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

/**
 * Generate detailed cash flow breakdown chart with percentages
 */
export async function generateDetailedCashFlowChart(data: {
  employment: number;
  rental: number;
  investment: number;
  other: number;
  workExpenses: number;
  investmentExpenses: number;
  rentalExpenses: number;
  vehicleExpenses: number;
  homeOfficeExpenses: number;
}): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
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
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Detailed Cash Flow Breakdown', canvas.width / 2, 45);

    const totalIncome = data.employment + data.rental + data.investment + data.other;
    const totalExpenses = data.workExpenses + data.investmentExpenses + data.rentalExpenses + 
                         data.vehicleExpenses + data.homeOfficeExpenses;

    // Income breakdown (left side)
    const incomeY = 120;
    const incomeHeight = 280;
    const incomeX = 60;
    const incomeWidth = 520;

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(incomeX, incomeY, incomeWidth, incomeHeight + 60);
    
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('INCOME', incomeX + 20, incomeY + 30);

    const incomeItems = [
      { label: 'Employment Income', value: data.employment, color: '#3498db' },
      { label: 'Rental Income', value: data.rental, color: '#2ecc71' },
      { label: 'Investment Income', value: data.investment, color: '#f39c12' },
      { label: 'Other Income', value: data.other, color: '#9b59b6' },
    ].filter(item => item.value > 0);

    let currentY = incomeY + 70;
    incomeItems.forEach((item) => {
      const percentage = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
      const barWidth = (item.value / totalIncome) * (incomeWidth - 120);
      
      // Bar
      ctx.fillStyle = item.color;
      ctx.fillRect(incomeX + 20, currentY, barWidth, 35);
      
      // Label and value
      ctx.fillStyle = '#2c3e50';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, incomeX + 30, currentY + 22);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${percentage.toFixed(1)}%`, incomeX + 30 + barWidth - 60, currentY + 22);
      
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${item.value.toLocaleString()}`, incomeX + incomeWidth - 30, currentY + 22);
      
      currentY += 55;
    });

    // Total income
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Total Income:', incomeX + 20, currentY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalIncome.toLocaleString()}`, incomeX + incomeWidth - 30, currentY + 10);

    // Expense breakdown (right side)
    const expenseY = 120;
    const expenseHeight = 280;
    const expenseX = 620;
    const expenseWidth = 520;

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(expenseX, expenseY, expenseWidth, expenseHeight + 60);
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('EXPENSES', expenseX + 20, expenseY + 30);

    const expenseItems = [
      { label: 'Work Related', value: data.workExpenses, color: '#3498db' },
      { label: 'Investment Expenses', value: data.investmentExpenses, color: '#2ecc71' },
      { label: 'Rental Expenses', value: data.rentalExpenses, color: '#f39c12' },
      { label: 'Vehicle Expenses', value: data.vehicleExpenses, color: '#e74c3c' },
      { label: 'Home Office', value: data.homeOfficeExpenses, color: '#9b59b6' },
    ].filter(item => item.value > 0);

    currentY = expenseY + 70;
    expenseItems.forEach((item) => {
      const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
      const barWidth = totalExpenses > 0 ? (item.value / totalExpenses) * (expenseWidth - 120) : 0;
      
      // Bar
      ctx.fillStyle = item.color;
      ctx.fillRect(expenseX + 20, currentY, barWidth, 35);
      
      // Label and value
      ctx.fillStyle = '#2c3e50';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, expenseX + 30, currentY + 22);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      if (barWidth > 60) {
        ctx.fillText(`${percentage.toFixed(1)}%`, expenseX + 30 + barWidth - 60, currentY + 22);
      }
      
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${item.value.toLocaleString()}`, expenseX + expenseWidth - 30, currentY + 22);
      
      currentY += 55;
    });

    // Total expenses
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Total Expenses:', expenseX + 20, currentY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalExpenses.toLocaleString()}`, expenseX + expenseWidth - 30, currentY + 10);

    // Net cash flow display
    const netCashFlow = totalIncome - totalExpenses;
    const netY = incomeY + incomeHeight + 80;
    ctx.fillStyle = netCashFlow >= 0 ? '#e8f5e9' : '#ffebee';
    ctx.fillRect(incomeX, netY, incomeWidth + expenseWidth, 80);
    
    ctx.fillStyle = netCashFlow >= 0 ? '#27ae60' : '#e74c3c';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Net Cash Flow', canvas.width / 2, netY + 30);
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`$${netCashFlow.toLocaleString()}`, canvas.width / 2, netY + 70);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating detailed cash flow chart:', error);
    return '';
  }
}

/**
 * Generate detailed financial position diagram
 */
export async function generateFinancialPositionChart(assets: AssetChartData, liabilities: LiabilityChartData): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
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
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Financial Position Overview', canvas.width / 2, 45);

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Assets section (top left)
    const assetsY = 100;
    const assetsX = 50;
    const assetsWidth = 500;
    const assetsHeight = 350;

    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(assetsX, assetsY, assetsWidth, assetsHeight);
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.strokeRect(assetsX, assetsY, assetsWidth, assetsHeight);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ASSETS', assetsX + 20, assetsY + 35);

    const assetColors = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'];
    const assetItems = [
      { label: 'Home', value: assets.home, color: assetColors[0] },
      { label: 'Investment Properties', value: assets.investments, color: assetColors[1] },
      { label: 'Superannuation', value: assets.super, color: assetColors[2] },
      { label: 'Shares', value: assets.shares, color: assetColors[3] },
      { label: 'Savings', value: assets.savings, color: assetColors[4] },
      { label: 'Vehicle', value: assets.vehicle, color: assetColors[5] },
      { label: 'Other', value: assets.other, color: assetColors[6] },
    ].filter(item => item.value > 0);

    let currentY = assetsY + 70;
    assetItems.forEach((item) => {
      const percentage = totalAssets > 0 ? (item.value / totalAssets) * 100 : 0;
      const barWidth = totalAssets > 0 ? (item.value / totalAssets) * (assetsWidth - 140) : 0;

      // Color indicator
      ctx.fillStyle = item.color;
      ctx.fillRect(assetsX + 20, currentY - 12, 20, 20);

      // Bar
      ctx.fillRect(assetsX + 50, currentY - 12, barWidth, 20);

      // Label
      ctx.fillStyle = '#2c3e50';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, assetsX + 80 + barWidth, currentY + 2);

      // Percentage and value
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${percentage.toFixed(1)}% - $${item.value.toLocaleString()}`, assetsX + assetsWidth - 20, currentY + 2);

      currentY += 40;
    });

    // Total assets
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Total Assets:', assetsX + 20, currentY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalAssets.toLocaleString()}`, assetsX + assetsWidth - 20, currentY + 10);

    // Liabilities section (top right)
    const liabilitiesY = 100;
    const liabilitiesX = 650;
    const liabilitiesWidth = 500;
    const liabilitiesHeight = 350;

    ctx.fillStyle = '#ffebee';
    ctx.fillRect(liabilitiesX, liabilitiesY, liabilitiesWidth, liabilitiesHeight);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(liabilitiesX, liabilitiesY, liabilitiesWidth, liabilitiesHeight);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('LIABILITIES', liabilitiesX + 20, liabilitiesY + 35);

    const liabilityColors = ['#e74c3c', '#c0392b', '#d35400', '#8e44ad', '#7f8c8d'];
    const liabilityItems = [
      { label: 'Home Loan', value: liabilities.homeLoan, color: liabilityColors[0] },
      { label: 'Investment Loans', value: liabilities.investmentLoans, color: liabilityColors[1] },
      { label: 'Credit Card', value: liabilities.creditCard, color: liabilityColors[2] },
      { label: 'Personal Loan', value: liabilities.personalLoan, color: liabilityColors[3] },
      { label: 'HECS/HELP', value: liabilities.hecs, color: liabilityColors[4] },
    ].filter(item => item.value > 0);

    currentY = liabilitiesY + 70;
    liabilityItems.forEach((item) => {
      const percentage = totalLiabilities > 0 ? (item.value / totalLiabilities) * 100 : 0;
      const barWidth = totalLiabilities > 0 ? (item.value / totalLiabilities) * (liabilitiesWidth - 140) : 0;

      // Color indicator
      ctx.fillStyle = item.color;
      ctx.fillRect(liabilitiesX + 20, currentY - 12, 20, 20);

      // Bar
      ctx.fillRect(liabilitiesX + 50, currentY - 12, barWidth, 20);

      // Label
      ctx.fillStyle = '#2c3e50';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, liabilitiesX + 80 + barWidth, currentY + 2);

      // Percentage and value
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${percentage.toFixed(1)}% - $${item.value.toLocaleString()}`, liabilitiesX + liabilitiesWidth - 20, currentY + 2);

      currentY += 40;
    });

    // Total liabilities
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Total Liabilities:', liabilitiesX + 20, currentY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`$${totalLiabilities.toLocaleString()}`, liabilitiesX + liabilitiesWidth - 20, currentY + 10);

    // Net Worth display (bottom center)
    const netY = 500;
    const netX = 300;
    const netWidth = 600;
    const netHeight = 120;

    ctx.fillStyle = netWorth >= 0 ? '#e8f5e9' : '#ffebee';
    ctx.fillRect(netX, netY, netWidth, netHeight);
    ctx.strokeStyle = netWorth >= 0 ? '#27ae60' : '#e74c3c';
    ctx.lineWidth = 4;
    ctx.strokeRect(netX, netY, netWidth, netHeight);

    ctx.fillStyle = netWorth >= 0 ? '#27ae60' : '#e74c3c';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NET WORTH', canvas.width / 2, netY + 40);
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`$${netWorth.toLocaleString()}`, canvas.width / 2, netY + 90);

    // Equity ratio
    const equityRatio = totalAssets > 0 ? ((netWorth / totalAssets) * 100) : 0;
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '16px Arial';
    ctx.fillText(`Equity Ratio: ${equityRatio.toFixed(1)}%`, canvas.width / 2, netY + 125);

    // Visual comparison bars (bottom)
    const comparisonY = 680;
    const comparisonHeight = 80;
    const comparisonX = 100;
    const comparisonWidth = 1000;
    const maxValue = Math.max(totalAssets, totalLiabilities) * 1.1;

    // Assets bar
    const assetsBarWidth = (totalAssets / maxValue) * comparisonWidth;
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(comparisonX, comparisonY, assetsBarWidth, comparisonHeight);
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Assets', comparisonX + 10, comparisonY + 50);
    ctx.font = '16px Arial';
    ctx.fillText(`$${totalAssets.toLocaleString()}`, comparisonX + assetsBarWidth - 150, comparisonY + 50);

    // Liabilities bar
    const liabilitiesBarWidth = (totalLiabilities / maxValue) * comparisonWidth;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(comparisonX, comparisonY + comparisonHeight + 20, liabilitiesBarWidth, comparisonHeight);
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Liabilities', comparisonX + 10, comparisonY + comparisonHeight + 70);
    ctx.font = '16px Arial';
    ctx.fillText(`$${totalLiabilities.toLocaleString()}`, comparisonX + liabilitiesBarWidth - 150, comparisonY + comparisonHeight + 70);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating financial position chart:', error);
    return '';
  }
}

/**
 * Generate detailed retirement projection chart
 */
export async function generateDetailedRetirementChart(data: {
  currentAge: number;
  retirementAge: number;
  currentSuper: number;
  currentSavings: number;
  currentShares: number;
  currentProperties: number;
  projectedLumpSum: number;
  projectedMonthlyIncome: number;
  monthlySurplus: number;
}): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
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
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Retirement Projection Analysis', canvas.width / 2, 45);

    const yearsToRetirement = data.retirementAge - data.currentAge;

    // Key metrics boxes (top)
    const metricsY = 100;
    const metricWidth = 270;
    const metricSpacing = 30;

    // Years to retirement
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(50, metricsY, metricWidth, 100);
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, metricsY, metricWidth, 100);
    ctx.fillStyle = '#2196f3';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Years to Retirement', 50 + metricWidth / 2, metricsY + 25);
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${yearsToRetirement}`, 50 + metricWidth / 2, metricsY + 70);

    // Projected lump sum
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(50 + metricWidth + metricSpacing, metricsY, metricWidth, 100);
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.strokeRect(50 + metricWidth + metricSpacing, metricsY, metricWidth, 100);
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Projected Lump Sum', 50 + metricWidth + metricSpacing + metricWidth / 2, metricsY + 25);
    ctx.font = 'bold 24px Arial';
    const lumpSumText = `$${(data.projectedLumpSum / 1000).toFixed(0)}k`;
    ctx.fillText(lumpSumText, 50 + metricWidth + metricSpacing + metricWidth / 2, metricsY + 70);

    // Monthly income
    ctx.fillStyle = '#fff3e0';
    ctx.fillRect(50 + (metricWidth + metricSpacing) * 2, metricsY, metricWidth, 100);
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.strokeRect(50 + (metricWidth + metricSpacing) * 2, metricsY, metricWidth, 100);
    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Monthly Income', 50 + (metricWidth + metricSpacing) * 2 + metricWidth / 2, metricsY + 25);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${data.projectedMonthlyIncome.toLocaleString()}`, 50 + (metricWidth + metricSpacing) * 2 + metricWidth / 2, metricsY + 70);

    // Monthly surplus
    ctx.fillStyle = data.monthlySurplus >= 0 ? '#e8f5e9' : '#ffebee';
    ctx.fillRect(50 + (metricWidth + metricSpacing) * 3, metricsY, metricWidth, 100);
    ctx.strokeStyle = data.monthlySurplus >= 0 ? '#4caf50' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(50 + (metricWidth + metricSpacing) * 3, metricsY, metricWidth, 100);
    ctx.fillStyle = data.monthlySurplus >= 0 ? '#4caf50' : '#e74c3c';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Monthly Surplus', 50 + (metricWidth + metricSpacing) * 3 + metricWidth / 2, metricsY + 25);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${data.monthlySurplus.toLocaleString()}`, 50 + (metricWidth + metricSpacing) * 3 + metricWidth / 2, metricsY + 70);

    // Growth projection chart
    const chartY = 250;
    const chartX = 100;
    const chartHeight = 350;
    const chartWidth = 1000;

    // Chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }

    // Projection line
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.beginPath();

    const currentTotal = data.currentSuper + data.currentSavings + data.currentShares + data.currentProperties;
    const points = 20;
    
    for (let i = 0; i <= points; i++) {
      const year = (yearsToRetirement / points) * i;
      // Simplified growth calculation
      const value = currentTotal * Math.pow(1.07, year);
      const x = chartX + (i / points) * chartWidth;
      const y = chartY + chartHeight - (value / data.projectedLumpSum) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Current value point
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(chartX, chartY + chartHeight, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Current: $${currentTotal.toLocaleString()}`, chartX + 15, chartY + chartHeight + 5);

    // Projected value point
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(chartX + chartWidth, chartY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Projected: $${data.projectedLumpSum.toLocaleString()}`, chartX + chartWidth - 15, chartY - 10);

    // X-axis labels
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${data.currentAge}`, chartX, chartY + chartHeight + 25);
    ctx.fillText(`${data.retirementAge}`, chartX + chartWidth, chartY + chartHeight + 25);

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = (data.projectedLumpSum / 5) * i;
      const y = chartY + chartHeight - (i / 5) * chartHeight;
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, chartX - 15, y + 4);
    }

    // Asset breakdown (bottom)
    const breakdownY = 650;
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Current Asset Breakdown', 50, breakdownY);

    const assetBreakdown = [
      { label: 'Superannuation', value: data.currentSuper, color: '#3498db' },
      { label: 'Savings', value: data.currentSavings, color: '#2ecc71' },
      { label: 'Shares', value: data.currentShares, color: '#f39c12' },
      { label: 'Properties', value: data.currentProperties, color: '#e74c3c' },
    ].filter(item => item.value > 0);

    const breakdownTotal = assetBreakdown.reduce((sum, item) => sum + item.value, 0);
    let breakdownX = 50;
    assetBreakdown.forEach((item, index) => {
      const width = (item.value / breakdownTotal) * 1100;
      
      ctx.fillStyle = item.color;
      ctx.fillRect(breakdownX, breakdownY + 40, width, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      const percentage = (item.value / breakdownTotal) * 100;
      ctx.fillText(`${item.label}: ${percentage.toFixed(1)}%`, breakdownX + width / 2, breakdownY + 63);
      
      breakdownX += width;
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating detailed retirement chart:', error);
    return '';
  }
}

/**
 * Generate tax optimization chart
 */
export async function generateTaxOptimizationChart(data: {
  currentTax: number;
  optimizedTax: number;
  taxSavings: number;
  strategies: string[];
}): Promise<string> {
  try {
    if (typeof document === 'undefined') {
      console.warn('Document not available, cannot generate chart');
      return '';
    }

    const canvas = document.createElement('canvas');
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
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tax Optimization Analysis', canvas.width / 2, 45);

    // Comparison bars
    const barY = 120;
    const barWidth = 300;
    const barHeight = 400;
    const maxTax = Math.max(data.currentTax, data.optimizedTax) * 1.2;

    // Current tax bar
    const currentBarHeight = (data.currentTax / maxTax) * barHeight;
    const currentBarY = barY + barHeight - currentBarHeight;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(200, currentBarY, barWidth, currentBarHeight);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, currentBarY, barWidth, currentBarHeight);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Current Tax', 200 + barWidth / 2, barY + barHeight + 30);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`$${data.currentTax.toLocaleString()}`, 200 + barWidth / 2, barY + barHeight + 65);

    // Optimized tax bar
    const optimizedBarHeight = (data.optimizedTax / maxTax) * barHeight;
    const optimizedBarY = barY + barHeight - optimizedBarHeight;
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(700, optimizedBarY, barWidth, optimizedBarHeight);
    ctx.strokeStyle = '#229954';
    ctx.lineWidth = 3;
    ctx.strokeRect(700, optimizedBarY, barWidth, optimizedBarHeight);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Optimized Tax', 700 + barWidth / 2, barY + barHeight + 30);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`$${data.optimizedTax.toLocaleString()}`, 700 + barWidth / 2, barY + barHeight + 65);

    // Savings highlight
    const savingsY = 650;
    ctx.fillStyle = '#fff3e0';
    ctx.fillRect(250, savingsY, 700, 100);
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 4;
    ctx.strokeRect(250, savingsY, 700, 100);

    ctx.fillStyle = '#ff9800';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Potential Annual Tax Savings', canvas.width / 2, savingsY + 35);
    ctx.font = 'bold 42px Arial';
    ctx.fillText(`$${data.taxSavings.toLocaleString()}`, canvas.width / 2, savingsY + 80);

    // Strategies list
    if (data.strategies && data.strategies.length > 0) {
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Optimization Strategies:', 100, 780);

      data.strategies.forEach((strategy, index) => {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(100, 810 + index * 30, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.fillText(strategy, 120, 815 + index * 30);
      });
    }

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating tax optimization chart:', error);
    return '';
  }
}
