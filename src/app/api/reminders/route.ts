import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const reminders = await prisma.reminder.findMany({
    where: { businessId },
    include: { customer: true, vehicle: true },
    orderBy: { dueAt: 'asc' },
  })
  return NextResponse.json(reminders)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()
  const reminder = await prisma.reminder.create({
    data: {
      businessId,
      customerId: data.customerId || undefined,
      vehicleId: data.vehicleId || undefined,
      type: data.type,
      message: data.message,
      dueAt: new Date(data.dueAt),
    },
    include: { customer: true, vehicle: true },
  })
  return NextResponse.json(reminder)
}
