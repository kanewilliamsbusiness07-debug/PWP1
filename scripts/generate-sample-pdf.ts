import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFReport } from '../lib/pdf/pdf-generator';
import fs from 'fs';
import path from 'path';
import * as svgCharts from '../lib/pdf/svg-charts';

async function run() {
  const SAMPLE_PDF_SUMMARY_01 = {
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

  const doc = <PDFReport summary={SAMPLE_PDF_SUMMARY_01} clientData={{ firstName: 'Jane', lastName: 'Doe' }} />;
  const asPdf = pdf(doc);
  const outPath = path.join(__dirname, '..', 'tmp', `sample-report.pdf`);
  // Generate SVG chart images for server-side embedding
  const chartImages: Array<{ type: string; dataUrl: string }> = [];
  try {
    const incomeSvg = svgCharts.createPieChart('Income Breakdown', ['Employment', 'Expenses', 'Surplus'], [SAMPLE_PDF_SUMMARY_01.monthlyIncome, SAMPLE_PDF_SUMMARY_01.monthlyExpenses, SAMPLE_PDF_SUMMARY_01.monthlyCashFlow], undefined, 560, 320, true);
    if (incomeSvg) chartImages.push({ type: 'income', dataUrl: svgCharts.svgToDataUrl(incomeSvg) });

    const assetSvg = svgCharts.createPieChart('Assets vs Liabilities', ['Assets', 'Liabilities'], [SAMPLE_PDF_SUMMARY_01.totalAssets, SAMPLE_PDF_SUMMARY_01.totalLiabilities], undefined, 700, 360, true);
    if (assetSvg) chartImages.push({ type: 'financialPosition', dataUrl: svgCharts.svgToDataUrl(assetSvg) });

    const stacked = svgCharts.createStackedBarChart('Cash Flow Projection', ['Now', 'Retirement'], [{ name: 'Income', values: [SAMPLE_PDF_SUMMARY_01.monthlyIncome, SAMPLE_PDF_SUMMARY_01.projectedRetirementMonthlyCashFlow || SAMPLE_PDF_SUMMARY_01.projectedRetirementSurplus || SAMPLE_PDF_SUMMARY_01.monthlyIncome], color: '#3498db' }], 700, 240);
    if (stacked) chartImages.push({ type: 'cashflow', dataUrl: svgCharts.svgToDataUrl(stacked) });
  } catch (e) {
    console.warn('Failed to generate server SVG charts:', e && (e as any).message ? (e as any).message : e);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  try {
    // Attach chartImages into the PDF document by recreating element with props
    const docWithCharts = <PDFReport summary={SAMPLE_PDF_SUMMARY_01} clientData={{ firstName: 'Jane', lastName: 'Doe' }} chartImages={chartImages} />;
    const instance = pdf(docWithCharts);
    // Use available output methods
    if (typeof instance.toFile === 'function') {
      await (instance as any).toFile(outPath);
    } else if (typeof instance.toBuffer === 'function') {
      const buf = await (instance as any).toBuffer();
      fs.writeFileSync(outPath, buf);
    } else if (typeof instance.toBlob === 'function') {
      // Node may not support Blob -> convert via buffer
      const blob = await (instance as any).toBlob();
      // @ts-ignore - Node doesn't have Blob by default; try to handle
      const arrayBuffer = await (blob.arrayBuffer ? blob.arrayBuffer() : Promise.resolve(null));
      if (arrayBuffer) fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
    } else {
      // fallback to previous instance.toFile if present
      await (asPdf as any).toFile(outPath);
    }
    console.log('Sample PDF written to', outPath);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    process.exitCode = 1;
  }
}

run();
