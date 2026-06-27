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

  // TODO: re-enable signature validation once webhook URLs are stable

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

  // Generate AI reply (fall back to a simple message if AI fails)
  let aiMessage = "Thanks for getting in touch! We'll get back to you shortly. 😊"
  let ai: Awaited<ReturnType<typeof generateMissedCallReply>> | null = null
  try {
    ai = await generateMissedCallReply(
      business.id,
      history,
      { callerName: lead.callerName ?? undefined, serviceRequested: lead.serviceRequested ?? undefined }
    )
    aiMessage = ai.message
  } catch (e: any) {
    console.error('[Twilio SMS] AI reply failed, using fallback:', e?.message)
  }

  // Update lead with AI-extracted info
  await prisma.missedCallLead.update({
    where: { id: lead.id },
    data: {
      callerName:       ai?.callerName       ?? lead.callerName,
      category:         (ai?.category        ?? lead.category) as any,
      urgency:          (ai?.urgency         ?? lead.urgency) as any,
      serviceRequested: ai?.serviceRequested ?? lead.serviceRequested,
      notes:            ai?.notes            ?? lead.notes,
      lastContactAt:    new Date(),
    },
  })

  // Save AI reply
  await prisma.missedCallMessage.create({ data: { leadId: lead.id, role: 'ASSISTANT', content: aiMessage } })

  // Auto-create a draft job for HOT or URGENT leads that mention a service
  if (ai && ['HOT', 'URGENT'].includes(ai.category) && ai.serviceRequested && !lead.convertedToJob) {
    try {
      const updatedBusiness = await prisma.business.update({
        where: { id: business.id },
        data: { jobSeq: { increment: 1 } },
      })
      const jobNumber = `JOB-${String(updatedBusiness.jobSeq).padStart(4, '0')}`
      const callerName = ai.callerName ?? lead.callerName ?? 'Unknown (missed call)'
      await prisma.job.create({
        data: {
          businessId: business.id,
          jobNumber,
          title: ai.serviceRequested,
          description: `Auto-created from missed call text-back.\nCaller: ${callerName} (${from})\nNotes: ${ai.notes ?? 'None'}`,
          status: 'BOOKED',
          internalNotes: `Lead category: ${ai.category}. Urgency: ${ai.urgency}. Created automatically from SMS conversation.`,
        },
      })
      await prisma.missedCallLead.update({
        where: { id: lead.id },
        data: { convertedToJob: true },
      })
      console.log(`[Twilio SMS] Auto-created job ${jobNumber} for ${from} (${ai.category})`)
    } catch (e: any) {
      console.error('[Twilio SMS] Auto-job creation failed:', e?.message)
    }
  }

  // Send SMS reply via Twilio
  const twilio = (await import('twilio')).default
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  await client.messages.create({ from: to, to: from, body: aiMessage })

  console.log(`[Twilio SMS] Replied to ${from}: ${aiMessage.substring(0, 60)}`)
  return twiml('')
}

function twiml(xml: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
