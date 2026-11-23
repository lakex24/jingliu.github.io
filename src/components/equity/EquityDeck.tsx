/**
 * Deck: 一家公司的股票 — one made-up startup from day 1 to an exit, told as a row of moments on a
 * timeline. Every slide is the same picture: the company drawn as a box, split by who owns it. Click a
 * piece of the box to read what it is. The numbers come from ./equityModel.ts; the slides only show them.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  A_PRICE, A_SHARES, A_TOTAL, DAY1_SHARES, FOUNDER_PRICE, OTHER_OPTIONS, POOL_SHARES, PREF_STACK, RATES, SEED,
  SEED_PRICE, SEED_SHARES, SEED_TOTAL, SERIES_A, T, WANG, founderVestingWithout83b, scenario, vestedFraction,
  type PersonResult,
} from './equityModel';

export type Slide = { id: string; when: string; short: string; title: string; render: () => ReactNode };

// ---------- formatting ----------

const money = (n: number): string => {
  const s = n < 0 ? '−' : '';
  const a = Math.abs(n);
  const trim = (x: string) => x.replace(/\.0$/, '');
  if (a >= 1e9) return `${s}$${trim((a / 1e9).toFixed(a >= 1e10 ? 0 : 1))}B`;
  if (a >= 1e6) return `${s}$${trim((a / 1e6).toFixed(a >= 1e8 ? 0 : 1))}M`;
  if (a >= 1e4) return `${s}$${Math.round(a / 1e3).toLocaleString()}K`;
  return `${s}$${Math.round(a).toLocaleString()}`;
};
const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;
/** Share counts the Chinese way: 1 亿, 5,500 万, 31.25 万. */
const gu = (n: number) => (n >= 1e8 ? `${(n / 1e8).toLocaleString(undefined, { maximumFractionDigits: 3 })} 亿股` : `${(n / 1e4).toLocaleString(undefined, { maximumFractionDigits: 2 })} 万股`);
const pct = (x: number, d = 1) => `${(x * 100).toFixed(x > 0 && x < 0.01 ? 2 : d).replace(/\.0+$/, '')}%`;
const price = (n: number) => (n < 0.01 ? `$${n}` : `$${n.toFixed(2)}`);

type CellId = 'aming' | 'beibei' | 'pool' | 'seed' | 'seriesA' | 'wang' | 'others';
const COLOR: Record<CellId, string> = {
  aming: 'var(--eq-aming)', beibei: 'var(--eq-beibei)', seed: 'var(--eq-seed)', seriesA: 'var(--eq-a)',
  pool: 'var(--eq-pool)', others: 'var(--eq-pool)', wang: 'var(--eq-wang)',
};

// ---------- the company box ----------

type Cell = { id: string; name: string; value: number; big: string; sub?: string; color?: string };
type Col = { id: string; cells: Cell[] };
const col = (c: Cell): Col => ({ id: c.id, cells: [c] });

/**
 * The company as a box: columns sized by value, a column may stack cells (the option pool, once 小王
 * takes his share of it). With `from` (id → value at the previous moment), the box starts as it was
 * and grows into the new split, so a funding round visibly dilutes everyone.
 */
