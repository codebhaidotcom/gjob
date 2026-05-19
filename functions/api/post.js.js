// ============================================
// GJob.in – Posts API with Filtering & Pagination (Pro)
// ============================================

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // Query parameters
  const categorySlug = url.searchParams.get('category') || '';
  const searchQuery = url.searchParams.get('search') || '';
  const statusFilter = url.searchParams.get('status') || 'published';
  const sortBy = url.searchParams.get('sort') || 'created_at'; // created_at, views, last_date
  const order = url.searchParams.get('order') || 'DESC'; // ASC or DESC
  const page = Math.max(parseInt(url.searchParams.get('page')) || 1, 1);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let bindValues = [];

    // Base status condition (admin could request 'draft' if authenticated, but here public only 'published')
    if (statusFilter === 'published' || statusFilter === 'draft') {
      whereConditions.push(`p.status = ?`);
      bindValues.push(statusFilter);
    } else {
      // Default to published for public API
      whereConditions.push(`p.status = 'published'`);
    }

    // Category filter
    if (categorySlug) {
      const cat = await env.DB.prepare(`SELECT id FROM categories WHERE slug = ?`).bind(categorySlug).first();
      if (cat) {
        whereConditions.push(`p.category_id = ?`);
        bindValues.push(cat.id);
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Category not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Search filter
    if (searchQuery) {
      whereConditions.push(`(p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)`);
      const searchPattern = `%${searchQuery}%`;
      bindValues.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['created_at', 'views', 'last_date', 'title'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total matching posts
    const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...bindValues).first();
    const totalPosts = countResult?.total || 0;

    // Fetch posts with pagination
    const dataQuery = `
      SELECT p.id, p.title, p.slug, p.excerpt, p.content,
             p.featured_image, p.important_dates, p.application_fee,
             p.age_limit, p.last_date, p.correction_last_date, p.exam_date,
             p.views, p.is_trending, p.created_at, p.updated_at,
             c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${safeSortBy} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    const postsResult = await env.DB.prepare(dataQuery).bind(...bindValues, limit, offset).all();

    const totalPages = Math.ceil(totalPosts / limit);

    return new Response(JSON.stringify({
      success: true,
      posts: postsResult.results,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalPosts,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120', // 2 min for fresh content
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch posts'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}