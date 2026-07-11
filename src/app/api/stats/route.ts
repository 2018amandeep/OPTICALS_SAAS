import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // 1. Today's Deliveries
    const todayDeliveries = await Order.find({
      shopId: user.shopId,
      deliveryDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $ne: 'Cancelled' }
    }).populate('patientId', 'name phone');

    // 2. Pending Balances
    const pendingBalances = await Order.find({
      shopId: user.shopId,
      'financials.balance': { $gt: 0 },
      status: { $nin: ['Cancelled', 'Delivered'] }
    }).populate('patientId', 'name phone').sort({ 'financials.balance': -1 });

    // 3. Stats calculation
    // Total unpaid balances
    const unpaidAggregation = await Order.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(user.shopId), status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$financials.balance' },
          totalSales: { $sum: '$financials.amount' },
          totalCollections: { $sum: '$financials.advance' }
        }
      }
    ]);

    const stats = unpaidAggregation[0] || { totalBalance: 0, totalSales: 0, totalCollections: 0 };

    // Today's collections/sales
    const todayAggregation = await Order.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(user.shopId),
          bookingDate: { $gte: startOfToday, $lte: endOfToday },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          sales: { $sum: '$financials.amount' },
          collections: { $sum: '$financials.advance' }
        }
      }
    ]);
    const todayStats = todayAggregation[0] || { sales: 0, collections: 0 };

    // 4. Last 7 days trend for custom charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendAggregation = await Order.aggregate([
      {
        $match: {
          shopId: new mongoose.Types.ObjectId(user.shopId),
          bookingDate: { $gte: sevenDaysAgo },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
          count: { $sum: 1 },
          amount: { $sum: '$financials.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Populate all 7 days in trend (even if 0 orders)
    const trendMap = new Map(trendAggregation.map(item => [item._id, item]));
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayData = trendMap.get(dateStr) || { count: 0, amount: 0 };
      trendData.push({
        date: dateStr,
        day: dayName,
        orders: dayData.count,
        sales: dayData.amount
      });
    }

    // Fetch active orders to calculate top frames, lenses, peak hours (footfall), and clinical diagnostics
    const activeOrders = await Order.find({
      shopId: user.shopId,
      status: { $ne: 'Cancelled' }
    }).select('createdAt frame lenses prescription');

    const hourlyCounts = Array(24).fill(0);
    const weekdayCounts = Array(7).fill(0); // 0 = Sunday, 1 = Monday ...
    const frameCounts: { [key: string]: number } = {};
    const lensCounts: { [key: string]: number } = {};

    let myopiaCount = 0;
    let hyperopiaCount = 0;
    let astigmatismCount = 0;
    let presbyopiaCount = 0;
    let totalEyes = 0;

    activeOrders.forEach(order => {
      // 1. Timezone-normalized footfall booking counts (Asia/Kolkata timezone)
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        try {
          const formatterHour = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Asia/Kolkata'
          });
          const formatterDay = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            timeZone: 'Asia/Kolkata'
          });
          const hour = parseInt(formatterHour.format(date), 10);
          const dayName = formatterDay.format(date);
          
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourlyCounts[hour]++;
          }
          
          const dayMap: { [key: string]: number } = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
          };
          const dayIndex = dayMap[dayName];
          if (dayIndex !== undefined) {
            weekdayCounts[dayIndex]++;
          }
        } catch (e) {
          const hour = date.getUTCHours();
          const dayIndex = date.getUTCDay();
          hourlyCounts[hour]++;
          weekdayCounts[dayIndex]++;
        }
      }

      // 2. Inventory sales
      if (order.frame && order.frame.trim() !== '') {
        const name = order.frame.trim();
        frameCounts[name] = (frameCounts[name] || 0) + 1;
      }
      if (order.lenses && order.lenses.trim() !== '') {
        const name = order.lenses.trim();
        lensCounts[name] = (lensCounts[name] || 0) + 1;
      }

      // 3. Clinical metrics
      const right = order.prescription?.right || {};
      const left = order.prescription?.left || {};

      // Right eye check
      if (right.sph) {
        const sph = parseFloat(right.sph);
        if (!isNaN(sph)) {
          totalEyes++;
          if (sph < 0) myopiaCount++;
          if (sph > 0) hyperopiaCount++;
        }
      }
      if (right.cyl) {
        const cyl = parseFloat(right.cyl);
        if (!isNaN(cyl) && cyl !== 0) astigmatismCount++;
      }
      if (right.add) {
        const add = parseFloat(right.add);
        if (!isNaN(add) && add > 0) presbyopiaCount++;
      }

      // Left eye check
      if (left.sph) {
        const sph = parseFloat(left.sph);
        if (!isNaN(sph)) {
          totalEyes++;
          if (sph < 0) myopiaCount++;
          if (sph > 0) hyperopiaCount++;
        }
      }
      if (left.cyl) {
        const cyl = parseFloat(left.cyl);
        if (!isNaN(cyl) && cyl !== 0) astigmatismCount++;
      }
      if (left.add) {
        const add = parseFloat(left.add);
        if (!isNaN(add) && add > 0) presbyopiaCount++;
      }
    });

    // Format top selling frames
    const topFrames = Object.entries(frameCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Format top selling lenses
    const topLenses = Object.entries(lensCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalOutstanding: stats.totalBalance,
        totalSales: stats.totalSales,
        totalCollections: stats.totalCollections,
        todaySales: todayStats.sales,
        todayCollections: todayStats.collections,
        todayDeliveriesCount: todayDeliveries.length,
        pendingBalancesCount: pendingBalances.length
      },
      todayDeliveries,
      pendingBalances,
      trend: trendData,
      analytics: {
        hourlyFootfall: hourlyCounts,
        weekdayFootfall: weekdayCounts,
        topFrames,
        topLenses,
        clinical: {
          myopia: myopiaCount,
          hyperopia: hyperopiaCount,
          astigmatism: astigmatismCount,
          presbyopia: presbyopiaCount,
          totalEyes
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import mongoose from 'mongoose';
