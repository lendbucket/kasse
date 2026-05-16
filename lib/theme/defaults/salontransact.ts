import type { ThemeConfig } from "../types";

export const salonTransactTheme: ThemeConfig = {
  id: 'salontransact-default',
  name: 'SalonTransact',
  colors: {
    primary: '#C9A84C',         // signature gold
    primaryHover: '#B8983D',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    border: '#2a2a2a',
    text: '#fafafa',
    textMuted: '#a1a1a1',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Code", "Fira Code", Consolas, monospace',
  },
  logo: {
    light: '/logos/salontransact-light.svg',
    dark: '/logos/salontransact-dark.svg',
  },
  copy: {
    productName: 'SalonTransact',
    poweredBy: 'A Reyna Pay product',
    supportEmail: 'support@reynapay.com',
  },
  emailTemplates: {
    senderName: 'SalonTransact',
    senderEmail: 'noreply@reynapay.com',
    footerHtml: '<p style="font-size:12px;color:#a1a1a1;text-align:center;margin-top:24px">A Reyna Pay product &middot; <a href="https://reynapay.com" style="color:#C9A84C">reynapay.com</a></p>',
  },
  legal: {
    privacyUrl: 'https://reynapay.com/privacy',
    termsUrl: 'https://reynapay.com/terms',
    dpaUrl: 'https://reynapay.com/dpa',
  },
};
