import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { NotificationService } from '@/app/lib/services/notification';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current notification preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { notificationPreferences: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return preferences with defaults if none exist
    const preferences = user.notificationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      bookingConfirmations: true,
      tourReminders: true,
      paymentUpdates: true,
      marketingEmails: false
    };

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      emailNotifications,
      smsNotifications,
      bookingConfirmations,
      tourReminders,
      paymentUpdates,
      marketingEmails
    } = body;

    // Validate preferences
    const preferences = {
      emailNotifications: typeof emailNotifications === 'boolean' ? emailNotifications : undefined,
      smsNotifications: typeof smsNotifications === 'boolean' ? smsNotifications : undefined,
      bookingConfirmations: typeof bookingConfirmations === 'boolean' ? bookingConfirmations : undefined,
      tourReminders: typeof tourReminders === 'boolean' ? tourReminders : undefined,
      paymentUpdates: typeof paymentUpdates === 'boolean' ? paymentUpdates : undefined,
      marketingEmails: typeof marketingEmails === 'boolean' ? marketingEmails : undefined
    };

    // Remove undefined values
    const validPreferences = Object.fromEntries(
      Object.entries(preferences).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(validPreferences).length === 0) {
      return NextResponse.json(
        { error: 'No valid preferences provided' },
        { status: 400 }
      );
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update preferences
    await NotificationService.updateNotificationPreferences(user.id, validPreferences);

    return NextResponse.json({ 
      message: 'Notification preferences updated successfully',
      preferences: validPreferences
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}