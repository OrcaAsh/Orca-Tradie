import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const business = await prisma.business.findFirst()
  if (!business) {
    console.error('No business found — run seed-demo.ts first')
    process.exit(1)
  }

  console.log(`Seeding knowledge base for: ${business.name}`)

  await prisma.knowledgeBase.deleteMany({ where: { businessId: business.id } })

  await prisma.knowledgeBase.createMany({
    data: [
      {
        businessId: business.id,
        title: 'Services Offered',
        content: 'We offer: logbook servicing, oil & filter changes, brake repairs, tyre fitting & rotation, battery replacement, air conditioning regas, engine diagnostics, suspension & steering, roadworthy certificates (RWC), and general mechanical repairs. We service all makes and models including 4WDs and utes.',
        tags: ['services', 'general'],
      },
      {
        businessId: business.id,
        title: 'Pricing — Logbook Service',
        content: 'Minor logbook service (up to 4L oil): from $149. Major logbook service: from $249. Diesel vehicles add $30. Prices include oil, filter and a free 30-point safety check. We use genuine or OEM-spec parts to keep your warranty valid.',
        tags: ['pricing', 'service'],
      },
      {
        businessId: business.id,
        title: 'Pricing — Brakes',
        content: 'Brake pad replacement (per axle): from $180 fitted. Brake pad + rotor replacement (per axle): from $320 fitted. We only use quality pads — no cheap imports. We check brake fluid and callipers at no extra charge.',
        tags: ['pricing', 'brakes'],
      },
      {
        businessId: business.id,
        title: 'Pricing — Tyres',
        content: 'Tyre fitting from $25 per tyre (supply your own). Budget tyres from $89 fitted. Mid-range from $129 fitted. Premium from $189 fitted. Wheel alignment: $89 (2-wheel) or $129 (4-wheel). Tyre rotation: $49.',
        tags: ['pricing', 'tyres'],
      },
      {
        businessId: business.id,
        title: 'Pricing — Other Common Jobs',
        content: 'Air conditioning regas: from $120. Battery replacement (supply & fit): from $180. Roadworthy certificate: from $120. Coolant flush: from $99. Transmission service: from $199. Call for a quote on anything else — labour rate is $110/hr + GST.',
        tags: ['pricing', 'general'],
      },
      {
        businessId: business.id,
        title: 'Workshop Hours & Location',
        content: 'Open Monday to Friday 7:30am–5:30pm, Saturday 8am–1pm. Closed Sundays and public holidays. We are located in Fyshwick, ACT. Street parking available out front. Drop-offs welcome before opening — just leave keys in the drop box.',
        tags: ['hours', 'location'],
      },
      {
        businessId: business.id,
        title: 'Booking & Turnaround',
        content: 'Most services can be booked within 1–3 business days. Same-day bookings available for urgent repairs when we have a free bay. Standard service takes 1–2 hours. Larger jobs (engine work, suspension) may need the car for a full day. We\'ll call you with a quote before starting any work over $150.',
        tags: ['booking', 'turnaround'],
      },
      {
        businessId: business.id,
        title: 'Breakdowns & Urgent Repairs',
        content: 'If you\'ve broken down, let us know and we\'ll prioritise you. We can recommend a tow truck if needed. For urgent safety issues (brake failure, steering problems, smoke from engine), we treat these as emergencies and will fit you in ASAP.',
        tags: ['urgent', 'breakdown'],
      },
      {
        businessId: business.id,
        title: 'Warranties & Guarantees',
        content: 'All our work comes with a 12-month/20,000km warranty on parts and labour. We use quality parts from trusted Australian suppliers. If anything goes wrong with work we\'ve done, bring it back and we\'ll fix it at no charge.',
        tags: ['warranty', 'guarantee'],
      },
      {
        businessId: business.id,
        title: 'Payment Options',
        content: 'We accept cash, EFTPOS, Visa, Mastercard, and bank transfer. Invoice can be emailed for business customers. We do not offer Afterpay or payment plans. Full payment required on collection.',
        tags: ['payment'],
      },
    ],
  })

  console.log(`✅ Seeded 10 knowledge base entries for ${business.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
