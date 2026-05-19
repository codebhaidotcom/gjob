// ============================================
// GJob.in – Trending Posts API (Pro)
// ============================================

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 30);
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  try {
    const { results } = await env.DB.prepare(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image,
             p.important_dates, p.last_date, p.created_at, p.views,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.is_trending = 1
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return new Response(JSON.stringify({
      success: true,
      trending: results,
      pagination: {
        limit,
        offset,
        has_more: results.length === limit
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600', // 10 min CDN cache (trending changes less often)
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch trending posts'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}