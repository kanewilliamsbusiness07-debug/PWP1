/**
 * Professional PDF Report Generator
 * Creates visually appealing financial reports with charts and clear explanations
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Professional PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60, // Extra space for footer
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerText: {
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  clientInfo: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 25,
    minHeight: 0, // Allow sections to break across pages
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#3498db',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chart: {
    width: 480, // Fit within A4 page width (595 - 40*2 padding = 515, use 480 for safety)
    height: 320, // Maintain 1.5:1 aspect ratio (600x400 original, scaled proportionally)
    marginBottom: 15,
    alignSelf: 'center', // Center the image
  },
  explanation: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#3498db',
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 10,
    color: '#555',
    lineHeight: 1.6,
  },
  bulletPoint: {
    fontSize: 10,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 10,
  },
  table: {
    width: '100%',
    marginVertical: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#2c3e50',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#333',
    paddingHorizontal: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 10,
    height: 30,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  highlightBox: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#4caf50',
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#ff9800',
  },
  recommendationBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#2196f3',
  },
});

// CRITICAL: Define interfaces for props with optional properties
interface PDFSummary {
  clientName?: string;
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  monthlyCashFlow?: number;
  projectedRetirementLumpSum?: number;
  retirementDeficitSurplus?: number;
  isRetirementDeficit?: boolean;
  yearsToRetirement?: number;
  currentTax?: number;
  optimizedTax?: number;
  taxSavings?: number;
  investmentProperties?: number;
  totalPropertyValue?: number;
  totalPropertyDebt?: number;
  propertyEquity?: number;
  recommendations?: string[];
  [key: string]: any;
}

interface PDFChartImage {
  type: string;
  dataUrl: string;
  [key: string]: any;
}

interface PDFClientData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface PDFReportProps {
  summary: PDFSummary;
  chartImages: PDFChartImage[];
  clientData?: PDFClientData;
}

// Helper function to safely format currency
const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '$0.00';
  }
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to safely get string values
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Helper to safely get number values
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
};

// Helper to safely get boolean values
const safeBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

// Helper to safely get array values
const safeArray = (value: any, defaultValue: any[] = []): any[] => {
  if (!Array.isArray(value)) {
    return defaultValue;
  }
  return value.map(item => safeString(item)).filter(item => item.length > 0);
};

// Helper to validate chart image
const isValidChartImage = (chart: any): boolean => {
  if (!chart || typeof chart !== 'object') {
    return false;
  }
  if (!chart.dataUrl || typeof chart.dataUrl !== 'string') {
    return false;
  }
  if (!chart.dataUrl.startsWith('data:image/')) {
    return false;
  }
  return true;
};

// CRITICAL: Export as named function component (not arrow function)
// This ensures the component has proper React component structure that @react-pdf/renderer expects
export function PDFReport({ summary, chartImages, clientData }: PDFReportProps) {
  // CRITICAL: Sanitize all data before using
  const safeSummary: PDFSummary = summary || {};
  const safeCharts: PDFChartImage[] = Array.isArray(chartImages) ? chartImages : [];
  const safeClient: PDFClientData = clientData || {};

  // Extract and sanitize all values
  const clientName = safeString(safeSummary.clientName || safeClient.firstName || safeClient.lastName || 'Client');
  const totalAssets = safeNumber(safeSummary.totalAssets, 0);
  const totalLiabilities = safeNumber(safeSummary.totalLiabilities, 0);
  const netWorth = safeNumber(safeSummary.netWorth, 0);
  const monthlyIncome = safeNumber(safeSummary.monthlyIncome, 0);
  const monthlyExpenses = safeNumber(safeSummary.monthlyExpenses, 0);
  const monthlyCashFlow = safeNumber(safeSummary.monthlyCashFlow, 0);
  const projectedRetirementLumpSum = safeNumber(safeSummary.projectedRetirementLumpSum, 0);
  const retirementDeficitSurplus = safeNumber(safeSummary.retirementDeficitSurplus, 0);
  const isRetirementDeficit = safeBoolean(safeSummary.isRetirementDeficit, false);
  const yearsToRetirement = safeNumber(safeSummary.yearsToRetirement, 0);
  const currentTax = safeNumber(safeSummary.currentTax, 0);
  const optimizedTax = safeNumber(safeSummary.optimizedTax, 0);
  const taxSavings = safeNumber(safeSummary.taxSavings, 0);
  const investmentProperties = safeNumber(safeSummary.investmentProperties, 0);
  const totalPropertyValue = safeNumber(safeSummary.totalPropertyValue, 0);
  const totalPropertyDebt = safeNumber(safeSummary.totalPropertyDebt, 0);
  const propertyEquity = safeNumber(safeSummary.propertyEquity, 0);
  const recommendations = safeArray(safeSummary.recommendations, []);

  // Get chart images by type
  const getChartByType = (type: string): string | null => {
    const chart = safeCharts.find(c => isValidChartImage(c) && c.type === type);
    return chart && chart.dataUrl ? chart.dataUrl : null;
  };

  const incomeChart = getChartByType('income');
  const expenseChart = getChartByType('expenses');
  const assetChart = getChartByType('assets');
  const cashFlowChart = getChartByType('cashflow');
  const retirementChart = getChartByType('retirement');

  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  const clientFullName = `${safeString(safeClient.firstName)} ${safeString(safeClient.lastName)}`.trim() || clientName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.companyName}>Perpetual Wealth Partners</Text>
              <Text style={styles.clientInfo}>
                Report Date: {reportDate}{'\n'}
                Prepared for: {clientFullName}
              </Text>
            </View>
          </View>
          <Text style={styles.reportTitle}>Financial Planning Report</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryBox}>
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#27ae60' }]}>
                {formatCurrency(netWorth)}
              </Text>
              <Text style={styles.metricLabel}>Net Worth</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[
                styles.metricValue,
                { color: monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }
              ]}>
                {formatCurrency(monthlyCashFlow)}
              </Text>
              <Text style={styles.metricLabel}>Monthly Cash Flow</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#3498db' }]}>
                {formatCurrency(taxSavings)}
              </Text>
              <Text style={styles.metricLabel}>Tax Savings Potential</Text>
            </View>
          </View>
        </View>

        {/* Income Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Analysis</Text>
          {incomeChart && (
            <View style={styles.chartContainer}>
              <Image 
                src={incomeChart} 
                style={styles.chart}
                cache={false}
              />
            </View>
          )}
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Understanding Your Income</Text>
            <Text style={styles.explanationText}>
              Your total annual income is {formatCurrency(monthlyIncome * 12)}, 
              which breaks down to {formatCurrency(monthlyIncome)} per month.{'\n\n'}
              • Primary income source: Employment income{'\n'}
              • Additional income streams: Rental and investment income provide diversification{'\n'}
              • Recommendation: Consider increasing passive income sources to build financial resilience
            </Text>
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          {expenseChart && (
            <View style={styles.chartContainer}>
              <Image 
                src={expenseChart} 
                style={styles.chart}
                cache={false}
              />
            </View>
          )}
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Understanding Your Expenses</Text>
            <Text style={styles.explanationText}>
              Your monthly expenses total {formatCurrency(monthlyExpenses)}, 
              representing {monthlyIncome > 0 ? ((monthlyExpenses / monthlyIncome) * 100).toFixed(1) : 0}% 
              of your monthly income.{'\n\n'}
              • Work-related expenses: Tax-deductible expenses that reduce your taxable income{'\n'}
              • Investment expenses: Costs associated with managing your investment portfolio{'\n'}
              • Recommendation: Review expense categories regularly to identify optimization opportunities
            </Text>
          </View>
        </View>

        {/* Assets & Liabilities Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assets & Liabilities Overview</Text>
          {assetChart && (
            <View style={styles.chartContainer}>
              <Image 
                src={assetChart} 
                style={styles.chart}
                cache={false}
              />
            </View>
          )}
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Understanding Your Financial Position</Text>
            <Text style={styles.explanationText}>
              Your total assets of {formatCurrency(totalAssets)} are offset by 
              liabilities of {formatCurrency(totalLiabilities)}, resulting in a net worth 
              of {formatCurrency(netWorth)}.{'\n\n'}
              • Asset allocation: Diversification across property, superannuation, and investments{'\n'}
              • Debt-to-asset ratio: {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}% 
              (lower is generally better){'\n'}
              • Recommendation: Focus on building assets while strategically managing debt
            </Text>
          </View>
        </View>

        {/* Cash Flow Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
          {cashFlowChart && (
            <View style={styles.chartContainer}>
              <Image 
                src={cashFlowChart} 
                style={styles.chart}
                cache={false}
              />
            </View>
          )}
          <View style={monthlyCashFlow >= 0 ? styles.highlightBox : styles.warningBox}>
            <Text style={styles.explanationTitle}>
              {monthlyCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
            </Text>
            <Text style={styles.explanationText}>
              {monthlyCashFlow >= 0 
                ? `You have a positive monthly cash flow of ${formatCurrency(monthlyCashFlow)}, representing a savings rate of ${monthlyIncome > 0 ? ((monthlyCashFlow / monthlyIncome) * 100).toFixed(1) : 0}%. This surplus can be used for investments, debt reduction, or building emergency funds.`
                : `Your monthly expenses exceed income by ${formatCurrency(Math.abs(monthlyCashFlow))}. Consider reviewing expenses, increasing income, or adjusting your financial strategy.`
              }
            </Text>
          </View>
        </View>

        {/* Retirement Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retirement Planning</Text>
          {retirementChart && (
            <View style={styles.chartContainer}>
              <Image 
                src={retirementChart} 
                style={styles.chart}
                cache={false}
              />
            </View>
          )}
          <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox}>
            <Text style={styles.explanationTitle}>
              {isRetirementDeficit ? 'Retirement Planning Alert' : 'Retirement On Track'}
            </Text>
            <Text style={styles.explanationText}>
              {isRetirementDeficit
                ? `Based on current projections, you may face a retirement shortfall. With ${yearsToRetirement} years until retirement, consider increasing superannuation contributions or adjusting your retirement timeline.`
                : `Your retirement planning is on track. Your projected retirement lump sum of ${formatCurrency(projectedRetirementLumpSum)} provides a solid foundation for your retirement years.`
              }
            </Text>
          </View>
        </View>

        {/* Recommendations & Action Items */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations & Action Items</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationBox}>
                <Text style={styles.explanationText}>
                  {index + 1}. {rec}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {reportDate} | Perpetual Wealth Partners
          </Text>
        </View>
      </Page>
    </Document>
  );
}
