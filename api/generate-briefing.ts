import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  maxDuration: 60,
}

const FIRECRAWL_TIMEOUT_MS = 10_000
const FIRECRAWL_MAX_CHARS = 4_000
const CLAUDE_MODEL = 'claude-sonnet-4-6'

interface BriefingRequest {
  shareCode: string
  destinationCity: string
  destinationCountry: string
  travelDatesStart: string
  travelDatesEnd: string
}

const STABLE_SYSTEM_PROMPT = `You are SheSafe Travel's AI safety advisor for women travelers. Generate an actionable safety briefing specifically for women traveling to the given destination.

LENGTH RULES (critical — the response must fit a 3000-token budget):
- Each text section in "sections": 2-4 short sentences max. Be tight.
- "safety_overview": at most one short paragraph (3-5 sentences).
- "top_3_tips": each tip is one sentence.
- "phrases_to_know": exactly 4 entries.
- Be SPECIFIC to the destination — name actual neighborhoods, apps, phone numbers, customs. No generic filler.

Return a JSON object with this EXACT structure:

{
  "overall_risk_level": "Low" | "Moderate" | "Elevated" | "High",
  "risk_score": 1-5,
  "last_updated": "ISO date string",
  "sections": {
    "safety_overview": "string",
    "cultural_norms_for_women": "string (dress codes, behavior, gender dynamics)",
    "harassment_and_scam_patterns": "string (specific scams + how to respond)",
    "transport_safety": "string (safe options, what to avoid, apps to use)",
    "safe_areas": "string (specific neighborhoods, areas to avoid at night)",
    "emergency_contacts": {
      "police": "number",
      "ambulance": "number",
      "fire": "number",
      "us_embassy": "string with phone + address",
      "womens_crisis_line": "number or 'Not available'"
    },
    "health_and_medical": "string (hospitals, pharmacies, vaccinations)",
    "communication": "string (SIM cards, apps, key phrases)",
    "what_to_wear": "string (practical clothing advice)",
    "solo_dining_and_nightlife": "string (safe spots, what to avoid)"
  },
  "top_3_tips": ["tip1", "tip2", "tip3"],
  "phrases_to_know": [{"local": "phrase", "english": "meaning"}],
  "data_source": "live" | "ai_knowledge"
}

Output ONLY the JSON object. No preamble. No markdown fences. Close every brace.`

function countrySlug(country: string): string {
  return country
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

async function fetchTravelAdvisory(
  country: string,
  apiKey: string,
): Promise<string | null> {
  const advisoryUrl = `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/${countrySlug(country)}-travel-advisory.html`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS)

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: advisoryUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      success?: boolean
      data?: { markdown?: string }
    }

    const markdown = data?.data?.markdown
    if (typeof markdown !== 'string' || markdown.length === 0) return null
    return markdown.length > FIRECRAWL_MAX_CHARS
      ? markdown.slice(0, FIRECRAWL_MAX_CHARS)
      : markdown
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const firecrawlKey = process.env.FIRECRAWL_API_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!anthropicKey || !supabaseUrl || !supabaseKey) {
    res.status(500).json({
      success: false,
      error: 'Server is missing required environment variables',
    })
    return
  }

  const body =
    typeof req.body === 'string'
      ? (JSON.parse(req.body) as BriefingRequest)
      : (req.body as BriefingRequest)

  const {
    shareCode,
    destinationCity,
    destinationCountry,
    travelDatesStart,
    travelDatesEnd,
  } = body ?? ({} as BriefingRequest)

  if (
    !shareCode ||
    !destinationCity ||
    !destinationCountry ||
    !travelDatesStart ||
    !travelDatesEnd
  ) {
    res.status(400).json({
      success: false,
      error:
        'Missing required fields: shareCode, destinationCity, destinationCountry, travelDatesStart, travelDatesEnd',
    })
    return
  }

  const t0 = Date.now()

  let liveData: string | null = null
  if (firecrawlKey) {
    liveData = await fetchTravelAdvisory(destinationCountry, firecrawlKey)
  }

  const tFirecrawl = Date.now()
  console.log(
    `[briefing] firecrawl ${tFirecrawl - t0}ms (live=${liveData !== null})`,
  )

  const anthropic = new Anthropic({ apiKey: anthropicKey })

  let briefing: Record<string, unknown>
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3072,
      system: [
        {
          type: 'text',
          text: STABLE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: liveData
            ? `LIVE TRAVEL ADVISORY DATA:\n${liveData}\n\nUse this real-time data to inform your briefing.`
            : 'Note: Live data unavailable. Use your most current knowledge.',
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate a safety briefing for a solo woman traveling to ${destinationCity}, ${destinationCountry} from ${travelDatesStart} to ${travelDatesEnd}.`,
        },
      ],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')

    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      console.error(
        `[briefing] no JSON in response. stop=${message.stop_reason} len=${text.length} preview=${JSON.stringify(text.slice(0, 300))}`,
      )
      throw new Error(
        `Model response did not contain a JSON object (stop=${message.stop_reason}, len=${text.length})`,
      )
    }

    briefing = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Record<
      string,
      unknown
    >
    briefing.data_source = liveData ? 'live' : 'ai_knowledge'

    const tClaude = Date.now()
    console.log(
      `[briefing] claude ${tClaude - tFirecrawl}ms (in=${message.usage.input_tokens}, out=${message.usage.output_tokens})`,
    )
  } catch (err) {
    res.status(500).json({
      success: false,
      error:
        err instanceof Error
          ? `Briefing generation failed: ${err.message}`
          : 'Briefing generation failed',
    })
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase
      .from('trips')
      .update({ briefing_data: briefing })
      .eq('share_code', shareCode)

    if (error) throw error
  } catch (err) {
    res.status(500).json({
      success: false,
      error:
        err instanceof Error
          ? `Failed to save briefing: ${err.message}`
          : 'Failed to save briefing',
    })
    return
  }

  res.status(200).json({
    success: true,
    dataSource: liveData ? 'live' : 'ai_knowledge',
  })
}
