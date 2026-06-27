export const dynamic = 'force-dynamic'

/**
 * Twilio Call Status Callback — set this as the "action" URL on the <Dial> in inbound/route.ts.
 * Fires when the owner misses a forwarded call (status: no-answer, busy, failed).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFirstMessage } from '@/lib/missed-call-chatbot'

export async function POST(req: NextRequest) {
  const body      = await req.formData()
  const callStatus = body.get('CallStatus') as string
  const from       = body.get('From') as string
  const to         = body.get('To') as string

  if (!['no-answer', 'busy', 'failed'].includes(callStatus)) {
    return NextResponse.json({ ok: true })
  }

  const business = await prisma.business.findFirst({
    where: { OR: [{ twilioPhoneNumber: to }, { ownerPhone: to }] },
  })
  if (!business) return NextResponse.json({ ok: true })

  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
  const existing = await prisma.missedCallLead.findUnique({
    where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: from } },
  })

  if (existing && existing.lastContactAt > thirtyMinsAgo) {
    console.log(`[Twilio Voice] Duplicate skip for ${from}`)
    return NextResponse.json({ ok: true })
  }

  const lead = existing ?? await prisma.missedCallLead.create({
    data: { businessId: business.id, phoneNumber: from, lastContactAt: new Date() },
  })

  const msg = generateFirstMessage(business.name)
  const twilio = (await import('twilio')).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  await Promise.all([
    client.messages.create({ from: to, to: from, body: msg }),
    prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'ASSISTANT', content: msg } }),
    prisma.missedCallLead.update({ where: { id: lead.id }, data: { lastContactAt: new Date() } }),
  ])

  console.log(`[Twilio Voice] Missed call text-back sent to ${from}. Lead: ${lead.id}`)
  return NextResponse.json({ ok: true })
}
