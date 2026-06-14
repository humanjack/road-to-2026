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
 * Step the camera CENTRE (the world point shown at screen centre) toward the
 * point that frames `targetC`, lerped by `lerp` (0..1) and clamped so the visible
 * `viewW x viewH` window never leaves `bounds`. Working in CENTRE space (not
 * scroll space) keeps this independent of Phaser's zoom-dependent scroll origin —
 * a Phaser camera shows world `scroll + cameraSize/2` at screen centre regardless
 * of zoom, so the scene converts back with `scroll = centre - cameraSize/2`. When
 * the view is larger than the bounds on an axis the centre is pinned to the world
 * centre there (no void revealed). Frame-rate-independent enough for a smooth
 * broadcast feel. Writes into `out`.
 */
export function followStep(
  curCx: number,
  curCy: number,
  targetCx: number,
  targetCy: number,
  lerp: number,
  viewW: number,
  viewH: number,
  bounds: Bounds,
  out: Vec2 = { x: 0, y: 0 },
): Vec2 {
  out.x = axisStep(curCx, targetCx, lerp, viewW, bounds.x, bounds.w);
  out.y = axisStep(curCy, targetCy, lerp, viewH, bounds.y, bounds.h);
  return out;
}

/** One-axis follow: clamp the target centre to the in-bounds range, then lerp to it. */
function axisStep(cur: number, target: number, lerp: number, view: number, min: number, size: number): number {
  // recover from any non-finite input rather than driving the camera to NaN
  if (!Number.isFinite(cur)) cur = min + size / 2;
  if (!Number.isFinite(target)) target = min + size / 2;

  const desired = clampCentre(target, view, min, size);
  const t = lerp < 0 ? 0 : lerp > 1 ? 1 : lerp;
  const next = cur + (desired - cur) * t;
  // final clamp (defensive: desired is already in range when view < size)
  return clampCentre(next, view, min, size);
}

