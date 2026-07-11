import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: 'Invalid Receipt ID' }, { status: 400 });
    }

    const order = await Order.findById(id)
      .populate('patientId')
      .populate('shopId', 'name email phone address currency logoUrl');

    if (!order) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error: any) {
    console.error('Get Public Receipt Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
