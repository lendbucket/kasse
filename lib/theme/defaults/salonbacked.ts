import type { ThemeConfig } from "../types";

export const salonBackedTheme: ThemeConfig = {
  id: 'salonbacked-default',
  name: 'SalonBacked',
  colors: {
    primary: '#606E74',
    primaryHover: '#7a8f96',     // bright accent on hover
    background: '#06080d',
    surface: '#0d1117',
    border: '#1c2128',
    text: '#e6edf3',
    textMuted: '#8b949e',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    info: '#58a6ff',
  },
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", "Fira Code", Consolas, monospace',
  },
  logo: {
    light: '/logos/salonbacked-light.svg',
    dark: '/logos/salonbacked-dark.svg',
  },
  copy: {
    productName: 'SalonBacked',
    poweredBy: 'Backed by Reyna Insure',
    supportEmail: 'support@salonbacked.com',
  },
  emailTemplates: {
    senderName: 'SalonBacked',
    senderEmail: 'noreply@salonbacked.com',
    footerHtml: '<p style="font-size:12px;color:#8b949e;text-align:center;margin-top:24px">Backed by Reyna Insure &middot; <a href="https://salonbacked.com" style="color:#606E74">salonbacked.com</a></p>',
  },
  legal: {
    privacyUrl: 'https://salonbacked.com/privacy',
    termsUrl: 'https://salonbacked.com/terms',
    dpaUrl: 'https://salonbacked.com/dpa',
  },
};
