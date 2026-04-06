import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

const BOT_UA = 'Mozilla/5.0 (compatible; MorningCupBot/1.0)'

function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function normalizeUrl(url) {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isXmlFeed(text) {
  const t = text.trim()
  if (!t.startsWith('<')) return false
  try {
    const parsed = parser.parse(t)
    return !!(parsed?.rss || parsed?.feed)
  } catch {
    return false
  }
}

async function resolveYouTubeChannelId(url) {
  const apiKey = process.env.YOUTUBE_API_KEY

  const channelIdMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (channelIdMatch) return channelIdMatch[1]

  const handleMatch =
    url.match(/youtube\.com\/@([\w.-]+)/) ||
    url.match(/youtube\.com\/user\/([\w.-]+)/) ||
    url.match(/youtube\.com\/c\/([\w.-]+)/)
  if (!handleMatch) return null

  const handle = handleMatch[1]

  // Try YouTube Data API first
  if (apiKey) {
    try {
      const res = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`
      )
      const data = await res.json()
      if (data.items?.[0]?.id) return data.items[0].id
    } catch {}
  }

  // Fallback: scrape channel page for the channel ID
  try {
    const res = await fetchWithTimeout(`https://www.youtube.com/@${handle}`, {
      headers: { 'User-Agent': BOT_UA },
    })
    const html = await res.text()
    const match = html.match(/"channelId":"(UC[\w-]+)"/) || html.match(/channel\/(UC[\w-]+)/)
    if (match) return match[1]
  } catch {}

  return null
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

// Resolve Apple Podcasts URL to RSS feed via iTunes lookup API
async function resolveApplePodcastsFeed(url) {
  const idMatch = url.match(/\/id(\d+)/)
  if (!idMatch) return null
  try {
    const res = await fetchWithTimeout(
      `https://itunes.apple.com/lookup?id=${idMatch[1]}&entity=podcast`
    )
    const data = await res.json()
    return data.results?.[0]?.feedUrl ?? null
  } catch {
    return null
  }
}

async function discoverRssFeed(url) {
  const normalized = normalizeUrl(url)
  let parsedUrl
  try {
    parsedUrl = new URL(normalized)
  } catch {
    return null
  }

  const { origin, hostname } = parsedUrl

  // Apple Podcasts — convert to RSS via iTunes API
  if (hostname === 'podcasts.apple.com') {
    return await resolveApplePodcastsFeed(normalized)
  }

  // Spotify has no public RSS feed
  if (hostname === 'open.spotify.com') return null

  const feedHeaders = {
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    'User-Agent': BOT_UA,
  }

  // Candidate feed URLs (order matters — most likely first)
  const candidates = [...new Set([
    normalized,
    `${origin}/feed`,
    `${origin}/feed/`,
    `${origin}/rss`,
    `${origin}/rss.xml`,
    `${origin}/rss/`,
    `${origin}/atom.xml`,
    `${origin}/feed.xml`,
    `${origin}/index.xml`,
    `${origin}/?feed=rss2`,    // WordPress
    `${origin}/feed/rss/`,     // WordPress alt
  ])]

  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, { headers: feedHeaders })
      if (!res.ok) continue
      const text = await res.text()
      if (isXmlFeed(text)) return candidate
    } catch {}
  }

  // Last resort: fetch HTML and scan for <link rel="alternate" type="application/rss+xml">
  try {
    const res = await fetchWithTimeout(normalized, { headers: { 'User-Agent': BOT_UA } })
    if (res.ok) {
      const html = await res.text()
      const match =
        html.match(/<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["']/i) ||
        html.match(/href=["']([^"']+)["'][^>]*type=["']application\/(rss|atom)\+xml["']/i)
      if (match) {
        const href = match[2] ?? match[1]
        return href.startsWith('http') ? href : new URL(href, normalized).toString()
      }
    }
  } catch {}

  return null
}

async function fetchRssItems(sourceUrl) {
  const feedUrl = await discoverRssFeed(sourceUrl)
  if (!feedUrl) return []

  const res = await fetchWithTimeout(feedUrl, { headers: { 'User-Agent': BOT_UA } })
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
      const items =
        source.type === 'youtube'
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
