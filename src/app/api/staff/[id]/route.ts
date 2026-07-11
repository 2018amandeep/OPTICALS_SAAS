import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Staff from '@/models/Staff';
import { getAuthUser } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>
}

// PUT: Update staff/doctor member details
export async function PUT(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { name, role, email, phone, qualification, isMainDoctor, isActive } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
    }

    // If setting this staff member as the main doctor, reset any other main doctor in this shop
    if (isMainDoctor && role === 'Doctor') {
      await Staff.updateMany({ shopId: user.shopId }, { $set: { isMainDoctor: false } });
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: id, shopId: user.shopId },
      {
        $set: {
          name,
          role,
          email: email || '',
          phone: phone || '',
          qualification: qualification || '',
          isMainDoctor: role === 'Doctor' ? !!isMainDoctor : false,
          isActive: isActive !== undefined ? !!isActive : true
        }
      },
      { new: true }
    );

    if (!updatedStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ staff: updatedStaff, message: 'Directory entry updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Update Staff Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a staff/doctor member
export async function DELETE(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const staffMember = await Staff.findOneAndDelete({ _id: id, shopId: user.shopId });
    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Directory entry deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete Staff Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
