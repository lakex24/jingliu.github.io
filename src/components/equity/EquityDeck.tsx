/**
 * Deck: 一家公司的股票 — one made-up startup from incorporation to an exit, to explain founder stock,
 * 83(b), a priced round and the option pool, 409A, an employee's options and early exercise, and what
 * everyone takes home (and owes) when the company is sold or shuts down. The numbers come from
 * ./equityModel.ts; the slides only show them.
 */
import { useMemo, useState, type ReactNode } from 'react';
import {
  A_PRICE, A_SHARES, FOUNDER_PRICE, OTHER_OPTIONS, POOL_SHARES, RATES, SEED_PRICE, SEED_SHARES, T, WANG,
  capTable, founderVestingWithout83b, scenario, seedRound, vestedFraction, type HolderId,
} from './equityModel';

export type Slide = { id: string; title: string; when?: string; render: (nav: (id: string) => void) => ReactNode };

// ---------- formatting and small parts ----------

const money = (n: number, signed = false): string => {
  const s = signed && n > 0 ? '+' : n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e4) return `${s}$${Math.round(a / 1e3).toLocaleString()}K`;
  return `${s}$${Math.round(a).toLocaleString()}`;
};
const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;
const shares = (n: number) => Math.round(n).toLocaleString();
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const price = (n: number) => (n < 0.01 ? `$${n}` : `$${n.toFixed(n < 10 ? 2 : 0)}`);
const yearLabel = (y: number) => (y < 1 ? `第 ${Math.round(y * 12)} 个月` : Number.isInteger(y) ? `第 ${y} 年` : `第 ${Math.floor(y)} 年半`);

const COLOR: Record<HolderId | 'pool', string> = {
  aming: 'var(--eq-aming)', beibei: 'var(--eq-beibei)', seed: 'var(--eq-seed)', seriesA: 'var(--eq-a)',
  others: 'var(--eq-pool)', pool: 'var(--eq-pool)', wang: 'var(--eq-wang)',
};

type Seg = { id: HolderId | 'pool'; label: string; value: number };
/** One stacked bar with a legend under it. */
function Stack({ segs, caption, showValue }: { segs: Seg[]; caption?: string; showValue?: (v: number) => string }) {
  const total = segs.reduce((s, x) => s + x.value, 0);
  return (
    <figure className="eq-stack">
      {caption && <figcaption>{caption}</figcaption>}
      <div className="eq-bar" role="img" aria-label={segs.map((s) => `${s.label} ${pct(s.value / (total || 1))}`).join('，')}>
        {total > 0 ? segs.filter((s) => s.value > 0).map((s) => (
          <span key={s.id} style={{ width: `${(s.value / total) * 100}%`, background: COLOR[s.id] }} title={`${s.label} ${pct(s.value / total)}`} />
        )) : <span className="eq-bar-empty">0</span>}
      </div>
      <div className="eq-legend">
        {segs.filter((s) => s.value > 0).map((s) => (
          <span key={s.id}><i style={{ background: COLOR[s.id] }} />{s.label} <b>{showValue ? showValue(s.value) : pct(s.value / total)}</b></span>
        ))}
      </div>
    </figure>
  );
}
const capSegs = (t: number): Seg[] => capTable(t, false).map((r) => ({ id: t < T.join && r.id === 'others' ? 'pool' : r.id, label: t < T.join && r.id === 'others' ? '期权池' : r.id === 'others' ? '期权池（员工）' : r.name, value: r.shares }));

