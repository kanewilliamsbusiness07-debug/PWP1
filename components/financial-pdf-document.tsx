import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Styles - MUST be defined outside component
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#95a5a6',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  positiveValue: {
    color: '#27ae60',
  },
  negativeValue: {
    color: '#e74c3c',
  },
  neutralValue: {
    color: '#f39c12',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  statusGood: {
    backgroundColor: '#d4edda',
  },
  statusWarning: {
    backgroundColor: '#fff3cd',
  },
  statusBad: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextGood: {
    color: '#155724',
  },
  statusTextWarning: {
    color: '#856404',
  },
  statusTextBad: {
    color: '#721c24',
  },
  chartContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartImage: {
    width: '100%',
    height: 200,
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#95a5a6',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
});

// Simple interfaces
interface PDFProps {
  clientName: string;
  // Financial Position
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  propertyEquity: number;
  totalPropertyValue: number;
  // Cash Flow
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  // Retirement
  projectedRetirementLumpSum: number;
  retirementDeficitSurplus: number;
  isRetirementDeficit: boolean;
  yearsToRetirement: number;
  projectedRetirementMonthlyCashFlow: number;
  // Tax
  currentTax: number;
  optimizedTax: number;
  taxSavings: number;
  // Charts
  chartNetWorth?: string;
  chartCashFlow?: string;
  chartRetirement?: string;
  chartTax?: string;
}

// PDF Document Component
const FinancialPDFDocument: React.FC<PDFProps> = ({
  clientName,
  totalAssets,
  totalLiabilities,
  netWorth,
  propertyEquity,
  totalPropertyValue,
  monthlyIncome,
  monthlyExpenses,
  monthlyCashFlow,
  projectedRetirementLumpSum,
  retirementDeficitSurplus,
  isRetirementDeficit,
  yearsToRetirement,
  projectedRetirementMonthlyCashFlow,
  currentTax,
  optimizedTax,
  taxSavings,
  chartNetWorth,
  chartCashFlow,
  chartRetirement,
  chartTax,
}) => {
  // Format currency helper
  const formatMoney = (value: number): string => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatMoneyWithCents = (value: number): string => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Summary Report</Text>
          <Text style={styles.subtitle}>Comprehensive Financial Analysis</Text>
          <Text style={styles.date}>Client: {clientName}</Text>
          <Text style={styles.date}>Generated: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Financial Position Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Position</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Assets</Text>
              <Text style={styles.metricValue}>{formatMoney(totalAssets)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Liabilities</Text>
              <Text style={styles.metricValue}>{formatMoney(totalLiabilities)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Net Worth</Text>
              <Text style={[styles.metricValue, netWorth >= 0 ? styles.positiveValue : styles.negativeValue]}>
                {formatMoney(netWorth)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Property Equity</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>{formatMoney(propertyEquity)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Property Value</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>{formatMoney(totalPropertyValue)}</Text>
            </View>
          </View>
        </View>

        {/* Cash Flow Analysis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Monthly Income</Text>
              <Text style={[styles.metricValue, styles.positiveValue]}>{formatMoney(monthlyIncome)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Monthly Expenses</Text>
              <Text style={[styles.metricValue, styles.negativeValue]}>{formatMoney(monthlyExpenses)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Monthly Cash Flow</Text>
              <Text style={[styles.metricValue, monthlyCashFlow >= 0 ? styles.positiveValue : styles.negativeValue]}>
                {formatMoney(monthlyCashFlow)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Savings Rate</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>
                {monthlyIncome > 0 ? `${((monthlyCashFlow / monthlyIncome) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Retirement Projection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retirement Projection</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Years to Retirement</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>{yearsToRetirement} years</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Projected Retirement Lump Sum</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>{formatMoney(projectedRetirementLumpSum)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Projected Monthly Income</Text>
              <Text style={[styles.metricValue, styles.neutralValue]}>{formatMoney(projectedRetirementMonthlyCashFlow)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Retirement Surplus/Deficit</Text>
              <Text style={[styles.metricValue, retirementDeficitSurplus >= 0 ? styles.positiveValue : styles.negativeValue]}>
                {formatMoney(retirementDeficitSurplus)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[
                styles.statusText,
                isRetirementDeficit ? styles.statusTextBad : styles.statusTextGood
              ]}>
                {isRetirementDeficit ? 'Action Required' : 'On Track'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tax Optimization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Optimization</Text>
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Current Annual Tax</Text>
              <Text style={[styles.metricValue, styles.negativeValue]}>{formatMoney(currentTax)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Optimized Annual Tax</Text>
              <Text style={[styles.metricValue, styles.negativeValue]}>{formatMoney(optimizedTax)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Annual Tax Savings</Text>
              <Text style={[styles.metricValue, styles.positiveValue]}>{formatMoney(taxSavings)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Tax Savings Percentage</Text>
              <Text style={[styles.metricValue, styles.positiveValue]}>
                {currentTax > 0 ? `${((taxSavings / currentTax) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Charts - Only if valid */}
        {chartNetWorth && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Net Worth Chart</Text>
            <Image src={chartNetWorth} style={styles.chartImage} />
          </View>
        )}

        {chartCashFlow && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Cash Flow Chart</Text>
            <Image src={chartCashFlow} style={styles.chartImage} />
          </View>
        )}

        {chartRetirement && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Retirement Projection Chart</Text>
            <Image src={chartRetirement} style={styles.chartImage} />
          </View>
        )}

        {chartTax && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Tax Optimization Chart</Text>
            <Image src={chartTax} style={styles.chartImage} />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by FinCalc Pro - Professional Financial Planning Software</Text>
          <Text>This report contains confidential financial information. Please handle accordingly.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default FinancialPDFDocument;
