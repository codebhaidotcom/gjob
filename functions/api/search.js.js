// GJob.in - Search API

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  
  if (!q) return Response.json([]);
  
  try {
    const fts = await env.DB.prepare(
      `SELECT p.* FROM posts_fts fts JOIN posts p ON fts.rowid = p.id 
       WHERE posts_fts MATCH ? AND p.status = 'published' ORDER BY rank LIMIT 20`
    ).bind(q).all();
    return Response.json(fts.results);
  } catch {
    const fallback = await env.DB.prepare(
      `SELECT * FROM posts WHERE status = 'published' AND (title LIKE ? OR content LIKE ?) LIMIT 20`
    ).bind(`%${q}%`, `%${q}%`).all();
    return Response.json(fallback.results);
  }
}