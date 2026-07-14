import type { Transition } from "framer-motion";

/**
 * Central animation vocabulary. Use these instead of inventing spring values
 * inline so the whole game moves with one consistent "hand".
 */

/** Heavy object slamming into place (cards, stamps, chests). */
export const SLAM: Transition = { type: "spring", stiffness: 300, damping: 16 };

/** Bouncy UI pop (badges, medals, deltas). */
export const POP: Transition = { type: "spring", stiffness: 420, damping: 14 };

/** Soft settle for panels and rows. */
export const SETTLE: Transition = { type: "spring", stiffness: 220, damping: 22 };

/** Screen-level transitions. */
export const SCREEN: Transition = { type: "spring", stiffness: 260, damping: 24 };

/** Standard stagger for lists of cards/answers. */
export const STAGGER = 0.08;

/** Slower storytelling stagger (round intro rules). */
export const STAGGER_SLOW = 0.3;

/** Entrance offsets — alternate sides for lively lists. */
export function sideEntrance(index: number, distance = 60) {
  return {
    opacity: 0,
    x: index % 2 === 0 ? -distance : distance,
    rotate: index % 2 === 0 ? -2 : 2,
  };
}

/** Punch-scale keyframes for a selection hit. */
export const PUNCH_SCALE = [1, 1.25, 1] as number[];

/** Idle bob used by ships/avatars/icons — pair with a random delay. */
export const BOB = {
  y: [0, -6, 0],
  transition: { repeat: Infinity, duration: 2.6, ease: "easeInOut" as const },
};
