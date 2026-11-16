/**
 * The numbers behind the "一家公司的股票" deck: one made-up Silicon Valley startup, from incorporation
 * to an exit. Pure functions, no React, so the arithmetic can be tested on its own
 * (equityModel.test.ts, run with `node --test`).
 *
 * Simplifications, on purpose (the deck says so too):
 * - Preferred stock is 1x non-participating and the two rounds are paid side by side (pari passu).
 * - The whole option pool is granted at the seed-era strike ($0.30); unvested shares and options at an
 *   exit are taken over by the buyer and keep vesting, so only vested value is "paid now".
 * - Taxes use flat top-bracket rates for a California resident. Real returns are progressive, have
 *   AMT, FICA, state residency rules and more. Investors' and the other employees' taxes are left out.
 */

/** Years from incorporation. */
export const T = { seed: 0.5, join: 0.75, seriesA: 2 } as const;

export const FOUNDER_PRICE = 0.0001;
export const FOUNDERS = [
  { id: 'aming', name: '阿明', shares: 4_800_000 },
  { id: 'beibei', name: '贝贝', shares: 3_200_000 },
] as const;
export const FOUNDER_SHARES = 8_000_000;

export const SEED = { pre: 10_000_000, raise: 5_000_000, poolPost: 0.10 };
export const SERIES_A = { pre: 40_000_000, raise: 10_000_000 };

/** Seed round with the pool counted in the pre-money (the "option pool shuffle"). */
export function seedRound(poolInPre = true) {
  const investorPct = SEED.raise / (SEED.pre + SEED.raise); // 1/3
  if (poolInPre) {
    const total = FOUNDER_SHARES / (1 - investorPct - SEED.poolPost);
    const pool = total * SEED.poolPost;
    const investor = total * investorPct;
    return { total, pool, investor, price: SEED.raise / investor, founderValue: FOUNDER_SHARES * (SEED.raise / investor) };
  }
  // Pool created after the round: it dilutes the investor as well.
  const price = SEED.pre / FOUNDER_SHARES;
  const investor = SEED.raise / price;
  const before = FOUNDER_SHARES + investor;
  const total = before / (1 - SEED.poolPost);
  return { total, pool: total - before, investor, price, founderValue: FOUNDER_SHARES * price };
}

const seed = seedRound(true);
export const SEED_SHARES = Math.round(seed.investor);
export const POOL_SHARES = Math.round(seed.pool);
export const SEED_PRICE = SEED.raise / SEED_SHARES;
export const SEED_TOTAL = FOUNDER_SHARES + SEED_SHARES + POOL_SHARES;
export const A_PRICE = SERIES_A.pre / SEED_TOTAL;
export const A_SHARES = Math.round(SERIES_A.raise / A_PRICE);

export const WANG = { grant: 100_000, strike: 0.30 };
export const OTHER_OPTIONS = POOL_SHARES - WANG.grant;

/** The common stock's 409A value over time (made up, but in the usual ratio to the preferred). */
export function fmv409a(t: number): number {
  if (t < T.seed) return FOUNDER_PRICE;
  if (t < T.seriesA) return 0.30;
  if (t < 3.5) return 0.90;
  return 1.60;
}

/** Share of a 4-year grant vested `years` after the vesting start: nothing before the 1-year cliff,
 *  then 1/48 a month. */
export function vestedFraction(years: number): number {
  if (years < 1) return 0;
  return Math.min(48, Math.floor(years * 12 + 1e-9)) / 48;
}

export type HolderId = 'aming' | 'beibei' | 'seed' | 'seriesA' | 'wang' | 'others';
export type Holding = { id: HolderId; name: string; shares: number; kind: 'common' | 'preferred' | 'option'; strike?: number; pref?: number; vestStart?: number };

/** Who owns what at time t (fully diluted, the pool fully granted). */
export function capTable(t: number, wangExercisedEarly: boolean): Holding[] {
  const rows: Holding[] = FOUNDERS.map((f) => ({ id: f.id, name: f.name, shares: f.shares, kind: 'common', vestStart: 0 }));
  if (t >= T.seed) {
    rows.push({ id: 'seed', name: '种子轮基金', shares: SEED_SHARES, kind: 'preferred', pref: SEED.raise });
    rows.push({ id: 'others', name: '其他员工', shares: OTHER_OPTIONS, kind: 'option', strike: WANG.strike });
  }
  if (t >= T.join) {
    rows.push(wangExercisedEarly
      ? { id: 'wang', name: '小王', shares: WANG.grant, kind: 'common', vestStart: T.join }
      : { id: 'wang', name: '小王', shares: WANG.grant, kind: 'option', strike: WANG.strike, vestStart: T.join });
  } else if (t >= T.seed) {
    // Before 小王 joins, his options are still unallocated pool.
    rows[rows.length - 1] = { ...rows[rows.length - 1], shares: POOL_SHARES };
  }
  if (t >= T.seriesA) rows.push({ id: 'seriesA', name: 'A 轮基金', shares: A_SHARES, kind: 'preferred', pref: SERIES_A.raise });
  return rows;
}

