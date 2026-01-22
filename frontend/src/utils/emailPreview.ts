/**
 * Extracts text content from HTML for use as email preview.
 * Strips all HTML tags and normalizes whitespace.
 */
export function extractTextFromHtml(html: string): string {
  // Create a temporary element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Get text content, which strips all HTML tags
  const text = doc.body.textContent || '';
  
  // Normalize whitespace: replace multiple spaces/newlines with single space
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Gets the preview text for an email.
 * Uses textBody if available, otherwise extracts text from htmlBody.
 */
export function getEmailPreviewText(
  textBody: string | null | undefined,
  htmlBody: string | null | undefined,
  maxLength: number = 100
): string {
  // Try textBody first
  if (textBody && textBody.trim()) {
    return textBody.substring(0, maxLength);
  }
  
  // Fall back to extracting text from HTML
  if (htmlBody) {
    const extracted = extractTextFromHtml(htmlBody);
    if (extracted) {
      return extracted.substring(0, maxLength);
    }
  }
  
  return '(No content)';
}
