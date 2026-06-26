import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const customers = await prisma.customer.findMany({
    where: { businessId },
    orderBy: { firstName: 'asc' },
    include: { vehicles: true, _count: { select: { jobs: true } } },
  })
  return NextResponse.json(customers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()
  const customer = await prisma.customer.create({
    data: { businessId, ...data },
  })
  return NextResponse.json(customer)
}
