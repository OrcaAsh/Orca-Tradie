import twilio from 'twilio'

const FROM = process.env.TWILIO_PHONE_NUMBER!

export async function sendInvoiceSms(
  to: string,
  clientName: string,
  businessName: string,
  invoiceNumber: string,
  total: number,
  vehicleDesc: string | null,
  paymentUrl: string | null,
): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
    console.warn('Twilio not configured — skipping invoice SMS')
    return
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const amount = total.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })

  const body = paymentUrl
    ? `Hi ${clientName.split(' ')[0]}, your ${vehicleDesc ?? 'vehicle'} is ready. Invoice ${invoiceNumber}: ${amount}. Pay securely here: ${paymentUrl} — ${businessName}`
    : `Hi ${clientName.split(' ')[0]}, your ${vehicleDesc ?? 'vehicle'} is ready. Invoice ${invoiceNumber}: ${amount}. Please call us to arrange payment. — ${businessName}`

  await client.messages.create({ from: FROM, to, body })
}