function Toggle<V extends string>({ value, options, onChange, label }: { value: V; options: { id: V; label: string }[]; onChange: (v: V) => void; label: string }) {
  return (
    <div className="viewswitch eq-toggle" role="radiogroup" aria-label={label}>
      {options.map((o) => <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}
const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="eq-stat"><span className="muted">{label}</span><b>{value}</b>{sub && <span className="muted eq-stat-sub">{sub}</span>}</div>
);
const Note = ({ children, tone }: { children: ReactNode; tone?: 'warn' | 'good' }) => <p className={`eq-note${tone ? ` ${tone}` : ''}`}>{children}</p>;

// ---------- the timeline every slide shows ----------

const MILESTONES = [
  { slide: 'day0', when: '第 0 天', what: '成立公司' },
  { slide: 'seed', when: '第 6 个月', what: '种子轮' },
  { slide: 'wang', when: '第 9 个月', what: '小王加入' },
  { slide: 'seriesA', when: '第 2 年', what: 'A 轮' },
  { slide: 'exit', when: '第 ? 年', what: '退出' },
];
const MILESTONE_OF: Record<string, string> = { day0: 'day0', '83b': 'day0', seed: 'seed', '409a': 'seed', wang: 'wang', early: 'wang', seriesA: 'seriesA', exit: 'exit', shutdown: 'exit' };
export function TimelineStrip({ slideId, nav }: { slideId: string; nav: (id: string) => void }) {
  const at = MILESTONE_OF[slideId];
  if (!at) return null;
  const idx = MILESTONES.findIndex((m) => m.slide === at);
  return (
    <ol className="eq-strip" aria-label="时间线">
      {MILESTONES.map((m, i) => (
        <li key={m.slide} className={i === idx ? 'on' : i < idx ? 'past' : ''}>
          <button type="button" onClick={() => nav(m.slide)}><span className="eq-dot" /><span className="eq-when">{m.when}</span><span className="eq-what">{m.what}</span></button>
        </li>
      ))}
    </ol>
  );
}

// ---------- slides ----------

function Cover({ nav }: { nav: (id: string) => void }) {
  const cast = [
    { id: 'aming' as const, name: '阿明', role: '创始人 · CEO', line: '60%' },
    { id: 'beibei' as const, name: '贝贝', role: '创始人 · CTO', line: '40%' },
    { id: 'seed' as const, name: '种子轮基金', role: '第 6 个月', line: '投 $5M' },
    { id: 'seriesA' as const, name: 'A 轮基金', role: '第 2 年', line: '投 $10M' },
    { id: 'wang' as const, name: '小王', role: '第一个工程师', line: '10 万股期权' },
  ];
  return (
    <div className="eq-cover">
      <p className="eq-kicker">Startups · 讲解 01</p>
      <h1>一家公司的股票</h1>
      <p className="eq-lede">从创业第一天到被收购（或者倒闭），跟着一家虚构的硅谷公司走一遍：每一步谁拿了多少股、花了多少钱、最后每个人到手多少、交多少税。</p>
      <div className="eq-cast">
        {cast.map((c) => (
          <div key={c.id} className="eq-person"><i style={{ background: COLOR[c.id] }} /><b>{c.name}</b><span className="muted">{c.role}</span><span>{c.line}</span></div>
        ))}
      </div>
      <button type="button" className="primary eq-start" onClick={() => nav('timeline')}>开始 →</button>
      <p className="muted eq-fine">数字是编的，规则是真的（美国联邦 + 加州，2026 年）。为了讲清楚做了简化，不是法律或税务建议。键盘 ← → 翻页，手机左右滑。</p>
    </div>
  );
}

function Timeline({ nav }: { nav: (id: string) => void }) {
  const rows = [
    { id: 'day0', when: '第 0 天', what: '成立公司', line: '8,000,000 股：阿明 60%，贝贝 40%，每股 $0.0001。30 天内交 83(b)。' },
    { id: 'seed', when: '第 6 个月', what: '种子轮', line: '投前 $10M，融 $5M。先放一个 10% 的期权池。' },
    { id: '409a', when: '第 6 个月', what: '409A 估值', line: '普通股 $0.30 一股，投资人买的优先股 $1.06。' },
    { id: 'wang', when: '第 9 个月', what: '小王加入', line: '100,000 股期权，行权价 $0.30，4 年归属。要不要提前行权？' },
    { id: 'seriesA', when: '第 2 年', what: 'A 轮', line: '投前 $40M，融 $10M。所有人被稀释 20%，409A 涨到 $0.90。' },
    { id: 'exit', when: '第 ? 年', what: '被收购', line: '选一个年份和价格，看每个人拿多少、交多少税。' },
    { id: 'shutdown', when: '第 ? 年', what: '或者倒闭', line: '钱怎么分、亏的钱能不能抵税。' },
  ];
  return (
    <>
      <h2>整条时间线</h2>
      <ol className="eq-tl">
        {rows.map((r) => (
          <li key={r.id}><button type="button" onClick={() => nav(r.id)}>
            <span className="eq-tl-when">{r.when}</span><b>{r.what}</b><span className="eq-tl-line">{r.line}</span>
          </button></li>
        ))}
      </ol>
    </>
  );
}

function Day0() {
  return (
    <>
      <h2>第 0 天：成立公司</h2>
      <div className="eq-cols">
        <div>
          <ul className="eq-list">
            <li>在特拉华州注册一家 <b>C-corp</b>（风投基本只投这种），授权 10,000,000 股，先发 <b>8,000,000 股</b>给两位创始人，剩下的以后用。</li>
            <li>按公允价值买：每股 <b>$0.0001</b>。阿明 4,800,000 股付 <b>$480</b>，贝贝 3,200,000 股付 <b>$320</b>。这时公司就是一张白纸。</li>
            <li>创始人的股份也要 <b>vesting</b>：4 年，1 年 cliff。如果贝贝第 8 个月就走了，公司可以按 $0.0001 把她的股份买回来，不会留下一个拿着 40% 却不干活的股东。投资人也一定会要求这一条。</li>
            <li>所以创始人拿到的是<b>受限股票</b>（restricted stock）：股票已经在你名下，只是没归属的部分可能被回购。这一点决定了下一页的 83(b)。</li>
          </ul>
        </div>
        <div>
          <Stack segs={capSegs(0)} caption="第 0 天的股权" />
          <div className="eq-stats">
            <Stat label="总股数" value="8,000,000" />
            <Stat label="公司价值" value="$800" sub="8,000,000 × $0.0001" />
          </div>
        </div>
      </div>
    </>
  );
}

function EightyThreeB() {
  const [filed, setFiled] = useState<'yes' | 'no'>('no');
  const rows = useMemo(() => founderVestingWithout83b(4_800_000), []);
  const totalTax = rows.reduce((s, r) => s + r.tax, 0);
  return (
    <>
      <h2>83(b)：30 天内，决定一辈子的税</h2>
      <p className="eq-lede">受限股票默认<b>每归属一批，就按当时的价值算一次工资收入</b>交税。83(b) 让你选择：<b>拿到的那天</b>就按当天的价值交税，以后归属不再交。阿明当天的价值是 $0.0001 × 股数 − 他付的钱 = <b>$0</b>。</p>
      <Toggle label="83(b)" value={filed} onChange={setFiled} options={[{ id: 'no', label: '阿明没交 83(b)' }, { id: 'yes', label: '阿明 30 天内交了' }]} />
      {filed === 'no' ? (
        <>
          <table className="eq-table">
            <thead><tr><th>归属</th><th>股数</th><th>当时 409A</th><th>算作收入</th><th>要交的税</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year}><td>第 {r.year} 年</td><td>{shares(r.shares)}</td><td>{r.year === 1 ? '$0.30' : r.year === 2 ? '$0.30 → $0.90' : r.year === 3 ? '$0.90' : '$0.90 → $1.60'}</td><td>{money(r.income)}</td><td className="neg">{money(r.tax)}</td></tr>
              ))}
              <tr className="eq-sum"><td colSpan={3}>四年合计</td><td>{money(rows.reduce((s, r) => s + r.income, 0))}</td><td className="neg">{money(totalTax)}</td></tr>
            </tbody>
          </table>
          <Note tone="warn">四年里要为<b>纸面财富</b>交约 {money(totalTax)} 的税（按联邦 37% + 加州 12.3%），可手里的股票卖不掉，只能自己掏现金。资本利得和 QSBS 的持有期也要等每一批归属后才开始算。</Note>
        </>
      ) : (
        <>
          <table className="eq-table">
            <thead><tr><th>时间</th><th>发生什么</th><th>税</th></tr></thead>
            <tbody>
              <tr><td>第 0 天</td><td>按 $0.0001 买 4,800,000 股，当天价值也是 $0.0001，差价 0</td><td>$0</td></tr>
              <tr><td>第 1–4 年</td><td>每月归属，什么都不用报</td><td>$0</td></tr>
              <tr><td>卖出时</td><td>整个涨幅都是资本利得；持有期从第 0 天算，QSBS 也从第 0 天算</td><td>见「退出」</td></tr>
            </tbody>
          </table>
          <Note tone="good">一张纸、一个挂号信封，省下约 {money(totalTax)}。</Note>
        </>
      )}
      <p className="muted eq-fine">怎么交：签好的 83(b) 声明（可以用 IRS Form 15620）在拿到股票后 <b>30 天内</b>寄到 IRS，用挂号信留回执，复印一份给公司。错过了没有任何补救。</p>
    </>
  );
}

