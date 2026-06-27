import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const entries = await prisma.knowledgeBase.findMany({
    where: { businessId },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()

  // AI generate mode — suggest entries from recent jobs
  if (data.aiGenerate) {
    const [recentJobs, existing] = await Promise.all([
      prisma.job.findMany({
        where: { businessId, status: { in: ['COMPLETED', 'PAID'] } },
        orderBy: { completedAt: 'desc' },
        take: 30,
        include: { vehicle: true },
      }),
      prisma.knowledgeBase.findMany({ where: { businessId }, select: { title: true } }),
    ])

    const existingTitles = existing.map(e => e.title).join(', ')
    const jobSummary = recentJobs.map(j =>
      `${j.title}${j.vehicle ? ` on ${j.vehicle.year ?? ''} ${j.vehicle.make} ${j.vehicle.model}` : ''} — $${j.totalValue ?? '?'}`
    ).join('\n')

    const { text } = await callAI(`You are helping a mechanic build a knowledge base for their workshop.

Based on these recent completed jobs:
${jobSummary}

${existingTitles ? `Already in knowledge base: ${existingTitles}` : ''}

Suggest 3 useful knowledge base entries this mechanic should have. Focus on:
- Vehicle-specific quirks or common issues (e.g. "Toyota HiLux DPF issues")
- Pricing guides for common jobs
- Upsell opportunities
- Supplier tips

Return ONLY a JSON array, no explanation:
[
  { "title": "...", "content": "...", "tags": ["tag1", "tag2"] },
  ...
]`, 800)

    try {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        const suggestions = JSON.parse(match[0])
        return NextResponse.json({ suggestions })
      }
    } catch {}
    return NextResponse.json({ suggestions: [] })
  }

  const entry = await prisma.knowledgeBase.create({
    data: {
      businessId,
      title:   data.title,
      content: data.content,
      tags:    data.tags ?? [],
    },
  })
  return NextResponse.json(entry)
}
