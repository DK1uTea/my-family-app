export function getFilename(url?: string) {
  if (!url) return ''
  const filename = url.split('?')[0]?.split('/').pop() || ''
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

export function extractKeyFromUrl(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      return parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname
    } catch {
      return url
    }
  }
  return url
}
