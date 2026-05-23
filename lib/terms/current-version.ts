import { prismaAdmin } from "@/lib/prismaAdmin"

export async function getCurrentTermsVersion() {
  return await prismaAdmin.termsVersion.findFirst({
    where: { effectiveAt: { lte: new Date() } },
    orderBy: { effectiveAt: "desc" },
  })
}

export async function userHasAcceptedCurrentTerms(userId: string): Promise<boolean> {
  const current = await getCurrentTermsVersion()
  if (!current) return true  // No terms exist yet — don't block

  const acceptance = await prismaAdmin.termsAcceptance.findUnique({
    where: { userId_termsVersionId: { userId, termsVersionId: current.id } },
  })

  return acceptance !== null
}
