// Small, fast, seedable PRNG (mulberry32). Deterministic so a tournament draw
// and AI-simulated results can be reproduced from a saved seed.
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  // float in [0, 1)
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // integer in [min, max]
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  // float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Fisher-Yates, returns a new shuffled array.
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }
}

// Convenience for non-deterministic seeds (e.g. starting a brand new tournament).
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}
