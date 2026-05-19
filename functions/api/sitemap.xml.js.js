// ============================================
// GJob.in – Pro‑Level Dynamic Sitemap Generator
// ============================================

export async function onRequest(context) {
  const { env, ctx } = context;
  const cache = caches.default;
  const url = new URL(context.request.url);
  const cacheKey = url.href;

  // 1. Serve from cache if available (TTL 12 hours)
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // 2. Fetch all data in parallel for speed
  const [categories, posts, staticPages] = await Promise.all([
    env.DB.prepare(`SELECT slug, updated_at FROM categories WHERE status = 'active' ORDER BY sort_order`).all(),
    env.DB.prepare(`SELECT slug, updated_at, category_id FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 5000`).all(),
    getStaticPages(env)
  ]);

  // 3. Build XML with array (faster than string concatenation)
  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">');

  // 4. Homepage – highest priority
  xml.push(`  <url><loc>${env.SITE_URL}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`);

  // 5. Static pages (About, Contact, Privacy, etc.)
  staticPages.forEach(page => {
    xml.push(`  <url><loc>${env.SITE_URL}${page.url}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
  });

  // 6. Category pages – high priority
  categories.results.forEach(cat => {
    xml.push(`  <url><loc>${env.SITE_URL}/category/${cat.slug}/</loc><changefreq>daily</changefreq><priority>0.8</priority>`);
  });

  // 7. Post pages – with multiple route support
  posts.results.forEach(post => {
    const lastmod = post.updated_at 
      ? new Date(post.updated_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // Main post URL (jobs route)
    xml.push(`  <url>`);
    xml.push(`    <loc>${env.SITE_URL}/jobs/${post.slug}/</loc>`);
    xml.push(`    <lastmod>${lastmod}</lastmod>`);
    xml.push(`    <changefreq>weekly</changefreq>`);
    xml.push(`    <priority>0.7</priority>`);
    xml.push(`  </url>`);

    // Also add category-specific URLs for better indexing
    const categorySlug = getCategorySlug(post.category_id, categories.results);
    if (categorySlug && categorySlug !== 'latest-jobs') {
      xml.push(`  <url>`);
      xml.push(`    <loc>${env.SITE_URL}/${categorySlug}/${post.slug}/</loc>`);
      xml.push(`    <lastmod>${lastmod}</lastmod>`);
      xml.push(`    <changefreq>weekly</changefreq>`);
      xml.push(`    <priority>0.6</priority>`);
      xml.push(`  </url>`);
    }
  });

  xml.push('</urlset>');

  // 8. Create response with proper headers
  const sitemap = xml.join('\n');
  response = new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=43200', // 12 hours browser cache
      'CDN-Cache-Control': 'public, max-age=43200',
      'X-Content-Type-Options': 'nosniff'
    }
  });

  // 9. Store in edge cache for 12 hours
  ctx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

/**
 * Get static pages that should be in sitemap
 */
function getStaticPages(env) {
  return [
    { url: '/about' },
    { url: '/contact' },
    { url: '/privacy-policy' },
    { url: '/disclaimer' },
    { url: '/terms' },
    { url: '/university-updates' },
    { url: '/board-exams' },
    { url: '/career-scope' },
    { url: '/government-schemes' },
    { url: '/search' }
  ];
}

/**
 * Get category slug from category ID
 */
function getCategorySlug(categoryId, categories) {
  const cat = categories.find(c => c.id === categoryId);
  return cat ? cat.slug : null;
}