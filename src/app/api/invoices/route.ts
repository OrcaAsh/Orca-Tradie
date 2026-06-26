import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const invoices = await prisma.invoice.findMany({
    where: { businessId },
    include: { job: { include: { customer: true, vehicle: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { invoiceSeq: { increment: 1 } },
  })
  const invoiceNumber = `INV-${String(business.invoiceSeq).padStart(4, '0')}`

  const subtotal = parseFloat(data.subtotal)
  const gst = subtotal * 0.1
  const total = subtotal + gst

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      jobId: data.jobId,
      invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      subtotal,
      gst,
      total,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
    },
  })

  await prisma.job.update({
    where: { id: data.jobId },
    data: { status: 'INVOICED' },
  })

  return NextResponse.json(invoice)
}
