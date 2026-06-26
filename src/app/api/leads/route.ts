import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const leads = await prisma.potentialLead.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(leads)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const { id, status } = await req.json()
  const lead = await prisma.potentialLead.updateMany({
    where: { id, businessId },
    data: { status },
  })
  return NextResponse.json({ updated: lead.count })
}
