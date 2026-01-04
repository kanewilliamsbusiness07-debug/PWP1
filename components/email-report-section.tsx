'use client';

import React, { useState, useCallback } from 'react';
import { Mail, Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface EmailReportSectionProps {
  clientEmail: string;
  clientBusinessEmail?: string;
  clientName: string;
  summary: {
    netWorth: number;
    monthlyCashFlow: number;
    taxSavings: number;
    isRetirementDeficit: boolean;
    retirementDeficitSurplus: number;
    projectedRetirementLumpSum: number;
    projectedRetirementMonthlyCashFlow: number;
  };
  onGeneratePdf: () => Promise<string | null>;
  lastGeneratedPdfId: string | null;
  clientId?: string;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export function EmailReportSection({
  clientEmail,
  clientBusinessEmail,
  clientName,
  summary,
  onGeneratePdf,
  lastGeneratedPdfId,
  clientId,
}: EmailReportSectionProps) {
  const [comments, setComments] = useState('');
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [sendToPersonal, setSendToPersonal] = useState(true);
  const [sendToBusiness, setSendToBusiness] = useState(false);
  const [sentToRecipients, setSentToRecipients] = useState<string[]>([]);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmail = useCallback(async () => {
    // Validation - check if at least one recipient is selected
    const selectedRecipients = [];
    if (sendToPersonal && clientEmail) {
      selectedRecipients.push({ email: clientEmail, type: 'personal' });
    }
    if (sendToBusiness && clientBusinessEmail) {
      selectedRecipients.push({ email: clientBusinessEmail, type: 'business' });
    }

    if (selectedRecipients.length === 0) {
      setSendStatus('error');
      setErrorMessage('Please select at least one recipient email address.');
      return;
    }

    // Validate email formats
    for (const recipient of selectedRecipients) {
      if (!validateEmail(recipient.email)) {
        setSendStatus('error');
        setErrorMessage(`Invalid email address format: ${recipient.email}`);
        return;
      }
    }

    setSendStatus('sending');
    setErrorMessage('');

    try {
      // Step 1: Generate PDF if not already generated
      let pdfId = lastGeneratedPdfId;
      if (!pdfId) {
        toast({
          title: 'Generating PDF',
          description: 'Creating the report PDF before sending...',
        });
        pdfId = await onGeneratePdf();
      }

      // Step 2: Prepare report date
      const reportDate = new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Step 3: Send email with PDF attachment
      const emailData = {
        recipients: selectedRecipients,
        clientId,
        clientName,
        subject: `Your Financial Planning Report - ${reportDate}`,
        message: comments.trim() || undefined,
        summaryData: {
          clientName,
          netWorth: summary.netWorth,
          monthlyCashFlow: summary.monthlyCashFlow,
          taxSavings: summary.taxSavings,
          isRetirementDeficit: summary.isRetirementDeficit,
          retirementDeficitSurplus: summary.retirementDeficitSurplus,
          projectedRetirementLumpSum: summary.projectedRetirementLumpSum,
          projectedRetirementMonthlyCashFlow: summary.projectedRetirementMonthlyCashFlow,
        },
        pdfId,
        reportDate,
      };

      const response = await fetch('/api/email/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Success
      setSendStatus('success');
      setComments(''); // Clear comments after successful send
      setSentToRecipients(selectedRecipients.map(r => r.email));

      const recipientEmails = selectedRecipients.map(r => r.email).join(', ');
      toast({
        title: 'Email Sent Successfully!',
        description: `The report has been sent to ${recipientEmails}`,
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSendStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send email. Please try again.'
      );
    }
  }, [
    clientEmail,
    clientBusinessEmail,
    clientName,
    comments,
    summary,
    lastGeneratedPdfId,
    clientId,
    onGeneratePdf,
    sendToPersonal,
    sendToBusiness,
    toast,
  ]);

  return (
    <Card className="border-2 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Mail className="h-5 w-5 mr-2 text-blue-500" />
          Email Report to Client
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Send the financial planning report directly to your client&apos;s email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Client Email Display */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Client Email</Label>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {clientEmail || 'No email on file'}
            </span>
          </div>
          {!clientEmail && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please add client email in Client Information to enable sending.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Recipient Selection */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">Send Report To</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <input
                type="checkbox"
                checked={sendToPersonal}
                onChange={(e) => setSendToPersonal(e.target.checked)}
                disabled={!clientEmail || sendStatus === 'sending'}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">Client Personal Email</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{clientEmail || 'No email on file'}</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <input
                type="checkbox"
                checked={sendToBusiness}
                onChange={(e) => setSendToBusiness(e.target.checked)}
                disabled={!clientBusinessEmail || sendStatus === 'sending'}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">Client Business Email</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{clientBusinessEmail || 'No business email on file'}</p>
              </div>
            </label>
          </div>

          {(!clientEmail && !clientBusinessEmail) && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please add at least one email address in Client Information to enable sending.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Optional Comments */}
        <div className="space-y-2">
          <Label htmlFor="email-comments" className="text-muted-foreground">
            Optional Comments
            <span className="ml-2 text-xs font-normal text-muted-foreground/70">
              (Optional)
            </span>
          </Label>
          <Textarea
            id="email-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any additional notes or comments to include in the email (e.g., 'Please review and let me know if you have any questions')..."
            rows={4}
            maxLength={500}
            disabled={!clientEmail || sendStatus === 'sending'}
            className="resize-y"
          />
          <div className="text-right text-xs text-muted-foreground">
            {comments.length}/500 characters
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendEmail}
          disabled={(!sendToPersonal || !clientEmail) && (!sendToBusiness || !clientBusinessEmail) || sendStatus === 'sending'}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
        >
          {sendStatus === 'sending' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Report...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Report
            </>
          )}
        </Button>

        {/* Status Messages */}
        {sendStatus === 'success' && (
          <Alert className="border-emerald-500/50 bg-emerald-500/10">
            <Check className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-emerald-500">
              Email sent successfully!
            </AlertTitle>
            <AlertDescription className="text-emerald-600 dark:text-emerald-400">
              The report has been sent to {sentToRecipients.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {sendStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to send email</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Info about PDF attachment */}
        {lastGeneratedPdfId && (
          <p className="text-sm text-muted-foreground">
            📎 The previously generated PDF report will be attached to this email.
          </p>
        )}
        {!lastGeneratedPdfId && clientEmail && (
          <p className="text-sm text-muted-foreground">
            📄 A new PDF report will be generated and attached to the email when you click Send.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default EmailReportSection;