function Seed() {
  const [where, setWhere] = useState<'pre' | 'post'>('pre');
  const r = seedRound(where === 'pre');
  const segs: Seg[] = [
    { id: 'aming', label: '阿明', value: 4_800_000 }, { id: 'beibei', label: '贝贝', value: 3_200_000 },
    { id: 'pool', label: '期权池', value: r.pool }, { id: 'seed', label: '种子轮基金', value: r.investor },
  ];
  return (
    <>
      <h2>第 6 个月：种子轮，投前 $10M，融 $5M</h2>
      <p className="eq-lede">基金投 $5M，投前估值 $10M，投后 $15M，基金占 1/3。但条款里还有一句：<b>投后要有 10% 的期权池</b>，留着给以后的员工。这 10% 从谁那里出？</p>
      <Toggle label="期权池" value={where} onChange={setWhere} options={[{ id: 'pre', label: '算在投前（常见）' }, { id: 'post', label: '融资后再加' }]} />
      <div className="eq-cols">
        <div>
          <Stack segs={segs} caption="种子轮之后" />
          <div className="eq-stats">
            <Stat label="每股价格" value={price(r.price)} sub="优先股" />
            <Stat label="基金拿到" value={`${shares(r.investor)} 股`} />
            <Stat label="创始人股份实际估值" value={money(r.founderValue)} sub={where === 'pre' ? '名义投前 $10M' : ''} />
          </div>
        </div>
        <div>
          {where === 'pre' ? (
            <Note tone="warn">期权池算在投前（"option pool shuffle"）：池子是在基金进来之前建的，<b>只稀释创始人</b>。基金照样拿 33.3%，创始人从 100% 变成 56.7%。名义上投前 $10M，实际上创始人的 8,000,000 股只值 <b>$8.5M</b>。</Note>
          ) : (
            <Note>如果融资后再加期权池，基金也一起被稀释：基金 30%，创始人 60%，每股 $1.25。所以投资人几乎都会要求算在投前。能谈的是池子的大小：按未来 12–18 个月的招聘计划算，别多给。</Note>
          )}
          <ul className="eq-list">
            <li>基金买的是<b>优先股</b>（Series Seed Preferred）。最重要的一条是<b>1 倍、不参与分配的清算优先权</b>：卖公司时，基金可以先拿回 $5M，或者转成普通股按比例分，二选一取多的。</li>
            <li>创始人和员工手里的都是<b>普通股</b>。这个区别马上决定下一页的 409A。</li>
          </ul>
        </div>
      </div>
    </>
  );
}

