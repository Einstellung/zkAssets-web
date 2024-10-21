import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

export async function GET() {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  const baseUrl = 'https://www.okx.com';
  const endpoint = '/api/v5/dex/aggregator/all-tokens';
  const queryParams = 'chainId=1';
  const requestPath = `${endpoint}?${queryParams}`;

  const timestamp = new Date().toISOString();
  const method = 'GET';
  const signString = `${timestamp}${method}${requestPath}`;
  const signature = crypto.createHmac('sha256', secretKey)
                          .update(signString)
                          .digest('base64');

  const headers = {
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase
  };

  try {
    const response = await axios.get(`${baseUrl}${requestPath}`, {
      headers: headers
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from OKX', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
