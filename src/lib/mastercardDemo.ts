/**
 * Private Mastercard proposed-partnership demonstration.
 * DEMO_ENABLED: set false to switch the demo off entirely (admins are redirected home).
 * LOGO_APPROVED / LOGO_URL: the official Mastercard logo shows only when Mastercard has authorised it
 * and an unmodified official file has been supplied. Until then the header shows text only.
 */
export const MASTERCARD_DEMO = {
  enabled: true,
  logoApproved: false,
  logoUrl: null as string | null,
};
