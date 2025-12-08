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
import { FileText, Download, Mail, Printer, Share2, TrendingUp, TrendingDown, DollarSign, Calculator, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  generateIncomeChart,
  generateExpenseChart,
  generateAssetLiabilityChart,
  generateCashFlowChart,
  generateRetirementChart,
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
import { ServiceabilitySummary } from '@/components/serviceability-summary';
import { calculateInvestmentSurplus, calculatePropertyServiceability } from '@/lib/finance/serviceability';
import { formatCurrency } from '@/lib/utils/format';

const emailSchema = z.object({
  recipientEmail: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().optional()
});

type EmailData = z.infer<typeof emailSchema>;

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

export default function SummaryPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [lastGeneratedPdfId, setLastGeneratedPdfId] = useState<string | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const summaryContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const financialStore = useFinancialStore();

  // Get active client for email pre-fill
  const activeClientForEmail = financialStore.activeClient 
    ? financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any
    : null;

  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipientEmail: activeClientForEmail?.email || '',
      subject: 'Your Financial Planning Report - Perpetual Wealth Partners',
      message: 'Please find attached your comprehensive financial planning report. If you have any questions, please don\'t hesitate to contact us.'
    }
  });

  // Update email when client changes
  useEffect(() => {
    if (activeClientForEmail?.email) {
      emailForm.setValue('recipientEmail', activeClientForEmail.email);
    }
  }, [activeClientForEmail?.email, emailForm]);

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

  // Calculate summary from real financial store data
  const activeClient = financialStore.activeClient 
    ? financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any
    : null;

  // Calculate totals from store and client data
  const calculateSummary = (): FinancialSummary => {
    const client = activeClient;
    const clientName = client 
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client'
      : 'No Client Selected';

    // Calculate assets
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
    
    const totalAssets = homeValue + investment1Value + investment2Value + investment3Value + investment4Value +
      vehicleValue + savingsValue + homeContentsValue + superFundValue + sharesValue;

    // Calculate liabilities
    const homeBalance = client?.homeBalance || 0;
    const investment1Balance = client?.investment1Balance || 0;
    const investment2Balance = client?.investment2Balance || 0;
    const investment3Balance = client?.investment3Balance || 0;
    const investment4Balance = client?.investment4Balance || 0;
    const creditCardBalance = client?.creditCardBalance || 0;
    const personalLoanBalance = client?.personalLoanBalance || 0;
    const hecsBalance = client?.hecsBalance || client?.helpDebt || 0;
    
    const totalLiabilities = homeBalance + investment1Balance + investment2Balance + investment3Balance + 
      investment4Balance + creditCardBalance + personalLoanBalance + hecsBalance;

    const netWorth = totalAssets - totalLiabilities;

    // Calculate income (annual, convert to monthly)
    const annualIncome = financialStore.grossIncome || financialStore.employmentIncome || client?.annualIncome || client?.grossSalary || 0;
    const rentalIncome = financialStore.rentalIncome || client?.rentalIncome || 0;
    const investmentIncome = financialStore.investmentIncome || client?.dividends || 0;
    const otherIncome = financialStore.otherIncome || client?.otherIncome || 0;
    const totalAnnualIncome = annualIncome + rentalIncome + investmentIncome + otherIncome;
    const monthlyIncome = totalAnnualIncome / 12;

    // Calculate expenses (annual, convert to monthly)
    const workExpenses = financialStore.workRelatedExpenses || client?.workRelatedExpenses || 0;
    const investmentExpenses = financialStore.investmentExpenses || client?.investmentExpenses || 0;
    const rentalExpenses = financialStore.rentalExpenses || client?.rentalExpenses || 0;
    const vehicleExpenses = client?.vehicleExpenses || 0;
    const homeOfficeExpenses = client?.homeOfficeExpenses || 0;
    const totalAnnualExpenses = workExpenses + investmentExpenses + rentalExpenses + vehicleExpenses + homeOfficeExpenses;
    const monthlyExpenses = totalAnnualExpenses / 12;

    const monthlyCashFlow = monthlyIncome - monthlyExpenses;

    // Property calculations
    const investmentProperties = [investment1Value, investment2Value, investment3Value, investment4Value]
      .filter(v => v > 0).length;
    const totalPropertyValue = homeValue + investment1Value + investment2Value + investment3Value + investment4Value;
    const totalPropertyDebt = homeBalance + investment1Balance + investment2Balance + investment3Balance + investment4Balance;
    const propertyEquity = totalPropertyValue - totalPropertyDebt;

    // Retirement calculations (simplified)
    const currentAge = client?.currentAge || 35;
    const retirementAge = client?.retirementAge || 65;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const projectedRetirementLumpSum = superFundValue * Math.pow(1.07, yearsToRetirement); // 7% growth assumption
    const retirementDeficitSurplus = monthlyCashFlow; // Simplified
    const isRetirementDeficit = retirementDeficitSurplus < 0;

    // Tax calculations (simplified - would need actual tax calculation)
    const taxableIncome = totalAnnualIncome - totalAnnualExpenses;
    const currentTax = Math.max(0, taxableIncome * 0.30); // Simplified 30% rate
    const optimizedTax = Math.max(0, taxableIncome * 0.25); // Simplified optimization
    const taxSavings = currentTax - optimizedTax;

    // Generate recommendations
    const recommendations: string[] = [];
    if (superFundValue < totalAnnualIncome * 2) {
      recommendations.push('Increase superannuation contributions through salary sacrifice');
    }
    if (monthlyCashFlow > 0 && investmentProperties < 2) {
      recommendations.push('Consider additional investment property for negative gearing benefits');
    }
    if (workExpenses < annualIncome * 0.05) {
      recommendations.push('Maximize work-related tax deductions');
    }
    if (sharesValue < totalAssets * 0.2) {
      recommendations.push('Review and optimize investment portfolio allocation');
    }
    if (!client?.privateHealthInsurance && annualIncome > 90000) {
      recommendations.push('Consider private health insurance to avoid Medicare Levy Surcharge');
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

  const summary = calculateSummary();

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

  const generatePDF = async (attachToEmail = false): Promise<string | null> => {
    setIsGeneratingPDF(true);
    
    try {
      console.log('🚀 Starting PDF generation...');
      
      // Verify @react-pdf/renderer is available
      if (typeof pdf === 'undefined') {
        throw new Error('PDF generation library (@react-pdf/renderer) is not installed. Please install it with: npm install @react-pdf/renderer');
      }

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

      // Generate all chart images
      const [incomeChart, expenseChart, assetChart, cashFlowChart, retirementChart] = await Promise.all([
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
      ]);

      console.log('✓ Charts generated:', {
        income: !!incomeChart,
        expense: !!expenseChart,
        asset: !!assetChart,
        cashFlow: !!cashFlowChart,
        retirement: !!retirementChart,
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

      // Step 5: Create PDF document using JSX syntax
      // JSX creates React elements with all necessary internals for @react-pdf/renderer
      console.log('🔄 Creating PDF document element...');
      
      // Ensure pdf function is available and callable
      if (typeof pdf !== 'function') {
        throw new Error('PDF generation function is not available');
      }
      
      // Ensure PDFReport component is available
      if (!PDFReport || typeof PDFReport !== 'function') {
        throw new Error('PDFReport component is not available');
      }
      
      // Generate blob with error handling
      let pdfBlob: Blob;
      try {
        // Use JSX to create the element - this ensures all React internals are present
        // The library needs proper React element structure with _owner, _store, etc.
        const pdfDocument = (
          <PDFReport
            summary={pdfReportProps.summary}
            chartImages={pdfReportProps.chartImages}
            clientData={pdfReportProps.clientData}
          />
        );

        // Validate the element was created correctly
        if (!pdfDocument) {
          throw new Error('PDF document element is null or undefined');
        }
        if (typeof pdfDocument !== 'object') {
          throw new Error(`PDF document element is not an object: ${typeof pdfDocument}`);
        }

        // Ensure the element has the required React structure
        if (!pdfDocument.type) {
          throw new Error('PDF document element is missing type property');
        }
        if (!pdfDocument.props) {
          throw new Error('PDF document element is missing props property');
        }

        // Log the document structure for debugging
        console.log('📄 PDF Document element type:', typeof pdfDocument);
        console.log('📄 PDF Document structure:', {
          type: pdfDocument?.type?.name || pdfDocument?.type || 'unknown',
          props: pdfDocument?.props ? Object.keys(pdfDocument.props) : 'no props',
          hasType: !!pdfDocument?.type,
          hasProps: !!pdfDocument?.props,
        });

        // Call pdf() with the component element
        // The library will render the component and extract the Document
        // Type assertion needed because pdf() accepts components that return Document elements
        console.log('🔄 Calling pdf() with component element...');
        const pdfInstance = pdf(pdfDocument as any);
        
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
      
      if (attachToEmail) {
        // Save to server if client ID exists
        if (clientId) {
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
            
            toast({
              title: 'PDF Generated',
              description: 'Professional PDF report has been generated and saved'
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
          toast({
            title: 'PDF Generated',
            description: 'PDF generated but not saved (client not saved)',
            variant: 'default'
          });
          return null;
        }
      } else {
        // Download PDF
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Also save to server if client ID exists
        if (clientId) {
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
            
            // Dispatch event to refresh Account Centre
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('pdf-generated', { detail: savedPdf }));
            }
            
            toast({
              title: 'PDF Generated',
              description: 'Your professional financial planning report has been generated, downloaded, and saved'
            });
          } else {
            toast({
              title: 'PDF Generated',
              description: 'Your financial planning report has been generated and downloaded (not saved to server)',
              variant: 'default'
            });
          }
        } else {
          toast({
            title: 'PDF Generated',
            description: 'Your professional financial planning report has been generated and downloaded'
          });
        }

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

  const sendEmail = async (data: EmailData) => {
    setIsSendingEmail(true);
    
    try {
      // Get client email from active client or form
      const clientEmail = data.recipientEmail;
      const activeClient = financialStore.activeClient 
        ? financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any
        : null;
      
      const finalClientEmail = clientEmail || activeClient?.email;

      if (!finalClientEmail) {
        toast({
          title: 'Error',
          description: 'Client email is required. Please enter a client email address or ensure the selected client has an email.',
          variant: 'destructive'
        });
        setIsSendingEmail(false);
        return;
      }

      // Ensure client is saved before sending email
      let clientId = activeClient?.id;
      if (!clientId && activeClient) {
        // Try to save the client first
        try {
          const saveResponse = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: activeClient.firstName || 'Client',
              lastName: activeClient.lastName || '',
              email: finalClientEmail,
              ...activeClient
            })
          });
          
          if (saveResponse.ok) {
            const savedClient = await saveResponse.json();
            clientId = savedClient.id;
            // Update store with saved client ID
            financialStore.setClientData(financialStore.activeClient || 'A', { ...activeClient, id: clientId } as any);
          } else {
            toast({
              title: 'Error',
              description: 'Please save the client first before sending email. Go to Client Information page and click Save.',
              variant: 'destructive'
            });
            setIsSendingEmail(false);
            return;
          }
        } catch (error) {
          console.error('Error saving client:', error);
          toast({
            title: 'Error',
            description: 'Could not save client. Please save the client first before sending email.',
            variant: 'destructive'
          });
          setIsSendingEmail(false);
          return;
        }
      }
      
      if (!clientId) {
        toast({
          title: 'Error',
          description: 'Please select and save a client before sending email. Go to Client Information page to create or load a client.',
          variant: 'destructive'
        });
        setIsSendingEmail(false);
        return;
      }

      if (!user?.email) {
        toast({
          title: 'Error',
          description: 'Account email not found. Please ensure you are logged in with a valid email.',
          variant: 'destructive'
        });
        setIsSendingEmail(false);
        return;
      }

      // Generate PDF first and attach it
      let pdfId = lastGeneratedPdfId;
      if (!pdfId) {
        // Generate new PDF if one doesn't exist
        pdfId = await generatePDF(true);
        if (!pdfId) {
          toast({
            title: 'Warning',
            description: 'PDF generation failed, sending email without attachment',
            variant: 'destructive'
          });
        }
      }

      // Send email via API with PDF attachment
      const response = await fetch('/api/email/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: finalClientEmail,
          clientId: clientId,
          clientName: summary.clientName,
          subject: data.subject,
          message: data.message,
          summaryData: summary,
          pdfId: pdfId || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      toast({
        title: 'Email Sent',
        description: `Report${pdfId ? ' with PDF' : ''} has been sent to ${finalClientEmail} and ${user.email}`
      });
      emailForm.reset();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setIsSendingEmail(false);
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
          text: `Financial planning report for ${summary.clientName}`,
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
    <div className="p-6 space-y-6 bg-background min-h-screen" id="summary-content" ref={summaryContentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Planning Summary</h1>
          <p className="text-muted-foreground">Comprehensive overview and export options for {summary.clientName}</p>
        </div>        <div className="flex gap-2">
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

      {/* Client Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Client Overview</CardTitle>
          <CardDescription className="text-muted-foreground">
            Financial planning report for {summary.clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summary.netWorth)}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
              <p className={`text-2xl font-bold ${summary.monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {formatCurrency(summary.monthlyCashFlow)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground">Tax Savings</p>
              <p className="text-2xl font-bold text-purple-500">{formatCurrency(summary.taxSavings)}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {summary.isRetirementDeficit ? (
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Retirement Status</p>
              <p className={`text-lg font-bold ${summary.isRetirementDeficit ? 'text-destructive' : 'text-emerald-500'}`}>
                {summary.isRetirementDeficit ? 'Deficit' : 'Surplus'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Financial Position Summary */}
        <div className="xl:col-span-2 space-y-6">
          {/* Assets & Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Financial Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Assets</span>
                  <span className="text-lg font-semibold text-green-600">${summary.totalAssets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Liabilities</span>
                  <span className="text-lg font-semibold text-red-600">${summary.totalLiabilities.toLocaleString()}</span>
                </div>
                <hr className="border" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Net Worth</span>
                  <span className="text-xl font-bold text-green-600">${summary.netWorth.toLocaleString()}</span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Assets vs Liabilities</span>
                    <span className="text-muted-foreground">{((summary.totalAssets - summary.totalLiabilities) / summary.totalAssets * 100).toFixed(1)}% equity</span>
                  </div>
                  <Progress value={(summary.totalAssets - summary.totalLiabilities) / summary.totalAssets * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Property Potential */}
          {summary.monthlyIncome > 0 && (
            <ServiceabilitySummary 
              serviceability={calculatePropertyServiceability(
                calculateInvestmentSurplus(
                  summary.monthlyIncome,
                  summary.monthlyExpenses
                )
              )}
              monthlyIncome={summary.monthlyIncome}
            />
          )}

          {/* Cash Flow Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Income</span>
                  <span className="text-lg font-semibold text-green-600">${summary.monthlyIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Expenses</span>
                  <span className="text-lg font-semibold text-red-600">${summary.monthlyExpenses.toLocaleString()}</span>
                </div>
                <hr className="border" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Net Cash Flow</span>
                  <span className={`text-xl font-bold ${summary.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${summary.monthlyCashFlow.toLocaleString()}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Savings Rate</span>
                    <span className="text-gray-600">{(summary.monthlyCashFlow / summary.monthlyIncome * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={summary.monthlyCashFlow / summary.monthlyIncome * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Investment Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Number of Properties</span>
                  <span className="text-lg font-semibold text-foreground">{summary.investmentProperties}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Property Value</span>
                  <span className="text-lg font-semibold text-blue-600">${summary.totalPropertyValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Property Debt</span>
                  <span className="text-lg font-semibold text-red-600">${summary.totalPropertyDebt.toLocaleString()}</span>
                </div>
                <hr className="border" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Property Equity</span>
                  <span className="text-xl font-bold text-green-600">${summary.propertyEquity.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retirement Projection */}
          <Card className={`border-2 ${summary.isRetirementDeficit ? 'border-destructive/20' : 'border-emerald-500/20'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${summary.isRetirementDeficit ? 'text-destructive' : 'text-emerald-500'}`}>
                {summary.isRetirementDeficit ? (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Retirement Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Years to Retirement</span>
                  <span className="text-lg font-semibold text-foreground">{summary.yearsToRetirement} years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Projected Lump Sum</span>
                  <span className="text-lg font-semibold text-blue-600">${summary.projectedRetirementLumpSum.toLocaleString()}</span>
                </div>
                <hr className="border" />
                <div className="text-center">
                  <p className={`text-3xl font-bold ${summary.isRetirementDeficit ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(summary.retirementDeficitSurplus).toLocaleString()}/month
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {summary.isRetirementDeficit ? 'Retirement Deficit' : 'Retirement Surplus'}
                  </p>
                </div>
                
                {summary.isRetirementDeficit && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Action Required:</strong> Consider increasing retirement savings or adjusting retirement timeline to address the projected deficit.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tax Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Tax Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Annual Tax</span>
                  <span className="text-lg font-semibold text-destructive">${summary.currentTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Optimized Annual Tax</span>
                  <span className="text-lg font-semibold text-orange-500">${summary.optimizedTax.toLocaleString()}</span>
                </div>
                <hr className="border" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Potential Savings</span>
                  <span className="text-xl font-bold text-emerald-500">${summary.taxSavings.toLocaleString()}</span>
                </div>
                
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                  <p className="text-sm text-emerald-500">
                    <strong>Optimization Opportunity:</strong> Implementing recommended tax strategies could save you ${summary.taxSavings.toLocaleString()} annually.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Calculations & Formulas */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Detailed Calculations & Formulas
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Complete mathematical breakdown of all financial calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Net Worth Calculation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">1. Net Worth Calculation</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Formula: Net Worth = Total Assets - Total Liabilities</p>
                  <div className="space-y-1 pl-4">
                    <p><strong>Total Assets Breakdown:</strong></p>
                    <p>• Home Value: ${(activeClient?.homeValue || 0).toLocaleString()}</p>
                    <p>• Investment Properties: ${((activeClient?.investment1Value || 0) + (activeClient?.investment2Value || 0) + (activeClient?.investment3Value || 0) + (activeClient?.investment4Value || 0)).toLocaleString()}</p>
                    <p>• Vehicle: ${(activeClient?.vehicleValue || 0).toLocaleString()}</p>
                    <p>• Savings: ${((activeClient?.savingsValue || activeClient?.currentSavings || financialStore.cashSavings || 0)).toLocaleString()}</p>
                    <p>• Superannuation: ${((activeClient?.superFundValue || activeClient?.currentSuper || financialStore.superBalance || 0)).toLocaleString()}</p>
                    <p>• Shares/Investments: ${((activeClient?.sharesTotalValue || activeClient?.currentShares || financialStore.investments || 0)).toLocaleString()}</p>
                    <p className="pt-2"><strong>Total Assets = ${summary.totalAssets.toLocaleString()}</strong></p>
                  </div>
                  <div className="space-y-1 pl-4 pt-2">
                    <p><strong>Total Liabilities Breakdown:</strong></p>
                    <p>• Home Loan: ${(activeClient?.homeBalance || 0).toLocaleString()}</p>
                    <p>• Investment Property Loans: ${((activeClient?.investment1Balance || 0) + (activeClient?.investment2Balance || 0) + (activeClient?.investment3Balance || 0) + (activeClient?.investment4Balance || 0)).toLocaleString()}</p>
                    <p>• Credit Card: ${(activeClient?.creditCardBalance || 0).toLocaleString()}</p>
                    <p>• Personal Loans: ${(activeClient?.personalLoanBalance || 0).toLocaleString()}</p>
                    <p>• HECS/HELP Debt: ${((activeClient?.hecsBalance || activeClient?.helpDebt || 0)).toLocaleString()}</p>
                    <p className="pt-2"><strong>Total Liabilities = ${summary.totalLiabilities.toLocaleString()}</strong></p>
                  </div>
                  <div className="pt-2 border-t">
                    <p><strong>Net Worth = ${summary.totalAssets.toLocaleString()} - ${summary.totalLiabilities.toLocaleString()} = ${summary.netWorth.toLocaleString()}</strong></p>
                  </div>
                </div>
              </div>

              {/* Cash Flow Calculation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">2. Monthly Cash Flow Calculation</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Formula: Monthly Cash Flow = Monthly Income - Monthly Expenses</p>
                  <div className="space-y-1 pl-4">
                    <p><strong>Annual Income Breakdown:</strong></p>
                    <p>• Employment Income: ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0)).toLocaleString()}</p>
                    <p>• Rental Income: ${((financialStore.rentalIncome || activeClient?.rentalIncome || 0)).toLocaleString()}</p>
                    <p>• Investment Income: ${((financialStore.investmentIncome || activeClient?.dividends || 0)).toLocaleString()}</p>
                    <p>• Other Income: ${((financialStore.otherIncome || activeClient?.otherIncome || 0)).toLocaleString()}</p>
                    <p className="pt-2"><strong>Total Annual Income = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0)).toLocaleString()}</strong></p>
                    <p><strong>Monthly Income = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0)).toLocaleString()} ÷ 12 = ${summary.monthlyIncome.toLocaleString()}</strong></p>
                  </div>
                  <div className="space-y-1 pl-4 pt-2">
                    <p><strong>Annual Expenses Breakdown:</strong></p>
                    <p>• Work-Related Expenses: ${((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0)).toLocaleString()}</p>
                    <p>• Investment Expenses: ${((financialStore.investmentExpenses || activeClient?.investmentExpenses || 0)).toLocaleString()}</p>
                    <p>• Rental Expenses: ${((financialStore.rentalExpenses || activeClient?.rentalExpenses || 0)).toLocaleString()}</p>
                    <p>• Vehicle Expenses: ${((activeClient?.vehicleExpenses || 0)).toLocaleString()}</p>
                    <p>• Home Office Expenses: ${((activeClient?.homeOfficeExpenses || 0)).toLocaleString()}</p>
                    <p className="pt-2"><strong>Total Annual Expenses = ${((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0)).toLocaleString()}</strong></p>
                    <p><strong>Monthly Expenses = ${((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0)).toLocaleString()} ÷ 12 = ${summary.monthlyExpenses.toLocaleString()}</strong></p>
                  </div>
                  <div className="pt-2 border-t">
                    <p><strong>Monthly Cash Flow = ${summary.monthlyIncome.toLocaleString()} - ${summary.monthlyExpenses.toLocaleString()} = ${summary.monthlyCashFlow.toLocaleString()}</strong></p>
                    <p className="pt-1">Savings Rate = (${summary.monthlyCashFlow.toLocaleString()} ÷ ${summary.monthlyIncome.toLocaleString()}) × 100 = {summary.monthlyIncome > 0 ? ((summary.monthlyCashFlow / summary.monthlyIncome) * 100).toFixed(2) : 0}%</p>
                  </div>
                </div>
              </div>

              {/* Retirement Projection Calculation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">3. Retirement Projection Calculation</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Formula: FV = PV × (1 + r)^t</p>
                  <p className="text-xs text-muted-foreground">Where: FV = Future Value, PV = Present Value, r = growth rate, t = years</p>
                  <div className="space-y-1 pl-4">
                    <p><strong>Current Age:</strong> {activeClient?.currentAge || 35} years</p>
                    <p><strong>Retirement Age:</strong> {activeClient?.retirementAge || 65} years</p>
                    <p><strong>Years to Retirement:</strong> {summary.yearsToRetirement} years</p>
                    <p className="pt-2"><strong>Current Superannuation Balance:</strong> ${((activeClient?.superFundValue || activeClient?.currentSuper || financialStore.superBalance || 0)).toLocaleString()}</p>
                    <p><strong>Assumed Growth Rate:</strong> 7% per annum (compounded annually)</p>
                    <p className="pt-2"><strong>Projected Retirement Lump Sum Calculation:</strong></p>
                    <p>Projected Super = ${((activeClient?.superFundValue || activeClient?.currentSuper || financialStore.superBalance || 0)).toLocaleString()} × (1 + 0.07)^{summary.yearsToRetirement}</p>
                    <p>Projected Super = ${((activeClient?.superFundValue || activeClient?.currentSuper || financialStore.superBalance || 0)).toLocaleString()} × {Math.pow(1.07, summary.yearsToRetirement).toFixed(4)}</p>
                    <p className="pt-1"><strong>Projected Retirement Lump Sum = ${summary.projectedRetirementLumpSum.toLocaleString()}</strong></p>
                    <p className="pt-2"><strong>Retirement Income Requirement:</strong></p>
                    <p>Required Income = 70% of Current Monthly Income = 0.70 × ${summary.monthlyIncome.toLocaleString()} = ${(summary.monthlyIncome * 0.7).toLocaleString()}/month</p>
                    <p>Required Annual Income = ${(summary.monthlyIncome * 0.7 * 12).toLocaleString()}</p>
                    <p className="pt-1"><strong>Retirement Deficit/Surplus:</strong></p>
                    <p>Available Income = ${summary.retirementDeficitSurplus.toLocaleString()}/month</p>
                    <p className={summary.isRetirementDeficit ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      Status: {summary.isRetirementDeficit ? 'DEFICIT' : 'SURPLUS'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Calculation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">4. Tax Calculation</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Formula: Taxable Income = Gross Income - Deductions</p>
                  <div className="space-y-1 pl-4">
                    <p><strong>Taxable Income Calculation:</strong></p>
                    <p>Gross Annual Income = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0)).toLocaleString()}</p>
                    <p>Total Deductions = ${((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0)).toLocaleString()}</p>
                    <p className="pt-1"><strong>Taxable Income = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0) - ((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0))).toLocaleString()}</strong></p>
                    <p className="pt-2"><strong>Current Tax Calculation (Simplified):</strong></p>
                    <p>Tax Rate Assumption: 30% (marginal rate)</p>
                    <p>Current Tax = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0) - ((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0))).toLocaleString()} × 0.30 = ${summary.currentTax.toLocaleString()}</p>
                    <p className="pt-2"><strong>Optimized Tax Calculation:</strong></p>
                    <p>Optimized Tax Rate: 25% (with strategies applied)</p>
                    <p>Optimized Tax = ${((financialStore.grossIncome || financialStore.employmentIncome || activeClient?.annualIncome || activeClient?.grossSalary || 0) + (financialStore.rentalIncome || activeClient?.rentalIncome || 0) + (financialStore.investmentIncome || activeClient?.dividends || 0) + (financialStore.otherIncome || activeClient?.otherIncome || 0) - ((financialStore.workRelatedExpenses || activeClient?.workRelatedExpenses || 0) + (financialStore.investmentExpenses || activeClient?.investmentExpenses || 0) + (financialStore.rentalExpenses || activeClient?.rentalExpenses || 0) + (activeClient?.vehicleExpenses || 0) + (activeClient?.homeOfficeExpenses || 0))).toLocaleString()} × 0.25 = ${summary.optimizedTax.toLocaleString()}</p>
                    <p className="pt-2 border-t"><strong>Potential Tax Savings = ${summary.currentTax.toLocaleString()} - ${summary.optimizedTax.toLocaleString()} = ${summary.taxSavings.toLocaleString()}</strong></p>
                  </div>
                </div>
              </div>

              {/* Property Serviceability Calculation */}
              {summary.monthlyIncome > 0 && (() => {
                const serviceability = calculatePropertyServiceability(
                  calculateInvestmentSurplus(summary.monthlyIncome, summary.monthlyExpenses)
                );
                return (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">5. Property Serviceability Calculation</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                      <p className="font-medium">Formula: Max Borrowing = PMT × [(1+r)^n - 1] / [r(1+r)^n]</p>
                      <p className="text-xs text-muted-foreground">Where: PMT = monthly payment capacity, r = monthly interest rate, n = number of payments</p>
                      <div className="space-y-1 pl-4">
                        <p><strong>Available Surplus Calculation:</strong></p>
                        <p>Monthly Surplus = ${summary.monthlyIncome.toLocaleString()} - ${summary.monthlyExpenses.toLocaleString()} = ${summary.monthlyCashFlow.toLocaleString()}</p>
                        <p>Retention Threshold (70% of income) = 0.70 × ${summary.monthlyIncome.toLocaleString()} = ${(summary.monthlyIncome * 0.7).toLocaleString()}</p>
                        <p>Available Surplus = ${(summary.monthlyIncome * 0.7).toLocaleString()} - ${(summary.monthlyIncome * 0.7).toLocaleString()} = ${serviceability.surplusIncome.toLocaleString()}</p>
                        <p className="pt-2"><strong>Maximum Borrowing Capacity:</strong></p>
                        <p>Assumed Interest Rate: 6% per annum (0.5% monthly)</p>
                        <p>Loan Term: 30 years (360 months)</p>
                        <p>Monthly Payment Capacity: ${serviceability.maxMonthlyPayment.toLocaleString()}</p>
                        <p className="pt-1">Max Borrowing = ${serviceability.maxMonthlyPayment.toLocaleString()} × [(1.005)^360 - 1] / [0.005 × (1.005)^360]</p>
                        <p>Max Borrowing = ${serviceability.maxMonthlyPayment.toLocaleString()} × {((Math.pow(1.005, 360) - 1) / (0.005 * Math.pow(1.005, 360))).toFixed(2)}</p>
                        <p className="pt-2"><strong>Maximum Property Value:</strong></p>
                        <p>Loan-to-Value Ratio (LVR): 80%</p>
                        <p>Max Property Value = Max Borrowing ÷ 0.80</p>
                        <p className="pt-1"><strong>Maximum Property Value = ${serviceability.maxPropertyValue.toLocaleString()}</strong></p>
                        <p className="pt-2"><strong>Expected Rental Income:</strong></p>
                        <p>Rental Yield: 4% per annum</p>
                        <p>Annual Rental Income = ${serviceability.maxPropertyValue.toLocaleString()} × 0.04 = ${(serviceability.maxPropertyValue * 0.04).toLocaleString()}</p>
                        <p>Monthly Rental Income = ${serviceability.monthlyRentalIncome.toLocaleString()}</p>
                        <p className="pt-2"><strong>Property Expenses:</strong></p>
                        <p>Annual Expenses: 2% of property value</p>
                        <p>Monthly Expenses = (${serviceability.maxPropertyValue.toLocaleString()} × 0.02) ÷ 12 = ${serviceability.totalMonthlyExpenses.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Loan Payment Formula */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">6. Loan Payment Formula</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Standard Amortization Formula:</p>
                  <p className="font-mono text-xs">PMT = P × [r(1+r)^n] / [(1+r)^n - 1]</p>
                  <div className="space-y-1 pl-4 pt-2">
                    <p>Where:</p>
                    <p>• PMT = Monthly payment</p>
                    <p>• P = Principal loan amount</p>
                    <p>• r = Monthly interest rate (annual rate ÷ 12)</p>
                    <p>• n = Total number of payments (years × 12)</p>
                    <p className="pt-2 text-xs text-muted-foreground">This formula calculates the fixed monthly payment required to fully amortize a loan over its term, including both principal and interest components.</p>
                  </div>
                </div>
              </div>

              {/* Negative Gearing Formula */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">7. Negative Gearing Calculation</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">Formula: Tax Benefit = Net Loss × Marginal Tax Rate</p>
                  <div className="space-y-1 pl-4">
                    <p><strong>Net Loss Calculation:</strong></p>
                    <p>Net Loss = Total Property Expenses - Total Rental Income</p>
                    <p className="pt-1">Where Total Expenses includes:</p>
                    <p>• Mortgage interest payments</p>
                    <p>• Repairs and maintenance</p>
                    <p>• Property management fees</p>
                    <p>• Insurance and council rates</p>
                    <p>• Depreciation (2.5% of building value)</p>
                    <p className="pt-2"><strong>Tax Benefit:</strong></p>
                    <p>If Net Loss {'>'} 0, the loss can be deducted from taxable income</p>
                    <p>Tax Benefit = Net Loss × Marginal Tax Rate</p>
                    <p className="text-xs text-muted-foreground pt-1">Note: This reduces taxable income, resulting in tax savings at your marginal rate.</p>
                  </div>
                </div>
              </div>

              {/* Assumptions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">8. Calculation Assumptions</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="space-y-1 pl-4">
                    <p><strong>Retirement Projections:</strong></p>
                    <p>• Superannuation growth rate: 7% per annum (compounded)</p>
                    <p>• Required retirement income: 70% of current income</p>
                    <p>• Safe withdrawal rate: 4% of retirement lump sum</p>
                    <p className="pt-2"><strong>Property Serviceability:</strong></p>
                    <p>• Interest rate: 6% per annum</p>
                    <p>• Loan term: 30 years</p>
                    <p>• Maximum LVR: 80%</p>
                    <p>• Expected rental yield: 4% per annum</p>
                    <p>• Property expenses: 2% of property value annually</p>
                    <p>• Rental income serviceability factor: 75%</p>
                    <p className="pt-2"><strong>Tax Calculations:</strong></p>
                    <p>• Current tax rate assumption: 30% (simplified)</p>
                    <p>• Optimized tax rate: 25% (with strategies)</p>
                    <p>• Medicare Levy: 2% (if applicable)</p>
                    <p className="pt-2 text-xs text-muted-foreground">Note: These assumptions are estimates. Actual rates and returns may vary. Consult with a qualified financial advisor for personalized advice.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations & Actions */}
        <div className="space-y-6">
          {/* Key Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Key Recommendations</CardTitle>
              <CardDescription className="text-muted-foreground">
                Actions to improve your financial position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Report
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Send this report to your email or share with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(sendEmail)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            {...field}
                            value={field.value || (financialStore.activeClient ? (financialStore[`client${financialStore.activeClient}` as keyof typeof financialStore] as any)?.email : '') || ''}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Email will be sent to both the client email and your account email ({user?.email || 'N/A'})
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isSendingEmail ? 'Sending...' : 'Send Report'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Report Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Report Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => generatePDF(false)}
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

          {/* Report Info */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium mb-1">Perpetual Wealth Partners</p>
                <p>Professional Financial Planning</p>
                <p className="mt-2">Report generated on {new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}