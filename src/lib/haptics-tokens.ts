/**
 * Haptic Feedback Tokens
 * Micro-trust signals for mobile/PWA
 * 
 * Rules:
 * ✅ Payment verified → success
 * ⚠️ Offline detected → warning
 * ❌ Payment failed → error
 * ❌ Never haptic on scroll
 * ❌ Never vibrate repeatedly
 */

export const haptics = {
  success: {
    pattern: "light",
    duration: 30,
  },

  warning: {
    pattern: "medium",
    duration: 50,
  },

  error: {
    pattern: "heavy",
    duration: 80,
  },

  payment: {
    initiated: "medium",
    verified: "success",
  },
};

/**
 * Execute haptic feedback on supported devices
 * Gracefully degrades on unsupported platforms
 */
export function triggerHaptic(
  type: "success" | "warning" | "error"
): void {
  // Check if Vibration API is supported
  if (!("vibrate" in navigator)) {
    return;
  }

  const pattern = haptics[type];
  if (!pattern || typeof pattern === "string") {
    return;
  }

  // Use duration for simple vibration
  try {
    navigator.vibrate(pattern.duration);
   } catch (error) {
     // Silently fail on unsupported platforms
     console.debug("Haptics not available");
   }
}

/**
 * Payment-specific haptic sequence
 */
export function hapticPaymentFlow(
  stage: "initiated" | "verified" | "failed"
): void {
  switch (stage) {
    case "initiated":
      triggerHaptic("warning");
      break;
    case "verified":
      triggerHaptic("success");
      break;
    case "failed":
      triggerHaptic("error");
      break;
  }
}


