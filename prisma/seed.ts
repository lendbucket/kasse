import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // Create a seed organization first
  const org = await prisma.organization.upsert({
    where: { slug: "seed-salon" },
    update: {},
    create: {
      id: "seed-org",
      name: "Seed Salon",
      slug: "seed-salon",
      plan: "starter",
      planStatus: "trial",
    },
  });

  const location = await prisma.location.upsert({
    where: { id: "seed-main-location" },
    update: {},
    create: {
      id: "seed-main-location",
      name: "Main Location",
      organizationId: org.id,
    },
  });

  await prisma.service.upsert({
    where: { id: "seed-service-haircut" },
    update: {},
    create: {
      id: "seed-service-haircut",
      name: "Haircut",
      price: 35,
      duration: 45,
      category: "Hair",
      locationId: location.id,
      organizationId: org.id,
    },
  });

  await prisma.service.upsert({
    where: { id: "seed-service-blowout" },
    update: {},
    create: {
      id: "seed-service-blowout",
      name: "Blowout",
      price: 45,
      duration: 60,
      category: "Hair",
      locationId: location.id,
      organizationId: org.id,
    },
  });

  await prisma.staff.upsert({
    where: { id: "seed-staff-clarissa" },
    update: {},
    create: {
      id: "seed-staff-clarissa",
      name: "Clarissa Reyna",
      role: "manager",
      locationId: location.id,
      organizationId: org.id,
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { id: "seed-staff-alexis" },
    update: {},
    create: {
      id: "seed-staff-alexis",
      name: "Alexis Rodriguez",
      role: "stylist",
      locationId: location.id,
      organizationId: org.id,
      isActive: true,
    },
  });

  console.log("Seeded organization + location + services + staff");
  // P0.A.1 org-owner backfill was extracted to scripts/backfill-org-owners.ts (P0.A.2).
  // Run separately via: npm run backfill:org-owners
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
