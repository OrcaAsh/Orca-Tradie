import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params
  const data = await req.json()

  await prisma.knowledgeBase.updateMany({
    where: { id, businessId },
    data: { title: data.title, content: data.content, tags: data.tags ?? [] },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const businessId = (session.user as any).businessId
  const { id } = await params

  await prisma.knowledgeBase.deleteMany({ where: { id, businessId } })
  return NextResponse.json({ ok: true })
}
