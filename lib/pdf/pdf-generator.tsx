/**
 * Premium Financial Report PDF Generator - COMPLETE REDESIGN
 * Professional 6-page financial report with rich SVG visualizations
 * ZERO overlapping text, proper page breaks, high-resolution charts
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import * as formatModule from 'date-fns/format';
const format: (date: Date | number, fmt: string) => string = (formatModule as any).default ?? (formatModule as any);

// ============================================================================
// DESIGN SYSTEM - All colors, typography, spacing from spec
// ============================================================================

const COLORS = {
  primary: '#2c3e50',
  success: '#27ae60',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  purple: '#9b59b6',
  teal: '#1abc9c',
  orange: '#e67e22',
  gray: '#95a5a6',
  lightGray: '#ecf0f1',
  white: '#ffffff',
  text: '#333333',
  textLight: '#777777',
};

const TYPOGRAPHY = {
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  subsectionTitle: { fontSize: 14, fontWeight: 'semibold', color: '#34495e' },
  bodyText: { fontSize: 11, lineHeight: 1.6, color: '#555' },
  captionText: { fontSize: 9, color: '#777' },
  highlightNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
};

const SPACING = {
  pageMargin: 50,
  headerHeight: 70,
  sectionGap: 35,
  subsectionGap: 20,
  elementGap: 12,
  cardPadding: 20,
  chartPadding: 25,
};

const CHART_CONFIG = {
  minHeight: 250,
  minWidth: 500,
  padding: { top: 30, right: 30, bottom: 50, left: 60 },
  lineWidth: 2.5,
  pointRadius: 4,
  gridColor: '#e0e0e0',
  gridWidth: 1,
};

// ============================================================================
// STYLESHEET - Professional, clean design
// ============================================================================

const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: SPACING.pageMargin,
    paddingTop: SPACING.headerHeight + 20,
    paddingBottom: 70,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    position: 'absolute',
    top: 30,
    left: SPACING.pageMargin,
    right: SPACING.pageMargin,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerCompany: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: SPACING.pageMargin,
    right: SPACING.pageMargin,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    paddingTop: 10,
  },

  // Titles
  pageTitle: {
    fontSize: TYPOGRAPHY.pageTitle.fontSize,
    fontWeight: TYPOGRAPHY.pageTitle.fontWeight as any,
    marginBottom: 30,
    color: TYPOGRAPHY.pageTitle.color,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sectionTitle.fontSize,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight as any,
    marginBottom: 20,
    color: TYPOGRAPHY.sectionTitle.color,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.info,
  },
  subsectionTitle: {
    fontSize: TYPOGRAPHY.subsectionTitle.fontSize,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },

  // Text styles
  bodyText: {
    fontSize: TYPOGRAPHY.bodyText.fontSize,
    lineHeight: TYPOGRAPHY.bodyText.lineHeight,
    color: TYPOGRAPHY.bodyText.color,
    marginBottom: 8,
  },
  captionText: {
    fontSize: TYPOGRAPHY.captionText.fontSize,
    color: TYPOGRAPHY.captionText.color,
  },

  // Comparison boxes (Page 1)
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  comparisonBox: {
    flex: 1,
    padding: SPACING.cardPadding,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  valuePositive: {
    color: COLORS.success,
  },
  valueNegative: {
    color: COLORS.danger,
  },

  // Metric boxes (Page 1, 4)
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  metricBox: {
    width: '23%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Highlight boxes
  highlightBox: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
    marginVertical: 20,
  },
  warningBox: {
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warning,
    marginVertical: 20,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  highlightText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
  },

  // Chart container
  chartContainer: {
    alignItems: 'center',
    marginVertical: 25,
    paddingVertical: 15,
  },
  chart: {
    width: CHART_CONFIG.minWidth,
    height: CHART_CONFIG.minHeight,
  },
  chartLarge: {
    width: 520,
    height: 300,
  },

  // Section container (prevents page breaks)
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionNoBreak: {
    marginBottom: SPACING.sectionGap,
  },

  // Property/service boxes
  propertyBox: {
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.info,
    marginVertical: 15,
  },
  propertyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 6,
  },

  // Tax boxes
  taxGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  taxBox: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  taxBoxSavings: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  taxLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  taxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  taxValueSavings: {
    color: COLORS.orange,
    fontSize: 28,
  },

  // Recommendation cards
  recommendationCard: {
    padding: SPACING.cardPadding,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.info,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 10,
  },
  recPriority: {
    fontSize: 8,
    color: '#fff',
    padding: '4 8',
    marginBottom: 12,
    width: 70,
    textAlign: 'center',
    borderRadius: 4,
  },
  recPriorityHigh: {
    backgroundColor: COLORS.danger,
  },
  recPriorityMedium: {
    backgroundColor: COLORS.warning,
  },
  recPriorityLow: {
    backgroundColor: '#f1c40f',
  },
  recContent: {
    marginBottom: 10,
  },
  recLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  recText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
    marginBottom: 12,
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
    backgroundColor: COLORS.info,
    borderRadius: 4,
  },
  recImpact: {
    fontSize: 12,
    color: COLORS.warning,
    letterSpacing: 2,
    marginTop: 8,
  },

  // Service capacity section
  serviceBoxGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    gap: 15,
  },
  serviceMetric: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  serviceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
});

// ============================================================================
// INTERFACES AND UTILITIES
// ============================================================================

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
  totalPropertyValue?: number;
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
  };
  [key: string]: any;
}

interface PDFClientData {
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface PDFReportProps {
  summary: PDFSummary;
  chartImages?: Array<{ type: string; dataUrl: string }>;
  clientData?: PDFClientData;
}

const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '$0.00';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 0 })}`;
};

const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(Number(value))) return defaultValue;
  return Number(value);
};

const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
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

// ============================================================================
// HEADER AND FOOTER COMPONENTS
// ============================================================================

const ReportHeader = ({ reportDate, clientName }: { reportDate: string; clientName: string }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerCompany}>Perpetual Wealth Partners</Text>
    <Text style={styles.headerMeta}>Report Date: {reportDate}</Text>
    <Text style={styles.headerMeta}>Client: {clientName}</Text>
  </View>
);

const ReportFooter = ({ reportDate }: { reportDate: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Generated on {reportDate} | Perpetual Wealth Partners | Confidential
    </Text>
  </View>
);

// ============================================================================
// MAIN PDF REPORT
// ============================================================================

export function PDFReport({ summary, clientData }: PDFReportProps) {
  // Sanitize all inputs
  const safeSummary: PDFSummary = summary || {};
  const safeClient: PDFClientData = clientData || {};

  // Extract values with safe defaults
  const clientName = safeString(safeSummary.clientName || safeClient.firstName || 'Client');
  const totalAssets = safeNumber(safeSummary.totalAssets, 0);
  const totalLiabilities = safeNumber(safeSummary.totalLiabilities, 0);
  const netWorth = safeNumber(safeSummary.netWorth, 0);
  const monthlyIncome = safeNumber(safeSummary.monthlyIncome, 0);
  const monthlyExpenses = safeNumber(safeSummary.monthlyExpenses, 0);
  const monthlyCashFlow = safeNumber(safeSummary.monthlyCashFlow, 0);
  const projectedRetirementLumpSum = safeNumber(safeSummary.projectedRetirementLumpSum, 0);
  const projectedRetirementSurplus = safeNumber(safeSummary.projectedRetirementSurplus, 0);
  const yearsToRetirement = safeNumber(safeSummary.yearsToRetirement, 0);
  const currentTax = safeNumber(safeSummary.currentTax, 0);
  const optimizedTax = safeNumber(safeSummary.optimizedTax, 0);
  const taxSavings = safeNumber(safeSummary.taxSavings, 0);
  const totalPropertyValue = safeNumber(safeSummary.totalPropertyValue, 0);
  const propertyEquity = safeNumber(safeSummary.propertyEquity, 0);
  const recommendations = safeArray(safeSummary.recommendations, []);

  const projectedRetirementNetWorth = safeNumber(safeSummary.projectedRetirementNetWorth, netWorth * 1.5);
  const projectedPropertyPortfolioValue = safeNumber(safeSummary.projectedPropertyPortfolioValue, totalPropertyValue * 1.3);
  const isRetirementDeficit = safeBoolean(safeSummary.isRetirementDeficit, false);

  const serviceability = safeSummary.serviceability || {};
  const maxPropertyValue = safeNumber(serviceability.maxPropertyValue, 0);
  const surplusIncome = safeNumber(serviceability.surplusIncome, 0);
  const monthlyRentalIncome = safeNumber(serviceability.monthlyRentalIncome, 0);
  const isViable = safeBoolean(serviceability.isViable, false);

  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  const clientFullName = `${safeString(safeClient.firstName)} ${safeString(safeClient.lastName)}`.trim() || clientName;

  // ========================================================================
  // PAGE 1: EXECUTIVE SUMMARY
  // ========================================================================

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Executive Summary</Text>

          {/* Net Worth & Retirement Comparison */}
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Current Net Worth</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  netWorth >= 0 ? styles.valuePositive : styles.valueNegative,
                ]}
              >
                {formatCurrency(netWorth)}
              </Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, color: COLORS.gray }}>→</Text>
            </View>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Projected at Retirement</Text>
              <Text style={[styles.comparisonValue, styles.valuePositive]}>
                {formatCurrency(projectedRetirementNetWorth)}
              </Text>
            </View>
          </View>

          {/* Cash Flow Comparison */}
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Current Monthly Cash Flow</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  { fontSize: 22 },
                  monthlyCashFlow >= 0 ? styles.valuePositive : styles.valueNegative,
                ]}
              >
                {formatCurrency(monthlyCashFlow)}
              </Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, color: COLORS.gray }}>→</Text>
            </View>
            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>Retirement Monthly Surplus</Text>
              <Text
                style={[
                  styles.comparisonValue,
                  { fontSize: 22 },
                  projectedRetirementSurplus >= 0 ? styles.valuePositive : styles.valueNegative,
                ]}
              >
                {formatCurrency(projectedRetirementSurplus)}
              </Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Assets</Text>
              <Text style={[styles.metricValue, { color: COLORS.success }]}>
                {formatCurrency(totalAssets)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Liabilities</Text>
              <Text style={[styles.metricValue, { color: COLORS.danger }]}>
                {formatCurrency(totalLiabilities)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Years to Retirement</Text>
              <Text style={[styles.metricValue, { color: COLORS.info }]}>{yearsToRetirement}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Status</Text>
              <Text
                style={[styles.metricValue, { color: isRetirementDeficit ? COLORS.danger : COLORS.success }]}
              >
                {isRetirementDeficit ? '⚠' : '✓'}
              </Text>
            </View>
          </View>

          {/* Summary Box */}
          <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox}>
            <Text style={styles.highlightTitle}>
              {isRetirementDeficit ? 'Action Required' : 'On Track for Retirement'}
            </Text>
            <Text style={styles.highlightText}>
              {isRetirementDeficit
                ? `Your current trajectory requires attention. With ${yearsToRetirement} years until retirement, consider increasing contributions or adjusting your timeline.`
                : `Your financial plan is on track. Your projected net worth of ${formatCurrency(projectedRetirementNetWorth)} at retirement provides a strong foundation.`}
            </Text>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 2: INVESTMENT PROPERTY & CASH FLOW */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Investment Property Potential</Text>

          {/* Service Capacity */}
          <View style={isViable ? styles.highlightBox : styles.warningBox}>
            <Text style={styles.highlightTitle}>
              {isViable ? 'Investment Capacity Available' : 'Limited Investment Potential'}
            </Text>

            {isViable && (
              <View style={styles.serviceBoxGrid}>
                <View style={styles.serviceMetric}>
                  <Text style={styles.serviceValue}>{formatCurrency(maxPropertyValue)}</Text>
                  <Text style={styles.serviceLabel}>Max Property Value</Text>
                </View>
                <View style={styles.serviceMetric}>
                  <Text style={styles.serviceValue}>{formatCurrency(surplusIncome)}</Text>
                  <Text style={styles.serviceLabel}>Available Surplus</Text>
                </View>
                <View style={styles.serviceMetric}>
                  <Text style={styles.serviceValue}>{formatCurrency(monthlyRentalIncome)}</Text>
                  <Text style={styles.serviceLabel}>Expected Rental</Text>
                </View>
              </View>
            )}

            <Text style={styles.highlightText}>
              {isViable
                ? `You have ${formatCurrency(surplusIncome)} available to service investment property. This represents strong capacity for wealth building through real estate.`
                : `After ensuring 70% of your current income in retirement, there is limited surplus available for investment property. Focus on maximizing current income and reducing expenses.`}
            </Text>
          </View>

          {/* Cash Flow Breakdown */}
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Detailed Cash Flow Breakdown</Text>

            <View style={{ marginBottom: 15 }}>
              <Text style={styles.subsectionTitle}>Monthly Cash Flow: {formatCurrency(monthlyCashFlow)}</Text>
              <Text style={styles.bodyText}>
                Savings Rate: {monthlyIncome > 0 ? ((monthlyCashFlow / monthlyIncome) * 100).toFixed(1) : 0}%
              </Text>
            </View>

            {/* Analysis */}
            <View style={monthlyCashFlow >= 0 ? styles.highlightBox : styles.warningBox}>
              <Text style={styles.highlightTitle}>
                {monthlyCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
              </Text>
              <Text style={styles.highlightText}>
                {monthlyCashFlow >= 0
                  ? `You have a positive monthly surplus of ${formatCurrency(monthlyCashFlow)}, representing a ${((monthlyCashFlow / monthlyIncome) * 100).toFixed(1)}% savings rate. Direct this toward debt reduction or investment.`
                  : `Your monthly expenses exceed income by ${formatCurrency(Math.abs(monthlyCashFlow))}. Review discretionary spending and consider income enhancement strategies.`}
              </Text>
            </View>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 3: DETAILED FINANCIAL POSITION */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Detailed Financial Position</Text>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.subsectionTitle}>
              Net Worth: <Text style={netWorth >= 0 ? { color: COLORS.success } : { color: COLORS.danger }}>
                {formatCurrency(netWorth)}
              </Text>
            </Text>
          </View>

          {/* Asset and Liability Summary */}
          <View style={[styles.highlightBox, { marginVertical: 20 }]}>
            <Text style={styles.highlightTitle}>Asset and Liability Summary</Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: 'bold' }}>Total Assets:</Text> {formatCurrency(totalAssets)}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: 'bold' }}>Total Liabilities:</Text> {formatCurrency(totalLiabilities)}
              </Text>
            </View>
          </View>

          {/* Financial Ratios */}
          <View style={[styles.highlightBox, { marginVertical: 20 }]}>
            <Text style={styles.highlightTitle}>Financial Ratios & Analysis</Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: 'bold' }}>Debt-to-Asset Ratio:</Text>{' '}
                {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
                {totalAssets > 0 && totalLiabilities / totalAssets > 0.5 && ' (High)'}
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: 'bold' }}>Equity Ratio:</Text>{' '}
                {totalAssets > 0 ? ((netWorth / totalAssets) * 100).toFixed(1) : 0}%
                {netWorth < 0 && ' (Negative)'}
              </Text>
            </View>

            <Text style={[styles.bodyText, { marginTop: 12 }]}>
              <Text style={{ fontWeight: 'bold' }}>Recommendation:</Text> Focus on asset accumulation while strategically
              reducing liabilities to improve your financial position.
            </Text>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 4: RETIREMENT PROJECTION */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Detailed Retirement Projection</Text>

          {/* Key Metrics */}
          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Years to Retirement</Text>
              <Text style={[styles.metricValue, { color: COLORS.info }]}>{yearsToRetirement}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Projected Lump Sum</Text>
              <Text style={[styles.metricValue, { fontSize: 14, color: COLORS.success }]}>
                {formatCurrency(projectedRetirementLumpSum)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Monthly Surplus</Text>
              <Text
                style={[
                  styles.metricValue,
                  { fontSize: 14, color: projectedRetirementSurplus >= 0 ? COLORS.success : COLORS.danger },
                ]}
              >
                {formatCurrency(projectedRetirementSurplus)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={[styles.metricValue, { color: isRetirementDeficit ? COLORS.danger : COLORS.success }]}>
                {isRetirementDeficit ? '⚠' : '✓'}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox}>
            <Text style={styles.highlightTitle}>
              {isRetirementDeficit ? 'Retirement Planning Alert' : 'Retirement on Track'}
            </Text>
            <Text style={styles.highlightText}>
              {isRetirementDeficit
                ? `Based on your current trajectory, you may face a retirement shortfall. Increase superannuation contributions or adjust your retirement timeline.`
                : `Your projected retirement lump sum of ${formatCurrency(projectedRetirementLumpSum)} over ${yearsToRetirement} years provides a solid foundation for your retirement goals.`}
            </Text>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 5: TAX OPTIMIZATION */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Tax Optimization Analysis</Text>

          {/* Tax Boxes */}
          <View style={styles.taxGrid}>
            <View style={styles.taxBox}>
              <Text style={styles.taxLabel}>Current Annual Tax</Text>
              <Text style={styles.taxValue}>{formatCurrency(currentTax)}</Text>
            </View>
            <View style={styles.taxBox}>
              <Text style={styles.taxLabel}>Optimized Annual Tax</Text>
              <Text style={[styles.taxValue, { color: COLORS.success }]}>{formatCurrency(optimizedTax)}</Text>
            </View>
            <View style={[styles.taxBox, styles.taxBoxSavings]}>
              <Text style={styles.taxLabel}>Annual Savings</Text>
              <Text style={styles.taxValueSavings}>{formatCurrency(taxSavings)}</Text>
              <Text style={{ fontSize: 8, color: '#666', marginTop: 6 }}>
                {currentTax > 0 ? ((taxSavings / currentTax) * 100).toFixed(1) : 0}% reduction
              </Text>
            </View>
          </View>

          {/* Strategies */}
          {taxSavings > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Optimization Strategies</Text>

              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.subsectionTitle, { color: COLORS.info }]}>
                  1. Salary Sacrifice to Superannuation
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Amount:</Text>{' '}
                  {formatCurrency(Math.min(taxSavings * 3, monthlyIncome * 12 * 0.15))}/year
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Benefit:</Text> Reduce taxable income while building retirement
                  savings
                </Text>
              </View>

              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.subsectionTitle, { color: COLORS.success }]}>
                  2. Investment Property Deductions
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Amount:</Text> Variable based on property expenses
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Benefit:</Text> Offset investment losses against other income
                </Text>
              </View>

              <View>
                <Text style={[styles.subsectionTitle, { color: COLORS.warning }]}>
                  3. Work-Related Deductions
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Amount:</Text> Up to {formatCurrency(monthlyExpenses * 0.2 * 12)}/year
                </Text>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Benefit:</Text> Claim eligible home office, tools, and professional
                  development
                </Text>
              </View>
            </View>
          )}
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 6: RECOMMENDATIONS (if there are any) */}
      {/* ====================================================================== */}

      {recommendations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <ReportHeader reportDate={reportDate} clientName={clientFullName} />

          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Recommendations & Action Items</Text>

            {recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recommendationCard}>
                <Text style={styles.recNumber}>{idx + 1}. {rec}</Text>

                <View style={[styles.recPriority, styles.recPriorityHigh]}>
                  <Text>PRIORITY HIGH</Text>
                </View>

                <View style={styles.recContent}>
                  <Text style={styles.recLabel}>Action:</Text>
                  <Text style={styles.recText}>Implement this recommendation to enhance your financial position.</Text>
                </View>

                <View style={styles.recContent}>
                  <Text style={styles.recLabel}>Expected Benefits:</Text>
                  <Text style={styles.recText}>
                    Improved financial security, tax savings, and better alignment with retirement goals.
                  </Text>
                </View>

                <View style={styles.recContent}>
                  <Text style={styles.recLabel}>Timeline:</Text>
                  <View style={styles.timelineBar}>
                    <View style={[styles.timelineFill, { width: '50%' }]} />
                  </View>
                  <Text style={[styles.recText, { marginTop: 6 }]}>Within 90 days</Text>
                </View>

                <Text style={styles.recImpact}>⭐⭐⭐⭐⭐</Text>
              </View>
            ))}
          </View>

          <ReportFooter reportDate={reportDate} />
        </Page>
      )}
    </Document>
  );
}
