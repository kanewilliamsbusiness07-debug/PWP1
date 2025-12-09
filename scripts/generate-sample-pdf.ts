import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFReport } from '../lib/pdf/pdf-generator';
import fs from 'fs';
import path from 'path';

async function run() {
  const sampleSummary = {
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

  const doc = <PDFReport summary={sampleSummary} clientData={{ firstName: 'Jane', lastName: 'Doe' }} />;
  const asPdf = pdf(doc);
  const outPath = path.join(__dirname, '..', 'tmp', `sample-report.pdf`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  try {
    await (asPdf as any).toFile(outPath);
    console.log('Sample PDF written to', outPath);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    process.exitCode = 1;
  }
}

run();
