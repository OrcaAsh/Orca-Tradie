import twilio from 'twilio'

/**
 * Validates that a webhook request genuinely came from Twilio.
 * Without this, anyone can POST to our SMS endpoint and trigger AI + SMS sends at our cost.
 */
export function validateTwilioSignature(req: Request, body: URLSearchParams): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false

  const signature = req.headers.get('x-twilio-signature') ?? ''
  const url = process.env.NEXTAUTH_URL + new URL(req.url).pathname

  return twilio.validateRequest(authToken, signature, url, Object.fromEntries(body))
}
