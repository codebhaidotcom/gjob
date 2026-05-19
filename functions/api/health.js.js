// ============================================
// GJob.in – Pro‑Level Health Check Endpoint
// ============================================

export async function onRequest(context) {
  const { env, request } = context;
  const startTime = Date.now();
  const checks = {};

  // 1. Database connectivity
  try {
    const dbStart = Date.now();
    await env.DB.prepare('SELECT 1').first();
    checks.database = {
      status: 'ok',
      latency_ms: Date.now() - dbStart
    };
  } catch (e) {
    checks.database = {
      status: 'error',
      message: e.message
    };
  }

  // 2. FTS5 search check
  try {
    const ftsStart = Date.now();
    await env.DB.prepare("SELECT rowid FROM posts_fts LIMIT 1").first();
    checks.fts_search = {
      status: 'ok',
      latency_ms: Date.now() - ftsStart
    };
  } catch (e) {
    checks.fts_search = {
      status: 'error',
      message: e.message
    };
  }

  // 3. KV Cache check (if configured)
  if (env.CACHE) {
    try {
      const kvStart = Date.now();
      await env.CACHE.put('health_check', 'ok', { expirationTtl: 60 });
      await env.CACHE.get('health_check');
      checks.kv_cache = {
        status: 'ok',
        latency_ms: Date.now() - kvStart
      };
    } catch (e) {
      checks.kv_cache = {
        status: 'error',
        message: e.message
      };
    }
  }

  // 4. Edge cache check
  try {
    const cache = caches.default;
    const cacheUrl = 'https://health-check.internal/';
    const testResponse = new Response('ok', {
      headers: { 'Cache-Control': 'public, max-age=10' }
    });
    await cache.put(cacheUrl, testResponse.clone());
    const cached = await cache.match(cacheUrl);
    await cache.delete(cacheUrl);
    checks.edge_cache = {
      status: cached ? 'ok' : 'warn',
      message: cached ? 'Cache working' : 'Cache miss'
    };
  } catch (e) {
    checks.edge_cache = {
      status: 'error',
      message: e.message
    };
  }

  // 5. Environment variables check
  const requiredVars = ['SITE_URL', 'SITE_NAME', 'ADMIN_KEY', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(v => !env[v]);
  checks.environment = {
    status: missingVars.length === 0 ? 'ok' : 'warn',
    missing: missingVars.length > 0 ? missingVars : undefined
  };

  // 6. Posts count (quick stats)
  try {
    const statsStart = Date.now();
    const totalPosts = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM posts WHERE status = 'published'"
    ).first();
    const totalCategories = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM categories WHERE status = 'active'"
    ).first();
    checks.stats = {
      status: 'ok',
      total_posts: totalPosts.count,
      total_categories: totalCategories.count,
      latency_ms: Date.now() - statsStart
    };
  } catch (e) {
    checks.stats = {
      status: 'error',
      message: e.message
    };
  }

  // 7. Worker info
  const workerInfo = {
    version: '3.0.0',
    environment: env.ENVIRONMENT || 'production',
    node_version: process?.version || 'N/A',
    uptime_seconds: Math.floor(process?.uptime?.() || 0),
    memory_mb: Math.round(process?.memoryUsage?.()?.heapUsed / 1024 / 1024 || 0),
    region: request.headers.get('cf-ray')?.split('-')[0] || 'unknown',
    colo: request.cf?.colo || 'unknown'
  };

  // 8. Overall status
  const isHealthy = Object.values(checks).every(c => c.status === 'ok');

  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    response_time_ms: Date.now() - startTime,
    version: '3.0.0',
    checks,
    worker: workerInfo,
    urls: {
      sitemap: `${env.SITE_URL}/sitemap.xml`,
      rss: `${env.SITE_URL}/rss.xml`,
      robots: `${env.SITE_URL}/robots.txt`,
      admin: `${env.SITE_URL}/admin.html`
    }
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: isHealthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': isHealthy ? 'PASS' : 'FAIL'
    }
  });
}