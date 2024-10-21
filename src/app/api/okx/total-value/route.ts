import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

async function fetchTotalValueByAddress(address: string, apiKey: string, secretKey: string, passphrase: string, projectId: string) {
  const baseUrl = 'https://www.okx.com';
  const endpoint = '/api/v5/wallet/asset/total-value-by-address';
  const chains = '1'; // Ethereum mainnet
  const assetType = '0'; // 所有资产类型
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
    return response.data;
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error) ? error.message : 'An unknown error occurred';
    console.error('Error:', error);
    throw new Error(`Failed to fetch data from OKX: ${errorMessage}`);
  }
}

function signData(data: string, privateKey: string): string {
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = key.sign(data);
  return signature.toDER('hex');
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;
  const projectId = process.env.OKX_PROJECT_ID;
  const privateKey = process.env.ECDSA_PRIVATE_KEY; // Assume you have this in your environment variables

  if (!apiKey || !secretKey || !passphrase || !projectId || !privateKey) {
    return NextResponse.json({ error: 'Missing API credentials or private key' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid or missing Ethereum address' }, { status: 400 });
  }

  try {
    const data = await fetchTotalValueByAddress(address, apiKey, secretKey, passphrase, projectId);
    const totalValue = data.data[0].totalValue;
    const integerValue = Math.floor(parseFloat(totalValue)).toString();
    
    // Combine integerValue and address for signing
    const dataToSign = integerValue + address;
    const signature = signData(dataToSign, privateKey);

    return NextResponse.json({
      code: "0",
      msg: "success",
      data: [
        {
          totalValue: integerValue,
          signature: signature
        }
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
