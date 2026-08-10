/**
 * Validates whether a URL is a real, non-placeholder job application link.
 * Returns false for null, undefined, empty strings, '#', or placeholder URLs containing 'example.com', 'example.org', 'example.net'.
 */
export const isValidApplyUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed === '' ||
    trimmed === '#' ||
    trimmed.includes('example.com') ||
    trimmed.includes('example.org') ||
    trimmed.includes('example.net')
  ) {
    return false;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};
