export const dynamic = 'force-dynamic'

/**
 * Twilio Voice Webhook URL — set this on your Twilio number's "A call comes in" setting.
 * With OWNER_PHONE_NUMBER set: forwards the call to the owner.
 *   If owner misses it, Twilio POSTs no-answer to /api/twilio/voice → text-back fires.
 * Without OWNER_PHONE_NUMBER: plays a brief message and fires text-back immediately.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFirstMessage } from '@/lib/missed-call-chatbot'
import { validateTwilioSignature } from '@/lib/twilio/validate'

async function fireTextBack(from: string, businessId: string, businessName: string, twilioPhone: string) {
  const thirtyMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
  const existing = await prisma.missedCallLead.findUnique({
    where: { businessId_phoneNumber: { businessId, phoneNumber: from } },
  })

  if (existing && existing.lastContactAt > thirtyMinsAgo) {
    console.log(`[Twilio Inbound] Skipping duplicate text-back for ${from}`)
    return
  }

  const lead = existing ?? await prisma.missedCallLead.create({
    data: { businessId, phoneNumber: from, lastContactAt: new Date() },
  })

  const msg = generateFirstMessage(businessName)

  const twilio = (await import('twilio')).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  await Promise.all([
    client.messages.create({ from: twilioPhone, to: from, body: msg }),
    prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'ASSISTANT', content: msg } }),
    prisma.missedCallLead.update({ where: { id: lead.id }, data: { lastContactAt: new Date() } }),
  ])

  console.log(`[Twilio Inbound] Text-back sent to ${from}`)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const params  = new URLSearchParams(rawBody)

  // TODO: re-enable signature validation once webhook URLs are stable

  const from       = params.get('From') ?? ''
  const to         = params.get('To') ?? ''
  const ownerPhone = process.env.OWNER_PHONE_NUMBER
  const publicUrl  = process.env.NEXTAUTH_URL ?? `https://${req.headers.get('host')}`

  const business = await prisma.business.findFirst({
    where: { OR: [{ twilioPhoneNumber: to }, { ownerPhone: to }] },
  }) ?? await prisma.business.findFirst()
  if (!business) {
    console.warn(`[Twilio Inbound] No business found for phone ${to}`)
    return new NextResponse('<Response/>', { headers: { 'Content-Type': 'text/xml' } })
  }

  console.log(`[Twilio Inbound] from=${from} to=${to} ownerPhone=${ownerPhone ?? 'NOT SET'} publicUrl=${publicUrl}`)

  if (!ownerPhone) {
    // No forwarding — play message and fire text-back in background
    if (from && to) {
      fireTextBack(from, business.id, business.name, to).catch(e =>
        console.error('[Twilio Inbound] Text-back error:', e?.message)
      )
    }
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Thanks for calling ${business.name}. Sorry we missed you — we'll text you right back!</Say>
</Response>`
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
  }

  // Forward call to owner. When Dial ends (owner answers/misses/busy),
  // Twilio POSTs DialCallStatus to the action URL.
  const actionUrl = `${publicUrl}/api/twilio/voice`
  console.log(`[Twilio Inbound] Dialing owner ${ownerPhone}, action=${actionUrl}`)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20" action="${actionUrl}">
    <Number>${ownerPhone}</Number>
  </Dial>
</Response>`
  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
}
