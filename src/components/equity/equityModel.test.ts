// Arithmetic behind /startups/equity/ (equityModel.ts). Run: node --test src/components/equity/equityModel.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { A_PRICE, A_SHARES, A_TOTAL, POOL_SHARES, SEED_PRICE, SEED_SHARES, SEED_TOTAL, capTable, scenario, vestedFraction, waterfall, capitalGainsTax, founderVestingWithout83b } from './equityModel.ts';

const near = (a: number, b: number, eps = 1) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('seed: $5M on $10M pre is $0.10 a share, a third of the company; the day-1 pool is 10% after', () => {
  near(SEED_PRICE, 0.10, 1e-9);
  assert.equal(SEED_SHARES, 50_000_000);
  near(SEED_SHARES / SEED_TOTAL, 1 / 3, 1e-9);
  near(POOL_SHARES / SEED_TOTAL, 0.10, 1e-9);
});

test('series A: $15M on $60M pre is $0.40 a share and 20%', () => {
  near(A_PRICE, 0.40, 1e-9);
  assert.equal(A_SHARES, 37_500_000);
  near(A_SHARES / A_TOTAL, 0.2, 1e-9);
  assert.equal(capTable(true).reduce((s, r) => s + r.shares, 0), A_TOTAL);
});

test('vesting: nothing before the cliff, a quarter at it, monthly after', () => {
  assert.equal(vestedFraction(0.99), 0);
  assert.equal(vestedFraction(1), 0.25);
  assert.equal(vestedFraction(2.5), 30 / 48);
  assert.equal(vestedFraction(9), 1);
});

test('waterfall: a $15M sale is below the $20M preference stack, common gets nothing', () => {
  const { payouts } = waterfall(capTable(true), 15_000_000);
  const by = Object.fromEntries(payouts.map((p) => [p.id, p.total]));
  near(by.seed, 3_750_000); near(by.seriesA, 11_250_000); near(by.aming, 0); near(by.wang, 0);
});

test('waterfall: at $100M everyone converts and the money adds up', () => {
  const { payouts, pps } = waterfall(capTable(false), 100_000_000);
  near(payouts.reduce((s, p) => s + p.total, 0), 100_000_000, 5);
  assert.ok(payouts.filter((p) => p.converted !== undefined).every((p) => p.converted));
  near(payouts.find((p) => p.id === 'wang')!.total, 1_000_000 * (pps - 0.03), 1);
});

test('waterfall: at $50M the seed converts but series A takes its $15M back', () => {
  const { payouts } = waterfall(capTable(true), 50_000_000);
  const a = payouts.find((p) => p.id === 'seriesA')!; const s = payouts.find((p) => p.id === 'seed')!;
  assert.equal(a.converted, false); near(a.total, 15_000_000); assert.equal(s.converted, true);
  near(payouts.reduce((t, p) => t + p.total, 0), 50_000_000, 5);
});

test('taxes: QSBS tiers and the $15M cap', () => {
  near(capitalGainsTax(1_000_000, 5).federal, 0);
  near(capitalGainsTax(1_000_000, 3).federal, 500_000 * 0.318);
  near(capitalGainsTax(20_000_000, 6).federal, 5_000_000 * 0.238);
  near(capitalGainsTax(1_000_000, 2).federal, 238_000);
  near(capitalGainsTax(1_000_000, 0.5).federal, 408_000);
});

test('scenarios: the shutdown costs the early exerciser $30K; at $100M early exercise pays off', () => {
  const dead = scenario(0, true).people.find((p) => p.id === 'wang')!;
  near(dead.tax!.loss!, 30_000); near(dead.net!, -30_000);
  const early = scenario(100_000_000, true).people.find((p) => p.id === 'wang')!;
  const late = scenario(100_000_000, false).people.find((p) => p.id === 'wang')!;
  assert.ok(early.net! > late.net!, `${early.net} vs ${late.net}`);
  const founder = scenario(100_000_000, true).people.find((p) => p.id === 'aming')!;
  near(founder.net!, founder.total - founder.tax!.total - 550, 1e-6);
});

test('without an 83(b) the founder owes tax on paper value', () => {
  const rows = founderVestingWithout83b(55_000_000);
  near(rows[0].income, 13_750_000 * (0.03 - 0.00001), 1);
  assert.ok(rows.reduce((s, r) => s + r.tax, 0) > 1_000_000);
});
