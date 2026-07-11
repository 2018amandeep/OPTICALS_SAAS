import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Shop from '@/models/Shop';
import { getAuthUser } from '@/lib/auth';

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
    console.error('Auth-Me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
