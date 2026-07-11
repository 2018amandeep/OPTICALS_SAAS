import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Order from '@/models/Order';
import { validatePrescription, validateIpd } from '@/lib/validation';

type Context = {
  params: Promise<{ id: string }>
}

// GET: Fetch a single order with populated patient details
export async function GET(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await Order.findOne({ _id: id, shopId: user.shopId })
      .populate('patientId')
      .populate('shopId', 'name email phone address currency logoUrl');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error: any) {
    console.error('Get Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update an order (re-triggers pre-save hooks to recalculate balances)
export async function PUT(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    // Validate prescription
    const prescriptionError = validatePrescription(body.prescription);
    if (prescriptionError) {
      return NextResponse.json({ error: prescriptionError }, { status: 400 });
    }

    // Validate IPD
    const ipdError = validateIpd(body.ipd);
    if (ipdError) {
      return NextResponse.json({ error: ipdError }, { status: 400 });
    }

    const order = await Order.findOne({ _id: id, shopId: user.shopId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Assign new fields
    Object.assign(order, body);

    // Save the order to trigger the pre('save') middleware for balance/payment status recalculation
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('patientId')
      .populate('shopId', 'name email phone address currency logoUrl');

    return NextResponse.json({ order: populatedOrder, message: 'Order updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Update Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete an order
export async function DELETE(req: NextRequest, context: Context) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await Order.findOneAndDelete({ _id: id, shopId: user.shopId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete Order Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
