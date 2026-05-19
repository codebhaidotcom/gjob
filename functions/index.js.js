// GJob.in - Homepage SSR

export async function onRequest(context) {
  const { env } = context;
  
  const categories = await env.DB.prepare(
    'SELECT * FROM categories ORDER BY sort_order'
  ).all();
  
  const catsWithPosts = await Promise.all(categories.results.map(async cat => {
    const posts = await env.DB.prepare(
      `SELECT title, slug, created_at FROM posts 
       WHERE category_id = ? AND status = 'published' 
       ORDER BY created_at DESC LIMIT 8`
    ).bind(cat.id).all();
    return { ...cat, posts: posts.results };
  }));

  const html = renderHomepage(env, catsWithPosts);
  return new Response(html, { 
    headers: { 'Content-Type': 'text/html; charset=utf-8' } 
  });
}

function renderHomepage(env, categories) {
  const siteName = env.SITE_NAME || "GJob.in";
  
  const blocksHTML = categories.map(cat => `
    <div class="category-block">
      <div class="category-title">${escapeHTML(cat.name)}</div>
      <ul class="post-list">
        ${cat.posts.map(post => `
          <li class="post-item">
            <a href="/jobs/${post.slug}/" class="post-link">
              🔥 ${escapeHTML(post.title)}
            </a>
          </li>
        `).join('')}
        ${cat.posts.length === 0 ? '<li class="post-item"><span class="post-link">No updates yet</span></li>' : ''}
      </ul>
      <div style="text-align:center; padding:10px;">
        <a href="/category/${cat.slug}/" style="color:#e65100; text-decoration:none; font-weight:bold;">
          View All ${escapeHTML(cat.name)} →
        </a>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(siteName)} - Latest Sarkari Jobs, Admit Cards & Results</title>
  <meta name="description" content="Find latest government jobs, admit cards, exam results, syllabus on ${escapeHTML(siteName)}.">
  <meta property="og:title" content="${escapeHTML(siteName)} - Government Jobs">
  <meta property="og:description" content="Latest Sarkari Result, Admit Cards, Answer Keys.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${env.SITE_URL}/">
  <link rel="canonical" href="${env.SITE_URL}/">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="header">
    <a href="/" class="logo">${escapeHTML(siteName)}</a>
  </header>
  <div class="container">
    <div class="search-container">
      <input type="text" class="search-input" id="searchBox" placeholder="Search jobs, admit cards, results...">
      <button onclick="window.location.href='/search/?q='+encodeURIComponent(document.getElementById('searchBox').value)" class="search-btn">🔍 Search</button>
    </div>
    <div class="flash-news">
      📢 Stay Updated: Always refresh ${escapeHTML(siteName)} for fast alerts on new job notifications!
    </div>
    <main class="category-grid">
      ${blocksHTML}
    </main>
  </div>
  <footer class="footer">
    <p>© 2026 ${escapeHTML(siteName)} | India's Fast Job Portal Network</p>
    <p><a href="/sitemap.xml" style="color:#ffd54f;">Sitemap</a> | <a href="/contact" style="color:#ffd54f;">Contact</a></p>
  </footer>
  <script src="/assets/js/app.js"></script>
</body>
</html>`;
}

function escapeHTML(str) {
  return str?.replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]) || '';
}