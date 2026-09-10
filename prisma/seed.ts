import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Frisco is The Aesthetic Equation's training hub, not a Beauty Bar IQ
// treatment location — type: TRAINING keeps it out of every public
// "book a location" list (/api/locations filters to SERVICE by default)
// without deleting the real address, which is still useful internally.
const LOCATIONS = [
  { city: "Prosper", name: "Beauty Bar IQ", address: "4580 W. University #136, Prosper, TX 75078", displayOrder: 0, type: "SERVICE" as const },
  { city: "Frisco", name: "Studio 423", address: "1931 FM423 #401, Frisco, TX 75033", displayOrder: 1, type: "TRAINING" as const },
  { city: "Midland", name: "Beauty Bar IQ", address: "4400 N. Midland Dr #2750, Midland, TX 79707", displayOrder: 2, type: "SERVICE" as const },
];

// The 3 services the business wants SEO/conversion effort concentrated on
// (isPriority: true) — content is deliberately general/educational rather
// than making specific medical claims or citing invented statistics; a
// real consultation, not this page, is where individualized guidance
// happens.
const SERVICES = [
  {
    slug: "hormones",
    name: "Hormone Therapy",
    category: "Wellness",
    shortDescription: "Personalized hormone therapy to help address symptoms related to hormonal imbalance.",
    description: [
      "Hormonal changes — whether from aging, stress, or other factors — can affect energy, mood, sleep, weight, and overall well-being. Hormone therapy at Beauty Bar IQ starts with a real conversation about your symptoms and health history, not a one-size-fits-all prescription.",
    ],
    benefits: [
      "A personalized plan based on your own symptoms and lab work",
      "Ongoing monitoring and adjustments as your body responds",
      "A provider who explains the reasoning behind each recommendation",
    ],
    candidateInfo: [
      "Hormone therapy is discussed with adults experiencing symptoms commonly associated with hormonal imbalance — such as fatigue, mood changes, sleep disruption, or changes in weight or libido. A consultation, including relevant lab work, is the starting point for determining whether therapy is appropriate for you.",
    ],
    whatToExpect: [
      "Your first visit includes a detailed discussion of your symptoms, health history, and goals, along with any lab work needed to guide a plan. Follow-up visits track how you're responding and adjust the plan accordingly.",
    ],
    isPriority: true,
    displayOrder: 0,
    seoTitle: "Hormone Therapy in Prosper & Midland, TX | Beauty Bar IQ",
    seoDescription: "Personalized hormone therapy at Beauty Bar IQ in Prosper and Midland, TX. Schedule a consultation to discuss your symptoms and options.",
    faqs: [
      { question: "Do I need lab work before starting hormone therapy?", answer: "Yes — a consultation typically includes or is followed by lab work so your plan is based on your actual levels, not guesswork." },
      { question: "How soon will I notice a difference?", answer: "This varies by person and by what's being addressed. Your provider will talk through a realistic timeline for your specific situation during your consultation." },
    ],
  },
  {
    slug: "weight-loss",
    name: "Medical Weight Loss",
    category: "Wellness",
    shortDescription: "A medically supervised weight loss program built around your goals and health history.",
    description: [
      "Sustainable weight loss is rarely just about willpower — it's about having the right plan, support, and medical guidance. Beauty Bar IQ's medical weight loss program combines provider oversight with a plan tailored to your health history and goals.",
    ],
    benefits: [
      "Medical supervision throughout your program",
      "A plan built around your health history, not a generic template",
      "Regular check-ins to track progress and adjust as needed",
    ],
    candidateInfo: [
      "Medical weight loss is discussed with adults looking for a supervised, structured approach to weight management. A consultation reviews your health history and goals to determine whether this program is a good fit for you.",
    ],
    whatToExpect: [
      "Your first visit covers your health history, current habits, and goals, followed by a discussion of the options available to you. Ongoing visits track your progress and adjust your plan as your body responds.",
    ],
    isPriority: true,
    displayOrder: 1,
    seoTitle: "Medical Weight Loss in Prosper & Midland, TX | Beauty Bar IQ",
    seoDescription: "Medically supervised weight loss at Beauty Bar IQ in Prosper and Midland, TX. Schedule a consultation to build a plan around your goals.",
    faqs: [
      { question: "Is this a medically supervised program?", answer: "Yes — your plan is developed and monitored by a provider, with regular check-ins as you progress." },
      { question: "What happens at the first visit?", answer: "We'll review your health history and goals together and talk through what a plan built around those could look like." },
    ],
  },
  {
    slug: "facial-balancing",
    name: "Facial Balancing",
    category: "Injectables",
    shortDescription: "A thoughtful, whole-face approach to injectables that enhances natural harmony rather than treating one feature at a time.",
    description: [
      "Facial balancing looks at your face as a whole — proportion, symmetry, and how features work together — rather than treating a single area in isolation. Using a combination of injectables tailored to your features, the goal is a natural, harmonious result specific to you.",
    ],
    benefits: [
      "A whole-face consultation, not a single-treatment mindset",
      "A plan based on your own facial structure and goals",
      "Natural-looking results built around balance and proportion",
    ],
    candidateInfo: [
      "Facial balancing is discussed with adults interested in enhancing overall facial harmony rather than addressing just one area. Your provider will assess your features and discuss which combination of treatments, if any, may help you reach your goals.",
    ],
    whatToExpect: [
      "Your consultation includes an assessment of your facial structure and a conversation about your goals, followed by a personalized treatment recommendation. Most facial balancing plans combine more than one treatment over one or more visits.",
    ],
    isPriority: true,
    displayOrder: 2,
    seoTitle: "Facial Balancing in Prosper & Midland, TX | Beauty Bar IQ",
    seoDescription: "Whole-face facial balancing at Beauty Bar IQ in Prosper and Midland, TX. Schedule a consultation to discuss a plan built around your features.",
    faqs: [
      { question: "What's the difference between facial balancing and getting one treatment, like Botox?", answer: "Facial balancing looks at how your features work together as a whole, and often combines more than one treatment, rather than focusing on a single area." },
      { question: "Will the results look natural?", answer: "The goal of facial balancing is natural-looking harmony, not an overdone result. Your provider will discuss your goals and what a natural result looks like for your features." },
    ],
  },
];

