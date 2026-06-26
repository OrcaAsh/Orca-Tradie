import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { name, email, password, businessName, laborRate } = await req.json()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const business = await prisma.business.create({
    data: {
      name: businessName,
      ownerName: name,
      ownerEmail: email,
      laborRate: laborRate ?? 110,
    },
  })

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { businessId: business.id, name, email, passwordHash, role: 'OWNER' },
  })

  return NextResponse.json({ ok: true })
}
