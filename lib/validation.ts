export const validators = {
  required: (v: string, label: string) =>
    !v?.trim() ? `${label} is required` : null,

  email: (v: string) => {
    if (!v?.trim()) return "Email is required"
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !re.test(v) ? "Enter a valid email address" : null
  },

  phone: (v: string) => {
    if (!v?.trim()) return "Phone number is required"
    const digits = v.replace(/\D/g, "")
    return digits.length !== 10 ? "Enter a valid 10-digit phone number" : null
  },

  ein: (v: string) => {
    if (!v?.trim()) return "EIN is required"
    const clean = v.replace(/\D/g, "")
    return clean.length !== 9 ? "EIN must be 9 digits (XX-XXXXXXX)" : null
  },

  zip: (v: string) => {
    if (!v?.trim()) return "ZIP code is required"
    const re = /^\d{5}(-\d{4})?$/
    return !re.test(v) ? "Enter a valid 5-digit ZIP code" : null
  },

  minLength: (v: string, min: number, label: string) =>
    !v?.trim() || v.trim().length < min
      ? `${label} must be at least ${min} characters`
      : null,

  url: (v: string) => {
    if (!v?.trim()) return null
    try {
      new URL(v.startsWith("http") ? v : `https://${v}`)
      return null
    } catch {
      return "Enter a valid website URL"
    }
  },

  taxRate: (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n)) return "Tax rate must be a number"
    if (n < 0 || n > 30) return "Tax rate must be between 0% and 30%"
    return null
  },
}

export function formatPhone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function formatEIN(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 9)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

export function formatZip(v: string): string {
  return v.replace(/\D/g, "").slice(0, 5)
}

export function validateStep(step: number, data: Record<string, any>): Record<string, string | null> {
  switch (step) {
    case 2:
      return {
        businessName: validators.required(data.businessName, "Business name"),
        businessType: validators.required(data.businessType, "Business type"),
        phone: validators.phone(data.phone),
        email: validators.email(data.email),
      }
    case 3:
      return {
        legalName: validators.required(data.legalName, "Legal business name"),
        structure: validators.required(data.structure, "Business structure"),
        ein: data.ssnInstead ? null : data.structure && data.structure !== "Sole Proprietor" ? validators.ein(data.ein) : null,
      }
    case 4:
      return {
        address: validators.required(data.address, "Street address"),
        city: validators.required(data.city, "City"),
        state: validators.required(data.state, "State"),
        zip: validators.zip(data.zip),
        timezone: validators.required(data.timezone, "Timezone"),
      }
    case 5:
      return {
        teamSize: validators.required(data.teamSize, "Team size"),
      }
    case 6:
      return {}
    case 7:
      return {
        taxRate: validators.taxRate(data.taxRate),
      }
    case 8:
      return {}
    default:
      return {}
  }
}
