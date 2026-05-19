// GJob.in - Search Page SSR

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  let results = [];

  if (q) {
    try {
      const fts = await env.DB.prepare(
        `SELECT p.*, c.name as category_name 
         FROM posts_fts fts 
         JOIN posts p ON fts.rowid = p.id 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE posts_fts MATCH ? AND p.status = 'published' 
         ORDER BY rank LIMIT 30`
      ).bind(q).all();
      results = fts.results;
    } catch {
      const fallback = await env.DB.prepare(
        `SELECT p.*, c.name as category_name 
         FROM posts p LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.status = 'published' AND (p.title LIKE ? OR p.content LIKE ?) 
         LIMIT 30`
      ).bind(`%${q}%`, `%${q}%`).all();
      results = fallback.results;
    }
  }

  const html = renderSearch(env, q, results);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function renderSearch(env, q, posts) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Search "${escapeHTML(q)}" – ${escapeHTML(env.SITE_NAME)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="header"><a href="/" class="logo">${escapeHTML(env.SITE_NAME)}</a></header>
  <div class="container">
    <form class="search-container" action="/search/" method="get">
      <input type="text" name="q" class="search-input" value="${escapeHTML(q)}" placeholder="Search jobs, results...">
      <button type="submit" class="search-btn">🔍 Search</button>
    </form>
    ${q ? `<h2>Results for "${escapeHTML(q)}" (${posts.length} found)</h2>` : '<h2>Search Government Jobs</h2>'}
    <ul class="post-list" style="border:1px solid #e0e0e0; border-radius:8px; background:white;">
      ${posts.map(p => `
        <li class="post-item">
          <a href="/jobs/${p.slug}/" class="post-link">
            ${escapeHTML(p.title)}
            <small style="color:#666;">(${p.category_name || ''})</small>
          </a>
        </li>
      `).join('')}
      ${posts.length === 0 && q ? '<li class="post-item"><span class="post-link">No results found. Try different keywords.</span></li>' : ''}
    </ul>
  </div>
  <footer class="footer">© 2026 ${escapeHTML(env.SITE_NAME)}</footer>
</body>
</html>`;
}

function escapeHTML(str) {
  return str?.replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]) || '';
}