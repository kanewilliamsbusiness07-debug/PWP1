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
    paddingBottom: 60,
    paddingTop: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomStyle: 'solid',
    borderBottomColor: '#2563eb',
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
    minHeight: 0,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
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
    minHeight: 0,
  },
  chart: {
    width: 515,
    maxHeight: 650,
    marginBottom: 15,
    alignSelf: 'center',
    maxWidth: 515,
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
  retirementSurplusBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  retirementSurplusLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  retirementSurplusValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  retirementSurplusSubtext: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  taxStrategyTable: {
    width: '100%',
    marginVertical: 15,
  },
  taxStrategyRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
  },
  taxStrategyHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#3498db',
  },
  taxStrategyCell: {
    fontSize: 10,
    color: '#333',
    flex: 1,
  },
  taxStrategyCellLabel: {
    fontSize: 10,
    color: '#333',
    flex: 1.5,
    fontWeight: 'bold',
  },
  taxStrategyCellAmount: {
    fontSize: 10,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  taxStrategyCellSaving: {
    fontSize: 10,
    color: '#4caf50',
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  taxStrategyCellExplanation: {
    fontSize: 9,
    color: '#666',
    flex: 2,
    fontStyle: 'italic',
  },
  expandedRecommendation: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#2196f3',
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  recommendationDetail: {
    fontSize: 10,
    color: '#333',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  recommendationLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 6,
    marginBottom: 2,
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
  projectedRetirementNetWorth?: number;
  projectedRetirementMonthlyCashFlow?: number;
  projectedRetirementSurplus?: number;
  projectedPropertyPortfolioValue?: number;
  serviceability?: {
    maxPropertyValue?: number;
    maxMonthlyPayment?: number;
    surplusIncome?: number;
    loanToValueRatio?: number;
    monthlyRentalIncome?: number;
    totalMonthlyExpenses?: number;
    isViable?: boolean;
    reason?: string;
  };
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

// Header component to reuse
const ReportHeader = ({ reportDate, clientFullName }: { reportDate: string; clientFullName: string }) => (
  <View style={styles.header} fixed>
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
);

// Footer component to reuse
const ReportFooter = ({ reportDate }: { reportDate: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Generated on {reportDate} | Perpetual Wealth Partners
    </Text>
  </View>
);

// CRITICAL: Export as named function component
export function PDFReport({ summary, chartImages, clientData }: PDFReportProps) {
  // Sanitize all data
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
  const detailedCashFlowChart = getChartByType('detailedCashFlow');
  const financialPositionChart = getChartByType('financialPosition');
  const detailedRetirementChart = getChartByType('detailedRetirement');
  const taxOptimizationChart = getChartByType('taxOptimization');

  // Calculate retirement projections
  const projectedRetirementNetWorth = safeNumber(safeSummary.projectedRetirementNetWorth, netWorth * 1.5);
  const projectedRetirementMonthlyCashFlow = safeNumber(safeSummary.projectedRetirementMonthlyCashFlow, monthlyCashFlow * 0.8);
  const projectedRetirementSurplus = safeNumber(safeSummary.projectedRetirementSurplus, retirementDeficitSurplus);
  const projectedPropertyPortfolioValue = safeNumber(safeSummary.projectedPropertyPortfolioValue, totalPropertyValue * 1.3);
  
  // Serviceability data
  const serviceability = safeSummary.serviceability || {};
  const maxPropertyValue = safeNumber(serviceability.maxPropertyValue, 0);
  const surplusIncome = safeNumber(serviceability.surplusIncome, 0);
  const monthlyRentalIncome = safeNumber(serviceability.monthlyRentalIncome, 0);
  const isViable = safeBoolean(serviceability.isViable, false);

  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  const clientFullName = `${safeString(safeClient.firstName)} ${safeString(safeClient.lastName)}`.trim() || clientName;

  // Generate expanded recommendation
  const expandRecommendation = (recText: string, index: number) => {
    const lowerRec = recText.toLowerCase();
    
    if (lowerRec.includes('super') || lowerRec.includes('superannuation')) {
      const superAmount = Math.min(monthlyIncome * 0.15 * 12, 27500);
      const superTaxSaving = superAmount * 0.175;
      return {
        title: recText,
        action: `Implement salary sacrifice of ${formatCurrency(superAmount)}/year to superannuation`,
        benefit: `Reduce taxable income by ${formatCurrency(superAmount)}, saving approximately ${formatCurrency(superTaxSaving)} in tax annually`,
        timeline: 'Set up with employer within 30 days',
        impact: `Increases projected retirement fund from ${formatCurrency(projectedRetirementLumpSum)} to approximately ${formatCurrency(projectedRetirementLumpSum * 1.2)} (20% increase)`
      };
    }
    
    if (lowerRec.includes('property') || lowerRec.includes('investment property')) {
      return {
        title: recText,
        action: 'Research properties in growth suburbs with strong rental yields',
        benefit: `Negative gearing can save approximately ${formatCurrency(taxSavings * 0.3)}/year in tax, plus capital growth potential`,
        timeline: '6-12 months for property purchase',
        requirements: `Save additional deposit, obtain pre-approval for loan up to ${formatCurrency(maxPropertyValue > 0 ? maxPropertyValue : totalPropertyValue * 1.5)}`,
        impact: 'Build equity and passive income stream while benefiting from tax deductions'
      };
    }
    
    if (lowerRec.includes('work') || lowerRec.includes('deduction')) {
      return {
        title: recText,
        action: 'Maximize claimable work-related expenses including home office, professional development, and tools',
        benefit: `Additional deductions of ${formatCurrency(monthlyExpenses * 0.2 * 12)}/year could save approximately ${formatCurrency(monthlyExpenses * 0.2 * 12 * 0.325)} in tax`,
        timeline: 'Immediate - claim in next tax return',
        requirements: 'Ensure proper documentation and receipts for all expenses',
        impact: 'Reduce taxable income and improve cash flow through tax refunds'
      };
    }
    
    if (lowerRec.includes('portfolio') || lowerRec.includes('allocation') || lowerRec.includes('share')) {
      return {
        title: recText,
        action: 'Review and rebalance investment portfolio to optimize returns and risk',
        benefit: 'Better diversification reduces risk while maintaining growth potential',
        timeline: '3-6 months for portfolio review and adjustment',
        requirements: 'Consult with financial advisor for personalized asset allocation strategy',
        impact: 'Improved risk-adjusted returns and better alignment with retirement goals'
      };
    }
    
    if (lowerRec.includes('health') || lowerRec.includes('insurance')) {
      return {
        title: recText,
        action: 'Consider private health insurance to avoid Medicare Levy Surcharge',
        benefit: `Save approximately ${formatCurrency(monthlyIncome * 12 * 0.01)}/year in Medicare Levy Surcharge`,
        timeline: 'Enroll before June 30 to avoid surcharge in following tax year',
        requirements: 'Compare policies and select appropriate level of cover',
        impact: 'Avoid surcharge while gaining access to private healthcare'
      };
    }
    
    return {
      title: recText,
      action: 'Review current financial strategy and implement improvements',
      benefit: 'Optimize financial position for long-term wealth accumulation',
      timeline: 'Within 90 days',
      impact: 'Enhanced financial security and retirement readiness'
    };
  };

  return (
    <Document>
      {/* PAGE 1: Executive Summary + Income Analysis + Expense Breakdown */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          
          <View style={{ marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, padding: 10, backgroundColor: '#f8f9fa' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Current Net Worth</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2c3e50' }}>
                  {formatCurrency(netWorth)}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Projected at Retirement</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#27ae60' }}>
                  {formatCurrency(projectedRetirementNetWorth)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, padding: 10, backgroundColor: '#f8f9fa' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Current Monthly Cash Flow</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {formatCurrency(monthlyCashFlow)}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Projected at Retirement</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: projectedRetirementMonthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {formatCurrency(projectedRetirementMonthlyCashFlow)}
                </Text>
              </View>
            </View>
          </View>

          <View style={[
            styles.retirementSurplusBox,
            { backgroundColor: projectedRetirementSurplus >= 0 ? '#e8f5e9' : '#ffebee' }
          ]}>
            <Text style={styles.retirementSurplusLabel}>Projected Retirement Surplus</Text>
            <View style={{ height: 45, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[
                styles.retirementSurplusValue,
                { color: projectedRetirementSurplus >= 0 ? '#27ae60' : '#e74c3c' }
              ]}>
                {formatCurrency(projectedRetirementSurplus)}
              </Text>
            </View>
            <View style={{ height: 20, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.retirementSurplusSubtext}>
                {projectedRetirementSurplus >= 0 
                  ? 'You are on track for a comfortable retirement'
                  : 'Action required to meet retirement goals'}
              </Text>
            </View>
          </View>

          <View style={{ marginBottom: 10, padding: 12, backgroundColor: '#e3f2fd', borderRadius: 5 }}>
            <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Property Portfolio at Retirement</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2196f3' }}>
              {formatCurrency(projectedPropertyPortfolioValue)}
            </Text>
            <Text style={{ fontSize: 9, color: '#7f8c8d', marginTop: 4 }}>
              Current: {formatCurrency(totalPropertyValue)} | Equity: {formatCurrency(propertyEquity)}
            </Text>
          </View>
        </View>

        {/* Income Analysis */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Income Analysis</Text>
          {incomeChart && (
            <View style={styles.chartContainer}>
              <Image src={incomeChart} style={styles.chart} cache={false} />
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
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          {expenseChart && (
            <View style={styles.chartContainer}>
              <Image src={expenseChart} style={styles.chart} cache={false} />
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

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 2: Financial Position + Investment Property + Cash Flow */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />

        {/* Detailed Financial Position */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Financial Position</Text>
          {financialPositionChart ? (
            <View style={styles.chartContainer}>
              <Image src={financialPositionChart} style={[styles.chart, { maxHeight: 380, width: 515 }]} cache={false} />
            </View>
          ) : assetChart ? (
            <View style={styles.chartContainer}>
              <Image src={assetChart} style={[styles.chart, { maxHeight: 380, width: 515 }]} cache={false} />
            </View>
          ) : null}
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>Understanding Your Financial Position</Text>
            <Text style={styles.explanationText}>
              Your total assets of {formatCurrency(totalAssets)} are offset by 
              liabilities of {formatCurrency(totalLiabilities)}, resulting in a net worth 
              of {formatCurrency(netWorth)}.{'\n\n'}
              • Asset allocation: Diversification across property, superannuation, and investments{'\n'}
              • Debt-to-asset ratio: {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}% 
              (lower is generally better){'\n'}
              • Equity ratio: {totalAssets > 0 ? ((netWorth / totalAssets) * 100).toFixed(1) : 0}%{'\n'}
              • Recommendation: Focus on building assets while strategically managing debt
            </Text>
          </View>
        </View>

        {/* Investment Property Potential */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Investment Property Potential</Text>
          {isViable && maxPropertyValue > 0 ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { fontSize: 18, color: '#2196f3' }]}>
                    {formatCurrency(maxPropertyValue)}
                  </Text>
                  <Text style={styles.metricLabel}>Max Property Value</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { fontSize: 18, color: '#4caf50' }]}>
                    {formatCurrency(surplusIncome)}
                  </Text>
                  <Text style={styles.metricLabel}>Monthly Surplus</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { fontSize: 18, color: '#ff9800' }]}>
                    {formatCurrency(monthlyRentalIncome)}
                  </Text>
                  <Text style={styles.metricLabel}>Expected Rental Income</Text>
                </View>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.explanationText}>
                  Based on your surplus income above the 70% retention threshold, you have capacity to service an investment property. 
                  The calculation assumes an {safeNumber(serviceability.loanToValueRatio, 0.8) * 100}% loan-to-value ratio and conservative rental yield assumptions.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.explanationTitle}>Limited Investment Potential</Text>
              <Text style={styles.explanationText}>
                {serviceability.reason || 'There is insufficient surplus income available for investment property serviceability after ensuring 70% of your current income in retirement.'}
              </Text>
            </View>
          )}
        </View>

        {/* Detailed Cash Flow Analysis */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Cash Flow Breakdown</Text>
          {detailedCashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={detailedCashFlowChart} style={[styles.chart, { maxHeight: 350, width: 515 }]} cache={false} />
            </View>
          ) : cashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={cashFlowChart} style={[styles.chart, { maxHeight: 350, width: 515 }]} cache={false} />
            </View>
          ) : null}
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

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 3: Detailed Retirement Projection */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Retirement Projection</Text>
          {detailedRetirementChart ? (
            <View style={[styles.chartContainer, { marginBottom: 10 }]}>
              <Image src={detailedRetirementChart} style={[styles.chart, { maxHeight: 450, width: 515 }]} cache={false} />
            </View>
          ) : retirementChart ? (
            <View style={[styles.chartContainer, { marginBottom: 10 }]}>
              <Image src={retirementChart} style={[styles.chart, { maxHeight: 450, width: 515 }]} cache={false} />
            </View>
          ) : null}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            marginTop: 10,
            marginBottom: 15,
            paddingHorizontal: 20,
            width: '90%',
            alignSelf: 'center',
            maxWidth: 475
          }}>
            <View style={{ alignItems: 'center', flex: 1, minWidth: 140 }}>
              <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 6 }}>Years to Retirement</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2196f3' }}>
                {yearsToRetirement}
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1, minWidth: 140 }}>
              <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 6 }}>Projected Lump Sum</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4caf50' }}>
                {formatCurrency(projectedRetirementLumpSum)}
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1, minWidth: 140 }}>
              <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 6 }}>Monthly Surplus</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: projectedRetirementSurplus >= 0 ? '#4caf50' : '#e74c3c' }}>
                {formatCurrency(projectedRetirementSurplus)}
              </Text>
            </View>
          </View>
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

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 4: Tax Optimization Analysis */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Tax Optimization Analysis</Text>
          
          <View style={{ 
            backgroundColor: taxSavings > 0 ? '#e8f5e9' : '#f8f9fa', 
            padding: 15, 
            borderRadius: 5, 
            marginBottom: 15,
            borderLeftWidth: 4,
            borderLeftStyle: 'solid',
            borderLeftColor: taxSavings > 0 ? '#4caf50' : '#3498db'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Current Annual Tax</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2c3e50' }}>
                  {formatCurrency(currentTax)}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Optimized Annual Tax</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4caf50' }}>
                  {formatCurrency(optimizedTax)}
                </Text>
              </View>
            </View>
            <View style={{ 
              paddingTop: 10, 
              borderTopWidth: 1, 
              borderTopStyle: 'solid', 
              borderTopColor: '#e0e0e0',
              marginTop: 10
            }}>
              <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Potential Annual Savings</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ff9800' }}>
                {formatCurrency(taxSavings)}
              </Text>
            </View>
          </View>

          {taxOptimizationChart && (
            <View style={styles.chartContainer}>
              <Image src={taxOptimizationChart} style={[styles.chart, { maxHeight: 300, width: 515 }]} cache={false} />
            </View>
          )}

          {taxSavings > 0 && (
            <View style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 }}>
                Tax Optimization Strategies
              </Text>
              
              <View style={styles.taxStrategyTable}>
                <View style={styles.taxStrategyHeader}>
                  <Text style={[styles.taxStrategyCell, { fontWeight: 'bold', flex: 1.5 }]}>Strategy</Text>
                  <Text style={[styles.taxStrategyCell, { fontWeight: 'bold', flex: 1, textAlign: 'right' }]}>Amount</Text>
                  <Text style={[styles.taxStrategyCell, { fontWeight: 'bold', flex: 1, textAlign: 'right' }]}>Tax Saving</Text>
                  <Text style={[styles.taxStrategyCell, { fontWeight: 'bold', flex: 2 }]}>Explanation</Text>
                </View>

                {taxSavings > 0 && (
                  <View style={styles.taxStrategyRow}>
                    <Text style={styles.taxStrategyCellLabel}>1. Salary Sacrifice to Super</Text>
                    <Text style={styles.taxStrategyCellAmount}>
                      {formatCurrency(Math.min(taxSavings * 3, monthlyIncome * 12 * 0.15))}
                    </Text>
                    <Text style={styles.taxStrategyCellSaving}>
                      {formatCurrency(Math.min(taxSavings * 0.5, (monthlyIncome * 12 * 0.15) * 0.235))}
                    </Text>
                    <Text style={styles.taxStrategyCellExplanation}>
                      Reduces taxable income through pre-tax super contributions. Taxed at 15% instead of marginal rate (typically 32.5-45%).
                    </Text>
                  </View>
                )}

                {monthlyExpenses < monthlyIncome * 0.8 && (
                  <View style={styles.taxStrategyRow}>
                    <Text style={styles.taxStrategyCellLabel}>2. Negative Gearing Benefits</Text>
                    <Text style={styles.taxStrategyCellAmount}>
                      {formatCurrency(Math.min(taxSavings * 2, monthlyIncome * 2))}
                    </Text>
                    <Text style={styles.taxStrategyCellSaving}>
                      {formatCurrency(Math.min(taxSavings * 0.3, (monthlyIncome * 2) * 0.325))}
                    </Text>
                    <Text style={styles.taxStrategyCellExplanation}>
                      Investment property losses offset taxable income. Deductible expenses include interest, repairs, and depreciation.
                    </Text>
                  </View>
                )}

                <View style={styles.taxStrategyRow}>
                  <Text style={styles.taxStrategyCellLabel}>3. Work-Related Deductions</Text>
                  <Text style={styles.taxStrategyCellAmount}>
                    {formatCurrency(Math.max(0, taxSavings * 1.5))}
                  </Text>
                  <Text style={styles.taxStrategyCellSaving}>
                    {formatCurrency(Math.max(0, taxSavings * 0.2))}
                  </Text>
                  <Text style={styles.taxStrategyCellExplanation}>
                    Claim eligible expenses: home office, professional development, tools, uniforms, and travel. Ensure proper documentation.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {taxSavings <= 0 && (
            <View style={styles.recommendationBox}>
              <Text style={styles.explanationTitle}>Tax Optimization Opportunities</Text>
              <Text style={styles.explanationText}>
                Your current annual tax is {formatCurrency(currentTax)}. Consider the following strategies to optimize your tax position:{'\n\n'}
                • Salary sacrifice to superannuation: Reduce taxable income by up to $27,500/year (inclusive of employer contributions){'\n'}
                • Negative gearing: Investment property expenses can offset other income{'\n'}
                • Maximize deductions: Ensure all work-related, investment, and rental expenses are properly claimed{'\n'}
                • Income splitting: Where possible, distribute income to lower-earning family members
              </Text>
            </View>
          )}
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 5: Recommendations & Action Items */}
      {recommendations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />

          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Recommendations & Action Items</Text>
            {recommendations.map((rec, index) => {
              const expanded = expandRecommendation(rec, index);
              
              return (
                <View key={index} style={styles.expandedRecommendation}>
                  <Text style={styles.recommendationTitle}>
                    {index + 1}. {expanded.title}
                  </Text>
                  <Text style={styles.recommendationLabel}>Action:</Text>
                  <Text style={styles.recommendationDetail}>
                    {expanded.action}
                  </Text>
                  <Text style={styles.recommendationLabel}>Benefit:</Text>
                  <Text style={styles.recommendationDetail}>
                    {expanded.benefit}
                  </Text>
                  {expanded.timeline && (
                    <>
                      <Text style={styles.recommendationLabel}>Timeline:</Text>
                      <Text style={styles.recommendationDetail}>
                        {expanded.timeline}
                      </Text>
                    </>
                  )}
                  {expanded.requirements && (
                    <>
                      <Text style={styles.recommendationLabel}>Requirements:</Text>
                      <Text style={styles.recommendationDetail}>
                        {expanded.requirements}
                      </Text>
                    </>
                  )}
                  <Text style={styles.recommendationLabel}>Impact:</Text>
                  <Text style={styles.recommendationDetail}>
                    {expanded.impact}
                  </Text>
                </View>
              );
            })}
          </View>

          <ReportFooter reportDate={reportDate} />
        </Page>
      )}
    </Document>
  );
}
