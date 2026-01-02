/**
 * FinCalc Pro - Account Center Drawer Component
 * 
 * Mini-CRM functionality with client management, scheduling, and quick actions
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as formatModule from 'date-fns/format';
const format: (date: Date | number, fmt: string) => string = (formatModule as any).default ?? (formatModule as any);
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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [authError, setAuthError] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentDetailsOpen, setAppointmentDetailsOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfExport | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
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
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  // Debug: Log when appointment dialog state changes
  useEffect(() => {
    console.log('=== Appointment Dialog State Changed ===', {
      appointmentDialogOpen,
      isEditingAppointment,
      appointmentClientId,
      appointmentTitle,
      appointmentDate
    });
  }, [appointmentDialogOpen, isEditingAppointment, appointmentClientId, appointmentTitle, appointmentDate]);

  // Debug: Log when component mounts/updates
  useEffect(() => {
    console.log('=== Account Center Component Rendered ===', {
      open,
      clientsCount: clients.length,
      appointmentsCount: appointments.length,
      appointmentDialogOpen
    });
  }, [open, clients.length, appointments.length, appointmentDialogOpen]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAuthError(false); // Reset auth error on each load attempt
    try {
      console.log('=== ACCOUNT CENTER: LOADING DATA ===');
      console.log('Account Center: Starting to load data...');
      
      // Load clients
      try {
        console.log('=== LOADING CLIENTS DEBUG ===');
        console.log('Fetching from: /api/clients?limit=50');
        
        const clientsRes = await fetch('/api/clients?limit=50', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Response status:', clientsRes.status);
        console.log('Response ok:', clientsRes.ok);
        console.log('Response headers:', Object.fromEntries(clientsRes.headers.entries()));

        if (clientsRes.ok) {
          const rawData = await clientsRes.text();
          console.log('Raw response text:', rawData);
          
          let parsedData;
          try {
            parsedData = JSON.parse(rawData);
            console.log('Parsed data:', parsedData);
            console.log('Is array?', Array.isArray(parsedData));
            console.log('Data type:', typeof parsedData);
            
            if (parsedData && typeof parsedData === 'object') {
              console.log('Object keys:', Object.keys(parsedData));
            }
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Raw text that failed to parse:', rawData);
            setClients([]);
            return;
          }
          
          // Try multiple ways to extract the clients array
          let clientsList: Client[] = [];
          
          if (Array.isArray(parsedData)) {
            console.log('Data is already an array');
            clientsList = parsedData;
          } else if (parsedData?.clients && Array.isArray(parsedData.clients)) {
            console.log('Data has clients property');
            clientsList = parsedData.clients;
          } else if (parsedData?.data && Array.isArray(parsedData.data)) {
            console.log('Data has data property');
            clientsList = parsedData.data;
          } else {
            console.error('Could not find clients array in response');
            console.error('Response structure:', parsedData);
            clientsList = [];
          }
          
          console.log('Final clients array length:', clientsList.length);
          console.log('Final clients array:', clientsList);
          
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
          console.log('Account Center: Number of clients after validation:', clientsList.length);
          
          setClients(clientsList);
          console.log('=== CLIENTS LOADED ===');
          
          if (clientsList.length === 0) {
            console.warn('Account Center: No valid clients found in response');
            console.warn('Account Center: Raw response data was:', parsedData);
          } else {
            console.log('Account Center: Successfully loaded clients:', clientsList.map((c: Client) => `${c.firstName} ${c.lastName}`));
          }
        } else {
          const errorText = await clientsRes.text();
          console.error('Response not OK:', clientsRes.status, clientsRes.statusText);
          console.error('Error response text:', errorText);
          
          let errorData = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Unknown error' };
          }
          console.error('Error loading clients:', clientsRes.status, errorData);
          setClients([]);
          if (clientsRes.status === 401) {
            console.error('Account Center: Authentication failed - user not logged in or session expired');
            setAuthError(true);
          } else {
            toast({
              title: 'Error Loading Clients',
              description: (errorData as any).error || `Failed to load clients (${clientsRes.status})`,
              variant: 'destructive'
            });
          }
        }
      } catch (error) {
        console.error('=== ERROR FETCHING CLIENTS ===');
        console.error('Error:', error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
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

  // Use a ref to store the latest loadData function for event handlers
  const loadDataRef = useRef(loadData);
  
  // Update ref whenever loadData changes
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    if (open) {
      console.log('Account Center: Drawer opened, loading data...');
      // Always reload data when drawer opens
      loadDataRef.current();
    } else {
      console.log('Account Center: Drawer closed');
    }
  }, [open]); // Only depend on open, use ref for loadData

  // Listen for client save/update events to refresh the list
  useEffect(() => {
    const handleClientSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received client-saved event', customEvent.detail);
      console.log('Account Center: Refreshing client list after save...');
      // Refresh immediately when a client is saved
      loadDataRef.current();
    };

    const handleClientDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received client-deleted event', customEvent.detail);
      console.log('Account Center: Refreshing client list after deletion...');
      loadDataRef.current();
    };

    const handlePdfGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received pdf-generated event', customEvent.detail);
      console.log('Account Center: Refreshing PDF exports list...');
      loadDataRef.current();
    };

    const handleAppointmentSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received appointment-saved event', customEvent.detail);
      console.log('Account Center: Refreshing appointments list...');
      loadDataRef.current();
    };

    // Listen for custom events - set up listeners once and keep them stable
    // Use ref to access the latest loadData function
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
  }, []); // Empty dependency array - listeners are set up once and use ref for latest loadData

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
    console.log('=== handleScheduleAppointment CALLED ===');
    console.log('ClientId:', clientId);
    console.log('Current clients count:', clients.length);
    console.log('Current appointmentDialogOpen state:', appointmentDialogOpen);
    
    if (clients.length === 0) {
      console.log('No clients available, showing toast');
      toast({
        title: 'No Clients Available',
        description: 'Please save at least one client before scheduling an appointment. Go to Client Information page to create a client.',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('Opening appointment dialog...');
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
    console.log('Appointment dialog state set to open, new state should be: true');
  };

  const handleEditAppointment = (appointment: Appointment) => {
    console.log('=== handleEditAppointment CALLED ===');
    console.log('Appointment:', appointment);
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
    console.log('Edit appointment dialog opened');
  };

  const handleViewAppointment = (appointment: Appointment) => {
    console.log('=== handleViewAppointment CALLED ===');
    console.log('Appointment:', appointment);
    setSelectedAppointment(appointment);
    setAppointmentDetailsOpen(true);
    console.log('Appointment details dialog opened');
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
      // Combine date and time - ensure we use local time correctly
      const [startHours, startMinutes] = appointmentStartTime.split(':').map(Number);
      const [endHours, endMinutes] = appointmentEndTime.split(':').map(Number);
      
      // Create date objects in local timezone
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        toast({
          title: 'Validation Error',
          description: 'End time must be after start time',
          variant: 'destructive'
        });
        setIsSavingAppointment(false);
        return;
      }
      
      // For new appointments, validate that the appointment is not in the past
      if (!isEditingAppointment && startDateTime < new Date()) {
        toast({
          title: 'Validation Error',
          description: 'Cannot schedule appointments in the past',
          variant: 'destructive'
        });
        setIsSavingAppointment(false);
        return;
      }

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
    console.log('=== DELETE CLIENT CALLED ===');
    console.log('Client ID:', client.id);
    console.log('Client ID type:', typeof client.id);
    console.log('Client ID is valid:', !!client.id);
    console.log('Client name:', `${client.firstName} ${client.lastName}`);
    
    if (!client.id) {
      console.error('No client ID provided!');
      toast({
        title: "Error",
        description: "No client selected for deletion",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Showing confirmation dialog...');
      
      // Check if confirmation dialog is being shown
      const confirmed = window.confirm(`Are you sure you want to delete ${client.firstName} ${client.lastName}?`);
      console.log('User confirmed deletion:', confirmed);
      
      if (!confirmed) {
        console.log('User cancelled deletion');
        return;
      }

      console.log('Sending DELETE request to API...');
      console.log('URL:', `/api/clients/${client.id}`);
      
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('DELETE response status:', response.status);
      console.log('DELETE response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('DELETE response raw text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('DELETE response parsed:', responseData);
      } catch (e) {
        console.log('Could not parse response as JSON');
        console.log('Parse error:', e);
      }

      if (!response.ok) {
        console.error('DELETE failed with status:', response.status);
        throw new Error(responseData?.error || 'Failed to delete client');
      }

      console.log('DELETE successful!');
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id: client.id } }));
      }
      
      toast({
        title: "Success",
        description: `${client.firstName} ${client.lastName} has been deleted`,
      });

      // Refresh the clients list
      console.log('Refreshing clients list...');
      await loadData();
      
      console.log('=== DELETE CLIENT COMPLETE ===');

    } catch (error: any) {
      console.error('=== DELETE CLIENT ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  const handleClientSelect = (clientId: string, checked: boolean) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clientId);
      } else {
        newSet.delete(clientId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedClients);
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} client(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      console.log('=== BULK DELETE CLIENTS STARTED ===');
      console.log('Selected client IDs:', selectedIds);

      const response = await fetch(`/api/clients?ids=${selectedIds.join(',')}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Bulk delete response status:', response.status);
      const responseData = await response.json();
      console.log('Bulk delete response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete clients');
      }

      // Dispatch events for each deleted client
      selectedIds.forEach(id => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('client-deleted', { detail: { id } }));
        }
      });

      toast({
        title: "Success",
        description: `Successfully deleted ${responseData.deletedCount || selectedIds.length} client(s)`,
      });

      // Clear selection and refresh data
      setSelectedClients(new Set());
      await loadData();

      console.log('=== BULK DELETE CLIENTS COMPLETE ===');

    } catch (error: any) {
      console.error('=== BULK DELETE CLIENTS ERROR ===', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete clients",
        variant: "destructive"
      });
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

                {/* Bulk actions */}
                {selectedClients.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <span className="text-sm font-medium text-destructive">
                      {selectedClients.size} client{selectedClients.size !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                )}

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
                            {authError 
                              ? 'Please log in to view your clients. If you are logged in, try refreshing the page or logging out and back in.'
                              : 'Save a client from the Client Information page to see them here'}
                          </p>
                          {authError ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = '/auth/login'}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Go to Login
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = '/client-information'}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Go to Client Information
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <Card key={client.id} className="cursor-pointer hover:bg-accent/10 bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Checkbox
                                checked={selectedClients.has(client.id)}
                                onCheckedChange={(checked) => handleClientSelect(client.id, checked as boolean)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
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
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Schedule appointment button clicked for client:', client.id);
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
                    onClick={(e) => {
                      console.log('=== Schedule Button CLICKED ===');
                      e.preventDefault();
                      e.stopPropagation();
                      handleScheduleAppointment();
                    }}
                    onMouseDown={(e) => {
                      console.log('Schedule button mouse down');
                      e.stopPropagation();
                    }}
                    disabled={clients.length === 0}
                    title={clients.length === 0 ? 'Create a client first before scheduling an appointment' : 'Schedule Appointment'}
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
                    onClick={(e) => {
                      console.log('Filter button clicked: all');
                      e.preventDefault();
                      e.stopPropagation();
                      setAppointmentFilter('all');
                    }}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'upcoming' ? 'default' : 'outline'}
                    className={appointmentFilter === 'upcoming' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={(e) => {
                      console.log('Filter button clicked: upcoming');
                      e.preventDefault();
                      e.stopPropagation();
                      setAppointmentFilter('upcoming');
                    }}
                  >
                    Upcoming
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'completed' ? 'default' : 'outline'}
                    className={appointmentFilter === 'completed' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={(e) => {
                      console.log('Filter button clicked: completed');
                      e.preventDefault();
                      e.stopPropagation();
                      setAppointmentFilter('completed');
                    }}
                  >
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    variant={appointmentFilter === 'cancelled' ? 'default' : 'outline'}
                    className={appointmentFilter === 'cancelled' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'border-border text-foreground hover:bg-accent'}
                    onClick={(e) => {
                      console.log('Filter button clicked: cancelled');
                      e.preventDefault();
                      e.stopPropagation();
                      setAppointmentFilter('cancelled');
                    }}
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
                          onClick={(e) => {
                            console.log('=== Schedule First Appointment Button CLICKED ===');
                            e.preventDefault();
                            e.stopPropagation();
                            handleScheduleAppointment();
                          }}
                          disabled={clients.length === 0}
                          className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          title={clients.length === 0 ? 'Create a client first before scheduling an appointment' : 'Schedule First Appointment'}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule First Appointment
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <Card 
                        key={appointment.id} 
                        className="bg-card border-border cursor-pointer hover:bg-accent/10"
                        onClick={(e) => {
                          console.log('Card clicked for appointment:', appointment.id);
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewAppointment(appointment);
                        }}
                      >
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
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    console.log('View button clicked for appointment:', appointment.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleViewAppointment(appointment);
                                  }}
                                  onMouseDown={(e) => {
                                    console.log('View button mouse down');
                                    e.stopPropagation();
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
                                      console.log('Edit button clicked for appointment:', appointment.id);
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditAppointment(appointment);
                                    }}
                                    onMouseDown={(e) => {
                                      console.log('Edit button mouse down');
                                      e.stopPropagation();
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
          setDatePickerOpen(false);
        }
      }}>
        <DialogContent 
          className="sm:max-w-[500px]"
          onInteractOutside={(e) => {
            // Allow interactions with Select and Popover portals
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-portal]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditingAppointment ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
            <DialogDescription>
              {isEditingAppointment ? 'Update appointment details' : 'Create a new appointment with a client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select 
                value={appointmentClientId} 
                onValueChange={(value) => {
                  console.log('=== Client Selected ===', value);
                  setAppointmentClientId(value);
                }}
                disabled={isEditingAppointment}
              >
                <SelectTrigger
                  onClick={(e) => {
                    console.log('=== Select Trigger Clicked ===');
                    e.stopPropagation();
                  }}
                >
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent 
                  className="z-[200]"
                  onClick={(e) => {
                    console.log('=== Select Content Clicked ===');
                    e.stopPropagation();
                  }}
                >
                  {clients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No clients available. Please save a client first.
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id}
                        onClick={(e) => {
                          console.log('=== Select Item Clicked ===', client.id, client.firstName, client.lastName);
                          e.stopPropagation();
                        }}
                      >
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {isEditingAppointment && (
                <p className="text-xs text-muted-foreground">
                  Client cannot be changed for existing appointments
                </p>
              )}
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
              <Popover open={datePickerOpen} onOpenChange={(open) => {
                console.log('=== Popover Open State Changed ===', open);
                setDatePickerOpen(open);
              }}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                    )}
                    onClick={(e) => {
                      console.log('=== Date Picker Button CLICKED ===');
                      // Don't prevent default or stop propagation - let PopoverTrigger handle it
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[200]" 
                  align="start"
                  onOpenAutoFocus={(e) => {
                    // Prevent auto-focus from stealing focus
                    e.preventDefault();
                  }}
                  onInteractOutside={(e) => {
                    console.log('=== Popover Interact Outside ===');
                    // Allow closing when clicking outside
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={(date) => {
                      console.log('=== Calendar Date Selected ===', date);
                      if (date) {
                        setAppointmentDate(date);
                        // Close popover after selection
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                    disabled={(date) => {
                      // Allow past dates when editing, but not for new appointments
                      if (isEditingAppointment) {
                        return false;
                      }
                      // For new appointments, disable past dates
                      return date < new Date(new Date().setHours(0, 0, 0, 0));
                    }}
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
            <Button 
              variant="outline" 
              onClick={(e) => {
                console.log('=== Cancel Button CLICKED ===');
                e.preventDefault();
                e.stopPropagation();
                setAppointmentDialogOpen(false);
              }}
              disabled={isSavingAppointment}
            >
              Cancel
            </Button>
            <Button 
              onClick={(e) => {
                console.log('=== Save/Update Button CLICKED ===');
                e.preventDefault();
                e.stopPropagation();
                handleSaveAppointment();
              }}
              disabled={isSavingAppointment || !appointmentClientId || !appointmentTitle || !appointmentDate}
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