function FourOhNineA() {
  return (
    <>
      <h2>409A：员工的行权价从哪来</h2>
      <div className="eq-cols">
        <div>
          <div className="eq-price-bars">
            <div><span className="muted">种子轮优先股</span><div className="eq-pbar" style={{ width: '100%', background: COLOR.seed }}><b>{price(SEED_PRICE)}</b></div></div>
            <div><span className="muted">普通股（409A）</span><div className="eq-pbar" style={{ width: `${(0.30 / SEED_PRICE) * 100}%`, background: COLOR.wang }}><b>$0.30</b></div></div>
          </div>
          <p className="muted eq-fine">普通股约是优先股价格的 28%。早期公司常见 20%–40%。</p>
        </div>
        <div>
          <ul className="eq-list">
            <li>发期权之前，公司请第三方评估<b>普通股</b>的公允价值，这就是 <b>409A 估值</b>。期权的行权价不能低于它；低了，员工要多交 20% 的罚税和利息，锅是公司的。</li>
            <li>为什么普通股便宜：没有清算优先权、没有投资人的保护条款、也卖不掉。</li>
            <li>有效期最长 12 个月，遇到下一轮融资这种大事就要重做。</li>
            <li>对员工：行权价越低越好。所以<b>赶在下一轮融资之前</b>把期权发出去，是公司能给早期员工的实在好处。</li>
          </ul>
        </div>
      </div>
    </>
  );
}

