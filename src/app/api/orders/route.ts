import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Patient from '@/models/Patient';
import { getAuthUser } from '@/lib/auth';
import { validatePrescription, validateIpd, validateOrderRequirements } from '@/lib/validation';

// GET: Fetch all orders for the shop
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const deliveryToday = searchParams.get('deliveryToday') || '';
    const pendingBalance = searchParams.get('pendingBalance') || '';

    let query: any = { shopId: user.shopId };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by today's deliveries
    if (deliveryToday === 'true') {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      query.deliveryDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by pending balance
    if (pendingBalance === 'true') {
      query['financials.balance'] = { $gt: 0 };
    }

    // Custom patient search inside populated data or order number match
    let patientIds: string[] = [];
    if (search) {
      // Find patients matching the query
      const matchingPatients = await Patient.find({
        shopId: user.shopId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: regexEscape(search), $options: 'i' } }
        ]
      }).select('_id');
      
      patientIds = matchingPatients.map(p => p._id.toString());
      
      // Query matching either patientId or orderNumber
      query.$or = [
        { patientId: { $in: patientIds } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { frame: { $regex: search, $options: 'i' } },
        { lenses: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('patientId', 'name phone age gender address')
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error: any) {
    console.error('Get Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new order
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields (amount > 0 and prescription presence)
    const reqsError = validateOrderRequirements(body);
    if (reqsError) {
      return NextResponse.json({ error: reqsError }, { status: 400 });
    }
    
    // Validate prescription format/ranges
    const prescriptionError = validatePrescription(body.prescription);
    if (prescriptionError) {
      return NextResponse.json({ error: prescriptionError }, { status: 400 });
    }

    // Validate IPD
    const ipdError = validateIpd(body.ipd);
    if (ipdError) {
      return NextResponse.json({ error: ipdError }, { status: 400 });
    }
    
    // Auto-generate order number if not provided
    let orderNumber = body.orderNumber;
    if (!orderNumber) {
      const dateStr = new Date().toISOString().slice(2, 8).replace(/-/g, ''); // YYMMDD
      const count = await Order.countDocuments({ shopId: user.shopId });
      const nextSequence = String(count + 1).padStart(4, '0');
      orderNumber = `OPT-${dateStr}-${nextSequence}`;
    }

    const orderData = {
      ...body,
      shopId: user.shopId,
      orderNumber,
    };

    const order = await Order.create(orderData);
    
    // Fetch newly created order populated with patient details
    const populatedOrder = await Order.findById(order._id).populate('patientId', 'name phone age gender address');

    return NextResponse.json({ order: populatedOrder, message: 'Order created successfully' }, { status: 201 });

  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Utility to escape regex characters
function regexEscape(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
