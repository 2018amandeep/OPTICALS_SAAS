import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Shop from '@/models/Shop';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch current shop details
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shop = await Shop.findById(user.shopId).select('-password');
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ shop }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update shop details and WhatsApp templates
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // We prevent changing email and password here
    const { 
      name, 
      phone, 
      address, 
      currency, 
      taxRate, 
      whatsappTemplateOrder, 
      whatsappTemplateReady, 
      whatsappTemplateBalance,
      mainDoctor,
      doctors,
      staff
    } = body;

    const shop = await Shop.findByIdAndUpdate(
      user.shopId,
      {
        $set: {
          name,
          phone,
          address,
          currency,
          taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
          whatsappTemplateOrder,
          whatsappTemplateReady,
          whatsappTemplateBalance,
          mainDoctor,
          doctors,
          staff
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ shop, message: 'Settings updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Update Settings Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