function Wang() {
  const [months, setMonths] = useState(14);
  const vf = vestedFraction(months / 12);
  const t = T.join + months / 12;
  const lastRound = t >= T.seriesA ? A_PRICE : SEED_PRICE;
  const paper = WANG.grant * vf * Math.max(0, lastRound - WANG.strike);
  const W = 520, H = 150, pad = 26;
  const x = (m: number) => pad + (m / 48) * (W - pad * 2);
  const y = (f: number) => H - pad - f * (H - pad * 2);
  const path = Array.from({ length: 49 }, (_, m) => `${m === 0 ? 'M' : 'L'}${x(m)},${y(vestedFraction(m / 12))}${m < 48 ? ` H${x(m + 1)}` : ''}`).join(' ');
  return (
    <>
      <h2>第 9 个月：小王加入</h2>
      <p className="eq-lede">第一个工程师小王拿到 <b>100,000 股 ISO 期权</b>，行权价 <b>$0.30</b>（当时的 409A），占公司 {pct(WANG.grant / (8_000_000 + SEED_SHARES + POOL_SHARES), 2)}。全部行权要 <b>$30,000</b>。4 年归属，1 年 cliff。</p>
      <div className="eq-cols">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="eq-chart" role="img" aria-label="归属曲线">
            <line x1={pad} y1={y(0)} x2={W - pad} y2={y(0)} className="eq-axis" />
            {[0, 12, 24, 36, 48].map((m) => <text key={m} x={x(m)} y={H - 6} className="eq-tick" textAnchor="middle">{m === 0 ? '入职' : `${m / 12} 年`}</text>)}
            <path d={path} className="eq-line" />
            <line x1={x(months)} y1={pad - 8} x2={x(months)} y2={y(0)} className="eq-now" />
            <circle cx={x(months)} cy={y(vf)} r="5" className="eq-now-dot" />
          </svg>
          <label className="eq-slider">
            <span>入职后第 <b>{months}</b> 个月</span>
            <input type="range" min={0} max={48} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
        </div>
        <div className="eq-stats eq-stats-col">
          <Stat label="已归属" value={`${shares(WANG.grant * vf)} 股`} sub={months < 12 ? '还没到 cliff' : `${pct(vf, 0)}`} />
          <Stat label="行权要付" value={dollars(WANG.grant * vf * WANG.strike)} sub="已归属部分 × $0.30" />
          <Stat label="纸面价值" value={money(paper)} sub={`按最近一轮优先股 ${price(lastRound)} 算，偏乐观`} />
        </div>
      </div>
      <ul className="eq-list">
        <li>第 12 个月一次归属 25,000 股，之后每月 2,083 股。</li>
        <li>离职后通常只有 <b>90 天</b>决定要不要行权，不行权就作废；ISO 离职超过 3 个月才行权，会变成 NSO。</li>
      </ul>
    </>
  );
}

function Early() {
  return (
    <>
      <h2>小王要不要现在就提前行权？</h2>
      <p className="eq-lede">公司允许 <b>early exercise</b>：还没归属，就先把 100,000 股全部买下来，拿到的是受限股票，然后 30 天内交 83(b)。</p>
      <div className="eq-cols eq-versus">
        <div className="eq-card">
          <h3>A. 现在提前行权 + 83(b)</h3>
          <ul className="eq-list">
            <li>现在付 <b>$30,000</b>。</li>
            <li>行权价 $0.30 = 当天 409A $0.30，差价 0：<b>今天交税 $0</b>，AMT 也是 0。</li>
            <li>资本利得的持有期、QSBS 的持有期，<b>从今天开始算</b>。</li>
            <li>离职：没归属的部分公司按 $0.30 买回，钱退给你。</li>
            <li className="neg">风险：公司倒了，$30,000 就没了，只能算资本损失。</li>
          </ul>
        </div>
        <div className="eq-card">
          <h3>B. 先不行权，等等看</h3>
          <ul className="eq-list">
            <li>现在付 <b>$0</b>，公司倒了也不亏钱。</li>
            <li>以后再行权：409A 涨到 $0.90，每股差价 $0.60。ISO 要算 <b>AMT</b>，NSO 直接按工资交税。</li>
            <li>一直等到被收购才套现：差价<b>全部算工资收入</b>，按最高税率交。</li>
            <li className="neg">离职时 90 天内要掏行权款（可能还有 AMT），掏不出来，期权就作废。</li>
          </ul>
        </div>
      </div>
      <Note>经验法则：公司越早期、行权总价越小、你越相信这家公司，提前行权越划算。到「退出」那一页，可以切换 A / B 看差多少。</Note>
    </>
  );
}

