// GJob.in - Single Post SSR (Jobs)

import { getCountdown } from '../../utils/countdown';
import { sanitizeHTML } from '../../utils/sanitizer';
import { generateMetaTags, generateStructuredData } from '../../utils/seo';

export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;
  
  const post = await env.DB.prepare(
    `SELECT p.*, c.name as category_name 
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id 
     WHERE p.slug = ? AND p.status = 'published'`
  ).bind(slug).first();

  if (!post) return new Response('Not Found', { status: 404 });

  await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(post.id).run();

  const countdown = getCountdown(post);
  const canonical = `${env.SITE_URL}/jobs/${slug}/`;
  const meta = generateMetaTags(env, post.title + ' – ' + env.SITE_NAME, post.excerpt || '', canonical);
  const schema = JSON.stringify(generateStructuredData(post, env));

  const countdownHTML = countdown ? `
    <div class="countdown" style="background:${countdown.color};color:white;padding:20px;border-radius:12px;margin:20px 0;text-align:center;">
      <h2>⏰ ${countdown.title}</h2>
      <p>${countdown.label}</p>
      <div class="timer" data-target="${countdown.target.toISOString()}">
        <span class="days">00</span>d : <span class="hours">00</span>h : <span class="minutes">00</span>m : <span class="seconds">00</span>s
      </div>
      <p><strong>📅 ${countdown.target.toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</strong></p>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  ${meta}
  <script type="application/ld+json">${schema}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="header"><a href="/" class="logo">${env.SITE_NAME}</a></header>
  <div class="container">
    <article class="post">
      <h1>${sanitizeHTML(post.title)}</h1>
      <div class="meta">
        📅 ${new Date(post.created_at).toLocaleDateString('en-IN')} | 📂 ${sanitizeHTML(post.category_name)} | 👁️ ${post.views} views
      </div>
      ${countdownHTML}
      ${post.important_dates ? `<div class="dates"><h3>📋 Important Dates</h3>${sanitizeHTML(post.important_dates).replace(/\n/g,'<br>')}</div>` : ''}
      ${post.application_fee ? `<p><strong>💰 Application Fee:</strong> ${sanitizeHTML(post.application_fee)}</p>` : ''}
      ${post.age_limit ? `<p><strong>🎂 Age Limit:</strong> ${sanitizeHTML(post.age_limit)}</p>` : ''}
      ${post.eligibility ? `<p><strong>🎓 Eligibility:</strong> ${sanitizeHTML(post.eligibility)}</p>` : ''}
      <div class="content">${sanitizeHTML(post.content)}</div>
      ${post.apply_link ? `<a href="${sanitizeHTML(post.apply_link)}" class="btn-apply" target="_blank" rel="nofollow noopener">🚀 Apply Online Now</a>` : ''}
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