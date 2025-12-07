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
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  heading: {
    fontSize: 24,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subheading: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#444444',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '40%',
    color: '#555555',
  },
  value: {
    fontSize: 12,
    width: '60%',
    color: '#333333',
  },
  chartContainer: {
    marginVertical: 15,
    padding: 10,
  },
  chartImage: {
    width: '100%',
    height: 250,
    objectFit: 'contain',
  },
});

// Simple interfaces
interface PDFProps {
  clientName: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  chartNetWorth?: string;
  chartCashFlow?: string;
  chartAssets?: string;
}

// PDF Document Component
const FinancialPDFDocument: React.FC<PDFProps> = ({
  clientName,
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyIncome,
  monthlyExpenses,
  chartNetWorth,
  chartCashFlow,
  chartAssets,
}) => {
  // Format currency helper
  const formatMoney = (value: number): string => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.heading}>Financial Summary Report</Text>
          <Text style={styles.text}>Client: {clientName}</Text>
          <Text style={styles.text}>
            Date: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.subheading}>Financial Overview</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Total Assets:</Text>
            <Text style={styles.value}>{formatMoney(totalAssets)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Total Liabilities:</Text>
            <Text style={styles.value}>{formatMoney(totalLiabilities)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Net Worth:</Text>
            <Text style={styles.value}>{formatMoney(netWorth)}</Text>
          </View>
        </View>

        {/* Cash Flow */}
        <View style={styles.section}>
          <Text style={styles.subheading}>Cash Flow Analysis</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Monthly Income:</Text>
            <Text style={styles.value}>{formatMoney(monthlyIncome)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Monthly Expenses:</Text>
            <Text style={styles.value}>{formatMoney(monthlyExpenses)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Net Monthly:</Text>
            <Text style={styles.value}>
              {formatMoney(monthlyIncome - monthlyExpenses)}
            </Text>
          </View>
        </View>

        {/* Charts - Only if valid */}
        {chartNetWorth && (
          <View style={styles.chartContainer}>
            <Text style={styles.subheading}>Net Worth Chart</Text>
            <Image src={chartNetWorth} style={styles.chartImage} />
          </View>
        )}

        {chartCashFlow && (
          <View style={styles.chartContainer}>
            <Text style={styles.subheading}>Cash Flow Chart</Text>
            <Image src={chartCashFlow} style={styles.chartImage} />
          </View>
        )}

        {chartAssets && (
          <View style={styles.chartContainer}>
            <Text style={styles.subheading}>Asset Allocation</Text>
            <Image src={chartAssets} style={styles.chartImage} />
          </View>
        )}
      </Page>
    </Document>
  );
};

export default FinancialPDFDocument;
