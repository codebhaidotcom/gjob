// GJob.in - Home API (JSON)

export async function onRequest(context) {
  const { env } = context;
  
  const categories = await env.DB.prepare(
    'SELECT * FROM categories ORDER BY sort_order'
  ).all();
  
  const result = await Promise.all(categories.results.map(async cat => {
    const posts = await env.DB.prepare(
      'SELECT title, slug, created_at FROM posts WHERE category_id = ? AND status = ? ORDER BY created_at DESC LIMIT 6'
    ).bind(cat.id, 'published').all();
    return { ...cat, posts: posts.results };
  }));
  
  return Response.json(result);
}