import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id
      },
      include: {
        client: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
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

    // Verify appointment belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check for conflicts if dates are being changed
    if (data.startDateTime || data.endDateTime) {
      const startDateTime = data.startDateTime ? new Date(data.startDateTime) : existingAppointment.startDateTime;
      const endDateTime = data.endDateTime ? new Date(data.endDateTime) : existingAppointment.endDateTime;

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          userId: session.user.id,
          id: { not: appointmentId },
          status: { not: 'CANCELLED' },
          OR: [
            {
              startDateTime: {
                gte: startDateTime,
                lt: endDateTime
              }
            },
            {
              endDateTime: {
                gt: startDateTime,
                lte: endDateTime
              }
            }
          ]
        }
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'Appointment conflicts with existing appointment' },
          { status: 409 }
        );
      }
    }

    // Update appointment
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDateTime !== undefined) updateData.startDateTime = new Date(data.startDateTime);
    if (data.endDateTime !== undefined) updateData.endDateTime = new Date(data.endDateTime);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

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

    // Verify appointment belongs to user
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

