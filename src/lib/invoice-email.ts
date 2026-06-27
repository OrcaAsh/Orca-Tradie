import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM ?? 'invoices@orcatradie.com.au'

export interface InvoiceEmailData {
  to:            string
  clientName:    string
  businessName:  string
  businessPhone: string | null
  businessEmail: string | null
  businessAbn:   string | null
  invoiceNumber: string
  jobTitle:      string
  vehicleDesc:   string | null
  laborCost:     number | null
  partsCost:     number | null
  subtotal:      number
  gst:           number
  total:         number
  dueDate:       Date | null
  paymentUrl:    string | null
}

function formatAud(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function buildHtml(d: InvoiceEmailData): string {
  const due = d.dueDate
    ? new Date(d.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#1e3a5f;padding:32px 40px;">
      <div style="color:#fff;font-size:24px;font-weight:700;">${d.businessName}</div>
      <div style="color:#93c5fd;font-size:14px;margin-top:4px;">
        ${d.businessPhone ?? ''}${d.businessPhone && d.businessEmail ? ' · ' : ''}${d.businessEmail ?? ''}
        ${d.businessAbn ? `<br/>ABN ${d.businessAbn}` : ''}
      </div>
    </div>

    <!-- Invoice meta -->
    <div style="padding:32px 40px 0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:28px;font-weight:700;color:#111827;">Tax Invoice</div>
          <div style="color:#6b7280;font-size:14px;margin-top:4px;">${d.invoiceNumber}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${formatAud(d.total)}</div>
          ${due ? `<div style="color:#6b7280;font-size:13px;margin-top:4px;">Due ${due}</div>` : ''}
        </div>
      </div>

      <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:10px;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Billed to</div>
        <div style="font-weight:600;color:#111827;">${d.clientName}</div>
      </div>

      <!-- Job details -->
      <div style="margin-top:24px;">
        <div style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Job Details</div>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:10px;">
          <div style="font-weight:600;color:#111827;">${d.jobTitle}</div>
          ${d.vehicleDesc ? `<div style="color:#6b7280;font-size:14px;margin-top:4px;">${d.vehicleDesc}</div>` : ''}
        </div>
      </div>

      <!-- Line items -->
      <div style="margin-top:24px;">
        <div style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Charges</div>
        <table style="width:100%;border-collapse:collapse;">
          ${d.laborCost ? `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:12px 0;color:#374151;">Labour</td>
            <td style="padding:12px 0;text-align:right;font-weight:500;color:#111827;">${formatAud(d.laborCost)}</td>
          </tr>` : ''}
          ${d.partsCost ? `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:12px 0;color:#374151;">Parts &amp; Materials</td>
            <td style="padding:12px 0;text-align:right;font-weight:500;color:#111827;">${formatAud(d.partsCost)}</td>
          </tr>` : ''}
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:12px 0;color:#374151;">Subtotal</td>
            <td style="padding:12px 0;text-align:right;font-weight:500;color:#111827;">${formatAud(d.subtotal)}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:12px 0;color:#374151;">GST (10%)</td>
            <td style="padding:12px 0;text-align:right;font-weight:500;color:#111827;">${formatAud(d.gst)}</td>
          </tr>
          <tr>
            <td style="padding:16px 0 8px;font-weight:700;font-size:16px;color:#111827;">Total (inc. GST)</td>
            <td style="padding:16px 0 8px;text-align:right;font-weight:700;font-size:20px;color:#16a34a;">${formatAud(d.total)}</td>
          </tr>
        </table>
      </div>

      <!-- Pay button -->
      ${d.paymentUrl ? `
      <div style="margin-top:28px;text-align:center;">
        <a href="${d.paymentUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:16px;padding:14px 40px;border-radius:10px;text-decoration:none;">
          Pay Now
        </a>
        <div style="color:#9ca3af;font-size:12px;margin-top:8px;">Secure card payment</div>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div style="padding:32px 40px;margin-top:32px;border-top:1px solid #f3f4f6;text-align:center;color:#9ca3af;font-size:12px;">
      Thank you for your business.<br/>
      ${d.businessName} · Powered by OrcaTradie
    </div>
  </div>
</body>
</html>`
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping invoice email')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    FROM,
    to:      data.to,
    subject: `Invoice ${data.invoiceNumber} from ${data.businessName} — ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(data.total)}`,
    html:    buildHtml(data),
  })
}
