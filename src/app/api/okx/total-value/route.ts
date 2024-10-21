import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;
  const projectId = process.env.OKX_PROJECT_ID;

  if (!apiKey || !secretKey || !passphrase || !projectId) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  // 从查询参数中获取以太坊地址
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid or missing Ethereum address' }, { status: 400 });
  }

  // 固定 chains 和 assetType 值
  const chains = '1'; // Ethereum mainnet
  const assetType = '0'; // 所有资产类型

  const baseUrl = 'https://www.okx.com';
  const endpoint = '/api/v5/wallet/asset/total-value-by-address';
  const queryParams = `address=${address}&chains=${chains}&assetType=${assetType}`;
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
    'OK-ACCESS-PASSPHRASE': passphrase,
    'OK-ACCESS-PROJECT': projectId
  };

  try {
    const response = await axios.get(`${baseUrl}${requestPath}`, {
      headers: headers
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'An unknown error occurred';
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from OKX', details: errorMessage }, { status: 500 });
  }
}
