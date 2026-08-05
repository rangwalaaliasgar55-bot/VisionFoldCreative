import { Variants, Transition } from 'motion/react';

// Premium easing curves for smooth, intentional motion
export const EASING = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  sharp: [0.4, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 0.2, 1] as const,
} as const;

// Standard transition for most animations
export const DEFAULT_TRANSITION: Transition = {
  duration: 0.3,
  ease: EASING.smooth,
};

// Slower, more dramatic transitions
export const DRAMATIC_TRANSITION: Transition = {
  duration: 0.5,
  ease: EASING.smooth,
};

// Quick feedback transitions
export const QUICK_TRANSITION: Transition = {
  duration: 0.15,
  ease: EASING.sharp,
};

// Stagger delay for sequential animations
export const STAGGER_DELAY = 0.08;

// Fade In Up - Primary entrance animation
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: DEFAULT_TRANSITION,
  },
};

// Fade In Down - For elements entering from top
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: DEFAULT_TRANSITION,
  },
};

// Fade In Left - For elements entering from right
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: DEFAULT_TRANSITION,
  },
};

// Fade In Right - For elements entering from left
export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: DEFAULT_TRANSITION,
  },
};

// Scale In - For modals, tooltips, cards
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: DRAMATIC_TRANSITION,
  },
};

// Scale In with slight bounce - For success states, selections
export const scaleInBounce: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: EASING.bounce,
    },
  },
};

// Stagger Children - Container for list animations
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.1,
    },
  },
};

// Stagger Children Fast - For smaller lists
export const staggerContainerFast: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Stagger Children Slow - For larger lists
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// Page Transition - For route changes
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASING.enter,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: EASING.exit,
    },
  },
};

// Slide In From Right - For sidebars, drawers
export const slideInRight: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: DRAMATIC_TRANSITION,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: EASING.exit,
    },
  },
};

// Slide In From Left - For sidebars, drawers
export const slideInLeft: Variants = {
  hidden: {
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: DRAMATIC_TRANSITION,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: EASING.exit,
    },
  },
};

// Slide In From Bottom - For bottom sheets
export const slideInBottom: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: DRAMATIC_TRANSITION,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: EASING.exit,
    },
  },
};

// Loading Pulse - For skeleton loaders
export const loadingPulse: Variants = {
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Success Check - For confirmation states
export const successCheck: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// Error Shake - For validation errors
export const errorShake: Variants = {
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Hover Lift - For cards, buttons on hover
export const hoverLift = {
  rest: { 
    y: 0, 
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
  },
  hover: { 
    y: -4, 
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    transition: QUICK_TRANSITION,
  },
};

// Tap Press - For buttons on press
export const tapPress = {
  rest: { scale: 1 },
  tap: { 
    scale: 0.97,
    transition: QUICK_TRANSITION,
  },
};

// Drag Feedback - For drag-and-drop elements
export const dragFeedback = {
  idle: { 
    scale: 1, 
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
  },
  dragging: { 
    scale: 1.02, 
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
    transition: QUICK_TRANSITION,
  },
};

// Reveal On Scroll - For scroll-triggered animations
export const revealOnScroll: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: DRAMATIC_TRANSITION,
  },
};

// Tab Content Transition - For tab panel changes
export const tabContent: Variants = {
  hidden: { 
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.15,
      ease: EASING.sharp,
    },
  },
};

// Accordion - For collapsible sections
export const accordion: Variants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: EASING.sharp,
    },
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: EASING.smooth,
    },
  },
};

// Toast Enter/Exit - For notification toasts
export const toastEnter: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: EASING.sharp,
    },
  },
};

// Badge Pop - For notification badges
export const badgePop: Variants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
};

// Number Count - For animated counters
export const numberCount: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
};

// Marquee - For scrolling text/banners
export const marquee: Variants = {
  animate: {
    x: [0, -1000],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Reduced Motion Variants - Respects user preference
export const reducedMotion: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

// Create custom transition with overrides
export function createTransition(overrides: Partial<Transition>): Transition {
  return {
    ...DEFAULT_TRANSITION,
    ...overrides,
  };
}

// Spring configuration presets
export const SPRING_PRESETS = {
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 210, damping: 20 },
  soft: { stiffness: 100, damping: 10 },
} as const;