function SeriesA() {
  const vestedAtA = vestedFraction(T.seriesA - T.join) * WANG.grant;
  return (
    <>
      <h2>第 2 年：A 轮，投前 $40M，融 $10M</h2>
      <div className="eq-cols">
        <div>
          <Stack segs={capSegs(0)} caption="成立" />
          <Stack segs={capSegs(T.seed)} caption="种子轮后" />
          <Stack segs={capSegs(T.seriesA)} caption="A 轮后" />
        </div>
        <div>
          <div className="eq-stats">
            <Stat label="每股价格" value={price(A_PRICE)} sub={`新发 ${shares(A_SHARES)} 股`} />
            <Stat label="阿明的纸面价值" value={money(4_800_000 * A_PRICE)} sub={`4,800,000 股 × ${price(A_PRICE)}`} />
          </div>
          <ul className="eq-list">
            <li>新股稀释所有人 20%：股数不变，比例变小，每股更值钱。</li>
            <li><b>清算优先权叠起来了</b>：种子 $5M + A 轮 $10M = <b>$15M</b>。公司卖不到 $15M，普通股可能一分钱都没有。</li>
            <li>409A 涨到 <b>$0.90</b>，新员工的行权价就是 $0.90。</li>
            <li>小王如果现在才行权已归属的 {shares(vestedAtA)} 股：付 {dollars(vestedAtA * WANG.strike)}，每股差价 $0.60，共 {dollars(vestedAtA * 0.6)}。ISO 要算进 AMT，NSO 直接当工资交税。提前行权的话，这一步本来是 $0。</li>
          </ul>
        </div>
      </div>
    </>
  );
}

