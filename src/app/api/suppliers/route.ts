import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const suppliers = await prisma.supplier.findMany({
    where: { businessId },
    include: { _count: { select: { parts: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()
  const supplier = await prisma.supplier.create({
    data: {
      businessId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      website: data.website,
      notes: data.notes,
    },
  })
  return NextResponse.json(supplier)
}
