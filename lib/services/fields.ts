/**
 * Shared "service builder" field application for POST (create) and PATCH (update)
 * on /api/services. Mutates `data` with any present-and-valid optional fields and
 * returns an error message on the first invalid field, or null on success. One
 * place so the create/update paths never drift.
 */
export function applyServiceBuilderFields(
  body: Record<string, unknown>,
  data: Record<string, unknown>,
): string | null {
  if ("description" in body) {
    const v = body.description;
    if (v === null) data.description = null;
    else if (typeof v === "string") data.description = v.trim().slice(0, 2000) || null;
    else return "description must be a string or null";
  }
  if ("bufferTime" in body) {
    const v = body.bufferTime;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 600) return "bufferTime must be an integer between 0 and 600";
    data.bufferTime = v;
  }
  if ("processingMinutes" in body) {
    const v = body.processingMinutes;
    if (v === null) data.processingMinutes = null;
    else if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 600) data.processingMinutes = v;
    else return "processingMinutes must be an integer between 0 and 600, or null";
  }
  for (const f of ["bookableByCustomers", "bookableByStaff", "requiresConsultation", "requiresConsent", "taxable", "depositRequired"] as const) {
    if (f in body) {
      if (typeof body[f] !== "boolean") return `${f} must be a boolean`;
      data[f] = body[f];
    }
  }
  // Deposit type + value are validated as a pair: we can't see the existing DB row
  // here, so the percentage-range cross-check is only sound when both arrive together.
  // Reject a lone partial so a value can't slip past validation onto a row whose
  // deposit type lives only in Postgres.
  if (("depositType" in body) !== ("depositValueCents" in body)) {
    return "depositType and depositValueCents must be provided together";
  }
  // NOTE: depositValueCents stores cents when depositType=FIXED_AMOUNT, but a plain
  // percent (1 to 100) when depositType=PERCENTAGE. The column name reflects only the
  // fixed-amount case; treat the unit as type-dependent wherever this value is read.
  if ("depositType" in body) {
    const v = body.depositType;
    if (v === null) data.depositType = null;
    else if (v === "FIXED_AMOUNT" || v === "PERCENTAGE") data.depositType = v;
    else return "depositType must be FIXED_AMOUNT, PERCENTAGE, or null";
  }
  if ("depositValueCents" in body) {
    const v = body.depositValueCents;
    if (v === null) data.depositValueCents = null;
    else if (typeof v === "number" && Number.isInteger(v) && v >= 0) data.depositValueCents = v;
    else return "depositValueCents must be a non-negative integer, or null";
  }
  if (data.depositType === "PERCENTAGE" && typeof data.depositValueCents === "number" && (data.depositValueCents < 1 || data.depositValueCents > 100)) {
    return "percentage deposit must be between 1 and 100";
  }
  return null;
}