/** Clamp a centre so the `view`-wide window around it stays inside [min, min+size]. */
function clampCentre(centre: number, view: number, min: number, size: number): number {
  if (view >= size) return min + size / 2; // view bigger than world → pin to world centre
  const lo = min + view / 2;
  const hi = min + size - view / 2;
  if (centre < lo) return lo;
  if (centre > hi) return hi;
  return centre;
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

// --- multi-view camera (#176) ----------------------------------------------
//
// Four player-selectable framings bound to the number keys. The three "follow"
// views reuse the existing ZoomLevel zooms (so the number keys are also an
// in-match shortcut for the ZOOM setting); TACTICAL is a transient zoomed-out
// static overhead — the broadcast follow is handed off and the frame is pinned
// centred on the pitch so the whole shape of play reads at once.

export type CameraView = 'full' | 'broadcast' | 'tight' | 'tactical';

export const VIEW_LABEL: Record<CameraView, string> = {
  full: 'FULL PITCH',
  broadcast: 'BROADCAST',
  tight: 'ACTION CAM',
  tactical: 'TACTICAL',
};

/** Map a number-row digit (1..4) to a view; null for any other key. */
export function viewFromDigit(d: number): CameraView | null {
  switch (d) {
    case 1:
      return 'full';
    case 2:
      return 'broadcast';
    case 3:
      return 'tight';
    case 4:
      return 'tactical';
    default:
      return null;
  }
}

/**
 * The ZoomLevel a follow-view persists back to `settings.zoomLevel` (so the
 * number keys remember your framing between matches). TACTICAL is transient and
 * returns null — it never overwrites the saved setting.
 */
export function viewZoomLevel(view: CameraView): ZoomLevel | null {
  switch (view) {
    case 'full':
      return 'wide';
    case 'broadcast':
      return 'balanced';
    case 'tight':
      return 'tight';
    default:
      return null;
  }
}

/** Inverse of viewZoomLevel: the view the saved ZoomLevel boots into. */
export function viewForZoomLevel(level: ZoomLevel): CameraView {
  switch (level) {
    case 'wide':
      return 'full';
    case 'tight':
      return 'tight';
    case 'balanced':
    default:
      return 'broadcast';
  }
}

export interface ViewFraming {
  zoom: number; // camera zoom for the view
  follow: boolean; // does the broadcast follow drive scroll/zoom?
  label: string; // the on-screen toast
}

/**
 * Framing for a view. Follow views derive their zoom from baseZoom() (single
 * source of truth with the ZOOM setting); TACTICAL takes its zoom from the
 * caller (it depends on the live pitch + viewport dims — see fitZoom). Pure.
 */
export function cameraViewConfig(view: CameraView, tacticalZoom: number): ViewFraming {
  switch (view) {
    case 'full':
      return { zoom: baseZoom('wide'), follow: true, label: VIEW_LABEL.full };
    case 'tight':
      return { zoom: baseZoom('tight'), follow: true, label: VIEW_LABEL.tight };
    case 'tactical':
      return { zoom: tacticalZoom, follow: false, label: VIEW_LABEL.tactical };
    case 'broadcast':
    default:
      return { zoom: baseZoom('balanced'), follow: true, label: VIEW_LABEL.broadcast };
  }
}

/**
 * The zoom that fits a `contentW x contentH` rect inside a `viewportW x viewportH`
 * screen — the smaller axis ratio, so the whole rect is visible (letterboxed on
 * the looser axis). The tactical view feeds this the pitch + a margin so it always
 * frames the full pitch with room for the stands, at any design resolution. Pure.
 */
export function fitZoom(contentW: number, contentH: number, viewportW: number, viewportH: number): number {
  if (!(contentW > 0) || !(contentH > 0) || !(viewportW > 0) || !(viewportH > 0)) return 1;
  return Math.min(viewportW / contentW, viewportH / contentH);
}

/**
 * Camera bounds for the static TACTICAL frame: a rect EXACTLY the size of the
 * zoomed view, centred on the pitch centre, so the camera cannot scroll and the
 * frame is pinned dead-centre (a fixed coach-cam). The backdrop surround is
 * over-sized enough to cover the revealed area at this zoom-out. Pure; writes `out`.
 */
export function tacticalBounds(
  pitchCx: number,
  pitchCy: number,
  gameW: number,
  gameH: number,
  zoom: number,
  out: Bounds = { x: 0, y: 0, w: 0, h: 0 },
): Bounds {
  const z = zoom > 0 ? zoom : 1;
  const viewW = gameW / z;
  const viewH = gameH / z;
  out.x = pitchCx - viewW / 2;
  out.y = pitchCy - viewH / 2;
  out.w = viewW;
  out.h = viewH;
  return out;
}

// --- screen-shake curve (#139) ---------------------------------------------

/**
 * Camera-shake intensity for a 0..1 impact, from a celebratory floor up to a hard
 * readability cap — even a max-power hit must keep the pitch/HUD trackable.
 * Monotonic; clamps the impact into [0,1]. Pure scalar (no allocation).
 */
export function shakeIntensity(impact01: number, floor = 0.006, cap = 0.016): number {
  const t = impact01 < 0 ? 0 : impact01 > 1 ? 1 : impact01;
  return floor + (cap - floor) * t;
}

/** Camera-shake duration (ms) for a 0..1 impact: a longer rattle for a bigger hit. */
export function shakeDuration(impact01: number, floor = 200, cap = 320): number {
  const t = impact01 < 0 ? 0 : impact01 > 1 ? 1 : impact01;
  return floor + (cap - floor) * t;
}

// --- broadcast depth: parallax + follow steadiness (#125) -------------------

/**
 * World-space offset to apply to a background layer so it scrolls at `factor` of
 * the camera — a parallax plane that sells the three-quarter broadcast depth.
 * Setting the layer's position to this value yields an on-screen travel of
 * exactly `factor * cameraScroll`: factor 1 → 0 (locked to the world, no
 * parallax); factor 0 → the full scroll (pinned to the screen, a skybox);
 * 0<factor<1 → the layer lags the turf on every pan. Pure scalar, no allocation.
 */
export function parallaxShift(scroll: number, factor: number): number {
  if (!Number.isFinite(scroll)) return 0;
  const f = factor < 0 ? 0 : factor > 1 ? 1 : factor;
  return scroll * (1 - f);
}

/**
 * A velocity-proportional lead (px) that nudges the framing the way the carrier
 * (or loose ball) is moving, so a run to the near/far touchline is anticipated.
 * Scaled by `scale` and hard-clamped to ±`cap` so a fast sprint or shot can't
 * fling the frame. Pass scale 0 (reduce-motion) for no lead. Pure scalar.
 */
export function velocityLead(v: number, scale: number, cap: number): number {
  if (!Number.isFinite(v)) return 0;
  const lead = v * scale;
  return lead > cap ? cap : lead < -cap ? -cap : lead;
}

/**
 * One-axis deadzone: the part of `delta` (the focus minus the current camera
 * centre) that lies OUTSIDE a ±`half` band. Within the band it returns 0 — the
 * frame holds perfectly still, so a jostled / contested ball can't drift the
 * camera; beyond it returns the overshoot so the focus eases to rest on the
 * deadzone edge (a small broadcast slack). Pure scalar, no allocation.
 */
export function deadzone1d(delta: number, half: number): number {
  if (!Number.isFinite(delta)) return 0;
  const h = half > 0 ? half : 0;
  if (delta > h) return delta - h;
  if (delta < -h) return delta + h;
  return 0;
}
