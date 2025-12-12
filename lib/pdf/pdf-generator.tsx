/**
 * Premium Financial Report PDF Generator - COMPLETE REDESIGN
 * Professional 6-page financial report with rich SVG visualizations
 * ZERO overlapping text, proper page breaks, high-resolution charts
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { LineChart } from './charts/LineChart';
import { PieChart } from './charts/PieChart';
import { StackedBarChart } from './charts/StackedBarChart';
import { WaterfallChart } from './charts/WaterfallChart';
import { GaugeChart } from './charts/GaugeChart';
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
  pageMargin: 40,
  headerHeight: 60,
  sectionGap: 28,
  subsectionGap: 18,
  elementGap: 10,
  cardPadding: 16,
  chartPadding: 20,
};

// Register fonts if available (best-effort). Place TTF files in `public/fonts/`.
// Use runtime checks so this file can be imported on the client without pulling in Node-only modules.
if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    const base = path.resolve(process.cwd(), 'public', 'fonts');
    const reg = path.join(base, 'Inter-Regular.ttf');
    const bold = path.join(base, 'Inter-Bold.ttf');
    if (fs.existsSync(reg)) {
      Font.register({ family: 'Inter', fonts: [ { src: reg, fontWeight: 'normal' } as any, (fs.existsSync(bold) ? { src: bold, fontWeight: 'bold' } as any : null) ].filter(Boolean) });
      // Alias Helvetica to Inter for consistent metrics
      Font.register({ family: 'Helvetica', src: reg } as any);
    }
  } catch (e) {
    // Non-fatal - server may not have fonts
    // eslint-disable-next-line no-console
    const _err: any = e;
    console.warn('Server font registration skipped or failed:', _err && _err.message ? _err.message : _err);
  }
} else {
  // Client-side: register publicly served fonts if present
  try {
    // This will be resolved by @react-pdf when rendering in browser
    Font.register({ family: 'Inter', fonts: [ { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' } as any, { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' } as any ] });
    Font.register({ family: 'Helvetica', src: '/fonts/Inter-Regular.ttf' } as any);
  } catch (e) {
    // ignore
  }
}

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
  // Page layout - NO PADDING TOP since header is in normal flow now
  page: {
    padding: SPACING.pageMargin,
    paddingBottom: 60,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
    display: 'flex',
    flexDirection: 'column',
  },

  // Header - NORMAL FLOW (no absolute positioning to prevent overlaps)
  header: {
    marginBottom: SPACING.sectionGap,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    width: '100%',
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

  // Footer - FIXED POSITION for page bottom
  footer: {
    position: 'absolute',
    bottom: 20,
    left: SPACING.pageMargin,
    right: SPACING.pageMargin,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    width: `calc(100% - ${SPACING.pageMargin * 2}px)`,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    paddingTop: 6,
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

  // Comparison boxes (Page 1) - BETTER SPACING
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
    width: '100%',
  },
  comparisonBox: {
    flex: 1,
    padding: 18,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 90,
    justifyContent: 'center',
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  valuePositive: {
    color: COLORS.success,
  },
  valueNegative: {
    color: COLORS.danger,
  },

  // Metric row for inline label-value pairs
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
  },

  // Metric boxes (Page 1, 4) - CONSISTENT SIZING
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
    width: '100%',
  },
  metricBox: {
    width: '22%',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  metricLabel: {
    fontSize: 8,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 1.3,
    maxWidth: '100%',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 1.2,
  },

  // Highlight boxes - IMPROVED SPACING
  highlightBox: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
    marginVertical: 16,
    marginHorizontal: 0,
    flexDirection: 'column',
  },
  warningBox: {
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.warning,
    marginVertical: 16,
    marginHorizontal: 0,
    flexDirection: 'column',
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
    marginBottom: 0,
  },

  // Chart container - RESPONSIVE WIDTH
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 12,
    width: '100%',
  },
  chart: {
    width: '90%',
    height: CHART_CONFIG.minHeight,
    maxWidth: CHART_CONFIG.minWidth,
  },
  chartLarge: {
    width: '95%',
    height: 240,
    maxWidth: 520,
  },

  // Section container (prevents page breaks)
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionNoBreak: {
    marginBottom: SPACING.sectionGap,
  },

  // Property/service boxes - IMPROVED LAYOUT
  propertyBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginVertical: 12,
    marginHorizontal: 8,
    flex: '0 0 calc(50% - 16px)',
  },
  propertyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 6,
  },
  propertyLabel: {
    fontSize: 9,
    color: '#7f8c8d',
    marginBottom: 6,
    lineHeight: 1.3,
  },

  // Tax boxes - CONSISTENT SIZING
  taxGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
    width: '100%',
  },
  taxBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  taxBoxSavings: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  taxLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  taxValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: 0,
  },
  taxValueSavings: {
    color: COLORS.orange,
    fontSize: 26,
  },

  // Recommendation cards - CLEANER SPACING
  recommendationCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 8,
  },
  recPriority: {
    fontSize: 7,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
    width: 65,
    textAlign: 'center',
    borderRadius: 3,
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
    marginBottom: 8,
  },
  recLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
  },
  recText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#333',
    marginBottom: 8,
  },
  timelineBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: 3,
  },
  recImpact: {
    fontSize: 11,
    color: COLORS.warning,
    letterSpacing: 1,
    marginTop: 6,
  },

  // Service capacity section - CONSISTENT SIZING
  serviceBoxGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    width: '100%',
  },
  serviceMetric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    minHeight: 70,
    justifyContent: 'center',
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  serviceLabel: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.3,
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
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export function PDFReport({ summary, clientData, chartImages = [] }: PDFReportProps) {
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

  // Helper to get pre-rendered chart image by type
  const getChartImage = (typeCandidates: string[] = []) => {
    if (!Array.isArray(chartImages)) return null;
    for (const t of typeCandidates) {
      const found = chartImages.find(ci => (ci && ci.type && String(ci.type).toLowerCase() === String(t).toLowerCase()));
      if (found && found.dataUrl) return found.dataUrl;
    }
    return null;
  };

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

          {/* Charts: Net Worth Trend + Cash Flow Donut */}
          <View style={styles.chartContainer} wrap={false}>
            {/* Prefer pre-rendered chart images (SVG/PNG) when provided, otherwise render inline vector chart */}
            {getChartImage(['financialPosition', 'networth', 'retirement']) ? (
              <Image src={getChartImage(['financialPosition', 'networth', 'retirement']) as string} style={styles.chartLarge} />
            ) : (
              <LineChart data={[netWorth, projectedRetirementNetWorth]} width={400} height={140} color={COLORS.primary} />
            )}
          </View>
          {/* Pie chart moved to Page 2 to balance page content and avoid overflow */}

          {/* Summary Box */}
          <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox} wrap={false}>
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

      {/* Dedicated Charts Page (moved Pie chart here from Page 1) */}
      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />
        <View style={{ flex: 1 }} wrap={false}>
          <Text style={styles.pageTitle}>Cash Flow & Composition</Text>
          <View style={styles.chartContainer} wrap={false}>
            {getChartImage(['income', 'cashflow', 'detailedCashFlow']) ? (
              <Image src={getChartImage(['income', 'cashflow', 'detailedCashFlow']) as string} style={{ width: 280, height: 160 }} />
            ) : (
              <PieChart
                data={[
                  { label: 'Employment', value: monthlyIncome, color: COLORS.info },
                  { label: 'Expenses', value: monthlyExpenses, color: COLORS.danger },
                  { label: 'Surplus', value: monthlyCashFlow, color: COLORS.success },
                ]}
                width={280}
                height={160}
                innerRadius={60}
              />
            )}
          </View>

          <View style={{ marginTop: 8 }} wrap={false}>
            <Text style={styles.subsectionTitle}>Monthly Cash Flow Breakdown</Text>
            <Text style={styles.bodyText}>Savings Rate: {monthlyIncome > 0 ? ((monthlyCashFlow / monthlyIncome) * 100).toFixed(1) : 0}%</Text>
          </View>
        </View>
          <ReportFooter reportDate={reportDate} />
        </Page>

      {/* ====================================================================== */}
      {/* PAGE 2: INVESTMENT PROPERTY & CASH FLOW */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }} wrap={false}>
          <Text style={styles.pageTitle}>Investment Property Potential</Text>

          {/* Service Capacity */}
          <View style={isViable ? styles.highlightBox : styles.warningBox} wrap={false}>
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
            {/* Visuals: Gauge and capacity stacked bar */}
            <View style={{ marginTop: 8 }} wrap={false}>
              <GaugeChart value={isViable ? Math.min(1, surplusIncome / Math.max(1, monthlyIncome || 1)) : 0} width={260} height={100} color={isViable ? COLORS.success : COLORS.warning} />
            </View>
            {/* Property cards (if provided) - prevent page breaks within individual cards */}
            {Array.isArray(safeSummary.properties) && safeSummary.properties.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subsectionTitle}>Property Portfolio</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {safeSummary.properties.map((prop: any, idx: number) => (
                    <View key={idx} style={styles.propertyBox} wrap={false}>
                      <Text style={styles.propertyLabel}>{safeString(prop.address || prop.name || `Property ${idx + 1}`)}</Text>
                      <Text style={styles.propertyValue}>{formatCurrency(safeNumber(prop.currentValue || prop.value || 0))}</Text>
                      <Text style={styles.bodyText}>Equity: {formatCurrency(safeNumber((prop.currentValue || prop.value || 0) - (prop.loanAmount || prop.loan || 0)))}</Text>
                      <Text style={styles.bodyText}>Rent: {formatCurrency(safeNumber((prop.weeklyRent || prop.weekly || 0) * 4))} / month</Text>
                      <Text style={styles.captionText}>Expenses: {formatCurrency(safeNumber(prop.annualExpenses || prop.expenses || 0))}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {/* StackedBarChart moved to Page 3 to balance content */}
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
            <View style={monthlyCashFlow >= 0 ? styles.highlightBox : styles.warningBox} wrap={false}>
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

        <View style={{ flex: 1 }} wrap={false}>
          <Text style={styles.pageTitle}>Detailed Financial Position</Text>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.subsectionTitle}>
              Net Worth: <Text style={netWorth >= 0 ? { color: COLORS.success } : { color: COLORS.danger }}>
                {formatCurrency(netWorth)}
              </Text>
            </Text>
          </View>

          {/* Asset and Liability Summary */}
          <View style={[styles.highlightBox, { marginVertical: 20 }]} wrap={false}> 
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

          {/* Moved: Stacked bar showing income composition for cashflow - placed on Page 3 to balance content */}
          <View style={{ marginTop: 12 }} wrap={false}>
            <Text style={styles.subsectionTitle}>Cash Flow Composition</Text>
            <StackedBarChart
              data={[
                { label: 'Employment', value: monthlyIncome, color: COLORS.info },
                { label: 'Rental', value: monthlyRentalIncome, color: COLORS.purple },
                { label: 'Surplus', value: monthlyCashFlow, color: COLORS.success },
              ]}
              width={440}
              height={50}
            />
          </View>

          {/* Financial Ratios */}
          <View style={[styles.highlightBox, { marginVertical: 20 }]} wrap={false}>
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

        <View style={{ flex: 1 }} wrap={false}>
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
          <View style={isRetirementDeficit ? styles.warningBox : styles.highlightBox} wrap={false}>
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

        <View style={{ flex: 1 }} wrap={false}>
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

          <View style={{ flex: 1 }} wrap={false}>
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

      {/* ====================================================================== */}
      {/* PAGE 7: DETAILED TAX BREAKDOWN */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Detailed Tax Breakdown</Text>

          {/* Superannuation Tax Treatment */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Superannuation Tax Treatment</Text>
            <View style={styles.highlightBox}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Annual Super Contribution (11.5% SG):</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right' }]}>
                  {formatCurrency(monthlyIncome * 12 * 0.115)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Contribution Tax (15%):</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.danger }]}>
                  {formatCurrency(monthlyIncome * 12 * 0.115 * 0.15)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Net Contribution:</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                  {formatCurrency(monthlyIncome * 12 * 0.115 * 0.85)}
                </Text>
              </View>
            </View>
            <Text style={styles.captionText}>
              Superannuation contributions are taxed at 15% concessional rate, significantly lower than marginal tax rates
            </Text>
          </View>

          {/* Salary Sacrifice Opportunity */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Salary Sacrifice Opportunity</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#fff3e0', borderLeftColor: COLORS.orange }]}>
              <Text style={styles.bodyText}>
                By salary sacrificing additional amounts into superannuation, you can reduce your taxable income
                and benefit from the lower 15% tax rate on super contributions.
              </Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Concessional Cap (2024-25):</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right' }]}>$30,000</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Current SG Contribution:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right' }]}>
                    {formatCurrency(monthlyIncome * 12 * 0.115)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Available for Salary Sacrifice:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                    {formatCurrency(Math.max(0, 30000 - monthlyIncome * 12 * 0.115))}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tax in Retirement */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Tax in Retirement</Text>
            <View style={styles.highlightBox}>
              <Text style={styles.bodyText}>
                At age 60 and above, withdrawals from superannuation are generally tax-free. This means your
                retirement income will not be subject to income tax, significantly improving your after-tax position.
              </Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Projected Monthly Retirement Income:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right' }]}>
                    {formatCurrency(projectedRetirementSurplus)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Tax on Super Withdrawals (Age 60+):</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                    $0 (Tax-Free)
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Key Tax Considerations */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Key Tax Considerations</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#f8f9fa' }]}>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • Concessional contributions are capped at $30,000 per year (2024-25)
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • Non-concessional contributions are capped at $120,000 per year
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • Division 293 tax applies to high income earners (over $250,000)
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • Investment earnings in super are taxed at maximum 15%
              </Text>
              <Text style={styles.bodyText}>
                • Capital gains in super are taxed at maximum 10% (33% discount)
              </Text>
            </View>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 8: INVESTMENT PROPERTY ANALYSIS */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Investment Property Analysis</Text>

          {/* Current Property Portfolio */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Current Property Portfolio</Text>
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonBox}>
                <Text style={styles.comparisonLabel}>Total Property Value</Text>
                <Text style={[styles.comparisonValue, { color: COLORS.info }]}>
                  {formatCurrency(totalPropertyValue)}
                </Text>
              </View>
              <View style={styles.comparisonBox}>
                <Text style={styles.comparisonLabel}>Property Equity</Text>
                <Text style={[styles.comparisonValue, styles.valuePositive]}>
                  {formatCurrency(propertyEquity)}
                </Text>
              </View>
            </View>
            <View style={styles.metricGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Loan to Value Ratio</Text>
                <Text style={styles.metricValue}>
                  {totalPropertyValue > 0 ? (((totalPropertyValue - propertyEquity) / totalPropertyValue) * 100).toFixed(1) : 0}%
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Monthly Rental Income</Text>
                <Text style={[styles.metricValue, { color: COLORS.success }]}>
                  {formatCurrency(monthlyRentalIncome)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Gross Yield</Text>
                <Text style={styles.metricValue}>
                  {totalPropertyValue > 0 ? ((monthlyRentalIncome * 12 / totalPropertyValue) * 100).toFixed(2) : 0}%
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Equity Available</Text>
                <Text style={[styles.metricValue, { color: COLORS.info }]}>
                  {formatCurrency(Math.max(0, propertyEquity * 0.8 - (totalPropertyValue - propertyEquity)))}
                </Text>
              </View>
            </View>
          </View>

          {/* Property Growth Projection */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Property Growth Projection (6.5% p.a.)</Text>
            <View style={styles.highlightBox}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Current Value:</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right' }]}>
                  {formatCurrency(totalPropertyValue)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Value at Retirement ({yearsToRetirement} years):</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                  {formatCurrency(projectedPropertyPortfolioValue)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Projected Capital Growth:</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                  {formatCurrency(projectedPropertyPortfolioValue - totalPropertyValue)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Rental Income at Retirement (3% growth p.a.):</Text>
                </Text>
                <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                  {formatCurrency(monthlyRentalIncome * Math.pow(1.03, yearsToRetirement))}/month
                </Text>
              </View>
            </View>
          </View>

          {/* Investment Capacity */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Additional Investment Capacity</Text>
            <View style={isViable ? styles.highlightBox : styles.warningBox}>
              <Text style={styles.highlightTitle}>
                {isViable ? '✓ Investment Capacity Available' : '⚠ Limited Investment Potential'}
              </Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Maximum Additional Property Value:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.info }]}>
                    {formatCurrency(maxPropertyValue)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Available Monthly Surplus:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right', color: COLORS.success }]}>
                    {formatCurrency(surplusIncome)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>
                    <Text style={{ fontWeight: 'bold' }}>Expected Rental from New Property:</Text>
                  </Text>
                  <Text style={[styles.bodyText, { textAlign: 'right' }]}>
                    {formatCurrency(maxPropertyValue * 0.04 / 12)}/month
                  </Text>
                </View>
              </View>
              <Text style={[styles.captionText, { marginTop: 10 }]}>
                {isViable
                  ? 'Based on your current surplus income, you have capacity to service additional investment property.'
                  : 'Focus on increasing income or reducing expenses before considering additional property investment.'}
              </Text>
            </View>
          </View>

          {/* Tax Benefits of Investment Property */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Tax Benefits of Investment Property</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#f8f9fa' }]}>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • <Text style={{ fontWeight: 'bold' }}>Negative Gearing:</Text> Offset property losses against other income
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • <Text style={{ fontWeight: 'bold' }}>Depreciation:</Text> Claim building and fixture depreciation
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 6 }]}>
                • <Text style={{ fontWeight: 'bold' }}>Interest Deductions:</Text> Loan interest is fully deductible
              </Text>
              <Text style={styles.bodyText}>
                • <Text style={{ fontWeight: 'bold' }}>CGT Discount:</Text> 50% discount on capital gains if held 12+ months
              </Text>
            </View>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>

      {/* ====================================================================== */}
      {/* PAGE 9: ASSUMPTIONS & DISCLAIMERS */}
      {/* ====================================================================== */}

      <Page size="A4" style={styles.page}>
        <ReportHeader reportDate={reportDate} clientName={clientFullName} />

        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Assumptions & Methodology</Text>

          {/* Investment Return Assumptions */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Investment Return Assumptions</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#f8f9fa' }]}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Superannuation Return (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>7.0%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Share Market Return (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>8.0%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Property Growth Rate (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>6.5%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Cash/Savings Return (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>4.0%</Text>
              </View>
            </View>
          </View>

          {/* Growth Rate Assumptions */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Growth Rate Assumptions</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#f8f9fa' }]}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Salary Growth (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>3.0%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Rental Growth (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>3.0%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Inflation (CPI) (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>2.5%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Safe Withdrawal Rate (p.a.)</Text>
                <Text style={[styles.bodyText, { textAlign: 'right', fontWeight: 'bold' }]}>4.0%</Text>
              </View>
            </View>
          </View>

          {/* Calculation Methodology */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Calculation Methodology</Text>
            <View style={[styles.highlightBox, { backgroundColor: '#f8f9fa' }]}>
              <Text style={[styles.bodyText, { marginBottom: 8 }]}>
                <Text style={{ fontWeight: 'bold' }}>Compound Growth: </Text>
                All asset values use compound interest formulas to project future values, accounting for
                reinvestment of earnings over time.
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 8 }]}>
                <Text style={{ fontWeight: 'bold' }}>Growing Annuity: </Text>
                Ongoing contributions (such as superannuation guarantee payments) are modeled using growing
                annuity formulas, where contributions increase with salary growth.
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 8 }]}>
                <Text style={{ fontWeight: 'bold' }}>Safe Withdrawal Rate: </Text>
                Retirement income projections use a 4.0% withdrawal rate applied to the total portfolio, 
                based on research suggesting this rate is sustainable over a 30+ year retirement.
              </Text>
              <Text style={styles.bodyText}>
                <Text style={{ fontWeight: 'bold' }}>Target Income: </Text>
                The retirement income target is set at 70% of final salary, aligned with the ASFA
                (Association of Superannuation Funds of Australia) comfortable retirement standard.
              </Text>
            </View>
          </View>

          {/* Important Disclaimers */}
          <View style={styles.section} wrap={false}>
            <Text style={styles.subsectionTitle}>Important Disclaimers</Text>
            <View style={[styles.warningBox, { backgroundColor: '#fff8e1' }]}>
              <Text style={[styles.captionText, { marginBottom: 6, lineHeight: 1.5 }]}>
                This report is provided for informational purposes only and does not constitute financial advice.
                The projections are based on assumptions about future returns, inflation, and other factors that
                may not materialize as expected.
              </Text>
              <Text style={[styles.captionText, { marginBottom: 6, lineHeight: 1.5 }]}>
                Actual investment returns will vary from year to year and may be significantly different from
                the assumptions used in this report. Past performance is not indicative of future results.
              </Text>
              <Text style={[styles.captionText, { marginBottom: 6, lineHeight: 1.5 }]}>
                This report does not take into account your specific circumstances, objectives, or needs.
                You should consider seeking advice from a licensed financial adviser before making any
                investment decisions.
              </Text>
              <Text style={[styles.captionText, { marginBottom: 6, lineHeight: 1.5 }]}>
                Tax laws and superannuation regulations are subject to change and may affect the outcomes
                projected in this report.
              </Text>
              <Text style={[styles.captionText, { lineHeight: 1.5 }]}>
                The information in this report is current as of {reportDate} and may become outdated
                as your circumstances or market conditions change.
              </Text>
            </View>
          </View>
        </View>

        <ReportFooter reportDate={reportDate} />
      </Page>
    </Document>
  );
}