const TESTIMONIALS = [
  { name: "Claudia", quote: "I've had the pleasure of experiencing the services of the skilled beauty injector Gina, and I couldn't be more thrilled with the results.", displayOrder: 0 },
  { name: "K'Dee", quote: "Gina is a magician. I started going to her a few years ago and I won't trust anyone else.", displayOrder: 1 },
  { name: "Carol", quote: "Gina is the BEST. I am very particular and I went to a Botox party and saw the way she took her time and explained every option.", displayOrder: 2 },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "gina@beautybariq.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("Set SEED_ADMIN_PASSWORD before seeding (the initial admin login password).");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, firstName: "Gina", lastName: "Rivas", role: "ADMIN" },
    update: {},
  });
  console.log(`Seeded admin user: ${adminEmail}`);

  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findFirst({ where: { city: loc.city } });
    if (!existing) {
      await prisma.location.create({ data: loc });
    } else if (existing.type !== loc.type) {
      // Corrects Frisco's type on databases seeded before the
      // SERVICE/TRAINING distinction existed.
      await prisma.location.update({ where: { id: existing.id }, data: { type: loc.type } });
    }
  }
  console.log(`Seeded ${LOCATIONS.length} locations (skipping any that already exist, correcting type on any that don't match).`);

  for (const svc of SERVICES) {
    const existing = await prisma.service.findUnique({ where: { slug: svc.slug } });
    if (!existing) await prisma.service.create({ data: svc });
  }
  console.log(`Seeded ${SERVICES.length} priority services (skipping any that already exist).`);

  for (const t of TESTIMONIALS) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name, quote: t.quote } });
    if (!existing) await prisma.testimonial.create({ data: t });
  }
  console.log(`Seeded ${TESTIMONIALS.length} testimonials (skipping any that already exist).`);

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {},
  });
  console.log("Seeded site settings (defaults — edit from the admin dashboard).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
