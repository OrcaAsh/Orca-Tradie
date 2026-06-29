export const dynamic = 'force-dynamic'

/**
 * Twilio Call Status Callback — set this as the "action" URL on the <Dial> in inbound/route.ts.
 * Fires when the owner misses a forwarded call (status: no-answer, busy, failed).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFirstMessage } from '@/lib/missed-call-chatbot'

export async function POST(req: NextRequest) {
  const body           = await req.formData()
  const from           = body.get('From') as string
  const to             = body.get('To') as string
  const dialCallStatus = body.get('DialCallStatus') as string | null
  const callStatus     = body.get('CallStatus') as string | null
  const dialCallDuration = parseInt(body.get('DialCallDuration') as string ?? '0')
  console.log(`[V] DCS=${dialCallStatus} dur=${dialCallDuration} CS=${callStatus}`)

  // DialCallStatus = Dial action callback (owner answered/missed)
  // If null = Call Status Changes URL (fires when inbound call ends)
  // The Dial action callback never fires for this number, so we rely on Call Status Changes.
  const effectiveStatus = dialCallStatus ?? callStatus ?? ''
  const effectiveDuration = dialCallDuration

  // Owner answered for real = completed with long duration, skip text-back
  if (effectiveStatus === 'completed' && effectiveDuration >= 15) {
    console.log(`[V] Owner answered (${effectiveDuration}s), skip`)
    return twiml('')
  }

  // Anything else = missed/voicemail/no-answer → send text-back
  console.log(`[V] Sending text-back (${effectiveStatus} ${effectiveDuration}s)`)

  const business = await prisma.business.findFirst({
    where: { OR: [{ twilioPhoneNumber: to }, { ownerPhone: to }] },
  }) ?? await prisma.business.findFirst()
  if (!business) return twiml('')

  const thirtyMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
  const existing = await prisma.missedCallLead.findUnique({
    where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: from } },
  })

  if (existing && existing.lastContactAt > thirtyMinsAgo) {
    console.log(`[Twilio Voice] Duplicate skip for ${from}`)
    return twiml('')
  }

  const lead = existing ?? await prisma.missedCallLead.create({
    data: { businessId: business.id, phoneNumber: from, lastContactAt: new Date() },
  })

  const msg = generateFirstMessage(business.name)
  const twilioClient = (await import('twilio')).default
  const client = twilioClient(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  await Promise.all([
    client.messages.create({ from: to, to: from, body: msg }),
    prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'ASSISTANT', content: msg } }),
    prisma.missedCallLead.update({ where: { id: lead.id }, data: { lastContactAt: new Date() } }),
  ])

  console.log(`[Twilio Voice] Missed call text-back sent to ${from}. Lead: ${lead.id}`)
  return twiml('')
}

function twiml(xml: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
