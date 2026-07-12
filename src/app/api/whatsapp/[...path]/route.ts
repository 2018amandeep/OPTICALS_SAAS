import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import { getAuthUser } from '@/lib/auth';

type Context = {
  params: Promise<any>
}

function proxyRequest(method: string, subpath: string, search: string, shopId?: string, body?: any): Promise<{ status: number, data: any }> {
  return new Promise((resolve, reject) => {
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (shopId) {
      headers['x-shop-id'] = shopId;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/whatsapp/${subpath}${search}`,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve({ status: res.statusCode || 200, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode || 200, data: rawData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export async function GET(req: NextRequest, context: Context) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path } = await context.params;
    const subpath = path.join('/');
    const url = new URL(req.url);
    
    console.log(`[Proxy GET] subpath="${subpath}", search="${url.search}"`);
    const result = await proxyRequest('GET', subpath, url.search, user.shopId.toString());
    console.log(`[Proxy GET Response] status=${result.status}, dataSize=${JSON.stringify(result.data).length}`);
    
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: any) {
    console.error('[Proxy GET Error]', err);
    return NextResponse.json({ error: err.message || 'WhatsApp helper service is offline.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest, context: Context) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path } = await context.params;
    const subpath = path.join('/');
    const url = new URL(req.url);
    
    let body;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    console.log(`[Proxy POST] subpath="${subpath}", search="${url.search}"`);
    const result = await proxyRequest('POST', subpath, url.search, user.shopId.toString(), body);
    console.log(`[Proxy POST Response] status=${result.status}`);
    
    return NextResponse.json(result.data, { status: result.status });
  } catch (err: any) {
    console.error('[Proxy POST Error]', err);
    return NextResponse.json({ error: err.message || 'WhatsApp helper service is offline.' }, { status: 502 });
  }
}
