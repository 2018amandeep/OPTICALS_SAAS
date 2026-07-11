import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Shop from '@/models/Shop';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, phone, address } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingShop = await Shop.findOne({ email: email.toLowerCase() });
    if (existingShop) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create the shop (user)
    const newShop = await Shop.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
    });

    // Generate JWT token
    const token = signToken({
      shopId: newShop._id.toString(),
      email: newShop.email,
      name: newShop.name,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      message: 'Registration successful',
      shop: {
        id: newShop._id,
        name: newShop.name,
        email: newShop.email,
        phone: newShop.phone,
        address: newShop.address,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
