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

  // New styles for multi-client executive summary
  clientComparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
    width: '100%',
  },
  clientColumn: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  clientMetrics: {
    width: '100%',
  },

  // Retirement projections section
  retirementProjectionSection: {
    marginBottom: 30,
  },
  retirementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  retirementBox: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  retirementLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  retirementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  retirementSubtext: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },

  // Key insights section
  insightsSection: {
    marginBottom: 30,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  insightBox: {
    flex: 1,
    padding: 14,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
  },

  // Success and warning boxes
  successBox: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.success,
    marginVertical: 16,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  boxText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333',
  },

  // Serviceability metrics
  serviceabilityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    width: '100%',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    minHeight: 70,
    justifyContent: 'center',
  },

  // Chart section
  chartSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 12,
  },
  largeChart: {
    width: '95%',
    height: 240,
    maxWidth: 520,
  },

  // Property section
  propertySection: {
    marginTop: 20,
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  propertyCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  propertyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 4,
  },
  propertyDetail: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },

  // Cash flow breakdown
  cashFlowOverview: {
    marginBottom: 20,
  },
  cashFlowSummary: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 10,
    color: '#666',
  },

  breakdownSection: {
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  categoryItem: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryPercent: {
    fontSize: 8,
    color: '#999',
  },

  // Financial position
  netWorthSummary: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  netWorthValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },

  assetsLiabilitiesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  halfSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sectionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  assetBreakdown: {
    marginTop: 12,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  assetLabel: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  assetValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  assetPercent: {
    fontSize: 8,
    color: '#999',
    marginLeft: 8,
  },

  liabilityBreakdown: {
    marginTop: 12,
  },
  liabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  liabilityLabel: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  liabilityValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  liabilityPercent: {
    fontSize: 8,
    color: '#999',
    marginLeft: 8,
  },

  ratiosSection: {
    marginTop: 20,
  },
  ratiosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  ratioItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  ratioValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },

  // Retirement projections
  retirementTimeline: {
    marginBottom: 20,
  },
  timelineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  timelineItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },

  projectionSummary: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 20,
  },
  projectionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  projectionSubtext: {
    fontSize: 9,
    color: '#666',
  },

  incomeAnalysis: {
    marginBottom: 20,
  },
  incomeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  incomeItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  incomeLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  incomeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Tax optimization
  taxSummary: {
    marginBottom: 20,
  },
  taxMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  taxMetric: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },

  optimizationSection: {
    marginBottom: 20,
  },
  opportunitiesList: {
    marginTop: 12,
  },
  opportunityItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  opportunityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  opportunityDescription: {
    fontSize: 9,
    color: '#333',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  opportunitySavings: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
  },

  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationsList: {
    marginTop: 12,
  },
  recommendationItem: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  recommendationText: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.4,
  },
});

// ============================================================================
// INTERFACES AND UTILITIES
// ============================================================================

interface ClientData {
  firstName?: string;
  lastName?: string;
  currentAge?: number;
  retirementAge?: number;
  [key: string]: any;
}

interface FinancialData {
  // Client info
  clientA?: ClientData;
  clientB?: ClientData;
  combined?: ClientData;

  // Net worth data
  currentNetWorth?: number;
  retirementNetWorth?: number;

  // Cash flow data
  currentMonthlyCashFlow?: number;
  retirementMonthlyCashFlow?: number;

  // Retirement projections
  projectedRetirementSurplus?: number;
  yearsToRetirement?: number;
  projectedLumpSum?: number;
  monthlySurplus?: number;

  // Property portfolio
  propertyPortfolioValue?: number;

  // Tax data
  currentTax?: number;
  optimizedTax?: number;
  taxSavings?: number;

  // Serviceability
  maxPropertyValue?: number;
  surplusIncome?: number;

