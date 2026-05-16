import type { ThemeConfig } from "../types";

export const kasseTheme: ThemeConfig = {
  id: 'kasse-default',
  name: 'Kasse',
  colors: {
    // Required ThemeConfig fields
    primary: '#2f5061',          // brand teal-navy (was #606E74 slate)
    primaryHover: '#264354',
    background: '#faf8f6',       // cream page bg (was #f7f8fa cool gray)
    surface: '#ffffff',          // card bg unchanged
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#4297a0',             // info shares accent teal
    // Kasse-specific brand colors
    brand: '#2f5061',
    brandHover: '#264354',
    accent: '#4297a0',           // bright teal
    accentHover: '#357b83',
    blush: '#e57f84',            // coral blush
    blushHover: '#d96a70',
    sidebar: '#2f5061',          // sidebar matches brand for cohesion
    cream: '#f4eae6',            // warm hover surface
  },
  fonts: {
    sans: 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", "Fira Code", Consolas, monospace',
  },
  logo: {
    light: '/logos/kasse-light.svg',
    dark: '/logos/kasse-dark.svg',
  },
  copy: {
    productName: 'Kasse',
    poweredBy: 'Powered by Reyna Pay',
    supportEmail: 'support@kasseapp.com',
  },
  emailTemplates: {
    senderName: 'Kasse',
    senderEmail: 'noreply@kasseapp.com',
    footerHtml: '<p style="font-size:12px;color:#6b7280;text-align:center;margin-top:24px">Powered by Reyna Pay &middot; <a href="https://kasseapp.com" style="color:#2f5061">kasseapp.com</a></p>',
  },
  legal: {
    privacyUrl: 'https://kasseapp.com/privacy',
    termsUrl: 'https://kasseapp.com/terms',
    dpaUrl: 'https://kasseapp.com/dpa',
  },
};
