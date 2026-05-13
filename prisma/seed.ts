import { PrismaClient, Role } from "@prisma/client";
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

  // P0.A.1: Ensure first user of each Organization is OWNER (idempotent)
  // This handles legacy data where the org-creator may not have OWNER role.
  //
  // CROSS-ORG SUPERUSER SCOPE: This block reads all organizations and may
  // update users across tenant boundaries. This is safe because:
  //   1. Seed scripts run as the postgres superuser via DATABASE_URL
  //   2. Seed scripts are NOT the runtime app — they run in an operator context
  //   3. The app's prismaAdmin (lib/prismaAdmin.ts) is for runtime superadmin
  //      paths; seed scripts create their own PrismaClient with direct connection
  // TODO: remove after P0.A.7 ships (all orgs will have OWNER set at registration)
  const orgs = await prisma.organization.findMany({
    include: {
      users: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  for (const o of orgs) {
    const firstUser = o.users[0];
    if (firstUser && firstUser.role !== Role.OWNER) {
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: Role.OWNER },
      });
      console.log(`P0.A.1: Promoted ${firstUser.email} to OWNER for org ${o.id}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
