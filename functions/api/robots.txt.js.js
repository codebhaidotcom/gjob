// GJob.in - Dynamic robots.txt

export async function onRequest(context) {
  const { env } = context;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${env.SITE_URL}/sitemap.xml\n`;
  return new Response(robots, { headers: { 'Content-Type': 'text/plain' } });
}