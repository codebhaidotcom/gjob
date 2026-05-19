// GJob.in - RSS Feed

export async function onRequest(context) {
  const { env } = context;
  const posts = await env.DB.prepare(
    "SELECT title, slug, created_at, excerpt FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 50"
  ).all();
  
  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${env.SITE_NAME}</title>\n    <link>${env.SITE_URL}</link>\n    <description>Latest Government Jobs, Results, Admit Cards</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
  
  posts.results.forEach(post => {
    rss += `    <item>\n      <title>${escapeXML(post.title)}</title>\n      <link>${env.SITE_URL}/jobs/${post.slug}/</link>\n      <description>${escapeXML(post.excerpt || '')}</description>\n      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>\n    </item>\n`;
  });
  
  rss += '  </channel>\n</rss>';
  return new Response(rss, { headers: { 'Content-Type': 'application/rss+xml' } });
}

function escapeXML(str) {
  return str?.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') || '';
}