export type Payout = { id: HolderId; name: string; shares: number; pct: number; total: number; converted?: boolean };

/**
 * Split an exit price among the holders. Preferred takes the larger of its money back (1x) or what it
 * would get as common; options get (price per share − strike) when in the money.
 */
export function waterfall(rows: Holding[], exit: number): { payouts: Payout[]; pps: number } {
  const total = rows.reduce((s, r) => s + r.shares, 0);
  const prefs = rows.filter((r) => r.kind === 'preferred');
  const converting = new Set(prefs.map((r) => r.id));
  let pps = 0;
  let prefPaid = new Map<HolderId, number>();
  for (let guard = 0; guard < 10; guard++) {
    const fixed = prefs.filter((r) => !converting.has(r.id));
    const owed = fixed.reduce((s, r) => s + (r.pref ?? 0), 0);
    prefPaid = new Map(fixed.map((r) => [r.id, owed > 0 ? Math.min(exit, owed) * (r.pref ?? 0) / owed : 0]));
    const residual = Math.max(0, exit - owed);
    pps = commonPrice(rows.filter((r) => r.kind !== 'preferred' || converting.has(r.id)), residual);
    const drop = prefs.filter((r) => converting.has(r.id) && r.shares * pps < (r.pref ?? 0));
    if (!drop.length) break;
    for (const r of drop) converting.delete(r.id);
  }
  const payouts = rows.map((r): Payout => {
    const base = { id: r.id, name: r.name, shares: r.shares, pct: r.shares / total };
    if (r.kind === 'preferred') return converting.has(r.id) ? { ...base, total: r.shares * pps, converted: true } : { ...base, total: prefPaid.get(r.id) ?? 0, converted: false };
    if (r.kind === 'option') return { ...base, total: r.shares * Math.max(0, pps - (r.strike ?? 0)) };
    return { ...base, total: r.shares * pps };
  });
  return { payouts, pps };
}

/** Price per common share when `residual` is shared by common, converting preferred and options
 *  (an in-the-money option pays its strike in, so it takes pps − strike). */
function commonPrice(rows: Holding[], residual: number): number {
  const shares = rows.filter((r) => r.kind !== 'option').reduce((s, r) => s + r.shares, 0);
  const options = rows.filter((r) => r.kind === 'option').sort((a, b) => (a.strike ?? 0) - (b.strike ?? 0));
  let best = shares > 0 ? residual / shares : 0;
  let n = shares, strikes = 0;
  for (const o of options) {
    n += o.shares; strikes += o.shares * (o.strike ?? 0);
    const p = (residual + strikes) / n;
    if (p > (o.strike ?? 0)) best = p; else break;
  }
  return best;
}

// ---------- Taxes (illustrative, California resident, top brackets) ----------

export const RATES = { fedOrdinary: 0.37, fedLtcg: 0.20, niit: 0.038, qsbsRemainder: 0.28, ca: 0.123 };
export const QSBS_CAP = 15_000_000;

/** Federal QSBS exclusion for stock issued after 2025-07-04: 50% at 3 years, 75% at 4, 100% at 5. */
export const qsbsShare = (held: number) => (held >= 5 ? 1 : held >= 4 ? 0.75 : held >= 3 ? 0.5 : 0);

export type Tax = { federal: number; state: number; total: number; note: string; qsbs: number; loss?: number };

