import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalJobs,
    activeJobs,
    completedThisMonth,
    overdueInvoices,
    pendingLeads,
    recentJobs,
    upcomingReminders,
    monthRevenue,
  ] = await Promise.all([
    prisma.job.count({ where: { businessId } }),
    prisma.job.count({ where: { businessId, status: { in: ['BOOKED', 'IN_PROGRESS', 'WAITING_PARTS'] } } }),
    prisma.job.count({ where: { businessId, status: { in: ['COMPLETED', 'INVOICED', 'PAID'] }, completedAt: { gte: monthStart } } }),
    prisma.invoice.count({ where: { businessId, status: 'OVERDUE' } }),
    prisma.potentialLead.count({ where: { businessId, status: 'PENDING' } }),
    prisma.job.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true, vehicle: true },
    }),
    prisma.reminder.findMany({
      where: { businessId, status: 'PENDING', dueAt: { gte: now } },
      orderBy: { dueAt: 'asc' },
      take: 5,
      include: { customer: true, vehicle: true },
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: { in: ['SENT', 'PAID'] }, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalJobs,
      activeJobs,
      completedThisMonth,
      overdueInvoices,
      pendingLeads,
      monthRevenue: monthRevenue._sum.total ?? 0,
    },
    recentJobs,
    upcomingReminders,
  })
}
