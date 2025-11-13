/**
 * Extract relative URL (pathname + search + hash) from a full URL
 */
export const getRelativeUrl = (fullUrl: string): string => {
  try {
    const url = new URL(fullUrl);
    return url.pathname + url.search + url.hash;
  } catch {
    return fullUrl;
  }
};

