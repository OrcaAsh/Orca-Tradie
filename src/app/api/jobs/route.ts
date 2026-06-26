import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const jobs = await prisma.job.findMany({
    where: { businessId, ...(status ? { status: status as any } : {}) },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      vehicle: true,
      assignedTo: true,
      items: true,
    },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { jobSeq: { increment: 1 } },
  })
  const jobNumber = `JOB-${String(business.jobSeq).padStart(4, '0')}`

  const job = await prisma.job.create({
    data: {
      businessId,
      jobNumber,
      title: data.title,
      description: data.description,
      customerId: data.customerId || undefined,
      vehicleId: data.vehicleId || undefined,
      assignedToId: data.assignedToId || undefined,
      status: data.status || 'BOOKED',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      odometerIn: data.odometerIn,

      internalNotes: data.internalNotes,
    },
    include: { customer: true, vehicle: true },
  })

  return NextResponse.json(job)
}
