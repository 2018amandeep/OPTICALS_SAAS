import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Patient from '@/models/Patient';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>
}

// GET: Fetch a patient and their orders history
export async function GET(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const patient = await Patient.findOne({ _id: id, shopId: user.shopId });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get order history
    const orders = await Order.find({ patientId: id, shopId: user.shopId }).sort({ bookingDate: -1 });

    return NextResponse.json({ patient, orders }, { status: 200 });

  } catch (error: any) {
    console.error('Get Patient Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a patient
export async function PUT(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const patient = await Patient.findOneAndUpdate(
      { _id: id, shopId: user.shopId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient, message: 'Patient updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Update Patient Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a patient
export async function DELETE(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const patient = await Patient.findOneAndDelete({ _id: id, shopId: user.shopId });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Delete associated orders as well
    await Order.deleteMany({ patientId: id, shopId: user.shopId });

    return NextResponse.json({ message: 'Patient and associated orders deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete Patient Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
