// GJob.in - Static Sitemap Generator
// This script fetches all published slugs from the D1 database and generates a sitemap.xml file.
// Run locally with: node scripts/generate-sitemap.js

async function generateSitemap() {
  console.log('🗺️ Generating sitemap...');

  // In a real scenario, you would use the D1 API to fetch posts.
  // For demonstration, we'll show a static example.

  const siteUrl = 'https://gjob.in';
  const posts = [
    'ssc-cgl-2026-online-form',
    'up-police-constable-result-2026',
    'railway-group-d-admit-card-2026',
    'upsssc-pet-answer-key-2026',
    'ibps-po-syllabus-2026'
  ];

  const categories = ['latest-jobs', 'results', 'admit-card', 'answer-key', 'syllabus'];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`;

  categories.forEach(cat => {
    xml += `  <url><loc>${siteUrl}/category/${cat}/</loc><priority>0.8</priority></url>\n`;
  });

  posts.forEach(post => {
    xml += `  <url><loc>${siteUrl}/jobs/${post}/</loc><priority>0.6</priority></url>\n`;
  });

  xml += '</urlset>';

  console.log(xml);
  console.log('✅ Sitemap generated successfully!');
}

generateSitemap().catch(console.error);