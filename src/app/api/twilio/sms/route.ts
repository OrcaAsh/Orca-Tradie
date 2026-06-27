export const dynamic = 'force-dynamic'

/**
 * Twilio SMS Webhook — set this as the "A message comes in" webhook on your Twilio number.
 * Handles customer replies to the missed-call text-back.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMissedCallReply } from '@/lib/missed-call-chatbot'
import { validateTwilioSignature } from '@/lib/twilio/validate'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const params  = new URLSearchParams(rawBody)

  // Validate Twilio signature in production
  if (process.env.NODE_ENV === 'production') {
    if (!validateTwilioSignature(req, params)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const from = params.get('From') ?? ''
  const to   = params.get('To') ?? ''
  const body = (params.get('Body') ?? '').trim()

  if (!from || !body) return twiml('')

  const business = await prisma.business.findFirst({
    where: { OR: [{ twilioPhoneNumber: to }, { ownerPhone: to }] },
  }) ?? await prisma.business.findFirst()
  if (!business) return twiml('')

  // Get or create lead
  const lead = await prisma.missedCallLead.upsert({
    where: { businessId_phoneNumber: { businessId: business.id, phoneNumber: from } },
    create: { businessId: business.id, phoneNumber: from, lastContactAt: new Date() },
    update: { lastContactAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  // Save incoming message
  await prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'USER', content: body } })

  // Build history for AI
  const history = lead.messages.map(m => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content }))
  history.push({ role: 'USER', content: body })

  // Generate AI reply
  const ai = await generateMissedCallReply(
    business.id,
    history,
    { callerName: lead.callerName ?? undefined, serviceRequested: lead.serviceRequested ?? undefined }
  )

  // Update lead with AI-extracted info
  await prisma.missedCallLead.update({
    where: { id: lead.id },
    data: {
      callerName:      ai.callerName      ?? lead.callerName,
      category:        ai.category        as any,
      urgency:         ai.urgency         as any,
      serviceRequested: ai.serviceRequested ?? lead.serviceRequested,
      notes:           ai.notes           ?? lead.notes,
      lastContactAt:   new Date(),
    },
  })

  // Save AI reply
  await prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'ASSISTANT', content: ai.message } })

  // Send SMS reply via Twilio
  const twilio = (await import('twilio')).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  await client.messages.create({ from: to, to: from, body: ai.message })

  console.log(`[Twilio SMS] Replied to ${from} (${ai.category}): ${ai.message.substring(0, 60)}`)
  return twiml('')
}

function twiml(xml: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