/** Tax on selling stock for a gain, held `held` years (from purchase or the 83(b) date). */
export function capitalGainsTax(gain: number, held: number): Tax {
  if (gain <= 0) return { federal: 0, state: 0, total: 0, qsbs: 0, note: gain < 0 ? '资本损失' : '没有收益', loss: -gain };
  const state = gain * RATES.ca;
  if (held < 1) {
    const federal = gain * (RATES.fedOrdinary + RATES.niit);
    return { federal, state, total: federal + state, qsbs: 0, note: '持有不满 1 年：短期资本利得，按普通所得税率' };
  }
  const share = qsbsShare(held);
  const eligible = Math.min(gain, QSBS_CAP);
  const excluded = eligible * share;
  const remainder = eligible - excluded; // §1202 gain not excluded: 28% rate
  const above = gain - eligible;
  const federal = share > 0
    ? remainder * (RATES.qsbsRemainder + RATES.niit) + above * (RATES.fedLtcg + RATES.niit)
    : gain * (RATES.fedLtcg + RATES.niit);
  const note = share === 1 ? `持有满 5 年：QSBS 联邦免税（上限 $15M）${above > 0 ? '，超出部分按长期资本利得' : ''}`
    : share > 0 ? `持有满 ${share === 0.75 ? 4 : 3} 年：QSBS 联邦免 ${share * 100}%，其余按 28%`
    : '持有满 1 年：长期资本利得（不到 3 年，QSBS 还没生效）';
  return { federal, state, total: federal + state, qsbs: excluded * (RATES.fedLtcg + RATES.niit), note };
}

/** Tax on cashing out options at the exit: the spread is wages. */
export function ordinaryTax(income: number): Tax {
  if (income <= 0) return { federal: 0, state: 0, total: 0, qsbs: 0, note: '期权在水下：行权价高于每股价格，拿不到钱' };
  const federal = income * RATES.fedOrdinary; const state = income * RATES.ca;
  return { federal, state, total: federal + state, qsbs: 0, note: '期权直接套现：差价全部算工资收入（普通所得税）' };
}

export type PersonResult = { id: HolderId; name: string; pct: number; total: number; vested: number; unvested: number; paid: number; tax: Tax | null; net: number | null };

/** The whole scenario: the exit `years` after incorporation for `exit` dollars (0 = the company shut down). */
export function scenario(years: number, exit: number, wangEarly: boolean) {
  const rows = capTable(years, wangEarly);
  const { payouts, pps } = waterfall(rows, exit);
  const people: PersonResult[] = payouts.map((p) => {
    const row = rows.find((r) => r.id === p.id)!;
    const vf = row.vestStart != null ? vestedFraction(years - row.vestStart) : 1;
    const vested = p.total * vf;
    let paid = 0, tax: Tax | null = null;
    // Stock bought for cash: worth less than it cost (a shutdown, or a sale below the preferences)
    // means the whole purchase is a loss, unvested shares included.
    const stockTax = (cost: number, held: number) => (p.total < cost ? capitalGainsTax(p.total - cost, held) : capitalGainsTax(vested - cost * vf, held));
    if (p.id === 'aming' || p.id === 'beibei') {
      paid = row.shares * FOUNDER_PRICE;
      tax = stockTax(paid, years);
    } else if (p.id === 'wang') {
      if (wangEarly) {
        paid = WANG.grant * WANG.strike;
        tax = stockTax(paid, years - T.join);
      } else {
        tax = ordinaryTax(vested);
      }
      if (vf === 0 && p.total > 0) tax = { ...tax, note: '还没满 1 年 cliff：一股都没归属，现在拿不到' };
    } else if (p.id === 'seed') paid = SEED.raise;
    else if (p.id === 'seriesA') paid = SERIES_A.raise;
    const net = tax ? vested - tax.total : null;
    return { id: p.id, name: p.name, pct: p.pct, total: p.total, vested, unvested: p.total - vested, paid, tax, net };
  });
  const prefOut = payouts.filter((p) => p.converted === false && p.total < (rows.find((r) => r.id === p.id)?.pref ?? 0) + 1);
  return { rows, pps, people, prefOut, totalPref: rows.reduce((s, r) => s + (r.pref ?? 0), 0) };
}

/** Without an 83(b): each month's vesting is income at that day's 409A value. */
export function founderVestingWithout83b(shares: number) {
  const years: { year: number; shares: number; income: number }[] = [];
  for (let y = 1; y <= 4; y++) years.push({ year: y, shares: 0, income: 0 });
  for (let m = 12; m <= 48; m++) {
    const n = m === 12 ? shares * 12 / 48 : shares / 48;
    const y = Math.min(4, Math.ceil(m / 12));
    years[y - 1].shares += n; years[y - 1].income += n * (fmv409a(m / 12) - FOUNDER_PRICE);
  }
  return years.map((r) => ({ ...r, tax: r.income * (RATES.fedOrdinary + RATES.ca) }));
}
