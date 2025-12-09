/**
 * Premium Financial Report PDF Generator
 * Professional design with rich data visualizations
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Premium Professional PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingTop: 90,
    paddingBottom: 70,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 50,
    right: 50,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#2c3e50',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  clientName: {
    fontSize: 10,
    color: '#333',
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#3498db',
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#34495e',
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#555',
    marginBottom: 8,
  },
  comparisonBox: {
    width: '48%',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  comparisonValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  arrow: {
    fontSize: 24,
    color: '#7f8c8d',
    textAlign: 'center',
    marginVertical: 10,
  },
  surplusBox: {
    padding: 25,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftStyle: 'solid',
    borderLeftColor: '#27ae60',
    marginBottom: 25,
    alignItems: 'center',
  },
  surplusValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
  },
  surplusLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  surplusSubtext: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  propertyBox: {
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftStyle: 'solid',
    borderLeftColor: '#2196f3',
  },
  propertyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  propertySubtext: {
    fontSize: 9,
    color: '#666',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  retirementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 15,
  },
  retirementBox: {
    width: '23%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 15,
  },
  metricBox: {
    width: '23%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 15,
  },
  boxLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    marginBottom: 6,
    textAlign: 'center',
  },
  boxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
    padding: 10,
  },
  chart: {
    width: 515,
    maxHeight: 300,
    alignSelf: 'center',
  },
  explanation: {
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 6,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#3498db',
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  explanationText: {
    fontSize: 10,
    color: '#555',
    lineHeight: 1.6,
  },
  highlightBox: {
    backgroundColor: '#e8f5e9',
    padding: 18,
    borderRadius: 6,
    marginVertical: 15,
    borderLeftWidth: 5,
    borderLeftStyle: 'solid',
    borderLeftColor: '#4caf50',
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    padding: 18,
    borderRadius: 6,
    marginVertical: 15,
    borderLeftWidth: 5,
    borderLeftStyle: 'solid',
    borderLeftColor: '#ff9800',
  },
  taxSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  taxBox: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginRight: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
  },
  savingsBox: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  taxLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 10,
  },
  taxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  savingsValue: {
    color: '#ff9800',
    fontSize: 28,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 6,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e0e0e0',
  },
  tableCellContent: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
    flex: 1,
  },
  strategyCellLabel: {
    fontSize: 10,
    color: '#333',
    flex: 1.5,
    fontWeight: 'bold',
  },
  strategyCellAmount: {
    fontSize: 10,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  strategyCellSaving: {
    fontSize: 10,
    color: '#4caf50',
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  strategyCellExplanation: {
    fontSize: 9,
    color: '#666',
    flex: 2,
    fontStyle: 'italic',
  },
  recommendation: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e0e0e0',
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
  },
  recNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 12,
  },
  recPriority: {
    fontSize: 9,
    color: '#fff',
    padding: '4 8',
    borderRadius: 4,
    marginBottom: 10,
    width: 60,
    textAlign: 'center',
  },
  recPriorityHigh: {
    backgroundColor: '#e74c3c',
  },
  recPriorityMedium: {
    backgroundColor: '#f39c12',
  },
  recPriorityLow: {
    backgroundColor: '#f1c40f',
  },
  recSection: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  recLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    width: 90,
  },
  recText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
    flex: 1,
  },
  recImpact: {
    fontSize: 14,
    color: '#ff9800',
    letterSpacing: 2,
  },
  timelineBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
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

// Header Component
const ReportHeader = ({ reportDate, clientFullName }: { reportDate: string; clientFullName: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.companyName}>Perpetual Wealth Partners</Text>
    <Text style={styles.reportDate}>Report Date: {reportDate}</Text>
    <Text style={styles.clientName}>Prepared for: {clientFullName}</Text>
  </View>
);

// Footer Component
const ReportFooter = ({ reportDate }: { reportDate: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Generated on {reportDate} | Perpetual Wealth Partners
    </Text>
  </View>
);

// Main PDF Report Component - PREMIUM DESIGN
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

  // Get charts ONCE
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

  // Helper to expand recommendations
  const expandRecommendation = (recText: string, index: number): any => {
    const lowerRec = recText.toLowerCase();
    
    if (lowerRec.includes('super') || lowerRec.includes('superannuation')) {
      const superAmount = Math.min(monthlyIncome * 0.15 * 12, 27500);
      const superTaxSaving = superAmount * 0.175;
      return {
        title: recText,
        priority: 'HIGH',
        action: `Implement salary sacrifice of ${formatCurrency(superAmount)}/year to superannuation`,
        benefit: `Reduce taxable income by ${formatCurrency(superAmount)}, saving approximately ${formatCurrency(superTaxSaving)} in tax annually`,
        timeline: 30,
        timelineLabel: '30 days to setup',
        impact: 5,
        requirements: 'Set up with employer HR/payroll department',
        projectedImpact: `Increases projected retirement fund from ${formatCurrency(projectedRetirementLumpSum)} to approximately ${formatCurrency(projectedRetirementLumpSum * 1.2)} (20% increase)`
      };
    }
    
    if (lowerRec.includes('property') || lowerRec.includes('investment property')) {
      return {
        title: recText,
        priority: 'MEDIUM',
        action: 'Research properties in growth suburbs with strong rental yields',
        benefit: `Negative gearing can save approximately ${formatCurrency(taxSavings * 0.3)}/year in tax, plus capital growth potential`,
        timeline: 75,
        timelineLabel: '6-12 months',
        impact: 4,
        requirements: `Save additional deposit, obtain pre-approval for loan up to ${formatCurrency(maxPropertyValue > 0 ? maxPropertyValue : totalPropertyValue * 1.5)}`,
        projectedImpact: 'Build equity and passive income stream while benefiting from tax deductions'
      };
    }
    
    if (lowerRec.includes('work') || lowerRec.includes('deduction')) {
      return {
        title: recText,
        priority: 'HIGH',
        action: 'Maximize claimable work-related expenses including home office, professional development, and tools',
        benefit: `Additional deductions of ${formatCurrency(monthlyExpenses * 0.2 * 12)}/year could save approximately ${formatCurrency(monthlyExpenses * 0.2 * 12 * 0.325)} in tax`,
        timeline: 100,
        timelineLabel: 'Immediate',
        impact: 3,
        requirements: 'Ensure proper documentation and receipts for all expenses',
        projectedImpact: 'Reduce taxable income and improve cash flow through tax refunds'
      };
    }
    
    if (lowerRec.includes('portfolio') || lowerRec.includes('allocation') || lowerRec.includes('share')) {
      return {
        title: recText,
        priority: 'MEDIUM',
        action: 'Review and rebalance investment portfolio to optimize returns and risk',
        benefit: 'Better diversification reduces risk while maintaining growth potential',
        timeline: 50,
        timelineLabel: '3-6 months',
        impact: 3,
        requirements: 'Consult with financial advisor for personalized asset allocation strategy',
        projectedImpact: 'Improved risk-adjusted returns and better alignment with retirement goals'
      };
    }
    
    if (lowerRec.includes('health') || lowerRec.includes('insurance')) {
      return {
        title: recText,
        priority: 'MEDIUM',
        action: 'Consider private health insurance to avoid Medicare Levy Surcharge',
        benefit: `Save approximately ${formatCurrency(monthlyIncome * 12 * 0.01)}/year in Medicare Levy Surcharge`,
        timeline: 100,
        timelineLabel: 'Before June 30',
        impact: 3,
        requirements: 'Compare policies and select appropriate level of cover',
        projectedImpact: 'Avoid surcharge while gaining access to private healthcare'
      };
    }
    
    return {
      title: recText,
      priority: 'MEDIUM',
      action: 'Review current financial strategy and implement improvements',
      benefit: 'Optimize financial position for long-term wealth accumulation',
      timeline: 50,
      timelineLabel: 'Within 90 days',
      impact: 3,
      projectedImpact: 'Enhanced financial security and retirement readiness'
    };
  };

  // SINGLE DOCUMENT - NO DUPLICATION - PREMIUM DESIGN
  return (
    <Document>
      {/* PAGE 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.pageTitle}>Executive Summary</Text>
        
        {/* Net Worth Comparison */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }} wrap={false}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Current Net Worth</Text>
            <Text style={[styles.comparisonValue, { color: netWorth >= 0 ? '#27ae60' : '#e74c3c' }]}>
              {formatCurrency(netWorth)}
            </Text>
            {/* Chart placeholder would go here */}
          </View>
          <View style={{ justifyContent: 'center', paddingHorizontal: 10 }}>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Projected at Retirement</Text>
            <Text style={[styles.comparisonValue, { color: '#27ae60' }]}>
              {formatCurrency(projectedRetirementNetWorth)}
            </Text>
            {/* Chart placeholder would go here */}
          </View>
        </View>

        {/* Monthly Cash Flow Comparison */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }} wrap={false}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Current Monthly Cash Flow</Text>
            <Text style={[styles.comparisonValue, { fontSize: 24, color: monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }]}>
              {formatCurrency(monthlyCashFlow)}
            </Text>
            {/* Donut chart placeholder */}
          </View>
          <View style={{ justifyContent: 'center', paddingHorizontal: 10 }}>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Projected at Retirement</Text>
            <Text style={[styles.comparisonValue, { fontSize: 24, color: projectedRetirementMonthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' }]}>
              {formatCurrency(projectedRetirementMonthlyCashFlow)}
            </Text>
            {/* Donut chart placeholder */}
          </View>
        </View>

        {/* Retirement Surplus */}
        <View style={[
          styles.surplusBox,
          { backgroundColor: projectedRetirementSurplus >= 0 ? '#e8f5e9' : '#ffebee', borderLeftColor: projectedRetirementSurplus >= 0 ? '#27ae60' : '#e74c3c' }
        ]} wrap={false}>
          <Text style={styles.surplusLabel}>Projected Retirement Surplus</Text>
          <Text style={[styles.surplusValue, { color: projectedRetirementSurplus >= 0 ? '#27ae60' : '#e74c3c' }]}>
            {formatCurrency(projectedRetirementSurplus)}
          </Text>
          <Text style={styles.surplusSubtext}>
            {projectedRetirementSurplus >= 0 
              ? '✓ You are on track for a comfortable retirement'
              : '⚠ Action required to meet retirement goals'}
          </Text>
        </View>

        {/* Property Portfolio */}
        <View style={styles.propertyBox} wrap={false}>
          <Text style={styles.propertyLabel}>Property Portfolio at Retirement</Text>
          <Text style={styles.propertyValue}>
            {formatCurrency(projectedPropertyPortfolioValue)}
          </Text>
          <Text style={styles.propertySubtext}>
            Current: {formatCurrency(totalPropertyValue)} | Equity: {formatCurrency(propertyEquity)}
          </Text>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 2: Investment Property & Cash Flow */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        {/* Investment Property Potential */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Investment Property Potential</Text>
          
          {isViable && maxPropertyValue > 0 ? (
            <View style={styles.highlightBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196f3' }}>
                    {formatCurrency(maxPropertyValue)}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#666' }}>Max Property Value</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4caf50' }}>
                    {formatCurrency(surplusIncome)}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#666' }}>Available Surplus</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ff9800' }}>
                    {formatCurrency(monthlyRentalIncome)}
                  </Text>
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

        {/* Detailed Cash Flow Breakdown */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Cash Flow Breakdown</Text>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subsectionTitle}>
              Monthly Cash Flow: {formatCurrency(monthlyCashFlow)}
            </Text>
            <Text style={styles.bodyText}>
              Savings Rate: {monthlyIncome > 0 ? ((monthlyCashFlow / monthlyIncome) * 100).toFixed(1) : 0}%
            </Text>
          </View>

          {detailedCashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={detailedCashFlowChart} style={styles.chart} cache={false} />
            </View>
          ) : cashFlowChart ? (
            <View style={styles.chartContainer}>
              <Image src={cashFlowChart} style={styles.chart} cache={false} />
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

      {/* PAGE 3: Detailed Financial Position */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Detailed Financial Position</Text>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.subsectionTitle}>
              Net Worth: <Text style={{ color: netWorth >= 0 ? '#27ae60' : '#e74c3c' }}>
                {formatCurrency(netWorth)}
              </Text>
            </Text>
          </View>

          {financialPositionChart ? (
            <View style={styles.chartContainer}>
              <Image src={financialPositionChart} style={[styles.chart, { maxHeight: 380 }]} cache={false} />
            </View>
          ) : assetChart ? (
            <View style={styles.chartContainer}>
              <Image src={assetChart} style={[styles.chart, { maxHeight: 380 }]} cache={false} />
            </View>
          ) : null}

          <View style={{ marginTop: 20, padding: 18, backgroundColor: '#f8f9fa', borderRadius: 6 }} wrap={false}>
            <Text style={styles.subsectionTitle}>Financial Ratios</Text>
            <Text style={styles.bodyText}>
              Debt-to-Asset Ratio: {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
              {totalAssets > 0 && (totalLiabilities / totalAssets) > 0.5 && ' (HIGH)'}
            </Text>
            <Text style={styles.bodyText}>
              Equity Ratio: {totalAssets > 0 ? ((netWorth / totalAssets) * 100).toFixed(1) : 0}%
              {netWorth < 0 && ' (NEGATIVE)'}
            </Text>
            <Text style={[styles.bodyText, { marginTop: 10 }]}>
              Recommendation: Focus on building assets while strategically managing debt
            </Text>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* PAGE 4: Detailed Retirement Projection */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.sectionTitle}>Detailed Retirement Projection</Text>

        <View style={styles.metricGrid} wrap={false}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Years to Retirement</Text>
            <Text style={[styles.metricValue, { color: '#2196f3' }]}>
              {yearsToRetirement}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Projected Lump Sum</Text>
            <Text style={[styles.metricValue, { fontSize: 16, color: '#4caf50' }]}>
              {formatCurrency(projectedRetirementLumpSum)}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Monthly Surplus</Text>
            <Text style={[styles.metricValue, { fontSize: 16, color: projectedRetirementSurplus >= 0 ? '#4caf50' : '#e74c3c' }]}>
              {formatCurrency(projectedRetirementSurplus)}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Status</Text>
            <Text style={[styles.metricValue, { fontSize: 18, color: isRetirementDeficit ? '#e74c3c' : '#4caf50' }]}>
              {isRetirementDeficit ? '⚠ Alert' : '✓ On Track'}
            </Text>
          </View>
        </View>

        {detailedRetirementChart ? (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={detailedRetirementChart} style={[styles.chart, { maxHeight: 350 }]} cache={false} />
          </View>
        ) : retirementChart ? (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={retirementChart} style={[styles.chart, { maxHeight: 350 }]} cache={false} />
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

      {/* PAGE 5: Tax Optimization Analysis */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
        
        <Text style={styles.sectionTitle}>Tax Optimization Analysis</Text>

        {/* Tax Summary */}
        <View style={styles.taxSummaryGrid} wrap={false}>
          <View style={styles.taxBox}>
            <Text style={styles.taxLabel}>Current Annual Tax</Text>
            <Text style={styles.taxValue}>{formatCurrency(currentTax)}</Text>
          </View>
          <View style={styles.taxBox}>
            <Text style={styles.taxLabel}>Optimized Annual Tax</Text>
            <Text style={[styles.taxValue, { color: '#4caf50' }]}>{formatCurrency(optimizedTax)}</Text>
          </View>
          <View style={[styles.taxBox, styles.savingsBox]}>
            <Text style={styles.taxLabel}>Potential Annual Savings</Text>
            <Text style={styles.savingsValue}>{formatCurrency(taxSavings)}</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              ({currentTax > 0 ? ((taxSavings / currentTax) * 100).toFixed(1) : 0}% reduction)
            </Text>
          </View>
        </View>

        {taxOptimizationChart && (
          <View style={styles.chartContainer} wrap={false}>
            <Image src={taxOptimizationChart} style={[styles.chart, { maxHeight: 280 }]} cache={false} />
          </View>
        )}

        {/* Strategy Details */}
        {taxSavings > 0 && (
          <View style={{ marginTop: 25 }} wrap={false}>
            <Text style={[styles.subsectionTitle, { marginBottom: 15 }]}>Tax Optimization Strategies</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Strategy</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Tax Saving</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Explanation</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.strategyCellLabel}>1. Salary Sacrifice to Super</Text>
              <Text style={styles.strategyCellAmount}>
                {formatCurrency(Math.min(taxSavings * 3, monthlyIncome * 12 * 0.15))}
              </Text>
              <Text style={styles.strategyCellSaving}>
                {formatCurrency(Math.min(taxSavings * 0.5, (monthlyIncome * 12 * 0.15) * 0.235))}
              </Text>
              <Text style={styles.strategyCellExplanation}>
                Reduces taxable income through pre-tax super contributions. Taxed at 15% instead of marginal rate (typically 32.5-45%).
              </Text>
            </View>

            {monthlyExpenses < monthlyIncome * 0.8 && (
              <View style={styles.tableRow}>
                <Text style={styles.strategyCellLabel}>2. Negative Gearing Benefits</Text>
                <Text style={styles.strategyCellAmount}>
                  {formatCurrency(Math.min(taxSavings * 2, monthlyIncome * 2))}
                </Text>
                <Text style={styles.strategyCellSaving}>
                  {formatCurrency(Math.min(taxSavings * 0.3, (monthlyIncome * 2) * 0.325))}
                </Text>
                <Text style={styles.strategyCellExplanation}>
                  Investment property losses offset taxable income. Deductible expenses include interest, repairs, and depreciation.
                </Text>
              </View>
            )}

            <View style={styles.tableRow}>
              <Text style={styles.strategyCellLabel}>3. Work-Related Deductions</Text>
              <Text style={styles.strategyCellAmount}>
                {formatCurrency(Math.max(0, taxSavings * 1.5))}
              </Text>
              <Text style={styles.strategyCellSaving}>
                {formatCurrency(Math.max(0, taxSavings * 0.2))}
              </Text>
              <Text style={styles.strategyCellExplanation}>
                Claim eligible expenses: home office, professional development, tools, uniforms, and travel. Ensure proper documentation.
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

      {/* PAGE 6: Recommendations & Action Items */}
      {recommendations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <ReportHeader reportDate={reportDate} clientFullName={clientFullName} />
          
          <Text style={styles.sectionTitle}>Recommendations & Action Items</Text>

          {recommendations.map((rec, index) => {
            const expanded = expandRecommendation(rec, index);
            const priorityStyle = expanded.priority === 'HIGH' 
              ? styles.recPriorityHigh 
              : expanded.priority === 'MEDIUM' 
              ? styles.recPriorityMedium 
              : styles.recPriorityLow;
            
            return (
              <View key={index} style={styles.recommendation} wrap={false}>
                <Text style={styles.recNumber}>{index + 1}. {expanded.title}</Text>
                <View style={[styles.recPriority, priorityStyle]}>
                  <Text style={{ color: '#fff', fontSize: 9 }}>Priority: {expanded.priority}</Text>
                </View>
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Action:</Text>
                  <Text style={styles.recText}>{expanded.action}</Text>
                </View>
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Expected Benefit:</Text>
                  <Text style={styles.recText}>{expanded.benefit}</Text>
                </View>
                
                {expanded.projectedImpact && (
                  <View style={styles.recSection}>
                    <Text style={styles.recLabel}>Projected Impact:</Text>
                    <Text style={styles.recText}>{expanded.projectedImpact}</Text>
                  </View>
                )}
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Timeline:</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recText}>{expanded.timelineLabel}</Text>
                    <View style={styles.timelineBar}>
                      <View style={[styles.timelineFill, { width: `${expanded.timeline}%` }]} />
                    </View>
                  </View>
                </View>
                
                {expanded.requirements && (
                  <View style={styles.recSection}>
                    <Text style={styles.recLabel}>Requirements:</Text>
                    <Text style={styles.recText}>{expanded.requirements}</Text>
                  </View>
                )}
                
                <View style={styles.recSection}>
                  <Text style={styles.recLabel}>Impact Rating:</Text>
                  <Text style={styles.recImpact}>
                    {'⭐'.repeat(expanded.impact)}{'☆'.repeat(5 - expanded.impact)}
                  </Text>
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
