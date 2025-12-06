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
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #f0f0f0',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2 solid #3498db',
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
  },
  chart: {
    width: '100%',
    maxWidth: 500,
    height: 250,
    marginBottom: 15,
  },
  explanation: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    borderLeft: '4 solid #3498db',
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
    borderBottom: '1 solid #e0e0e0',
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
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTop: '1 solid #e0e0e0',
    paddingTop: 10,
  },
  highlightBox: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeft: '4 solid #4caf50',
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeft: '4 solid #ff9800',
  },
  recommendationBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 5,
    marginVertical: 10,
    borderLeft: '4 solid #2196f3',
  },
});

interface FinancialSummary {
  clientName: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  projectedRetirementLumpSum: number;
  retirementDeficitSurplus: number;
  isRetirementDeficit: boolean;
  yearsToRetirement: number;
  currentTax: number;
  optimizedTax: number;
  taxSavings: number;
  investmentProperties: number;
  totalPropertyValue: number;
  totalPropertyDebt: number;
  propertyEquity: number;
  recommendations: string[];
}

interface ChartImage {
  dataUrl: string;
  type: 'income' | 'expenses' | 'assets' | 'liabilities' | 'cashflow' | 'retirement';
}

interface PDFReportProps {
  summary: FinancialSummary;
  chartImages: ChartImage[];
  clientData?: any;
}

export const PDFReport: React.FC<PDFReportProps> = ({ summary, chartImages, clientData }) => {
  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  
  const getChartImage = (type: ChartImage['type']) => {
    return chartImages.find(chart => chart.type === type)?.dataUrl || '';
  };

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
                Prepared for: {summary.clientName}
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
                ${summary.netWorth.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Net Worth</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { 
                color: summary.monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' 
              }]}>
                ${summary.monthlyCashFlow.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Monthly Cash Flow</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: '#3498db' }]}>
                ${summary.taxSavings.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Tax Savings Potential</Text>
            </View>
          </View>
        </View>

        {/* Financial Overview Chart */}
        {getChartImage('income') ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Analysis</Text>
            <View style={styles.chartContainer}>
              <Image src={getChartImage('income')} style={styles.chart} />
            </View>
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>Understanding Your Income</Text>
              <Text style={styles.explanationText}>
                Your total annual income is ${(summary.monthlyIncome * 12).toLocaleString()}, 
                which breaks down to ${summary.monthlyIncome.toLocaleString()} per month. 
                {'\n\n'}
                • Primary income source: Employment income
                {'\n'}
                • Additional income streams: Rental and investment income provide diversification
                {'\n'}
                • Recommendation: Consider increasing passive income sources to build financial resilience
              </Text>
            </View>
          </View>
        ) : null}

        {/* Expenses Breakdown */}
        {getChartImage('expenses') ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Breakdown</Text>
            <View style={styles.chartContainer}>
              <Image src={getChartImage('expenses')} style={styles.chart} />
            </View>
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>Understanding Your Expenses</Text>
              <Text style={styles.explanationText}>
                Your monthly expenses total ${summary.monthlyExpenses.toLocaleString()}, 
                representing {summary.monthlyIncome > 0 ? ((summary.monthlyExpenses / summary.monthlyIncome) * 100).toFixed(1) : 0}% 
                of your monthly income.
                {'\n\n'}
                • Work-related expenses: Tax-deductible expenses that reduce your taxable income
                {'\n'}
                • Investment expenses: Costs associated with managing your investment portfolio
                {'\n'}
                • Recommendation: Review expense categories regularly to identify optimization opportunities
              </Text>
            </View>
          </View>
        ) : null}

        {/* Assets vs Liabilities */}
        {getChartImage('assets') ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assets & Liabilities Overview</Text>
            <View style={styles.chartContainer}>
              <Image src={getChartImage('assets')} style={styles.chart} />
            </View>
            <View style={styles.explanation}>
              <Text style={styles.explanationTitle}>Understanding Your Financial Position</Text>
              <Text style={styles.explanationText}>
                Your total assets of ${summary.totalAssets.toLocaleString()} are offset by 
                liabilities of ${summary.totalLiabilities.toLocaleString()}, resulting in a net worth 
                of ${summary.netWorth.toLocaleString()}.
                {'\n\n'}
                • Asset allocation: Diversification across property, superannuation, and investments
                {'\n'}
                • Debt-to-asset ratio: {summary.totalAssets > 0 ? ((summary.totalLiabilities / summary.totalAssets) * 100).toFixed(1) : 0}% 
                (lower is generally better)
                {'\n'}
                • Recommendation: Focus on building assets while strategically managing debt
              </Text>
            </View>
          </View>
        ) : null}

        {/* Cash Flow Analysis */}
        {getChartImage('cashflow') ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
            <View style={styles.chartContainer}>
              <Image src={getChartImage('cashflow')} style={styles.chart} />
            </View>
            <View style={[summary.monthlyCashFlow >= 0 ? styles.highlightBox : styles.warningBox]}>
              <Text style={styles.explanationTitle}>
                {summary.monthlyCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
              </Text>
              <Text style={styles.explanationText}>
                {summary.monthlyCashFlow >= 0 
                  ? `You have a positive monthly cash flow of ${summary.monthlyCashFlow.toLocaleString()}, 
                     representing a savings rate of ${summary.monthlyIncome > 0 ? ((summary.monthlyCashFlow / summary.monthlyIncome) * 100).toFixed(1) : 0}%. 
                     This surplus can be used for investments, debt reduction, or building emergency funds.`
                  : `Your monthly expenses exceed income by ${Math.abs(summary.monthlyCashFlow).toLocaleString()}. 
                     Consider reviewing expenses, increasing income, or adjusting your financial strategy.`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Retirement Projection */}
        {getChartImage('retirement') ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Retirement Planning</Text>
            <View style={styles.chartContainer}>
              <Image src={getChartImage('retirement')} style={styles.chart} />
            </View>
            <View style={[summary.isRetirementDeficit ? styles.warningBox : styles.highlightBox]}>
              <Text style={styles.explanationTitle}>
                {summary.isRetirementDeficit ? 'Retirement Planning Alert' : 'Retirement On Track'}
              </Text>
              <Text style={styles.explanationText}>
                {summary.isRetirementDeficit
                  ? `Based on current projections, you may face a retirement shortfall. 
                     With ${summary.yearsToRetirement} years until retirement, consider increasing 
                     superannuation contributions or adjusting your retirement timeline.`
                  : `Your retirement planning is on track. Your projected retirement lump sum of 
                     ${summary.projectedRetirementLumpSum.toLocaleString()} provides a solid foundation 
                     for your retirement years.`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations & Action Items</Text>
          {summary.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationBox}>
              <Text style={styles.explanationText}>
                {index + 1}. {rec}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text 
          style={styles.footer} 
          render={({ pageNumber, totalPages }) => 
            `Page ${pageNumber} of ${totalPages} | Generated on ${reportDate} | Perpetual Wealth Partners`
          } 
          fixed 
        />
      </Page>
    </Document>
  );
};
