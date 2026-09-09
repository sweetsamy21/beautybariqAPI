import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LOCATIONS = [
  { city: "Prosper", name: "Beauty Bar IQ", address: "4580 W. University #136, Prosper, TX 75078", displayOrder: 0 },
  { city: "Frisco", name: "Studio 423", address: "1931 FM423 #401, Frisco, TX 75033", displayOrder: 1 },
  { city: "Midland", name: "Beauty Bar IQ", address: "4400 N. Midland Dr #2750, Midland, TX 79707", displayOrder: 2 },
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
    if (!existing) await prisma.location.create({ data: loc });
  }
  console.log(`Seeded ${LOCATIONS.length} locations (skipping any that already exist).`);

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
