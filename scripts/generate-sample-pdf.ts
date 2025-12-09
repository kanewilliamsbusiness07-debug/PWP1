import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFReport } from '../lib/pdf/pdf-generator';
import fs from 'fs';
import path from 'path';
import * as svgCharts from '../lib/pdf/svg-charts';

async function run() {
  const summary = {
    clientName: 'Jane Doe',
    totalAssets: 1200000,
    totalLiabilities: 400000,
    netWorth: 800000,
    monthlyIncome: 10000,
    monthlyExpenses: 6000,
    monthlyCashFlow: 4000,
    projectedRetirementLumpSum: 1200000,
    projectedRetirementSurplus: 2000,
    yearsToRetirement: 20,
    currentTax: 30000,
    optimizedTax: 24000,
    taxSavings: 6000,
    totalPropertyValue: 800000,
    propertyEquity: 400000,
    recommendations: ['Increase super contributions', 'Reduce discretionary spending', 'Consider low-cost index funds']
  };

  const clientData = { firstName: 'Jane', lastName: 'Doe' };
  const outPath = path.join(__dirname, '..', 'tmp', `sample-report.pdf`);
  
  // Generate SVG chart images for server-side embedding
  const chartImages: Array<{ type: string; dataUrl: string }> = [];
  try {
    const incomeSvg = svgCharts.createPieChart('Income Breakdown', ['Employment', 'Expenses', 'Surplus'], [summary.monthlyIncome, summary.monthlyExpenses, summary.monthlyCashFlow], undefined, 560, 320, true);
    if (incomeSvg) chartImages.push({ type: 'income', dataUrl: svgCharts.svgToDataUrl(incomeSvg) });

    const assetSvg = svgCharts.createPieChart('Assets vs Liabilities', ['Assets', 'Liabilities'], [summary.totalAssets, summary.totalLiabilities], undefined, 700, 360, true);
    if (assetSvg) chartImages.push({ type: 'financialPosition', dataUrl: svgCharts.svgToDataUrl(assetSvg) });

    const stacked = svgCharts.createStackedBarChart('Cash Flow Projection', ['Now', 'Retirement'], [{ name: 'Income', values: [summary.monthlyIncome, summary.projectedRetirementSurplus || summary.monthlyIncome], color: '#3498db' }], 700, 240);
    if (stacked) chartImages.push({ type: 'cashflow', dataUrl: svgCharts.svgToDataUrl(stacked) });
  } catch (e) {
    console.warn('Failed to generate server SVG charts:', e && (e as any).message ? (e as any).message : e);
  }
  
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  
  try {
    // PDFReport already returns a Document component, so we pass it directly to pdf()
    const pdfDoc = PDFReport({ summary, clientData, chartImages });
    const instance = pdf(pdfDoc);
    
    // Use available output methods
    if (typeof (instance as any).toFile === 'function') {
      await (instance as any).toFile(outPath);
    } else if (typeof (instance as any).toBuffer === 'function') {
      const buf = await (instance as any).toBuffer();
      fs.writeFileSync(outPath, buf);
    } else {
      // Fallback to toBlob for browser environments
      const blob = await (instance as any).toBlob();
      // Handle blob -> buffer conversion if needed
      if (blob && typeof blob === 'object') {
        const arrayBuffer = await (blob as any).arrayBuffer?.();
        if (arrayBuffer) {
          fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
        }
      }
    }
    console.log('✓ Sample PDF written to', outPath);
  } catch (err) {
    console.error('✗ Failed to generate PDF:', err);
    process.exitCode = 1;
  }
}

run();
