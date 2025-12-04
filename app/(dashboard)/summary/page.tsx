/**
 * FinCalc Pro - Summary & Export Page
 * 
 * Comprehensive summary with PDF generation and email functionality
 */

'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Download, Mail, Printer, Share2, TrendingUp, TrendingDown, DollarSign, Calculator, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const summaryContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const financialStore = useFinancialStore();

  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipientEmail: '',
      subject: 'Your Financial Planning Report - Perpetual Wealth Partners',
      message: 'Please find attached your comprehensive financial planning report. If you have any questions, please don\'t hesitate to contact us.'
    }
  });

  // Mock data - in real app this would come from state/API
  const summary: FinancialSummary = {
    clientName: 'John & Jane Smith',
    totalAssets: 1250000,
    totalLiabilities: 450000,
    netWorth: 800000,
    monthlyIncome: 12000,
    monthlyExpenses: 8500,
    monthlyCashFlow: 3500,
    projectedRetirementLumpSum: 2800000,
    retirementDeficitSurplus: -850,
    isRetirementDeficit: true,
    yearsToRetirement: 25,
    currentTax: 28500,
    optimizedTax: 24200,
    taxSavings: 4300,
    investmentProperties: 2,
    totalPropertyValue: 1400000,
    totalPropertyDebt: 680000,
    propertyEquity: 720000,
    recommendations: [
      'Increase superannuation contributions through salary sacrifice',
      'Consider additional investment property for negative gearing benefits',
      'Maximize work-related tax deductions',
      'Review and optimize investment portfolio allocation',
      'Consider private health insurance to avoid Medicare Levy Surcharge'
    ]
  };

  const generatePDF = async (attachToEmail = false): Promise<string | null> => {
    setIsGeneratingPDF(true);
    
    try {
      // Get the summary content element
      const element = summaryContentRef.current || document.getElementById('summary-content');
      if (!element) {
        throw new Error('Summary content not found');
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
      if (!activeClient.id) {
        toast({
          title: 'Error',
          description: 'Please save the client first before generating PDF. Go to Client Information page and click Save.',
          variant: 'destructive'
        });
        setIsGeneratingPDF(false);
        return null;
      }

      // Capture the content as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const fileName = `Financial_Report_${summary.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (attachToEmail) {
        // Convert to blob for upload
        const pdfBlob = pdf.output('blob');
        
        // Save to server
        const formData = new FormData();
        formData.append('file', pdfBlob, fileName);
        formData.append('clientId', activeClient.id);
        formData.append('fileName', fileName);

        const response = await fetch('/api/pdf-exports', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to save PDF to server');
        }

        const savedPdf = await response.json();
        setLastGeneratedPdfId(savedPdf.id);
        
        toast({
          title: 'PDF Generated',
          description: 'PDF has been generated and saved'
        });

        return savedPdf.id;
      } else {
        // Download PDF
        pdf.save(fileName);
        
        // Also save to server
        const pdfBlob = pdf.output('blob');
        const formData = new FormData();
        formData.append('file', pdfBlob, fileName);
        formData.append('clientId', activeClient.id);
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
        }

        toast({
          title: 'PDF Generated',
          description: 'Your financial planning report has been generated and downloaded'
        });

        return null;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive'
      });
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

      if (!activeClient?.id) {
        toast({
          title: 'Error',
          description: 'Please save the client first before sending email. Go to Client Information page and click Save.',
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
          clientId: activeClient?.id,
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

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen" id="summary-content" ref={summaryContentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Planning Summary</h1>
          <p className="text-muted-foreground">Comprehensive overview and export options</p>
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
            onClick={generatePDF}
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
                onClick={generatePDF}
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