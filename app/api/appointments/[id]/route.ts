import { NextRequest, NextResponse } from 'next/server';
import { ddbDocClient } from '@/lib/aws/clients';
import { GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import type { Session } from 'next-auth';

// GET /api/appointments/[id] - Get a single appointment
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const appointmentId = params.id;

    const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
    if (!apptTable) return NextResponse.json({ error: 'Server not configured: DDB_APPOINTMENTS_TABLE missing' }, { status: 500 });

    const getRes: any = await ddbDocClient.send(new GetCommand({ TableName: apptTable, Key: { id: appointmentId } } as any));
    const appointment = getRes.Item;
    if (!appointment || appointment.userId !== session.user.id) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    // Optionally fetch client details
    const clientsTable = process.env.DDB_CLIENTS_TABLE;
    if (clientsTable && appointment.clientId) {
      try {
        const cRes: any = await ddbDocClient.send(new GetCommand({ TableName: clientsTable, Key: { id: appointment.clientId } } as any));
        if (cRes && cRes.Item) appointment.client = { id: cRes.Item.id, firstName: cRes.Item.firstName, lastName: cRes.Item.lastName, email: cRes.Item.email };
      } catch (cErr) { /* ignore */ }
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - Update an appointment
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const appointmentId = params.id;
    const data = await req.json();

    // Verify appointment exists and belongs to user
    const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
    if (!apptTable) return NextResponse.json({ error: 'Server not configured: DDB_APPOINTMENTS_TABLE missing' }, { status: 500 });

    const getRes: any = await ddbDocClient.send(new GetCommand({ TableName: apptTable, Key: { id: appointmentId } } as any));
    const existingAppointment = getRes.Item;
    if (!existingAppointment || existingAppointment.userId !== session.user.id) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    // Check for conflicts if dates are being changed
    const newStart = data.startDateTime ? new Date(data.startDateTime) : new Date(existingAppointment.startDateTime);
    const newEnd = data.endDateTime ? new Date(data.endDateTime) : new Date(existingAppointment.endDateTime);

    if (data.startDateTime || data.endDateTime) {
      const scanRes: any = await ddbDocClient.send(new ScanCommand({ TableName: apptTable } as any));
      const existing = (scanRes.Items || []).filter((it:any) => it.userId === session.user.id && it.id !== appointmentId && it.status !== 'CANCELLED');
      const conflict = existing.find((it:any) => {
        const s = new Date(it.startDateTime);
        const e = new Date(it.endDateTime);
        return (s < newEnd && e > newStart);
      });
      if (conflict) return NextResponse.json({ error: 'Appointment conflicts with existing appointment' }, { status: 409 });
    }

    // Build update expression
    const updates: any = [];
    const exprAttr: any = { ':updatedAt': new Date().toISOString() };
    let updateExpr = 'SET updatedAt = :updatedAt';
    if (data.title !== undefined) { updateExpr += ', title = :title'; exprAttr[':title'] = data.title; }
    if (data.description !== undefined) { updateExpr += ', description = :description'; exprAttr[':description'] = data.description; }
    if (data.startDateTime !== undefined) { updateExpr += ', startDateTime = :startDateTime'; exprAttr[':startDateTime'] = new Date(data.startDateTime).toISOString(); }
    if (data.endDateTime !== undefined) { updateExpr += ', endDateTime = :endDateTime'; exprAttr[':endDateTime'] = new Date(data.endDateTime).toISOString(); }
    if (data.status !== undefined) { updateExpr += ', status = :status'; exprAttr[':status'] = data.status; }
    if (data.notes !== undefined) { updateExpr += ', notes = :notes'; exprAttr[':notes'] = data.notes; }

    await ddbDocClient.send(new UpdateCommand({ TableName: apptTable, Key: { id: appointmentId }, UpdateExpression: updateExpr, ExpressionAttributeValues: exprAttr } as any));

    // Return updated record
    const updatedRes: any = await ddbDocClient.send(new GetCommand({ TableName: apptTable, Key: { id: appointmentId } } as any));
    const appointment = updatedRes.Item;
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const appointmentId = params.id;

    const apptTable = process.env.DDB_APPOINTMENTS_TABLE;
    if (!apptTable) return NextResponse.json({ error: 'Server not configured: DDB_APPOINTMENTS_TABLE missing' }, { status: 500 });

    const getRes: any = await ddbDocClient.send(new GetCommand({ TableName: apptTable, Key: { id: appointmentId } } as any));
    const appointment = getRes.Item;
    if (!appointment || appointment.userId !== session.user.id) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    await ddbDocClient.send(new DeleteCommand({ TableName: apptTable, Key: { id: appointmentId } } as any));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

