import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await axios.get('https://httpbin.org/get');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching data from httpbin.org:', error);
    return new Response('Failed to fetch data from httpbin.org', { status: 500 });
  }
}
