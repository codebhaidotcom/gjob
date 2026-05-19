// GJob.in - Category Page SSR

export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;
  
  const cat = await env.DB.prepare(
    'SELECT * FROM categories WHERE slug = ?'
  ).bind(slug).first();
  
  if (!cat) return new Response('Category not found', { status: 404 });
  
  const posts = await env.DB.prepare(
    `SELECT title, slug, created_at FROM posts 
     WHERE category_id = ? AND status = 'published' 
     ORDER BY created_at DESC LIMIT 50`
  ).bind(cat.id).all();
  
  const html = renderCategory(env, cat, posts.results);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function renderCategory(env, cat, posts) {
  const siteName = env.SITE_NAME;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(cat.name)} – ${escapeHTML(siteName)}</title>
  <meta name="description" content="${escapeHTML(cat.name)} updates on ${escapeHTML(siteName)}. Latest notifications and alerts.">
  <link rel="canonical" href="${env.SITE_URL}/category/${cat.slug}/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="header"><a href="/" class="logo">${escapeHTML(siteName)}</a></header>
  <div class="container">
    <h1 style="margin:20px 0; color:#0d47a1;">${escapeHTML(cat.name)}</h1>
    <ul class="post-list" style="border:1px solid #e0e0e0; border-radius:8px; background:white;">
      ${posts.map(post => `
        <li class="post-item">
          <a href="/jobs/${post.slug}/" class="post-link">${escapeHTML(post.title)}</a>
        </li>
      `).join('')}
      ${posts.length === 0 ? '<li class="post-item"><span class="post-link">No posts yet in this category</span></li>' : ''}
    </ul>
  </div>
  <footer class="footer">© 2026 ${escapeHTML(siteName)}</footer>
</body>
</html>`;
}

function escapeHTML(str) {
  return str?.replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]) || '';
}