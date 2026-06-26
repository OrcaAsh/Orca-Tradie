import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const { description, vehicleMake, vehicleModel, vehicleYear, voiceNote } = await req.json()

  const [business, knowledge, recentJobs] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.knowledgeBase.findMany({ where: { businessId }, take: 10 }),
    prisma.job.findMany({
      where: { businessId, status: { in: ['COMPLETED', 'PAID', 'INVOICED'] } },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: { title: true, totalValue: true, laborHours: true, description: true },
    }),
  ])

  const prompt = `You are a senior mechanic's quoting assistant for ${business?.name} in Australia.
Labor rate: $${business?.laborRate ?? 110}/hour (inc GST)

${knowledge.length > 0 ? `Knowledge base:\n${knowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}` : ''}

${recentJobs.length > 0 ? `Recent completed jobs (for pricing reference):\n${recentJobs.map(j => `- ${j.title}: $${j.totalValue ?? '?'} (${j.laborHours ?? '?'}h)`).join('\n')}` : ''}

Vehicle: ${vehicleYear || ''} ${vehicleMake || ''} ${vehicleModel || ''} (unknown if not provided)

Job description: ${description || voiceNote || 'General service'}

Provide a detailed quote with:
1. Estimated labor hours and cost
2. Likely parts needed with approximate costs
3. Total estimate (subtotal + GST)
4. Any upsell opportunities (e.g. "while we're in there...")
5. A note if there are any risks that could change the price

Format as JSON: { laborHours, laborCost, parts: [{name, qty, unitCost}], partsCost, subtotal, gst, total, upsell, notes }`

  const { text } = await callAI(prompt, 1000)

  let parsed: any = {}
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
  } catch {}

  return NextResponse.json({ raw: text, quote: parsed })
}
