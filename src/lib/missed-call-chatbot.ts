import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AIReply {
  message: string
  callerName: string | null
  category: 'HOT' | 'WARM' | 'COLD' | 'URGENT'
  urgency: 'NORMAL' | 'HIGH' | 'URGENT'
  serviceRequested: string | null
  notes: string | null
  confidence: number
}

export async function generateMissedCallReply(
  businessId: string,
  history: { role: 'USER' | 'ASSISTANT'; content: string }[],
  leadContext: { callerName?: string; serviceRequested?: string }
): Promise<AIReply> {
  const [business, knowledgeEntries] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.knowledgeBase.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  const bizName = business?.name ?? 'the workshop'
  const kbContext = knowledgeEntries.length > 0
    ? knowledgeEntries.map(e => `- ${e.title}: ${e.content}`).join('\n')
    : 'No specific knowledge entries yet.'

  const systemPrompt = `You are an AI assistant for ${bizName}, a mechanics workshop. You handle missed call text-backs via SMS.

WORKSHOP INFO:
- Name: ${bizName}
- Labour rate: $${business?.laborRate ?? 110}/hr + GST

WORKSHOP KNOWLEDGE BASE:
${kbContext}

WHAT YOU KNOW ABOUT THIS CALLER:
- Name: ${leadContext.callerName ?? 'Unknown'}
- Service requested: ${leadContext.serviceRequested ?? 'Not yet known'}

YOUR RULES:
1. Keep messages SHORT — 1-3 sentences max. This is SMS, not email.
2. Sound like a real person from the workshop, not a bot.
3. Ask ONE question at a time to understand what they need.
4. If they ask about pricing, give a rough estimate based on the knowledge base or say "usually around $X — depends on the job."
5. If they want to book, say the workshop will call them back to confirm a time.
6. If it's urgent (breakdown, safety issue), escalate immediately: "That sounds urgent — I'll get someone to call you right back."
7. Never invent specific availability or exact prices you don't know.
8. Don't say "As an AI" — just be helpful.

RESPOND WITH VALID JSON ONLY:
{
  "message": "Your SMS reply (keep it short and human)",
  "callerName": "their name if they told you, else null",
  "category": "HOT|WARM|COLD|URGENT",
  "urgency": "NORMAL|HIGH|URGENT",
  "serviceRequested": "what they need, or null",
  "notes": "anything important for the mechanic to know, or null",
  "confidence": 0.0-1.0
}`

  const messages = history.map(m => ({
    role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
    content: m.content,
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    return {
      message: parsed.message ?? "Thanks for reaching out! What can we help you with?",
      callerName: parsed.callerName ?? null,
      category: parsed.category ?? 'COLD',
      urgency: parsed.urgency ?? 'NORMAL',
      serviceRequested: parsed.serviceRequested ?? null,
      notes: parsed.notes ?? null,
      confidence: parsed.confidence ?? 0.7,
    }
  } catch {
    return {
      message: raw.substring(0, 160) || "Hey! Sorry we missed your call — how can we help?",
      callerName: null,
      category: 'COLD',
      urgency: 'NORMAL',
      serviceRequested: null,
      notes: null,
      confidence: 0.4,
    }
  }
}

export function generateFirstMessage(businessName: string): string {
  return `Hey! This is ${businessName}. Sorry we missed your call — how can we help? 😊`
}
