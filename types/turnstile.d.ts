/**
 * P1.A.14: Type definitions for Cloudflare Turnstile global API.
 *
 * The Turnstile script (loaded via <Script src="...">) attaches a
 * `turnstile` object to the window. These types make it accessible from
 * client components without needing an npm wrapper package.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
export {}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string
          callback?: (token: string) => void
          "error-callback"?: () => void
          "expired-callback"?: () => void
          theme?: "light" | "dark" | "auto"
          size?: "normal" | "flexible" | "compact"
          action?: string
        }
      ) => string  // returns widget ID
      reset: (widgetIdOrContainer?: string | HTMLElement) => void
      remove: (widgetIdOrContainer?: string | HTMLElement) => void
      getResponse: (widgetIdOrContainer?: string | HTMLElement) => string | undefined
    }
  }
}
