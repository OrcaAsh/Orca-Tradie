export const dynamic = 'force-dynamic'

/**
 * Twilio Recording Status Callback
 * Fires when a call recording is ready. Downloads, transcribes with Whisper,
 * summarises with Claude, and saves to the MissedCallLead.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const body         = await req.formData()
  const recordingUrl = body.get('RecordingUrl') as string
  const callSid      = body.get('CallSid') as string
  const duration     = parseInt(body.get('RecordingDuration') as string ?? '0')
  const from         = body.get('From') as string
  const to           = body.get('To') as string

  console.log(`[Recording] CallSid=${callSid} duration=${duration}s from=${from}`)

  // Skip very short recordings (under 10 seconds — likely just ringing)
  if (duration < 10) {
    console.log(`[Recording] Too short (${duration}s), skipping`)
    return NextResponse.json({ ok: true })
  }

  const business = await prisma.business.findFirst({
    where: { OR: [{ twilioPhoneNumber: to }, { ownerPhone: to }] },
  }) ?? await prisma.business.findFirst()
  if (!business) return NextResponse.json({ ok: true })

  const lead = await prisma.missedCallLead.findFirst({
    where: { businessId: business.id, phoneNumber: from },
    orderBy: { createdAt: 'desc' },
  })
  if (!lead) return NextResponse.json({ ok: true })

  // Save recording URL immediately
  await prisma.missedCallLead.update({
    where: { id: lead.id },
    data: { callRecordingUrl: `${recordingUrl}.mp3` },
  })

  // Download and transcribe with OpenAI Whisper
  let transcript = ''
  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const audioResponse = await fetch(`${recordingUrl}.mp3`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`,
      },
    })

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioFile = new File([audioBuffer], 'call.mp3', { type: 'audio/mpeg' })

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    })
    transcript = transcription.text
    console.log(`[Recording] Transcribed: ${transcript.substring(0, 100)}...`)
  } catch (e: any) {
    console.error('[Recording] Transcription failed:', e?.message)
  }

  // Summarise with Claude
  let summary = ''
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Summarise this mechanic workshop phone call in 2-3 sentences. Focus on: what the customer needs, any urgency, and key details the mechanic should know. Be concise and practical.

Call transcript:
${transcript || '(No transcript available)'}

Caller phone: ${from}
Business: ${business.name}`,
      }],
    })
    summary = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log(`[Recording] Summary: ${summary}`)
  } catch (e: any) {
    console.error('[Recording] Summary failed:', e?.message)
    summary = transcript ? `Call transcript available (${duration}s call)` : ''
  }

  // Save transcript and summary
  await prisma.missedCallLead.update({
    where: { id: lead.id },
    data: {
      callTranscript: transcript || null,
      callSummary:    summary || null,
      notes: summary ? `${lead.notes ? lead.notes + '\n\n' : ''}📞 Call summary: ${summary}` : lead.notes,
    },
  })

  console.log(`[Recording] Saved summary for lead ${lead.id}`)
  return NextResponse.json({ ok: true })
}
