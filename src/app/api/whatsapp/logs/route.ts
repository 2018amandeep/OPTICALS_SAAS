import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WhatsAppLog from '@/models/WhatsAppLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    let query: any = { shopId: user.shopId };

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const logs = await WhatsAppLog.find(query).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ logs }, { status: 200 });

  } catch (error: any) {
    console.error('Get WhatsApp Logs Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
