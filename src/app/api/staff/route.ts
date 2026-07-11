import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Staff from '@/models/Staff';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch all staff/doctors for the shop
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || '';
    const activeOnly = searchParams.get('activeOnly') || '';

    let query: any = { shopId: user.shopId };
    if (role) {
      query.role = role;
    }
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const staffList = await Staff.find(query).sort({ isMainDoctor: -1, name: 1 });
    return NextResponse.json({ staff: staffList }, { status: 200 });

  } catch (error: any) {
    console.error('Get Staff Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new staff/doctor member
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, role, email, phone, qualification, isMainDoctor, isActive } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
    }

    // If setting this staff member as the main doctor, reset any other main doctor in this shop
    if (isMainDoctor && role === 'Doctor') {
      await Staff.updateMany({ shopId: user.shopId }, { $set: { isMainDoctor: false } });
    }

    const staffData = {
      shopId: user.shopId,
      name,
      role,
      email: email || '',
      phone: phone || '',
      qualification: qualification || '',
      isMainDoctor: role === 'Doctor' ? !!isMainDoctor : false,
      isActive: isActive !== undefined ? !!isActive : true
    };

    const newStaff = await Staff.create(staffData);
    return NextResponse.json({ staff: newStaff, message: 'Directory entry added successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Create Staff Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
