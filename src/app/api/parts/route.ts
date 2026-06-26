import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const parts = await prisma.part.findMany({
    where: { businessId },
    include: { supplier: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(parts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()

  const costPrice = data.costPrice ? parseFloat(data.costPrice) : undefined
  const markup    = data.markup ? parseFloat(data.markup) : undefined
  const sellPrice = data.sellPrice
    ? parseFloat(data.sellPrice)
    : costPrice && markup
      ? Math.round(costPrice * (1 + markup / 100) * 100) / 100
      : undefined

  const part = await prisma.part.create({
    data: {
      businessId,
      name: data.name,
      partNumber: data.partNumber,
      description: data.description,
      costPrice,
      sellPrice,
      stockQty: data.stockQty ? parseInt(data.stockQty) : 0,
      minStock: data.minStock ? parseInt(data.minStock) : 1,
      location: data.location,
      category: data.category,
      supplierId: data.supplierId || undefined,
    },
  })
  return NextResponse.json(part)
}
