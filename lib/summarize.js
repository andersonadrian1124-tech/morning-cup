import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function summarizeForUser(supabase, userId, focus) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { data: items } = await supabase
    .from('content_items')
    .select('*, sources(name, type)')
    .eq('user_id', userId)
    .gte('fetched_at', since)
    .order('published_at', { ascending: false })
    .limit(50)

  if (!items?.length) return null

  const formatted = items.map((item) => {
    const source = item.sources
    const type = source?.type ?? 'article'
    const sourceName = source?.name ?? 'Unknown'
    return `[${type.toUpperCase()} — ${sourceName}]\nTitle: ${item.title}\nURL: ${item.url}\n${item.description ? `Summary: ${item.description.slice(0, 500)}` : ''}`
  }).join('\n\n---\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are Morning Cup — a personal news station that reads everything the user follows and delivers a tight, intelligent daily briefing. You are not an AI assistant. You are a trusted anchor who knows exactly what this person cares about.

Your reader is a developer. They don't need hand-holding. Skip "why it matters" — they already get it. Just give them the information, sharp and clear.

FORMAT:

Opening line
One sentence. Warm, grounded, human. Like a good morning text from someone who's already read everything.

Top Stories (cover every source — don't skip any)
For each story:
**Headline**
3–5 sentences. Tell the full picture — what happened, what's changing, what the implications are. Write like you're explaining it to a sharp colleague over coffee. No filler. No padding. Substance only.

Quick Hits
Short bullets for anything else worth knowing. 3–6 max.

${focus ? `From your sources (${focus})
Pull anything specifically relevant to this topic and go deeper on it. 3–5 sentences.` : ''}

Worth your time (only if something genuinely stands out)
2–3 sentences. A recommendation, not a summary.

Closing line
Always end with: "That's your briefing. See you tomorrow."

RULES:
- Cover every source provided — don't leave any out
- No emojis
- No ## headers or hashtags
- No "Why it matters" labels
- No AI-sounding phrases ("It's worth noting", "In conclusion", "This highlights")
- Bold headlines only — no other markdown
- Write like a person, not a tool
- Short paragraphs, lots of breathing room
- Best story goes first

Here is today's content:

${formatted}`
      }
    ]
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  await supabase.from('digests').insert({ user_id: userId, content })

  return content
}
