import { prisma } from './prisma'
import { sendInvoiceEmail } from './invoice-email'
import { sendInvoiceSms } from './invoice-sms'

export async function autoInvoiceJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where:   { id: jobId },
    include: {
      business: true,
      customer: true,
      vehicle:  true,
      items:    true,
    },
  })

  if (!job || !job.customer) return

  // Don't double-invoice
  const existing = await prisma.invoice.findUnique({ where: { jobId } })
  if (existing) return

  const customer = job.customer
  const business = job.business

  // Calculate totals — use job values if set, otherwise sum items
  let subtotal = job.totalValue
    ?? (job.laborCost ?? 0) + (job.partsCost ?? 0)

  // If still zero, try summing job items
  if (!subtotal && job.items.length > 0) {
    subtotal = job.items.reduce((s, i) => s + i.total, 0)
  }

  if (!subtotal) return // nothing to invoice

  const gst   = Math.round(subtotal * 0.1 * 100) / 100
  const total  = Math.round((subtotal + gst) * 100) / 100

  // Increment invoice sequence
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id },
    data:  { invoiceSeq: { increment: 1 } },
  })
  const invoiceNumber = `INV-${String(updatedBusiness.invoiceSeq).padStart(4, '0')}`

  const clientName  = `${customer.firstName} ${customer.lastName ?? ''}`.trim()
  const vehicleDesc = job.vehicle
    ? `${job.vehicle.year ?? ''} ${job.vehicle.make} ${job.vehicle.model}${job.vehicle.rego ? ` (${job.vehicle.rego})` : ''}`.trim()
    : null

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  // Stripe payment link placeholder — replace with real Stripe link when configured
  const paymentUrl = process.env.STRIPE_PAYMENT_LINK_BASE
    ? `${process.env.STRIPE_PAYMENT_LINK_BASE}?invoice=${invoiceNumber}`
    : null

  // Create invoice in DB
  const invoice = await prisma.invoice.create({
    data: {
      businessId:  business.id,
      jobId,
      invoiceNumber,
      clientName,
      clientEmail: customer.email ?? undefined,
      subtotal,
      gst,
      total,
      status:  customer.email ? 'SENT' : 'DRAFT',
      dueDate,
      sentAt:  customer.email ? new Date() : undefined,
    },
  })

  // Fire email and SMS in parallel — don't let either failure block the other
  const emailPromise = customer.email
    ? sendInvoiceEmail({
        to:            customer.email,
        clientName,
        businessName:  business.name,
        businessPhone: business.ownerPhone,
        businessEmail: business.ownerEmail,
        businessAbn:   business.gstNumber,
        invoiceNumber,
        jobTitle:      job.title,
        vehicleDesc,
        laborCost:     job.laborCost,
        partsCost:     job.partsCost,
        subtotal,
        gst,
        total,
        dueDate,
        paymentUrl,
      }).catch(e => console.error('Invoice email failed:', e))
    : Promise.resolve()

  const smsPromise = customer.phone
    ? sendInvoiceSms(
        customer.phone,
        clientName,
        business.name,
        invoiceNumber,
        total,
        vehicleDesc,
        paymentUrl,
      ).catch(e => console.error('Invoice SMS failed:', e))
    : Promise.resolve()

  await Promise.all([emailPromise, smsPromise])

  console.log(`Auto-invoice ${invoiceNumber} created and sent for job ${job.jobNumber}`)
}
