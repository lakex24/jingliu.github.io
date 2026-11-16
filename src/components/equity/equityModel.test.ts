// Arithmetic behind /startups/equity/ (equityModel.ts). Run: node --test src/components/equity/equityModel.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { A_PRICE, A_SHARES, POOL_SHARES, SEED_PRICE, SEED_SHARES, capTable, scenario, seedRound, vestedFraction, waterfall, capitalGainsTax, founderVestingWithout83b } from './equityModel.ts';

const near = (a: number, b: number, eps = 1) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('seed: $5M on $10M pre with a 10% post-money pool counted in the pre-money', () => {
  const total = 8_000_000 + SEED_SHARES + POOL_SHARES;
  near(SEED_SHARES / total, 1 / 3, 1e-6);
  near(POOL_SHARES / total, 0.10, 1e-6);
  near(SEED_PRICE, 1.0625, 1e-4);
  near(seedRound(true).founderValue, 8_500_000, 50); // the shuffle: founders' real pre-money
  near(seedRound(false).founderValue, 10_000_000, 1);
});

test('series A: $10M on $40M pre is 20% and $2.83 a share', () => {
  const total = capTable(3, true).reduce((s, r) => s + r.shares, 0);
  near(A_SHARES / total, 0.2, 1e-6);
  near(A_PRICE, 2.8333, 1e-3);
});

test('vesting: nothing before the cliff, a quarter at it, monthly after', () => {
  assert.equal(vestedFraction(0.99), 0);
  assert.equal(vestedFraction(1), 0.25);
  assert.equal(vestedFraction(2.5), 30 / 48);
  assert.equal(vestedFraction(9), 1);
});

test('waterfall: a $12M sale is below the $15M preference stack, common gets nothing', () => {
  const { payouts } = waterfall(capTable(3, true), 12_000_000);
  const by = Object.fromEntries(payouts.map((p) => [p.id, p.total]));
  near(by.seed, 4_000_000); near(by.seriesA, 8_000_000); near(by.aming, 0); near(by.wang, 0);
});

test('waterfall: at $50M everyone converts and the money adds up', () => {
  const { payouts, pps } = waterfall(capTable(5, false), 50_000_000);
  near(payouts.reduce((s, p) => s + p.total, 0), 50_000_000, 5);
  assert.ok(payouts.filter((p) => p.converted !== undefined).every((p) => p.converted));
  near(payouts.find((p) => p.id === 'wang')!.total, 100_000 * (pps - 0.30), 1);
});

test('waterfall: in between, the seed converts but series A takes its $10M back', () => {
  const { payouts } = waterfall(capTable(3, true), 30_000_000);
  const a = payouts.find((p) => p.id === 'seriesA')!; const s = payouts.find((p) => p.id === 'seed')!;
  assert.equal(a.converted, false); near(a.total, 10_000_000); assert.equal(s.converted, true);
  near(payouts.reduce((t, p) => t + p.total, 0), 30_000_000, 5);
});

test('taxes: QSBS tiers and the $15M cap', () => {
  near(capitalGainsTax(1_000_000, 5).federal, 0);
  near(capitalGainsTax(1_000_000, 3).federal, 500_000 * 0.318);
  near(capitalGainsTax(20_000_000, 6).federal, 5_000_000 * 0.238);
  near(capitalGainsTax(1_000_000, 2).federal, 238_000);
  near(capitalGainsTax(1_000_000, 0.5).federal, 408_000);
});

test('scenarios: shutdown losses and the early exercise paying off', () => {
  near(scenario(3, 12_000_000, true).people.find((p) => p.id === "wang")!.tax!.loss!, 30_000);
  const dead = scenario(3, 0, true);
  near(dead.people.find((p) => p.id === 'wang')!.tax!.loss!, 30_000);
  const early = scenario(5, 100_000_000, true).people.find((p) => p.id === 'wang')!;
  const late = scenario(5, 100_000_000, false).people.find((p) => p.id === 'wang')!;
  assert.ok(early.net! > late.net!);
  assert.equal(scenario(1.5, 100_000_000, false).people.find((p) => p.id === 'wang')!.vested, 0); // before his cliff
});

test('without an 83(b) the founder owes tax on paper value', () => {
  const rows = founderVestingWithout83b(4_800_000);
  near(rows[0].income, 1_200_000 * (0.30 - 0.0001), 1);
  assert.ok(rows.reduce((s, r) => s + r.tax, 0) > 1_000_000);
});
