import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { autoInvoiceJob } from '@/lib/auto-invoice'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params

  const job = await prisma.job.findFirst({
    where: { id, businessId },
    include: { customer: true, vehicle: true, assignedTo: true, items: true, partsUsed: { include: { part: true } }, invoice: true },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params
  const data = await req.json()

  const job = await prisma.job.updateMany({
    where: { id, businessId },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.odometerIn !== undefined && { odometerIn: data.odometerIn }),
      ...(data.odometerOut !== undefined && { odometerOut: data.odometerOut }),
      ...(data.laborHours !== undefined && { laborHours: data.laborHours }),
      ...(data.laborCost !== undefined && { laborCost: data.laborCost }),
      ...(data.partsCost !== undefined && { partsCost: data.partsCost }),
      ...(data.totalValue !== undefined && { totalValue: data.totalValue }),
      ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
      ...(data.aiUpsell !== undefined && { aiUpsell: data.aiUpsell }),
      ...(data.aiPriceSuggestion !== undefined && { aiPriceSuggestion: data.aiPriceSuggestion }),
      ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
    },
  })

  // Auto-invoice when job is marked complete
  if (data.status === 'COMPLETED' && job.count > 0) {
    autoInvoiceJob(id).catch(e => console.error('Auto-invoice failed:', e))
  }

  return NextResponse.json({ updated: job.count })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params

  await prisma.job.deleteMany({ where: { id, businessId } })
  return NextResponse.json({ ok: true })
}
