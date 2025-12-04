/**
 * FinCalc Pro - Account Center Drawer Component
 * 
 * Mini-CRM functionality with client management, scheduling, and quick actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Mail, FileText, Trash2, Search, Plus, Eye, Download, Clock, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  client: Client;
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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfExport | null>(null);
  
  // Appointment form state
  const [appointmentClientId, setAppointmentClientId] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [appointmentStartTime, setAppointmentStartTime] = useState('09:00');
  const [appointmentEndTime, setAppointmentEndTime] = useState('10:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, appointmentsRes, exportsRes] = await Promise.all([
        fetch('/api/clients?limit=50'),
        fetch('/api/appointments?limit=20'),
        fetch('/api/pdf-exports?limit=20')
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        // Handle both response formats: { clients: [...] } or [...]
        const clientsList = Array.isArray(clientsData) ? clientsData : (clientsData.clients || []);
        console.log('Account Center: API Response:', clientsData);
        console.log('Account Center: Parsed clients list:', clientsList);
        console.log('Account Center: Number of clients:', clientsList.length);
        setClients(clientsList);
        if (clientsList.length === 0) {
          console.warn('Account Center: No clients found in response');
        } else {
          console.log('Account Center: Successfully loaded clients:', clientsList.map((c: Client) => `${c.firstName} ${c.lastName}`));
        }
      } else {
        const errorData = await clientsRes.json().catch(() => ({}));
        console.error('Error loading clients:', clientsRes.status, errorData);
        setClients([]); // Clear clients on error
        if (clientsRes.status === 401) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in again to view clients',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Error Loading Clients',
            description: errorData.error || 'Failed to load clients',
            variant: 'destructive'
          });
        }
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData.appointments || []);
      } else {
        console.error('Error loading appointments:', appointmentsRes.status);
      }

      if (exportsRes.ok) {
        const exportsData = await exportsRes.json();
        setPdfExports(exportsData.exports || []);
      } else {
        console.error('Error loading PDF exports:', exportsRes.status);
      }
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
      loadData();
    }
  }, [open, loadData]);

  // Listen for client save/update events to refresh the list
  useEffect(() => {
    const handleClientSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Account Center: Received client-saved event', customEvent.detail);
      // Always refresh if drawer is open, with a small delay to ensure DB commit
      if (open) {
        console.log('Account Center: Refreshing client list...');
        setTimeout(() => {
          loadData();
        }, 500); // Small delay to ensure database transaction is committed
      } else {
        console.log('Account Center: Drawer is closed, will refresh when opened');
      }
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
      if (open) {
        console.log('Account Center: Refreshing PDF exports list...');
        setTimeout(() => {
          loadData();
        }, 500);
      }
    };

    // Listen for custom event when clients are saved
    // Set up listeners regardless of open state so they're ready when drawer opens
    console.log('Account Center: Setting up event listeners');
    window.addEventListener('client-saved', handleClientSaved);
    window.addEventListener('client-deleted', handleClientDeleted);
    window.addEventListener('pdf-generated', handlePdfGenerated);

    return () => {
      console.log('Account Center: Cleaning up event listeners');
      window.removeEventListener('client-saved', handleClientSaved);
      window.removeEventListener('client-deleted', handleClientDeleted);
      window.removeEventListener('pdf-generated', handlePdfGenerated);
    };
  }, [open, loadData]);

  const handleEmailClient = async (client: Client) => {
    if (!client.email) {
      toast({
        title: 'No email address',
        description: 'This client does not have an email address on file',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/clients/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          template: 'general-inquiry',
          subject: 'Follow-up from FinCalc Pro'
        })
      });

      if (response.ok) {
        toast({
          title: 'Email sent',
          description: `Email sent to ${client.firstName} ${client.lastName}`
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    }
  };

  const handleScheduleAppointment = () => {
    setAppointmentDialogOpen(true);
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

      const response = await fetch('/api/appointments', {
        method: 'POST',
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
        const newAppointment = await response.json();
        // Refresh appointments list
        await loadData();
        toast({
          title: 'Appointment scheduled',
          description: `Appointment with ${newAppointment.client.firstName} ${newAppointment.client.lastName} has been scheduled`
        });
        
        // Reset form
        setAppointmentClientId('');
        setAppointmentTitle('');
        setAppointmentDescription('');
        setAppointmentDate(undefined);
        setAppointmentStartTime('09:00');
        setAppointmentEndTime('10:00');
        setAppointmentNotes('');
        setAppointmentDialogOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule appointment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule appointment',
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
      const response = await fetch(`/api/pdf-exports/${pdf.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdf.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF downloaded',
          description: `Downloaded ${pdf.fileName}`
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
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
          method: 'DELETE'
        });

        if (response.ok) {
          setClients(clients.filter(c => c.id !== client.id));
          toast({
            title: 'Client deleted',
            description: `${client.firstName} ${client.lastName} has been deleted`
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete client',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.startDateTime) > new Date() && apt.status === 'SCHEDULED'
  ).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const recentPDFs = pdfExports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white border-gray-200 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-gray-900">Account Center</SheetTitle>
            <SheetDescription className="text-gray-600">
              Manage clients, appointments, and quick actions
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Tabs defaultValue="clients" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="clients" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Clients</TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Appointments</TabsTrigger>
                <TabsTrigger value="exports" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">PDFs</TabsTrigger>
              </TabsList>

              <TabsContent value="clients" className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search clients..."
                      className="pl-10 bg-white border-gray-300 text-gray-900"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadData}
                    disabled={loading}
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                  >
                    {loading ? '...' : '↻'}
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-600">
                      <p className="text-sm">Loading clients...</p>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <p className="text-sm">
                        {searchTerm ? 'No clients match your search' : clients.length === 0 ? 'No clients saved yet' : 'No clients match your search'}
                      </p>
                      {clients.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Save a client from the Client Information page to see them here
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <Card key={client.id} className="cursor-pointer hover:bg-gray-50 bg-white border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {client.email || 'No email'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Updated {format(new Date(client.updatedAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            
                            <div className="flex flex-col gap-1 ml-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/client-information?load=${client.id}`, '_blank');
                                  }}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmailClient(client);
                                  }}
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportLastPDF(client);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDraft(client);
                                  }}
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
                  <h3 className="text-sm font-medium text-gray-900">Upcoming Appointments</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white" 
                    onClick={handleScheduleAppointment}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-600">
                      <p className="text-sm">Loading appointments...</p>
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
                      <p className="text-sm">No upcoming appointments</p>
                    </div>
                  ) : (
                    upcomingAppointments.map((appointment) => (
                      <Card key={appointment.id} className="bg-white border-gray-200">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{appointment.title}</p>
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(appointment.startDateTime), 'MMM dd')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              With: {appointment.client.firstName} {appointment.client.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(appointment.startDateTime), 'h:mm a')} - {format(new Date(appointment.endDateTime), 'h:mm a')}
                            </p>
                            {appointment.description && (
                              <p className="text-xs text-gray-500 mt-1">{appointment.description}</p>
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
                  <h3 className="text-sm font-medium text-gray-900">Recent PDF Exports</h3>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-600">
                      <p className="text-sm">Loading PDFs...</p>
                    </div>
                  ) : recentPDFs.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
                      <p className="text-sm">No PDF exports yet</p>
                    </div>
                  ) : (
                    recentPDFs.map((pdf) => (
                      <Card key={pdf.id} className="cursor-pointer hover:bg-gray-50 bg-white border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleViewPDF(pdf)}
                            >
                              <p className="text-sm font-medium truncate text-gray-900">{pdf.fileName}</p>
                              <p className="text-xs text-gray-600">
                                {pdf.client.firstName} {pdf.client.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(pdf.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPDF(pdf);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(pdf);
                                }}
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

      {/* Appointment Scheduling Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Create a new appointment with a client
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
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
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
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isSavingAppointment ? 'Saving...' : 'Schedule'}
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
              {selectedPdf && `${selectedPdf.client.firstName} ${selectedPdf.client.lastName} - ${format(new Date(selectedPdf.createdAt), 'MMM dd, yyyy')}`}
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
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
