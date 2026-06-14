// ---------------------------------------------------------------------------
// Broadcast-arc camera math — pure, deterministic, Phaser-free, allocation-free.
//
// MatchScene calls these once per real frame (in renderEntities, NEVER in the
// fixed-timestep stepSim) to drive the main camera's scroll. They READ sim
// output (ball / carrier position) and never mutate any sim state, so the
// follow can't perturb the deterministic simulation or recorded-input replays.
// Everything writes into a caller-supplied scratch object — no per-frame alloc.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

/** World rect the camera view is kept inside: top-left (x,y) + size (w,h). */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The desired camera centre point in world space. While a carrier owns the ball
 * we frame slightly ahead of them in the attacking direction (a lead-offset on
 * x) so the player can see where they are shooting; a loose ball is framed
 * dead-on with no lead. Pure: writes into `out` and returns it.
 */
export function cameraTarget(
  ballX: number,
  ballY: number,
  carrierX: number,
  carrierY: number,
  hasOwner: boolean,
  attackDir: number,
  lead: number,
  out: Vec2 = { x: 0, y: 0 },
): Vec2 {
  if (hasOwner) {
    out.x = carrierX + attackDir * lead;
    out.y = carrierY;
  } else {
    out.x = ballX;
    out.y = ballY;
  }
  return out;
}

/**
 * Step the camera scroll (the top-left of the view in world space) toward the
 * scroll that centres `targetC` in a `viewW x viewH` window, lerped by `lerp`
 * (0..1) and clamped so the view never leaves `bounds`. When the view is larger
 * than the bounds on an axis it is centred on that axis (no void revealed).
 * Frame-rate-independent enough for a smooth broadcast feel. Writes into `out`.
 */
export function followStep(
  curScrollX: number,
  curScrollY: number,
  targetCx: number,
  targetCy: number,
  lerp: number,
  viewW: number,
  viewH: number,
  bounds: Bounds,
  out: Vec2 = { x: 0, y: 0 },
): Vec2 {
  out.x = axisStep(curScrollX, targetCx, lerp, viewW, bounds.x, bounds.w);
  out.y = axisStep(curScrollY, targetCy, lerp, viewH, bounds.y, bounds.h);
  return out;
}

/** One-axis follow: clamp the centred-target scroll to bounds, then lerp to it. */
function axisStep(cur: number, targetCentre: number, lerp: number, view: number, min: number, size: number): number {
  // recover from any non-finite input rather than scrolling the camera to NaN
  if (!Number.isFinite(cur)) cur = min;
  if (!Number.isFinite(targetCentre)) targetCentre = min + size / 2;

  const desired = clampScroll(targetCentre - view / 2, view, min, size);
  const t = lerp < 0 ? 0 : lerp > 1 ? 1 : lerp;
  const next = cur + (desired - cur) * t;
  // final clamp (defensive: both endpoints are already in range when view < size)
  return clampScroll(next, view, min, size);
}

/** Clamp a scroll value so the `view`-wide window stays inside [min, min+size]. */
function clampScroll(scroll: number, view: number, min: number, size: number): number {
  if (view >= size) return min - (view - size) / 2; // view bigger than world → centre it
  const max = min + size - view;
  if (scroll < min) return min;
  if (scroll > max) return max;
  return scroll;
}

// --- zoom level + snap-zoom punch (#127) -----------------------------------

export type ZoomLevel = 'wide' | 'balanced' | 'tight';

/**
 * Resting broadcast zoom for each player-chosen level. WIDE (1.0) frames the full
 * pitch (the classic flat view); BALANCED (2.0) is the default broadcast framing —
 * ~55% of the pitch length, the GDD look; TIGHT (2.4) is noticeably closer.
 */
export function baseZoom(level: ZoomLevel): number {
  switch (level) {
    case 'wide':
      return 1.0;
    case 'tight':
      return 2.4;
    case 'balanced':
    default:
      return 2.0;
  }
}

/**
 * Framing-safety gate: at zoom `z`, with the follow framing led `lead` px ahead
 * of the carrier, can the ball AND the nearest goal mouth still sit inside the
 * visible half-width? Half-width at z is (gameW / z) / 2. A hard predicate (not a
 * manual eyeball) so a too-tight zoom can fail CI.
 */
export function framingFits(z: number, lead: number, gameW = 1280, ballR = 9, halfGoalMouth = 84): boolean {
  if (!(z > 0)) return false;
  const visibleHalfWidth = gameW / z / 2;
  return visibleHalfWidth >= lead + ballR + halfGoalMouth;
}

/**
 * Ease a punched zoom back toward the resting `base` over real time. The decay is
 * exponential and frame-rate independent (one 16ms step == two 8ms steps), so a
 * snap-zoom punch (cur = base * 1.18) recovers smoothly in ~0.7s. Snaps exactly
 * to base within an epsilon to kill a lingering sliver. Pure (returns a number).
 */
export function zoomPunchStep(cur: number, base: number, dtSec: number, decayPerSec = 0.0005): number {
  if (!Number.isFinite(cur)) return base;
  if (!(dtSec > 0)) return cur;
  const next = base + (cur - base) * Math.pow(decayPerSec, dtSec);
  return Math.abs(next - base) < 0.001 ? base : next;
}
