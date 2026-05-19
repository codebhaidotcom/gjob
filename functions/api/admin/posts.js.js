// GJob.in - Admin Posts CRUD

import { json } from '../../utils/response';

export async function onRequest(context) {
  const { request, env } = context;
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (auth !== env.ADMIN_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // GET single post
  if (request.method === 'GET' && id) {
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
    return json({ post });
  }
  
  // GET all posts
  if (request.method === 'GET') {
    const posts = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50').all();
    return json({ posts: posts.results });
  }
  
  // POST create
  if (request.method === 'POST') {
    const body = await request.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    await env.DB.prepare(`
      INSERT INTO posts (title, slug, category_id, content, important_dates, application_fee, age_limit, eligibility, official_link, apply_link, last_date, correction_last_date, exam_date, is_trending)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title, slug, body.category_id, body.content, body.important_dates,
      body.application_fee, body.age_limit, body.eligibility, body.official_link,
      body.apply_link, body.last_date, body.correction_last_date, body.exam_date,
      body.is_trending || 0
    ).run();
    
    return json({ success: true, slug });
  }
  
  // PUT update
  if (request.method === 'PUT' && id) {
    const body = await request.json();
    
    await env.DB.prepare(`
      UPDATE posts SET title=?, category_id=?, content=?, important_dates=?, application_fee=?,
      age_limit=?, eligibility=?, official_link=?, apply_link=?, last_date=?,
      correction_last_date=?, exam_date=?, is_trending=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      body.title, body.category_id, body.content, body.important_dates,
      body.application_fee, body.age_limit, body.eligibility, body.official_link,
      body.apply_link, body.last_date, body.correction_last_date, body.exam_date,
      body.is_trending || 0, id
    ).run();
    
    return json({ success: true });
  }
  
  // DELETE
  if (request.method === 'DELETE' && id) {
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    return json({ success: true });
  }
  
  return json({ error: 'Method not allowed' }, 405);
}