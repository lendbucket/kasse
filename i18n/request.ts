import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { detectLocale } from '@/lib/i18n/detect';
import { loadMessages } from '@/lib/i18n/load-messages';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  let userLocale: string | null = null;
  let orgDefaultLocale: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      // Use prismaAdmin for this cross-cutting read — runs outside tenant scope
      // (locale detection happens before withTenantScope in the request lifecycle).
      const user = await prismaAdmin.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true, organizationId: true },
      });
      userLocale = user?.locale ?? null;
      if (user?.organizationId) {
        const org = await prismaAdmin.organization.findUnique({
          where: { id: user.organizationId },
          select: { defaultLocale: true },
        });
        orgDefaultLocale = org?.defaultLocale ?? null;
      }
    }
  } catch {
    // Auth failure or DB error — fall through to header/default detection
  }

  const locale = detectLocale({
    userLocale,
    organizationDefaultLocale: orgDefaultLocale,
    acceptLanguageHeader: acceptLanguage,
  });

  const messages = await loadMessages(locale);

  return { locale, messages };
});
