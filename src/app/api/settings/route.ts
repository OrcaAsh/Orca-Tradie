import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const business = await prisma.business.findUnique({ where: { id: businessId } })
  return NextResponse.json(business)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId

  const data = await req.json()
  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: data.name,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      address: data.address,
      suburb: data.suburb,
      state: data.state,
      laborRate: data.laborRate ? parseFloat(data.laborRate) : undefined,
      defaultMarkup: data.defaultMarkup ? parseFloat(data.defaultMarkup) : undefined,
      gstNumber: data.gstNumber,
      googleReviewUrl: data.googleReviewUrl,
    },
  })
  return NextResponse.json(business)
}
