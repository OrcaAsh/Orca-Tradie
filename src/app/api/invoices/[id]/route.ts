import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params
  const { status } = await req.json()

  const invoice = await prisma.invoice.updateMany({
    where: { id, businessId },
    data: {
      status,
      ...(status === 'PAID' && { paidAt: new Date() }),
      ...(status === 'SENT' && { sentAt: new Date() }),
    },
  })

  if (status === 'PAID') {
    const inv = await prisma.invoice.findFirst({ where: { id } })
    if (inv) {
      await prisma.job.update({ where: { id: inv.jobId }, data: { status: 'PAID' } })
    }
  }

  return NextResponse.json({ updated: invoice.count })
}
