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
  console.log('[PDFReport] Component rendering with props:', {
    hasSummary: !!summary,
    summaryType: typeof summary,
    summaryKeys: summary ? Object.keys(summary) : [],
    chartImagesType: typeof chartImages,
    chartImagesIsArray: Array.isArray(chartImages),
    chartImagesLength: Array.isArray(chartImages) ? chartImages.length : 0,
    clientDataType: typeof clientData
  });

  // Validate props
  if (!summary || typeof summary !== 'object') {
    console.error('[PDFReport] Invalid summary prop:', summary);
    throw new Error('Summary prop is required and must be an object');
  }

  if (!Array.isArray(chartImages)) {
    console.warn('[PDFReport] chartImages is not an array, using empty array. Received:', typeof chartImages, chartImages);
    chartImages = [];
  }

  // Validate and clean chartImages array
  const validChartImages = chartImages.filter((chart, index) => {
    if (!chart || typeof chart !== 'object') {
      console.warn(`[PDFReport] Invalid chart at index ${index}:`, chart);
      return false;
    }
    if (!chart.type || typeof chart.type !== 'string') {
      console.warn(`[PDFReport] Chart at index ${index} missing or invalid type:`, chart);
      return false;
    }
    if (!chart.dataUrl || typeof chart.dataUrl !== 'string' || !chart.dataUrl.startsWith('data:')) {
      console.warn(`[PDFReport] Chart at index ${index} has invalid dataUrl:`, {
        hasDataUrl: !!chart.dataUrl,
        dataUrlType: typeof chart.dataUrl,
        dataUrlStart: chart.dataUrl?.substring(0, 20)
      });
      return false;
    }
    return true;
  });

  console.log('[PDFReport] Validated chart images:', validChartImages.length, 'out of', chartImages.length);

  // Ensure clientData is always a valid object
  const safeClientData = clientData && typeof clientData === 'object' ? clientData : {};
  
  // Validate summary has all required properties with defaults
  const validatedSummary = {
    clientName: summary.clientName || 'Client',
    totalAssets: typeof summary.totalAssets === 'number' ? summary.totalAssets : 0,
    totalLiabilities: typeof summary.totalLiabilities === 'number' ? summary.totalLiabilities : 0,
    netWorth: typeof summary.netWorth === 'number' ? summary.netWorth : 0,
    monthlyIncome: typeof summary.monthlyIncome === 'number' ? summary.monthlyIncome : 0,
    monthlyExpenses: typeof summary.monthlyExpenses === 'number' ? summary.monthlyExpenses : 0,
    monthlyCashFlow: typeof summary.monthlyCashFlow === 'number' ? summary.monthlyCashFlow : 0,
    projectedRetirementLumpSum: typeof summary.projectedRetirementLumpSum === 'number' ? summary.projectedRetirementLumpSum : 0,
    retirementDeficitSurplus: typeof summary.retirementDeficitSurplus === 'number' ? summary.retirementDeficitSurplus : 0,
    isRetirementDeficit: typeof summary.isRetirementDeficit === 'boolean' ? summary.isRetirementDeficit : false,
    yearsToRetirement: typeof summary.yearsToRetirement === 'number' ? summary.yearsToRetirement : 0,
    currentTax: typeof summary.currentTax === 'number' ? summary.currentTax : 0,
    optimizedTax: typeof summary.optimizedTax === 'number' ? summary.optimizedTax : 0,
    taxSavings: typeof summary.taxSavings === 'number' ? summary.taxSavings : 0,
    investmentProperties: typeof summary.investmentProperties === 'number' ? summary.investmentProperties : 0,
    totalPropertyValue: typeof summary.totalPropertyValue === 'number' ? summary.totalPropertyValue : 0,
    totalPropertyDebt: typeof summary.totalPropertyDebt === 'number' ? summary.totalPropertyDebt : 0,
    propertyEquity: typeof summary.propertyEquity === 'number' ? summary.propertyEquity : 0,
    recommendations: Array.isArray(summary.recommendations) ? summary.recommendations.map(r => String(r || '')) : []
  };
  
  console.log('[PDFReport] Validated summary:', {
    clientName: validatedSummary.clientName,
    netWorth: validatedSummary.netWorth,
    recommendationsCount: validatedSummary.recommendations.length
  });

  const reportDate = format(new Date(), 'MMMM dd, yyyy');
  
  // Use validatedSummary throughout the component instead of the original summary parameter
  // All references below use validatedSummary which has all required properties with defaults
  
  const getChartImage = (type: ChartImage['type']): string | null => {
    try {
      if (!validChartImages || !Array.isArray(validChartImages)) {
        return null;
      }
      const chart = validChartImages.find(chart => {
        if (!chart || typeof chart !== 'object') return false;
        if (chart.type !== type) return false;
        if (!chart.dataUrl || typeof chart.dataUrl !== 'string') return false;
        if (chart.dataUrl.length === 0) return false;
        if (!chart.dataUrl.startsWith('data:image/')) return false;
        return true;
      });
      const dataUrl = chart?.dataUrl;
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.length > 0) {
        return dataUrl;
      }
      return null;
    } catch (error) {
      console.error('Error getting chart image:', error);
      return null;
    }
  };

  // Validate styles object
  if (!styles || typeof styles !== 'object') {
    throw new Error('Styles object is invalid');
  }

  // Ensure page style exists and is a valid object
  const pageStyle = (styles.page && typeof styles.page === 'object' && !Array.isArray(styles.page)) ? styles.page : {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    backgroundColor: '#ffffff',
  };
  
  // Ensure all style properties are valid objects (not arrays, not null, not undefined)
  // This function MUST always return an object, never undefined or null
  const safeGetStyle = (styleKey: keyof typeof styles): Record<string, any> => {
    try {
      if (!styles || typeof styles !== 'object') {
        console.warn('Styles object is invalid');
        return {};
      }
      
      const style = styles[styleKey];
      
      // Validate that style exists and is a valid object
      if (!style) {
        return {};
      }
      
      if (typeof style !== 'object') {
        return {};
      }
      
      if (Array.isArray(style)) {
        return {};
      }
      
      if (style === null) {
        return {};
      }
      
      // Deep clone to avoid mutation issues
      try {
        const cloned = JSON.parse(JSON.stringify(style));
        // Ensure cloned is still an object
        if (cloned && typeof cloned === 'object' && !Array.isArray(cloned)) {
          return cloned;
        }
        return {};
      } catch (cloneError) {
        // If cloning fails, return a safe empty object
        console.warn(`Failed to clone style ${String(styleKey)}:`, cloneError);
        return {};
      }
    } catch (error) {
      console.error(`Error getting style ${String(styleKey)}:`, error);
      return {};
    }
  };
  
  // Alias for consistency - use safeGetStyle everywhere
  const getStyle = safeGetStyle;

  // Validate all style objects before using them
  const headerStyle = safeGetStyle('header');
  const headerRowStyle = safeGetStyle('headerRow');
  const headerTextStyle = safeGetStyle('headerText');
  const companyNameStyle = safeGetStyle('companyName');
  const clientInfoStyle = safeGetStyle('clientInfo');
  const reportTitleStyle = safeGetStyle('reportTitle');

  // Validate all style objects one more time before rendering
  const validateStyle = (style: any, name: string): Record<string, any> => {
    if (!style || typeof style !== 'object' || Array.isArray(style)) {
      console.warn(`Invalid style for ${name}, using empty object`);
      return {};
    }
    return style;
  };

  const validatedPageStyle = validateStyle(pageStyle, 'page');
  const validatedHeaderStyle = validateStyle(headerStyle, 'header');
  const validatedHeaderRowStyle = validateStyle(headerRowStyle, 'headerRow');
  const validatedHeaderTextStyle = validateStyle(headerTextStyle, 'headerText');
  const validatedCompanyNameStyle = validateStyle(companyNameStyle, 'companyName');
  const validatedClientInfoStyle = validateStyle(clientInfoStyle, 'clientInfo');
  const validatedReportTitleStyle = validateStyle(reportTitleStyle, 'reportTitle');

  return (
    <Document>
      <Page size="A4" style={validatedPageStyle}>
        {/* Header */}
        <View style={validatedHeaderStyle}>
          <View style={validatedHeaderRowStyle}>
            <View style={validatedHeaderTextStyle}>
              <Text style={validatedCompanyNameStyle}>Perpetual Wealth Partners</Text>
              <Text style={validatedClientInfoStyle}>
                Report Date: {reportDate || 'N/A'}{'\n'}
                Prepared for: {validatedSummary.clientName || 'Client'}
              </Text>
            </View>
          </View>
          <Text style={validatedReportTitleStyle}>Financial Planning Report</Text>
        </View>

        {/* Executive Summary */}
        <View style={validateStyle(getStyle('section'), 'section')}>
          <Text style={validateStyle(getStyle('sectionTitle'), 'sectionTitle')}>Executive Summary</Text>
          <View style={validateStyle(getStyle('summaryBox'), 'summaryBox')}>
            <View style={validateStyle(getStyle('metricBox'), 'metricBox')}>
              <Text style={[validateStyle(getStyle('metricValue'), 'metricValue'), { color: '#27ae60' }]}>
                ${validatedSummary.netWorth.toLocaleString()}
              </Text>
              <Text style={validateStyle(getStyle('metricLabel'), 'metricLabel')}>Net Worth</Text>
            </View>
            <View style={validateStyle(getStyle('metricBox'), 'metricBox')}>
              <Text style={[
                validateStyle(getStyle('metricValue'), 'metricValue'),
                { 
                  color: validatedSummary.monthlyCashFlow >= 0 ? '#27ae60' : '#e74c3c' 
                }
              ]}>
                ${validatedSummary.monthlyCashFlow.toLocaleString()}
              </Text>
              <Text style={validateStyle(getStyle('metricLabel'), 'metricLabel')}>Monthly Cash Flow</Text>
            </View>
            <View style={validateStyle(getStyle('metricBox'), 'metricBox')}>
              <Text style={[validateStyle(getStyle('metricValue'), 'metricValue'), { color: '#3498db' }]}>
                ${validatedSummary.taxSavings.toLocaleString()}
              </Text>
              <Text style={validateStyle(getStyle('metricLabel'), 'metricLabel')}>Tax Savings Potential</Text>
            </View>
          </View>
        </View>

        {/* Financial Overview Chart - Temporarily disabled to debug */}
        {(() => {
          try {
            // Temporarily show only text without charts to debug the issue
            const sectionStyle = getStyle('section');
            const sectionTitleStyle = getStyle('sectionTitle');
            const explanationStyle = getStyle('explanation');
            const explanationTitleStyle = getStyle('explanationTitle');
            const explanationTextStyle = getStyle('explanationText');
            
            return (
              <View style={sectionStyle}>
                <Text style={sectionTitleStyle}>Income Analysis</Text>
                <View style={explanationStyle}>
                  <Text style={explanationTitleStyle}>Understanding Your Income</Text>
                  <Text style={explanationTextStyle}>
                    Your total annual income is ${(validatedSummary.monthlyIncome * 12).toLocaleString()}, 
                    which breaks down to ${validatedSummary.monthlyIncome.toLocaleString()} per month. 
                    {'\n\n'}
                    • Primary income source: Employment income
                    {'\n'}
                    • Additional income streams: Rental and investment income provide diversification
                    {'\n'}
                    • Recommendation: Consider increasing passive income sources to build financial resilience
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error('Error rendering income chart:', error);
            return null;
          }
        })()}

        {/* Expenses Breakdown - Temporarily disabled charts to debug */}
        {(() => {
          try {
            const sectionStyle = getStyle('section');
            const sectionTitleStyle = getStyle('sectionTitle');
            const explanationStyle = getStyle('explanation');
            const explanationTitleStyle = getStyle('explanationTitle');
            const explanationTextStyle = getStyle('explanationText');
            
            return (
              <View style={sectionStyle}>
                <Text style={sectionTitleStyle}>Expense Breakdown</Text>
                <View style={explanationStyle}>
                  <Text style={explanationTitleStyle}>Understanding Your Expenses</Text>
                  <Text style={explanationTextStyle}>
                    Your monthly expenses total ${validatedSummary.monthlyExpenses.toLocaleString()}, 
                    representing {validatedSummary.monthlyIncome > 0 ? ((validatedSummary.monthlyExpenses / validatedSummary.monthlyIncome) * 100).toFixed(1) : 0}% 
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
            );
          } catch (error) {
            console.error('Error rendering expense chart:', error);
            return null;
          }
        })()}

        {/* Assets vs Liabilities */}
        {(() => {
          try {
            const assetChartSrc = getChartImage('assets');
            const chartStyle = getStyle('chart');
            const sectionStyle = getStyle('section');
            const sectionTitleStyle = getStyle('sectionTitle');
            const chartContainerStyle = getStyle('chartContainer');
            const explanationStyle = getStyle('explanation');
            const explanationTitleStyle = getStyle('explanationTitle');
            const explanationTextStyle = getStyle('explanationText');
            
            if (!assetChartSrc || typeof assetChartSrc !== 'string' || assetChartSrc.length === 0) {
              return (
                <View style={sectionStyle}>
                  <Text style={sectionTitleStyle}>Assets & Liabilities Overview</Text>
                  <View style={explanationStyle}>
                    <Text style={explanationTitleStyle}>Understanding Your Financial Position</Text>
                    <Text style={explanationTextStyle}>
                      Your total assets of ${validatedSummary.totalAssets.toLocaleString()} are offset by 
                      liabilities of ${validatedSummary.totalLiabilities.toLocaleString()}, resulting in a net worth 
                      of ${validatedSummary.netWorth.toLocaleString()}.
                      {'\n\n'}
                      • Asset allocation: Diversification across property, superannuation, and investments
                      {'\n'}
                      • Debt-to-asset ratio: {validatedSummary.totalAssets > 0 ? ((validatedSummary.totalLiabilities / validatedSummary.totalAssets) * 100).toFixed(1) : 0}% 
                      (lower is generally better)
                      {'\n'}
                      • Recommendation: Focus on building assets while strategically managing debt
                    </Text>
                  </View>
                </View>
              );
            }
            
            return (
              <View style={sectionStyle}>
                <Text style={sectionTitleStyle}>Assets & Liabilities Overview</Text>
                <View style={chartContainerStyle}>
                  <Image src={assetChartSrc} style={chartStyle} />
                </View>
                <View style={explanationStyle}>
                  <Text style={explanationTitleStyle}>Understanding Your Financial Position</Text>
                  <Text style={explanationTextStyle}>
                  Your total assets of ${(summary.totalAssets || 0).toLocaleString()} are offset by 
                  liabilities of ${(summary.totalLiabilities || 0).toLocaleString()}, resulting in a net worth 
                  of ${(summary.netWorth || 0).toLocaleString()}.
                  {'\n\n'}
                  • Asset allocation: Diversification across property, superannuation, and investments
                  {'\n'}
                  • Debt-to-asset ratio: {(summary.totalAssets || 0) > 0 ? (((summary.totalLiabilities || 0) / (summary.totalAssets || 1)) * 100).toFixed(1) : 0}% 
                  (lower is generally better)
                  {'\n'}
                  • Recommendation: Focus on building assets while strategically managing debt
                    </Text>
                  </View>
                </View>
              );
          } catch (error) {
            console.error('Error rendering asset chart:', error);
            return null;
          }
        })()}

        {/* Cash Flow Analysis - Temporarily disabled charts to debug */}
        {(() => {
          try {
            const cashFlow = validatedSummary.monthlyCashFlow;
            const monthlyIncome = validatedSummary.monthlyIncome;
            const savingsRate = monthlyIncome > 0 ? ((cashFlow / monthlyIncome) * 100).toFixed(1) : '0';
            const cashFlowText = cashFlow >= 0 
              ? `You have a positive monthly cash flow of ${cashFlow.toLocaleString()}, representing a savings rate of ${savingsRate}%. This surplus can be used for investments, debt reduction, or building emergency funds.`
              : `Your monthly expenses exceed income by ${Math.abs(cashFlow).toLocaleString()}. Consider reviewing expenses, increasing income, or adjusting your financial strategy.`;
            
            const sectionStyle = getStyle('section');
            const sectionTitleStyle = getStyle('sectionTitle');
            const highlightBoxStyle = getStyle('highlightBox');
            const warningBoxStyle = getStyle('warningBox');
            const explanationTitleStyle = getStyle('explanationTitle');
            const explanationTextStyle = getStyle('explanationText');
            const boxStyle = cashFlow >= 0 ? highlightBoxStyle : warningBoxStyle;
            
            return (
              <View style={sectionStyle}>
                <Text style={sectionTitleStyle}>Cash Flow Analysis</Text>
                <View style={boxStyle}>
                  <Text style={explanationTitleStyle}>
                    {cashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
                  </Text>
                  <Text style={explanationTextStyle}>
                    {cashFlowText}
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error('Error rendering cash flow chart:', error);
            return null;
          }
        })()}

        {/* Retirement Projection - Temporarily disabled charts to debug */}
        {(() => {
          try {
            const isDeficit = validatedSummary.isRetirementDeficit;
            const retirementText = isDeficit
              ? `Based on current projections, you may face a retirement shortfall. With ${validatedSummary.yearsToRetirement} years until retirement, consider increasing superannuation contributions or adjusting your retirement timeline.`
              : `Your retirement planning is on track. Your projected retirement lump sum of ${validatedSummary.projectedRetirementLumpSum.toLocaleString()} provides a solid foundation for your retirement years.`;
            
            const sectionStyle = getStyle('section');
            const sectionTitleStyle = getStyle('sectionTitle');
            const highlightBoxStyle = getStyle('highlightBox');
            const warningBoxStyle = getStyle('warningBox');
            const explanationTitleStyle = getStyle('explanationTitle');
            const explanationTextStyle = getStyle('explanationText');
            const boxStyle = isDeficit ? warningBoxStyle : highlightBoxStyle;
            
            return (
              <View style={sectionStyle}>
                <Text style={sectionTitleStyle}>Retirement Planning</Text>
                <View style={boxStyle}>
                  <Text style={explanationTitleStyle}>
                    {isDeficit ? 'Retirement Planning Alert' : 'Retirement On Track'}
                  </Text>
                  <Text style={explanationTextStyle}>
                    {retirementText}
                  </Text>
                </View>
              </View>
            );
          } catch (error) {
            console.error('Error rendering retirement chart:', error);
            return null;
          }
        })()}

        {/* Recommendations */}
        <View style={getStyle('section')}>
          <Text style={getStyle('sectionTitle')}>Recommendations & Action Items</Text>
          {validatedSummary.recommendations.map((rec, index) => {
            if (!rec || typeof rec !== 'string') return null;
            return (
              <View key={index} style={getStyle('recommendationBox')}>
                <Text style={getStyle('explanationText')}>
                  {index + 1}. {String(rec)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text 
          style={getStyle('footer')} 
          render={({ pageNumber, totalPages }) => 
            `Page ${pageNumber} of ${totalPages} | Generated on ${reportDate} | Perpetual Wealth Partners`
          } 
          fixed 
        />
      </Page>
    </Document>
  );
};
