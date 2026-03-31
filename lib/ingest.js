import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

async function resolveYouTubeChannelId(url) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  const channelIdMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (channelIdMatch) return channelIdMatch[1]

  const handleMatch = url.match(/youtube\.com\/@([\w-]+)/) || url.match(/youtube\.com\/user\/([\w-]+)/)
  if (!handleMatch) return null

  const handle = handleMatch[1]
  const res = await fetchWithTimeout(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`
  )
  const data = await res.json()
  return data.items?.[0]?.id ?? null
}

async function fetchYouTubeItems(url) {
  const channelId = await resolveYouTubeChannelId(url)
  if (!channelId) return []

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const res = await fetchWithTimeout(feedUrl)
  if (!res.ok) return []

  const xml = await res.text()
  const feed = parser.parse(xml)
  const entries = feed?.feed?.entry ?? []
  const items = Array.isArray(entries) ? entries : [entries]

  return items.map((entry) => ({
    title: entry.title ?? '',
    url: entry.link?.['@_href'] ?? '',
    description: entry['media:group']?.['media:description'] ?? '',
    published_at: entry.published ?? null,
  }))
}

async function discoverRssFeed(url) {
  const baseUrl = new URL(url).origin
  const candidates = [
    url,
    `${baseUrl}/feed`,
    `${baseUrl}/feed/`,
    `${baseUrl}/rss`,
    `${baseUrl}/rss.xml`,
    `${baseUrl}/atom.xml`,
    `${baseUrl}/feed.xml`,
  ]

  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      })
      if (!res.ok) continue
      const text = await res.text()
      const trimmed = text.trim()

      if (trimmed.startsWith('<')) {
        const parsed = parser.parse(trimmed)
        if (parsed?.rss || parsed?.feed) return candidate
      }

      const match = text.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i)
        || text.match(/href=["']([^"']+)["'][^>]*type=["']application\/(rss|atom)\+xml["']/i)
      if (match) {
        const href = match[2] ?? match[1]
        return href.startsWith('http') ? href : new URL(href, url).toString()
      }
    } catch {}
  }

  return null
}

async function fetchRssItems(sourceUrl) {
  const feedUrl = await discoverRssFeed(sourceUrl)
  if (!feedUrl) return []
  const res = await fetchWithTimeout(feedUrl)
  if (!res.ok) return []

  const xml = await res.text()
  const parsed = parser.parse(xml)

  const rssItems = parsed?.rss?.channel?.item
  if (rssItems) {
    const items = Array.isArray(rssItems) ? rssItems : [rssItems]
    return items.map((item) => ({
      title: item.title ?? '',
      url: item.link ?? item.guid ?? '',
      description: item.description ?? item.summary ?? '',
      published_at: item.pubDate ?? item['dc:date'] ?? null,
    }))
  }

  const atomEntries = parsed?.feed?.entry
  if (atomEntries) {
    const entries = Array.isArray(atomEntries) ? atomEntries : [atomEntries]
    return entries.map((entry) => ({
      title: entry.title ?? '',
      url: entry.link?.['@_href'] ?? entry.link ?? '',
      description: entry.summary ?? entry.content ?? '',
      published_at: entry.published ?? entry.updated ?? null,
    }))
  }

  return []
}

export async function ingestForUser(supabase, userId) {
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('user_id', userId)

  if (!sources?.length) return 0

  let totalInserted = 0

  for (const source of sources) {
    try {
      const items = source.type === 'youtube'
        ? await fetchYouTubeItems(source.url)
        : await fetchRssItems(source.url)

      if (!items.length) continue

      const rows = items
        .filter((item) => item.url)
        .map((item) => ({
          source_id: source.id,
          user_id: userId,
          title: String(item.title).slice(0, 500),
          url: String(item.url).slice(0, 1000),
          description: item.description ? String(item.description).slice(0, 5000) : null,
          published_at: item.published_at ? new Date(item.published_at).toISOString() : null,
        }))

      const { error } = await supabase
        .from('content_items')
        .upsert(rows, { onConflict: 'source_id,url', ignoreDuplicates: true })

      if (!error) totalInserted += rows.length
    } catch (err) {
      console.error(`Failed to fetch source ${source.id}:`, err)
    }
  }

  return totalInserted
}
