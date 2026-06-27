export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = '+61468073464'
  const to    = process.env.OWNER_PHONE_NUMBER ?? ''

  if (!sid || !token) return NextResponse.json({ error: 'Missing Twilio credentials', sid: !!sid, token: !!token })
  if (!to)            return NextResponse.json({ error: 'OWNER_PHONE_NUMBER not set' })

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(sid, token)
    const msg = await client.messages.create({ from, to, body: 'OrcaTradie test SMS ✅' })
    return NextResponse.json({ ok: true, sid: msg.sid, status: msg.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: 500 })
  }
}
