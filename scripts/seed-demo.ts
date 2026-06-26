import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding OrcaTradie demo data...')

  // Business
  const business = await prisma.business.create({
    data: {
      name: "Mick's Mechanical",
      ownerName: 'Mick Harrington',
      ownerPhone: '+61412345678',
      ownerEmail: 'mick@micksmechanical.com.au',
      address: '42 Ainsworth St',
      suburb: 'Phillip',
      state: 'ACT',
      laborRate: 120,
      gstNumber: '45 678 901 234',
      googleReviewUrl: 'https://g.page/r/demo',
      plan: 'GROWTH',
    },
  })

  // Owner user
  const passwordHash = await bcrypt.hash('demo1234', 12)
  await prisma.user.create({
    data: {
      businessId: business.id,
      name: 'Mick Harrington',
      email: 'mick@micksmechanical.com.au',
      passwordHash,
      role: 'OWNER',
    },
  })

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { businessId: business.id, firstName: 'Brent', lastName: 'Collins', phone: '0411 234 567', email: 'brent.collins@gmail.com', suburb: 'Woden', isVip: true } }),
    prisma.customer.create({ data: { businessId: business.id, firstName: 'Sarah', lastName: 'Park', phone: '0422 987 654', email: 'sarah.park@outlook.com', suburb: 'Tuggeranong' } }),
    prisma.customer.create({ data: { businessId: business.id, firstName: 'Dan', lastName: 'Watts', phone: '0433 111 222', suburb: 'Belconnen' } }),
    prisma.customer.create({ data: { businessId: business.id, firstName: 'Kelly', lastName: 'Morrison', phone: '0455 888 999', email: 'kelly.m@gmail.com', suburb: 'Gungahlin' } }),
    prisma.customer.create({ data: { businessId: business.id, firstName: 'James', lastName: 'Tran', phone: '0466 321 654', suburb: 'Queanbeyan' } }),
  ])

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { businessId: business.id, customerId: customers[0].id, make: 'Toyota', model: 'HiLux', year: 2019, rego: 'YBX 42T', regoExpiry: new Date('2025-09-15'), colour: 'White', transmission: 'Auto', odometer: 87430, engineSize: '2.8L Diesel' } }),
    prisma.vehicle.create({ data: { businessId: business.id, customerId: customers[1].id, make: 'Mazda', model: 'CX-5', year: 2021, rego: 'ACP 71K', regoExpiry: new Date('2026-02-28'), colour: 'Blue', transmission: 'Auto', odometer: 42100 } }),
    prisma.vehicle.create({ data: { businessId: business.id, customerId: customers[2].id, make: 'Ford', model: 'Ranger', year: 2018, rego: 'DXM 88F', regoExpiry: new Date('2025-07-31'), colour: 'Grey', transmission: 'Manual', odometer: 115000 } }),
    prisma.vehicle.create({ data: { businessId: business.id, customerId: customers[3].id, make: 'Hyundai', model: 'Tucson', year: 2022, rego: 'LPK 55N', regoExpiry: new Date('2026-11-30'), colour: 'Silver', transmission: 'Auto', odometer: 28700 } }),
    prisma.vehicle.create({ data: { businessId: business.id, customerId: customers[4].id, make: 'Holden', model: 'Colorado', year: 2017, rego: 'PWT 99Q', regoExpiry: new Date('2025-08-20'), colour: 'Black', transmission: 'Auto', odometer: 142800 } }),
  ])

  // Jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        businessId: business.id, customerId: customers[0].id, vehicleId: vehicles[0].id,
        jobNumber: 'JOB-0001', title: '100,000km Service + Timing Belt',
        description: 'Full 100k service including timing belt replacement, water pump, all fluids',
        status: 'BOOKED', scheduledAt: new Date(Date.now() + 86400000),
        odometerIn: 87430,
        aiPriceSuggestion: 1450,
        aiUpsell: 'Belt tensioners should be replaced at the same time — add $85 parts to avoid labour again in 12 months',
      },
    }),
    prisma.job.create({
      data: {
        businessId: business.id, customerId: customers[1].id, vehicleId: vehicles[1].id,
        jobNumber: 'JOB-0002', title: 'Brake pads & rotors front',
        description: 'Customer reported vibration under braking. Inspect and replace front brakes.',
        status: 'IN_PROGRESS', scheduledAt: new Date(),
        odometerIn: 42100, laborHours: 2.5, laborCost: 300, partsCost: 280,
        aiUpsell: 'Rear brake pads at 40% — worth doing now to save a second booking in 3 months',
      },
    }),
    prisma.job.create({
      data: {
        businessId: business.id, customerId: customers[2].id, vehicleId: vehicles[2].id,
        jobNumber: 'JOB-0003', title: 'Clutch replacement',
        description: 'Clutch slipping under load. Replace clutch kit.',
        status: 'WAITING_PARTS', odometerIn: 115000,
        internalNotes: 'Waiting on Repco — clutch kit ETA Thursday',
        aiPriceSuggestion: 1100,
      },
    }),
    prisma.job.create({
      data: {
        businessId: business.id, customerId: customers[3].id, vehicleId: vehicles[3].id,
        jobNumber: 'JOB-0004', title: 'Logbook service 30,000km',
        description: 'Standard 30k logbook service per manufacturer spec',
        status: 'COMPLETED', odometerIn: 28700, odometerOut: 28700,
        laborHours: 2, laborCost: 240, partsCost: 160, totalValue: 400, profit: 280,
        completedAt: new Date(Date.now() - 2 * 86400000),
      },
    }),
    prisma.job.create({
      data: {
        businessId: business.id, customerId: customers[0].id, vehicleId: vehicles[0].id,
        jobNumber: 'JOB-0005', title: 'EGR valve clean + DPF forced regen',
        description: 'DPF warning light. EGR valve carboned up.',
        status: 'PAID', odometerIn: 85200, odometerOut: 85200,
        laborHours: 3, laborCost: 360, partsCost: 0, totalValue: 360, profit: 360,
        completedAt: new Date(Date.now() - 14 * 86400000),
      },
    }),
  ])

  // Invoice for paid job
  await prisma.invoice.create({
    data: {
      businessId: business.id, jobId: jobs[4].id,
      invoiceNumber: 'INV-0001',
      clientName: 'Brent Collins',
      clientEmail: 'brent.collins@gmail.com',
      subtotal: 327.27, gst: 32.73, total: 360,
      status: 'PAID', paidAt: new Date(Date.now() - 13 * 86400000),
      dueDate: new Date(Date.now() - 7 * 86400000),
      sentAt: new Date(Date.now() - 14 * 86400000),
    },
  })

  // Invoice for completed job (outstanding)
  await prisma.invoice.create({
    data: {
      businessId: business.id, jobId: jobs[3].id,
      invoiceNumber: 'INV-0002',
      clientName: 'Kelly Morrison',
      clientEmail: 'kelly.m@gmail.com',
      subtotal: 363.64, gst: 36.36, total: 400,
      status: 'SENT', dueDate: new Date(Date.now() + 14 * 86400000),
      sentAt: new Date(Date.now() - 2 * 86400000),
    },
  })

  // Parts
  await prisma.part.createMany({
    data: [
      { businessId: business.id, name: 'Oil Filter — Toyota', partNumber: '04152-YZZA6', category: 'Filters', costPrice: 8.5, sellPrice: 18, stockQty: 12, minStock: 5, location: 'B2' },
      { businessId: business.id, name: 'Brake Pads — Front (generic)', category: 'Brakes', costPrice: 45, sellPrice: 95, stockQty: 3, minStock: 4, location: 'C1' },
      { businessId: business.id, name: 'Engine Oil 5W-30 (5L)', category: 'Lubricants', costPrice: 22, sellPrice: 48, stockQty: 8, minStock: 5, location: 'A1' },
      { businessId: business.id, name: 'Coolant 1L', category: 'Lubricants', costPrice: 6, sellPrice: 14, stockQty: 2, minStock: 6, location: 'A2' },
      { businessId: business.id, name: 'Spark Plugs (Iridium) x4', category: 'Ignition', costPrice: 28, sellPrice: 65, stockQty: 6, minStock: 4, location: 'D3' },
    ],
  })

  // Reminders
  await prisma.reminder.createMany({
    data: [
      { businessId: business.id, customerId: customers[2].id, vehicleId: vehicles[2].id, type: 'REGO_EXPIRY', message: "Dan Watts's Ford Ranger rego expires 31 July — call to book", dueAt: new Date('2025-07-21') },
      { businessId: business.id, customerId: customers[4].id, vehicleId: vehicles[4].id, type: 'REGO_EXPIRY', message: "James Tran's Holden Colorado rego expires 20 Aug", dueAt: new Date('2025-08-10') },
      { businessId: business.id, customerId: customers[0].id, vehicleId: vehicles[0].id, type: 'SERVICE_DUE', message: "Brent Collins HiLux due for service at 90,000km (~2,500km away)", dueAt: new Date(Date.now() + 30 * 86400000) },
      { businessId: business.id, customerId: customers[1].id, type: 'QUOTE_FOLLOWUP', message: 'Follow up Sarah Park on rear brake quote from last week', dueAt: new Date(Date.now() + 3 * 86400000) },
    ],
  })

  // Knowledge base
  await prisma.knowledgeBase.createMany({
    data: [
      { businessId: business.id, title: 'Pricing guide', content: 'Logbook service 15k: $180. 30k service: $380. 60k service: $480. 100k service: $650+. Labour rate $120/hr.', tags: ['pricing'] },
      { businessId: business.id, title: 'Common upsells', content: 'When doing brakes: check rotors for thickness and offer resurface or replace. When doing timing belt: always replace water pump and tensioners at same time.', tags: ['sales'] },
      { businessId: business.id, title: 'Toyota HiLux diesel notes', content: 'DPF issues common after 80k on 2015-2020 models. EGR valve carbon buildup. Recommend clean at every 2nd service.', tags: ['toyota', 'hilux'] },
    ],
  })

  // Potential leads from Facebook
  await prisma.potentialLead.createMany({
    data: [
      {
        businessId: business.id,
        postId: 'demo-post-1',
        authorName: 'Aaron Mitchell',
        postText: 'Anyone know a good mechanic in Phillip/Woden area? My Ford Ranger needs a clutch replacement and the dealer wants $2,200 which seems crazy. Happy to go to a proper independent.',
        matchScore: 94,
        matchReason: 'Clutch replacement in our suburb, explicitly looking for independent mechanic, price-sensitive',
        suggestedReply: "Hi Aaron! We're based right in Phillip and specialise in exactly this kind of work. A clutch on a Ranger typically runs $900-$1,100 all in at our shop — much better than dealer rates. Give us a call on [phone] and we can get you a proper quote. 👍",
        priceEstimate: '$900–$1,100',
        status: 'PENDING',
      },
      {
        businessId: business.id,
        postId: 'demo-post-2',
        authorName: 'Jenny Liu',
        postText: 'Canberra mechanic recommendations? Moving from Sydney. Need somewhere reliable for my Mazda CX-5 logbook service that won\'t rip me off.',
        matchScore: 87,
        matchReason: 'New to Canberra looking for regular mechanic, Mazda CX-5 is a common vehicle we service',
        suggestedReply: "Hey Jenny, welcome to Canberra! We service plenty of CX-5s and do logbook services starting from $380. We're based in Phillip with online booking. DM us or call [phone] — happy to look after you. 🙂",
        priceEstimate: '$380–$420',
        status: 'PENDING',
      },
      {
        businessId: business.id,
        postId: 'demo-post-3',
        authorName: 'Tom Bradley',
        postText: 'Tyre change and wheel alignment Canberra south — anyone?',
        matchScore: 62,
        matchReason: 'We do this but it\'s a low-value job and many competitors do it',
        suggestedReply: "Hi Tom, we can do that for you! Alignment from $80, tyre swap $20/wheel. Based in Phillip. Give us a ring. 🔧",
        priceEstimate: '$100–$160',
        status: 'DISMISSED',
      },
    ],
  })

  console.log('✅ Demo seed complete!')
  console.log('Login: mick@micksmechanical.com.au / demo1234')
  console.log('Run on port 3002')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