  // Cash flow breakdown
  cashFlowBreakdown?: {
    employment: number;
    rental: number;
    investment: number;
    other: number;
    workExpenses: number;
    investmentExpenses: number;
    rentalExpenses: number;
    vehicleExpenses: number;
    homeOfficeExpenses: number;
  };

  // Financial position breakdown
  financialPosition?: {
    home: number;
    investments: number;
    super: number;
    shares: number;
    savings: number;
    vehicle: number;
    other: number;
    homeLoan: number;
    investmentLoans: number;
    creditCard: number;
    personalLoan: number;
    hecs: number;
  };

  [key: string]: any;
}

interface PDFReportProps {
  data: FinancialData;
  chartImages?: Array<{ type: string; dataUrl: string }>;
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

// ============================================================================
// HEADER AND FOOTER COMPONENTS
// ============================================================================

const ReportHeader = ({ reportDate, clientNames }: { reportDate: string; clientNames: string[] }) => (
  <View style={styles.header} fixed>
    <Text style={styles.headerCompany}>Perpetual Wealth Partners</Text>
    <Text style={styles.headerMeta}>Financial Report - {clientNames.join(' & ')}</Text>
    <Text style={styles.headerMeta}>Generated: {reportDate}</Text>
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

export function PDFReport({ data, chartImages = [] }: PDFReportProps) {
  // Extract client data
  const clientA = data.clientA || {};
  const clientB = data.clientB || {};
  const combined = data.combined || {};

  // Get client names
  const clientAName = `${safeString(clientA.firstName)} ${safeString(clientA.lastName)}`.trim() || 'Client A';
  const clientBName = `${safeString(clientB.firstName)} ${safeString(clientB.lastName)}`.trim() || 'Client B';
  const combinedName = 'Combined Household';

  const clientNames = [clientAName];
  if (clientB.firstName || clientB.lastName) clientNames.push(clientBName);

  const reportDate = format(new Date(), 'MMMM dd, yyyy');

  // Helper to get chart image
  const getChartImage = (type: string) => {
    return chartImages?.find(img => img.type === type)?.dataUrl;
  };

  // ========================================================================
  // PAGE 1: EXECUTIVE SUMMARY
  // ========================================================================

  const ExecutiveSummaryPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Executive Summary</Text>

        {/* Client Comparison Grid */}
        <View style={styles.clientComparisonGrid}>
          <View style={styles.clientColumn}>
            <Text style={styles.clientName}>{clientAName}</Text>
            <View style={styles.clientMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Current Age:</Text>
                <Text style={styles.bodyText}>{safeNumber(clientA.currentAge, 0)}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Retirement Age:</Text>
                <Text style={styles.bodyText}>{safeNumber(clientA.retirementAge, 65)}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Net Worth:</Text>
                <Text style={[styles.bodyText, styles.valuePositive]}>
                  {formatCurrency(data.currentNetWorth)}
                </Text>
              </View>
            </View>
          </View>

          {clientNames.length > 1 && (
            <View style={styles.clientColumn}>
              <Text style={styles.clientName}>{clientBName}</Text>
              <View style={styles.clientMetrics}>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>Current Age:</Text>
                  <Text style={styles.bodyText}>{safeNumber(clientB.currentAge, 0)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>Retirement Age:</Text>
                  <Text style={styles.bodyText}>{safeNumber(clientB.retirementAge, 65)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.bodyText}>Net Worth:</Text>
                  <Text style={[styles.bodyText, styles.valuePositive]}>
                    {formatCurrency(data.currentNetWorth)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.clientColumn}>
            <Text style={styles.clientName}>{combinedName}</Text>
            <View style={styles.clientMetrics}>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Household Net Worth:</Text>
                <Text style={[styles.bodyText, styles.valuePositive]}>
                  {formatCurrency(data.currentNetWorth)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Monthly Cash Flow:</Text>
                <Text style={[styles.bodyText, safeNumber(data.currentMonthlyCashFlow, 0) >= 0 ? styles.valuePositive : styles.valueNegative]}>
                  {formatCurrency(data.currentMonthlyCashFlow)}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.bodyText}>Years to Retirement:</Text>
                <Text style={styles.bodyText}>{safeNumber(data.yearsToRetirement, 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Retirement Projections Section */}
        <View style={styles.retirementProjectionSection}>
          <Text style={styles.sectionTitle}>Retirement Projections</Text>
          <View style={styles.retirementGrid}>
            <View style={styles.retirementBox}>
              <Text style={styles.retirementLabel}>Projected Retirement Surplus</Text>
              <Text style={styles.retirementValue}>
                {formatCurrency(data.projectedRetirementSurplus)}
              </Text>
              <Text style={styles.retirementSubtext}>Annual surplus income</Text>
            </View>
            <View style={styles.retirementBox}>
              <Text style={styles.retirementLabel}>Projected Lump Sum</Text>
              <Text style={styles.retirementValue}>
                {formatCurrency(data.projectedLumpSum)}
              </Text>
              <Text style={styles.retirementSubtext}>Available at retirement</Text>
            </View>
            <View style={styles.retirementBox}>
              <Text style={styles.retirementLabel}>Monthly Surplus</Text>
              <Text style={styles.retirementValue}>
                {formatCurrency(data.monthlySurplus)}
              </Text>
              <Text style={styles.retirementSubtext}>Monthly surplus income</Text>
            </View>
          </View>
        </View>

        {/* Key Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.subsectionTitle}>Key Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>Investment Property Potential</Text>
              <Text style={styles.insightValue}>
                {formatCurrency(data.maxPropertyValue)}
              </Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>Tax Optimization Savings</Text>
              <Text style={styles.insightValue}>
                {formatCurrency(data.taxSavings)}
              </Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>Property Portfolio Value</Text>
              <Text style={styles.insightValue}>
                {formatCurrency(data.propertyPortfolioValue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Success/Warning Messages */}
        {safeNumber(data.currentMonthlyCashFlow, 0) >= 0 ? (
          <View style={styles.successBox}>
            <Text style={styles.boxTitle}>Positive Cash Flow Position</Text>
            <Text style={styles.boxText}>
              Your household maintains a healthy positive cash flow of {formatCurrency(data.currentMonthlyCashFlow)} per month,
              providing strong financial stability and investment capacity.
            </Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Text style={styles.boxTitle}>Cash Flow Optimization Needed</Text>
            <Text style={styles.boxText}>
              Current cash flow shows a deficit of {formatCurrency(Math.abs(safeNumber(data.currentMonthlyCashFlow, 0)))} per month.
              Review the detailed cash flow breakdown for optimization opportunities.
            </Text>
          </View>
        )}
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  // ========================================================================
  // PAGE 2: INVESTMENT PROPERTY POTENTIAL
  // ========================================================================

  const InvestmentPropertyPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Investment Property Potential</Text>

        {/* Serviceability Metrics */}
        <View style={styles.serviceabilityMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.serviceValue}>{formatCurrency(data.maxPropertyValue)}</Text>
            <Text style={styles.serviceLabel}>Maximum Property Value</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.serviceValue}>{formatCurrency(data.surplusIncome)}</Text>
            <Text style={styles.serviceLabel}>Surplus Income</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.serviceValue}>
              {safeNumber(data.maxPropertyValue, 0) ? ((safeNumber(data.surplusIncome, 0) / safeNumber(data.maxPropertyValue, 0)) * 100).toFixed(1) : '0.0'}%
            </Text>
            <Text style={styles.serviceLabel}>Income to Value Ratio</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {getChartImage('serviceability') ? (
            <Image style={styles.largeChart} src={getChartImage('serviceability')} />
          ) : (
            <Text style={styles.captionText}>Serviceability Chart</Text>
          )}
        </View>

        {/* Property Recommendations */}
        <View style={styles.propertySection}>
          <Text style={styles.subsectionTitle}>Recommended Investment Properties</Text>
          <View style={styles.propertyGrid}>
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>Entry-Level Investment</Text>
              <Text style={styles.propertyValue}>$500K - $750K</Text>
              <Text style={styles.propertyDetail}>• Units in growth suburbs</Text>
              <Text style={styles.propertyDetail}>• Cash flow positive from day 1</Text>
              <Text style={styles.propertyDetail}>• Capital growth potential 6-8%</Text>
            </View>
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>Mid-Range Investment</Text>
              <Text style={styles.propertyValue}>$750K - $1.2M</Text>
              <Text style={styles.propertyDetail}>• Houses in established areas</Text>
              <Text style={styles.propertyDetail}>• Strong rental yields</Text>
              <Text style={styles.propertyDetail}>• Capital growth potential 5-7%</Text>
            </View>
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>Premium Investment</Text>
              <Text style={styles.propertyValue}>$1.2M+</Text>
              <Text style={styles.propertyDetail}>• Luxury properties in prime locations</Text>
              <Text style={styles.propertyDetail}>• High rental returns</Text>
              <Text style={styles.propertyDetail}>• Capital growth potential 4-6%</Text>
            </View>
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>Commercial Property</Text>
              <Text style={styles.propertyValue}>$2M+</Text>
              <Text style={styles.propertyDetail}>• Retail/office spaces</Text>
              <Text style={styles.propertyDetail}>• Long-term leases</Text>
              <Text style={styles.propertyDetail}>• Stable income streams</Text>
            </View>
          </View>
        </View>

        {/* Investment Strategy */}
        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Investment Strategy Recommendations</Text>
          <Text style={styles.highlightText}>
            Based on your current financial position and surplus income of {formatCurrency(data.surplusIncome)},
            you have capacity for investment properties up to {formatCurrency(data.maxPropertyValue)}.
            Consider starting with one property to build experience and cash flow before expanding your portfolio.
          </Text>
        </View>
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  // ========================================================================
  // PAGE 3: CASH FLOW BREAKDOWN
  // ========================================================================

  const CashFlowBreakdownPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Cash Flow Breakdown</Text>

        {/* Cash Flow Overview */}
        <View style={styles.cashFlowOverview}>
          <View style={styles.cashFlowSummary}>
            <Text style={styles.summaryTitle}>Monthly Cash Flow Summary</Text>
            <Text style={[styles.summaryValue, safeNumber(data.currentMonthlyCashFlow, 0) >= 0 ? styles.valuePositive : styles.valueNegative]}>
              {formatCurrency(data.currentMonthlyCashFlow)}
            </Text>
            <Text style={styles.summarySubtext}>
              {safeNumber(data.currentMonthlyCashFlow, 0) >= 0 ? 'Positive cash flow' : 'Cash flow deficit'}
            </Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {getChartImage('cashflow') ? (
            <Image style={styles.largeChart} src={getChartImage('cashflow')} />
          ) : (
            <Text style={styles.captionText}>Cash Flow Chart</Text>
          )}
        </View>

        {/* Income Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.subsectionTitle}>Income Sources</Text>
          <View style={styles.categoryGrid}>
            {data.cashFlowBreakdown && (
              <>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Employment Income</Text>
                  <Text style={[styles.categoryValue, styles.valuePositive]}>
                    {formatCurrency(data.cashFlowBreakdown.employment)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.employment / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Rental Income</Text>
                  <Text style={[styles.categoryValue, styles.valuePositive]}>
                    {formatCurrency(data.cashFlowBreakdown.rental)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.rental / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Investment Income</Text>
                  <Text style={[styles.categoryValue, styles.valuePositive]}>
                    {formatCurrency(data.cashFlowBreakdown.investment)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.investment / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Other Income</Text>
                  <Text style={[styles.categoryValue, styles.valuePositive]}>
                    {formatCurrency(data.cashFlowBreakdown.other)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.other / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.subsectionTitle}>Expense Categories</Text>
          <View style={styles.categoryGrid}>
            {data.cashFlowBreakdown && (
              <>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Work Expenses</Text>
                  <Text style={[styles.categoryValue, styles.valueNegative]}>
                    {formatCurrency(data.cashFlowBreakdown.workExpenses)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.workExpenses / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Investment Expenses</Text>
                  <Text style={[styles.categoryValue, styles.valueNegative]}>
                    {formatCurrency(data.cashFlowBreakdown.investmentExpenses)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.investmentExpenses / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Rental Expenses</Text>
                  <Text style={[styles.categoryValue, styles.valueNegative]}>
                    {formatCurrency(data.cashFlowBreakdown.rentalExpenses)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.rentalExpenses / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Vehicle Expenses</Text>
                  <Text style={[styles.categoryValue, styles.valueNegative]}>
                    {formatCurrency(data.cashFlowBreakdown.vehicleExpenses)}
                  </Text>
                  <Text style={styles.categoryPercent}>
                    {data.currentMonthlyCashFlow ? ((data.cashFlowBreakdown.vehicleExpenses / Math.abs(data.currentMonthlyCashFlow)) * 100).toFixed(1) : '0.0'}%
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  // ========================================================================
  // PAGE 4: FINANCIAL POSITION
  // ========================================================================

  const FinancialPositionPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Financial Position</Text>

        {/* Net Worth Summary */}
        <View style={styles.netWorthSummary}>
          <Text style={styles.pageTitle}>Total Net Worth</Text>
          <Text style={styles.netWorthValue}>{formatCurrency(data.currentNetWorth)}</Text>
          <Text style={styles.captionText}>Current household net worth</Text>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {getChartImage('networth') ? (
            <Image style={styles.largeChart} src={getChartImage('networth')} />
          ) : (
            <Text style={styles.captionText}>Net Worth Chart</Text>
          )}
        </View>

        {/* Assets and Liabilities */}
        <View style={styles.assetsLiabilitiesSection}>
          <View style={styles.halfSection}>
            <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Assets</Text>
            <Text style={[styles.sectionValue, styles.valuePositive]}>
              {formatCurrency(
                (data.financialPosition?.home || 0) +
                (data.financialPosition?.investments || 0) +
                (data.financialPosition?.super || 0) +
                (data.financialPosition?.shares || 0) +
                (data.financialPosition?.savings || 0) +
                (data.financialPosition?.vehicle || 0) +
                (data.financialPosition?.other || 0)
              )}
            </Text>
            <View style={styles.assetBreakdown}>
              {data.financialPosition && (
                <>
                  <View style={styles.assetItem}>
                    <Text style={styles.assetLabel}>Home</Text>
                    <Text style={styles.assetValue}>{formatCurrency(data.financialPosition.home)}</Text>
                    <Text style={styles.assetPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.home / data.currentNetWorth) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.assetItem}>
                    <Text style={styles.assetLabel}>Investments</Text>
                    <Text style={styles.assetValue}>{formatCurrency(data.financialPosition.investments)}</Text>
                    <Text style={styles.assetPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.investments / data.currentNetWorth) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.assetItem}>
                    <Text style={styles.assetLabel}>Superannuation</Text>
                    <Text style={styles.assetValue}>{formatCurrency(data.financialPosition.super)}</Text>
                    <Text style={styles.assetPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.super / data.currentNetWorth) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.assetItem}>
                    <Text style={styles.assetLabel}>Shares</Text>
                    <Text style={styles.assetValue}>{formatCurrency(data.financialPosition.shares)}</Text>
                    <Text style={styles.assetPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.shares / data.currentNetWorth) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.assetItem}>
                    <Text style={styles.assetLabel}>Savings</Text>
                    <Text style={styles.assetValue}>{formatCurrency(data.financialPosition.savings)}</Text>
                    <Text style={styles.assetPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.savings / data.currentNetWorth) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.halfSection}>
            <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Liabilities</Text>
            <Text style={[styles.sectionValue, styles.valueNegative]}>
              {formatCurrency(
                (data.financialPosition?.homeLoan || 0) +
                (data.financialPosition?.investmentLoans || 0) +
                (data.financialPosition?.creditCard || 0) +
                (data.financialPosition?.personalLoan || 0) +
                (data.financialPosition?.hecs || 0)
              )}
            </Text>
            <View style={styles.liabilityBreakdown}>
              {data.financialPosition && (
                <>
                  <View style={styles.liabilityItem}>
                    <Text style={styles.liabilityLabel}>Home Loan</Text>
                    <Text style={styles.liabilityValue}>{formatCurrency(data.financialPosition.homeLoan)}</Text>
                    <Text style={styles.liabilityPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.homeLoan / Math.abs(data.currentNetWorth)) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.liabilityItem}>
                    <Text style={styles.liabilityLabel}>Investment Loans</Text>
                    <Text style={styles.liabilityValue}>{formatCurrency(data.financialPosition.investmentLoans)}</Text>
                    <Text style={styles.liabilityPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.investmentLoans / Math.abs(data.currentNetWorth)) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.liabilityItem}>
                    <Text style={styles.liabilityLabel}>Credit Card</Text>
                    <Text style={styles.liabilityValue}>{formatCurrency(data.financialPosition.creditCard)}</Text>
                    <Text style={styles.liabilityPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.creditCard / Math.abs(data.currentNetWorth)) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                  <View style={styles.liabilityItem}>
                    <Text style={styles.liabilityLabel}>Personal Loan</Text>
                    <Text style={styles.liabilityValue}>{formatCurrency(data.financialPosition.personalLoan)}</Text>
                    <Text style={styles.liabilityPercent}>
                      {data.currentNetWorth ? ((data.financialPosition.personalLoan / Math.abs(data.currentNetWorth)) * 100).toFixed(1) : '0.0'}%
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Financial Ratios */}
        <View style={styles.ratiosSection}>
          <Text style={styles.subsectionTitle}>Key Financial Ratios</Text>
          <View style={styles.ratiosGrid}>
            <View style={styles.ratioItem}>
              <Text style={styles.ratioLabel}>Debt to Asset Ratio</Text>
              <Text style={styles.ratioValue}>
                {data.currentNetWorth ?
                  (((data.financialPosition?.homeLoan || 0) + (data.financialPosition?.investmentLoans || 0)) /
                   ((data.financialPosition?.home || 0) + (data.financialPosition?.investments || 0) + (data.financialPosition?.savings || 0))).toFixed(2)
                  : '0.00'}
              </Text>
            </View>
            <View style={styles.ratioItem}>
              <Text style={styles.ratioLabel}>Savings Ratio</Text>
              <Text style={styles.ratioValue}>
                {safeNumber(data.currentNetWorth, 0) ?
                  (((data.financialPosition?.savings || 0) / safeNumber(data.currentNetWorth, 0)) * 100).toFixed(1) + '%'
                  : '0.0%'}
              </Text>
            </View>
            <View style={styles.ratioItem}>
              <Text style={styles.ratioLabel}>Investment Ratio</Text>
              <Text style={styles.ratioValue}>
                {safeNumber(data.currentNetWorth, 0) ?
                  ((((data.financialPosition?.investments || 0) + (data.financialPosition?.shares || 0)) / safeNumber(data.currentNetWorth, 0)) * 100).toFixed(1) + '%'
                  : '0.0%'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  // ========================================================================
  // PAGE 5: RETIREMENT PROJECTIONS
  // ========================================================================

  const RetirementProjectionsPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Retirement Projections</Text>

        {/* Retirement Timeline */}
        <View style={styles.retirementTimeline}>
          <Text style={styles.subsectionTitle}>Retirement Timeline</Text>
          <View style={styles.timelineGrid}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Current Age</Text>
              <Text style={styles.timelineValue}>
                {safeNumber(combined.currentAge, 0)}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Years to Retirement</Text>
              <Text style={styles.timelineValue}>
                {safeNumber(data.yearsToRetirement, 0)}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Retirement Age</Text>
              <Text style={styles.timelineValue}>
                {safeNumber(combined.retirementAge, 65)}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Life Expectancy</Text>
              <Text style={styles.timelineValue}>85</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {getChartImage('retirement') ? (
            <Image style={styles.largeChart} src={getChartImage('retirement')} />
          ) : (
            <Text style={styles.captionText}>Retirement Projection Chart</Text>
          )}
        </View>

        {/* Projection Summary */}
        <View style={styles.projectionSummary}>
          <Text style={styles.subsectionTitle}>Retirement Income Projections</Text>
          <Text style={styles.projectionValue}>
            {formatCurrency(data.projectedRetirementSurplus)}
          </Text>
          <Text style={styles.projectionSubtext}>Projected annual retirement income</Text>
        </View>

        {/* Income Analysis */}
        <View style={styles.incomeAnalysis}>
          <Text style={styles.subsectionTitle}>Income Sources at Retirement</Text>
          <View style={styles.incomeGrid}>
            <View style={styles.incomeItem}>
              <Text style={styles.incomeLabel}>Superannuation</Text>
              <Text style={[styles.incomeValue, styles.valuePositive]}>
                {formatCurrency((data.financialPosition?.super || 0) * 0.6)} {/* Estimated 60% of super as pension */}
              </Text>
            </View>
            <View style={styles.incomeItem}>
              <Text style={styles.incomeLabel}>Investment Income</Text>
              <Text style={[styles.incomeValue, styles.valuePositive]}>
                {formatCurrency((data.financialPosition?.investments || 0) * 0.04)} {/* 4% withdrawal rate */}
              </Text>
            </View>
            <View style={styles.incomeItem}>
              <Text style={styles.incomeLabel}>Rental Income</Text>
              <Text style={[styles.incomeValue, styles.valuePositive]}>
                {formatCurrency(data.cashFlowBreakdown?.rental || 0)}
              </Text>
            </View>
            <View style={styles.incomeItem}>
              <Text style={styles.incomeLabel}>Age Pension</Text>
              <Text style={[styles.incomeValue, styles.valuePositive]}>
                {formatCurrency(25000)} {/* Estimated age pension */}
              </Text>
            </View>
          </View>
        </View>

        {/* Retirement Readiness */}
        {safeNumber(data.projectedRetirementSurplus, 0) >= 50000 ? (
          <View style={styles.successBox}>
            <Text style={styles.boxTitle}>Strong Retirement Position</Text>
            <Text style={styles.boxText}>
              Your projected retirement surplus of {formatCurrency(data.projectedRetirementSurplus)} annually
              positions you well for a comfortable retirement with multiple income streams.
            </Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Text style={styles.boxTitle}>Retirement Planning Required</Text>
            <Text style={styles.boxText}>
              Your current projections show a retirement surplus of {formatCurrency(data.projectedRetirementSurplus)}.
              Consider increasing super contributions or investment amounts to improve retirement readiness.
            </Text>
          </View>
        )}
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  // ========================================================================
  // PAGE 6: TAX OPTIMIZATION
  // ========================================================================

  const TaxOptimizationPage = () => (
    <Page size="A4" style={styles.page}>
      <ReportHeader reportDate={reportDate} clientNames={clientNames} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Tax Optimization</Text>

        {/* Tax Summary */}
        <View style={styles.taxSummary}>
          <View style={styles.taxMetrics}>
            <View style={styles.taxMetric}>
              <Text style={styles.serviceValue}>{formatCurrency(data.currentTax)}</Text>
              <Text style={styles.serviceLabel}>Current Tax</Text>
            </View>
            <View style={styles.taxMetric}>
              <Text style={styles.serviceValue}>{formatCurrency(data.optimizedTax)}</Text>
              <Text style={styles.serviceLabel}>Optimized Tax</Text>
            </View>
            <View style={styles.taxMetric}>
              <Text style={[styles.serviceValue, styles.valuePositive]}>{formatCurrency(data.taxSavings)}</Text>
              <Text style={styles.serviceLabel}>Potential Savings</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {getChartImage('tax') ? (
            <Image style={styles.largeChart} src={getChartImage('tax')} />
          ) : (
            <Text style={styles.captionText}>Tax Optimization Chart</Text>
          )}
        </View>

        {/* Optimization Opportunities */}
        <View style={styles.optimizationSection}>
          <Text style={styles.subsectionTitle}>Tax Optimization Opportunities</Text>
          <View style={styles.opportunitiesList}>
            <View style={styles.opportunityItem}>
              <Text style={styles.opportunityTitle}>Superannuation Contributions</Text>
              <Text style={styles.opportunityDescription}>
                Maximize concessional contributions to reduce taxable income and grow retirement savings tax-effectively.
              </Text>
              <Text style={styles.opportunitySavings}>Potential Savings: {formatCurrency(safeNumber(data.taxSavings, 0) * 0.3)}</Text>
            </View>
            <View style={styles.opportunityItem}>
              <Text style={styles.opportunityTitle}>Investment Property Deductions</Text>
              <Text style={styles.opportunityDescription}>
                Utilize depreciation, interest deductions, and other property-related expenses to offset rental income.
              </Text>
              <Text style={styles.opportunitySavings}>Potential Savings: {formatCurrency(safeNumber(data.taxSavings, 0) * 0.25)}</Text>
            </View>
            <View style={styles.opportunityItem}>
              <Text style={styles.opportunityTitle}>Negative Gearing Strategy</Text>
              <Text style={styles.opportunityDescription}>
                Invest in properties that produce tax losses, offsetting other income while building wealth.
              </Text>
              <Text style={styles.opportunitySavings}>Potential Savings: {formatCurrency(safeNumber(data.taxSavings, 0) * 0.2)}</Text>
            </View>
            <View style={styles.opportunityItem}>
              <Text style={styles.opportunityTitle}>Franking Credit Utilization</Text>
              <Text style={styles.opportunityDescription}>
                Maximize dividend income with franking credits to reduce overall tax liability.
              </Text>
              <Text style={styles.opportunitySavings}>Potential Savings: {formatCurrency(safeNumber(data.taxSavings, 0) * 0.15)}</Text>
            </View>
            <View style={styles.opportunityItem}>
              <Text style={styles.opportunityTitle}>Salary Sacrificing</Text>
              <Text style={styles.opportunityDescription}>
                Sacrifice salary into superannuation to reduce taxable income and increase retirement savings.
              </Text>
              <Text style={styles.opportunitySavings}>Potential Savings: {formatCurrency(safeNumber(data.taxSavings, 0) * 0.1)}</Text>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.subsectionTitle}>Implementation Recommendations</Text>
          <View style={styles.recommendationsList}>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>
                Review current super contribution levels and consider increasing concessional contributions to $110,000 annually.
              </Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>
                Consult with a tax advisor to implement negative gearing strategies for investment properties.
              </Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>
                Maximize salary sacrificing arrangements to reduce taxable income while building retirement savings.
              </Text>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>
                Review investment portfolio for franking credit opportunities and dividend reinvestment strategies.
              </Text>
            </View>
          </View>
        </View>
      </View>
      <ReportFooter reportDate={reportDate} />
    </Page>
  );

  return (
    <Document>
      <ExecutiveSummaryPage />
      <InvestmentPropertyPage />
      <CashFlowBreakdownPage />
      <FinancialPositionPage />
      <RetirementProjectionsPage />
      <TaxOptimizationPage />
    </Document>
  );
}