const EXITS = [0, 5e6, 12e6, 20e6, 30e6, 50e6, 100e6, 300e6, 1e9];
function Exit() {
  const [year, setYear] = useState(5);
  const [ei, setEi] = useState(5);
  const [early, setEarly] = useState<'early' | 'wait'>('early');
  const exit = EXITS[ei];
  const s = useMemo(() => scenario(year, exit, early === 'early'), [year, exit, early]);
  const other = useMemo(() => scenario(year, exit, early !== 'early').people.find((p) => p.id === 'wang')!, [year, exit, early]);
  const wang = s.people.find((p) => p.id === 'wang')!;
  const founder = s.people.find((p) => p.id === 'aming')!;
  const order: HolderId[] = ['aming', 'beibei', 'wang', 'others', 'seed', 'seriesA'];
  const people = order.map((id) => s.people.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const notes: { text: ReactNode; tone?: 'warn' | 'good' }[] = [];
  if (exit === 0) notes.push({ tone: 'warn', text: <>公司倒闭：剩下的钱先还债，然后是优先股，普通股通常是 0。详见下一页。</> });
  else if (exit <= s.totalPref) notes.push({ tone: 'warn', text: <>卖了 {money(exit)}，还不够付投资人的清算优先权（{money(s.totalPref)}）。投资人拿回本金，<b>创始人和员工一分钱也没有</b>。</> });
  else if (s.prefOut.length) notes.push({ text: <>{s.prefOut.map((p) => p.name).join('、')}选择不转换，直接拿回本金：按比例分反而更少。其余的钱由普通股（包括转换了的优先股）平分，每股 {price(s.pps)}。</> });
  else notes.push({ text: <>价格够高，所有优先股都转成普通股，按比例分：每股 {price(s.pps)}。</> });
  if (year < T.join + 1 && exit > 0) notes.push({ text: <>小王入职才 {Math.round((year - T.join) * 12)} 个月，还没到 cliff，一股都没归属。收购方一般会把他的期权换成自己的，继续算归属。</> });
  if (exit > s.totalPref && founder.unvested > 1) notes.push({ text: <>创始人才归属了 {pct(vestedFraction(year), 0)}，没归属的 {money(founder.unvested)} 通常换成收购方的股票，继续按时间归属：收购方用它把人留住。表里「现在到手」只算已归属的。</> });
  if (wang.net != null && other.net != null && wang.vested > 0) {
    const diff = wang.net - other.net;
    notes.push({ tone: diff >= 0 ? 'good' : 'warn', text: <>如果小王当初{early === 'early' ? '没有提前行权' : '提前行权了'}，税后会是 {money(other.net)}，{diff >= 0 ? '少' : '多'} {money(Math.abs(diff))}。</> });
  }
  return (
    <>
      <h2>退出：如果公司被收购</h2>
      <div className="eq-controls">
        <label className="eq-slider"><span>退出时间：<b>{yearLabel(year)}</b>{year < T.seriesA ? '（还没融 A 轮）' : ''}</span>
          <input type="range" min={1} max={8} step={0.5} value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <label className="eq-slider"><span>收购价：<b>{exit === 0 ? '倒闭' : money(exit)}</b></span>
          <input type="range" min={0} max={EXITS.length - 1} step={1} value={ei} onChange={(e) => setEi(Number(e.target.value))} /></label>
        <Toggle label="小王" value={early} onChange={setEarly} options={[{ id: 'early', label: '小王提前行权 + 83(b)' }, { id: 'wait', label: '小王没行权' }]} />
      </div>
      <Stack segs={people.map((p) => ({ id: p.id, label: p.name, value: p.total }))} caption={exit > 0 ? `${money(exit)} 怎么分` : undefined} showValue={(v) => money(v)} />
      <div className="eq-table-wrap">
        <table className="eq-table eq-results">
          <thead><tr><th>谁</th><th>占比</th><th>总共</th><th>现在到手</th><th>估算税</th><th>税后</th></tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className={p.id === 'wang' ? 'hl' : ''}>
                <td><i className="eq-sw" style={{ background: COLOR[p.id] }} />{p.name}</td>
                <td>{pct(p.pct)}</td>
                <td>{money(p.total)}</td>
                <td>{p.unvested > 1 ? <>{money(p.vested)}<span className="muted eq-small"> 未归属 {money(p.unvested)}</span></> : money(p.vested)}</td>
                <td>{p.tax ? (p.tax.loss ? <span className="muted">亏 {money(p.tax.loss)}</span> : money(p.tax.total)) : <span className="muted">—</span>}</td>
                <td>{p.net != null ? <b>{money(p.net)}</b> : <span className="muted">{p.id === 'others' ? '各人不同' : `投了 ${money(p.paid)}`}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="eq-why">
        {[['阿明', founder], ['小王', wang]].map(([n, p]) => {
          const q = p as typeof wang;
          if (!q.tax || !(q.vested > 0 || q.tax.loss)) return null;
          const t = q.tax;
          return (
            <p key={n as string}><b>{n as string}的税：</b>{t.loss
              ? <>亏了 {money(t.loss)}，算资本损失：先抵资本利得，再抵普通收入每年最多 $3,000。</>
              : <>{t.note}。联邦 {money(t.federal)}，加州 {money(t.state)}{t.qsbs > 1 ? `；QSBS 在联邦省下约 ${money(t.qsbs)}` : ''}。</>}</p>
          );
        })}
        {notes.map((n, i) => <Note key={i} tone={n.tone}>{n.text}</Note>)}
      </div>
      <p className="muted eq-fine">估算税率：联邦普通所得 {pct(RATES.fedOrdinary, 0)}，长期资本利得 20% + 3.8%，QSBS 没免掉的部分 28%；加州 {pct(RATES.ca, 1)}，而且加州不认 QSBS。简化：优先股 1 倍不参与分配、两轮平级；期权池全部发给了员工；没算 FICA、AMT 和交易费用。投资人和其他员工的税不在这里算。</p>
    </>
  );
}

function Shutdown() {
  const s = scenario(3, 0, true);
  const loss = s.people.find((p) => p.id === 'wang')!.tax!.loss!;
  return (
    <>
      <h2>如果公司倒闭</h2>
      <p className="eq-lede">大多数创业公司的结局。剩下的钱按顺序分：<b>欠的债和员工工资 → 优先股（投资人能拿回多少是多少）→ 普通股</b>。到普通股这里，通常已经是 0。</p>
      <table className="eq-table">
        <thead><tr><th>谁</th><th>亏了什么</th><th>税上怎么算</th></tr></thead>
        <tbody>
          <tr><td><i className="eq-sw" style={{ background: COLOR.aming }} />阿明、贝贝</td><td>$480 / $320，和几年的时间</td><td>资本损失（创业公司股票可以按 §1244 算普通损失，每年最多 $5 万，夫妻合报 $10 万）</td></tr>
          <tr><td><i className="eq-sw" style={{ background: COLOR.wang }} />小王（提前行权了）</td><td className="neg">{dollars(loss)}</td><td>资本损失：先抵当年的资本利得，再抵普通收入每年最多 $3,000，剩下的往后年份结转</td></tr>
          <tr><td><i className="eq-sw" style={{ background: COLOR.wang }} />小王（没行权）</td><td>什么钱都没花</td><td>期权作废，没有损失可以抵</td></tr>
          <tr><td><i className="eq-sw" style={{ background: COLOR.others }} />其他员工</td><td>同上，看有没有行权</td><td>—</td></tr>
          <tr><td><i className="eq-sw" style={{ background: COLOR.seed }} />两家基金</td><td className="neg">$15M</td><td>风投就是靠少数大成功，覆盖大多数失败</td></tr>
        </tbody>
      </table>
      <Note>所以提前行权的代价，是拿真金白银赌公司活下来。上一页切到「倒闭」可以对比。</Note>
    </>
  );
}

function Checklist() {
  return (
    <>
      <h2>清单</h2>
      <div className="eq-cols eq-versus">
        <div className="eq-card">
          <h3>创始人</h3>
          <ul className="eq-list eq-check">
            <li>第 0 天按极低的价格买股，带 vesting，<b>30 天内交 83(b)</b>。</li>
            <li>发期权之前先做 409A；每次融资关账后马上重做。</li>
            <li>期权池按招聘计划算，别在 shuffle 里多让。</li>
            <li>开放 early exercise，把离职行权窗口延长到几年。</li>
            <li>算清楚清算优先权：低价被收购时，你和员工能拿多少。</li>
          </ul>
        </div>
        <div className="eq-card">
          <h3>员工</h3>
          <ul className="eq-list eq-check">
            <li>问五个数：股数、完全稀释后的总股数、行权价、最近一轮价格、清算优先权总额。</li>
            <li>公司早期、行权价低：考虑提前行权 + 83(b)。</li>
            <li>记住离职后的 90 天。</li>
            <li>卖之前看持有期：ISO 要授予满 2 年、行权满 1 年；QSBS 3 / 4 / 5 年。</li>
            <li>金额大了，先找税务师。</li>
          </ul>
        </div>
      </div>
      <p className="muted eq-fine">本例数字：普通股 {shares(8_000_000)} 股 · 种子轮 {shares(SEED_SHARES)} 股 @ {price(SEED_PRICE)} · 期权池 {shares(POOL_SHARES)} 股（小王 {shares(WANG.grant)}，其他员工 {shares(OTHER_OPTIONS)}）· A 轮 {shares(A_SHARES)} 股 @ {price(A_PRICE)} · 创始人买入价 ${FOUNDER_PRICE}。</p>
    </>
  );
}

export const EQUITY_DECK: Slide[] = [
  { id: 'cover', title: '一家公司的股票', render: (nav) => <Cover nav={nav} /> },
  { id: 'timeline', title: '整条时间线', render: (nav) => <Timeline nav={nav} /> },
  { id: 'day0', title: '第 0 天：成立公司', render: () => <Day0 /> },
  { id: '83b', title: '83(b)', render: () => <EightyThreeB /> },
  { id: 'seed', title: '种子轮', render: () => <Seed /> },
  { id: '409a', title: '409A', render: () => <FourOhNineA /> },
  { id: 'wang', title: '小王加入', render: () => <Wang /> },
  { id: 'early', title: '提前行权？', render: () => <Early /> },
  { id: 'seriesA', title: 'A 轮', render: () => <SeriesA /> },
  { id: 'exit', title: '被收购', render: () => <Exit /> },
  { id: 'shutdown', title: '倒闭', render: () => <Shutdown /> },
  { id: 'checklist', title: '清单', render: () => <Checklist /> },
];
