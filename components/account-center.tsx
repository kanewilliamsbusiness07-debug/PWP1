/**
 * FinCalc Pro - Account Center Drawer Component
 * 
 * Mini-CRM functionality with client management, scheduling, and quick actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Mail, FileText, Trash2, Search, Plus, Eye, Download, Clock, X, Edit, CheckCircle, XCircle, Send, FileDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  mobile?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  clientId: string;
  client: Client;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string | null;
}

interface PdfExport {
  id: string;
  clientId: string;
  client?: Client;
  fileName: string;
  filePath: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountCenterDrawer({ open, onOpenChange }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pdfExports, setPdfExports] = useState<PdfExport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfExport | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  
  // Appointment form state
  const [appointmentClientId, setAppointmentClientId] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [appointmentStartTime, setAppointmentStartTime] = useState('09:00');
  const [appointmentEndTime, setAppointmentEndTime] = useState('10:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null); // Track which client is generating PDF
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null); // Track which client is sending email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedClientForEmail, setSelectedClientForEmail] = useState<Client | null>(null);
  const [emailSubject, setEmailSubject] = useState('Your Financial Planning Report - Perpetual Wealth Partners');
  const [emailMessage, setEmailMessage] = useState('Please find attached your comprehensive financial planning report. If you have any questions, please don\'t hesitate to contact us.');
  
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Account Center: Starting to load data...');
      
      // Load clients
      try {
        const clientsRes = await fetch('/api/clients?limit=50', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Account Center: Clients API response status:', clientsRes.status);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          console.log('Account Center: Raw clients data:', clientsData);
          
          // Handle both response formats: { clients: [...] } or [...]
          let clientsList: Client[] = [];
          if (Array.isArray(clientsData)) {
            clientsList = clientsData;
          } else if (clientsData && typeof clientsData === 'object' && 'clients' in clientsData) {
            clientsList = Array.isArray(clientsData.clients) ? clientsData.clients : [];
          }
          
          // Validate client data structure - ensure all required fields exist
          clientsList = clientsList.filter((c: any) => {
            if (!c || !c.id || !c.firstName || !c.lastName) {
              console.warn('Account Center: Invalid client data:', c);
              return false;
            }
            // Ensure updatedAt exists, default to createdAt if missing
            if (!c.updatedAt && c.createdAt) {
              c.updatedAt = c.createdAt;
            }
            return true;
          });
          
          console.log('Account Center: Parsed and validated clients list:', clientsList);
          console.log('Account Center: Number of clients:', clientsList.length);
          
          setClients(clientsList);
          
          if (clientsList.length === 0) {
            console.warn('Account Center: No valid clients found in response');
          } else {
            console.log('Account Center: Successfully loaded clients:', clientsList.map((c: Client) => `${c.firstName} ${c.lastName}`));
          }
        } else {
          const errorText = await clientsRes.text();
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Unknown error' };
          }
          console.error('Error loading clients:', clientsRes.status, errorData);
          setClients([]);
          if (clientsRes.status === 401) {
            toast({
              title: 'Authentication Error',
              description: 'Please log in again to view clients',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Error Loading Clients',
              description: (errorData as any).error || `Failed to load clients (${clientsRes.status})`,
              variant: 'destructive'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch clients. Please try again.',
          variant: 'destructive'
        });
      }

      // Load appointments
      try {
        const appointmentsRes = await fetch('/api/appointments?limit=50', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Account Center: Appointments API response status:', appointmentsRes.status);

        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          console.log('Account Center: Raw appointments data:', appointmentsData);
          
          // Handle both response formats: { appointments: [...] } or [...]
          let appointmentsList: Appointment[] = [];
          if (Array.isArray(appointmentsData)) {
            appointmentsList = appointmentsData;
          } else if (appointmentsData && typeof appointmentsData === 'object' && 'appointments' in appointmentsData) {
            appointmentsList = Array.isArray(appointmentsData.appointments) ? appointmentsData.appointments : [];
          }
          
          // Validate appointment data structure
          appointmentsList = appointmentsList.filter((a: any) => 
            a && a.id && a.title && a.clientId && a.client && a.startDateTime && a.endDateTime
          );
          
          console.log('Account Center: Parsed and validated appointments list:', appointmentsList);
          console.log('Account Center: Number of appointments:', appointmentsList.length);
          
          setAppointments(appointmentsList);
        } else {
          const errorData = await appointmentsRes.json().catch(() => ({}));
          console.error('Error loading appointments:', appointmentsRes.status, errorData);
          setAppointments([]);
          if (appointmentsRes.status !== 401) {
            toast({
              title: 'Error Loading Appointments',
              description: errorData.error || `Failed to load appointments (${appointmentsRes.status})`,
              variant: 'destructive'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments([]);
        toast({
          title: 'Error',
          description: 'Failed to fetch appointments. Please try again.',
          variant: 'destructive'
        });
      }

      // Load PDF exports
      try {
        const exportsRes = await fetch('/api/pdf-exports?limit=50', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Account Center: PDF exports API response status:', exportsRes.status);

        if (exportsRes.ok) {
          const exportsData = await exportsRes.json();
          console.log('Account Center: Raw PDF exports data:', exportsData);
          
          // Handle both response formats: { exports: [...] } or [...]
          let exportsList: PdfExport[] = [];
          if (Array.isArray(exportsData)) {
            exportsList = exportsData;
          } else if (exportsData && typeof exportsData === 'object' && 'exports' in exportsData) {
            exportsList = Array.isArray(exportsData.exports) ? exportsData.exports : [];
          }
          
          // Validate PDF export data structure
          exportsList = exportsList.filter((e: any) => e && e.id && e.fileName);
          
          console.log('Account Center: Parsed and validated PDF exports list:', exportsList);
          console.log('Account Center: Number of PDF exports:', exportsList.length);
          
          setPdfExports(exportsList);
        } else {
          const errorData = await exportsRes.json().catch(() => ({}));
          console.error('Error loading PDF exports:', exportsRes.status, errorData);
          setPdfExports([]);
          if (exportsRes.status !== 401) {
            toast({
              title: 'Error Loading PDFs',
              description: errorData.error || `Failed to load PDF exports (${exportsRes.status})`,
              variant: 'destructive'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching PDF exports:', error);
        setPdfExports([]);
      }
      
      console.log('Account Center: Data loading completed');
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load account center data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      console.log('Account Center: Drawer opened, loading data...');
      // Always reload data when drawer opens
      loadData();
    } else {
      console.log('Account Center: Drawer closed');
    }
  }, [open, loadData]);

  // Listen for client save/update events to refresh the list
  useEffect(() => {
    const handleClientSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received client-saved event', customEvent.detail);
      // Always refresh if drawer is open, with a small delay to ensure DB commit
      // Also refresh when closed so data is ready when drawer opens
      console.log('Account Center: Refreshing client list...');
      setTimeout(() => {
        loadData();
      }, 500); // Small delay to ensure database transaction is committed
    };

    const handleClientDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received client-deleted event', customEvent.detail);
      if (open) {
        console.log('Account Center: Refreshing client list after deletion...');
        setTimeout(() => {
          loadData();
        }, 500);
      }
    };

    const handlePdfGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received pdf-generated event', customEvent.detail);
      // Always refresh so data is ready when drawer opens
      console.log('Account Center: Refreshing PDF exports list...');
      setTimeout(() => {
        loadData();
      }, 500);
    };

    const handleAppointmentSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received appointment-saved event', customEvent.detail);
      // Always refresh so data is ready when drawer opens
      console.log('Account Center: Refreshing appointments list...');
      setTimeout(() => {
        loadData();
      }, 500);
    };

    // Listen for custom event when clients are saved
    // Set up listeners regardless of open state so they're ready when drawer opens
    console.log('Account Center: Setting up event listeners');
    window.addEventListener('client-saved', handleClientSaved);
    window.addEventListener('client-deleted', handleClientDeleted);
    window.addEventListener('pdf-generated', handlePdfGenerated);
    window.addEventListener('appointment-saved', handleAppointmentSaved);

    return () => {
      console.log('Account Center: Cleaning up event listeners');
      window.removeEventListener('client-saved', handleClientSaved);
      window.removeEventListener('client-deleted', handleClientDeleted);
      window.removeEventListener('pdf-generated', handlePdfGenerated);
      window.removeEventListener('appointment-saved', handleAppointmentSaved);
    };
  }, [open, loadData]);

  const handleGeneratePDF = async (client: Client) => {
    setIsGeneratingPDF(client.id);
    try {
      // Navigate to summary page with client loaded
      window.location.href = `/summary?load=${client.id}`;
      
      toast({
        title: 'Opening Summary Page',
        description: `Loading ${client.firstName} ${client.lastName}'s summary. Click "Download PDF" on the summary page to generate the report.`
      });
    } catch (error) {
      console.error('Error navigating to summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to open summary page',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const handleOpenEmailDialog = (client: Client) => {
    if (!client.email) {
      toast({
        title: 'No email address',
        description: 'This client does not have an email address on file',
        variant: 'destructive'
      });
      return;
    }
    setSelectedClientForEmail(client);
    setEmailSubject('Your Financial Planning Report - Perpetual Wealth Partners');
    setEmailMessage('Please find attached your comprehensive financial planning report. If you have any questions, please don\'t hesitate to contact us.');
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedClientForEmail) return;
    
    setIsSendingEmail(selectedClientForEmail.id);
    
    try {
      // Find the most recent PDF for this client
      const clientPdf = pdfExports
        .filter(pdf => pdf.clientId === selectedClientForEmail.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      // Send email via API with optional PDF attachment
      const response = await fetch('/api/email/send-summary', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: selectedClientForEmail.email,
          clientId: selectedClientForEmail.id,
          clientName: `${selectedClientForEmail.firstName} ${selectedClientForEmail.lastName}`,
          subject: emailSubject,
          message: emailMessage,
          summaryData: {
            clientName: `${selectedClientForEmail.firstName} ${selectedClientForEmail.lastName}`
          },
          pdfId: clientPdf?.id || undefined
        })
      });

      if (response.ok) {
        toast({
          title: 'Email sent',
          description: `Email${clientPdf ? ' with PDF attachment' : ''} sent to ${selectedClientForEmail.firstName} ${selectedClientForEmail.lastName}`
        });
        setEmailDialogOpen(false);
        setSelectedClientForEmail(null);
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to send email' }));
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleEmailClient = async (client: Client) => {
    handleOpenEmailDialog(client);
  };

  const handleScheduleAppointment = (clientId?: string) => {
    if (clients.length === 0) {
      toast({
        title: 'No Clients Available',
        description: 'Please save at least one client before scheduling an appointment. Go to Client Information page to create a client.',
        variant: 'destructive'
      });
      return;
    }
    setIsEditingAppointment(false);
    setSelectedAppointment(null);
    setAppointmentClientId(clientId || '');
    setAppointmentTitle('');
    setAppointmentDescription('');
    setAppointmentDate(undefined);
    setAppointmentStartTime('09:00');
    setAppointmentEndTime('10:00');
    setAppointmentNotes('');
    setAppointmentDialogOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setIsEditingAppointment(true);
    setSelectedAppointment(appointment);
    setAppointmentClientId(appointment.clientId);
    setAppointmentTitle(appointment.title);
    setAppointmentDescription(appointment.description || '');
    setAppointmentDate(new Date(appointment.startDateTime));
    setAppointmentStartTime(format(new Date(appointment.startDateTime), 'HH:mm'));
    setAppointmentEndTime(format(new Date(appointment.endDateTime), 'HH:mm'));
    setAppointmentNotes(appointment.notes || '');
    setAppointmentDialogOpen(true);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentDetailsOpen(true);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!confirm(`Are you sure you want to cancel this appointment with ${appointment.client.firstName} ${appointment.client.lastName}?`)) {
      return;
    }

    try {
        const response = await fetch(`/api/appointments/${appointment.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' })
        });

      if (response.ok) {
        await loadData();
        toast({
          title: 'Appointment cancelled',
          description: `Appointment with ${appointment.client.firstName} ${appointment.client.lastName} has been cancelled`
        });
        if (appointmentDetailsOpen) {
          setAppointmentDetailsOpen(false);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel appointment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel appointment',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (!confirm(`Are you sure you want to permanently delete this appointment with ${appointment.client.firstName} ${appointment.client.lastName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadData();
        toast({
          title: 'Appointment deleted',
          description: `Appointment with ${appointment.client.firstName} ${appointment.client.lastName} has been deleted`
        });
        if (appointmentDetailsOpen) {
          setAppointmentDetailsOpen(false);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete appointment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete appointment',
        variant: 'destructive'
      });
    }
  };

  const handleCompleteAppointment = async (appointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });

      if (response.ok) {
        await loadData();
        toast({
          title: 'Appointment completed',
          description: `Appointment with ${appointment.client.firstName} ${appointment.client.lastName} has been marked as completed`
        });
        if (appointmentDetailsOpen) {
          setAppointmentDetailsOpen(false);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete appointment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete appointment',
        variant: 'destructive'
      });
    }
  };

  const handleSaveAppointment = async () => {
    if (!appointmentClientId || !appointmentTitle || !appointmentDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingAppointment(true);
    try {
      // Combine date and time
      const [startHours, startMinutes] = appointmentStartTime.split(':').map(Number);
      const [endHours, endMinutes] = appointmentEndTime.split(':').map(Number);
      
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      if (endDateTime <= startDateTime) {
        toast({
          title: 'Validation Error',
          description: 'End time must be after start time',
          variant: 'destructive'
        });
        setIsSavingAppointment(false);
        return;
      }

      const url = isEditingAppointment && selectedAppointment 
        ? `/api/appointments/${selectedAppointment.id}`
        : '/api/appointments';
      
      const method = isEditingAppointment ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: appointmentClientId,
          title: appointmentTitle,
          description: appointmentDescription,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          notes: appointmentNotes
        })
      });

      if (response.ok) {
        const appointment = await response.json();
        console.log('Account Center: Appointment saved successfully:', appointment);
        
        // Dispatch event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('appointment-saved', { detail: appointment }));
        }
        
        // Save the editing state before resetting
        const wasEditing = isEditingAppointment;
        
        // Reset form first
        setAppointmentClientId('');
        setAppointmentTitle('');
        setAppointmentDescription('');
        setAppointmentDate(undefined);
        setAppointmentStartTime('09:00');
        setAppointmentEndTime('10:00');
        setAppointmentNotes('');
        setIsEditingAppointment(false);
        setSelectedAppointment(null);
        setAppointmentDialogOpen(false);
        
        // Refresh appointments list
        await loadData();
        
        toast({
          title: wasEditing ? 'Appointment updated' : 'Appointment scheduled',
          description: `Appointment with ${appointment.client?.firstName || 'client'} ${appointment.client?.lastName || ''} has been ${wasEditing ? 'updated' : 'scheduled'}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditingAppointment ? 'update' : 'schedule'} appointment`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditingAppointment ? 'update' : 'schedule'} appointment`,
        variant: 'destructive'
      });
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleViewPDF = (pdf: PdfExport) => {
    setSelectedPdf(pdf);
    setPdfViewerOpen(true);
  };

  const handleDownloadPDF = async (pdf: PdfExport) => {
    try {
      const response = await fetch(`/api/pdf-exports/${pdf.id}/download`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdf.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF downloaded',
          description: `Downloaded ${pdf.fileName}`
        });
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to download PDF' }));
        throw new Error(error.error || 'Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive'
      });
    }
  };

  const handleExportLastPDF = async (client: Client) => {
    const lastExport = pdfExports.find(pdf => pdf.clientId === client.id);
    
    if (!lastExport) {
      toast({
        title: 'No PDF found',
        description: 'No PDF exports found for this client',
        variant: 'destructive'
      });
      return;
    }

    handleDownloadPDF(lastExport);
  };

  const handleDeleteDraft = async (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.firstName} ${client.lastName}?`)) {
      try {
        const response = await fetch(`/api/clients/${client.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          // Dispatch event to notify other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id: client.id } }));
          }
          
          // Refresh the list
          await loadData();
          
          toast({
            title: 'Client deleted',
            description: `${client.firstName} ${client.lastName} has been deleted`
          });
        } else {
          const error = await response.json().catch(() => ({ error: 'Failed to delete client' }));
          throw new Error(error.error || 'Failed to delete client');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete client',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter appointments based on selected filter
  const filteredAppointments = appointments
    .filter(apt => {
      switch (appointmentFilter) {
        case 'upcoming':
          return apt.status === 'SCHEDULED' || apt.status === 'RESCHEDULED';
        case 'completed':
          return apt.status === 'COMPLETED';
        case 'cancelled':
          return apt.status === 'CANCELLED';
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const recentPDFs = pdfExports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-foreground">Account Center</SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Manage clients, appointments, and quick actions
                </SheetDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadData()}
                disabled={loading}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                title="Refresh data"
              >
                {loading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <span>↻ Refresh</span>
                )}
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6">
            {/* Debug info - shows counts even when 0 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                <p>Clients: {clients.length} | Appointments: {appointments.length} | PDFs: {pdfExports.length}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
              </div>
            )}
            
            <Tabs defaultValue="clients" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Clients ({clients.length})
                </TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Appointments ({appointments.length})
                </TabsTrigger>
                <TabsTrigger value="exports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  PDFs ({pdfExports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clients" className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search clients..."
                      className="pl-10 bg-background border-border text-foreground"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadData}
                    disabled={loading}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {loading ? '...' : '↻'}
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                      <p className="text-sm">Loading clients...</p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm font-medium mb-2">
                        {searchTerm ? 'No clients match your search' : clients.length === 0 ? 'No clients saved yet' : 'No clients match your search'}
                      </p>
                      {clients.length === 0 && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2 mb-4">
                            Save a client from the Client Information page to see them here
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = '/client-information'}
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            Go to Client Information
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <Card key={client.id} className="cursor-pointer hover:bg-accent/10 bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-card-foreground">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {client.email || 'No email'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Updated {format(new Date(client.updatedAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            
                            <div className="flex flex-col gap-1 ml-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/client-information?load=${client.id}`;
                                  }}
                                  title="View/Edit Client"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/summary?load=${client.id}`;
                                  }}
                                  title="View Summary"
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleAppointment(client.id);
                                  }}
                                  title="Schedule Appointment"
                                >
                                  <CalendarIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGeneratePDF(client);
                                  }}
                                  disabled={isGeneratingPDF === client.id}
                                  title="Generate PDF"
                                >
                                  {isGeneratingPDF === client.id ? (
                                    <Clock className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <FileDown className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmailClient(client);
                                  }}
                                  disabled={!client.email || isSendingEmail === client.id}
                                  title="Send Email"
                                >
                                  {isSendingEmail === client.id ? (
                                    <Clock className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportLastPDF(client);
                                  }}
                                  title="Download Last PDF"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDraft(client);
                                  }}
                                  title="Delete Client"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-foreground">Appointments</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
                    onClick={() => handleScheduleAppointment()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'all' ? 'default' : 'outline'}
                    className={appointmentFilter === 'all' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={() => setAppointmentFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'upcoming' ? 'default' : 'outline'}
                    className={appointmentFilter === 'upcoming' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={() => setAppointmentFilter('upcoming')}
                  >
                    Upcoming
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'completed' ? 'default' : 'outline'}
                    className={appointmentFilter === 'completed' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={() => setAppointmentFilter('completed')}
                  >
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'cancelled' ? 'default' : 'outline'}
                    className={appointmentFilter === 'cancelled' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={() => setAppointmentFilter('cancelled')}
                  >
                    Cancelled
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                      <p className="text-sm">Loading appointments...</p>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium mb-2">No {appointmentFilter === 'all' ? '' : appointmentFilter} appointments</p>
                      {appointmentFilter === 'upcoming' && appointments.length === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleAppointment()}
                          className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule First Appointment
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <Card key={appointment.id} className="bg-card border-border cursor-pointer hover:bg-accent/10">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-card-foreground">{appointment.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="outline"
                                    className={
                                      appointment.status === 'COMPLETED' ? 'border-green-500 text-green-400' :
                                      appointment.status === 'CANCELLED' ? 'border-destructive text-destructive' :
                                      'border-primary text-primary'
                                    }
                                  >
                                    {appointment.status}
                                  </Badge>
                                  <Badge variant="outline" className="border-border text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(new Date(appointment.startDateTime), 'MMM dd, yyyy')}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAppointment(appointment);
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAppointment(appointment);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              With: {appointment.client.firstName} {appointment.client.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(appointment.startDateTime), 'h:mm a')} - {format(new Date(appointment.endDateTime), 'h:mm a')}
                            </p>
                            {appointment.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{appointment.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="exports" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-foreground">Recent PDF Exports</h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                      <p className="text-sm">Loading PDFs...</p>
                    </div>
                  ) : recentPDFs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium mb-2">No PDF exports yet</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Generate a PDF from the Summary page to see it here
                      </p>
                    </div>
                  ) : (
                    recentPDFs.map((pdf) => (
                      <Card key={pdf.id} className="cursor-pointer hover:bg-accent/10 bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleViewPDF(pdf)}
                            >
                              <p className="text-sm font-medium truncate text-card-foreground">{pdf.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {pdf.client ? `${pdf.client.firstName} ${pdf.client.lastName}` : 'Unknown Client'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(pdf.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPDF(pdf);
                                }}
                                title="View PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(pdf);
                                }}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Appointment Scheduling/Editing Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={(open) => {
        setAppointmentDialogOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setIsEditingAppointment(false);
          setSelectedAppointment(null);
          setAppointmentClientId('');
          setAppointmentTitle('');
          setAppointmentDescription('');
          setAppointmentDate(undefined);
          setAppointmentStartTime('09:00');
          setAppointmentEndTime('10:00');
          setAppointmentNotes('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
            <DialogDescription>
              {isEditingAppointment ? 'Update appointment details' : 'Create a new appointment with a client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={appointmentClientId} onValueChange={setAppointmentClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No clients available. Please save a client first.
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
                placeholder="e.g., Initial Consultation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={appointmentDescription}
                onChange={(e) => setAppointmentDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={setAppointmentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={appointmentStartTime}
                  onChange={(e) => setAppointmentStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={appointmentEndTime}
                  onChange={(e) => setAppointmentEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAppointment}
              disabled={isSavingAppointment}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSavingAppointment ? 'Saving...' : isEditingAppointment ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={appointmentDetailsOpen} onOpenChange={setAppointmentDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAppointment && `${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge 
                  variant="outline"
                  className={
                    selectedAppointment.status === 'COMPLETED' ? 'border-green-500 text-green-400' :
                    selectedAppointment.status === 'CANCELLED' ? 'border-destructive text-destructive' :
                    'border-primary text-primary'
                  }
                >
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Date & Time</Label>
                <p className="text-sm text-foreground">
                  {format(new Date(selectedAppointment.startDateTime), 'EEEE, MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedAppointment.startDateTime), 'h:mm a')} - {format(new Date(selectedAppointment.endDateTime), 'h:mm a')}
                </p>
              </div>

              {selectedAppointment.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-foreground">{selectedAppointment.description}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Client Contact</Label>
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    {selectedAppointment.client.firstName} {selectedAppointment.client.lastName}
                  </p>
                  {selectedAppointment.client.email && (
                    <p className="text-sm text-muted-foreground">{selectedAppointment.client.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            {selectedAppointment && selectedAppointment.status === 'SCHEDULED' && (
              <>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleCompleteAppointment(selectedAppointment)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    setAppointmentDetailsOpen(false);
                    handleEditAppointment(selectedAppointment);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleCancelAppointment(selectedAppointment)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            {selectedAppointment && selectedAppointment.status === 'CANCELLED' && (
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleDeleteAppointment(selectedAppointment)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </Button>
            )}
            <Button variant="outline" onClick={() => setAppointmentDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="sm:max-w-[90vw] max-w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedPdf?.fileName}</DialogTitle>
            <DialogDescription>
              {selectedPdf && selectedPdf.client && `${selectedPdf.client.firstName} ${selectedPdf.client.lastName} - ${format(new Date(selectedPdf.createdAt), 'MMM dd, yyyy')}`}
              {selectedPdf && !selectedPdf.client && `PDF - ${format(new Date(selectedPdf.createdAt), 'MMM dd, yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedPdf && (
              <iframe
                src={`/api/pdf-exports/${selectedPdf.id}/view`}
                className="w-full h-full border-0"
                title={selectedPdf.fileName}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfViewerOpen(false)}>
              Close
            </Button>
            {selectedPdf && (
              <Button 
                onClick={() => handleDownloadPDF(selectedPdf)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedClientForEmail ? `${selectedClientForEmail.firstName} ${selectedClientForEmail.lastName}` : 'Client'}</DialogTitle>
            <DialogDescription>
              Send a financial planning report email with optional PDF attachment
            </DialogDescription>
          </DialogHeader>
          {selectedClientForEmail && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-address">Client Email</Label>
                <Input
                  id="email-address"
                  type="email"
                  value={selectedClientForEmail.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email will be sent to both the client and your account email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Email message"
                  rows={4}
                />
              </div>

              {pdfExports.filter(pdf => pdf.clientId === selectedClientForEmail.id).length > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Most recent PDF will be attached automatically
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!selectedClientForEmail || isSendingEmail !== null}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSendingEmail ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
