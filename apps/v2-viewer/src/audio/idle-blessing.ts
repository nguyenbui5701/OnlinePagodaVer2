export type IdleKind = 'bell' | 'speech';
export type IdleCue = { id: string; kind: IdleKind };
type Interval = readonly [number, number];

export function idleGap(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(120, Math.max(10, seconds)) * 1000;
}

export class IdleBlessingDirector {
  private random: number;
  private deadline?: number;
  private first = true;
  private bag: IdleCue[] = [];
  private readonly recent: string[] = [];
  private readonly firstGap: Interval;
  private readonly laterGap: Interval;
  private override?: number;

  constructor(seed: number, override?: number) {
    this.random = (seed ^ 0x6c8e9cf5) >>> 0;
    this.firstGap = [20_000, 40_000];
    this.laterGap = [25_000, 45_000];
    this.override = override;
  }

  setGap(gap?: number) { this.override = gap; this.reset(); }

  reset() { this.deadline = undefined; }

  update(at: number, quiet: boolean, pool: readonly IdleCue[]): IdleCue | undefined {
    if (!quiet || !pool.length) {
      this.reset();
      return;
    }
    if (this.deadline === undefined) {
      const [min, max] = this.first ? this.firstGap : this.laterGap;
      this.deadline = at + (this.override ?? (min + this.next() * (max - min)));
      return;
    }
    if (at < this.deadline) return;
    this.deadline = undefined;
    this.first = false;
    const ids = new Set(pool.map(item => item.id));
    const excluded = pool.length >= 4 ? this.recent : [];
    this.bag = this.bag.filter(item => ids.has(item.id));
    const eligible = (items: readonly IdleCue[]) => items.filter(item => !excluded.includes(item.id));
    let available = eligible(this.bag);
    if (!available.length) {
      this.bag = [...pool];
      available = eligible(this.bag);
    }
    const choice = available[Math.floor(this.next() * available.length)];
    this.bag = this.bag.filter(item => item.id !== choice.id);
    this.recent.push(choice.id);
    if (this.recent.length > 3) this.recent.shift();
    return choice;
  }

  private next() {
    this.random = (Math.imul(1664525, this.random) + 1013904223) >>> 0;
    return this.random / 4294967296;
  }
}
