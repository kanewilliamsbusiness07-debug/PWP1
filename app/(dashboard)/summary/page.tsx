/**
 * FinCalc Pro - Summary & Export Page
 * 
 * Comprehensive summary with PDF generation and email functionality
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Download, Printer, Share2, TrendingUp, TrendingDown, DollarSign, Calculator, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { EmailReportSection } from '@/components/email-report-section';
import {
  generateIncomeChart,
  generateExpenseChart,
  generateAssetLiabilityChart,
  generateCashFlowChart,
  generateRetirementChart,
  generateDetailedCashFlowChart,
  generateFinancialPositionChart,
  generateDetailedRetirementChart,
  generateTaxOptimizationChart,
} from '@/lib/pdf/chart-generator';
import { PDFReport } from '@/lib/pdf/pdf-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useFinancialStore } from '@/lib/store/store';
import { convertClientToInputs } from '@/lib/utils/convertClientToInputs';
import { calculateFinancialProjections } from '@/lib/utils/calculateFinancialProjections';
import { useDataSharing } from '@/lib/hooks/use-data-sharing';
import { computeSummaryFromClient } from '@/lib/utils/summary-utils';
import { ServiceabilitySummary } from '@/components/serviceability-summary';
import { calculateInvestmentSurplus, calculatePropertyServiceability } from '@/lib/finance/serviceability';
import {
  calculateMonthlySurplus,
  calculateRetirementLumpSum,
  calculatePassiveIncome,
  calculateRetirementDeficitSurplus,
  calculateDebtPaymentsAtRetirement,
  DEFAULT_ASSUMPTIONS
} from '@/lib/finance/calculations';
import { generateOptimizationStrategies, calculateTotalTaxSavings } from '@/lib/finance/tax-optimization-strategies';
import { formatCurrency } from '@/lib/utils/format';

interface FinancialSummary {
  clientName: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  projectedRetirementLumpSum: number;
  projectedRetirementMonthlyCashFlow: number;
  projectedRetirementSurplus: number;
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

export default function SummaryPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [targetRentPerWeek, setTargetRentPerWeek] = useState<number | string>('');
  const [propertyExpensesPerMonth, setPropertyExpensesPerMonth] = useState<number | string>('');
  const [lastGeneratedPdfId, setLastGeneratedPdfId] = useState<string | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const summaryContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const financialStore = useFinancialStore();
  const { forceSync, validateIntegrity } = useDataSharing({ autoSync: true });

  // Get active client
  const activeClientForEmail = financialStore.activeClient 
    ? financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any
    : null;

  // Try to load client from URL if not in store
  useEffect(() => {
    const loadClientFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('load');
      
      if (clientId && !activeClientForEmail?.id && !isLoadingClient) {
        setIsLoadingClient(true);
        try {
          const response = await fetch(`/api/clients/${clientId}`);
          if (response.ok) {
            const client = await response.json();
            // Load client into store
            const clientSlot = financialStore.activeClient || 'A';
            financialStore.setClientData(clientSlot, client as any);
            financialStore.setActiveClient(clientSlot);
            toast({
              title: 'Client loaded',
              description: `Loaded ${client.firstName} ${client.lastName}`
            });
          }
        } catch (error) {
          console.error('Error loading client:', error);
        } finally {
          setIsLoadingClient(false);
        }
      }
    };
    
    loadClientFromUrl();
  }, [activeClientForEmail?.id, isLoadingClient, financialStore, toast]);

  // Subscribe to specific store values using selectors for proper reactivity
  const activeClientSlot = useFinancialStore((state) => state.activeClient);
  const clientA = useFinancialStore((state) => state.clientA);
  const clientB = useFinancialStore((state) => state.clientB);
  const sharedAssumptions = useFinancialStore((state) => state.sharedAssumptions);
  const globalResults = useFinancialStore((state) => state.results);
  
  // Get active client data with proper subscription
  const activeClient = activeClientSlot 
    ? (activeClientSlot === 'A' ? clientA : clientB) as any
    : null;
    
  // Check if we have data in each client slot
  const hasClientA = clientA && (clientA.firstName || clientA.lastName || (clientA.assets?.length ?? 0) > 0);
  const hasClientB = clientB && (clientB.firstName || clientB.lastName || (clientB.assets?.length ?? 0) > 0);
  
  // Get client names
  const clientAName = clientA ? `${clientA.firstName || ''} ${clientA.lastName || ''}`.trim() || 'Client A' : 'Client A';
  const clientBName = clientB ? `${clientB.firstName || ''} ${clientB.lastName || ''}`.trim() || 'Client B' : 'Client B';

  // Calculate totals from store and client data
  const defaultSummary: FinancialSummary = {
    clientName: '',
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyCashFlow: 0,
    projectedRetirementLumpSum: 0,
    projectedRetirementMonthlyCashFlow: 0,
    projectedRetirementSurplus: 0,
    retirementDeficitSurplus: 0,
    isRetirementDeficit: false,
    yearsToRetirement: 0,
    currentTax: 0,
    optimizedTax: 0,
    taxSavings: 0,
    investmentProperties: 0,
    totalPropertyValue: 0,
    totalPropertyDebt: 0,
    propertyEquity: 0,
    recommendations: []
  };

  const [summary, setSummary] = useState<FinancialSummary>(defaultSummary);
  const [summaryA, setSummaryA] = useState<FinancialSummary>(defaultSummary);
  const [summaryB, setSummaryB] = useState<FinancialSummary>(defaultSummary);
  const [summaryCombined, setSummaryCombined] = useState<FinancialSummary>(defaultSummary);
  
  // Check if we have both clients for combined view
  const showCombined = hasClientA && hasClientB;
  
  const calculateSummaryForClient = (client: any, clientKey: 'clientA' | 'clientB'): FinancialSummary => {
    
    const clientName = client 
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client'
      : 'No Client Selected';

    // Calculate assets - prioritize Financial Position page data, fallback to legacy fields
    let totalAssets = 0;
    let totalPropertyValue = 0;
    
    if (client?.assets && Array.isArray(client.assets) && client.assets.length > 0) {
      // Use Financial Position assets
      client.assets.forEach((asset: any) => {
        const value = asset.currentValue || 0;
        totalAssets += value;
        const t = String(asset.type || '').toLowerCase();
        if (t === 'property' || t === 'property') {
          totalPropertyValue += value;
        }
      });
    } else {
      // Fallback to legacy asset fields
      const homeValue = client?.homeValue || 0;
      const investment1Value = client?.investment1Value || 0;
      const investment2Value = client?.investment2Value || 0;
      const investment3Value = client?.investment3Value || 0;
      const investment4Value = client?.investment4Value || 0;
      const vehicleValue = client?.vehicleValue || 0;
      const savingsValue = client?.savingsValue || client?.currentSavings || financialStore.cashSavings || 0;
      const homeContentsValue = client?.homeContentsValue || 0;
      const superFundValue = client?.superFundValue || client?.currentSuper || financialStore.superBalance || 0;
      const sharesValue = client?.sharesTotalValue || client?.currentShares || financialStore.investments || 0;
      
      totalAssets = homeValue + investment1Value + investment2Value + investment3Value + investment4Value +
        vehicleValue + savingsValue + homeContentsValue + superFundValue + sharesValue;
      totalPropertyValue = homeValue + investment1Value + investment2Value + investment3Value + investment4Value;
    }
    
    // Calculate sharesValue from assets array or legacy fields for recommendations
    let sharesValue = 0;
    if (client?.assets && Array.isArray(client.assets)) {
      const sharesAssets = client.assets.filter((asset: any) => String(asset.type || '').toLowerCase() === 'shares');
      sharesValue = sharesAssets.reduce((sum: number, asset: any) => sum + (asset.currentValue || 0), 0);
    } else {
      // Fallback to legacy fields
      sharesValue = client?.sharesTotalValue || client?.currentShares || financialStore.investments || 0;
    }

    // Calculate liabilities - prioritize Financial Position page data, fallback to legacy fields
    let totalLiabilities = 0;
    let totalPropertyDebt = 0;
    let hecsBalance = 0;
    
    if (client?.liabilities && Array.isArray(client.liabilities) && client.liabilities.length > 0) {
      // Use Financial Position liabilities
      client.liabilities.forEach((liability: any) => {
        const balance = liability.balance || 0;
        totalLiabilities += balance;
        if (liability.type === 'mortgage') {
          totalPropertyDebt += balance;
        }
        if (liability.type === 'hecs') {
          hecsBalance = balance;
        }
      });
    } else {
      // Fallback to legacy liability fields
      const homeBalance = client?.homeBalance || 0;
      const investment1Balance = client?.investment1Balance || 0;
      const investment2Balance = client?.investment2Balance || 0;
      const investment3Balance = client?.investment3Balance || 0;
      const investment4Balance = client?.investment4Balance || 0;
      const creditCardBalance = client?.creditCardBalance || 0;
      const personalLoanBalance = client?.personalLoanBalance || 0;
      hecsBalance = client?.hecsBalance || client?.helpDebt || 0;
      
      totalLiabilities = homeBalance + investment1Balance + investment2Balance + investment3Balance + 
        investment4Balance + creditCardBalance + personalLoanBalance + hecsBalance;
      totalPropertyDebt = homeBalance + investment1Balance + investment2Balance + investment3Balance + investment4Balance;
    }

    const netWorth = totalAssets - totalLiabilities;

    // Calculate income (annual, convert to monthly)
    const annualIncome = financialStore.grossIncome || financialStore.employmentIncome || client?.annualIncome || client?.grossSalary || 0;
    // Use canonical monthly surplus calculation when available
    const surplusResult = calculateMonthlySurplus(client || {});
    const monthlyIncome = surplusResult.income.total || 0;
    const monthlyExpenses = surplusResult.expenses.total || 0;
    const monthlyTax = surplusResult.expenses.tax || 0;
    const monthlyHECSRepayment = surplusResult.expenses.hecs || 0;
    const propertyExpenses = surplusResult.expenses.propertyExpenses || 0;
    const totalMonthlyDeductions = monthlyExpenses;
    const monthlyCashFlow = surplusResult.surplus || 0;

    // Property calculations
    // Count investment properties from assets array or legacy fields
    let investmentProperties = 0;
    if (client?.assets && Array.isArray(client.assets)) {
      investmentProperties = client.assets.filter((asset: any) => asset.type === 'property').length;
    } else {
      // Fallback to legacy fields
      const investment1Value = client?.investment1Value || 0;
      const investment2Value = client?.investment2Value || 0;
      const investment3Value = client?.investment3Value || 0;
      const investment4Value = client?.investment4Value || 0;
      investmentProperties = [investment1Value, investment2Value, investment3Value, investment4Value]
        .filter(v => v > 0).length;
    }
    
    if (!totalPropertyValue) {
      // Calculate from legacy fields if not already set
      const homeValue = client?.homeValue || 0;
      const investment1Value = client?.investment1Value || 0;
      const investment2Value = client?.investment2Value || 0;
      const investment3Value = client?.investment3Value || 0;
      const investment4Value = client?.investment4Value || 0;
      totalPropertyValue = homeValue + investment1Value + investment2Value + investment3Value + investment4Value;
    }
    
    if (!totalPropertyDebt) {
      // Calculate from legacy fields if not already set
      const homeBalance = client?.homeBalance || 0;
      const investment1Balance = client?.investment1Balance || 0;
      const investment2Balance = client?.investment2Balance || 0;
      const investment3Balance = client?.investment3Balance || 0;
      const investment4Balance = client?.investment4Balance || 0;
      totalPropertyDebt = homeBalance + investment1Balance + investment2Balance + investment3Balance + investment4Balance;
    }
    
    const propertyEquity = totalPropertyValue - totalPropertyDebt;

    // Retirement calculations (simplified)
    const currentAge = client?.currentAge || 35;
    const retirementAge = client?.retirementAge || 65;
    
    // Get superannuation value from assets or legacy field
    let superFundValue = 0;
    if (client?.assets && Array.isArray(client.assets)) {
      const superAsset = client.assets.find((asset: any) => asset.type === 'super');
      superFundValue = superAsset?.currentValue || 0;
    } else {
      superFundValue = client?.superFundValue || client?.currentSuper || financialStore.superBalance || 0;
    }
    
    // Compute projected retirement lump sum using canonical projection function
    // Calculate savings value from assets or legacy fields
    let savingsValue = 0;
    if (client?.assets && Array.isArray(client.assets)) {
      const savingsAsset = client.assets.find((asset: any) => asset.type === 'savings');
      savingsValue = savingsAsset?.currentValue || 0;
    } else {
      savingsValue = client?.savingsValue || client?.currentSavings || financialStore.cashSavings || 0;
    }

    // Use stored projection results from global state
    // This ensures Summary page shows the SAME values as the Projections page
    const storedProjectionResults = globalResults?.[clientKey];
  import { computeSummaryFromClient } from '@/lib/utils/summary-utils';

    // Use helper to compute summary values (prefer stored results)
    const computedSummary = computeSummaryFromClient(client, sharedAssumptions, storedProjectionResults);

    // Map computed values into local variables
    let projectedRetirementLumpSum = computedSummary.projectedRetirementLumpSum;
    let projectedRetirementMonthlyCashFlow = computedSummary.projectedRetirementMonthlyCashFlow;
    let retirementDeficitSurplus = computedSummary.retirementDeficitSurplus;
    let isRetirementDeficit = computedSummary.isRetirementDeficit;
    let yearsToRetirement = computedSummary.yearsToRetirement;

    let projectedRetirementLumpSum: number;
    let projectedRetirementMonthlyCashFlow: number;
    let retirementDeficitSurplus: number;
    let isRetirementDeficit: boolean;
    let yearsToRetirement: number;

    if (storedProjectionResults) {
      // Use stored values from Projections page for consistency
      projectedRetirementLumpSum = storedProjectionResults.projectedLumpSum || 0;
      projectedRetirementMonthlyCashFlow = storedProjectionResults.monthlyPassiveIncome || 0;
      retirementDeficitSurplus = storedProjectionResults.monthlyDeficitSurplus || 0;
      isRetirementDeficit = storedProjectionResults.isDeficit || false;
      yearsToRetirement = storedProjectionResults.yearsToRetirement || 0;
    } else {
      // No stored results available - compute locally using the canonical projection function
      try {
        const inputs = convertClientToInputs(client, sharedAssumptions);
        if (inputs) {
          const computed = calculateFinancialProjections(inputs);

          // Store computed results to global state for other pages to consume
          const currentResults = useFinancialStore.getState().results || {};
          const clientSlot = clientKey === 'clientA' ? 'clientA' : 'clientB';
          useFinancialStore.getState().setResults({
            ...currentResults,
            [clientSlot]: {
              projectedLumpSum: computed.combinedNetworthAtRetirement,
              monthlyPassiveIncome: computed.projectedAnnualPassiveIncome / 12,
              yearsToRetirement: computed.yearsToRetirement,
              requiredIncome: computed.requiredAnnualIncome,
              monthlyDeficitSurplus: computed.monthlySurplusDeficit,
              isDeficit: computed.status === 'deficit',
              currentTax: computed.finalAnnualIncome // placeholder for tax if available
            }
          });

          projectedRetirementLumpSum = computed.combinedNetworthAtRetirement || 0;
          projectedRetirementMonthlyCashFlow = (computed.projectedAnnualPassiveIncome / 12) || 0;
          retirementDeficitSurplus = computed.monthlySurplusDeficit || 0;
          isRetirementDeficit = computed.status === 'deficit';
          yearsToRetirement = computed.yearsToRetirement || Math.max(0, (client?.retirementAge || 65) - (client?.currentAge || 35));
        } else {
          projectedRetirementLumpSum = 0;
          projectedRetirementMonthlyCashFlow = 0;
          retirementDeficitSurplus = 0;
          isRetirementDeficit = false;
          yearsToRetirement = Math.max(0, (client?.retirementAge || 65) - (client?.currentAge || 35));
        }
      } catch (e) {
        console.warn('Failed to compute projection in Summary page:', e);
        projectedRetirementLumpSum = 0;
        projectedRetirementMonthlyCashFlow = 0;
        retirementDeficitSurplus = 0;
        isRetirementDeficit = false;
        yearsToRetirement = Math.max(0, (client?.retirementAge || 65) - (client?.currentAge || 35));
      }
    }

    // Tax calculations - use stored results from global state
    let currentTax: number;
    let optimizedTax: number;
    let taxSavings: number;

    if (storedProjectionResults?.currentTax !== undefined) {
      // Use stored values from global state for consistency
      currentTax = storedProjectionResults.currentTax;
      optimizedTax = storedProjectionResults.optimizedTax || 0;
      taxSavings = storedProjectionResults.taxSavings || 0;

      console.log('=== SUMMARY: Using stored tax results from global state ===');
      console.log('Current Tax:', currentTax);
      console.log('Optimized Tax:', optimizedTax);
      console.log('Tax Savings:', taxSavings);
    } else {
      // No stored tax results available - use default values
      currentTax = 0;
      optimizedTax = 0;
      taxSavings = 0;
      console.log('=== SUMMARY: No stored tax results available ===');
    }

    // Generate recommendations based on available data
    const recommendations: string[] = [];

    if (monthlyCashFlow < 0) {
      recommendations.push('Consider reducing expenses or increasing income to improve cash flow');
    }

    if (isRetirementDeficit) {
      recommendations.push('Review retirement strategy - current projections show a deficit');
    }

    if (totalLiabilities > totalAssets * 0.5) {
      recommendations.push('High debt levels relative to assets - consider debt reduction strategies');
    }

    if (sharesValue < totalAssets * 0.2) {
      recommendations.push('Consider increasing investment in shares for long-term growth');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current financial strategy');
    }

    return {
      clientName,
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyCashFlow,
      projectedRetirementLumpSum,
      projectedRetirementMonthlyCashFlow,
      // For backward compatibility with PDF and other consumers use
      // `projectedRetirementSurplus` to represent the projected monthly
      // passive income (surplus) at retirement.
      projectedRetirementSurplus: projectedRetirementMonthlyCashFlow,
      retirementDeficitSurplus,
      isRetirementDeficit,
      yearsToRetirement,
      currentTax,
      optimizedTax,
      taxSavings,
      investmentProperties,
      totalPropertyValue,
      totalPropertyDebt,
      propertyEquity,
      recommendations
    };
  };

  // Wrapper for backward compatibility
  const calculateSummary = (): FinancialSummary => {
    const clientKey = activeClientSlot === 'A' ? 'clientA' : 'clientB';
    return calculateSummaryForClient(activeClient, clientKey);
  };

  useEffect(() => {
    setSummary(calculateSummary());
    
    // Calculate for both clients
    const calcA = hasClientA ? calculateSummaryForClient(clientA, 'clientA') : defaultSummary;
    const calcB = hasClientB ? calculateSummaryForClient(clientB, 'clientB') : defaultSummary;
    
    setSummaryA(calcA);
    setSummaryB(calcB);
    
    // Calculate combined summary (aggregate both clients)
    if (hasClientA && hasClientB) {
      const combined: FinancialSummary = {
        clientName: 'Combined Household',
        totalAssets: calcA.totalAssets + calcB.totalAssets,
        totalLiabilities: calcA.totalLiabilities + calcB.totalLiabilities,
        netWorth: calcA.netWorth + calcB.netWorth,
        monthlyIncome: calcA.monthlyIncome + calcB.monthlyIncome,
        monthlyExpenses: calcA.monthlyExpenses + calcB.monthlyExpenses,
        monthlyCashFlow: calcA.monthlyCashFlow + calcB.monthlyCashFlow,
        projectedRetirementLumpSum: calcA.projectedRetirementLumpSum + calcB.projectedRetirementLumpSum,
        projectedRetirementMonthlyCashFlow: calcA.projectedRetirementMonthlyCashFlow + calcB.projectedRetirementMonthlyCashFlow,
        projectedRetirementSurplus: calcA.projectedRetirementSurplus + calcB.projectedRetirementSurplus,
        retirementDeficitSurplus: calcA.retirementDeficitSurplus + calcB.retirementDeficitSurplus,
        isRetirementDeficit: (calcA.retirementDeficitSurplus + calcB.retirementDeficitSurplus) < 0,
        yearsToRetirement: Math.min(calcA.yearsToRetirement || 99, calcB.yearsToRetirement || 99),
        currentTax: calcA.currentTax + calcB.currentTax,
        optimizedTax: calcA.optimizedTax + calcB.optimizedTax,
        taxSavings: calcA.taxSavings + calcB.taxSavings,
        investmentProperties: calcA.investmentProperties + calcB.investmentProperties,
        totalPropertyValue: calcA.totalPropertyValue + calcB.totalPropertyValue,
        totalPropertyDebt: calcA.totalPropertyDebt + calcB.totalPropertyDebt,
        propertyEquity: calcA.propertyEquity + calcB.propertyEquity,
        recommendations: [...calcA.recommendations, ...calcB.recommendations]
      };
      setSummaryCombined(combined);
    } else if (hasClientA) {
      setSummaryCombined(calcA);
    } else if (hasClientB) {
      setSummaryCombined(calcB);
    } else {
      setSummaryCombined(defaultSummary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeClientSlot,
    clientA,
    clientB,
    hasClientA,
    hasClientB,
    // Also watch specific nested results that we care about
    clientA?.projectionResults,
    clientB?.projectionResults,
    clientA?.taxOptimizationResults,
    clientB?.taxOptimizationResults,
    financialStore.grossIncome,
    financialStore.superBalance,
    financialStore.cashSavings,
    financialStore.investments,
    financialStore.rentalIncome,
    financialStore.workRelatedExpenses,
    financialStore.investmentExpenses,
    financialStore.rentalExpenses,
    financialStore.frankedDividends,
    financialStore.capitalGains,
    financialStore.totalDebt
  ]);

  // Helper function to validate chart images
  const validateChartImage = (dataUrl: string | undefined): string | undefined => {
    if (!dataUrl) return undefined;
    
    // Must be a string
    if (typeof dataUrl !== 'string') {
      console.warn('Chart image is not a string');
      return undefined;
    }
    
    // Must start with data:image
    if (!dataUrl.startsWith('data:image/')) {
      console.warn('Chart image does not start with data:image/');
      return undefined;
    }
    
    // Must have reasonable length
    if (dataUrl.length < 100) {
      console.warn('Chart image too short (possibly empty)');
      return undefined;
    }
    
    // Must not have suspicious characters
    if (dataUrl.includes('undefined') || dataUrl.includes('null')) {
      console.warn('Chart image contains undefined/null');
      return undefined;
    }
    
    return dataUrl;
  };

  const generatePDF = async (saveToServer: boolean = true): Promise<string | null> => {
    setIsGeneratingPDF(true);
    
    try {
      console.log('🚀 Starting PDF generation...');
      
      // Get active client for saving PDF
      const activeClient = financialStore.activeClient 
        ? financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any
        : null;

      if (!activeClient) {
        toast({
          title: 'Error',
          description: 'Please select a client before generating PDF. Go to Client Information page to select or create a client.',
          variant: 'destructive'
        });
        setIsGeneratingPDF(false);
        return null;
      }

      // Check if client has been saved (has an ID)
      let clientId: string | undefined = activeClient.id;
      if (!clientId) {
        // Try to save the client first
        try {
          const saveResponse = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: activeClient.firstName || 'Client',
              lastName: activeClient.lastName || '',
              email: activeClient.email || '',
              ...activeClient
            })
          });
          
          if (saveResponse.ok) {
            const savedClient = await saveResponse.json();
            clientId = savedClient.id;
            financialStore.setClientData(financialStore.activeClient || 'A', { ...activeClient, id: clientId } as any);
            toast({
              title: 'Client saved',
              description: 'Client has been saved automatically'
            });
          } else {
            toast({
              title: 'Warning',
              description: 'Client not saved to database. PDF will be generated but not stored.',
              variant: 'default'
            });
          }
        } catch (error) {
          console.error('Error saving client:', error);
          toast({
            title: 'Warning',
            description: 'Could not save client. PDF will be generated but not stored.',
            variant: 'default'
          });
        }
      }

      // Calculate summary data
      const summaryData = calculateSummary();

      // --- HTML-based PDF generation (Puppeteer server-side) ---
      // Capture current DOM, convert canvases to images, remove scripts, and post HTML to server to render with Puppeteer

      const capturePageHtml = async (): Promise<string> => {
        // Clone document to avoid mutating live DOM
        const docClone = document.documentElement.cloneNode(true) as HTMLElement;

        // Convert canvas elements inside the summary root to img data URLs
        const rootSelector = '#summary-root';
        const sourceRoot = document.querySelector(rootSelector) || document.body;
        const cloneRoot = docClone.querySelector(rootSelector) || docClone;

        // Replace canvas elements with images (data URLs)
        const canvases = Array.from(sourceRoot.querySelectorAll('canvas')) as HTMLCanvasElement[];
        for (const canvas of canvases) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            img.width = canvas.width;
            img.height = canvas.height;
            // Replace in clone
            const selector = canvas.getAttribute('data-pdf-selector') || '';
            // Find corresponding canvas in clone by index fallback
            const clonedCanvas = cloneRoot.querySelector('canvas');
            if (clonedCanvas && clonedCanvas.parentNode) {
              clonedCanvas.parentNode.replaceChild(img.cloneNode(true), clonedCanvas);
            }
          } catch (e) {
            // ignore canvas conversion failures
            // eslint-disable-next-line no-console
            console.warn('Canvas conversion skipped:', e);
          }
        }

        // Remove all script tags from the clone to prevent script execution on setContent
        Array.from(docClone.querySelectorAll('script')).forEach(s => s.remove());

        // Ensure base href is set so relative assets resolve
        const base = document.createElement('base');
        base.setAttribute('href', window.location.origin);
        const head = docClone.querySelector('head') || document.createElement('head');
        head.insertBefore(base, head.firstChild || null);

        // Add a helper class to force dark theme and PDF-specific rules
        docClone.classList?.add('dark', 'pdf-export');

        // Inject small PDF-specific CSS to avoid splitting cards and set fixed width
        const style = document.createElement('style');
        style.innerHTML = `
          /* PDF export helper styles - only used for PDF capture */
          html.pdf-export, body.pdf-export { background-color: hsl(var(--background)); }
          .pdf-export #summary-root { width: 1440px; margin: 0 auto; }
          .pdf-export .card, .pdf-export .rounded-lg { break-inside: avoid; page-break-inside: avoid; }
          @media print { .card, .rounded-lg { page-break-inside: avoid; break-inside: avoid; } }
        `;
        head.appendChild(style);

        // Return outerHTML
        return '<!doctype html>' + docClone.outerHTML;
      };

      // Capture HTML and send to server
      const html = await capturePageHtml();
      const payload = { html, clientId, fileName: `Financial_Summary_${(summaryData.clientName || 'Client').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf` };

      const genRes = await fetch('/api/pdf-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        throw new Error(err?.error || 'PDF generation failed on server');
      }

      const genJson = await genRes.json();
      if (genJson?.success) {
        toast({ title: 'PDF Generated', description: 'PDF has been generated and saved to your account.' });
        // Optionally refresh PDF list
        try { await fetch('/api/pdf-exports?limit=10'); } catch (_) {}
      } else {
        throw new Error('PDF generation failed');
      }


      // Validate summaryData exists and has required properties
      if (!summaryData || typeof summaryData !== 'object') {
        throw new Error('Invalid summary data: summary data is missing or invalid');
      }

      // Ensure summaryData has required numeric properties
      if (typeof summaryData.monthlyIncome !== 'number' || isNaN(summaryData.monthlyIncome)) {
        summaryData.monthlyIncome = 0;
      }
      if (typeof summaryData.monthlyExpenses !== 'number' || isNaN(summaryData.monthlyExpenses)) {
        summaryData.monthlyExpenses = 0;
      }
      if (typeof summaryData.netWorth !== 'number' || isNaN(summaryData.netWorth)) {
        summaryData.netWorth = 0;
      }
      if (typeof summaryData.totalAssets !== 'number' || isNaN(summaryData.totalAssets)) {
        summaryData.totalAssets = 0;
      }
      if (typeof summaryData.totalLiabilities !== 'number' || isNaN(summaryData.totalLiabilities)) {
        summaryData.totalLiabilities = 0;
      }
      if (!summaryData.clientName || typeof summaryData.clientName !== 'string') {
        summaryData.clientName = 'Client';
      }

      // Check if we're in the browser
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('PDF generation must run in the browser');
      }

      // Generate all charts
      console.log('Generating charts for PDF...');
      
      const annualIncome = financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0;
      const rentalIncome = financialStore.rentalIncome || activeClient?.rentalIncome || 0;
      const investmentIncome = financialStore.investmentIncome || activeClient?.dividends || 0;
      const otherIncome = financialStore.otherIncome || activeClient?.otherIncome || 0;

      const workExpenses = financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0;
      const investmentExpenses = financialStore.investmentExpenses || activeClient?.investmentExpenses || 0;
      const rentalExpenses = financialStore.rentalExpenses || activeClient?.rentalExpenses || 0;
      const vehicleExpenses = activeClient?.vehicleExpenses || 0;
      const homeOfficeExpenses = activeClient?.homeOfficeExpenses || 0;

      const homeValue = activeClient?.homeValue || 0;
      const investment1Value = activeClient?.investment1Value || 0;
      const investment2Value = activeClient?.investment2Value || 0;
      const investment3Value = activeClient?.investment3Value || 0;
      const investment4Value = activeClient?.investment4Value || 0;
      const vehicleValue = activeClient?.vehicleValue || 0;
      const savingsValue = activeClient?.savingsValue || activeClient?.currentSavings || financialStore.cashSavings || 0;
      const homeContentsValue = activeClient?.homeContentsValue || 0;
      const superFundValue = activeClient?.superFundValue || activeClient?.currentSuper || financialStore.superBalance || 0;
      const sharesValue = activeClient?.sharesTotalValue || activeClient?.currentShares || financialStore.investments || 0;

      const homeBalance = activeClient?.homeBalance || 0;
      const investment1Balance = activeClient?.investment1Balance || 0;
      const investment2Balance = activeClient?.investment2Balance || 0;
      const investment3Balance = activeClient?.investment3Balance || 0;
      const investment4Balance = activeClient?.investment4Balance || 0;
      const creditCardBalance = activeClient?.creditCardBalance || 0;
      const personalLoanBalance = activeClient?.personalLoanBalance || 0;
      const hecsBalance = activeClient?.hecsBalance || activeClient?.helpDebt || 0;

      const currentAge = activeClient?.currentAge || 35;
      const retirementAge = activeClient?.retirementAge || 65;
      const yearsToRetirement = Math.max(0, retirementAge - currentAge);
      const projectedSuper = superFundValue * Math.pow(1.07, yearsToRetirement);

      // Step 1: Generate chart images
      console.log('📊 Generating charts for PDF...');

      // Ensure all numeric values are valid numbers
      const safeAnnualIncome = Number(annualIncome) || 0;
      const safeRentalIncome = Number(rentalIncome) || 0;
      const safeInvestmentIncome = Number(investmentIncome) || 0;
      const safeOtherIncome = Number(otherIncome) || 0;
      
      const safeWorkExpenses = Number(workExpenses) || 0;
      const safeInvestmentExpenses = Number(investmentExpenses) || 0;
      const safeRentalExpenses = Number(rentalExpenses) || 0;
      const safeVehicleExpenses = Number(vehicleExpenses) || 0;
      const safeHomeOfficeExpenses = Number(homeOfficeExpenses) || 0;
      
      const safeHomeValue = Number(homeValue) || 0;
      const safeInvestment1Value = Number(investment1Value) || 0;
      const safeInvestment2Value = Number(investment2Value) || 0;
      const safeInvestment3Value = Number(investment3Value) || 0;
      const safeInvestment4Value = Number(investment4Value) || 0;
      const safeSuperFundValue = Number(superFundValue) || 0;
      const safeSharesValue = Number(sharesValue) || 0;
      const safeSavingsValue = Number(savingsValue) || 0;
      const safeVehicleValue = Number(vehicleValue) || 0;
      const safeHomeContentsValue = Number(homeContentsValue) || 0;
      
      const safeHomeBalance = Number(homeBalance) || 0;
      const safeInvestment1Balance = Number(investment1Balance) || 0;
      const safeInvestment2Balance = Number(investment2Balance) || 0;
      const safeInvestment3Balance = Number(investment3Balance) || 0;
      const safeInvestment4Balance = Number(investment4Balance) || 0;
      const safeCreditCardBalance = Number(creditCardBalance) || 0;
      const safePersonalLoanBalance = Number(personalLoanBalance) || 0;
      const safeHecsBalance = Number(hecsBalance) || 0;
      
      const safeCurrentAge = Number(currentAge) || 35;
      const safeRetirementAge = Number(retirementAge) || 65;
      const safeProjectedSuper = Number(projectedSuper) || 0;

      // Calculate serviceability
      const serviceabilityResult = calculatePropertyServiceability(
        calculateInvestmentSurplus(summaryData.monthlyIncome, summaryData.monthlyExpenses)
      );

      // Calculate retirement projections
      const totalCurrentAssets = safeHomeValue + safeInvestment1Value + safeInvestment2Value + 
        safeInvestment3Value + safeInvestment4Value + safeSuperFundValue + safeSharesValue + 
        safeSavingsValue + safeVehicleValue;
      const projectedRetirementNetWorth = summaryData.netWorth * Math.pow(1.05, yearsToRetirement);
      const projectedRetirementMonthlyCashFlow = summaryData.monthlyCashFlow * 0.8;
      const projectedPropertyPortfolioValue = (safeHomeValue + safeInvestment1Value + 
        safeInvestment2Value + safeInvestment3Value + safeInvestment4Value) * Math.pow(1.065, yearsToRetirement);

      // Generate all chart images
      const [
        incomeChart, 
        expenseChart, 
        assetChart, 
        cashFlowChart, 
        retirementChart,
        detailedCashFlowChart,
        financialPositionChart,
        detailedRetirementChart,
        taxOptimizationChart
      ] = await Promise.all([
        generateIncomeChart({
          employment: safeAnnualIncome,
          rental: safeRentalIncome,
          investment: safeInvestmentIncome,
          other: safeOtherIncome,
        }),
        generateExpenseChart({
          workRelated: safeWorkExpenses,
          investment: safeInvestmentExpenses,
          rental: safeRentalExpenses,
          vehicle: safeVehicleExpenses,
          homeOffice: safeHomeOfficeExpenses,
        }),
        generateAssetLiabilityChart(
          {
            home: safeHomeValue,
            investments: safeInvestment1Value + safeInvestment2Value + safeInvestment3Value + safeInvestment4Value,
            super: safeSuperFundValue,
            shares: safeSharesValue,
            savings: safeSavingsValue,
            vehicle: safeVehicleValue,
            other: safeHomeContentsValue,
          },
          {
            homeLoan: safeHomeBalance,
            investmentLoans: safeInvestment1Balance + safeInvestment2Balance + safeInvestment3Balance + safeInvestment4Balance,
            creditCard: safeCreditCardBalance,
            personalLoan: safePersonalLoanBalance,
            hecs: safeHecsBalance,
          }
        ),
        generateCashFlowChart(summaryData.monthlyIncome, summaryData.monthlyExpenses),
        generateRetirementChart(safeCurrentAge, safeRetirementAge, safeSuperFundValue, safeProjectedSuper),
        generateDetailedCashFlowChart({
          employment: safeAnnualIncome,
          rental: safeRentalIncome,
          investment: safeInvestmentIncome,
          other: safeOtherIncome,
          workExpenses: safeWorkExpenses,
          investmentExpenses: safeInvestmentExpenses,
          rentalExpenses: safeRentalExpenses,
          vehicleExpenses: safeVehicleExpenses,
          homeOfficeExpenses: safeHomeOfficeExpenses,
        }),
        generateFinancialPositionChart(
          {
            home: safeHomeValue,
            investments: safeInvestment1Value + safeInvestment2Value + safeInvestment3Value + safeInvestment4Value,
            super: safeSuperFundValue,
            shares: safeSharesValue,
            savings: safeSavingsValue,
            vehicle: safeVehicleValue,
            other: safeHomeContentsValue,
          },
          {
            homeLoan: safeHomeBalance,
            investmentLoans: safeInvestment1Balance + safeInvestment2Balance + safeInvestment3Balance + safeInvestment4Balance,
            creditCard: safeCreditCardBalance,
            personalLoan: safePersonalLoanBalance,
            hecs: safeHecsBalance,
          }
        ),
        generateDetailedRetirementChart({
          currentAge: safeCurrentAge,
          retirementAge: safeRetirementAge,
          currentSuper: safeSuperFundValue,
          currentSavings: safeSavingsValue,
          currentShares: safeSharesValue,
          currentProperties: safeHomeValue + safeInvestment1Value + safeInvestment2Value + safeInvestment3Value + safeInvestment4Value - safeHomeBalance - safeInvestment1Balance - safeInvestment2Balance - safeInvestment3Balance - safeInvestment4Balance,
          projectedLumpSum: safeProjectedSuper,
          projectedMonthlyIncome: summaryData.monthlyIncome * 0.7,
          monthlySurplus: summaryData.retirementDeficitSurplus,
        }),
        generateTaxOptimizationChart({
          currentTax: summaryData.currentTax,
          optimizedTax: summaryData.optimizedTax,
          taxSavings: summaryData.taxSavings,
          strategies: summaryData.recommendations || [],
        }),
      ]);

      console.log('✓ Charts generated:', {
        income: !!incomeChart,
        expense: !!expenseChart,
        asset: !!assetChart,
        cashFlow: !!cashFlowChart,
        retirement: !!retirementChart,
        detailedCashFlow: !!detailedCashFlowChart,
        financialPosition: !!financialPositionChart,
        detailedRetirement: !!detailedRetirementChart,
        taxOptimization: !!taxOptimizationChart,
      });

      // Step 2: Prepare data for PDFReport component
      console.log('📄 Creating PDF document using PDFReport component...');
      
      // Helper to ensure value is defined (not undefined or null)
      const ensureDefined = <T,>(value: T | undefined | null, defaultValue: T): T => {
        return (value !== undefined && value !== null) ? value : defaultValue;
      };

      // Prepare chart images array - ensure all values are properly defined
      const chartImages: Array<{ type: string; dataUrl: string }> = [];
      if (incomeChart && typeof incomeChart === 'string' && incomeChart.startsWith('data:image/') && incomeChart.length > 100) {
        chartImages.push({ type: 'income', dataUrl: incomeChart });
      }
      if (expenseChart && typeof expenseChart === 'string' && expenseChart.startsWith('data:image/') && expenseChart.length > 100) {
        chartImages.push({ type: 'expenses', dataUrl: expenseChart });
      }
      if (assetChart && typeof assetChart === 'string' && assetChart.startsWith('data:image/') && assetChart.length > 100) {
        chartImages.push({ type: 'assets', dataUrl: assetChart });
      }
      if (cashFlowChart && typeof cashFlowChart === 'string' && cashFlowChart.startsWith('data:image/') && cashFlowChart.length > 100) {
        chartImages.push({ type: 'cashflow', dataUrl: cashFlowChart });
      }
      if (retirementChart && typeof retirementChart === 'string' && retirementChart.startsWith('data:image/') && retirementChart.length > 100) {
        chartImages.push({ type: 'retirement', dataUrl: retirementChart });
      }
      if (detailedCashFlowChart && typeof detailedCashFlowChart === 'string' && detailedCashFlowChart.startsWith('data:image/') && detailedCashFlowChart.length > 100) {
        chartImages.push({ type: 'detailedCashFlow', dataUrl: detailedCashFlowChart });
      }
      if (financialPositionChart && typeof financialPositionChart === 'string' && financialPositionChart.startsWith('data:image/') && financialPositionChart.length > 100) {
        chartImages.push({ type: 'financialPosition', dataUrl: financialPositionChart });
      }
      if (detailedRetirementChart && typeof detailedRetirementChart === 'string' && detailedRetirementChart.startsWith('data:image/') && detailedRetirementChart.length > 100) {
        chartImages.push({ type: 'detailedRetirement', dataUrl: detailedRetirementChart });
      }
      if (taxOptimizationChart && typeof taxOptimizationChart === 'string' && taxOptimizationChart.startsWith('data:image/') && taxOptimizationChart.length > 100) {
        chartImages.push({ type: 'taxOptimization', dataUrl: taxOptimizationChart });
      }

      // Prepare summary data for PDFReport - ensure all values are numbers/strings/booleans, never undefined
      const pdfSummary = {
        clientName: ensureDefined(summaryData.clientName, `${activeClient?.firstName || ''} ${activeClient?.lastName || ''}`.trim() || 'Client'),
        totalAssets: ensureDefined(summaryData.totalAssets, 0),
        totalLiabilities: ensureDefined(summaryData.totalLiabilities, 0),
        netWorth: ensureDefined(summaryData.netWorth, 0),
        monthlyIncome: ensureDefined(summaryData.monthlyIncome, 0),
        monthlyExpenses: ensureDefined(summaryData.monthlyExpenses, 0),
        monthlyCashFlow: ensureDefined(summaryData.monthlyCashFlow, 0),
        projectedRetirementLumpSum: ensureDefined(summaryData.projectedRetirementLumpSum, 0),
        retirementDeficitSurplus: ensureDefined(summaryData.retirementDeficitSurplus, 0),
        isRetirementDeficit: ensureDefined(summaryData.isRetirementDeficit, false),
        yearsToRetirement: ensureDefined(summaryData.yearsToRetirement, 0),
        currentTax: ensureDefined(summaryData.currentTax, 0),
        optimizedTax: ensureDefined(summaryData.optimizedTax, 0),
        taxSavings: ensureDefined(summaryData.taxSavings, 0),
        investmentProperties: ensureDefined(summaryData.investmentProperties, 0),
        totalPropertyValue: ensureDefined(summaryData.totalPropertyValue, 0),
        totalPropertyDebt: ensureDefined(summaryData.totalPropertyDebt, 0),
        propertyEquity: ensureDefined(summaryData.propertyEquity, 0),
        recommendations: Array.isArray(summaryData.recommendations) ? summaryData.recommendations.filter((r: any) => r != null) : [],
        projectedRetirementNetWorth: ensureDefined(projectedRetirementNetWorth, 0),
        projectedRetirementMonthlyCashFlow: ensureDefined(projectedRetirementMonthlyCashFlow, 0),
        projectedRetirementSurplus: ensureDefined(summaryData.retirementDeficitSurplus, 0),
        projectedPropertyPortfolioValue: ensureDefined(projectedPropertyPortfolioValue, 0),
        serviceability: {
          maxPropertyValue: ensureDefined(serviceabilityResult.maxPropertyValue, 0),
          maxMonthlyPayment: ensureDefined(serviceabilityResult.maxMonthlyPayment, 0),
          surplusIncome: ensureDefined(serviceabilityResult.surplusIncome, 0),
          loanToValueRatio: ensureDefined(serviceabilityResult.loanToValueRatio, 0.8),
          monthlyRentalIncome: ensureDefined(serviceabilityResult.monthlyRentalIncome, 0),
          totalMonthlyExpenses: ensureDefined(serviceabilityResult.totalMonthlyExpenses, 0),
          isViable: ensureDefined(serviceabilityResult.isViable, false),
          reason: serviceabilityResult.reason || '',
        },
      };

      // Prepare client data - ensure all values are strings, never undefined
      const pdfClientData = {
        firstName: ensureDefined(activeClient?.firstName, ''),
        lastName: ensureDefined(activeClient?.lastName, ''),
        email: ensureDefined(activeClient?.email, ''),
        phone: ensureDefined(activeClient?.phone, ''),
      };

      console.log('📋 PDF data prepared:', {
        clientName: pdfSummary.clientName,
        netWorth: pdfSummary.netWorth,
        chartCount: chartImages.length,
        summaryKeys: Object.keys(pdfSummary),
        clientDataKeys: Object.keys(pdfClientData),
      });

      // Step 3: Create PDF document using PDFReport component
      // Deep clone and clean all props to ensure no undefined values exist at any level
      // This is critical because @react-pdf/renderer cannot handle undefined values
      const deepClean = (obj: any, depth: number = 0): any => {
        // Prevent infinite recursion
        if (depth > 10) {
          console.warn('deepClean: Maximum depth reached, returning null');
          return null;
        }

        // Handle null and undefined
        if (obj === null) {
          return null;
        }
        if (obj === undefined) {
          return null; // Convert undefined to null
        }

        // Handle arrays
        if (Array.isArray(obj)) {
          return obj
            .map(item => deepClean(item, depth + 1))
            .filter(item => item !== undefined); // Remove undefined items
        }

        // Handle objects - ensure they are plain objects with proper prototype
        if (typeof obj === 'object') {
          // Create a plain object with Object prototype (not null prototype)
          // This ensures hasOwnProperty works correctly
          const cleaned: any = {};
          for (const key in obj) {
            // Use Object.prototype.hasOwnProperty to check if property exists
            // This is safe even if obj doesn't have hasOwnProperty method
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const value = obj[key];
              // Skip undefined values entirely
              if (value !== undefined) {
                const cleanedValue = deepClean(value, depth + 1);
                // Only add if the cleaned value is not undefined
                if (cleanedValue !== undefined) {
                  cleaned[key] = cleanedValue;
                }
              }
            }
          }
          return cleaned;
        }

        // Handle primitives (string, number, boolean)
        return obj;
      };

      // Create clean props object - ensure all values are defined
      const pdfReportProps = deepClean({
        summary: pdfSummary,
        chartImages: chartImages,
        clientData: pdfClientData,
      });

      // Final validation - ensure required props exist and have correct types
      if (!pdfReportProps || typeof pdfReportProps !== 'object') {
        throw new Error('PDF props validation failed: props object is missing or invalid');
      }
      if (!pdfReportProps.summary || typeof pdfReportProps.summary !== 'object') {
        throw new Error('PDF props validation failed: summary is missing or invalid');
      }
      if (!Array.isArray(pdfReportProps.chartImages)) {
        pdfReportProps.chartImages = [];
      }
      if (!pdfReportProps.clientData || typeof pdfReportProps.clientData !== 'object') {
        pdfReportProps.clientData = {};
      }

      // CRITICAL: Ensure all nested objects are properly initialized
      // The library may iterate over properties and needs them to be defined
      // Initialize any missing properties in summary with default values
      const defaultSummary = {
        clientName: '',
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: 0,
        projectedRetirementLumpSum: 0,
        retirementDeficitSurplus: 0,
        isRetirementDeficit: false,
        yearsToRetirement: 0,
        currentTax: 0,
        optimizedTax: 0,
        taxSavings: 0,
        investmentProperties: 0,
        totalPropertyValue: 0,
        totalPropertyDebt: 0,
        propertyEquity: 0,
        recommendations: [],
      };
      
      // Merge with defaults to ensure all properties exist
      pdfReportProps.summary = { ...defaultSummary, ...pdfReportProps.summary };
      
      // Ensure recommendations is an array
      if (!Array.isArray(pdfReportProps.summary.recommendations)) {
        pdfReportProps.summary.recommendations = [];
      }
      
      // Ensure all chart images have required properties
      pdfReportProps.chartImages = pdfReportProps.chartImages.map((chart: any) => ({
        type: chart.type || '',
        dataUrl: chart.dataUrl || '',
      }));
      
      // Ensure clientData has all properties
      const defaultClientData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };
      pdfReportProps.clientData = { ...defaultClientData, ...pdfReportProps.clientData };

      console.log('📋 PDF props cleaned and validated:', {
        hasSummary: !!pdfReportProps.summary,
        chartCount: pdfReportProps.chartImages?.length || 0,
        hasClientData: !!pdfReportProps.clientData,
      });

      // Step 4: Final validation - ensure no undefined values or non-serializable values in props
      // This is critical for @react-pdf/renderer compatibility
      const validateProps = (props: any, path: string = '', visited: WeakSet<any> = new WeakSet()): void => {
        if (props === undefined) {
          throw new Error(`Undefined value found in props at path: ${path}`);
        }
        if (props === null) {
          return; // null is allowed
        }
        // Check for functions (not serializable)
        if (typeof props === 'function') {
          throw new Error(`Function found in props at path: ${path} (functions are not serializable)`);
        }
        // Check for symbols (not serializable)
        if (typeof props === 'symbol') {
          throw new Error(`Symbol found in props at path: ${path} (symbols are not serializable)`);
        }
        if (Array.isArray(props)) {
          props.forEach((item, index) => {
            validateProps(item, `${path}[${index}]`, visited);
          });
          return;
        }
        if (typeof props === 'object') {
          // Check for circular references
          if (visited.has(props)) {
            throw new Error(`Circular reference found in props at path: ${path}`);
          }
          visited.add(props);
          
          // Check for Date objects (should be converted to string)
          if (props instanceof Date) {
            throw new Error(`Date object found in props at path: ${path} (dates should be converted to strings)`);
          }
          // Check for other non-serializable objects
          if (props instanceof RegExp || props instanceof Error) {
            throw new Error(`Non-serializable object found in props at path: ${path}`);
          }
          
          // Ensure the object has the Object prototype (not null prototype)
          if (Object.getPrototypeOf(props) === null) {
            throw new Error(`Object with null prototype found at path: ${path} (may cause hasOwnProperty issues)`);
          }
          
          for (const key in props) {
            // Use Object.prototype.hasOwnProperty to safely check
            if (Object.prototype.hasOwnProperty.call(props, key)) {
              if (props[key] === undefined) {
                throw new Error(`Undefined value found in props at path: ${path}.${key}`);
              }
              validateProps(props[key], path ? `${path}.${key}` : key, visited);
            }
          }
        }
      };

      // Validate props before creating element
      try {
        validateProps(pdfReportProps);
      } catch (validationError: any) {
        console.error('Props validation failed:', validationError);
        throw new Error(`PDF props validation failed: ${validationError.message}`);
      }

      // Final safety check: Try to JSON serialize/deserialize to ensure all values are serializable
      // This helps catch any edge cases that might cause issues with the PDF library
      try {
        const serialized = JSON.stringify(pdfReportProps);
        const deserialized = JSON.parse(serialized);
        // Use the deserialized version to ensure it's a clean, plain object
        Object.assign(pdfReportProps, deserialized);
      } catch (serializeError: any) {
        console.warn('Props serialization check failed (non-fatal):', serializeError);
        // Continue anyway - the validation should have caught any real issues
      }

      // Step 5: Create PDF document using JSX with ensured plain object props
      console.log('🔄 Creating PDF document element...');
      
      // Ensure pdf function is available
      if (typeof pdf !== 'function') {
        throw new Error('PDF generation function is not available');
      }
      
      // Ensure PDFReport component is available
      if (!PDFReport || typeof PDFReport !== 'function') {
        throw new Error('PDFReport component is not available');
      }
      
      // CRITICAL: Ensure all props are plain objects with ALL nested properties defined
      // The library accesses nested properties and needs them to exist
      const cleanSummary = JSON.parse(JSON.stringify(pdfReportProps.summary));
      const cleanChartImages = JSON.parse(JSON.stringify(pdfReportProps.chartImages));
      const cleanClientData = JSON.parse(JSON.stringify(pdfReportProps.clientData));
      
      // CRITICAL: Create a function that ensures ALL nested properties are defined
      // This prevents the library from encountering undefined when accessing nested properties
      const ensureAllPropertiesDefined = (obj: any, defaults: any): any => {
        if (obj === null || obj === undefined) {
          return defaults;
        }
        if (Array.isArray(obj)) {
          return Array.isArray(defaults) ? obj.map((item, index) => 
            ensureAllPropertiesDefined(item, defaults[index] ?? (typeof defaults[0] === 'object' ? {} : ''))
          ) : obj;
        }
        if (typeof obj === 'object' && typeof defaults === 'object') {
          const result: any = {};
          // Copy all properties from defaults first
          for (const key in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, key)) {
              result[key] = ensureAllPropertiesDefined(obj[key], defaults[key]);
            }
          }
          // Then copy any additional properties from obj
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && !(key in result)) {
              result[key] = ensureAllPropertiesDefined(obj[key], typeof obj[key] === 'object' && !Array.isArray(obj[key]) ? {} : (Array.isArray(obj[key]) ? [] : ''));
            }
          }
          return result;
        }
        return obj !== undefined && obj !== null ? obj : defaults;
      };
      
      // Define default structure for summary
      const summaryDefaults = {
        clientName: '',
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyCashFlow: 0,
        projectedRetirementLumpSum: 0,
        retirementDeficitSurplus: 0,
        isRetirementDeficit: false,
        yearsToRetirement: 0,
        currentTax: 0,
        optimizedTax: 0,
        taxSavings: 0,
        investmentProperties: 0,
        totalPropertyValue: 0,
        totalPropertyDebt: 0,
        propertyEquity: 0,
        recommendations: [],
      };
      
      // Ensure ALL nested properties exist in summary - this is critical
      // The library may access any property, so they must all be defined
      const finalSummary = ensureAllPropertiesDefined(cleanSummary, summaryDefaults);
      
      // Ensure ALL chart images have required properties
      const finalChartImages = (Array.isArray(cleanChartImages) ? cleanChartImages : []).map((chart: any) => ({
        type: chart?.type || '',
        dataUrl: chart?.dataUrl || '',
      }));
      
      // Ensure ALL client data properties exist
      const finalClientData = {
        firstName: cleanClientData?.firstName || '',
        lastName: cleanClientData?.lastName || '',
        email: cleanClientData?.email || '',
        phone: cleanClientData?.phone || '',
      };
      
      // Generate blob with error handling
      let pdfBlob: Blob;
      try {
        // CRITICAL: Before creating the element, ensure all props are properly structured
        // The library may access React element internals, so we need to ensure everything exists
        // Recursively ensure ALL nested objects are properly initialized with Object prototype
        const recursivelyEnsureObjects = (obj: any, depth: number = 0): any => {
          if (depth > 15) return obj; // Prevent infinite recursion
          
          if (obj === undefined || obj === null) {
            return obj === undefined ? null : obj;
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => recursivelyEnsureObjects(item, depth + 1));
          }
          
          if (typeof obj === 'object') {
            // Ensure object has Object prototype (not null prototype)
            const proto = Object.getPrototypeOf(obj);
            if (proto === null) {
              // Recreate with Object prototype
              const newObj: any = {};
              for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  const value = obj[key];
                  if (value !== undefined) {
                    newObj[key] = recursivelyEnsureObjects(value, depth + 1);
                  }
                }
              }
              return newObj;
            } else {
              // Object has proper prototype, but ensure nested objects do too
              const newObj: any = {};
              for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  const value = obj[key];
                  if (value !== undefined) {
                    newObj[key] = recursivelyEnsureObjects(value, depth + 1);
                  }
                }
              }
              return newObj;
            }
          }
          
          return obj;
        };
        
        // Recursively clean all props to ensure proper object prototypes
        const cleanedProps = {
          data: {
            clientA: recursivelyEnsureObjects({}),
            clientB: recursivelyEnsureObjects({}),
            combined: recursivelyEnsureObjects(finalSummary),
          },
          chartImages: recursivelyEnsureObjects(finalChartImages),
        };
        
        // CRITICAL FIX: The library may be accessing React element internals that don't exist
        // Try using React.createElement with explicit type and props
        // This ensures the element is created with all necessary React internals
        const finalPdfDocument = React.createElement(
          PDFReport,
          cleanedProps,
          null
        );

        // Validate the final element
        if (!finalPdfDocument) {
          throw new Error('Final PDF document element is null or undefined');
        }
        if (typeof finalPdfDocument !== 'object') {
          throw new Error(`Final PDF document element is not an object: ${typeof finalPdfDocument}`);
        }
        if (!finalPdfDocument.type) {
          throw new Error('Final PDF document element is missing type property');
        }
        if (!finalPdfDocument.props) {
          throw new Error('Final PDF document element is missing props property');
        }

        // CRITICAL: Ensure the props object has Object prototype
        // The library uses hasOwnProperty which requires Object prototype
        if (finalPdfDocument.props && typeof finalPdfDocument.props === 'object') {
          const propsProto = Object.getPrototypeOf(finalPdfDocument.props);
          if (propsProto === null) {
            // Recreate props with Object prototype
            finalPdfDocument.props = Object.assign({}, finalPdfDocument.props);
          }
        }

        // Log the document structure for debugging
        console.log('📄 PDF Document element type:', typeof finalPdfDocument);
        console.log('📄 PDF Document structure:', {
          type: finalPdfDocument?.type?.name || finalPdfDocument?.type || 'unknown',
          props: finalPdfDocument?.props ? Object.keys(finalPdfDocument.props) : 'no props',
          hasType: !!finalPdfDocument?.type,
          hasProps: !!finalPdfDocument?.props,
          propsPrototype: finalPdfDocument?.props ? (Object.getPrototypeOf(finalPdfDocument.props) === null ? 'null' : 'Object') : 'no props',
        });

        // CRITICAL FIX: This is a known React 18 compatibility issue with @react-pdf/renderer
        // The library tries to access hasOwnProperty on undefined objects during component processing
        // WORKAROUND: Use a try-catch and if it fails, try with a completely fresh element structure
        console.log('🔄 Calling pdf() with component element...');
        
        let pdfInstance;
        try {
          // First attempt: Use JSX to create element with all React internals
          const pdfDocument = (
            <PDFReport
              data={cleanedProps.data}
              chartImages={cleanedProps.chartImages}
            />
          );
          pdfInstance = pdf(pdfDocument as any);
        } catch (firstError: any) {
          // If first attempt fails with hasOwnProperty error, try alternative approach
          if (firstError?.message?.includes('hasOwnProperty') || firstError?.message?.includes('undefined')) {
            console.warn('First attempt failed, trying alternative approach...');
            
            // Alternative: Create element using React.createElement with explicit structure
            // Ensure all props are plain objects with no undefined values
            const altProps = {
              data: JSON.parse(JSON.stringify(cleanedProps.data)),
              chartImages: JSON.parse(JSON.stringify(cleanedProps.chartImages)),
            };
            
            // Create a wrapper function component to ensure proper React structure
            const PDFWrapper = function() {
              return React.createElement(PDFReport, altProps, null);
            };
            PDFWrapper.displayName = 'PDFWrapper';
            
            const altDocument = React.createElement(PDFWrapper, {}, null);
            pdfInstance = pdf(altDocument as any);
          } else {
            throw firstError;
          }
        }
        
        if (!pdfInstance) {
          throw new Error('PDF instance is null or undefined');
        }
        
        if (typeof pdfInstance.toBlob !== 'function') {
          throw new Error('PDF instance does not have toBlob method');
        }
        
        console.log('🔄 Calling toBlob()...');
        pdfBlob = await pdfInstance.toBlob();
      } catch (pdfError: any) {
        console.error('Error in pdf() or toBlob():', pdfError);
        console.error('Error stack:', pdfError?.stack);
        console.error('Error details:', {
          message: pdfError?.message,
          name: pdfError?.name,
          hasOwnProperty: pdfError?.message?.includes('hasOwnProperty'),
        });
        
        // Log the props structure for debugging
        console.error('Props structure at error:', {
          summaryKeys: pdfReportProps.summary ? Object.keys(pdfReportProps.summary) : 'no summary',
          chartCount: pdfReportProps.chartImages?.length || 0,
          clientDataKeys: pdfReportProps.clientData ? Object.keys(pdfReportProps.clientData) : 'no clientData',
        });
        
        // The hasOwnProperty error typically means the library encountered undefined
        // when trying to check object properties. This can happen if:
        // 1. The component element structure is incorrect
        // 2. Props contain undefined values that the library can't handle
        // 3. The library is trying to access React internals that don't exist
        if (pdfError?.message?.includes('hasOwnProperty') || pdfError?.message?.includes('undefined')) {
          // Try to provide more helpful error message
          const errorMsg = pdfError?.message || 'Unknown error';
          throw new Error(
            `PDF generation failed: The PDF library encountered an error while processing the document. ` +
            `Error: ${errorMsg}. ` +
            `This may be due to invalid data structure. Please ensure all client data is properly filled in and try again.`
          );
        }
        throw pdfError;
      }
      
      if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        throw new Error('PDF blob generation returned invalid result');
      }
      
      console.log('✓ PDF blob created:', pdfBlob.size, 'bytes');
      
      // Generate filename
      const fileName = `Financial_Report_${summaryData.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
        // Save to server if client ID exists AND caller requested saving
        if (clientId && saveToServer) {
          const formData = new FormData();
          formData.append('file', pdfBlob, fileName);
          formData.append('clientId', clientId);
          formData.append('fileName', fileName);

          const response = await fetch('/api/pdf-exports', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const savedPdf = await response.json();
            setLastGeneratedPdfId(savedPdf.id);
            
            // Also download the PDF to user's browser
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({
              title: 'PDF Generated',
              description: 'Professional PDF report has been generated, saved, and downloaded'
            });

            return savedPdf.id;
          } else {
            console.error('Failed to save PDF to server');
            toast({
              title: 'PDF Generated',
              description: 'PDF generated but could not be saved to server',
              variant: 'default'
            });
            return null;
          }
        } else {
          // Download PDF if client not saved
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: 'PDF Generated',
            description: 'PDF generated and downloaded (client not saved)',
            variant: 'default'
          });
          
          return null;
        }
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Safely extract error message
      let errorMessage = 'Failed to generate PDF';
      if (error != null) {
        if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message) || errorMessage;
        }
      }
      
      // Check for specific error types
      if (errorMessage.includes('Cannot find module') || errorMessage.includes('@react-pdf')) {
        toast({
          title: 'PDF Library Not Installed',
          description: 'The PDF generation library is not installed. Please run: npm install @react-pdf/renderer',
          variant: 'destructive'
        });
      } else if (errorMessage.includes('document') || errorMessage.includes('canvas')) {
        toast({
          title: 'Browser API Error',
          description: 'PDF generation requires browser APIs. Please ensure you are running this in a browser environment.',
          variant: 'destructive'
        });
      } else if (errorMessage.includes('hasOwnProperty') || errorMessage.includes('undefined')) {
        toast({
          title: 'PDF Generation Error',
          description: 'An error occurred while generating the PDF. Please ensure all client data is properly filled in and try again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error Generating PDF',
          description: errorMessage,
          variant: 'destructive'
        });
      }
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const printReport = () => {
    window.print();
    toast({
      title: 'Print Dialog Opened',
      description: 'Your report is ready to print'
    });
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Financial Planning Report',
          text: `Financial planning report for ${summary?.clientName ?? ''}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Report link has been copied to clipboard'
      });
    }
  };

  // Show message if no client is selected
  if (!activeClient && !isLoadingClient) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-foreground">No Client Selected</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please select or create a client to view the financial planning summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/client-information'}
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
            >
              Go to Client Information
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or load a client by adding ?load=CLIENT_ID to the URL
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoadingClient) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">Loading client data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen" id="summary-content" ref={summaryContentRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Planning Summary</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive overview for {hasClientA ? clientAName : ''}{hasClientA && hasClientB ? ' & ' : ''}{hasClientB ? clientBName : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={shareReport}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={() => generatePDF(false)}
            disabled={isGeneratingPDF}
            className="bg-yellow-500 text-white hover:bg-yellow-600"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Client Overview - Dual Client within same card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Client Overview</CardTitle>
          <CardDescription className="text-muted-foreground">
            Financial planning summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Net Worth */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <div className="space-y-2 mt-2">
                {hasClientA && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientAName}</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(summaryA.netWorth)}</p>
                  </div>
                )}
                {hasClientB && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientBName}</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(summaryB.netWorth)}</p>
                  </div>
                )}
                {showCombined && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2 border border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Combined</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(summaryCombined.netWorth)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Surplus */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">Monthly Surplus</p>
              <div className="space-y-2 mt-2">
                {hasClientA && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientAName}</p>
                    <p className={`text-lg font-bold ${summaryA.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatCurrency(summaryA.monthlyCashFlow)}
                    </p>
                  </div>
                )}
                {hasClientB && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientBName}</p>
                    <p className={`text-lg font-bold ${summaryB.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatCurrency(summaryB.monthlyCashFlow)}
                    </p>
                  </div>
                )}
                {showCombined && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2 border border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Combined</p>
                    <p className={`text-lg font-bold ${summaryCombined.monthlyCashFlow >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600'}`}>
                      {formatCurrency(summaryCombined.monthlyCashFlow)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tax Savings */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">Tax Savings</p>
              <div className="space-y-2 mt-2">
                {hasClientA && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientAName}</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(summaryA.taxSavings)}</p>
                  </div>
                )}
                {hasClientB && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientBName}</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(summaryB.taxSavings)}</p>
                  </div>
                )}
                {showCombined && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2 border border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Combined</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(summaryCombined.taxSavings)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Retirement Status */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">Retirement Status</p>
              <div className="space-y-2 mt-2">
                {hasClientA && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientAName}</p>
                    <p className={`text-lg font-bold ${summaryA.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                      {summaryA.isRetirementDeficit ? 'Deficit' : 'Surplus'}
                    </p>
                  </div>
                )}
                {hasClientB && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-500">{clientBName}</p>
                    <p className={`text-lg font-bold ${summaryB.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                      {summaryB.isRetirementDeficit ? 'Deficit' : 'Surplus'}
                    </p>
                  </div>
                )}
                {showCombined && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2 border border-yellow-300 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Combined</p>
                    <p className={`text-lg font-bold ${summaryCombined.isRetirementDeficit ? 'text-red-600' : 'text-yellow-700 dark:text-yellow-400'}`}>
                      {summaryCombined.isRetirementDeficit ? 'Deficit' : 'Surplus'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Position Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assets & Liabilities - Dual Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Financial Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                {hasClientA && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientAName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Assets</span>
                        <span className="font-semibold text-yellow-600">${summaryA.totalAssets.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Liabilities</span>
                        <span className="font-semibold text-red-600">${summaryA.totalLiabilities.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Net Worth</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryA.netWorth.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client B */}
                {hasClientB && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientBName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Assets</span>
                        <span className="font-semibold text-yellow-600">${summaryB.totalAssets.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Liabilities</span>
                        <span className="font-semibold text-red-600">${summaryB.totalLiabilities.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Net Worth</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryB.netWorth.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined Household Totals */}
              {showCombined && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Household</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground text-xs">Total Assets</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.totalAssets.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Total Liabilities</span>
                      <p className="font-bold text-red-600">${summaryCombined.totalLiabilities.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Net Worth</span>
                      <p className="font-bold text-lg text-yellow-700 dark:text-yellow-400">${summaryCombined.netWorth.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Investment Property Potential - with inline rent input */}
          {(() => {
            const retirementMetrics = calculateInvestmentSurplus(summary.monthlyIncome, summary.monthlyExpenses);
            const baseline = calculatePropertyServiceability(retirementMetrics);

            let finalService = baseline;
            const rentPerWeek = typeof targetRentPerWeek === 'string' ? (targetRentPerWeek === '' ? 0 : Number(targetRentPerWeek)) : (targetRentPerWeek || 0);
            const expensesPerMonth = typeof propertyExpensesPerMonth === 'string' ? (propertyExpensesPerMonth === '' ? 0 : Number(propertyExpensesPerMonth)) : (propertyExpensesPerMonth || 0);

            // If user entered a rent amount or expenses, override the monthly rental income and expenses in the result
            if (rentPerWeek > 0 || expensesPerMonth > 0) {
              const monthlyRentFromInput = rentPerWeek > 0 ? rentPerWeek * 4.33 : baseline.monthlyRentalIncome; // 52 weeks/year ÷ 12 months
              finalService = {
                ...baseline,
                monthlyRentalIncome: monthlyRentFromInput,
                totalMonthlyExpenses: expensesPerMonth > 0 ? expensesPerMonth : baseline.totalMonthlyExpenses
              };
            }

            return (
              <ServiceabilitySummary 
                serviceability={finalService} 
                monthlyIncome={summary.monthlyIncome}
                targetRentPerWeek={targetRentPerWeek}
                onRentChange={(value) => setTargetRentPerWeek(value)}
                propertyExpensesPerMonth={propertyExpensesPerMonth}
                onPropertyExpensesChange={(value) => setPropertyExpensesPerMonth(value)}
              />
            );
          })()}

          {/* Cash Flow Analysis - Dual Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                {hasClientA && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientAName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Monthly Income</span>
                        <span className="font-semibold text-yellow-600">${summaryA.monthlyIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Monthly Expenses</span>
                        <span className="font-semibold text-red-600">${summaryA.monthlyExpenses.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Net Cash Flow</span>
                        <span className={`text-lg font-bold ${summaryA.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          ${summaryA.monthlyCashFlow.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client B */}
                {hasClientB && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientBName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Monthly Income</span>
                        <span className="font-semibold text-yellow-600">${summaryB.monthlyIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Monthly Expenses</span>
                        <span className="font-semibold text-red-600">${summaryB.monthlyExpenses.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Net Cash Flow</span>
                        <span className={`text-lg font-bold ${summaryB.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          ${summaryB.monthlyCashFlow.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined Cash Flow */}
              {showCombined && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Household</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground text-xs">Monthly Income</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.monthlyIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Monthly Expenses</span>
                      <p className="font-bold text-red-600">${summaryCombined.monthlyExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Net Cash Flow</span>
                      <p className={`font-bold text-lg ${summaryCombined.monthlyCashFlow >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600'}`}>
                        ${summaryCombined.monthlyCashFlow.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Properties - Dual Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Investment Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                {hasClientA && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientAName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Number of Properties</span>
                        <span className="font-semibold text-foreground">{summaryA.investmentProperties}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Property Value</span>
                        <span className="font-semibold text-yellow-600">${summaryA.totalPropertyValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Property Debt</span>
                        <span className="font-semibold text-red-600">${summaryA.totalPropertyDebt.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Property Equity</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryA.propertyEquity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client B */}
                {hasClientB && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientBName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Number of Properties</span>
                        <span className="font-semibold text-foreground">{summaryB.investmentProperties}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Property Value</span>
                        <span className="font-semibold text-yellow-600">${summaryB.totalPropertyValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Total Property Debt</span>
                        <span className="font-semibold text-red-600">${summaryB.totalPropertyDebt.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Property Equity</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryB.propertyEquity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined Properties */}
              {showCombined && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Portfolio</p>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground text-xs">Properties</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">{summaryCombined.investmentProperties}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Total Value</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.totalPropertyValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Total Debt</span>
                      <p className="font-bold text-red-600">${summaryCombined.totalPropertyDebt.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Equity</span>
                      <p className="font-bold text-lg text-yellow-700 dark:text-yellow-400">${summaryCombined.propertyEquity.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retirement Projection - Dual Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Retirement Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                {hasClientA && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientAName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Years to Retirement</span>
                        <span className="font-semibold text-foreground">{summaryA.yearsToRetirement} years</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Projected Net Worth</span>
                        <span className="font-semibold text-yellow-600">${summaryA.projectedRetirementLumpSum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Projected Passive Income</span>
                        <span className="font-semibold text-yellow-600">${summaryA.projectedRetirementMonthlyCashFlow.toLocaleString()}/mo</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="text-center">
                        <p className={`text-xl font-bold ${summaryA.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                          ${Math.abs(summaryA.retirementDeficitSurplus).toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summaryA.isRetirementDeficit ? 'Deficit' : 'Surplus'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client B */}
                {hasClientB && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientBName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Years to Retirement</span>
                        <span className="font-semibold text-foreground">{summaryB.yearsToRetirement} years</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Projected Net Worth</span>
                        <span className="font-semibold text-yellow-600">${summaryB.projectedRetirementLumpSum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Projected Passive Income</span>
                        <span className="font-semibold text-yellow-600">${summaryB.projectedRetirementMonthlyCashFlow.toLocaleString()}/mo</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="text-center">
                        <p className={`text-xl font-bold ${summaryB.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                          ${Math.abs(summaryB.retirementDeficitSurplus).toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summaryB.isRetirementDeficit ? 'Deficit' : 'Surplus'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined Retirement */}
              {showCombined && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Household</p>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground text-xs">Earliest Retirement</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">{summaryCombined.yearsToRetirement} years</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Combined Net Worth</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.projectedRetirementLumpSum.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Passive Income</span>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.projectedRetirementMonthlyCashFlow.toLocaleString()}/mo</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">{summaryCombined.isRetirementDeficit ? 'Deficit' : 'Surplus'}</span>
                      <p className={`font-bold text-lg ${summaryCombined.isRetirementDeficit ? 'text-red-600' : 'text-yellow-700 dark:text-yellow-400'}`}>
                        ${Math.abs(summaryCombined.retirementDeficitSurplus).toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Optimization - Dual Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Tax Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                {hasClientA && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientAName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Current Annual Tax</span>
                        <span className="font-semibold text-red-600">${summaryA.currentTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Optimized Tax</span>
                        <span className="font-semibold text-gray-600">${summaryA.optimizedTax.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Tax Savings</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryA.taxSavings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client B */}
                {hasClientB && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-yellow-600 mb-3">{clientBName}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Current Annual Tax</span>
                        <span className="font-semibold text-red-600">${summaryB.currentTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Optimized Tax</span>
                        <span className="font-semibold text-gray-600">${summaryB.optimizedTax.toLocaleString()}</span>
                      </div>
                      <hr className="border-gray-300 dark:border-gray-600" />
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground text-sm">Tax Savings</span>
                        <span className="text-lg font-bold text-yellow-600">${summaryB.taxSavings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Combined Tax */}
              {showCombined && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Household</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-muted-foreground text-xs">Current Tax</span>
                      <p className="font-bold text-red-600">${summaryCombined.currentTax.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Optimized Tax</span>
                      <p className="font-bold text-gray-600">${summaryCombined.optimizedTax.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Total Savings</span>
                      <p className="font-bold text-lg text-yellow-700 dark:text-yellow-400">${summaryCombined.taxSavings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Layout: Recommendations & Actions on left, Financial Snapshot on right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8 pt-6 border-t">
          {/* Left column: Sidebar - Financial Snapshot, Report Actions, Key Recommendations */}
          <div className="lg:col-span-4 space-y-6">
            {/* Financial Snapshot - Dual Client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Financial Snapshot</CardTitle>
                <CardDescription className="text-muted-foreground">Quick view of key financial metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client A Snapshot */}
                  {hasClientA && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-yellow-600">{clientAName}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Net Worth</span>
                          <span className="font-bold text-yellow-600">${summaryA.netWorth.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monthly Surplus</span>
                          <span className={`font-bold ${summaryA.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            ${summaryA.monthlyCashFlow.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Retirement Status</span>
                          <span className={`font-bold ${summaryA.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                            {summaryA.isRetirementDeficit ? 'Action Needed' : 'On Track'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tax Savings</span>
                          <span className="font-bold text-yellow-600">${summaryA.taxSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Client B Snapshot */}
                  {hasClientB && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-yellow-600">{clientBName}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Net Worth</span>
                          <span className="font-bold text-yellow-600">${summaryB.netWorth.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Monthly Surplus</span>
                          <span className={`font-bold ${summaryB.monthlyCashFlow >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            ${summaryB.monthlyCashFlow.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Retirement Status</span>
                          <span className={`font-bold ${summaryB.isRetirementDeficit ? 'text-red-600' : 'text-yellow-600'}`}>
                            {summaryB.isRetirementDeficit ? 'Action Needed' : 'On Track'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tax Savings</span>
                          <span className="font-bold text-yellow-600">${summaryB.taxSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Combined Household Snapshot */}
                {showCombined && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3">Combined Household</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <span className="text-muted-foreground text-xs">Net Worth</span>
                        <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.netWorth.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Monthly Surplus</span>
                        <p className={`font-bold ${summaryCombined.monthlyCashFlow >= 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600'}`}>
                          ${summaryCombined.monthlyCashFlow.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Retirement Status</span>
                        <p className={`font-bold ${summaryCombined.isRetirementDeficit ? 'text-red-600' : 'text-yellow-700 dark:text-yellow-400'}`}>
                          {summaryCombined.isRetirementDeficit ? 'Action Needed' : 'On Track'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Tax Savings</span>
                        <p className="font-bold text-yellow-700 dark:text-yellow-400">${summaryCombined.taxSavings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Report Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => generatePDF()}
                  disabled={isGeneratingPDF}
                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGeneratingPDF ? 'Generating PDF...' : 'Generate Detailed PDF'}
                </Button>
                
                <Button 
                  onClick={printReport}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                
                <Button 
                  onClick={shareReport}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Report
                </Button>
              </CardContent>
            </Card>

            {/* Email Report Section */}
            <EmailReportSection
              clientEmail={activeClient?.email || ''}
              clientName={summary.clientName}
              summary={{
                netWorth: summary.netWorth,
                monthlyCashFlow: summary.monthlyCashFlow,
                taxSavings: summary.taxSavings,
                isRetirementDeficit: summary.isRetirementDeficit,
                retirementDeficitSurplus: summary.retirementDeficitSurplus,
                projectedRetirementLumpSum: summary.projectedRetirementLumpSum,
                projectedRetirementMonthlyCashFlow: summary.projectedRetirementMonthlyCashFlow,
              }}
              onGeneratePdf={generatePDF}
              lastGeneratedPdfId={lastGeneratedPdfId}
              clientId={activeClient?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}