export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const fileUrl = url.searchParams.get("url");
  const filename = url.searchParams.get("filename");

  if (!fileUrl) {
    return new Response("URL parameter is required", { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.statusText}`, { status: response.status });
    }

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    if (filename) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    } else {
      headers.set('Content-Disposition', 'attachment');
    }
    
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: 200,
      headers
    });
  } catch (err: any) {
    console.error('Proxy error:', err);
    return new Response('Error proxying request', { status: 500 });
  }
}
