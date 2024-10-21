export async function GET() {
    try {
      const response = await fetch('https://httpbin.org/get');
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      return new Response('Failed to fetch data from httpbin.org', { status: 500 });
    }
  }