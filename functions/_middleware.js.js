// GJob.in - Global Middleware
// Rate Limiting + Security Headers

const rateLimitMap = new Map();

export async function onRequest(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // Rate limiting: 100 requests per minute per IP
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 100;
  
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  
  if (timestamps.length > maxRequests) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // Pass env to downstream functions
  context.env = env;

  const response = await context.next();

  // Add security headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-XSS-Protection', '1; mode=block');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}