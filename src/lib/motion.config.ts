// HAPPENIN — LOCKED MOTION CONFIG FOR FRAMER MOTION
// All animations must use these tokens. No hardcoded values.

/**
 * Respects prefers-reduced-motion for accessibility
 * Returns appropriate duration based on user preference
 */
export function getMotionDuration(base: number): number {
  if (typeof window === "undefined") return base;
  
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return base * 0.3; // Reduce to 30% for accessibility
    }
  } catch (error) {
    console.debug("prefers-reduced-motion not supported");
  }
  
  return base;
}

export const motionConfig = {
  transition: {
    fast: {
      duration: 0.12,
      ease: [0.4, 0, 0.2, 1],
    },
    medium: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
    slow: {
      duration: 0.32,
      ease: [0.4, 0, 0.2, 1],
    },
  },

  scale: {
    press: 0.98,
    hover: 1.02,
  },

  drag: {
    card: {
      dragElastic: 0.15,
      dragConstraints: { left: 0, right: 0 },
    },
    sheet: {
      dragElastic: 0.25,
      dragConstraints: { top: 0 },
    },
  },
};

// REUSABLE VARIANTS

export const buttonVariants = {
  initial: { scale: 1 },
  tap: { scale: 0.98 },
  hover: { scale: 1.02 },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionConfig.transition.medium,
  },
};

export const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionConfig.transition.medium,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: motionConfig.transition.fast,
  },
};

export const bottomSheetVariants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: motionConfig.transition.medium,
  },
  exit: {
    y: "100%",
    transition: motionConfig.transition.fast,
  },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: motionConfig.transition.medium,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: motionConfig.transition.fast,
  },
};

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: motionConfig.transition.fast,
  },
  exit: {
    opacity: 0,
    transition: motionConfig.transition.fast,
  },
};

// GESTURE THRESHOLDS
export const gestureThresholds = {
  swipe: {
    horizontal: 60,
    vertical: 80,
    velocity: {
      min: 0.3,
      commit: 0.5,
    },
  },
  drag: {
    elastic: {
      soft: 0.15,
      medium: 0.25,
      hard: 0.4,
    },
  },
  pullToRefresh: {
    distance: 90,
    resistance: 0.6,
    trigger: 70,
  },
  longPress: {
    delay: 450,
  },
};

// OFFLINE + RETRY MOTION
export const offlineMotion = {
  banner: {
    initial: { y: -32, opacity: 0 },
    animate: { y: 0, opacity: 0.95 },
    exit: { y: -32, opacity: 0 },
    transition: { duration: 0.18, ease: "easeOut" },
  },

  retryPulse: {
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 0.9,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  verifying: {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [0.98, 1, 0.98],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};

// RETRY CONFIG
export const retryConfig = {
  maxAttempts: 3,
  backoff: {
    initial: 1200,
    multiplier: 1.8,
    max: 5000,
  },
};

// QUEUED ACTION TYPES
export type QueuedAction = {
  id: string;
  type: "REGISTER_EVENT" | "SAVE_PROFILE" | "ADD_MEMBERSHIP";
  payload: any;
  createdAt: number;
  retryCount: number;
};
