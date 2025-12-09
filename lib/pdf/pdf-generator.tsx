/**
 * Professional PDF Report Generator
 * Clean structure - NO duplication, explicit pages only
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Professional PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 80,
    paddingBottom: 60,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 40,
    right: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  reportDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 3,
  },
  clientName: {
    fontSize: 10,
    color: '#333',
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#3498db',
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333',
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  summaryBox: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    marginBottom: 15,
    marginRight: '2%',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 0,
  },
  retirementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    marginBottom: 20,
  },
  retirementBox: {
    width: '23%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    marginRight: '1.5%',
    marginBottom: 10,
  },
  boxLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 6,
  },
  boxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  chartContainer: {
    width: '100%',
    height: 250,
    marginTop: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  chart: {
    width: 515,
    maxHeight: 250,
    alignSelf: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  tableCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
  },
  tableCellContent: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.4,
    flex: 1,
  },
  recommendation: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
  },
  recNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  recSection: {
    marginBottom: 8,
  },
  recLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 3,
  },
  recText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  bulletPoints: {
    marginTop: 10,
  },
  bullet: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
    marginBottom: 4,
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
  taxSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  taxBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  savingsBox: {
    backgroundColor: '#fff3e0',
  },
  taxLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  taxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  savingsValue: {
    color: '#ff9800',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 10,
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
});

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
    surplusIncome?: number;
    monthlyRentalIncome?: number;
    isViable?: boolean;
    reason?: string;
    loanToValueRatio?: number;
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

const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '$0.00';
  }
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
};

const safeBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const safeArray = (value: any, defaultValue: any[] = []): any[] => {
  if (!Array.isArray(value)) return defaultValue;
  return value.map(item => safeString(item)).filter(item => item.length > 0);
};

const isValidChartImage = (chart: any): boolean => {
  if (!chart || typeof chart !== 'object') return false;
  if (!chart.dataUrl || typeof chart.dataUrl !== 'string') return false;
  if (!chart.dataUrl.startsWith('data:image/')) return false;
  return true;
};

// Header Component - Single source of truth
const ReportHeader = ({ reportDate, clientFullName }: { reportDate: string; clientFullName: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.companyName}>Perpetual Wealth Partners</Text>
    <Text style={styles.reportDate}>Report Date: {reportDate}</Text>
    <Text style={styles.clientName}>Prepared for: {clientFullName}</Text>
  </View>
);

// Footer Component - Single source of truth
const ReportFooter = ({ reportDate }: { reportDate: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Generated on {reportDate} | Perpetual Wealth Partners
    </Text>
  </View>
);

// Main PDF Report Component - CLEAN STRUCTURE, NO DUPLICATION
export function PDFReport({ summary, chartImages, clientData }: PDFReportProps) {
  // Sanitize data ONCE
  const safeSummary: PDFSummary = summary || {};
  const safeCharts: PDFChartImage[] = Array.isArray(chartImages) ? chartImages : [];
  const safeClient: PDFClientData = clientData || {};

  // Extract values ONCE
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
  const totalPropertyValue = safeNumber(safeSummary.totalPropertyValue, 0);
  const propertyEquity = safeNumber(safeSummary.propertyEquity, 0);
  const recommendations = safeArray(safeSummary.recommendations, []);

  const projectedRetirementNetWorth = safeNumber(safeSummary.projectedRetirementNetWorth, netWorth * 1.5);
  const projectedRetirementMonthlyCashFlow = safeNumber(safeSummary.projectedRetirementMonthlyCashFlow, monthlyCashFlow * 0.8);
  const projectedRetirementSurplus = safeNumber(safeSummary.projectedRetirementSurplus, retirementDeficitSurplus);
  const projectedPropertyPortfolioValue = safeNumber(safeSummary.projectedPropertyPortfolioValue, totalPropertyValue * 1.3);

  const serviceability = safeSummary.serviceability || {};
  const maxPropertyValue = safeNumber(serviceability.maxPropertyValue, 0);
  const surplusIncome = safeNumber(serviceability.surplusIncome, 0);
  const monthlyRentalIncome = safeNumber(serviceability.monthlyRentalIncome, 0);
  const isViable = safeBoolean(serviceability.isViable, false);

  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  const clientFullName = `${safeString(safeClient.firstName)} ${safeString(safeClient.lastName)}`.trim() || clientName;

  // Get charts ONCE - no loops
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

  // Helper to expand recommendations - called inline, no duplication
  const expandRecommendation = (recText: string): any => {
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

  // SINGLE DOCUMENT - NO DUPLICATION
  return (
    <Document>
      {/* PAGE 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.pageTitle}>Executive Summary</Text>
        
        <View style={styles.summaryGrid} wrap={false}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Current Net Worth</Text>
            <Text style={styles.summaryValue}>{formatCurrency(netWorth)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Projected at Retirement</Text>
            <Text style={styles.summaryValue}>{formatCurrency(projectedRetirementNetWorth)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Current Monthly Cash Flow</Text>
            <Text style={[styles.summaryValue, { fontSize: 22, color: monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }]}>
              {formatCurrency(monthlyCashFlow)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Projected at Retirement</Text>
            <Text style={[styles.summaryValue, { fontSize: 22, color: projectedRetirementMonthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }]}>
              {formatCurrency(projectedRetirementMonthlyCashFlow)}
            </Text>
          </View>
        </View>

        <View style={[
          styles.retirementSurplusBox,
          { backgroundColor: projectedRetirementSurplus >= 0 ? '#e8f5e9' : '#ffebee' }
        ]} wrap={false}>
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

        <View style={{ padding: 12, backgroundColor: '#e3f2fd', borderRadius: 5 }} wrap={false}>
          <Text style={{ fontSize: 10, color: '#7f8c8d', marginBottom: 4 }}>Property Portfolio at Retirement</Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2196f3' }}>
            {formatCurrency(projectedPropertyPortfolioValue)}
          </Text>
          <Text style={{ fontSize: 9, color: '#7f8c8d', marginTop: 4 }}>
            Current: {formatCurrency(totalPropertyValue)} | Equity: {formatCurrency(propertyEquity)}
          </Text>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 2: Income & Expenses */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
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

        <View style={[styles.section, { marginTop: 30 }]} wrap={false}>
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

      {/* PAGE 3: Financial Position & Cash Flow */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Financial Position</Text>
          {financialPositionChart ? (
            <View style={styles.chartContainer}>
              <Image src={financialPositionChart} style={[styles.chart, { maxHeight: 350 }]} cache={false} />
            </View>
          ) : assetChart ? (
            <View style={styles.chartContainer}>
              <Image src={assetChart} style={[styles.chart, { maxHeight: 350 }]} cache={false} />
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

        <View style={[styles.section, { marginTop: 20 }]} wrap={false}>
          <Text style={styles.sectionTitle}>Investment Property Potential</Text>
          {isViable && maxPropertyValue > 0 ? (
            <View style={styles.highlightBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2196f3' }}>{formatCurrency(maxPropertyValue)}</Text>
                  <Text style={{ fontSize: 9, color: '#666' }}>Max Property Value</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4caf50' }}>{formatCurrency(surplusIncome)}</Text>
                  <Text style={{ fontSize: 9, color: '#666' }}>Monthly Surplus</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ff9800' }}>{formatCurrency(monthlyRentalIncome)}</Text>
                  <Text style={{ fontSize: 9, color: '#666' }}>Expected Rental</Text>
                </View>
              </View>
              <Text style={styles.explanationText}>
                Based on your surplus income above the 70% retention threshold, you have capacity to service an investment property.
              </Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.explanationTitle}>Limited Investment Potential</Text>
              <Text style={styles.explanationText}>
                {serviceability.reason || 'There is insufficient surplus income available for investment property serviceability after ensuring 70% of your current income in retirement.'}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { marginTop: 20 }]} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Cash Flow Breakdown</Text>
          {detailedCashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={detailedCashFlowChart} style={[styles.chart, { maxHeight: 250 }]} cache={false} />
            </View>
          ) : cashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={cashFlowChart} style={[styles.chart, { maxHeight: 250 }]} cache={false} />
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

      {/* PAGE 4: Retirement Projection */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.sectionTitle}>Detailed Retirement Projection</Text>

        <View style={styles.retirementGrid} wrap={false}>
          <View style={styles.retirementBox}>
            <Text style={styles.boxLabel}>Years to Retirement</Text>
            <Text style={styles.boxValue}>{yearsToRetirement}</Text>
          </View>
          <View style={styles.retirementBox}>
            <Text style={styles.boxLabel}>Projected Lump Sum</Text>
            <Text style={[styles.boxValue, { fontSize: 14 }]}>{formatCurrency(projectedRetirementLumpSum)}</Text>
          </View>
          <View style={styles.retirementBox}>
            <Text style={styles.boxLabel}>Monthly Surplus</Text>
            <Text style={[styles.boxValue, { fontSize: 14, color: projectedRetirementSurplus >= 0 ? '#4caf50' : '#e74c3c' }]}>
              {formatCurrency(projectedRetirementSurplus)}
            </Text>
          </View>
          <View style={styles.retirementBox}>
            <Text style={styles.boxLabel}>Status</Text>
            <Text style={[styles.boxValue, { fontSize: 14, color: isRetirementDeficit ? '#e74c3c' : '#4caf50' }]}>
              {isRetirementDeficit ? 'Alert' : 'On Track'}
            </Text>
          </View>
        </View>

        {detailedRetirementChart ? (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={detailedRetirementChart} style={styles.chart} cache={false} />
          </View>
        ) : retirementChart ? (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={retirementChart} style={styles.chart} cache={false} />
          </View>
        ) : null}

        <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox} wrap={false}>
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

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 5: Tax Optimization */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.sectionTitle}>Tax Optimization Analysis</Text>

        <View style={styles.taxSummaryGrid} wrap={false}>
          <View style={styles.taxBox}>
            <Text style={styles.taxLabel}>Current Annual Tax</Text>
            <Text style={styles.taxValue}>{formatCurrency(currentTax)}</Text>
          </View>
          <View style={styles.taxBox}>
            <Text style={styles.taxLabel}>Optimized Annual Tax</Text>
            <Text style={styles.taxValue}>{formatCurrency(optimizedTax)}</Text>
          </View>
          <View style={[styles.taxBox, styles.savingsBox]}>
            <Text style={styles.taxLabel}>Potential Annual Savings</Text>
            <Text style={[styles.taxValue, styles.savingsValue]}>{formatCurrency(taxSavings)}</Text>
          </View>
        </View>

        {taxOptimizationChart && (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={taxOptimizationChart} style={[styles.chart, { maxHeight: 220 }]} cache={false} />
          </View>
        )}

        {taxSavings > 0 && (
          <View style={{ marginTop: 20 }} wrap={false}>
            <Text style={[styles.subsectionTitle, { marginBottom: 12 }]}>Tax Optimization Strategies</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Strategy</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Amount</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Tax Saving</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Explanation</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCellContent, { flex: 2, fontWeight: 'bold' }]}>1. Salary Sacrifice to Super</Text>
              <Text style={[styles.tableCellContent, { flex: 1 }]}>
                {formatCurrency(Math.min(taxSavings * 3, monthlyIncome * 12 * 0.15))}
              </Text>
              <Text style={[styles.tableCellContent, { flex: 1, color: '#4caf50' }]}>
                {formatCurrency(Math.min(taxSavings * 0.5, (monthlyIncome * 12 * 0.15) * 0.235))}
              </Text>
              <Text style={[styles.tableCellContent, { flex: 2, fontSize: 9 }]}>
                Reduces taxable income through pre-tax super contributions. Taxed at 15% instead of marginal rate.
              </Text>
            </View>

            {monthlyExpenses < monthlyIncome * 0.8 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellContent, { flex: 2, fontWeight: 'bold' }]}>2. Negative Gearing Benefits</Text>
                <Text style={[styles.tableCellContent, { flex: 1 }]}>
                  {formatCurrency(Math.min(taxSavings * 2, monthlyIncome * 2))}
                </Text>
                <Text style={[styles.tableCellContent, { flex: 1, color: '#4caf50' }]}>
                  {formatCurrency(Math.min(taxSavings * 0.3, (monthlyIncome * 2) * 0.325))}
                </Text>
                <Text style={[styles.tableCellContent, { flex: 2, fontSize: 9 }]}>
                  Investment property losses offset taxable income. Deductible expenses include interest, repairs, and depreciation.
                </Text>
              </View>
            )}

            <View style={styles.tableRow}>
              <Text style={[styles.tableCellContent, { flex: 2, fontWeight: 'bold' }]}>3. Work-Related Deductions</Text>
              <Text style={[styles.tableCellContent, { flex: 1 }]}>
                {formatCurrency(Math.max(0, taxSavings * 1.5))}
              </Text>
              <Text style={[styles.tableCellContent, { flex: 1, color: '#4caf50' }]}>
                {formatCurrency(Math.max(0, taxSavings * 0.2))}
              </Text>
              <Text style={[styles.tableCellContent, { flex: 2, fontSize: 9 }]}>
                Claim eligible expenses: home office, professional development, tools, uniforms, and travel.
              </Text>
            </View>
          </View>
        )}

        {taxSavings <= 0 && (
          <View style={styles.warningBox} wrap={false}>
            <Text style={styles.explanationTitle}>Tax Optimization Opportunities</Text>
            <Text style={styles.explanationText}>
              Your current annual tax is {formatCurrency(currentTax)}. Consider the following strategies:{'\n\n'}
              • Salary sacrifice to superannuation: Reduce taxable income by up to $27,500/year{'\n'}
              • Negative gearing: Investment property expenses can offset other income{'\n'}
              • Maximize deductions: Ensure all work-related, investment, and rental expenses are properly claimed
            </Text>
          </View>
        )}

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 6: Recommendations */}
      {recommendations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
          
          <Text style={styles.sectionTitle}>Recommendations & Action Items</Text>

          {recommendations.map((rec, index) => {
            const expanded = expandRecommendation(rec);
            
            return (
              <View key={index} style={styles.recommendation} wrap={false}>
                <Text style={styles.recNumber}>{index + 1}. {expanded.title}</Text>
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Action:</Text>
                  <Text style={styles.recText}>{expanded.action}</Text>
                </View>
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Benefit:</Text>
                  <Text style={styles.recText}>{expanded.benefit}</Text>
                </View>
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Timeline:</Text>
                  <Text style={styles.recText}>{expanded.timeline}</Text>
                </View>
                
                {expanded.requirements && (
                  <View style={styles.recSection}>
                    <Text style={styles.recLabel}>Requirements:</Text>
                    <Text style={styles.recText}>{expanded.requirements}</Text>
                  </View>
                )}
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Impact:</Text>
                  <Text style={styles.recText}>{expanded.impact}</Text>
                </View>
              </View>
            );
          })}

          <ReportFooter reportDate={reportDate} />
        </Page>
      )}
    </Document>
  );
}
