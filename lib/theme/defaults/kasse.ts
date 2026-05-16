import type { ThemeConfig } from "../types";

export const kasseTheme: ThemeConfig = {
  id: 'kasse-default',
  name: 'Kasse',
  colors: {
    primary: '#606E74',         // Kasse teal slate accent
    primaryHover: '#4F5B61',
    background: '#f7f8fa',      // page bg
    surface: '#ffffff',         // card bg
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
  },
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
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
    footerHtml: '<p style="font-size:12px;color:#6b7280;text-align:center;margin-top:24px">Powered by Reyna Pay &middot; <a href="https://kasseapp.com" style="color:#606E74">kasseapp.com</a></p>',
  },
  legal: {
    privacyUrl: 'https://kasseapp.com/privacy',
    termsUrl: 'https://kasseapp.com/terms',
    dpaUrl: 'https://kasseapp.com/dpa',
  },
};
