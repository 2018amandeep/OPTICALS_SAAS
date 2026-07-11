import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Patient from '@/models/Patient';
import { getAuthUser } from '@/lib/auth';

// GET: List and search patients
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query: any = { shopId: user.shopId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query).sort({ name: 1 });
    return NextResponse.json({ patients }, { status: 200 });

  } catch (error: any) {
    console.error('Get Patients Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new patient
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, age, gender, address, code, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    // Phone validation: strip non-digits and verify 10 digits
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Phone number must contain exactly 10 digits (e.g. 9811075234)' }, { status: 400 });
    }

    // Auto-generate code if left blank
    let patientCode = code ? code.trim() : '';
    if (!patientCode) {
      const count = await Patient.countDocuments({ shopId: user.shopId });
      patientCode = `PT-${String(10001 + count)}`;
    }

    const patient = await Patient.create({
      shopId: user.shopId,
      name,
      phone: cleanPhone,
      email: email || '',
      age: age ? Number(age) : undefined,
      gender: gender || '',
      address: address || '',
      code: patientCode,
      notes: notes || '',
    });

    return NextResponse.json({ patient, message: 'Patient registered successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Create Patient Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
