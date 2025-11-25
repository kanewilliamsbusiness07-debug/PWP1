/**
 * FinCalc Pro - Account Center Drawer Component
 * 
 * Mini-CRM functionality with client management, scheduling, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Mail, FileText, Trash2, Search, Plus, Eye, Download, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface Appointment {
  id: string;
  clientId: string;
  client: Client;
  title: string;
  description?: string;
  dateTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsRes, appointmentsRes, exportsRes] = await Promise.all([
        fetch('/api/clients?limit=50'),
        fetch('/api/appointments?limit=20'),
        fetch('/api/pdf-exports?limit=20')
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData.appointments);
      }

      if (exportsRes.ok) {
        const exportsData = await exportsRes.json();
        setPdfExports(exportsData.exports);
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
  };

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
    toast({
      title: 'Feature Coming Soon',
      description: 'Appointment scheduling will be available in the next update'
    });
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

    try {
      const response = await fetch(`/api/pdf-exports/${lastExport.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lastExport.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF downloaded',
          description: `Downloaded ${lastExport.fileName}`
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

  const handleDeleteDraft = async (client: Client) => {
    if (confirm(`Are you sure you want to delete the draft for ${client.firstName} ${client.lastName}?`)) {
      try {
        const response = await fetch(`/api/clients/${client.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setClients(clients.filter(c => c.id !== client.id));
          toast({
            title: 'Draft deleted',
            description: `Draft for ${client.firstName} ${client.lastName} has been deleted`
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete draft',
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
    new Date(apt.dateTime) > new Date() && apt.status === 'SCHEDULED'
  ).slice(0, 5);

  const recentPDFs = pdfExports.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white border-gray-200">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10 bg-white border-gray-300 text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredClients.map((client) => (
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
                            Updated {format(new Date(client.updatedAt), 'MMM dd')}
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
                ))}

                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    <p className="text-sm">No clients found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Upcoming Appointments</h3>
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white" onClick={handleScheduleAppointment}>
                  <Plus className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{appointment.title}</p>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(appointment.dateTime), 'MMM dd')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          With: {appointment.client.firstName} {appointment.client.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(appointment.dateTime), 'h:mm a')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
                    <p className="text-sm">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="exports" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Recent PDF Exports</h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentPDFs.map((pdf) => (
                  <Card key={pdf.id} className="cursor-pointer hover:bg-gray-50 bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900">{pdf.fileName}</p>
                          <p className="text-xs text-gray-600">
                            {pdf.client.firstName} {pdf.client.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(pdf.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                          onClick={() => handleExportLastPDF(pdf.client)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {recentPDFs.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 text-gray-400" />
                    <p className="text-sm">No PDF exports yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}