function CompanyBox({ cols, from, selected, onSelect, label }: { cols: Col[]; from?: Record<string, number>; selected?: string | null; onSelect?: (id: string) => void; label: string }) {
  const [settled, setSettled] = useState(!from);
  useEffect(() => {
    if (settled) return;
    let b = 0; const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setSettled(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [settled]);
  const v = (c: Cell) => (settled ? c.value : from?.[c.id] ?? 0);
  const colValue = (k: Col) => k.cells.reduce((s, c) => s + v(c), 0);
  const total = cols.reduce((s, k) => s + colValue(k), 0) || 1;
  return (
    <div className="eq-box" role="group" aria-label={label}>
      {cols.map((k) => (
        <div key={k.id} className="eq-col" style={{ flexBasis: `${(colValue(k) / total) * 100}%` }}>
          {k.cells.map((c) => {
            const inner = (<span className="eq-cell-in"><b className="eq-cell-name">{c.name}</b><span className="eq-cell-big">{c.big}</span>{c.sub && <span className="eq-cell-sub">{c.sub}</span>}</span>);
            const style = { flexGrow: Math.max(v(c), 1e-9), background: c.color ?? COLOR[c.id as CellId] };
            const cls = `eq-cell${k.cells.length > 1 ? ' stacked' : ''}${selected === c.id ? ' on' : ''}${v(c) <= 0 ? ' empty' : ''}`;
            return onSelect
              ? <button key={c.id} type="button" className={cls} style={style} onClick={() => onSelect(c.id)} aria-pressed={selected === c.id} aria-label={`${c.name} ${c.big}`}>{inner}</button>
              : <div key={c.id} className={cls} style={style}>{inner}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

/** The box, a clickable legend (small pieces are hard to tap) and the explanation of the chosen piece. */
function Explorer({ cols, from, explain, initial = null, hint = '点一下方块，看它是什么' }: { cols: Col[]; from?: Record<string, number>; explain: Record<string, ReactNode>; initial?: string | null; hint?: string }) {
  const [sel, setSel] = useState<string | null>(initial);
  const cells = cols.flatMap((k) => k.cells);
  const chosen = cells.find((c) => c.id === sel);
  const pick = (id: string) => setSel((s) => (s === id ? null : id));
  return (
    <>
      <CompanyBox cols={cols} from={from} selected={sel} onSelect={pick} label="公司的股权，点一块看说明" />
      <div className="eq-legend">
        {cells.map((c) => (
          <button key={c.id} type="button" className={sel === c.id ? 'on' : ''} onClick={() => pick(c.id)}>
            <i style={{ background: COLOR[c.id as CellId] }} />{c.name} <b>{c.big}</b>
          </button>
        ))}
      </div>
      <div className={`eq-callout${chosen ? '' : ' hint'}`} aria-live="polite" style={chosen ? { borderLeftColor: COLOR[chosen.id as CellId] } : undefined}>
        {chosen ? <><h3>{chosen.name}</h3>{explain[chosen.id]}</> : <p>{hint}</p>}
      </div>
    </>
  );
}

const Facts = ({ items }: { items: [string, string][] }) => (
  <dl className="eq-facts">{items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
);
const Note = ({ children, tone }: { children: ReactNode; tone?: 'warn' | 'good' }) => <p className={`eq-note${tone ? ` ${tone}` : ''}`}>{children}</p>;
function Toggle<V extends string>({ value, options, onChange, label }: { value: V; options: { id: V; label: string }[]; onChange: (v: V) => void; label: string }) {
  return (
    <div className="viewswitch eq-toggle" role="radiogroup" aria-label={label}>
      {options.map((o) => <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}

// ---------- the cap table at each moment ----------

const ownCell = (id: CellId, name: string, shares: number, total: number): Cell => ({ id, name, value: shares, big: pct(shares / total), sub: gu(shares) });
const day1Cols = (): Col[] => [
  col(ownCell('aming', '阿明', 55_000_000, DAY1_SHARES)),
  col(ownCell('beibei', '贝贝', 30_000_000, DAY1_SHARES)),
  col(ownCell('pool', '期权池', POOL_SHARES, DAY1_SHARES)),
];
const seedCols = (): Col[] => [
  col(ownCell('aming', '阿明', 55_000_000, SEED_TOTAL)),
  col(ownCell('beibei', '贝贝', 30_000_000, SEED_TOTAL)),
  col(ownCell('pool', '期权池', POOL_SHARES, SEED_TOTAL)),
  col(ownCell('seed', '种子基金', SEED_SHARES, SEED_TOTAL)),
];
const poolCol = (total: number): Col => ({ id: 'poolcol', cells: [ownCell('wang', '小王', WANG.grant, total), ownCell('pool', '期权池', OTHER_OPTIONS, total)] });
const wangCols = (): Col[] => [seedCols()[0], seedCols()[1], poolCol(SEED_TOTAL), seedCols()[3]];
const aCols = (): Col[] => [
  col(ownCell('aming', '阿明', 55_000_000, A_TOTAL)),
  col(ownCell('beibei', '贝贝', 30_000_000, A_TOTAL)),
  poolCol(A_TOTAL),
  col(ownCell('seed', '种子基金', SEED_SHARES, A_TOTAL)),
  col(ownCell('seriesA', 'A 轮基金', A_SHARES, A_TOTAL)),
];
const valuesOf = (cols: Col[]) => Object.fromEntries(cols.flatMap((k) => k.cells.map((c) => [c.id, c.value])));

// ---------- slides ----------

function Day1() {
  return (
    <>
      <h2>第 1 天：两个人，1 亿股，一文不值</h2>
      <Facts items={[['总股数', '1 亿股'], ['每股', `$${FOUNDER_PRICE}`], ['整家公司', '$1,000']]} />
      <Explorer cols={day1Cols()} explain={{
        aming: <>
          <p>创始人，CEO。<b>5,500 万股</b>，每股 $0.00001，一共付了 <b>$550</b>。这时公司只是一张注册文件，股票确实一文不值。</p>
          <p>创始人的股份也要 <b>4 年归属（vesting），1 年 cliff</b>：如果第 8 个月就走了，公司可以按原价把股份买回来。投资人一定会要求这一条。</p>
          <p>拿到股票 <b>30 天之内</b>，还有一件事要做：83(b)，下一页。</p>
        </>,
        beibei: <>
          <p>创始人，CTO。<b>3,000 万股</b>，付 <b>$300</b>。规则和阿明一样：4 年归属，30 天内交 83(b)。</p>
        </>,
        pool: <>
          <p>为了方便，预留出<b>百分之十五</b>给早期员工的股票池：<b>1,500 万股</b>，现在还不属于任何人。</p>
          <p>以后招人时，从这里拿出一部分发给员工。员工拿到的是<b>期权</b>：按一个固定价格（行权价）买股票的权利。</p>
          <p>投资人进来时，一般要求投后留出约 10% 的期权池。第 1 天先留 15%，到种子轮正好是 10%。</p>
        </>,
      }} />
    </>
  );
}

function EightyThreeB() {
  const [filed, setFiled] = useState<'no' | 'yes'>('no');
  const rows = useMemo(() => founderVestingWithout83b(55_000_000), []);
  const totalTax = rows.reduce((s, r) => s + r.tax, 0);
  const fmv = (r: (typeof rows)[number]) => (r.low === r.high ? price(r.low) : `${price(r.low)} → ${price(r.high)}`);
  const cells: Cell[] = rows.map((r) => ({
    id: `y${r.year}`, name: `第 ${r.year} 年`, value: r.shares, color: `color-mix(in srgb, var(--eq-aming) ${100 - (r.year - 1) * 16}%, var(--paper))`,
    big: filed === 'no' ? `交税 ${money(r.tax)}` : '$0', sub: `归属 ${gu(r.shares)} · 409A ${fmv(r)}`,
  }));
  return (
    <>
      <h2>第 30 天：83(b)，一封信</h2>
      <p className="eq-lede">阿明的 5,500 万股要分 4 年归属。默认<b>每归属一批，就按当时的 409A 价格算一次收入</b>，交所得税。交了 83(b)，就改成<b>按今天的价格</b>算：今天每股 $0.00001，他也正好付了 $0.00001，差价 0，税是 0，以后归属也不再交。</p>
      <Toggle label="83(b)" value={filed} onChange={setFiled} options={[{ id: 'no', label: '没交 83(b)' }, { id: 'yes', label: '30 天内交了' }]} />
      <CompanyBox cols={cells.map(col)} label="阿明的股份，按归属的年份分" />
      {filed === 'no'
        ? <Note tone="warn">四年里要为<b>纸面财富</b>交约 <b>{money(totalTax)}</b> 的税（联邦 37% + 加州 12.3%）。股票卖不掉，只能自己掏现金。</Note>
        : <Note tone="good">一张纸、一个挂号信封，省下约 <b>{money(totalTax)}</b>。以后卖出时，整段涨幅都算资本利得，持有期从今天算。</Note>}
      <p className="muted eq-fine">怎么交：签好的 83(b) 声明（可以用 IRS Form 15620），拿到股票后 <b>30 天内</b>寄给 IRS，用挂号信留回执，复印一份给公司。错过了没有补救。</p>
    </>
  );
}

function Seed() {
  return (
    <>
      <h2>第 6 个月：种子轮，投前 $10M，融 $5M</h2>
      <Facts items={[['每股', `${price(SEED_PRICE)}`], ['新发', gu(SEED_SHARES)], ['总股数', gu(SEED_TOTAL)], ['投后估值', money(SEED.pre + SEED.raise)]]} />
      <Explorer cols={seedCols()} from={valuesOf(day1Cols())} initial="seed" explain={{
        seed: <>
          <p>基金投 <b>$5M</b>。投前估值 $10M ÷ 1 亿股 = 每股 <b>$0.10</b>，所以买到 <b>5,000 万股</b>，占投后的 1/3。</p>
          <p>它买的是<b>优先股</b>，最重要的一条是 <b>1 倍清算优先权</b>：公司被卖掉时，可以先拿回 $5M，或者转成普通股按比例分，二选一取多的。</p>
        </>,
        aming: <>
          <p>股数没变，还是 5,500 万股；比例从 55% 降到 <b>36.7%</b>。这就是<b>稀释</b>。</p>
          <p>但每股从 $0.00001 变成了 $0.10：按这一轮的价格，他的股份纸面上值 <b>$5.5M</b>。（创始人手里是普通股，实际没那么值钱，见下一页的 409A。）</p>
        </>,
        beibei: <><p>3,000 万股，从 30% 降到 <b>20%</b>，纸面上值 <b>$3M</b>。</p></>,
        pool: <>
          <p>1,500 万股，正好是投后的 <b>10%</b>。</p>
          <p>因为它在融资之前就留好了，算在投前估值里，<b>只稀释了创始人，没有稀释投资人</b>。投资人几乎都会这样要求（俗称 option pool shuffle）。创始人能谈的是池子的大小：按未来一两年的招聘计划算，别多留。</p>
        </>,
      }} />
    </>
  );
}

function Wang() {
  return (
    <>
      <h2>第 9 个月：第一个员工，小王</h2>
      <Facts items={[['期权', gu(WANG.grant)], ['行权价', price(WANG.strike)], ['全部行权', dollars(WANG.grant * WANG.strike)], ['归属', '4 年，1 年 cliff']]} />
      <Explorer cols={wangCols()} from={valuesOf(seedCols())} initial="wang" explain={{
        wang: <>
          <p>从期权池拿出 <b>100 万股期权</b>给小王，占公司 {pct(WANG.grant / SEED_TOTAL)}。行权价 <b>$0.03</b>，全部买下来要 $30,000。</p>
          <p><b>为什么是 $0.03，不是投资人的 $0.10？</b>发期权之前，公司请第三方给<b>普通股</b>估值，叫 <b>409A</b>。普通股没有清算优先权、也卖不掉，通常只值优先股的 20%–40%。行权价不能低于 409A。</p>
          <p><b>归属：</b>满 1 年一次拿到 25 万股，之后每个月 20,833 股，4 年拿完。离职后通常只有 90 天决定要不要行权。</p>
          <p><b>要不要现在就提前行权（early exercise）？</b>还没归属，就先把 100 万股全部买下来，30 天内交 83(b)：</p>
          <div className="eq-table-wrap">
            <table className="eq-table">
              <thead><tr><th /><th>现在提前行权 + 83(b)</th><th>先不行权</th></tr></thead>
              <tbody>
                <tr><td>现在掏钱</td><td>$30,000</td><td>$0</td></tr>
                <tr><td>现在交税</td><td>$0（行权价 = 409A，没有差价）</td><td>$0</td></tr>
                <tr><td>以后卖出</td><td>资本利得；持有满 5 年，QSBS 可能免联邦税</td><td>差价全部算工资收入</td></tr>
                <tr><td>公司倒闭</td><td className="neg">亏 $30,000</td><td>不亏</td></tr>
              </tbody>
            </table>
          </div>
          <p>最后差多少，到「第 5 年」那一页看。</p>
        </>,
        pool: <><p>还剩 <b>1,400 万股</b>，留给之后的员工。公司越往后，409A 越高，后来的人行权价也越高。</p></>,
        aming: <><p>5,500 万股，36.7%。给员工发期权，用的是早就留好的池子，不会再稀释创始人。</p></>,
        beibei: <><p>3,000 万股，20%。</p></>,
        seed: <><p>5,000 万股优先股，33.3%。</p></>,
      }} />
    </>
  );
}

function SeriesA() {
  const vestedAtA = vestedFraction(T.seriesA - T.join) * WANG.grant;
  return (
    <>
      <h2>第 2 年：A 轮，投前 $60M，融 $15M</h2>
      <Facts items={[['每股', price(A_PRICE)], ['新发', gu(A_SHARES)], ['总股数', gu(A_TOTAL)], ['投后估值', money(SERIES_A.pre + SERIES_A.raise)]]} />
      <Explorer cols={aCols()} from={valuesOf(wangCols())} initial="seriesA" explain={{
        seriesA: <>
          <p>A 轮基金投 <b>$15M</b>。投前 $60M ÷ 1.5 亿股 = 每股 <b>$0.40</b>，买到 <b>3,750 万股</b>，占 20%。所有人的比例都被稀释 20%。</p>
          <p>清算优先权叠起来了：种子 $5M + A 轮 $15M = <b>$20M</b>。公司如果卖不到 $20M，普通股可能一分钱都拿不到。</p>
        </>,
        aming: <><p>5,500 万股，现在是 <b>{pct(55_000_000 / A_TOTAL)}</b>。按 $0.40 算，纸面上值 <b>{money(55_000_000 * A_PRICE)}</b>。</p></>,
        beibei: <><p>3,000 万股，<b>{pct(30_000_000 / A_TOTAL)}</b>，纸面上值 <b>{money(30_000_000 * A_PRICE)}</b>。</p></>,
        wang: <>
          <p>100 万股，{pct(WANG.grant / A_TOTAL)}。按 $0.40 算，扣掉行权价，纸面上值 <b>{money(WANG.grant * (A_PRICE - WANG.strike))}</b>。</p>
          <p>409A 涨到了 <b>$0.12</b>。如果他当初没提前行权，现在才行权已归属的 {gu(vestedAtA)}，每股差价 $0.09，一共 {dollars(vestedAtA * 0.09)} 要算收入（ISO 算进 AMT）。提前行权的话，这一步是 $0。</p>
        </>,
        pool: <><p>1,400 万股，{pct(OTHER_OPTIONS / A_TOTAL)}。现在入职的员工，行权价是新的 409A：$0.12。</p></>,
        seed: <><p>5,000 万股，{pct(SEED_SHARES / A_TOTAL)}。按 $0.40 算，它投的 $5M 纸面上已经值 {money(SEED_SHARES * A_PRICE)}。</p></>,
      }} />
    </>
  );
}

const EXITS = [0, 5e6, 15e6, 30e6, 50e6, 100e6, 300e6, 1e9];

function Exit() {
  const [ei, setEi] = useState(5);
  const exit = EXITS[ei];
  const early = useMemo(() => scenario(exit, true), [exit]);
  const late = useMemo(() => scenario(exit, false), [exit]);
  const by = (id: string, s = early) => s.people.find((p) => p.id === id)!;
  const dead = exit === 0;
  const anyMoney = early.people.some((p) => p.total > 0);
  const cellOf = (id: CellId, name: string): Cell => {
    const p = by(id);
    return { id, name, value: anyMoney ? p.total : p.pct, big: money(p.total), sub: anyMoney ? pct(p.total / exit) : undefined };
  };
  const cols: Col[] = [
    col(cellOf('aming', '阿明')), col(cellOf('beibei', '贝贝')),
    { id: 'poolcol', cells: [cellOf('wang', '小王'), cellOf('others', '其他员工')] },
    col(cellOf('seed', '种子基金')), col(cellOf('seriesA', 'A 轮基金')),
  ];

  const prefOut = early.people.filter((p) => p.converted === false);
  const headline = dead ? <>公司倒闭：大多数创业公司的结局。剩下的钱先还债、发工资，再还投资人，到普通股这里通常是 0。</>
    : exit <= PREF_STACK ? <>卖 {money(exit)}，还不够付投资人的 {money(PREF_STACK)} 清算优先权：两家基金按投资额分走全部，<b>创始人和员工一分钱都没有</b>。</>
    : prefOut.length ? <>{prefOut.map((p) => p.name).join('、')}选择直接拿回本金（转成普通股反而更少）。剩下的钱按股数平分，每股 {price(early.pps)}。</>
    : <>价格够高，两家基金都转成普通股，所有人按股数平分：每股 <b>{price(early.pps)}</b>。</>;

  const founder = (p: PersonResult, sh: number) => (
    p.total <= 0 ? (
      <p>{dead ? '公司倒闭' : `卖 ${money(exit)} 不够付清算优先权`}，普通股 $0。当初的 {dollars(p.paid)} 没了；创业公司的股票亏损可以按 §1244 算普通损失抵税。真正亏掉的是几年时间。</p>
    ) : (<>
      <p>{gu(sh)} × 每股 {price(early.pps)} = <b>{money(p.total)}</b>。</p>
      <p>税：{p.tax!.note}。联邦 {money(p.tax!.federal)}，加州 {money(p.tax!.state)}（加州不认 QSBS）{p.tax!.qsbs > 1 ? `；QSBS 在联邦省下约 ${money(p.tax!.qsbs)}` : ''}。</p>
      <p>税后：<b>{money(p.net!)}</b>。</p>
    </>)
  );
  const fund = (id: 'seed' | 'seriesA') => {
    const p = by(id);
    return <p>投了 {money(p.paid)}。{p.total <= 0 ? '一分钱没拿回来。' : <>{p.converted ? '转成普通股，按股数分' : exit <= PREF_STACK ? '钱不够，两家基金按投资额比例分' : '不转换，按 1 倍清算优先权拿回本金'}：<b>{money(p.total)}</b>（{(p.total / p.paid).toFixed(1)} 倍）。</>}{dead ? '风投靠少数几家大成功，覆盖大多数失败。' : ''}</p>;
  };
  const w1 = by('wang'), w2 = by('wang', late);
  const wangRow = (label: string, f: (p: PersonResult) => ReactNode) => <tr><td>{label}</td><td>{f(w1)}</td><td>{f(w2)}</td></tr>;

  return (
    <>
      <h2>第 5 年：公司被收购，或者倒闭</h2>
      <label className="eq-slider">
        <span>收购价：<b>{dead ? '倒闭' : money(exit)}</b></span>
        <input type="range" min={0} max={EXITS.length - 1} step={1} value={ei} onChange={(e) => setEi(Number(e.target.value))} aria-valuetext={dead ? '倒闭' : money(exit)} />
      </label>
      <Note tone={exit <= PREF_STACK ? 'warn' : undefined}>{headline}</Note>
      <Explorer cols={cols} initial="wang" hint="点一下方块，看这个人拿多少、交多少税" explain={{
        aming: founder(by('aming'), 55_000_000),
        beibei: founder(by('beibei'), 30_000_000),
        wang: <>
          <p>他当初有两个选择，结果对比（第 9 个月入职，到现在都已归属）：</p>
          <div className="eq-table-wrap">
            <table className="eq-table">
              <thead><tr><th /><th>提前行权 + 83(b)</th><th>没行权</th></tr></thead>
              <tbody>
                {wangRow('卖出所得', (p) => money(p.total))}
                {wangRow('当初掏的钱', (p) => (p.paid ? money(p.paid) : '$0'))}
                {wangRow('税', (p) => (p.tax!.loss ? <span className="muted">亏损可抵税</span> : money(p.tax!.total)))}
                <tr className="eq-sum"><td>最后剩下</td><td className={w1.net! < 0 ? 'neg' : ''}>{money(w1.net!)}</td><td>{money(w2.net!)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="muted eq-small-p">{w1.total > 0 ? <>提前行权：{w1.tax!.note}。没行权：{w2.tax!.note}。</> : <>公司{dead ? '倒闭' : '卖的钱不够付清算优先权'}：提前行权的 $30,000 没了，只能算资本损失（每年最多抵 $3,000 普通收入，剩下的往后结转）；没行权的什么都没花。</>}</p>
        </>,
        others: <p>其余 1,400 万股期权分给了其他员工，每人数量不同。按每股 {price(early.pps)} 减去行权价 $0.03，差价合计 <b>{money(by('others').total)}</b>；没提前行权的，这笔钱算工资收入交税。</p>,
        seed: fund('seed'),
        seriesA: fund('seriesA'),
      }} />
      <p className="muted eq-fine">估算税率：联邦普通所得 {pct(RATES.fedOrdinary, 0)}，长期资本利得 20% + 3.8%，QSBS 没免掉的部分 28%；加州 {pct(RATES.ca)}，加州不认 QSBS。简化：优先股 1 倍、不参与分配、两轮平级；期权池全部按 $0.03 发给了员工；没算 FICA、AMT 和交易费用。</p>
    </>
  );
}

export const EQUITY_DECK: Slide[] = [
  { id: 'day1', when: '第 1 天', short: '成立', title: '第 1 天：成立公司', render: () => <Day1 /> },
  { id: '83b', when: '第 30 天', short: '83(b)', title: '第 30 天：83(b)', render: () => <EightyThreeB /> },
  { id: 'seed', when: '第 6 个月', short: '种子轮', title: '第 6 个月：种子轮', render: () => <Seed /> },
  { id: 'wang', when: '第 9 个月', short: '小王加入', title: '第 9 个月：第一个员工', render: () => <Wang /> },
  { id: 'seriesA', when: '第 2 年', short: 'A 轮', title: '第 2 年：A 轮', render: () => <SeriesA /> },
  { id: 'exit', when: '第 5 年', short: '退出', title: '第 5 年：收购或倒闭', render: () => <Exit /> },
];

/** The timeline across the top: one stop per slide. */
export function TimelineStrip({ slideId, nav }: { slideId: string; nav: (id: string) => void }) {
  const idx = EQUITY_DECK.findIndex((s) => s.id === slideId);
  return (
    <ol className="eq-strip" aria-label="时间线">
      {EQUITY_DECK.map((s, i) => (
        <li key={s.id} className={i === idx ? 'on' : i < idx ? 'past' : ''}>
          <button type="button" onClick={() => nav(s.id)} aria-current={i === idx ? 'step' : undefined}>
            <span className="eq-dot" /><span className="eq-when">{s.when}</span><span className="eq-what">{s.short}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
