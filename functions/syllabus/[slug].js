// ============================================
// GJob.in - Syllabus Single Post SSR
// ============================================
import { getCountdown } from '../../utils/countdown';
import { sanitizeHTML } from '../../utils/sanitizer';
import {
  generateMetaTags,
  generateArticleSchema,
  generateEventSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  renderSchemas
} from '../../utils/seo';

export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;
  
  const post = await env.DB.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.slug = ? AND p.status = 'published'`
  ).bind(slug).first();

  if (!post) return new Response('Not Found', { status: 404 });

  await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(post.id).run();

  const countdown = getCountdown(post);
  const canonical = `${env.SITE_URL}/syllabus/${slug}/`;

  // Breadcrumb
  const breadcrumbItems = [
    { name: 'Home', url: env.SITE_URL },
    { name: 'Syllabus', url: `${env.SITE_URL}/category/syllabus/` },
    { name: post.title, url: canonical }
  ];

  // Build all schemas
  const schemas = [
    generateOrganizationSchema(env),
    generateWebSiteSchema(env),
    generateBreadcrumbSchema(breadcrumbItems),
    generateArticleSchema(post, env),
  ];

  if (countdown) {
    schemas.push(generateEventSchema(countdown, env));
  }

  // Meta tags
  const meta = generateMetaTags(env, {
    title: post.meta_title || post.title + ' – ' + env.SITE_NAME,
    description: post.meta_description || post.excerpt || '',
    canonical,
    image: post.featured_image ? `${env.SITE_URL}/uploads/posts/${post.featured_image}` : undefined,
    type: 'article',
    keywords: post.meta_keywords || 'syllabus, exam pattern, ' + post.title,
    publishedTime: post.created_at,
    modifiedTime: post.updated_at
  });

  // Countdown HTML
  const countdownHTML = countdown ? `
    <div class="countdown" style="background:${countdown.color};color:white;padding:20px;border-radius:12px;margin:20px 0;text-align:center;">
      <h2>⏰ ${countdown.title}</h2>
      <p>${countdown.label}</p>
      <div class="timer" data-target="${countdown.target.toISOString()}">
        <span class="days">00</span>d : <span class="hours">00</span>h : <span class="minutes">00</span>m : <span class="seconds">00</span>s
      </div>
      <p><strong>📅 ${countdown.target.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</strong></p>
    </div>` : '';

  // Full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${meta}
  ${renderSchemas(schemas)}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="header"><a href="/" class="logo">${env.SITE_NAME}</a></header>
  <div class="container">
    <article class="post">
      <h1>${sanitizeHTML(post.title)}</h1>
      <div class="meta">📅 ${new Date(post.created_at).toLocaleDateString('en-IN')} | 📂 Syllabus | 👁️ ${post.views} views</div>
      ${countdownHTML}
      ${post.important_dates ? `<div class="dates"><h3>📋 Important Dates</h3>${sanitizeHTML(post.important_dates).replace(/\n/g,'<br>')}</div>` : ''}
      <div class="content">${sanitizeHTML(post.content)}</div>
      ${post.apply_link ? `<a href="${sanitizeHTML(post.apply_link)}" class="btn-apply" target="_blank" rel="nofollow noopener">📚 Download Syllabus PDF</a>` : ''}
      ${post.official_link ? `<p><a href="${sanitizeHTML(post.official_link)}" target="_blank" rel="nofollow noopener">📎 Official Website</a></p>` : ''}
    </article>
    <div class="ad-slot">[AdSense - In Content]</div>
  </div>
  <footer class="footer">© 2026 ${env.SITE_NAME}</footer>
  <script src="/assets/js/countdown.js"></script>
  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}