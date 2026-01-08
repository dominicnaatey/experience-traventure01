import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '../../../../lib/services/availability';

// GET /api/tours/[id]/availability - Check tour availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    if (startDate) {
      startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        );
      }
    }

    const availabilities = await AvailabilityService.checkAvailability(
      id,
      startDateObj,
      endDateObj
    );

    return NextResponse.json({
      tourId: id,
      availabilities
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}