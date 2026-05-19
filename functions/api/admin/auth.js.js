// GJob.in - Admin Auth

import { json } from '../../utils/response';

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'POST') {
    const { key } = await request.json();
    if (key === env.ADMIN_KEY) {
      return json({ token: key });
    }
    return json({ error: 'Invalid key' }, 401);
  }
  
  return json({ error: 'Method not allowed' }, 405);
}