import { PrismaClient, Role } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")

  const adapter = new PrismaPg({ connectionString: url })
  const prisma = new PrismaClient({ adapter })

  const password = await bcrypt.hash("KasseAdmin2026!", 12)

  const admin = await prisma.user.upsert({
    where: { email: "ceo@36west.org" },
    update: { role: Role.SUPERADMIN, password },
    create: {
      email: "ceo@36west.org",
      name: "Robert Reyna",
      password,
      role: Role.SUPERADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
  })

  console.log("Superadmin created:", admin.email)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
