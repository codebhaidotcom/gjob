// GJob.in - Cache Helper

export async function getCachedResponse(context, key, ttl, fetchFn) {
  const cache = caches.default;
  const url = `https://cache.internal/${key}`;
  let response = await cache.match(url);
  
  if (!response) {
    const data = await fetchFn();
    response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    context.ctx.waitUntil(cache.put(url, response.clone()));
  }
  
  return response.json();
}