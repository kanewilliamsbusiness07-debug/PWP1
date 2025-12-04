import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { Session } from 'next-auth';

// GET /api/appointments - List appointments (account-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('Appointments API - Session check:', session ? `User ID: ${session.user?.id}` : 'No session');
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startDateTime = {};
      if (startDate) {
        where.startDateTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDateTime.lte = new Date(endDate);
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { startDateTime: 'asc' },
      take: limit
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error getting appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.clientId || !data.title || !data.startDateTime || !data.endDateTime) {
      return NextResponse.json(
        { error: 'Client ID, title, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: session.user.id,
        status: { not: 'CANCELLED' },
        OR: [
          {
            startDateTime: {
              gte: new Date(data.startDateTime),
              lt: new Date(data.endDateTime)
            }
          },
          {
            endDateTime: {
              gt: new Date(data.startDateTime),
              lte: new Date(data.endDateTime)
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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        status: data.status || 'SCHEDULED',
        notes: data.notes
      },
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
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

