// ============================================
// GJob.in – Enterprise SEO & Schema Engine (v3.0)
// ============================================

import { sanitizeHTML } from './sanitizer';

// ---------- Helpers ----------

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function escapeAttribute(str) {
  if (!str) return '';
  // Must escape & first to avoid double-encoding
  return str.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

/**
 * ISO 8601 date normalizer (handles DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, timestamps)
 */
export function toISODate(dateInput, fallbackDays = 90) {
  if (!dateInput) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + fallbackDays);
    return fallback.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) 
      ? new Date(Date.now() + fallbackDays * 86400000).toISOString()
      : d.toISOString();
  }
  const match = String(dateInput).match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(`${yyyy}-${mm}-${dd}T23:59:59+05:30`).toISOString();
  }
  const parsed = new Date(dateInput);
  return !isNaN(parsed.getTime()) 
    ? parsed.toISOString()
    : new Date(Date.now() + fallbackDays * 86400000).toISOString();
}

/**
 * Safe JSON‑LD embedding (prevents script injection)
 */
function safeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ---------- Meta Tags ----------

export function generateMetaTags(env, options = {}) {
  const {
    title = env.SITE_NAME,
    description = 'Latest Government Jobs, Sarkari Results, Admit Cards, Answer Keys.',
    canonical = env.SITE_URL,
    image = `${env.SITE_URL}/assets/images/og-image.jpg`,
    type = 'website',
    noindex = false,
    keywords = '',
    lang = 'en',
    publishedTime = null,
    modifiedTime = null
  } = options;

  const siteName = env.SITE_NAME;
  const tags = [];

  tags.push(`<title>${escapeHTML(title)}</title>`);
  tags.push(`<meta name="description" content="${escapeAttribute(description)}">`);
  if (keywords) tags.push(`<meta name="keywords" content="${escapeAttribute(keywords)}">`);
  tags.push(`<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">`);
  tags.push(`<meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`);
  tags.push(`<meta name="author" content="${escapeAttribute(siteName)}">`);
  tags.push(`<meta name="theme-color" content="#0d47a1">`);
  tags.push(`<link rel="canonical" href="${canonical}">`);
  tags.push(`<meta http-equiv="content-language" content="${lang}">`);
  tags.push(`<link rel="alternate" hreflang="${lang}" href="${canonical}">`);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${canonical}">`);

  // Performance hints
  tags.push(`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`);

  // Open Graph
  tags.push(`<meta property="og:title" content="${escapeAttribute(title)}">`);
  tags.push(`<meta property="og:description" content="${escapeAttribute(description)}">`);
  tags.push(`<meta property="og:url" content="${canonical}">`);
  tags.push(`<meta property="og:image" content="${image}">`);
  tags.push(`<meta property="og:image:width" content="1200">`);
  tags.push(`<meta property="og:image:height" content="630">`);
  tags.push(`<meta property="og:image:alt" content="${escapeAttribute(title)}">`);
  tags.push(`<meta property="og:type" content="${type}">`);
  tags.push(`<meta property="og:site_name" content="${escapeAttribute(siteName)}">`);
  tags.push(`<meta property="og:locale" content="en_IN">`);
  if (publishedTime) tags.push(`<meta property="article:published_time" content="${publishedTime}">`);
  if (modifiedTime) tags.push(`<meta property="article:modified_time" content="${modifiedTime}">`);

  // Twitter
  tags.push(`<meta name="twitter:card" content="summary_large_image">`);
  tags.push(`<meta name="twitter:title" content="${escapeAttribute(title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeAttribute(description)}">`);
  tags.push(`<meta name="twitter:image" content="${image}">`);
  tags.push(`<meta name="twitter:url" content="${canonical}">`);

  return tags.join('\n');
}

// ---------- Structured Data Schemas ----------

export function generateOrganizationSchema(env) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": env.SITE_NAME,
    "url": env.SITE_URL,
    "logo": `${env.SITE_URL}/assets/images/logo.svg`,
    "sameAs": [
      env.SITE_URL,
      "https://t.me/gjob",
      "https://whatsapp.com/channel/gjob"
    ]
  };
}

export function generateWebSiteSchema(env) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": env.SITE_NAME,
    "url": env.SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${env.SITE_URL}/search/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateArticleSchema(post, env) {
  const image = post.featured_image 
    ? `${env.SITE_URL}/uploads/posts/${post.featured_image}`
    : `${env.SITE_URL}/assets/images/og-image.jpg`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.excerpt || post.meta_description || '',
    "image": image,
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "inLanguage": "en-IN",
    "isAccessibleForFree": true,
    "articleSection": post.category_name || '',
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".post-title", ".post-excerpt"]
    },
    "author": {
      "@type": "Organization",
      "name": env.SITE_NAME,
      "url": env.SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": env.SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${env.SITE_URL}/assets/images/logo.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${env.SITE_URL}/jobs/${post.slug}/`
    }
  };
}

/**
 * Google Jobs Optimized JobPosting
 */
export function generateJobPostingSchema(post, env) {
  const validThrough = toISODate(post.last_date);

  // Dynamic location
  const address = {
    "@type": "PostalAddress",
    "streetAddress": post.address || undefined,
    "addressLocality": post.city || undefined,
    "addressRegion": post.state || undefined,
    "postalCode": post.pincode || undefined,
    "addressCountry": "IN"
  };
  // Clean undefined fields
  Object.keys(address).forEach(k => { if (!address[k]) delete address[k]; });

  let jobLocation;
  if (post.locations && Array.isArray(post.locations)) {
    jobLocation = post.locations.map(loc => ({
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": loc.city,
        "addressRegion": loc.state,
        "addressCountry": "IN"
      }
    }));
  } else {
    jobLocation = { "@type": "Place", "address": address };
  }

  // Remote detection
  const remoteKeywords = ['remote', 'work from home', 'wfh', 'telecommute'];
  const isRemote = remoteKeywords.some(k => 
    (post.job_type && post.job_type.toLowerCase().includes(k)) ||
    (post.title && post.title.toLowerCase().includes(k))
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": post.title,
    "description": sanitizeHTML(post.content || '', { allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'b'] }),
    "datePosted": post.created_at,
    "validThrough": validThrough,
    "employmentType": ["FULL_TIME"],
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Government of India",
      "sameAs": "https://www.india.gov.in",
      "logo": `${env.SITE_URL}/assets/images/logo.png`
    },
    "jobLocation": jobLocation,
    "identifier": {
      "@type": "PropertyValue",
      "name": env.SITE_NAME,
      "value": String(post.id)
    },
    "directApply": true,
    "isAccessibleForFree": true
  };

  if (isRemote) {
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = {
      "@type": "Country",
      "name": "India"
    };
  }

  if (post.salary_min || post.salary_max) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": post.salary_min || 0,
        "maxValue": post.salary_max || 0,
        "unitText": "MONTH"
      }
    };
  }

  return schema;
}

export function generateEventSchema(countdown, env) {
  if (!countdown || !countdown.date) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": countdown.title + ' - ' + env.SITE_NAME,
    "startDate": new Date(countdown.date + 'T23:59:59+05:30').toISOString(),
    "description": countdown.label,
    "eventStatus": "https://schema.org/EventScheduled",
    "organizer": { "@type": "Organization", "name": env.SITE_NAME }
  };
}

export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };
}

// ---------- JSON‑LD Renderer (XSS safe) ----------

export function renderSchemas(schemas) {
  if (!Array.isArray(schemas)) schemas = [schemas];
  return schemas
    .filter(Boolean)
    .map(schema => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`)
    .join('\n');
}