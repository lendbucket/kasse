/**
 * Powered by SalonTransact — SD-K-010 compliance footer.
 *
 * Required on all consumer-facing surfaces displaying payment-related
 * actions: checkout/POS, payment-method management, refund confirmation,
 * customer receipts, dispute notifications.
 *
 * Non-removable per SD-K-010 (KASSE_STRATEGIC_DECISIONS.md). The label
 * reflects that all payment processing flows through the SalonTransact
 * brand (owned by Reyna Pay LLC). See also KASSE_ENGINE_BOUNDARY.md
 * Category 5 UX requirement and REYNA_PAY_API_SPEC.md Part IV
 * "Disclosure requirements for agent-originated flows."
 *
 * Styling follows KASSE_UI_PRINCIPLES.md: 11px, #606E74 (brand slate
 * teal) for the brand word, #9ca3af for the "Powered by" prefix,
 * centered, subtle but legible. Uses inline styles to match
 * the codebase convention.
 */
export function PoweredBySalonTransact() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 0",
        fontSize: 11,
        color: "#9ca3af",
        letterSpacing: "0.02em",
        userSelect: "none",
      }}
    >
      Powered by{" "}
      <span style={{ color: "#606E74", fontWeight: 600, marginLeft: "3px" }}>
        SalonTransact
      </span>
    </div>
  );
}
