// ============================================
// GJob.in – Secure HTML Sanitizer (Bug‑fixed)
// ============================================

/**
 * Sanitize HTML content. 
 * Always removes dangerous tags/attributes, then optionally preserves only allowed tags.
 * @param {string} dirty - Raw HTML
 * @param {object} options - { allowedTags: ['p','br','strong',...] }
 * @returns {string} Clean HTML or plain text
 */
export function sanitizeHTML(dirty, options = {}) {
  if (!dirty) return '';
  const { allowedTags = [] } = options;

  let clean = String(dirty);

  // 1. Remove dangerous blocks completely
  clean = clean
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '') // HTML comments
    .replace(/on\w+="[^"]*"/gi, '')   // inline event handlers
    .replace(/javascript:/gi, '');    // javascript: URLs

  // 2. If allowedTags specified, keep only those tags (remove others)
  if (allowedTags.length > 0) {
    const allowedPattern = allowedTags.join('|');
    // This regex matches any tag that is NOT an allowed opening/closing tag.
    // It removes all other tags while preserving allowed ones.
    clean = clean.replace(
      new RegExp(`<(?!/?(?:${allowedPattern})(?:\\s[^>]*)?>)[^>]*>`, 'gi'),
      ''
    );
  } else {
    // No allowed tags → strip all HTML tags
    clean = clean.replace(/<[^>]*>/g, '');
  }

  return clean.trim();
}