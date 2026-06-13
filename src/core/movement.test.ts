import { describe, it, expect } from 'vitest';
import { approachVelocity, PLAYER_ACCEL, PLAYER_DECEL } from './movement';

// Integrate a held desired velocity for `seconds` at a fixed `dt`, returning the
// final velocity and the trapezoidal displacement (avg-velocity per step — the
// quality position integral, frame-rate independent to second order).
function run(desVx: number, desVy: number, seconds: number, dt: number, vx = 0, vy = 0) {
  let dispX = 0;
  let dispY = 0;
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    const nv = approachVelocity(vx, vy, desVx, desVy, PLAYER_ACCEL, PLAYER_DECEL, dt);
    dispX += ((vx + nv.x) / 2) * dt;
    dispY += ((vy + nv.y) / 2) * dt;
    vx = nv.x;
    vy = nv.y;
  }
  return { vx, vy, dispX, dispY, speed: Math.hypot(vx, vy) };
}

describe('approachVelocity', () => {
  const TOP = 210;

  it('reaches ~95% of top speed within 0.2s from rest', () => {
    const r = run(TOP, 0, 0.2, 1 / 60);
    expect(r.speed).toBeGreaterThanOrEqual(0.95 * TOP);
    expect(r.speed).toBeLessThanOrEqual(TOP + 1e-6); // never overshoots top speed
  });

  it('decelerates to a dead stop within ~0.15s after input release', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60); // get up to speed
    const stopped = run(0, 0, 0.15, 1 / 60, moving.vx, moving.vy);
    expect(stopped.speed).toBe(0);
  });

  it('never overshoots the desired velocity (monotone approach)', () => {
    let vx = 0;
    let vy = 0;
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      const nv = approachVelocity(vx, vy, TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
      // distance to target never increases, and speed never exceeds target
      expect(Math.hypot(TOP - nv.x, 0 - nv.y)).toBeLessThanOrEqual(Math.hypot(TOP - vx, 0 - vy) + 1e-9);
      expect(Math.hypot(nv.x, nv.y)).toBeLessThanOrEqual(TOP + 1e-9);
      vx = nv.x;
      vy = nv.y;
    }
  });

  it('a hard reverse at top speed arcs through lower speed (momentum), not a snap', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60); // +x at top speed
    // one step of fully-reversed desired velocity must not flip sign instantly
    const dt = 1 / 60;
    const nv = approachVelocity(moving.vx, moving.vy, -TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
    expect(nv.x).toBeLessThan(moving.vx); // slowing
    expect(nv.x).toBeGreaterThan(-TOP); // hasn't teleported to full reverse
    // mid-reversal the speed dips well below top speed (the arc)
    let vx = moving.vx;
    let vy = moving.vy;
    let minSpeed = Infinity;
    for (let i = 0; i < 40; i++) {
      const r = approachVelocity(vx, vy, -TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, dt);
      vx = r.x;
      vy = r.y;
      minSpeed = Math.min(minSpeed, Math.hypot(vx, vy));
    }
    expect(minSpeed).toBeLessThan(0.25 * TOP);
  });

  it('is frame-rate independent: 1s displacement matches across dt (±1.5%)', () => {
    const slow = run(TOP, 0, 1, 1 / 30);
    const fast = run(TOP, 0, 1, 1 / 144);
    const rel = Math.abs(slow.dispX - fast.dispX) / fast.dispX;
    expect(rel).toBeLessThan(0.015);
    // both settle at exactly top speed
    expect(slow.speed).toBeCloseTo(TOP, 5);
    expect(fast.speed).toBeCloseTo(TOP, 5);
  });

  it('preserves top speed exactly while turning (chord stays inside the speed circle)', () => {
    const moving = run(TOP, 0, 0.5, 1 / 60);
    let vx = moving.vx;
    let vy = moving.vy;
    const dt = 1 / 60;
    let maxSpeed = 0;
    for (let i = 0; i < 60; i++) {
      const r = approachVelocity(vx, vy, 0, TOP, PLAYER_ACCEL, PLAYER_DECEL, dt); // turn 90° to +y
      vx = r.x;
      vy = r.y;
      maxSpeed = Math.max(maxSpeed, Math.hypot(vx, vy));
    }
    expect(maxSpeed).toBeLessThanOrEqual(TOP + 1e-6);
    expect(Math.hypot(vx, vy)).toBeCloseTo(TOP, 3); // ends at top speed in the new direction
  });

  it('recovers from non-finite velocity instead of propagating NaN', () => {
    const r = approachVelocity(NaN, NaN, TOP, 0, PLAYER_ACCEL, PLAYER_DECEL, 1 / 60);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.y)).toBe(true);
  });

  it('is a no-op for non-positive dt', () => {
    const r = approachVelocity(50, 20, 0, 0, PLAYER_ACCEL, PLAYER_DECEL, 0);
    expect(r).toEqual({ x: 50, y: 20 });
  });
});
