import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const leads = await prisma.missedCallLead.findMany({
    where: { businessId },
    orderBy: { lastContactAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  return NextResponse.json(leads)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const { id, convertedToJob } = await req.json()
  await prisma.missedCallLead.updateMany({
    where: { id, businessId },
    data: { convertedToJob },
  })
  return NextResponse.json({ ok: true })
}
