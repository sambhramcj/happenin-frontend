export const FEATURE_FLAGS = {
  PAYMENTS_RAZORPAY: false,
  SPONSORSHIPS: false,
  DIGITAL_VISIBILITY_PACKS: false,
  FEATURED_EVENT_BOOST: false,
  QR_PAYMENTS: true,
  EVENT_DISCOVERY: true,
  REGISTRATION: true,
  QR_ATTENDANCE: true,
  CERTIFICATES: true,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export function isFeatureEnabled(
  key: FeatureFlagKey,
  flags: FeatureFlags = FEATURE_FLAGS
) {
  return Boolean(flags[key]);
}
