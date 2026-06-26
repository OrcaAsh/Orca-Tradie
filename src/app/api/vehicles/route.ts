import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')

  const vehicles = await prisma.vehicle.findMany({
    where: { businessId, ...(customerId ? { customerId } : {}) },
    include: { customer: true, _count: { select: { jobs: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(vehicles)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()
  const vehicle = await prisma.vehicle.create({
    data: {
      businessId,
      customerId: data.customerId,
      make: data.make,
      model: data.model,
      year: data.year ? parseInt(data.year) : undefined,
      rego: data.rego,
      regoExpiry: data.regoExpiry ? new Date(data.regoExpiry) : undefined,
      vin: data.vin,
      colour: data.colour,
      engineSize: data.engineSize,
      transmission: data.transmission,
      odometer: data.odometer ? parseInt(data.odometer) : undefined,
      notes: data.notes,
    },
  })
  return NextResponse.json(vehicle)
}
