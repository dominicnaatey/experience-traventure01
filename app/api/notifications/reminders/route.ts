import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../lib/services/notification';

export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job or scheduler
    // For security, you might want to add API key authentication here
    
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Send tour reminders for upcoming tours
    await NotificationService.sendTourReminders();

    return NextResponse.json({ 
      message: 'Tour reminders sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending tour reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}